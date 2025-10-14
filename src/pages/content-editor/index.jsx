import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import WorkflowProgress from '../../components/ui/WorkflowProgress';
import RichTextEditor from './components/RichTextEditor';
import ArticleMetadata from './components/ArticleMetadata';
import ContentVersioning from './components/ContentVersioning';
import ContentPreview from './components/ContentPreview';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const ContentEditor = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState({});
  const [activeTab, setActiveTab] = useState('editor');
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock initial content for demonstration
  useEffect(() => {
    const mockContent = `<h1>L'Avenir de l'Édition Numérique</h1>
<p>L'industrie de l'édition traverse une transformation majeure avec l'émergence de nouvelles technologies d'automatisation. Les éditeurs de magazines font face à des défis sans précédent en matière de production de contenu et de gestion des flux de travail.</p>

<h2>Les Défis Actuels</h2>
<p>La production traditionnelle de magazines nécessite une coordination complexe entre les équipes éditoriales, les designers et les équipes techniques. Cette approche manuelle est souvent source de retards et d'erreurs coûteuses.</p>

<blockquote>
"L'automatisation n'est pas l'ennemi de la créativité, mais son meilleur allié pour libérer le potentiel des équipes éditoriales." - Marie Dubois, Éditrice en Chef
</blockquote>

<h2>Solutions Innovantes</h2>
<p>Les nouvelles plateformes d'automatisation permettent aux éditeurs de se concentrer sur ce qu'ils font de mieux : créer du contenu de qualité. L'intégration avec des outils comme InDesign révolutionne la façon dont nous concevons la production éditoriale.</p>

<p>Cette évolution technologique ouvre de nouvelles perspectives pour l'industrie, permettant une production plus rapide, plus efficace et plus créative.</p>`;

    const mockMetadata = {
      titre: "L\'Avenir de l\'Édition Numérique",
      sousTitre: "Comment l\'automatisation transforme l\'industrie du magazine",
      auteur: "Marie Dubois",
      categorie: "technologie",
      tags: ["édition", "automatisation", "InDesign", "magazine"],
      statut: "revision",
      priorite: "haute"
    };

    setContent(mockContent);
    setMetadata(mockMetadata);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (content || Object.keys(metadata)?.length > 0) {
      setAutoSaveStatus('saving');
      const saveTimer = setTimeout(() => {
        // Simulate auto-save
        setAutoSaveStatus('saved');
      }, 1000);

      return () => clearTimeout(saveTimer);
    }
  }, [content, metadata]);

  const tabs = [
    { id: 'editor', name: 'Éditeur', icon: 'Edit3' },
    { id: 'metadata', name: 'Métadonnées', icon: 'Settings' },
    { id: 'versions', name: 'Versions', icon: 'GitBranch' },
    { id: 'preview', name: 'Aperçu', icon: 'Eye' }
  ];

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setAutoSaveStatus('saving');
  };

  const handleMetadataChange = (newMetadata) => {
    setMetadata(newMetadata);
    setAutoSaveStatus('saving');
  };

  const handleContentAnalysis = (analysis) => {
    setContentAnalysis(analysis);
  };

  const handleExport = (format, data) => {
    setIsLoading(true);
    // Simulate export process
    setTimeout(() => {
      setIsLoading(false);
      console.log(`Exporting to ${format}:`, data);
    }, 2000);
  };

  const handleTemplatePreview = (template, data) => {
    navigate('/template-preview', { 
      state: { 
        template, 
        content: data?.content, 
        metadata: data?.metadata 
      } 
    });
  };

  const handleNextStep = () => {
    if (contentAnalysis?.wordCount > 0 && metadata?.titre) {
      navigate('/image-manager', { 
        state: { 
          content, 
          metadata, 
          contentAnalysis 
        } 
      });
    }
  };

  const getAutoSaveIcon = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return { name: 'Loader2', className: 'animate-spin text-warning' };
      case 'saved':
        return { name: 'CheckCircle', className: 'text-success' };
      case 'error':
        return { name: 'AlertCircle', className: 'text-error' };
      default:
        return { name: 'Clock', className: 'text-muted-foreground' };
    }
  };

  const autoSaveIcon = getAutoSaveIcon();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WorkflowProgress />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Éditeur de Contenu
            </h1>
            <p className="text-muted-foreground mt-1">
              Créez et formatez votre contenu éditorial avec des outils professionnels
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon 
                name={autoSaveIcon?.name} 
                size={16} 
                className={autoSaveIcon?.className}
              />
              <span>
                {autoSaveStatus === 'saving' && 'Sauvegarde...'}
                {autoSaveStatus === 'saved' && 'Sauvegardé'}
                {autoSaveStatus === 'error' && 'Erreur de sauvegarde'}
              </span>
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              iconName="ArrowLeft"
              iconPosition="left"
              iconSize={16}
            >
              Retour
            </Button>
            
            <Button
              variant="default"
              onClick={handleNextStep}
              iconName="ArrowRight"
              iconPosition="right"
              iconSize={16}
              disabled={!contentAnalysis?.wordCount || !metadata?.titre}
            >
              Étape suivante
            </Button>
          </div>
        </div>

        {/* Content Analysis Summary */}
        {contentAnalysis && (
          <div className="mb-6 p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Icon name="FileText" size={16} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {contentAnalysis?.wordCount} mots
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Clock" size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    ~{Math.ceil(contentAnalysis?.wordCount / 200)} min de lecture
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Target" size={16} className="text-accent" />
                  <span className="text-sm text-muted-foreground">
                    Type: {contentAnalysis?.contentType}
                  </span>
                </div>
              </div>
              
              {contentAnalysis?.wordCount > 100 && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <Icon name="Sparkles" size={16} />
                  <span>Prêt pour l'IA de recommandation</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              {tabs?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                    activeTab === tab?.id
                      ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  <Icon name={tab?.icon} size={16} />
                  {tab?.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === 'editor' && (
              <RichTextEditor
                content={content}
                onChange={handleContentChange}
                onContentAnalysis={handleContentAnalysis}
              />
            )}
            
            {activeTab === 'metadata' && (
              <ArticleMetadata
                metadata={metadata}
                onChange={handleMetadataChange}
                onValidate={(isValid, errors) => {
                  console.log('Validation:', isValid, errors);
                }}
              />
            )}
            
            {activeTab === 'versions' && (
              <ContentVersioning
                currentVersion="v1.2"
                versions={[
                  { id: 'v1.2', name: 'Version 1.2', date: '2024-01-15', status: 'current' },
                  { id: 'v1.1', name: 'Version 1.1', date: '2024-01-10', status: 'archived' },
                  { id: 'v1.0', name: 'Version 1.0', date: '2024-01-05', status: 'archived' }
                ]}
                onVersionSelect={(version) => {
                  console.log('Selected version:', version);
                }}
                onCreateVersion={(version) => {
                  console.log('Created version:', version);
                }}
                onDeleteVersion={(version) => {
                  console.log('Deleted version:', version);
                }}
              />
            )}
            
            {activeTab === 'preview' && (
              <ContentPreview
                content={content}
                metadata={metadata}
                onExport={handleExport}
                onTemplatePreview={handleTemplatePreview}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Icon name="BarChart3" size={16} />
                Statistiques rapides
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Mots:</span>
                  <span className="text-sm font-medium text-foreground">
                    {contentAnalysis?.wordCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Caractères:</span>
                  <span className="text-sm font-medium text-foreground">
                    {contentAnalysis?.characterCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <span className="text-sm font-medium text-foreground">
                    {metadata?.statut || 'Brouillon'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Catégorie:</span>
                  <span className="text-sm font-medium text-foreground">
                    {metadata?.categorie || 'Non définie'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Icon name="Zap" size={16} />
                Actions rapides
              </h3>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  iconName="Save"
                  iconPosition="left"
                  iconSize={16}
                  disabled={autoSaveStatus === 'saving'}
                >
                  Sauvegarder manuellement
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  iconName="Copy"
                  iconPosition="left"
                  iconSize={16}
                >
                  Dupliquer l'article
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  iconName="Share"
                  iconPosition="left"
                  iconSize={16}
                >
                  Partager pour révision
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  iconName="Download"
                  iconPosition="left"
                  iconSize={16}
                  loading={isLoading}
                >
                  Export rapide
                </Button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Icon name="Lightbulb" size={16} />
                Conseils d'édition
              </h3>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle" size={14} className="text-success mt-0.5 flex-shrink-0" />
                  <span>Utilisez Ctrl+B, Ctrl+I, Ctrl+U pour le formatage rapide</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle" size={14} className="text-success mt-0.5 flex-shrink-0" />
                  <span>L'IA recommande des modèles à partir de 100 mots</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle" size={14} className="text-success mt-0.5 flex-shrink-0" />
                  <span>Ajoutez des métadonnées pour une meilleure organisation</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle" size={14} className="text-success mt-0.5 flex-shrink-0" />
                  <span>La sauvegarde automatique se fait toutes les 30 secondes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;