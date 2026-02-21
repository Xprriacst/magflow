import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Affiche les crédits restants de l'utilisateur
 * 1 crédit = 1 page générée
 */
const CreditsDisplay = ({ className = '', showUpgrade = true }) => {
  const { credits, user } = useAuth();

  if (!credits) {
    return null;
  }

  const { remaining, limit, unlimited } = credits;

  // Couleur selon le niveau de crédits
  const getColorClass = () => {
    if (unlimited) return 'text-green-600 bg-green-50';
    if (remaining === 0) return 'text-red-600 bg-red-50';
    if (remaining <= 1) return 'text-orange-600 bg-orange-50';
    return 'text-purple-600 bg-purple-50';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getColorClass()}`}>
        {unlimited ? (
          <span className="flex items-center gap-1">
            <span>Illimité</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{remaining} crédit{remaining > 1 ? 's' : ''}</span>
          </span>
        )}
      </div>

      {!unlimited && remaining === 0 && showUpgrade && (
        <a
          href="/pricing"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
        >
          Acheter des crédits
        </a>
      )}
    </div>
  );
};

/**
 * Version compacte pour les headers/navbars
 */
export const CreditsDisplayCompact = ({ className = '' }) => {
  const { credits } = useAuth();

  if (!credits) {
    return null;
  }

  const { remaining, unlimited } = credits;

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`font-medium ${remaining === 0 ? 'text-red-600' : 'text-gray-700'}`}>
        {unlimited ? '∞' : remaining}
      </span>
    </div>
  );
};

export default CreditsDisplay;
