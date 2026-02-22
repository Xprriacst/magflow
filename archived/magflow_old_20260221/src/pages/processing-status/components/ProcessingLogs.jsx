import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProcessingLogs = ({ logs, onRefresh, autoRefresh }) => {
  const [filter, setFilter] = useState('all');
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (isAutoScrollEnabled && logsEndRef?.current) {
      logsEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScrollEnabled]);

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return { name: 'CheckCircle', color: 'text-success' };
      case 'error': return { name: 'XCircle', color: 'text-error' };
      case 'warning': return { name: 'AlertTriangle', color: 'text-warning' };
      case 'info': return { name: 'Info', color: 'text-primary' };
      default: return { name: 'Circle', color: 'text-muted-foreground' };
    }
  };

  const filteredLogs = logs?.filter(log => 
    filter === 'all' || log?.type === filter
  );

  const logCounts = {
    all: logs?.length,
    info: logs?.filter(l => l?.type === 'info')?.length,
    success: logs?.filter(l => l?.type === 'success')?.length,
    warning: logs?.filter(l => l?.type === 'warning')?.length,
    error: logs?.filter(l => l?.type === 'error')?.length
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">
          Journal de traitement
        </h2>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
            iconName={isAutoScrollEnabled ? "Pause" : "Play"}
            iconPosition="left"
            iconSize={14}
          >
            {isAutoScrollEnabled ? "Pause défilement" : "Auto défilement"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            iconName="RefreshCw"
            iconPosition="left"
            iconSize={14}
          >
            Actualiser
          </Button>
        </div>
      </div>
      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 mb-4 bg-muted rounded-lg p-1">
        {[
          { key: 'all', label: 'Tout', count: logCounts?.all },
          { key: 'info', label: 'Info', count: logCounts?.info },
          { key: 'success', label: 'Succès', count: logCounts?.success },
          { key: 'warning', label: 'Attention', count: logCounts?.warning },
          { key: 'error', label: 'Erreurs', count: logCounts?.error }
        ]?.map(tab => (
          <button
            key={tab?.key}
            onClick={() => setFilter(tab?.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
              filter === tab?.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab?.label}
            {tab?.count > 0 && (
              <span className="ml-1 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {tab?.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Auto Refresh Indicator */}
      {autoRefresh && (
        <div className="flex items-center space-x-2 mb-4 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span>Actualisation automatique activée</span>
        </div>
      )}
      {/* Logs Container */}
      <div className="bg-muted/30 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
        {filteredLogs?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Icon name="FileText" size={32} className="mx-auto mb-2" />
              <p>Aucun journal disponible</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs?.map((log, index) => {
              const iconConfig = getLogIcon(log?.type);
              
              return (
                <div key={index} className="flex items-start space-x-3 py-1">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon 
                      name={iconConfig?.name} 
                      size={14} 
                      className={iconConfig?.color}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {log?.timestamp}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        log?.type === 'error' ? 'bg-error/10 text-error' :
                        log?.type === 'warning' ? 'bg-warning/10 text-warning' :
                        log?.type === 'success'? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                      }`}>
                        {log?.type?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">
                      {log?.message}
                    </p>
                    {log?.details && (
                      <p className="text-xs text-muted-foreground mt-1 pl-4 border-l-2 border-muted">
                        {log?.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingLogs;