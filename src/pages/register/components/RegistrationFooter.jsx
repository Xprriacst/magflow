import React from 'react';
import Icon from '../../../components/AppIcon';

const RegistrationFooter = () => {
  const currentYear = new Date()?.getFullYear();

  return (
    <div className="mt-12 pt-8 border-t border-border">
      {/* Trust Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="flex items-center justify-center space-x-2">
          <Icon name="Shield" size={16} color="var(--color-success)" />
          <span className="text-sm text-muted-foreground">Données sécurisées</span>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Icon name="Users" size={16} color="var(--color-primary)" />
          <span className="text-sm text-muted-foreground">+500 éditeurs</span>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Icon name="Award" size={16} color="var(--color-accent)" />
          <span className="text-sm text-muted-foreground">Certifié RGPD</span>
        </div>
      </div>

      {/* Support Information */}
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground mb-2">
          Besoin d'aide pour votre inscription ?
        </p>
        <div className="flex items-center justify-center space-x-4">
          <a 
            href="mailto:support@magflow.fr" 
            className="flex items-center space-x-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Icon name="Mail" size={14} />
            <span>support@magflow.fr</span>
          </a>
          <span className="text-muted-foreground">|</span>
          <a 
            href="tel:+33123456789" 
            className="flex items-center space-x-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Icon name="Phone" size={14} />
            <span>+33 1 23 45 67 89</span>
          </a>
        </div>
      </div>

      {/* Legal Links */}
      <div className="flex flex-wrap items-center justify-center space-x-6 mb-6 text-sm">
        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
          Conditions d'utilisation
        </a>
        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
          Politique de confidentialité
        </a>
        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
          Mentions légales
        </a>
        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
          Contact
        </a>
      </div>

      {/* Copyright */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          © {currentYear} MagFlow. Tous droits réservés. Fait avec ❤️ pour les éditeurs français.
        </p>
      </div>
    </div>
  );
};

export default RegistrationFooter;