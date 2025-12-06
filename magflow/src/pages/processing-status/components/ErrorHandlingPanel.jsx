import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ErrorHandlingPanel = ({ 
  errors, 
  onRetry, 
  onDismiss, 
  onViewDetails,
  onContactSupport 
}) => {
  const [expandedError, setExpandedError] = useState(null);

  const getErrorIcon = (severity) => {
    switch (severity) {
      case 'critical': return { name: 'AlertCircle', color: 'text-error' };
      case 'warning': return { name: 'AlertTriangle', color: 'text-warning' };
      case 'info': return { name: 'Info', color: 'text-primary' };
      default: return { name: 'AlertCircle', color: 'text-error' };
    }
  };

  const getErrorBadgeColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-error/10 text-error';
      case 'warning': return 'bg-warning/10 text-warning';
      case 'info': return 'bg-primary/10 text-primary';
      default: return 'bg-error/10 text-error';
    }
  };

  const criticalErrors = errors?.filter(e => e?.severity === 'critical')?.length;
  const warningErrors = errors?.filter(e => e?.severity === 'warning')?.length;

  if (errors?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center py-8">
          <Icon name="CheckCircle" size={32} className="mx-auto mb-2 text-success" />
          <h3 className="font-medium text-foreground mb-1">Aucune erreur détectée</h3>
          <p className="text-sm text-muted-foreground">
            Le traitement se déroule sans problème
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Gestion des erreurs
          </h2>
          
          <div className="flex items-center space-x-2">
            {criticalErrors > 0 && (
              <span className="bg-error/10 text-error text-xs px-2 py-1 rounded-full font-medium">
                {criticalErrors} critique{criticalErrors > 1 ? 's' : ''}
              </span>
            )}
            {warningErrors > 0 && (
              <span className="bg-warning/10 text-warning text-xs px-2 py-1 rounded-full font-medium">
                {warningErrors} attention{warningErrors > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onContactSupport}
          iconName="HelpCircle"
          iconPosition="left"
          iconSize={14}
        >
          Contacter le support
        </Button>
      </div>
      <div className="space-y-4">
        {errors?.map((error) => {
          const iconConfig = getErrorIcon(error?.severity);
          const isExpanded = expandedError === error?.id;
          
          return (
            <div key={error?.id} className="border border-border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon 
                        name={iconConfig?.name} 
                        size={18} 
                        className={iconConfig?.color}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-foreground">
                          {error?.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getErrorBadgeColor(error?.severity)}`}>
                          {error?.severity === 'critical' ? 'Critique' : 
                           error?.severity === 'warning' ? 'Attention' : 'Info'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {error?.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Code: {error?.code}</span>
                        <span>Composant: {error?.component}</span>
                        <span>{error?.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedError(isExpanded ? null : error?.id)}
                      iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
                      iconPosition="left"
                      iconSize={14}
                    >
                      {isExpanded ? "Masquer" : "Détails"}
                    </Button>
                    
                    {error?.canRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetry(error?.id)}
                        iconName="RefreshCw"
                        iconPosition="left"
                        iconSize={14}
                      >
                        Réessayer
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(error?.id)}
                      iconName="X"
                      iconSize={14}
                    >
                    </Button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="p-4 border-t border-border bg-card">
                  <div className="space-y-4">
                    {/* Technical Details */}
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Détails techniques</h4>
                      <div className="bg-muted rounded-lg p-3 font-mono text-sm">
                        <pre className="whitespace-pre-wrap text-foreground">
                          {error?.technicalDetails}
                        </pre>
                      </div>
                    </div>
                    
                    {/* Troubleshooting Steps */}
                    {error?.troubleshooting && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Étapes de résolution</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          {error?.troubleshooting?.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    
                    {/* Related Documentation */}
                    {error?.documentation && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Documentation associée</h4>
                        <div className="flex flex-wrap gap-2">
                          {error?.documentation?.map((doc, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc?.url, '_blank')}
                              iconName="ExternalLink"
                              iconPosition="right"
                              iconSize={12}
                            >
                              {doc?.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ErrorHandlingPanel;