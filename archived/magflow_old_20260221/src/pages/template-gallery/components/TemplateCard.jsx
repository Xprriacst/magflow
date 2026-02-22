import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const TemplateCard = ({ template, onSelect, onPreview, isSelected, onCompare, isInComparison }) => {
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
        size={12}
        className={index < rating ? 'text-warning fill-current' : 'text-muted-foreground'}
      />
    ));
  };

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg ${
      isSelected ? 'ring-2 ring-primary shadow-lg' : ''
    } ${isInComparison ? 'ring-2 ring-accent' : ''}`}>
      {/* Template Preview Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={template?.previewImage}
          alt={`Aperçu du modèle ${template?.name}`}
          className="w-full h-full object-cover"
        />
        
        {/* AI Recommendation Badge */}
        {template?.isRecommended && (
          <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <Icon name="Sparkles" size={12} />
            <span>Recommandé</span>
          </div>
        )}

        {/* Template Type Badge */}
        <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm text-foreground px-2 py-1 rounded text-xs font-medium">
          {template?.type}
        </div>

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPreview(template)}
            iconName="Eye"
            iconPosition="left"
            iconSize={14}
          >
            Aperçu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCompare(template)}
            iconName="GitCompare"
            iconPosition="left"
            iconSize={14}
            className="bg-card/90 backdrop-blur-sm"
          >
            Comparer
          </Button>
        </div>
      </div>
      {/* Template Information */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-semibold text-foreground text-sm line-clamp-1">
            {template?.name}
          </h3>
          <div className="flex items-center space-x-1 ml-2">
            {getRatingStars(template?.rating)}
            <span className="text-xs text-muted-foreground ml-1">({template?.reviews})</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {template?.description}
        </p>

        {/* Template Specifications */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pages:</span>
            <span className="font-medium text-foreground">{template?.pageCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Images:</span>
            <span className="font-medium text-foreground">{template?.imageSlots}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Capacité texte:</span>
            <span className="font-medium text-foreground">{template?.textCapacity}</span>
          </div>
        </div>

        {/* Complexity and Compatibility */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template?.complexity)}`}>
            {template?.complexity}
          </span>
          <div className="flex items-center space-x-1">
            <Icon name="CheckCircle" size={12} className="text-success" />
            <span className="text-xs text-muted-foreground">InDesign {template?.indesignVersion}</span>
          </div>
        </div>

        {/* Processing Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <Icon name="Clock" size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Traitement: {template?.processingTime}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Users" size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{template?.usageCount}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant={isSelected ? "default" : "outline"}
          size="sm"
          fullWidth
          onClick={() => onSelect(template)}
          iconName={isSelected ? "Check" : "Plus"}
          iconPosition="left"
          iconSize={14}
        >
          {isSelected ? 'Sélectionné' : 'Sélectionner'}
        </Button>
      </div>
    </div>
  );
};

export default TemplateCard;