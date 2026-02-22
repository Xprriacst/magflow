import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ContentVersioning = ({ versions, currentVersion, onVersionSelect, onCreateVersion, onDeleteVersion }) => {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);

  const mockVersions = versions || [
    {
      id: 'v1.0',
      name: 'Version initiale',
      author: 'Marie Dubois',
      timestamp: new Date('2024-12-12T09:30:00'),
      changes: 'Création de l\'article initial avec titre et contenu principal',
      wordCount: 450,
      status: 'brouillon',
      isCurrent: false
    },
    {
      id: 'v1.1',
      name: 'Révision éditoriale',
      author: 'Jean Martin',
      timestamp: new Date('2024-12-12T14:15:00'),
      changes: 'Corrections orthographiques et amélioration du style',
      wordCount: 465,
      status: 'revision',
      isCurrent: false
    },
    {
      id: 'v1.2',
      name: 'Ajout métadonnées',
      author: 'Marie Dubois',
      timestamp: new Date('2024-12-12T16:45:00'),
      changes: 'Ajout des mots-clés et catégorisation',
      wordCount: 465,
      status: 'revision',
      isCurrent: true
    }
  ];

  const comments = [
    {
      id: 1,
      author: 'Jean Martin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      timestamp: new Date('2024-12-12T15:30:00'),
      content: 'Excellent travail sur cette section. Peut-être ajouter une citation pour renforcer l\'argument principal ?',
      resolved: false,
      versionId: 'v1.1'
    },
    {
      id: 2,
      author: 'Sophie Laurent',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      timestamp: new Date('2024-12-12T16:00:00'),
      content: 'Les métadonnées sont bien structurées. N\'oubliez pas de vérifier la cohérence avec les autres articles de cette série.',
      resolved: true,
      versionId: 'v1.2'
    },
    {
      id: 3,
      author: 'Pierre Durand',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      timestamp: new Date('2024-12-12T17:15:00'),
      content: 'Le ton est parfait pour notre audience. Prêt pour la validation finale.',
      resolved: false,
      versionId: 'v1.2'
    }
  ];

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(timestamp);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'brouillon':
        return { name: 'Edit3', color: 'var(--color-muted-foreground)' };
      case 'revision':
        return { name: 'Eye', color: 'var(--color-warning)' };
      case 'approuve':
        return { name: 'CheckCircle', color: 'var(--color-success)' };
      case 'publie':
        return { name: 'Globe', color: 'var(--color-primary)' };
      default:
        return { name: 'FileText', color: 'var(--color-muted-foreground)' };
    }
  };

  const handleVersionSelect = (version) => {
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };

  const handleCreateNewVersion = () => {
    const newVersion = {
      id: `v1.${mockVersions?.length}`,
      name: `Version ${mockVersions?.length + 1}`,
      author: 'Marie Dubois',
      timestamp: new Date(),
      changes: 'Nouvelle version créée',
      wordCount: 465,
      status: 'brouillon',
      isCurrent: true
    };
    
    if (onCreateVersion) {
      onCreateVersion(newVersion);
    }
  };

  const toggleVersionComparison = (versionId) => {
    setSelectedVersions(prev => {
      if (prev?.includes(versionId)) {
        return prev?.filter(id => id !== versionId);
      } else if (prev?.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev?.[1], versionId];
      }
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Icon name="GitBranch" size={20} className="text-primary" />
          <div>
            <h3 className="font-heading font-semibold text-foreground">
              Versions et Collaboration
            </h3>
            <p className="text-sm text-muted-foreground">
              Version actuelle: {mockVersions?.find(v => v?.isCurrent)?.name || 'v1.2'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            iconName={showVersionHistory ? "ChevronUp" : "ChevronDown"}
            iconPosition="right"
            iconSize={16}
          >
            Historique
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleCreateNewVersion}
            iconName="Plus"
            iconPosition="left"
            iconSize={16}
          >
            Nouvelle version
          </Button>
        </div>
      </div>
      {/* Version History */}
      {showVersionHistory && (
        <div className="p-4 border-b border-border">
          <div className="space-y-3">
            {mockVersions?.map((version) => {
              const statusIcon = getStatusIcon(version?.status);
              const isSelected = selectedVersions?.includes(version?.id);
              
              return (
                <div
                  key={version?.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-150 ${
                    version?.isCurrent 
                      ? 'border-primary bg-primary/5' 
                      : isSelected
                      ? 'border-accent bg-accent/5' :'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleVersionComparison(version?.id)}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      disabled={selectedVersions?.length >= 2 && !isSelected}
                    />
                    
                    <Icon 
                      name={statusIcon?.name} 
                      size={16} 
                      color={statusIcon?.color}
                    />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {version?.name}
                        </span>
                        {version?.isCurrent && (
                          <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                            Actuelle
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {version?.changes}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{version?.author}</span>
                        <span>{formatTimestamp(version?.timestamp)}</span>
                        <span>{version?.wordCount} mots</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVersionSelect(version)}
                      iconName="Eye"
                      iconSize={14}
                      disabled={version?.isCurrent}
                    >
                      Voir
                    </Button>
                    {!version?.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVersionSelect(version)}
                        iconName="RotateCcw"
                        iconSize={14}
                      >
                        Restaurer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedVersions?.length === 2 && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Comparaison sélectionnée: {selectedVersions?.join(' vs ')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="GitCompare"
                  iconPosition="left"
                  iconSize={16}
                >
                  Comparer
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Comments Section */}
      <div className="p-4">
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Icon name="MessageSquare" size={16} />
          Commentaires de l'équipe ({comments?.length})
        </h4>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments?.map((comment) => (
            <div key={comment?.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Icon name="User" size={14} className="text-muted-foreground" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {comment?.author}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(comment?.timestamp)}
                  </span>
                  {comment?.resolved && (
                    <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">
                      Résolu
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {comment?.content}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ajouter un commentaire..."
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Button
              variant="default"
              size="sm"
              iconName="Send"
              iconSize={16}
            >
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentVersioning;