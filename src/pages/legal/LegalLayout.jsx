import React from 'react';
import { Link } from 'react-router-dom';

const LegalLayout = ({ title, updatedAt, children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Retour à MagFlow
          </Link>
        </div>

        <article className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10">
          <header className="mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-sm text-gray-500">Dernière mise à jour: {updatedAt}</p>
          </header>

          <div className="space-y-6 text-gray-700 leading-7">
            {children}
          </div>
        </article>

        <nav className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link to="/legal/cgv" className="text-gray-600 hover:text-gray-900">CGV</Link>
          <Link to="/legal/privacy" className="text-gray-600 hover:text-gray-900">Confidentialité</Link>
          <Link to="/legal/rgpd" className="text-gray-600 hover:text-gray-900">RGPD</Link>
        </nav>
      </main>
    </div>
  );
};

export default LegalLayout;
