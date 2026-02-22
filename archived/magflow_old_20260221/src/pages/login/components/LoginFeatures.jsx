import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginFeatures = () => {
  const features = [
    {
      icon: 'Edit3',
      title: 'Édition de contenu',
      description: 'Créez et modifiez vos articles avec notre éditeur riche et intuitif.'
    },
    {
      icon: 'Image',
      title: 'Gestion d\'images',
      description: 'Organisez, redimensionnez et optimisez vos images pour la publication.'
    },
    {
      icon: 'Layout',
      title: 'Modèles intelligents',
      description: 'Sélectionnez automatiquement les meilleurs modèles pour votre contenu.'
    },
    {
      icon: 'Settings',
      title: 'Automatisation',
      description: 'Intégration InDesign pour une génération automatique de mises en page.'
    }
  ];

  return (
    <div className="hidden lg:block">
      <div className="mb-8">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
          Fonctionnalités principales
        </h3>
        <p className="text-muted-foreground">
          Découvrez les outils qui révolutionnent votre workflow éditorial
        </p>
      </div>
      <div className="space-y-6">
        {features?.map((feature, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name={feature?.icon} size={18} color="var(--color-primary)" />
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">
                {feature?.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {feature?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Stats */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">500+</div>
            <div className="text-xs text-muted-foreground">Modèles disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">95%</div>
            <div className="text-xs text-muted-foreground">Temps économisé</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginFeatures;