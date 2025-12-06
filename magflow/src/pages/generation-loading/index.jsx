import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import WorkflowProgress from '../../components/ui/WorkflowProgress';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const GenerationLoading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management for loading progress
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(45);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Processing steps
  const processingSteps = [
    {
      id: 'sending',
      title: 'Envoi de la requête',
      description: 'Transmission des données vers InDesign',
      duration: 2000,
      status: 'idle'
    },
    {
      id: 'processing',
      title: 'Traitement par InDesign',
      description: 'Génération du template et mise en page',
      duration: 25000,
      status: 'idle'
    },
    {
      id: 'finalizing',
      title: 'Finalisation du template',
      description: 'Optimisation et validation finale',
      duration: 8000,
      status: 'idle'
    }
  ];

  const [steps, setSteps] = useState(processingSteps);

  // Load template data from previous step
  useEffect(() => {
    const templateData = location?.state?.template || JSON.parse(localStorage.getItem('magflow_selected_template') || '{}');
    const approvalData = location?.state?.approval || JSON.parse(localStorage.getItem('magflow_approval') || '{}');
    
    // Start the generation process
    startGeneration();
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startGeneration = async () => {
    const totalDuration = steps?.reduce((acc, step) => acc + step?.duration, 0);
    let currentProgress = 0;

    // Process each step
    for (let i = 0; i < steps?.length; i++) {
      setCurrentStep(i);
      
      // Update step status to 'in-progress'
      setSteps(prev => prev?.map((step, index) => 
        index === i ? { ...step, status: 'in-progress' } : step
      ));

      // Simulate step progress
      const stepDuration = steps?.[i]?.duration;
      const stepStartProgress = currentProgress;
      const stepProgressIncrement = (stepDuration / totalDuration) * 100;

      // Animate progress within the step
      for (let j = 0; j <= 100; j += 2) {
        const stepProgress = (j / 100) * stepProgressIncrement;
        setProgress(stepStartProgress + stepProgress);
        
        // Update estimated remaining time
        const remainingProgress = 100 - (stepStartProgress + stepProgress);
        const remainingTime = Math.round((remainingProgress / 100) * 35);
        setEstimatedTime(Math.max(5, remainingTime));
        
        await new Promise(resolve => setTimeout(resolve, stepDuration / 50));
      }

      // Mark step as completed
      setSteps(prev => prev?.map((step, index) => 
        index === i ? { ...step, status: 'completed' } : step
      ));

      currentProgress += stepProgressIncrement;
    }

    // Generation complete
    setProgress(100);
    setEstimatedTime(0);
    
    // Wait a moment then navigate to results
    setTimeout(() => {
      navigate('/processing-status', { 
        state: { 
          generationComplete: true,
          template: location?.state?.template
        } 
      });
    }, 2000);
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    navigate('/template-preview');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins?.toString()?.padStart(2, '0')}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed': return 'CheckCircle';
      case 'in-progress': return 'Clock';
      default: return 'Circle';
    }
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--color-success)';
      case 'in-progress': return 'var(--color-primary)';
      default: return 'var(--color-muted-foreground)';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WorkflowProgress />
      <div className="pt-32">
        {/* Main Loading Section */}
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="Zap" size={32} className="text-primary animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Génération en cours...
            </h1>
            <p className="text-lg text-muted-foreground">
              Votre template est en cours de traitement par InDesign
            </p>
          </div>

          {/* Progress Section */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progression</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Current Step Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Étape actuelle</h3>
                <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Icon 
                    name={getStepIcon(steps?.[currentStep]?.status)} 
                    size={20} 
                    color={getStepColor(steps?.[currentStep]?.status)}
                  />
                  <div>
                    <p className="font-medium text-foreground">{steps?.[currentStep]?.title}</p>
                    <p className="text-sm text-muted-foreground">{steps?.[currentStep]?.description}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Temps estimé</h3>
                <div className="p-3 bg-muted/30 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Temps restant</p>
                      <p className="text-lg font-semibold text-foreground">
                        ~{estimatedTime} secondes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Temps écoulé</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatTime(elapsedTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps Progress */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Détail des étapes</h3>
              <div className="space-y-3">
                {steps?.map((step, index) => (
                  <div 
                    key={step?.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-300 ${
                      step?.status === 'completed' ? 'bg-success/5 border-success/20' :
                      step?.status === 'in-progress'? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-border'
                    }`}
                  >
                    <Icon 
                      name={getStepIcon(step?.status)} 
                      size={20} 
                      color={getStepColor(step?.status)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{step?.title}</p>
                      <p className="text-sm text-muted-foreground">{step?.description}</p>
                    </div>
                    {step?.status === 'completed' && (
                      <div className="text-sm text-success font-medium">Terminé</div>
                    )}
                    {step?.status === 'in-progress' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <div className="text-sm text-primary font-medium">En cours</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name="Server" size={20} className="text-success" />
                <div>
                  <p className="font-medium text-foreground">Connexion InDesign</p>
                  <p className="text-sm text-success">Statut : Connecté et opérationnel</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-success font-medium">En ligne</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              iconName="X"
              iconPosition="left"
              iconSize={16}
              className="px-6"
            >
              Annuler la génération
            </Button>
          </div>
        </div>
      </div>
      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-modal w-full max-w-md">
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <Icon name="AlertTriangle" size={20} className="text-warning" />
                <h3 className="font-heading font-semibold text-foreground">
                  Annuler la génération ?
                </h3>
              </div>
            </div>

            <div className="p-4">
              <p className="text-muted-foreground mb-4">
                Êtes-vous sûr de vouloir annuler la génération en cours ? 
                Tout le progrès actuel sera perdu et vous devrez recommencer.
              </p>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <p className="text-sm text-warning">
                  <Icon name="Info" size={14} className="inline mr-1" />
                  Cette action ne peut pas être annulée.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-border flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1"
              >
                Continuer la génération
              </Button>
              <Button
                variant="outline"
                onClick={confirmCancel}
                className="flex-1 text-error border-error hover:bg-error hover:text-white"
              >
                Oui, annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerationLoading;