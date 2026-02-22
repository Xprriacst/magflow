/* eslint-disable no-console */
import Stripe from 'stripe';
import { supabase } from '../utils/supabaseClient.js';
import { generateLicenseKey } from './keyGenerator.js';
import { sendLicenseEmail } from './emailService.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

let stripe = null;

if (!stripeSecret) {
  console.warn('[license-server] STRIPE_SECRET_KEY manquant. Les fonctionnalités Stripe sont désactivées.');
} else {
  stripe = new Stripe(stripeSecret, {
    apiVersion: '2024-06-20'
  });
}

function assertSupabaseConfigured() {
  if (!supabase) {
    throw new Error('Supabase non configuré');
  }
}

export async function createCheckoutSession(email, plan, metadata = {}) {
  if (!stripe) {
    throw new Error('Stripe non configuré');
  }

  if (!email || !plan) {
    throw new Error('Email et plan sont requis');
  }

  const prices = {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    annual: process.env.STRIPE_PRICE_ANNUAL,
    lifetime: process.env.STRIPE_PRICE_LIFETIME
  };

  const priceId = prices[plan];
  if (!priceId) {
    throw new Error(`Plan inconnu: ${plan}`);
  }

  const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`;

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: plan === 'lifetime' ? 'payment' : 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      plan,
      ...metadata
    }
  });

  return session;
}

export function constructStripeEvent(payload, signature) {
  if (!stripe) {
    throw new Error('Stripe non configuré');
  }
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET manquant');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await generateAndSendLicense(session.customer_email, session.metadata?.plan, {
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await deactivateLicense(subscription.id);
      break;
    }
    default:
      console.info('[license-server] Événement Stripe ignoré: %s', event.type);
  }
}

export async function generateAndSendLicense(email, plan, options = {}) {
  assertSupabaseConfigured();

  const { stripeCustomerId = null, stripeSubscriptionId = null, expiresAt = null } = options;
  const licenseKey = generateLicenseKey();

  const expirationDate =
    plan === 'lifetime'
      ? null
      : expiresAt ||
        new Date(
          Date.now() +
            (plan === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString();

  const { data, error } = await supabase
    .from('licenses')
    .insert({
      license_key: licenseKey,
      email,
      plan,
      status: 'pending',
      expires_at: expirationDate,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création license Stripe: ${error.message}`);
  }

  await sendLicenseEmail(email, licenseKey, {
    plan,
    expiresAt: expirationDate
  });

  return data;
}

export async function deactivateLicense(subscriptionId) {
  assertSupabaseConfigured();

  if (!subscriptionId) {
    throw new Error('Subscription id manquant');
  }

  const { data, error } = await supabase
    .from('licenses')
    .update({
      status: 'cancelled',
      expires_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)
    .select();

  if (error) {
    throw new Error(`Erreur mise à jour license: ${error.message}`);
  }

  if (data?.length) {
    const ids = data.map((row) => row.id);
    await supabase
      .from('license_activations')
      .update({
        deactivated_at: new Date().toISOString(),
        status: 'deactivated'
      })
      .in('license_id', ids)
      .is('deactivated_at', null);
  }

  return data;
}

export default {
  createCheckoutSession,
  constructStripeEvent,
  handleStripeWebhook,
  generateAndSendLicense,
  deactivateLicense
};
