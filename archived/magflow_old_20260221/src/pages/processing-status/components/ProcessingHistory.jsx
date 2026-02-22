import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProcessingHistory = ({ 
  history, 
  onViewDetails, 
  onReprocess, 
  onDownload 
}) => {
  const [sortBy, setSortBy] = useState('date');
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return { name: 'CheckCircle', color: 'text-success' };
      case 'failed': return { name: 'XCircle', color: 'text-error' };
      case 'cancelled': return { name: 'MinusCircle', color: 'text-muted-foreground' };
      default: return { name: 'Circle', color: 'text-muted-foreground' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success';
      case 'failed': return 'bg-error/10 text-error';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const sortedHistory = [...history]?.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.completedAt) - new Date(a.completedAt);
      case 'name':
        return a?.projectName?.localeCompare(b?.projectName);
      case 'duration':
        return b?.processingTime - a?.processingTime;
      case 'status':
        return a?.status?.localeCompare(b?.status);
      default:
        return 0;
    }
  });

  const filteredHistory = sortedHistory?.filter(item => 
    filterStatus === 'all' || item?.status === filterStatus
  );

  const statusCounts = {
    all: history?.length,
    completed: history?.filter(h => h?.status === 'completed')?.length,
    failed: history?.filter(h => h?.status === 'failed')?.length,
    cancelled: history?.filter(h => h?.status === 'cancelled')?.length
  };

  const averageProcessingTime = history?.length > 0 
    ? Math.round(history?.reduce((sum, h) => sum + h?.processingTime, 0) / history?.length)
    : 0;

  const successRate = history?.length > 0 
    ? Math.round((statusCounts?.completed / history?.length) * 100)
    : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-heading font-semibold text-foreground">
          Historique des traitements
        </h2>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Icon name="Clock" size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground">
              Temps moyen: {averageProcessingTime}min
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="TrendingUp" size={16} className="text-success" />
            <span className="text-muted-foreground">
              Taux de réussite: {successRate}%
            </span>
          </div>
        </div>
      </div>
      {/* Filters and Sorting */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
          {[
            { key: 'all', label: 'Tout', count: statusCounts?.all },
            { key: 'completed', label: 'Terminé', count: statusCounts?.completed },
            { key: 'failed', label: 'Échoué', count: statusCounts?.failed },
            { key: 'cancelled', label: 'Annulé', count: statusCounts?.cancelled }
          ]?.map(filter => (
            <button
              key={filter?.key}
              onClick={() => setFilterStatus(filter?.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                filterStatus === filter?.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter?.label}
              {filter?.count > 0 && (
                <span className="ml-1 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                  {filter?.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Trier par:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e?.target?.value)}
            className="text-sm border border-border rounded-md px-2 py-1 bg-card text-foreground"
          >
            <option value="date">Date</option>
            <option value="name">Nom</option>
            <option value="duration">Durée</option>
            <option value="status">Statut</option>
          </select>
        </div>
      </div>
      {/* History List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredHistory?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="History" size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun historique disponible</p>
          </div>
        ) : (
          filteredHistory?.map((item) => {
            const statusConfig = getStatusIcon(item?.status);
            
            return (
              <div key={item?.id} className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Icon 
                        name={statusConfig?.name} 
                        size={18} 
                        className={statusConfig?.color}
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-foreground">
                        {item?.projectName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item?.template} • {item?.articleCount} articles
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(item?.status)}`}>
                      {item?.status === 'completed' ? 'Terminé' :
                       item?.status === 'failed' ? 'Échoué' :
                       item?.status === 'cancelled' ? 'Annulé' : item?.status}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDetails(item?.id)}
                        className="w-8 h-8"
                        title="Voir les détails"
                      >
                        <Icon name="Eye" size={14} />
                      </Button>
                      
                      {item?.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDownload(item?.id)}
                          className="w-8 h-8"
                          title="Télécharger"
                        >
                          <Icon name="Download" size={14} />
                        </Button>
                      )}
                      
                      {(item?.status === 'failed' || item?.status === 'cancelled') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onReprocess(item?.id)}
                          className="w-8 h-8"
                          title="Retraiter"
                        >
                          <Icon name="RefreshCw" size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Terminé le:</span>
                    <div className="font-medium text-foreground">
                      {new Date(item.completedAt)?.toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Durée:</span>
                    <div className="font-medium text-foreground">
                      {item?.processingTime} min
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Taille:</span>
                    <div className="font-medium text-foreground">
                      {item?.fileSize}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Qualité:</span>
                    <div className="font-medium text-foreground">
                      {item?.qualityScore}/10
                    </div>
                  </div>
                </div>
                {item?.notes && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <Icon name="MessageSquare" size={14} className="inline mr-1" />
                      {item?.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProcessingHistory;