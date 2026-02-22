import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProcessingHeader = ({ 
  currentProject, 
  onPauseResume, 
  onCancel, 
  isPaused, 
  isProcessing 
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="Settings" size={20} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Traitement en cours
            </h1>
            <p className="text-sm text-muted-foreground">
              Génération automatique du modèle InDesign
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={isPaused ? "default" : "outline"}
            size="sm"
            onClick={onPauseResume}
            disabled={!isProcessing}
            iconName={isPaused ? "Play" : "Pause"}
            iconPosition="left"
            iconSize={16}
          >
            {isPaused ? "Reprendre" : "Suspendre"}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onCancel}
            disabled={!isProcessing}
            iconName="X"
            iconPosition="left"
            iconSize={16}
          >
            Annuler
          </Button>
        </div>
      </div>
      {currentProject && (
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground mb-1">
                {currentProject?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Modèle: {currentProject?.template} • Articles: {currentProject?.articleCount}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                Priorité: {currentProject?.priority}
              </div>
              <div className="text-xs text-muted-foreground">
                Démarré: {currentProject?.startTime}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingHeader;