import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import LoginFeatures from './components/LoginFeatures';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Connexion - MagFlow | Plateforme d'automatisation éditoriale</title>
        <meta name="description" content="Connectez-vous à MagFlow pour accéder à votre espace éditorial et automatiser vos workflows de publication de magazines." />
        <meta name="keywords" content="connexion, éditeur, magazine, publication, workflow, automatisation" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="flex min-h-screen">
          {/* Left Panel - Login Form */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
              <LoginHeader />
              <LoginForm />
            </div>
          </div>

          {/* Right Panel - Features (Desktop Only) */}
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-muted/30 px-8">
            <div className="w-full max-w-lg">
              <LoginFeatures />
            </div>
          </div>
        </div>

        {/* Mobile Features Section */}
        <div className="lg:hidden bg-muted/30 px-4 py-8">
          <div className="max-w-md mx-auto">
            <LoginFeatures />
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-muted-foreground">
                © {new Date()?.getFullYear()} MagFlow. Tous droits réservés.
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                  Conditions d'utilisation
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                  Politique de confidentialité
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Login;