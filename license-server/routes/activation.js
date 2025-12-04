import express from 'express';
import supabase from '../utils/supabaseClient.js';
import { validateHardwareId, compareHardwareIds } from '../services/hardwareValidator.js';

const router = express.Router();

function ensureSupabase(res) {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase non configuré' });
    return false;
  }
  return true;
}

async function logValidation({ licenseId, success, errorMessage, hardwareId, ipAddress }) {
  if (!supabase || !licenseId) return;

  await supabase.from('license_validations').insert({
    license_id: licenseId,
    success,
    error_message: errorMessage,
    hardware_id: hardwareId,
    ip_address: ipAddress
  });
}

router.post('/activate', async (req, res) => {
  if (!ensureSupabase(res)) return;

  const { license_key: licenseKey, hardware_id: hardwareId, device_info: deviceInfo = {} } =
    req.body || {};

  if (!licenseKey || !hardwareId) {
    return res.status(400).json({
      success: false,
      error: 'License key et hardware ID requis'
    });
  }

  if (!validateHardwareId(hardwareId)) {
    return res.status(400).json({
      success: false,
      error: 'Hardware ID invalide'
    });
  }

  const { data: license, error: fetchError } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', licenseKey)
    .single();

  if (fetchError || !license) {
    return res.status(404).json({
      success: false,
      error: 'License non trouvée'
    });
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    await supabase
      .from('licenses')
      .update({ status: 'expired' })
      .eq('id', license.id);

    return res.status(403).json({
      success: false,
      error: 'License expirée'
    });
  }

  if (license.status === 'suspended' || license.status === 'cancelled') {
    return res.status(403).json({
      success: false,
      error: `License ${license.status}`
    });
  }

  const { data: existingActive } = await supabase
    .from('license_activations')
    .select('*')
    .eq('license_id', license.id)
    .eq('hardware_id', hardwareId)
    .is('deactivated_at', null)
    .maybeSingle();

  const hasCapacity =
    (license.current_activations || 0) < (license.max_activations || 1) || existingActive;

  if (!hasCapacity) {
    return res.status(403).json({
      success: false,
      error: "Nombre maximum d'activations atteint"
    });
  }

  if (!existingActive) {
    const { error: activationError } = await supabase.from('license_activations').insert({
      license_id: license.id,
      hardware_id: hardwareId,
      device_info: deviceInfo || {}
    });

    if (activationError) {
      return res.status(500).json({
        success: false,
        error: activationError.message
      });
    }
  }

  const currentActivations = existingActive
    ? license.current_activations
    : (license.current_activations || 0) + 1;

  await supabase
    .from('licenses')
    .update({
      hardware_id: hardwareId,
      status: 'active',
      activated_at: license.activated_at || new Date().toISOString(),
      current_activations: currentActivations
    })
    .eq('id', license.id);

  return res.json({
    success: true,
    message: 'License activée avec succès',
    license: {
      plan: license.plan,
      expires_at: license.expires_at,
      activated_at: license.activated_at || new Date().toISOString(),
      current_activations: currentActivations,
      max_activations: license.max_activations
    }
  });
});

router.post('/validate', async (req, res) => {
  if (!ensureSupabase(res)) return;

  const { license_key: licenseKey, hardware_id: hardwareId } = req.body || {};

  if (!licenseKey || !hardwareId) {
    return res.status(400).json({
      valid: false,
      error: 'License key et hardware ID requis'
    });
  }

  if (!validateHardwareId(hardwareId)) {
    return res.status(400).json({
      valid: false,
      error: 'Hardware ID invalide'
    });
  }

  const { data: license } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', licenseKey)
    .single();

  if (!license) {
    await logValidation({
      licenseId: null,
      success: false,
      errorMessage: 'License non trouvée'
    });
    return res.json({ valid: false, error: 'License invalide' });
  }

  if (license.hardware_id && !compareHardwareIds(license.hardware_id, hardwareId)) {
    await logValidation({
      licenseId: license.id,
      success: false,
      errorMessage: 'Hardware ID mismatch',
      hardwareId,
      ipAddress: req.ip
    });
    return res.json({ valid: false, error: 'License liée à une autre machine' });
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    await supabase.from('licenses').update({ status: 'expired' }).eq('id', license.id);
    await logValidation({
      licenseId: license.id,
      success: false,
      errorMessage: 'License expirée',
      hardwareId,
      ipAddress: req.ip
    });
    return res.json({ valid: false, error: 'License expirée' });
  }

  if (license.status !== 'active') {
    await logValidation({
      licenseId: license.id,
      success: false,
      errorMessage: `Statut: ${license.status}`,
      hardwareId,
      ipAddress: req.ip
    });
    return res.json({ valid: false, error: `License ${license.status}` });
  }

  await supabase
    .from('licenses')
    .update({ last_validated_at: new Date().toISOString(), hardware_id: hardwareId })
    .eq('id', license.id);

  await logValidation({
    licenseId: license.id,
    success: true,
    hardwareId,
    ipAddress: req.ip
  });

  return res.json({
    valid: true,
    license: {
      plan: license.plan,
      expires_at: license.expires_at,
      email: license.email
    }
  });
});

router.post('/deactivate', async (req, res) => {
  if (!ensureSupabase(res)) return;

  const { license_key: licenseKey, hardware_id: hardwareId } = req.body || {};

  if (!licenseKey || !hardwareId) {
    return res.status(400).json({
      success: false,
      error: 'License key et hardware ID requis'
    });
  }

  const { data: license } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', licenseKey)
    .single();

  if (!license) {
    return res.status(404).json({
      success: false,
      error: 'License non trouvée'
    });
  }

  const { error: updateError } = await supabase
    .from('license_activations')
    .update({
      deactivated_at: new Date().toISOString(),
      status: 'deactivated'
    })
    .eq('license_id', license.id)
    .eq('hardware_id', hardwareId)
    .is('deactivated_at', null);

  if (updateError) {
    return res.status(500).json({
      success: false,
      error: updateError.message
    });
  }

  const newCount = Math.max(0, (license.current_activations || 0) - 1);

  await supabase
    .from('licenses')
    .update({
      current_activations: newCount,
      hardware_id: compareHardwareIds(license.hardware_id, hardwareId) ? null : license.hardware_id,
      status: newCount === 0 ? 'pending' : license.status
    })
    .eq('id', license.id);

  return res.json({
    success: true,
    message: "License désactivée, vous pouvez l'activer sur une nouvelle machine"
  });
});

export default router;
