import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_cours':
        return 'bg-warning text-warning-foreground';
      case 'en_revision':
        return 'bg-accent text-accent-foreground';
      case 'termine':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'en_cours':
        return 'En cours';
      case 'en_revision':
        return 'En révision';
      case 'termine':
        return 'Terminé';
      default:
        return 'Brouillon';
    }
  };

  const getApiStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return { name: 'CheckCircle', color: 'var(--color-success)' };
      case 'error':
        return { name: 'XCircle', color: 'var(--color-error)' };
      case 'processing':
        return { name: 'Clock', color: 'var(--color-warning)' };
      default:
        return { name: 'AlertCircle', color: 'var(--color-muted-foreground)' };
    }
  };

  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Retard de ${Math.abs(diffDays)} jour(s)`, urgent: true };
    } else if (diffDays === 0) {
      return { text: "Aujourd'hui", urgent: true };
    } else if (diffDays === 1) {
      return { text: "Demain", urgent: true };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} jours`, urgent: diffDays <= 3 };
    } else {
      return { text: date?.toLocaleDateString('fr-FR'), urgent: false };
    }
  };

  const deadlineInfo = formatDeadline(project?.deadline);
  const apiStatus = getApiStatusIcon(project?.indesignStatus);

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {project?.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {project?.description}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project?.status)}`}>
            {getStatusText(project?.status)}
          </span>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progression</span>
          <span className="text-sm text-muted-foreground">{project?.progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${project?.progress}%` }}
          />
        </div>
      </div>
      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Calendar" size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Échéance</span>
          </div>
          <span className={`text-sm ${deadlineInfo?.urgent ? 'text-error font-medium' : 'text-muted-foreground'}`}>
            {deadlineInfo?.text}
          </span>
        </div>
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Users" size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Équipe</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {project?.teamSize} membre(s)
          </span>
        </div>
      </div>
      {/* InDesign API Status */}
      <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Icon 
            name={apiStatus?.name} 
            size={16} 
            color={apiStatus?.color}
          />
          <span className="text-sm font-medium text-foreground">InDesign API</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {project?.indesignStatus === 'connected' && 'Connecté'}
          {project?.indesignStatus === 'error' && 'Erreur'}
          {project?.indesignStatus === 'processing' && 'Traitement...'}
          {project?.indesignStatus === 'disconnected' && 'Déconnecté'}
        </span>
      </div>
      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate('/content-editor')}
          iconName="Edit3"
          iconPosition="left"
          iconSize={14}
          className="flex-1"
        >
          Continuer l'édition
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/project/${project?.id}`)}
          iconName="Eye"
          iconPosition="left"
          iconSize={14}
        >
          Voir les détails
        </Button>
      </div>
    </div>
  );
};

export default ProjectCard;