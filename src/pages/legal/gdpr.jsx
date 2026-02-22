import React from 'react';
import LegalLayout from './LegalLayout';

const GdprPage = () => {
  return (
    <LegalLayout title="Informations RGPD" updatedAt="21 février 2026">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Responsable du traitement</h2>
        <p>
          MagFlow est responsable du traitement des données personnelles collectées via la plateforme.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Base légale</h2>
        <p>
          Les traitements reposent sur l'exécution du contrat, l'intérêt légitime (sécurité, prévention fraude) et les obligations légales.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Vos droits</h2>
        <p>
          Vous disposez d'un droit d'accès, de rectification, d'opposition, de limitation, d'effacement et de portabilité, dans les limites prévues par la réglementation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Sécurité</h2>
        <p>
          MagFlow met en place des mesures techniques et organisationnelles adaptées: contrôle d'accès, chiffrement en transit, journalisation et monitoring.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Réclamation</h2>
        <p>
          En cas de difficulté non résolue, vous pouvez introduire une réclamation auprès de la CNIL.
        </p>
      </section>
    </LegalLayout>
  );
};

export default GdprPage;
