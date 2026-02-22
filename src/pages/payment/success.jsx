import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { stripeAPI } from '../../services/api';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCredits } = useAuth();

  const [verifying, setVerifying] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setError('Session de paiement manquante');
      setVerifying(false);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await stripeAPI.verifySession(sessionId);
      if (response.success && response.status === 'paid') {
        setPaymentInfo(response);
        // Refresh credits to get the updated count
        await refreshCredits();
      } else {
        setError('Le paiement n\'a pas pu être vérifié');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError(err.message || 'Erreur lors de la vérification du paiement');
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Vérification du paiement...
          </h2>
          <p className="text-gray-600">
            Merci de patienter quelques instants
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-600">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Erreur
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition"
          >
            Retour aux offres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement réussi !
        </h2>

        <p className="text-gray-600 mb-6">
          Merci pour votre achat. Vos crédits ont été ajoutés à votre compte.
        </p>

        {/* Payment details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Crédits ajoutés</span>
            <span className="text-2xl font-bold text-green-600">+{paymentInfo?.credits}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Montant payé</span>
            <span className="font-semibold">{paymentInfo?.amountPaid?.toFixed(2)}€</span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/smart-content-creator')}
            className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition"
          >
            Créer un magazine
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
          >
            Aller au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
