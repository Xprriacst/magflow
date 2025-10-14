import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-3">
          <Icon name="Zap" size={28} color="white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          MagFlow
        </h1>
      </div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Bienvenue
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Connectez-vous à votre espace éditorial pour gérer vos projets de magazine et automatiser vos workflows de publication.
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;