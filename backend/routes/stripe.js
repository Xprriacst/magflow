/**
 * Stripe Payment & Subscription Routes
 * - Credit packages (one-shot)
 * - Recurring subscriptions (Pro monthly/annual)
 * - Billing portal + invoice history
 * - Webhook synchronization
 */

import express from 'express';
import Stripe from 'stripe';
import { verifyToken, logUserAction } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabaseClient.js';

const router = express.Router();

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FREE_MONTHLY_LIMIT = Number.parseInt(process.env.FREE_MONTHLY_LIMIT || '3', 10);

// Credit packages configuration
const CREDIT_PACKAGES = {
  credits_10: {
    id: 'credits_10',
    name: '10 Crédits',
    credits: 10,
    price: 990, // €9.90 in cents
    description: '10 pages de magazine'
  },
  credits_25: {
    id: 'credits_25',
    name: '25 Crédits',
    credits: 25,
    price: 1990, // €19.90 in cents
    description: '25 pages de magazine',
    popular: true
  },
  credits_50: {
    id: 'credits_50',
    name: '50 Crédits',
    credits: 50,
    price: 3490, // €34.90 in cents
    description: '50 pages de magazine'
  },
  credits_100: {
    id: 'credits_100',
    name: '100 Crédits',
    credits: 100,
    price: 5990, // €59.90 in cents
    description: '100 pages de magazine',
    bestValue: true
  }
};

const SUBSCRIPTION_PLANS = {
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Mensuel',
    priceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
    interval: 'month',
    priceCents: Number.parseInt(process.env.STRIPE_PRO_MONTHLY_AMOUNT_CENTS || '2900', 10),
    description: 'Générations illimitées, facturation mensuelle',
    recommended: true
  },
  pro_annual: {
    id: 'pro_annual',
    name: 'Pro Annuel',
    priceId: process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
    interval: 'year',
    priceCents: Number.parseInt(process.env.STRIPE_PRO_ANNUAL_AMOUNT_CENTS || '29000', 10),
    description: 'Générations illimitées, facturation annuelle',
    discountLabel: '2 mois offerts'
  }
};

function ensureStripeConfigured(res) {
  if (!stripe) {
    res.status(503).json({
      success: false,
      error: 'Payment system not configured'
    });
    return false;
  }
  return true;
}

function toIsoFromUnix(unixTimestamp, fallback = new Date()) {
  if (!unixTimestamp) {
    return fallback.toISOString();
  }
  return new Date(unixTimestamp * 1000).toISOString();
}

function normalizeSubscriptionStatus(status) {
  if (!status) return 'incomplete';

  if (['active', 'canceled', 'past_due', 'trialing', 'incomplete'].includes(status)) {
    return status;
  }

  if (status === 'incomplete_expired' || status === 'unpaid' || status === 'paused') {
    return 'past_due';
  }

  return 'incomplete';
}

function mapProfileSubscriptionStatus(stripeStatus) {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') {
    return 'active';
  }

  if (stripeStatus === 'past_due' || stripeStatus === 'incomplete' || stripeStatus === 'unpaid' || stripeStatus === 'paused') {
    return 'cancelled';
  }

  return 'expired';
}

function resolvePlanFromPriceId(priceId, fallbackPlan = 'pro_monthly') {
  if (!priceId) return fallbackPlan;

  const matched = Object.values(SUBSCRIPTION_PLANS).find((plan) => plan.priceId === priceId);
  return matched?.id || fallbackPlan;
}

function shouldDowngradeFromStatus(stripeStatus) {
  return stripeStatus === 'canceled' || stripeStatus === 'incomplete_expired';
}

function normalizeReturnPath(rawPath, fallbackPath = '/account') {
  if (!rawPath || typeof rawPath !== 'string') {
    return fallbackPath;
  }

  return rawPath.startsWith('/') ? rawPath : fallbackPath;
}

async function getOrCreateStripeCustomer(userId, userEmail, existingCustomerId = null) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: {
      magflow_user_id: userId
    }
  });

  if (supabaseAdmin) {
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);
  }

  return customer.id;
}

async function findUserIdByStripeReferences({ customerId, subscriptionId }) {
  if (!supabaseAdmin) return null;

  if (subscriptionId) {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    if (subscription?.user_id) {
      return subscription.user_id;
    }
  }

  if (customerId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (profile?.id) {
      return profile.id;
    }
  }

  return null;
}

async function upsertSubscriptionRecord(userId, stripeSubscription, preferredPlan = null) {
  if (!supabaseAdmin || !userId || !stripeSubscription?.id) {
    return null;
  }

  const firstItem = stripeSubscription.items?.data?.[0];
  const priceId = firstItem?.price?.id || firstItem?.plan?.id || 'unknown';
  const interval = firstItem?.price?.recurring?.interval || firstItem?.plan?.interval;

  let fallbackPlan = preferredPlan || 'pro_monthly';
  if (!preferredPlan && interval === 'year') {
    fallbackPlan = 'pro_annual';
  }

  const plan = resolvePlanFromPriceId(priceId, fallbackPlan);
  const status = normalizeSubscriptionStatus(stripeSubscription.status);

  const payload = {
    user_id: userId,
    stripe_subscription_id: stripeSubscription.id,
    stripe_customer_id: stripeSubscription.customer,
    stripe_price_id: priceId,
    plan,
    status,
    current_period_start: toIsoFromUnix(stripeSubscription.current_period_start),
    current_period_end: toIsoFromUnix(stripeSubscription.current_period_end),
    cancel_at_period_end: Boolean(stripeSubscription.cancel_at_period_end),
    canceled_at: stripeSubscription.canceled_at ? toIsoFromUnix(stripeSubscription.canceled_at) : null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(payload, { onConflict: 'stripe_subscription_id' });

  if (error) {
    console.error('[Stripe] Failed to upsert subscription record:', error);
  }

  return payload;
}

async function updateProfileFromSubscription(userId, stripeSubscription) {
  if (!supabaseAdmin || !userId || !stripeSubscription) {
    return;
  }

  const shouldDowngrade = shouldDowngradeFromStatus(stripeSubscription.status);
  const mappedProfileStatus = mapProfileSubscriptionStatus(stripeSubscription.status);

  const updatePayload = shouldDowngrade
    ? {
        subscription_tier: 'free',
        subscription_status: 'expired',
        monthly_limit: FREE_MONTHLY_LIMIT,
        stripe_subscription_id: null,
        stripe_customer_id: stripeSubscription.customer || null
      }
    : {
        subscription_tier: 'pro',
        subscription_status: mappedProfileStatus,
        monthly_limit: -1,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: stripeSubscription.customer || null
      };

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId);

  if (error) {
    console.error('[Stripe] Failed to update profile from subscription:', error);
  }
}

async function updateProfileAfterSubscriptionDeleted(userId, stripeSubscription) {
  if (!supabaseAdmin || !userId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: 'free',
      subscription_status: 'expired',
      monthly_limit: FREE_MONTHLY_LIMIT,
      stripe_subscription_id: null,
      stripe_customer_id: stripeSubscription?.customer || null
    })
    .eq('id', userId);

  if (error) {
    console.error('[Stripe] Failed to downgrade profile after subscription deletion:', error);
  }
}

async function hasCreditSessionAlreadyBeenProcessed(sessionId) {
  if (!supabaseAdmin || !sessionId) {
    return false;
  }

  const { data } = await supabaseAdmin
    .from('usage_logs')
    .select('id')
    .eq('action', 'upgrade')
    .contains('metadata', {
      type: 'credits_purchase',
      stripe_session_id: sessionId
    })
    .limit(1);

  return Array.isArray(data) && data.length > 0;
}

function mapSubscriptionForClient(stripeSubscription, localSubscription = null) {
  if (!stripeSubscription && !localSubscription) {
    return null;
  }

  const source = stripeSubscription || localSubscription;
  const status = stripeSubscription ? normalizeSubscriptionStatus(stripeSubscription.status) : localSubscription.status;

  const priceId = stripeSubscription
    ? (stripeSubscription.items?.data?.[0]?.price?.id || null)
    : localSubscription.stripe_price_id;

  const planId = stripeSubscription
    ? resolvePlanFromPriceId(
        priceId,
        localSubscription?.plan || (stripeSubscription.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'pro_annual' : 'pro_monthly')
      )
    : localSubscription.plan;

  const plan = SUBSCRIPTION_PLANS[planId] || null;

  return {
    id: localSubscription?.id || source.id || null,
    stripeSubscriptionId: stripeSubscription?.id || localSubscription?.stripe_subscription_id || null,
    plan: planId,
    planName: plan?.name || planId,
    status,
    cancelAtPeriodEnd: Boolean(source.cancel_at_period_end),
    currentPeriodStart: stripeSubscription
      ? toIsoFromUnix(source.current_period_start)
      : source.current_period_start,
    currentPeriodEnd: stripeSubscription
      ? toIsoFromUnix(source.current_period_end)
      : source.current_period_end,
    canceledAt: stripeSubscription
      ? (source.canceled_at ? toIsoFromUnix(source.canceled_at) : null)
      : source.canceled_at,
    interval: plan?.interval || null,
    priceId
  };
}

/**
 * GET /api/stripe/packages
 * Get available credit packages
 */
router.get('/packages', (req, res) => {
  const packages = Object.values(CREDIT_PACKAGES).map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    credits: pkg.credits,
    price: pkg.price / 100,
    pricePerCredit: (pkg.price / pkg.credits / 100).toFixed(2),
    description: pkg.description,
    popular: pkg.popular || false,
    bestValue: pkg.bestValue || false
  }));

  res.json({
    success: true,
    packages,
    currency: 'EUR'
  });
});

/**
 * GET /api/stripe/plans
 * Get available recurring plans
 */
router.get('/plans', (req, res) => {
  const plans = Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
    id: plan.id,
    name: plan.name,
    interval: plan.interval,
    price: plan.priceCents / 100,
    description: plan.description,
    recommended: plan.recommended || false,
    discountLabel: plan.discountLabel || null,
    available: Boolean(plan.priceId)
  }));

  res.json({
    success: true,
    plans,
    currency: 'EUR'
  });
});

/**
 * POST /api/stripe/create-checkout-session
 * Create a Stripe checkout session for purchasing credits
 */
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  if (!ensureStripeConfigured(res)) {
    return;
  }

  try {
    const { packageId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const creditPackage = CREDIT_PACKAGES[packageId];
    if (!creditPackage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid package selected'
      });
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(
      userId,
      userEmail,
      req.userProfile?.stripe_customer_id
    );

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: creditPackage.name,
              description: creditPackage.description,
              metadata: {
                package_id: packageId,
                credits: creditPackage.credits.toString()
              }
            },
            unit_amount: creditPackage.price
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        user_id: userId,
        package_id: packageId,
        credits: creditPackage.credits.toString(),
        purchase_type: 'credits'
      }
    });

    console.log(`[Stripe] Credit checkout session created for user ${userId}: ${session.id}`);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('[Stripe] Create credit checkout session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

/**
 * POST /api/stripe/create-subscription-session
 * Create Stripe checkout session for recurring Pro subscription
 */
router.post('/create-subscription-session', verifyToken, async (req, res) => {
  if (!ensureStripeConfigured(res)) {
    return;
  }

  try {
    const { planId = 'pro_monthly', returnPath = '/account' } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (req.userProfile?.subscription_tier === 'pro' && req.userProfile?.stripe_subscription_id) {
      return res.status(409).json({
        success: false,
        error: 'An active Pro subscription already exists. Use the billing portal to manage it.'
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[planId];
    if (!selectedPlan || !selectedPlan.priceId) {
      return res.status(400).json({
        success: false,
        error: 'Selected plan is not configured'
      });
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(
      userId,
      userEmail,
      req.userProfile?.stripe_customer_id
    );

    const normalizedReturnPath = normalizeReturnPath(returnPath, '/account');

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1
        }
      ],
      success_url: `${FRONTEND_URL}${normalizedReturnPath}?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing?subscription_canceled=true`,
      allow_promotion_codes: true,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        plan_id: selectedPlan.id,
        purchase_type: 'subscription'
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: selectedPlan.id
        }
      }
    });

    console.log(`[Stripe] Subscription checkout session created for user ${userId}: ${session.id}`);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('[Stripe] Create subscription session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription checkout session'
    });
  }
});

/**
 * POST /api/stripe/create-billing-portal-session
 * Create Stripe billing portal for managing an active subscription
 */
router.post('/create-billing-portal-session', verifyToken, async (req, res) => {
  if (!ensureStripeConfigured(res)) {
    return;
  }

  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { returnPath = '/account' } = req.body || {};

    const stripeCustomerId = await getOrCreateStripeCustomer(
      userId,
      userEmail,
      req.userProfile?.stripe_customer_id
    );

    const normalizedReturnPath = normalizeReturnPath(returnPath, '/account');

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${FRONTEND_URL}${normalizedReturnPath}`
    });

    res.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    console.error('[Stripe] Create billing portal session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create billing portal session'
    });
  }
});

/**
 * GET /api/stripe/subscription
 * Get current user subscription status (Stripe + local fallback)
 */
router.get('/subscription', verifyToken, async (req, res) => {
  if (!ensureStripeConfigured(res)) {
    return;
  }

  try {
    const userId = req.user.id;

    let localSubscription = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      localSubscription = data || null;
    }

    const stripeSubscriptionId = req.userProfile?.stripe_subscription_id || localSubscription?.stripe_subscription_id;

    if (!stripeSubscriptionId) {
      return res.json({
        success: true,
        subscription: null,
        profile: {
          subscriptionTier: req.userProfile?.subscription_tier || 'free',
          subscriptionStatus: req.userProfile?.subscription_status || 'active'
        }
      });
    }

    let stripeSubscription = null;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    } catch (error) {
      console.warn('[Stripe] Could not fetch live subscription, using local record:', error.message);
    }

    const subscription = mapSubscriptionForClient(stripeSubscription, localSubscription);

    res.json({
      success: true,
      subscription,
      profile: {
        subscriptionTier: req.userProfile?.subscription_tier || 'free',
        subscriptionStatus: req.userProfile?.subscription_status || 'active'
      }
    });
  } catch (error) {
    console.error('[Stripe] Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription details'
    });
  }
});

/**
 * GET /api/stripe/invoices
 * Get Stripe invoice history for current user
 */
router.get('/invoices', verifyToken, async (req, res) => {
  if (!ensureStripeConfigured(res)) {
    return;
  }

  try {
    const stripeCustomerId = req.userProfile?.stripe_customer_id;

    if (!stripeCustomerId) {
      return res.json({
        success: true,
        invoices: []
      });
    }

    const limitRaw = Number.parseInt(req.query.limit || '20', 10);
    const limit = Number.isNaN(limitRaw) ? 20 : Math.min(Math.max(limitRaw, 1), 100);

    const invoicesResponse = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit
    });

    const invoices = invoicesResponse.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amountDue: (invoice.amount_due || 0) / 100,
      amountPaid: (invoice.amount_paid || 0) / 100,
      currency: (invoice.currency || 'eur').toUpperCase(),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      createdAt: toIsoFromUnix(invoice.created),
      paidAt: invoice.status_transitions?.paid_at ? toIsoFromUnix(invoice.status_transitions.paid_at) : null,
      periodStart: invoice.period_start ? toIsoFromUnix(invoice.period_start) : null,
      periodEnd: invoice.period_end ? toIsoFromUnix(invoice.period_end) : null,
      subscriptionId: invoice.subscription || null
    }));

    res.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('[Stripe] List invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!ensureStripeConfigured(res)) {
    return;
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = JSON.parse(req.body.toString());
      console.warn('[Stripe] Webhook signature verification skipped (no secret configured)');
    }
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Stripe] Webhook processing error:', error);
    res.status(500).json({
      error: 'Webhook processing failed'
    });
  }
});

async function handleCheckoutSessionCompleted(session) {
  if (session.mode === 'subscription') {
    await handleSubscriptionCheckoutCompleted(session);
    return;
  }

  await handleSuccessfulPayment(session);
}

/**
 * Handle successful one-shot payment: add credits to user account
 */
async function handleSuccessfulPayment(session) {
  let userId = session.metadata?.user_id;
  const packageId = session.metadata?.package_id;
  const creditsToAdd = Number.parseInt(session.metadata?.credits || '0', 10);

  if (!userId && session.customer) {
    userId = await findUserIdByStripeReferences({ customerId: session.customer, subscriptionId: null });
  }

  if (!userId || !creditsToAdd) {
    console.error('[Stripe] Missing metadata in credit session:', session.id);
    return;
  }

  const alreadyProcessed = await hasCreditSessionAlreadyBeenProcessed(session.id);
  if (alreadyProcessed) {
    console.log(`[Stripe] Credit session already processed, skipping: ${session.id}`);
    return;
  }

  console.log(`[Stripe] Processing credit payment for user ${userId}: ${creditsToAdd} credits`);

  try {
    if (!supabaseAdmin) {
      return;
    }

    let newCredits = null;

    // Preferred: RPC helper if migration 002 has been applied
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('add_purchased_credits', {
      user_id: userId,
      credits_amount: creditsToAdd
    });

    if (!rpcError && typeof rpcResult === 'number') {
      newCredits = rpcResult;
    } else {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('credits_purchased')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[Stripe] Error fetching user profile for credit purchase:', profileError);
        return;
      }

      const currentCredits = profileData?.credits_purchased || 0;
      newCredits = currentCredits + creditsToAdd;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ credits_purchased: newCredits })
        .eq('id', userId);

      if (updateError) {
        console.error('[Stripe] Error updating credits balance:', updateError);
        return;
      }
    }

    await logUserAction(userId, 'upgrade', {
      type: 'credits_purchase',
      package_id: packageId,
      credits_added: creditsToAdd,
      stripe_session_id: session.id,
      amount_paid: (session.amount_total || 0) / 100,
      currency: (session.currency || 'eur').toUpperCase()
    });

    console.log(`[Stripe] Added ${creditsToAdd} credits to user ${userId}. New total purchased: ${newCredits}`);
  } catch (error) {
    console.error('[Stripe] Error handling credit purchase:', error);
  }
}

async function handleSubscriptionCheckoutCompleted(session) {
  if (!stripe) {
    return;
  }

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) {
    console.error('[Stripe] Subscription checkout completed without subscription ID:', session.id);
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  const fallbackUserId = await findUserIdByStripeReferences({
    customerId: session.customer,
    subscriptionId
  });

  const userId =
    session.metadata?.user_id ||
    session.client_reference_id ||
    stripeSubscription.metadata?.user_id ||
    fallbackUserId;

  if (!userId) {
    console.error('[Stripe] Could not resolve user for subscription checkout:', session.id);
    return;
  }

  const preferredPlan =
    session.metadata?.plan_id ||
    stripeSubscription.metadata?.plan_id ||
    'pro_monthly';

  await upsertSubscriptionRecord(userId, stripeSubscription, preferredPlan);
  await updateProfileFromSubscription(userId, stripeSubscription);

  await logUserAction(userId, 'upgrade', {
    type: 'subscription_started',
    stripe_session_id: session.id,
    stripe_subscription_id: stripeSubscription.id,
    plan: preferredPlan
  });

  console.log(`[Stripe] Subscription activated for user ${userId}: ${stripeSubscription.id}`);
}

async function handleSubscriptionUpdated(stripeSubscription) {
  const userId =
    stripeSubscription.metadata?.user_id ||
    await findUserIdByStripeReferences({
      customerId: stripeSubscription.customer,
      subscriptionId: stripeSubscription.id
    });

  if (!userId) {
    console.error('[Stripe] Subscription update without linked user:', stripeSubscription.id);
    return;
  }

  const preferredPlan = stripeSubscription.metadata?.plan_id || 'pro_monthly';

  await upsertSubscriptionRecord(userId, stripeSubscription, preferredPlan);
  await updateProfileFromSubscription(userId, stripeSubscription);

  console.log(`[Stripe] Subscription updated for user ${userId}: ${stripeSubscription.id} (${stripeSubscription.status})`);
}

async function handleSubscriptionDeleted(stripeSubscription) {
  const userId =
    stripeSubscription.metadata?.user_id ||
    await findUserIdByStripeReferences({
      customerId: stripeSubscription.customer,
      subscriptionId: stripeSubscription.id
    });

  if (!userId) {
    console.error('[Stripe] Subscription deletion without linked user:', stripeSubscription.id);
    return;
  }

  const canceledPayload = {
    ...stripeSubscription,
    status: 'canceled',
    canceled_at: stripeSubscription.canceled_at || Math.floor(Date.now() / 1000),
    cancel_at_period_end: false
  };

  await upsertSubscriptionRecord(userId, canceledPayload, stripeSubscription.metadata?.plan_id || 'pro_monthly');
  await updateProfileAfterSubscriptionDeleted(userId, stripeSubscription);

  await logUserAction(userId, 'downgrade', {
    type: 'subscription_deleted',
    stripe_subscription_id: stripeSubscription.id
  });

  console.log(`[Stripe] Subscription deleted and downgraded user ${userId}: ${stripeSubscription.id}`);
}

async function handleInvoicePaymentFailed(invoice) {
  if (!supabaseAdmin) {
    return;
  }

  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;

  const userId = await findUserIdByStripeReferences({
    customerId: invoice.customer,
    subscriptionId
  });

  if (!userId) {
    console.error('[Stripe] Invoice payment failed without linked user:', invoice.id);
    return;
  }

  if (subscriptionId) {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('[Stripe] Failed to mark subscription as past_due:', error);
    }
  }

  // Keep Pro access while Stripe retries, but surface a billing warning state.
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'cancelled'
    })
    .eq('id', userId)
    .eq('subscription_tier', 'pro');

  if (profileError) {
    console.error('[Stripe] Failed to mark profile billing warning:', profileError);
  }

  await logUserAction(userId, 'admin_action', {
    type: 'invoice_payment_failed',
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    amount_due: (invoice.amount_due || 0) / 100,
    currency: (invoice.currency || 'eur').toUpperCase()
  });

  console.log(`[Stripe] Invoice payment failed for user ${userId}: ${invoice.id}`);
}

/**
 * GET /api/stripe/verify-session/:sessionId
 * Verify a completed checkout session
 */
router.get('/verify-session/:sessionId', verifyToken, async (req, res) => {
  if (!ensureStripeConfigured(res)) {
    return;
  }

  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Session does not belong to this user'
      });
    }

    const response = {
      success: true,
      status: session.payment_status,
      mode: session.mode,
      amountPaid: (session.amount_total || 0) / 100
    };

    if (session.mode === 'subscription') {
      response.plan = session.metadata?.plan_id || null;
    } else {
      response.credits = Number.parseInt(session.metadata?.credits || '0', 10);
    }

    res.json(response);
  } catch (error) {
    console.error('[Stripe] Verify session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify session'
    });
  }
});

export default router;
