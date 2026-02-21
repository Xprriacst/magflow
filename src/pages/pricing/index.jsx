import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { stripeAPI } from '../../services/api';
import Header from '../../components/ui/Header';
import CreditsDisplay from '../../components/CreditsDisplay';

const PricingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { credits, refreshCredits, isAuthenticated } = useAuth();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState(null);

  const canceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await stripeAPI.getPackages();
      if (response.success) {
        setPackages(response.packages);
      }
    } catch (err) {
      console.error('Error loading packages:', err);
      setError('Impossible de charger les offres');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/pricing' } } });
      return;
    }

    setPurchasing(packageId);
    setError(null);

    try {
      const response = await stripeAPI.createCheckoutSession(packageId);
      if (response.success && response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        setError(response.error || 'Erreur lors de la création du paiement');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError(err.message || 'Erreur lors de la création du paiement');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Achetez des crédits
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              1 crédit = 1 page de magazine générée. Achetez des crédits pour créer plus de magazines professionnels.
            </p>

            {/* Current credits */}
            {isAuthenticated && credits && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border">
                <span className="text-gray-600">Vos crédits actuels :</span>
                <CreditsDisplay showUpgrade={false} />
              </div>
            )}
          </div>

          {/* Canceled message */}
          {canceled && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center">
              Paiement annulé. Vous pouvez réessayer quand vous voulez.
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des offres...</p>
            </div>
          ) : (
            /* Pricing cards */
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                    pkg.popular
                      ? 'border-purple-500 scale-105'
                      : pkg.bestValue
                        ? 'border-green-500'
                        : 'border-gray-200'
                  }`}
                >
                  {/* Badge */}
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">
                        Populaire
                      </span>
                    </div>
                  )}
                  {pkg.bestValue && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                        Meilleur rapport
                      </span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Credits */}
                    <div className="text-center mb-4">
                      <div className="text-5xl font-bold text-gray-900 mb-1">
                        {pkg.credits}
                      </div>
                      <div className="text-gray-500">crédits</div>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-gray-900">
                        {pkg.price.toFixed(2)}€
                      </div>
                      <div className="text-sm text-gray-500">
                        {pkg.pricePerCredit}€ / crédit
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-center text-gray-600 mb-6">
                      {pkg.description}
                    </p>

                    {/* Buy button */}
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchasing === pkg.id}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                        pkg.popular
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : pkg.bestValue
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {purchasing === pkg.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Redirection...
                        </span>
                      ) : (
                        'Acheter'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FAQ section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Questions fréquentes
            </h2>

            <div className="space-y-4">
              <details className="bg-white rounded-lg shadow p-4 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  Qu'est-ce qu'un crédit ?
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-gray-600">
                  1 crédit = 1 page de magazine générée. Par exemple, si vous générez un magazine de 4 pages, cela consomme 4 crédits.
                </p>
              </details>

              <details className="bg-white rounded-lg shadow p-4 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  Les crédits expirent-ils ?
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-gray-600">
                  Les crédits achetés n'expirent jamais. Les 3 crédits gratuits mensuels sont réinitialisés chaque mois.
                </p>
              </details>

              <details className="bg-white rounded-lg shadow p-4 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  Comment fonctionne le paiement ?
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-gray-600">
                  Le paiement est sécurisé via Stripe. Vous pouvez payer par carte bancaire. Vos crédits sont ajoutés instantanément après le paiement.
                </p>
              </details>

              <details className="bg-white rounded-lg shadow p-4 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  Puis-je obtenir un remboursement ?
                  <span className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-gray-600">
                  Les crédits non utilisés peuvent être remboursés dans les 14 jours suivant l'achat. Contactez notre support.
                </p>
              </details>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Besoin d'un volume plus important ?{' '}
              <a href="mailto:contact@magflow.app" className="text-purple-600 font-semibold hover:underline">
                Contactez-nous
              </a>
              {' '}pour un devis personnalisé.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
