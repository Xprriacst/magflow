import crypto from 'crypto';

const PREFIX = 'MGFL';

export function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 4; i += 1) {
    const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
    segments.push(segment);
  }
  return `${PREFIX}-${segments.join('-')}`;
}

export function validateLicenseKeyFormat(key) {
  const pattern = /^MGFL-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;
  return pattern.test(key);
}

export function generateChecksum(licenseKey, hardwareId) {
  const data = `${licenseKey}:${hardwareId}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

export default {
  generateLicenseKey,
  validateLicenseKeyFormat,
  generateChecksum
};
