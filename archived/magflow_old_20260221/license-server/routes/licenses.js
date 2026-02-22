import express from 'express';
import supabase from '../utils/supabaseClient.js';
import { generateLicenseKey, validateLicenseKeyFormat } from '../services/keyGenerator.js';
import { sendLicenseEmail } from '../services/emailService.js';

const router = express.Router();

const ALLOWED_PLANS = new Set(['monthly', 'annual', 'lifetime']);

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  if (!process.env.ADMIN_API_KEY) {
    return res.status(500).json({ error: 'ADMIN_API_KEY non configuré' });
  }

  if (!token || token !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Accès administrateur requis' });
  }

  return next();
}

function ensureSupabase(res) {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase non configuré' });
    return false;
  }
  return true;
}

router.post('/generate', requireAdmin, async (req, res) => {
  if (!ensureSupabase(res)) return;

  const { email, plan, expiresInDays, maxActivations = 1, metadata = {} } = req.body || {};

  if (!email || !plan) {
    return res.status(400).json({ error: 'Email et plan requis' });
  }

  if (!ALLOWED_PLANS.has(plan)) {
    return res.status(400).json({ error: 'Plan invalide' });
  }

  const licenseKey = generateLicenseKey();

  const expiresAt =
    plan === 'lifetime'
      ? null
      : new Date(
          Date.now() + (Number(expiresInDays) || 30) * 24 * 60 * 60 * 1000
        ).toISOString();

  const { data, error } = await supabase
    .from('licenses')
    .insert({
      license_key: licenseKey,
      email,
      plan,
      status: 'pending',
      expires_at: expiresAt,
      max_activations: Number(maxActivations) || 1,
      metadata
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  await sendLicenseEmail(email, licenseKey, { plan, expiresAt });

  return res.json({
    success: true,
    license: {
      key: licenseKey,
      email,
      plan,
      expires_at: expiresAt,
      max_activations: Number(maxActivations) || 1
    }
  });
});

router.get('/status/:licenseKey', async (req, res) => {
  if (!ensureSupabase(res)) return;

  const { licenseKey } = req.params;
  if (!validateLicenseKeyFormat(licenseKey)) {
    return res.status(400).json({ error: 'Format de clé invalide' });
  }

  const { data: license, error } = await supabase
    .from('licenses')
    .select(
      `
        *,
        activations:license_activations(
          hardware_id,
          activated_at,
          deactivated_at,
          device_info,
          status
        )
      `
    )
    .eq('license_key', licenseKey)
    .single();

  if (error) {
    return res.status(404).json({ error: 'License non trouvée' });
  }

  return res.json({
    license: {
      key: license.license_key,
      email: license.email,
      plan: license.plan,
      status: license.status,
      created_at: license.created_at,
      activated_at: license.activated_at,
      expires_at: license.expires_at,
      activations: (license.activations || []).filter((a) => !a.deactivated_at),
      max_activations: license.max_activations,
      current_activations: license.current_activations
    }
  });
});

export default router;
