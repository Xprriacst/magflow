import React from 'react';
import { Helmet } from 'react-helmet';
import RegistrationHeader from './components/RegistrationHeader';
import RegistrationForm from './components/RegistrationForm';
import RegistrationFooter from './components/RegistrationFooter';

const RegisterPage = () => {
  return (
    <>
      <Helmet>
        <title>Inscription - MagFlow | Plateforme d'automatisation éditoriale</title>
        <meta 
          name="description" 
          content="Créez votre compte MagFlow pour automatiser vos workflows éditoriaux. Rejoignez plus de 500 éditeurs qui font confiance à notre plateforme." 
        />
        <meta name="keywords" content="inscription, éditeur, magazine, automatisation, workflow, publication" />
        <meta property="og:title" content="Inscription - MagFlow" />
        <meta property="og:description" content="Créez votre compte pour automatiser vos workflows éditoriaux" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-card rounded-2xl shadow-card border border-border p-8 sm:p-12">
              <RegistrationHeader />
              <RegistrationForm />
              <RegistrationFooter />
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-success/10 rounded-full blur-xl" />
      </div>
    </>
  );
};

export default RegisterPage;