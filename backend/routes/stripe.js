/**
 * Stripe Payment Routes
 * Gestion des paiements pour l'achat de crédits
 */

import express from 'express';
import Stripe from 'stripe';
import { verifyToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabaseClient.js';

const router = express.Router();

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Credit packages configuration
const CREDIT_PACKAGES = {
  'credits_10': {
    id: 'credits_10',
    name: '10 Crédits',
    credits: 10,
    price: 990, // €9.90 in cents
    description: '10 pages de magazine'
  },
  'credits_25': {
    id: 'credits_25',
    name: '25 Crédits',
    credits: 25,
    price: 1990, // €19.90 in cents
    description: '25 pages de magazine',
    popular: true
  },
  'credits_50': {
    id: 'credits_50',
    name: '50 Crédits',
    credits: 50,
    price: 3490, // €34.90 in cents
    description: '50 pages de magazine'
  },
  'credits_100': {
    id: 'credits_100',
    name: '100 Crédits',
    credits: 100,
    price: 5990, // €59.90 in cents
    description: '100 pages de magazine',
    bestValue: true
  }
};

/**
 * GET /api/stripe/packages
 * Get available credit packages
 */
router.get('/packages', (req, res) => {
  const packages = Object.values(CREDIT_PACKAGES).map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    credits: pkg.credits,
    price: pkg.price / 100, // Convert to euros
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
 * POST /api/stripe/create-checkout-session
 * Create a Stripe checkout session for purchasing credits
 */
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      success: false,
      error: 'Payment system not configured'
    });
  }

  try {
    const { packageId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Validate package
    const creditPackage = CREDIT_PACKAGES[packageId];
    if (!creditPackage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid package selected'
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId = req.userProfile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          magflow_user_id: userId
        }
      });
      stripeCustomerId = customer.id;

      // Save customer ID to profile
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', userId);
      }
    }

    // Create checkout session
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
            unit_amount: creditPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing?canceled=true`,
      metadata: {
        user_id: userId,
        package_id: packageId,
        credits: creditPackage.credits.toString()
      }
    });

    console.log(`[Stripe] Checkout session created for user ${userId}: ${session.id}`);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('[Stripe] Create checkout session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhooks (payment confirmation, etc.)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development without webhook signature verification
      event = JSON.parse(req.body.toString());
      console.warn('[Stripe] Webhook signature verification skipped (no secret configured)');
    }
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await handleSuccessfulPayment(session);
      break;
    }

    case 'payment_intent.succeeded': {
      console.log('[Stripe] Payment succeeded:', event.data.object.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      console.log('[Stripe] Payment failed:', event.data.object.id);
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Handle successful payment: add credits to user account
 */
async function handleSuccessfulPayment(session) {
  const userId = session.metadata?.user_id;
  const packageId = session.metadata?.package_id;
  const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);

  if (!userId || !creditsToAdd) {
    console.error('[Stripe] Missing metadata in session:', session.id);
    return;
  }

  console.log(`[Stripe] Processing payment for user ${userId}: ${creditsToAdd} credits`);

  try {
    // Add credits to user profile
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('credits_purchased')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Stripe] Error fetching user profile:', error);
        return;
      }

      const currentCredits = data?.credits_purchased || 0;
      const newCredits = currentCredits + creditsToAdd;

      await supabaseAdmin
        .from('profiles')
        .update({ credits_purchased: newCredits })
        .eq('id', userId);

      // Log the purchase
      await supabaseAdmin
        .from('usage_logs')
        .insert({
          user_id: userId,
          action: 'upgrade',
          metadata: {
            type: 'credits_purchase',
            package_id: packageId,
            credits_added: creditsToAdd,
            stripe_session_id: session.id,
            amount_paid: session.amount_total / 100
          }
        });

      console.log(`[Stripe] Added ${creditsToAdd} credits to user ${userId}. New total: ${newCredits}`);
    }
  } catch (error) {
    console.error('[Stripe] Error adding credits:', error);
  }
}

/**
 * GET /api/stripe/verify-session/:sessionId
 * Verify a completed checkout session
 */
router.get('/verify-session/:sessionId', verifyToken, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      success: false,
      error: 'Payment system not configured'
    });
  }

  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify this session belongs to the user
    if (session.metadata?.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Session does not belong to this user'
      });
    }

    res.json({
      success: true,
      status: session.payment_status,
      credits: parseInt(session.metadata?.credits || '0', 10),
      amountPaid: session.amount_total / 100
    });

  } catch (error) {
    console.error('[Stripe] Verify session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify session'
    });
  }
});

export default router;
