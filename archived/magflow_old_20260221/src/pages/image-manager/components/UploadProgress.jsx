import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UploadProgress = ({ uploads, onCancel, onRetry }) => {
  if (!uploads || uploads?.length === 0) return null;

  const totalProgress = uploads?.reduce((sum, upload) => sum + upload?.progress, 0) / uploads?.length;
  const completedUploads = uploads?.filter(upload => upload?.status === 'completed')?.length;
  const failedUploads = uploads?.filter(upload => upload?.status === 'error')?.length;

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Téléchargement en cours
        </h3>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{completedUploads}/{uploads?.length} terminé(s)</span>
          {failedUploads > 0 && (
            <span className="text-error">• {failedUploads} erreur(s)</span>
          )}
        </div>
      </div>
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Progression globale</span>
          <span className="text-muted-foreground">{Math.round(totalProgress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>
      {/* Individual Files */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {uploads?.map((upload) => (
          <div key={upload?.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex-shrink-0">
              {upload?.status === 'uploading' && (
                <Icon name="Loader2" size={16} className="text-primary animate-spin" />
              )}
              {upload?.status === 'completed' && (
                <Icon name="CheckCircle" size={16} className="text-success" />
              )}
              {upload?.status === 'error' && (
                <Icon name="XCircle" size={16} className="text-error" />
              )}
              {upload?.status === 'pending' && (
                <Icon name="Clock" size={16} className="text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {upload?.name}
                </p>
                <span className="text-xs text-muted-foreground">
                  {upload?.status === 'uploading' && `${upload?.progress}%`}
                  {upload?.status === 'completed' && 'Terminé'}
                  {upload?.status === 'error' && 'Erreur'}
                  {upload?.status === 'pending' && 'En attente'}
                </span>
              </div>
              
              {upload?.status === 'uploading' && (
                <div className="w-full bg-background rounded-full h-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${upload?.progress}%` }}
                  />
                </div>
              )}
              
              {upload?.status === 'error' && (
                <p className="text-xs text-error">{upload?.error}</p>
              )}
            </div>
            
            <div className="flex-shrink-0 flex items-center space-x-1">
              {upload?.status === 'uploading' && (
                <Button
                  variant="ghost"
                  size="xs"
                  iconName="X"
                  onClick={() => onCancel(upload?.id)}
                />
              )}
              {upload?.status === 'error' && (
                <Button
                  variant="ghost"
                  size="xs"
                  iconName="RotateCcw"
                  onClick={() => onRetry(upload?.id)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Actions */}
      {failedUploads > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {failedUploads} fichier(s) en erreur
          </span>
          <Button
            variant="outline"
            size="sm"
            iconName="RotateCcw"
            iconPosition="left"
            onClick={() => {
              const failedIds = uploads?.filter(upload => upload?.status === 'error')?.map(upload => upload?.id);
              failedIds?.forEach(id => onRetry(id));
            }}
          >
            Réessayer tout
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadProgress;