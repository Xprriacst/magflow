/* eslint-disable no-console */

export async function sendLicenseEmail(recipient, licenseKey, options = {}) {
  const { plan, expiresAt } = options;

  if (!recipient) {
    throw new Error('Adresse email manquante');
  }

  const emailApiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM || 'licenses@magflow.app';

  if (!emailApiKey) {
    console.warn(
      '[license-server] EMAIL_API_KEY manquant. Aucun email réel envoyé pour la clé %s.',
      licenseKey
    );
    console.info(
      '[license-server] Contenu simulé vers %s | Plan: %s | Expiration: %s',
      recipient,
      plan || 'N/A',
      expiresAt || 'N/A'
    );
    return;
  }

  // TODO: intégrer le fournisseur d'email (SendGrid, Resend, etc.)
  console.info(
    '[license-server] EMAIL_API_KEY fourni. Intégrer l\'envoi réel avec votre fournisseur.'
  );
  console.info(
    '[license-server] Email préparé vers %s | Plan: %s | Clé: %s | Expiration: %s',
    recipient,
    plan || 'N/A',
    licenseKey,
    expiresAt || 'N/A'
  );
}

export default {
  sendLicenseEmail
};
