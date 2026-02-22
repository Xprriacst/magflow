import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressIndicator = ({ 
  currentStep, 
  totalSteps, 
  progress, 
  estimatedTime, 
  status 
}) => {
  const steps = [
    { id: 'validation', name: 'Validation du contenu', icon: 'CheckCircle' },
    { id: 'optimization', name: 'Optimisation des images', icon: 'Image' },
    { id: 'placement', name: 'Placement du contenu', icon: 'Layout' },
    { id: 'generation', name: 'Génération InDesign', icon: 'FileText' },
    { id: 'export', name: 'Export final', icon: 'Download' }
  ];

  const getStepStatus = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing': return 'bg-primary';
      case 'paused': return 'bg-warning';
      case 'error': return 'bg-error';
      case 'completed': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-heading font-semibold text-foreground">
          Progression du traitement
        </h2>
        <div className="text-right">
          <div className="text-sm font-medium text-foreground">
            {progress}% terminé
          </div>
          <div className="text-xs text-muted-foreground">
            Temps estimé: {estimatedTime}
          </div>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-muted rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getStatusColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
      {/* Steps */}
      <div className="space-y-4">
        {steps?.map((step, index) => {
          const stepStatus = getStepStatus(index);
          
          return (
            <div key={step?.id} className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                stepStatus === 'completed' 
                  ? 'bg-success text-success-foreground' 
                  : stepStatus === 'current' ?'bg-primary text-primary-foreground animate-pulse' :'bg-muted text-muted-foreground'
              }`}>
                {stepStatus === 'completed' ? (
                  <Icon name="Check" size={16} />
                ) : (
                  <Icon name={step?.icon} size={16} />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${
                  stepStatus === 'current' ?'text-primary' 
                    : stepStatus === 'completed' ?'text-success' :'text-muted-foreground'
                }`}>
                  {step?.name}
                </div>
                {stepStatus === 'current' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    En cours de traitement...
                  </div>
                )}
              </div>
              {stepStatus === 'current' && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;