import crypto from 'crypto';

export function generateHardwareId(deviceInfo) {
  const { uuid = '', cpu = '', mac = '' } = deviceInfo || {};
  const fingerprint = `${uuid}-${cpu}-${mac}`.trim();
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

export function validateHardwareId(hardwareId) {
  const pattern = /^[0-9a-f]{64}$/;
  return pattern.test((hardwareId || '').toLowerCase());
}

export function compareHardwareIds(id1, id2) {
  if (!id1 || !id2) return false;
  return id1.toLowerCase() === id2.toLowerCase();
}

export default {
  generateHardwareId,
  validateHardwareId,
  compareHardwareIds
};
