import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const TemplatePreviewModal = ({ template, onClose, onSelect, onCompare }) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!template) return null;

  const mockPages = Array.from({ length: template?.pageCount }, (_, index) => ({
    id: index + 1,
    title: `Page ${index + 1}`,
    previewImage: `https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop&crop=center&q=80`
  }));

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
        size={16}
        className={index < rating ? 'text-warning fill-current' : 'text-muted-foreground'}
      />
    ));
  };

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % mockPages?.length);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + mockPages?.length) % mockPages?.length);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-modal w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground">
                {template?.name}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1">
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
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
          {/* Preview Area */}
          <div className="flex-1 p-6 bg-muted/30">
            <div className="h-full flex flex-col">
              {/* Page Navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">
                    Page {currentPage + 1} sur {mockPages?.length}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template?.complexity)}`}>
                    {template?.complexity}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={mockPages?.length <= 1}
                    iconName="ChevronLeft"
                    iconSize={16}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={mockPages?.length <= 1}
                    iconName="ChevronRight"
                    iconSize={16}
                  />
                </div>
              </div>

              {/* Page Preview */}
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full aspect-[3/4] overflow-hidden">
                  <Image
                    src={mockPages?.[currentPage]?.previewImage}
                    alt={`${template?.name} - ${mockPages?.[currentPage]?.title}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Page Thumbnails */}
              {mockPages?.length > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-4 overflow-x-auto pb-2">
                  {mockPages?.map((page, index) => (
                    <button
                      key={page?.id}
                      onClick={() => setCurrentPage(index)}
                      className={`flex-shrink-0 w-12 h-16 rounded border-2 overflow-hidden transition-all duration-150 ${
                        index === currentPage 
                          ? 'border-primary shadow-sm' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <Image
                        src={page?.previewImage}
                        alt={page?.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-border bg-card overflow-y-auto">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {template?.description}
                </p>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-3">Spécifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon name="FileText" size={14} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Pages</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{template?.pageCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon name="Image" size={14} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Images</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{template?.imageSlots}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon name="Type" size={14} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Capacité texte</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{template?.textCapacity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon name="Clock" size={14} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Traitement</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{template?.processingTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon name="Settings" size={14} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">InDesign</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{template?.indesignVersion}</span>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-3">Statistiques</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Utilisations</span>
                    <span className="text-sm font-medium text-foreground">{template?.usageCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium text-foreground">{template?.type}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Button
                  variant="default"
                  size="sm"
                  fullWidth
                  onClick={() => onSelect(template)}
                  iconName="Check"
                  iconPosition="left"
                  iconSize={16}
                >
                  Sélectionner ce modèle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => onCompare(template)}
                  iconName="GitCompare"
                  iconPosition="left"
                  iconSize={16}
                >
                  Ajouter à la comparaison
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;