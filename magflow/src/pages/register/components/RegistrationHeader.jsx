import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RegistrationHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-3">
          <Icon name="Zap" size={28} color="white" strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-heading font-bold text-foreground">
          MagFlow
        </span>
      </div>

      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Rejoignez MagFlow
        </h1>
        <p className="text-muted-foreground text-lg">
          Créez votre compte pour automatiser vos workflows éditoriaux
        </p>
      </div>

      {/* Features Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col items-center p-4 bg-card rounded-lg border border-border">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
            <Icon name="Edit3" size={20} color="var(--color-primary)" />
          </div>
          <h3 className="font-medium text-foreground text-sm">Édition Avancée</h3>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Outils d'édition professionnels
          </p>
        </div>

        <div className="flex flex-col items-center p-4 bg-card rounded-lg border border-border">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
            <Icon name="Layout" size={20} color="var(--color-accent)" />
          </div>
          <h3 className="font-medium text-foreground text-sm">Templates IA</h3>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Sélection intelligente de modèles
          </p>
        </div>

        <div className="flex flex-col items-center p-4 bg-card rounded-lg border border-border">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mb-2">
            <Icon name="Zap" size={20} color="var(--color-success)" />
          </div>
          <h3 className="font-medium text-foreground text-sm">Automatisation</h3>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Workflow automatisé complet
          </p>
        </div>
      </div>

      {/* Login Link */}
      <div className="flex items-center justify-center space-x-2 text-sm">
        <span className="text-muted-foreground">Vous avez déjà un compte ?</span>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/login')}
          className="p-0 h-auto font-medium"
        >
          Se connecter
        </Button>
      </div>
    </div>
  );
};

export default RegistrationHeader;