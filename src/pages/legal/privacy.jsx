import React from 'react';
import LegalLayout from './LegalLayout';

const PrivacyPage = () => {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="21 février 2026">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Données collectées</h2>
        <p>
          Nous collectons les données nécessaires au fonctionnement du service: compte utilisateur, informations de facturation Stripe, logs techniques et historiques de génération.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Finalités</h2>
        <p>
          Les données sont traitées pour fournir le service, sécuriser les accès, gérer la facturation et améliorer la qualité de la plateforme.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Sous-traitants</h2>
        <p>
          MagFlow s'appuie notamment sur Supabase (auth/base de données) et Stripe (paiement). Ces prestataires agissent selon leurs engagements contractuels et de sécurité.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Durée de conservation</h2>
        <p>
          Les données sont conservées pendant la durée nécessaire au service et aux obligations légales de conservation comptable et de sécurité.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Exercice des droits</h2>
        <p>
          Vous pouvez demander l'accès, la rectification ou la suppression de vos données via <a href="mailto:privacy@magflow.app" className="text-purple-600 hover:underline">privacy@magflow.app</a>.
        </p>
      </section>
    </LegalLayout>
  );
};

export default PrivacyPage;
