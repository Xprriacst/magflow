import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Vérification en cours...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase gère automatiquement le hash fragment
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus('Erreur: ' + error.message);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (session) {
          setStatus('Connexion réussie ! Redirection...');
          setTimeout(() => navigate('/'), 1000);
        } else {
          setStatus('Session non trouvée. Redirection...');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        setStatus('Erreur inattendue');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">MagFlow</h2>
        <p className="text-gray-600">{status}</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
