import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BatchProcessingPanel = ({ 
  batchQueue, 
  onPriorityChange, 
  onRemoveFromQueue,
  onViewProject 
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return { name: 'Play', color: 'text-primary', bg: 'bg-primary/10' };
      case 'queued': return { name: 'Clock', color: 'text-warning', bg: 'bg-warning/10' };
      case 'completed': return { name: 'CheckCircle', color: 'text-success', bg: 'bg-success/10' };
      case 'error': return { name: 'XCircle', color: 'text-error', bg: 'bg-error/10' };
      case 'paused': return { name: 'Pause', color: 'text-muted-foreground', bg: 'bg-muted' };
      default: return { name: 'Circle', color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-error bg-error/10';
      case 'Élevée': return 'text-warning bg-warning/10';
      case 'Normale': return 'text-primary bg-primary/10';
      case 'Faible': return 'text-muted-foreground bg-muted';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const totalProjects = batchQueue?.length;
  const completedProjects = batchQueue?.filter(p => p?.status === 'completed')?.length;
  const processingProjects = batchQueue?.filter(p => p?.status === 'processing')?.length;
  const queuedProjects = batchQueue?.filter(p => p?.status === 'queued')?.length;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-heading font-semibold text-foreground">
          Traitement par lots
        </h2>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span className="text-muted-foreground">Terminé: {completedProjects}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-muted-foreground">En cours: {processingProjects}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-warning rounded-full" />
            <span className="text-muted-foreground">En attente: {queuedProjects}</span>
          </div>
        </div>
      </div>
      {/* Batch Overview */}
      <div className="bg-muted rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Progression globale
          </span>
          <span className="text-sm text-muted-foreground">
            {completedProjects}/{totalProjects} projets
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-2">
          <div 
            className="bg-success h-2 rounded-full transition-all duration-500"
            style={{ width: `${totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0}%` }}
          />
        </div>
      </div>
      {/* Queue List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {batchQueue?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Layers" size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun projet en file d'attente</p>
          </div>
        ) : (
          batchQueue?.map((project, index) => {
            const statusConfig = getStatusIcon(project?.status);
            
            return (
              <div key={project?.id} className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusConfig?.bg}`}>
                      <Icon 
                        name={statusConfig?.name} 
                        size={16} 
                        className={statusConfig?.color}
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-foreground">
                        {project?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {project?.template} • {project?.articleCount} articles
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(project?.priority)}`}>
                      {project?.priority}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewProject(project?.id)}
                        className="w-8 h-8"
                      >
                        <Icon name="Eye" size={14} />
                      </Button>
                      
                      {project?.status === 'queued' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPriorityChange(project?.id, 'up')}
                            className="w-8 h-8"
                            title="Augmenter la priorité"
                          >
                            <Icon name="ChevronUp" size={14} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPriorityChange(project?.id, 'down')}
                            className="w-8 h-8"
                            title="Diminuer la priorité"
                          >
                            <Icon name="ChevronDown" size={14} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveFromQueue(project?.id)}
                            className="w-8 h-8 text-error hover:text-error"
                            title="Retirer de la file"
                          >
                            <Icon name="X" size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-muted-foreground">
                      Position: #{index + 1}
                    </span>
                    {project?.estimatedTime && (
                      <span className="text-muted-foreground">
                        Temps estimé: {project?.estimatedTime}
                      </span>
                    )}
                  </div>
                  
                  {project?.progress > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-background rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${project?.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {project?.progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BatchProcessingPanel;