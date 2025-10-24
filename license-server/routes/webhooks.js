import express from 'express';
import { constructStripeEvent, handleStripeWebhook } from '../services/stripeService.js';

const router = express.Router();

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        return res.status(400).json({ error: 'Signature Stripe manquante' });
      }

      const event = constructStripeEvent(req.body, signature);
      await handleStripeWebhook(event);

      return res.json({ received: true });
    } catch (error) {
      console.error('[license-server] Webhook Stripe erreur:', error);
      return res.status(400).json({ error: error.message });
    }
  }
);

export default router;
