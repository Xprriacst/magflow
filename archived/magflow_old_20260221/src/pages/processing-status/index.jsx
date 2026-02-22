import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import WorkflowProgress from '../../components/ui/WorkflowProgress';
import ProcessingHeader from './components/ProcessingHeader';
import ProgressIndicator from './components/ProgressIndicator';
import ProcessingLogs from './components/ProcessingLogs';
import BatchProcessingPanel from './components/BatchProcessingPanel';
import ErrorHandlingPanel from './components/ErrorHandlingPanel';
import ProcessingHistory from './components/ProcessingHistory';
import Button from '../../components/ui/Button';


const ProcessingStatus = () => {
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState({
    id: 'proj_001',
    name: 'Magazine Lifestyle Automne 2025',
    template: 'Modèle Élégance',
    articleCount: 12,
    priority: 'Élevée',
    startTime: '14:32'
  });

  const [processingState, setProcessingState] = useState({
    status: 'processing', // processing, paused, completed, error
    currentStep: 2,
    totalSteps: 5,
    progress: 65,
    estimatedTime: '8 min',
    isPaused: false,
    isProcessing: true
  });

  const [logs, setLogs] = useState([
    {
      type: 'info',
      message: 'Démarrage du traitement pour le projet "Magazine Lifestyle Automne 2025"',
      timestamp: '14:32:15',
      details: 'Initialisation des paramètres de traitement et validation des ressources'
    },
    {
      type: 'success',
      message: 'Validation du contenu terminée avec succès',
      timestamp: '14:32:45',
      details: '12 articles validés, 0 erreur détectée'
    },
    {
      type: 'info',
      message: 'Début de l\'optimisation des images',
      timestamp: '14:33:12',
      details: 'Traitement de 24 images haute résolution'
    },
    {
      type: 'warning',
      message: 'Image "hero-lifestyle.jpg" redimensionnée automatiquement',
      timestamp: '14:33:28',
      details: 'Résolution originale 4K réduite à 300 DPI pour l\'impression'
    },
    {
      type: 'success',
      message: 'Optimisation des images terminée',
      timestamp: '14:34:05',
      details: '24 images optimisées, gain de 35% sur la taille totale'
    },
    {
      type: 'info',
      message: 'Placement du contenu en cours...',
      timestamp: '14:34:18',
      details: 'Application du modèle "Élégance" aux 12 articles'
    }
  ]);

  const [batchQueue, setBatchQueue] = useState([
    {
      id: 'proj_001',
      name: 'Magazine Lifestyle Automne 2025',
      template: 'Modèle Élégance',
      articleCount: 12,
      status: 'processing',
      priority: 'Élevée',
      progress: 65,
      estimatedTime: '8 min'
    },
    {
      id: 'proj_002',
      name: 'Guide Voyage Hiver 2025',
      template: 'Modèle Aventure',
      articleCount: 8,
      status: 'queued',
      priority: 'Normale',
      progress: 0,
      estimatedTime: '12 min'
    },
    {
      id: 'proj_003',
      name: 'Dossier Tech Innovation',
      template: 'Modèle Corporate',
      articleCount: 15,
      status: 'queued',
      priority: 'Urgent',
      progress: 0,
      estimatedTime: '18 min'
    },
    {
      id: 'proj_004',
      name: 'Magazine Cuisine Festive',
      template: 'Modèle Gourmand',
      articleCount: 10,
      status: 'completed',
      priority: 'Normale',
      progress: 100,
      estimatedTime: '0 min'
    }
  ]);

  const [errors, setErrors] = useState([
    {
      id: 'err_001',
      severity: 'warning',
      title: 'Qualité d\'image insuffisante',
      message: 'L\'image "hero-banner.jpg" a une résolution inférieure à 300 DPI',
      code: 'IMG_LOW_RES',
      component: 'ImageProcessor',
      timestamp: '14:33:28',
      canRetry: true,
      technicalDetails: `Image Resolution: 150 DPI\nRequired: 300 DPI\nFile: /uploads/hero-banner.jpg\nSize: 1920x1080px`,
      troubleshooting: [
        'Remplacez l\'image par une version haute résolution',
        'Utilisez un outil de redimensionnement professionnel',
        'Vérifiez les paramètres d\'export de votre logiciel de création'
      ],
      documentation: [
        { title: 'Guide des résolutions d\'image', url: '#' },
        { title: 'Optimisation pour l\'impression', url: '#' }
      ]
    },
    {
      id: 'err_002',
      severity: 'info',
      title: 'Connexion InDesign lente',
      message: 'La communication avec InDesign Server prend plus de temps que prévu',
      code: 'INDD_SLOW_CONN',
      component: 'InDesignConnector',
      timestamp: '14:34:45',
      canRetry: false,
      technicalDetails: `Connection Timeout: 30s\nCurrent Response Time: 25s\nServer: indesign-server-01\nStatus: Connected`,
      troubleshooting: [
        'Vérifiez votre connexion réseau',
        'Redémarrez InDesign Server si nécessaire',
        'Contactez l\'administrateur système'
      ]
    }
  ]);

  const [processingHistory, setProcessingHistory] = useState([
    {
      id: 'hist_001',
      projectName: 'Magazine Mode Été 2025',
      template: 'Modèle Tendance',
      articleCount: 14,
      status: 'completed',
      completedAt: '2025-01-12T13:45:00Z',
      processingTime: 15,
      fileSize: '45.2 MB',
      qualityScore: 9,
      notes: 'Traitement parfait, aucune intervention manuelle requise'
    },
    {
      id: 'hist_002',
      projectName: 'Guide Santé Bien-être',
      template: 'Modèle Wellness',
      articleCount: 18,
      status: 'completed',
      completedAt: '2025-01-12T11:20:00Z',
      processingTime: 22,
      fileSize: '52.8 MB',
      qualityScore: 8,
      notes: 'Quelques ajustements mineurs sur les espacements'
    },
    {
      id: 'hist_003',
      projectName: 'Dossier Économie Q4',
      template: 'Modèle Business',
      articleCount: 20,
      status: 'failed',
      completedAt: '2025-01-12T09:15:00Z',
      processingTime: 8,
      fileSize: '0 MB',
      qualityScore: 0,
      notes: 'Erreur de connexion InDesign Server - Retraitement nécessaire'
    },
    {
      id: 'hist_004',
      projectName: 'Magazine Culture Urbaine',
      template: 'Modèle Street',
      articleCount: 16,
      status: 'cancelled',
      completedAt: '2025-01-12T08:30:00Z',
      processingTime: 5,
      fileSize: '0 MB',
      qualityScore: 0,
      notes: 'Annulé par l\'utilisateur pour modifications du contenu'
    }
  ]);

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh || !processingState?.isProcessing) return;

    const interval = setInterval(() => {
      setProcessingState(prev => {
        if (prev?.progress >= 100) {
          return { ...prev, status: 'completed', isProcessing: false };
        }
        
        const newProgress = Math.min(prev?.progress + Math.random() * 5, 100);
        const newStep = Math.floor((newProgress / 100) * prev?.totalSteps);
        
        return {
          ...prev,
          progress: Math.round(newProgress),
          currentStep: Math.max(newStep, prev?.currentStep),
          estimatedTime: `${Math.max(1, Math.round((100 - newProgress) / 8))} min`
        };
      });

      // Add random log entries
      if (Math.random() < 0.3) {
        const logMessages = [
          'Traitement de l\'article "Tendances Automne 2025"',
          'Application des styles typographiques',
          'Ajustement automatique des espacements',
          'Génération des pages de contenu',
          'Optimisation de la mise en page'
        ];
        
        const newLog = {
          type: 'info',
          message: logMessages?.[Math.floor(Math.random() * logMessages?.length)],
          timestamp: new Date()?.toLocaleTimeString('fr-FR'),
          details: 'Traitement automatique en cours'
        };
        
        setLogs(prev => [...prev, newLog]?.slice(-20));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, processingState?.isProcessing]);

  const handlePauseResume = () => {
    setProcessingState(prev => ({
      ...prev,
      isPaused: !prev?.isPaused,
      status: prev?.isPaused ? 'processing' : 'paused'
    }));
  };

  const handleCancel = () => {
    setProcessingState(prev => ({
      ...prev,
      status: 'cancelled',
      isProcessing: false
    }));
  };

  const handleRefreshLogs = () => {
    const newLog = {
      type: 'info',
      message: 'Actualisation manuelle des journaux',
      timestamp: new Date()?.toLocaleTimeString('fr-FR'),
      details: 'Journaux mis à jour par l\'utilisateur'
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handlePriorityChange = (projectId, direction) => {
    setBatchQueue(prev => {
      const index = prev?.findIndex(p => p?.id === projectId);
      if (index === -1) return prev;
      
      const newQueue = [...prev];
      const project = newQueue?.[index];
      
      if (direction === 'up' && index > 0) {
        [newQueue[index], newQueue[index - 1]] = [newQueue?.[index - 1], newQueue?.[index]];
      } else if (direction === 'down' && index < newQueue?.length - 1) {
        [newQueue[index], newQueue[index + 1]] = [newQueue?.[index + 1], newQueue?.[index]];
      }
      
      return newQueue;
    });
  };

  const handleRemoveFromQueue = (projectId) => {
    setBatchQueue(prev => prev?.filter(p => p?.id !== projectId));
  };

  const handleViewProject = (projectId) => {
    navigate('/template-preview', { state: { projectId } });
  };

  const handleRetryError = (errorId) => {
    setErrors(prev => prev?.filter(e => e?.id !== errorId));
  };

  const handleDismissError = (errorId) => {
    setErrors(prev => prev?.filter(e => e?.id !== errorId));
  };

  const handleContactSupport = () => {
    // Mock support contact
    alert('Redirection vers le support technique...');
  };

  const handleViewHistoryDetails = (historyId) => {
    navigate('/template-preview', { state: { historyId } });
  };

  const handleReprocess = (historyId) => {
    const historyItem = processingHistory?.find(h => h?.id === historyId);
    if (historyItem) {
      // Add to batch queue for reprocessing
      const newProject = {
        id: `proj_${Date.now()}`,
        name: historyItem?.projectName,
        template: historyItem?.template,
        articleCount: historyItem?.articleCount,
        status: 'queued',
        priority: 'Normale',
        progress: 0,
        estimatedTime: `${historyItem?.processingTime} min`
      };
      setBatchQueue(prev => [...prev, newProject]);
    }
  };

  const handleDownload = (historyId) => {
    // Mock download
    alert(`Téléchargement du projet ${historyId} en cours...`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WorkflowProgress />
      <main className="pt-4 pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <ProcessingHeader
            currentProject={currentProject}
            onPauseResume={handlePauseResume}
            onCancel={handleCancel}
            isPaused={processingState?.isPaused}
            isProcessing={processingState?.isProcessing}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ProgressIndicator
                currentStep={processingState?.currentStep}
                totalSteps={processingState?.totalSteps}
                progress={processingState?.progress}
                estimatedTime={processingState?.estimatedTime}
                status={processingState?.status}
              />

              <ProcessingLogs
                logs={logs}
                onRefresh={handleRefreshLogs}
                autoRefresh={autoRefresh}
              />
            </div>

            <div className="space-y-6">
              <BatchProcessingPanel
                batchQueue={batchQueue}
                onPriorityChange={handlePriorityChange}
                onRemoveFromQueue={handleRemoveFromQueue}
                onViewProject={handleViewProject}
              />

              <ErrorHandlingPanel
                errors={errors}
                onRetry={handleRetryError}
                onDismiss={handleDismissError}
                onContactSupport={handleContactSupport}
                onViewDetails={handleContactSupport}
              />
            </div>
          </div>

          <ProcessingHistory
            history={processingHistory}
            onViewDetails={handleViewHistoryDetails}
            onReprocess={handleReprocess}
            onDownload={handleDownload}
          />

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
              Actions rapides
            </h2>
            
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/content-editor')}
                iconName="Edit3"
                iconPosition="left"
                iconSize={16}
              >
                Modifier le contenu
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/template-gallery')}
                iconName="Layout"
                iconPosition="left"
                iconSize={16}
              >
                Changer de modèle
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                iconName="FolderOpen"
                iconPosition="left"
                iconSize={16}
              >
                Retour aux projets
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setAutoRefresh(!autoRefresh)}
                iconName={autoRefresh ? "Pause" : "Play"}
                iconPosition="left"
                iconSize={16}
              >
                {autoRefresh ? "Désactiver" : "Activer"} auto-actualisation
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProcessingStatus;