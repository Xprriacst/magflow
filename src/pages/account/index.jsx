import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, stripeAPI } from '../../services/api';

const STATUS_LABELS = {
  active: 'Actif',
  trialing: 'Essai',
  past_due: 'Paiement en retard',
  canceled: 'Résilié',
  incomplete: 'Incomplet',
  paid: 'Payée',
  draft: 'Brouillon',
  open: 'À payer',
  void: 'Annulée',
  uncollectible: 'Impayée'
};

const statusClasses = {
  active: 'bg-green-100 text-green-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-amber-100 text-amber-700',
  canceled: 'bg-gray-200 text-gray-700',
  incomplete: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  open: 'bg-amber-100 text-amber-700',
  void: 'bg-gray-200 text-gray-700',
  uncollectible: 'bg-red-100 text-red-700'
};

function formatDate(dateString) {
  if (!dateString) return '-';

  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) return '-';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(value);
}

function formatAmount(value, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(value || 0);
}

const AccountPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCredits } = useAuth();

  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [error, setError] = useState(null);

  const [profileData, setProfileData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const subscriptionSuccess = searchParams.get('subscription') === 'success';

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    setLoading(true);
    setError(null);

    try {
      const profileResponse = await authAPI.getProfile();
      const [subscriptionResult, invoicesResult] = await Promise.allSettled([
        stripeAPI.getSubscription(),
        stripeAPI.getInvoices(25)
      ]);

      setProfileData(profileResponse);
      setSubscription(subscriptionResult.status === 'fulfilled'
        ? (subscriptionResult.value?.subscription || null)
        : null);
      setInvoices(invoicesResult.status === 'fulfilled'
        ? (invoicesResult.value?.invoices || [])
        : []);

      if (subscriptionResult.status === 'rejected' || invoicesResult.status === 'rejected') {
        setError('Certaines données de facturation ne sont pas disponibles pour le moment.');
      }

      await refreshCredits();
    } catch (err) {
      console.error('[Account] load error:', err);
      setError(err.message || 'Impossible de charger les données du compte');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setBillingLoading(true);
    setError(null);

    try {
      const response = await stripeAPI.createBillingPortalSession('/account');
      if (response.success && response.url) {
        window.location.href = response.url;
        return;
      }

      setError(response.error || 'Impossible d\'ouvrir le portail de facturation');
    } catch (err) {
      console.error('[Account] billing portal error:', err);
      setError(err.message || 'Impossible d\'ouvrir le portail de facturation');
    } finally {
      setBillingLoading(false);
    }
  };

  const profile = profileData?.profile || {};
  const user = profileData?.user || {};
  const credits = profileData?.credits || {};

  const isPro = profile.subscriptionTier === 'pro';
  const planLabel = isPro ? 'Pro' : 'Free';

  const subscriptionStatus = subscription?.status || (isPro ? 'active' : 'active');
  const subscriptionStatusLabel = STATUS_LABELS[subscriptionStatus] || subscriptionStatus;

  const subscriptionClass = statusClasses[subscriptionStatus] || 'bg-gray-100 text-gray-700';

  const invoiceRows = useMemo(() => {
    return invoices.map((invoice) => ({
      ...invoice,
      statusLabel: STATUS_LABELS[invoice.status] || invoice.status,
      statusClass: statusClasses[invoice.status] || 'bg-gray-100 text-gray-700'
    }));
  }, [invoices]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 px-4 max-w-6xl mx-auto">
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de votre compte...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mon compte</h1>
              <p className="text-gray-600 mt-1">Profil, abonnement et historique des factures.</p>
            </div>
            <button
              type="button"
              onClick={loadAccountData}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Actualiser
            </button>
          </div>

          {subscriptionSuccess && (
            <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-700">
              Abonnement confirmé. Votre plan Pro est en cours d'activation.
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
              {error}
            </div>
          )}

          <section className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profil</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium mt-1">{user.email || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Nom</p>
                  <p className="text-gray-900 font-medium mt-1">{user.name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Entreprise</p>
                  <p className="text-gray-900 font-medium mt-1">{profile.companyName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Membre depuis</p>
                  <p className="text-gray-900 font-medium mt-1">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan actuel</h2>

              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Offre</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPro ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                  {planLabel}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Statut</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${subscriptionClass}`}>
                  {subscriptionStatusLabel}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Crédits mensuels utilisés</span>
                  <span className="text-gray-900 font-medium">{credits.used ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Crédits achetés restants</span>
                  <span className="text-gray-900 font-medium">{credits.purchased ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Prochain renouvellement</span>
                  <span className="text-gray-900 font-medium">{formatDate(subscription?.currentPeriodEnd)}</span>
                </div>
              </div>

              {isPro ? (
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={billingLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {billingLoading ? 'Ouverture...' : 'Gérer mon abonnement'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700"
                >
                  Passer à Pro
                </button>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Historique des factures</h2>
              <p className="text-sm text-gray-500">{invoiceRows.length} facture(s)</p>
            </div>

            {invoiceRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
                Aucune facture disponible pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                      <th className="py-3 pr-4 font-semibold">Date</th>
                      <th className="py-3 pr-4 font-semibold">Référence</th>
                      <th className="py-3 pr-4 font-semibold">Montant</th>
                      <th className="py-3 pr-4 font-semibold">Statut</th>
                      <th className="py-3 pr-4 font-semibold">Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRows.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-100 last:border-0 text-sm">
                        <td className="py-3 pr-4 text-gray-700">{formatDate(invoice.paidAt || invoice.createdAt)}</td>
                        <td className="py-3 pr-4 text-gray-900 font-medium">{invoice.number || invoice.id}</td>
                        <td className="py-3 pr-4 text-gray-900">{formatAmount(invoice.amountPaid || invoice.amountDue, invoice.currency || 'EUR')}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${invoice.statusClass}`}>
                            {invoice.statusLabel}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            {invoice.hostedInvoiceUrl && (
                              <a
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-600 hover:text-purple-700 font-medium"
                              >
                                Voir
                              </a>
                            )}
                            {invoice.invoicePdf && (
                              <a
                                href={invoice.invoicePdf}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-700 hover:text-gray-900 font-medium"
                              >
                                PDF
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AccountPage;
