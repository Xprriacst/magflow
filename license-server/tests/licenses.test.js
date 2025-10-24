import { describe, it, expect } from 'vitest';
import { generateLicenseKey, validateLicenseKeyFormat } from '../services/keyGenerator.js';
import { validateHardwareId } from '../services/hardwareValidator.js';
import { encrypt, decrypt } from '../utils/encryption.js';

describe('License Key Generation', () => {
  it('génère une clé au bon format', () => {
    const key = generateLicenseKey();
    expect(key).toMatch(/^MGFL-[0-9A-F]{4}(-[0-9A-F]{4}){3}$/);
  });

  it('génère des clés uniques', () => {
    const keys = new Set();
    for (let i = 0; i < 1000; i += 1) {
      keys.add(generateLicenseKey());
    }
    expect(keys.size).toBe(1000);
  });

  it('valide le format correctement', () => {
    expect(validateLicenseKeyFormat('MGFL-A3F2-8D4C-9E1B-7F6A')).toBe(true);
    expect(validateLicenseKeyFormat('INVALID-KEY')).toBe(false);
  });
});

describe('Hardware ID Validation', () => {
  it('rejette un hardware ID invalide', () => {
    expect(validateHardwareId('not-a-hash')).toBe(false);
  });

  it('accepte un hash SHA256', () => {
    const valid = 'a'.repeat(64);
    expect(validateHardwareId(valid)).toBe(true);
  });
});

describe('Encryption utils', () => {
  it('chiffre et déchiffre correctement', () => {
    const payload = 'secret-data';
    const encrypted = encrypt(payload);
    expect(encrypted).toBeTruthy();
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(payload);
  });
});

describe('License Activation (API)', () => {
  it.todo('active une license valide via API');
  it.todo('rejette une license expirée via API');
  it.todo("limite le nombre d'activations via API");
});
