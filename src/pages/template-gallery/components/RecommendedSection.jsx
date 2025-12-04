import React from 'react';
import Icon from '../../../components/AppIcon';
import TemplateCard from './TemplateCard';

const RecommendedSection = ({ 
  templates, 
  onSelectTemplate, 
  onPreviewTemplate, 
  selectedTemplate,
  onCompareTemplate,
  comparisonTemplates 
}) => {
  const recommendedTemplates = templates?.filter(template => template?.isRecommended);

  if (recommendedTemplates?.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
          <Icon name="Sparkles" size={20} className="text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Recommandé pour votre contenu
          </h2>
          <p className="text-sm text-muted-foreground">
            Modèles sélectionnés par IA basés sur votre contenu et vos images
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recommendedTemplates?.map((template) => (
          <TemplateCard
            key={template?.id}
            template={template}
            onSelect={onSelectTemplate}
            onPreview={onPreviewTemplate}
            isSelected={selectedTemplate?.id === template?.id}
            onCompare={onCompareTemplate}
            isInComparison={comparisonTemplates?.some(t => t?.id === template?.id)}
          />
        ))}
      </div>
      {/* AI Insights */}
      <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <Icon name="Brain" size={16} className="text-accent mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground mb-1">Analyse IA de votre contenu</h4>
            <p className="text-sm text-muted-foreground">
              Basé sur votre contenu textuel et vos images, nous recommandons des modèles avec 
              {recommendedTemplates?.[0]?.imageSlots} emplacements d'images et une mise en page 
              {recommendedTemplates?.[0]?.complexity?.toLowerCase()} pour optimiser l'impact visuel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendedSection;