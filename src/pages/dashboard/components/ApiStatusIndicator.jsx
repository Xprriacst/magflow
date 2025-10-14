import React from 'react';
import Icon from '../../../components/AppIcon';

const ApiStatusIndicator = ({ status, lastSync }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return {
          icon: 'CheckCircle',
          color: 'var(--color-success)',
          bgColor: 'bg-success/10',
          text: 'InDesign API Connecté',
          description: 'Tous les services fonctionnent normalement'
        };
      case 'error':
        return {
          icon: 'XCircle',
          color: 'var(--color-error)',
          bgColor: 'bg-error/10',
          text: 'Erreur de Connexion',
          description: 'Impossible de se connecter à InDesign API'
        };
      case 'processing':
        return {
          icon: 'Clock',
          color: 'var(--color-warning)',
          bgColor: 'bg-warning/10',
          text: 'Traitement en Cours',
          description: 'Génération de modèles en cours...'
        };
      default:
        return {
          icon: 'AlertCircle',
          color: 'var(--color-muted-foreground)',
          bgColor: 'bg-muted/50',
          text: 'Statut Inconnu',
          description: 'Vérification du statut en cours'
        };
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Jamais synchronisé';
    
    const now = new Date();
    const sync = new Date(timestamp);
    const diffInMinutes = Math.floor((now - sync) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Synchronisé à l\'instant';
    if (diffInMinutes < 60) return `Synchronisé il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Synchronisé il y a ${diffInHours}h`;
    
    return `Synchronisé le ${sync?.toLocaleDateString('fr-FR')}`;
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${statusConfig?.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon 
            name={statusConfig?.icon} 
            size={24} 
            color={statusConfig?.color}
          />
          <div>
            <h4 className="font-medium text-foreground">
              {statusConfig?.text}
            </h4>
            <p className="text-sm text-muted-foreground">
              {statusConfig?.description}
            </p>
          </div>
        </div>
        
        {status === 'processing' && (
          <div className="animate-spin">
            <Icon name="Loader2" size={20} color={statusConfig?.color} />
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {formatLastSync(lastSync)}
        </p>
      </div>
    </div>
  );
};

export default ApiStatusIndicator;