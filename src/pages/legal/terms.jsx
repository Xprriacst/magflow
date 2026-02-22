import React from 'react';
import LegalLayout from './LegalLayout';

const TermsPage = () => {
  return (
    <LegalLayout title="Conditions Générales de Vente (CGV)" updatedAt="21 février 2026">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Objet</h2>
        <p>
          Les présentes CGV encadrent l'accès au SaaS MagFlow de génération automatique de magazines InDesign, incluant les crédits ponctuels et les abonnements Pro.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Offres et facturation</h2>
        <p>
          MagFlow propose des crédits one-shot et des abonnements récurrents. Les prix sont affichés en euros TTC sauf mention contraire. Les paiements sont traités par Stripe.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Résiliation</h2>
        <p>
          Les abonnements peuvent être gérés et résiliés depuis le portail Stripe. La résiliation prend effet à la fin de la période déjà payée, sauf disposition légale contraire.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Responsabilité</h2>
        <p>
          MagFlow fournit un service de génération automatisée. L'utilisateur reste responsable du contenu fourni, des droits sur les images et de la validation éditoriale finale.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Contact</h2>
        <p>
          Pour toute question contractuelle: <a href="mailto:contact@magflow.app" className="text-purple-600 hover:underline">contact@magflow.app</a>.
        </p>
      </section>
    </LegalLayout>
  );
};

export default TermsPage;
