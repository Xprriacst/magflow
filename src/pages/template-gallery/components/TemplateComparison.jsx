import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const TemplateComparison = ({ templates, onClose, onSelect, onRemoveFromComparison }) => {
  if (templates?.length === 0) return null;

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'Simple':
        return 'text-success bg-success/10';
      case 'Modéré':
        return 'text-warning bg-warning/10';
      case 'Complexe':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name="Star"
        size={14}
        className={index < rating ? 'text-warning fill-current' : 'text-muted-foreground'}
      />
    ));
  };

  const comparisonFeatures = [
    { key: 'pageCount', label: 'Nombre de pages', icon: 'FileText' },
    { key: 'imageSlots', label: 'Emplacements d\'images', icon: 'Image' },
    { key: 'textCapacity', label: 'Capacité de texte', icon: 'Type' },
    { key: 'complexity', label: 'Complexité', icon: 'BarChart3' },
    { key: 'processingTime', label: 'Temps de traitement', icon: 'Clock' },
    { key: 'indesignVersion', label: 'Version InDesign', icon: 'Settings' },
    { key: 'usageCount', label: 'Utilisations', icon: 'Users' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-modal w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-heading font-semibold text-foreground flex items-center space-x-2">
            <Icon name="GitCompare" size={20} />
            <span>Comparaison des modèles</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Comparison Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className={`grid gap-6 ${
            templates?.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
            templates?.length === 2 ? 'grid-cols-1 md:grid-cols-2': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {templates?.map((template) => (
              <div key={template?.id} className="bg-muted/30 rounded-lg p-4 relative">
                {/* Remove Button */}
                <button
                  onClick={() => onRemoveFromComparison(template?.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-error hover:text-error-foreground transition-colors duration-150"
                >
                  <Icon name="X" size={12} />
                </button>

                {/* Template Preview */}
                <div className="aspect-[3/4] mb-4 rounded-lg overflow-hidden bg-card">
                  <Image
                    src={template?.previewImage}
                    alt={`Aperçu du modèle ${template?.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Template Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground mb-1">
                      {template?.name}
                    </h3>
                    <div className="flex items-center space-x-1 mb-2">
                      {getRatingStars(template?.rating)}
                      <span className="text-sm text-muted-foreground ml-1">
                        ({template?.reviews} avis)
                      </span>
                    </div>
                    {template?.isRecommended && (
                      <div className="inline-flex items-center space-x-1 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
                        <Icon name="Sparkles" size={12} />
                        <span>Recommandé</span>
                      </div>
                    )}
                  </div>

                  {/* Comparison Features */}
                  <div className="space-y-2">
                    {comparisonFeatures?.map((feature) => (
                      <div key={feature?.key} className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-2">
                          <Icon name={feature?.icon} size={14} className="text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{feature?.label}:</span>
                        </div>
                        <span className={`text-sm font-medium ${
                          feature?.key === 'complexity' 
                            ? `px-2 py-1 rounded-full ${getComplexityColor(template?.[feature?.key])}`
                            : 'text-foreground'
                        }`}>
                          {template?.[feature?.key]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="default"
                    size="sm"
                    fullWidth
                    onClick={() => onSelect(template)}
                    iconName="Check"
                    iconPosition="left"
                    iconSize={14}
                    className="mt-4"
                  >
                    Sélectionner ce modèle
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Tips */}
          {templates?.length > 1 && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon name="Lightbulb" size={16} className="text-accent mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1">Conseils de comparaison</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Comparez la complexité avec vos besoins de mise en page</li>
                    <li>• Vérifiez que le nombre d'emplacements d'images correspond à votre contenu</li>
                    <li>• Considérez le temps de traitement pour vos délais</li>
                    <li>• Les modèles recommandés sont optimisés pour votre contenu actuel</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateComparison;