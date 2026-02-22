import React, { useEffect, useState } from 'react';
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
  const [plans, setPlans] = useState([]);
  const [isPro, setIsPro] = useState(false);

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [subscribing, setSubscribing] = useState(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [error, setError] = useState(null);

  const canceled = searchParams.get('canceled') === 'true';
  const subscriptionCanceled = searchParams.get('subscription_canceled') === 'true';

  useEffect(() => {
    loadOffers();
  }, [isAuthenticated]);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);

    try {
      const [packagesResponse, plansResponse] = await Promise.all([
        stripeAPI.getPackages(),
        stripeAPI.getPlans()
      ]);

      if (packagesResponse.success) {
        setPackages(packagesResponse.packages || []);
      }

      if (plansResponse.success) {
        setPlans(plansResponse.plans || []);
      }

      if (isAuthenticated) {
        await refreshCredits();
        try {
          const subscriptionResponse = await stripeAPI.getSubscription();
          setIsPro(subscriptionResponse?.profile?.subscriptionTier === 'pro');
        } catch (subscriptionError) {
          console.warn('Subscription status unavailable:', subscriptionError.message);
          setIsPro(false);
        }
      } else {
        setIsPro(false);
      }
    } catch (err) {
      console.error('Error loading pricing data:', err);
      setError('Impossible de charger les offres pour le moment.');
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
        window.location.href = response.url;
      } else {
        setError(response.error || 'Erreur lors de la création du paiement');
      }
    } catch (err) {
      console.error('Error creating payment checkout:', err);
      setError(err.message || 'Erreur lors de la création du paiement');
    } finally {
      setPurchasing(null);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/pricing' } } });
      return;
    }

    setSubscribing(planId);
    setError(null);

    try {
      const response = await stripeAPI.createSubscriptionSession(planId, '/account');
      if (response.success && response.url) {
        window.location.href = response.url;
      } else {
        setError(response.error || 'Erreur lors de la création de l\'abonnement');
      }
    } catch (err) {
      console.error('Error creating subscription checkout:', err);
      setError(err.message || 'Erreur lors de la création de l\'abonnement');
    } finally {
      setSubscribing(null);
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    setError(null);

    try {
      const response = await stripeAPI.createBillingPortalSession('/account');
      if (response.success && response.url) {
        window.location.href = response.url;
      } else {
        setError(response.error || 'Impossible d\'ouvrir le portail de facturation');
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
      setError(err.message || 'Impossible d\'ouvrir le portail de facturation');
    } finally {
      setOpeningPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Tarifs MagFlow</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passez en Pro pour des générations illimitées, ou achetez des crédits ponctuels selon vos besoins.
            </p>

            {isAuthenticated && credits && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border">
                <span className="text-gray-600">Vos crédits actuels :</span>
                <CreditsDisplay showUpgrade={false} />
              </div>
            )}
          </div>

          {isPro && (
            <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 flex items-center justify-between gap-4 flex-wrap">
              <p>Votre compte est déjà en plan Pro.</p>
              <button
                type="button"
                onClick={handleManageSubscription}
                disabled={openingPortal}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {openingPortal ? 'Ouverture...' : 'Gérer mon abonnement'}
              </button>
            </div>
          )}

          {(canceled || subscriptionCanceled) && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center">
              {subscriptionCanceled
                ? 'Abonnement annulé. Vous pouvez reprendre quand vous voulez.'
                : 'Paiement annulé. Vous pouvez réessayer quand vous voulez.'}
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des offres...</p>
            </div>
          ) : (
            <>
              <section className="mb-16">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">Abonnements Pro</h2>
                  <p className="text-sm text-gray-500">Mensuel ou annuel</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative bg-white rounded-2xl shadow-lg border-2 p-6 ${plan.recommended ? 'border-purple-500' : 'border-gray-200'}`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-6">
                          <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                            Recommandé
                          </span>
                        </div>
                      )}

                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      </div>

                      <div className="mb-2 flex items-end gap-2">
                        <span className="text-4xl font-bold text-gray-900">{plan.price.toFixed(2)}€</span>
                        <span className="text-gray-500 mb-1">/{plan.interval === 'year' ? 'an' : 'mois'}</span>
                      </div>

                      {plan.discountLabel && (
                        <p className="text-sm text-green-700 font-medium mb-4">{plan.discountLabel}</p>
                      )}

                      {!plan.available && (
                        <p className="text-sm text-amber-700 font-medium mb-4">Configuration Stripe en attente</p>
                      )}

                      <ul className="space-y-2 text-sm text-gray-700 mb-6">
                        <li>Générations illimitées</li>
                        <li>Support prioritaire</li>
                        <li>Gestion Stripe sécurisée</li>
                      </ul>

                      <button
                        type="button"
                        onClick={() => (isPro ? handleManageSubscription() : handleSubscribe(plan.id))}
                        disabled={!plan.available || subscribing === plan.id || openingPortal}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-white disabled:opacity-50 ${
                          isPro ? 'bg-gray-900 hover:bg-gray-800' : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {!plan.available
                          ? 'Bientôt disponible'
                          : subscribing === plan.id
                          ? 'Redirection...'
                          : isPro
                            ? 'Gérer mon abonnement'
                            : 'Choisir ce plan'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">Crédits ponctuels</h2>
                  <p className="text-sm text-gray-500">Sans engagement</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                        pkg.popular ? 'border-purple-500 scale-[1.02]' : pkg.bestValue ? 'border-green-500' : 'border-gray-200'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-4 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">Populaire</span>
                        </div>
                      )}
                      {pkg.bestValue && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-4 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">Meilleur rapport</span>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="text-center mb-4">
                          <div className="text-5xl font-bold text-gray-900 mb-1">{pkg.credits}</div>
                          <div className="text-gray-500">crédits</div>
                        </div>

                        <div className="text-center mb-6">
                          <div className="text-3xl font-bold text-gray-900">{pkg.price.toFixed(2)}€</div>
                          <div className="text-sm text-gray-500">{pkg.pricePerCredit}€ / crédit</div>
                        </div>

                        <p className="text-center text-gray-600 mb-6">{pkg.description}</p>

                        <button
                          type="button"
                          onClick={() => handlePurchase(pkg.id)}
                          disabled={purchasing === pkg.id}
                          className={`w-full py-3 px-4 rounded-xl font-semibold text-white disabled:opacity-50 ${
                            pkg.popular
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : pkg.bestValue
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-900 hover:bg-gray-800'
                          }`}
                        >
                          {purchasing === pkg.id ? 'Redirection...' : 'Acheter'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
