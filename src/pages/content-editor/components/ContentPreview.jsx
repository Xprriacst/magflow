import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const ContentPreview = ({ content, metadata, onExport, onTemplatePreview }) => {
  const [previewMode, setPreviewMode] = useState('article');
  const [selectedTemplate, setSelectedTemplate] = useState('magazine-moderne');

  const previewModes = [
    { value: 'article', label: 'Article complet', icon: 'FileText' },
    { value: 'resume', label: 'Résumé', icon: 'List' },
    { value: 'template', label: 'Aperçu modèle', icon: 'Layout' }
  ];

  const templateOptions = [
    { value: 'magazine-moderne', label: 'Magazine Moderne' },
    { value: 'lifestyle-elegant', label: 'Lifestyle Élégant' },
    { value: 'tech-minimal', label: 'Tech Minimal' },
    { value: 'culture-classique', label: 'Culture Classique' }
  ];

  const exportFormats = [
    { name: 'InDesign', format: 'indd', icon: 'FileText', description: 'Format natif InDesign' },
    { name: 'PDF', format: 'pdf', icon: 'FileText', description: 'Document portable' },
    { name: 'Word', format: 'docx', icon: 'FileText', description: 'Microsoft Word' },
    { name: 'HTML', format: 'html', icon: 'Code', description: 'Page web' }
  ];

  const contentAnalysis = {
    readingTime: Math.ceil((content?.replace(/<[^>]*>/g, '')?.split(' ')?.length || 0) / 200),
    difficulty: 'Intermédiaire',
    tone: 'Professionnel',
    keywords: ['technologie', 'innovation', 'magazine', 'édition'],
    seoScore: 85
  };

  const handleExport = (format) => {
    if (onExport) {
      onExport(format, { content, metadata, template: selectedTemplate });
    }
  };

  const handleTemplatePreview = () => {
    if (onTemplatePreview) {
      onTemplatePreview(selectedTemplate, { content, metadata });
    }
  };

  const renderArticlePreview = () => (
    <div className="prose prose-sm max-w-none">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
            {metadata?.categorie || 'Non catégorisé'}
          </span>
          <span>{metadata?.auteur || 'Auteur inconnu'}</span>
          <span>•</span>
          <span>{contentAnalysis?.readingTime} min de lecture</span>
        </div>
        
        <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
          {metadata?.titre || 'Titre de l\'article'}
        </h1>
        
        {metadata?.sousTitre && (
          <h2 className="text-lg text-muted-foreground font-normal mb-4">
            {metadata?.sousTitre}
          </h2>
        )}
      </div>
      
      <div 
        className="text-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content || '<p>Aucun contenu disponible</p>' }}
      />
      
      {metadata?.tags && metadata?.tags?.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {metadata?.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">
            {content?.replace(/<[^>]*>/g, '')?.split(' ')?.length || 0}
          </div>
          <div className="text-xs text-muted-foreground">Mots</div>
        </div>
        
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <div className="text-2xl font-bold text-accent">
            {contentAnalysis?.readingTime}
          </div>
          <div className="text-xs text-muted-foreground">Min lecture</div>
        </div>
        
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <div className="text-2xl font-bold text-success">
            {contentAnalysis?.seoScore}
          </div>
          <div className="text-xs text-muted-foreground">Score SEO</div>
        </div>
        
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <div className="text-2xl font-bold text-warning">
            {metadata?.tags?.length || 0}
          </div>
          <div className="text-xs text-muted-foreground">Mots-clés</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-border rounded-lg">
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Icon name="BarChart3" size={16} />
            Analyse du contenu
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Difficulté:</span>
              <span className="text-foreground">{contentAnalysis?.difficulty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ton:</span>
              <span className="text-foreground">{contentAnalysis?.tone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut:</span>
              <span className="text-foreground">{metadata?.statut || 'Brouillon'}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 border border-border rounded-lg">
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Icon name="Tag" size={16} />
            Mots-clés détectés
          </h4>
          <div className="flex flex-wrap gap-2">
            {contentAnalysis?.keywords?.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplatePreview = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          label="Modèle de prévisualisation"
          options={templateOptions}
          value={selectedTemplate}
          onChange={setSelectedTemplate}
          className="flex-1"
        />
        <Button
          variant="default"
          onClick={handleTemplatePreview}
          iconName="Eye"
          iconPosition="left"
          iconSize={16}
        >
          Prévisualiser
        </Button>
      </div>
      
      <div className="border border-border rounded-lg p-6 bg-muted/10">
        <div className="text-center text-muted-foreground">
          <Icon name="Layout" size={48} className="mx-auto mb-4 opacity-50" />
          <h4 className="font-medium mb-2">Aperçu du modèle</h4>
          <p className="text-sm">
            Sélectionnez un modèle et cliquez sur "Prévisualiser" pour voir le rendu final
          </p>
          <p className="text-xs mt-2">
            Modèle actuel: {templateOptions?.find(t => t?.value === selectedTemplate)?.label}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Icon name="Eye" size={20} className="text-primary" />
          <h3 className="font-heading font-semibold text-foreground">
            Aperçu du contenu
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {previewModes?.map((mode) => (
            <Button
              key={mode?.value}
              variant={previewMode === mode?.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode(mode?.value)}
              iconName={mode?.icon}
              iconPosition="left"
              iconSize={16}
            >
              {mode?.label}
            </Button>
          ))}
        </div>
      </div>
      {/* Preview Content */}
      <div className="p-6">
        {previewMode === 'article' && renderArticlePreview()}
        {previewMode === 'resume' && renderSummary()}
        {previewMode === 'template' && renderTemplatePreview()}
      </div>
      {/* Export Options */}
      <div className="border-t border-border p-4">
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Icon name="Download" size={16} />
          Options d'export
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {exportFormats?.map((format) => (
            <Button
              key={format?.format}
              variant="outline"
              size="sm"
              onClick={() => handleExport(format?.format)}
              iconName={format?.icon}
              iconPosition="left"
              iconSize={16}
              className="justify-start"
            >
              <div className="text-left">
                <div className="font-medium">{format?.name}</div>
                <div className="text-xs text-muted-foreground">{format?.description}</div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Info" size={16} />
            <span>
              L'export InDesign nécessite une connexion active à Adobe InDesign Server
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPreview;