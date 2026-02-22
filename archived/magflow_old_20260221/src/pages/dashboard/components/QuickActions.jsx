import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const QuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'new_project',
      label: 'Nouveau Projet',
      description: 'Créer un nouveau magazine',
      icon: 'Plus',
      variant: 'default',
      action: () => navigate('/content-editor')
    },
    {
      id: 'import_content',
      label: 'Importer du Contenu',
      description: 'Importer textes et images',
      icon: 'Upload',
      variant: 'outline',
      action: () => navigate('/content-editor')
    },
    {
      id: 'template_gallery',
      label: 'Parcourir les Modèles',
      description: 'Explorer la galerie de modèles',
      icon: 'Layout',
      variant: 'outline',
      action: () => navigate('/template-gallery')
    },
    {
      id: 'processing_status',
      label: 'Suivi des Traitements',
      description: 'Voir les tâches en cours',
      icon: 'Settings',
      variant: 'outline',
      action: () => navigate('/processing-status')
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Actions rapides
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions?.map((action) => (
          <div key={action?.id} className="group">
            <Button
              variant={action?.variant}
              size="lg"
              onClick={action?.action}
              iconName={action?.icon}
              iconPosition="left"
              iconSize={20}
              className="w-full h-auto p-4 flex-col items-start text-left group-hover:scale-105 transition-transform duration-200"
            >
              <span className="font-medium mb-1">{action?.label}</span>
              <span className="text-xs opacity-80 font-normal">
                {action?.description}
              </span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;