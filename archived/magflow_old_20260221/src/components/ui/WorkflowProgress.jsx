import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const WorkflowProgress = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const workflowSteps = [
    {
      id: 'dashboard',
      name: 'Projet',
      path: '/dashboard',
      icon: 'FolderOpen',
      description: 'Sélection du projet'
    },
    {
      id: 'content',
      name: 'Contenu',
      path: '/content-editor',
      icon: 'Edit3',
      description: 'Édition du contenu'
    },
    {
      id: 'images',
      name: 'Images',
      path: '/image-manager',
      icon: 'Image',
      description: 'Gestion des images'
    },
    {
      id: 'template',
      name: 'Modèle',
      path: '/template-gallery',
      icon: 'Layout',
      description: 'Sélection du modèle'
    },
    {
      id: 'preview',
      name: 'Aperçu',
      path: '/template-preview',
      icon: 'Eye',
      description: 'Prévisualisation'
    },
    {
      id: 'processing',
      name: 'Traitement',
      path: '/processing-status',
      icon: 'Settings',
      description: 'Génération finale'
    }
  ];

  const getCurrentStepIndex = () => {
    const currentPath = location?.pathname;
    const stepIndex = workflowSteps?.findIndex(step => 
      currentPath === step?.path || 
      (step?.path === '/dashboard' && currentPath === '/')
    );
    return stepIndex >= 0 ? stepIndex : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  const handleStepClick = (step, index) => {
    if (index <= currentStepIndex) {
      navigate(step?.path);
    }
  };

  const getStepStatus = (index) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  // Only show workflow progress on workflow pages
  const workflowPaths = ['/dashboard', '/content-editor', '/image-manager', '/template-gallery', '/template-preview', '/processing-status'];
  const shouldShowProgress = workflowPaths?.some(path => 
    location?.pathname === path || (path === '/dashboard' && location?.pathname === '/')
  );

  if (!shouldShowProgress) return null;

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Desktop Progress */}
          <div className="hidden md:flex items-center space-x-8 w-full">
            {workflowSteps?.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable = index <= currentStepIndex;
              
              return (
                <div key={step?.id} className="flex items-center">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleStepClick(step, index)}
                      disabled={!isClickable}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                        status === 'current' ?'bg-primary text-primary-foreground shadow-sm'
                          : status === 'completed' ?'bg-success text-success-foreground hover:bg-success/90 cursor-pointer' :'text-muted-foreground cursor-not-allowed'
                      } ${isClickable && status !== 'current' ? 'hover:bg-muted' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        status === 'completed' ? 'bg-success-foreground/20' : ''
                      }`}>
                        {status === 'completed' ? (
                          <Icon name="Check" size={14} />
                        ) : (
                          <Icon name={step?.icon} size={14} />
                        )}
                      </div>
                      <span className="text-sm font-medium">{step?.name}</span>
                    </button>
                  </div>
                  {index < workflowSteps?.length - 1 && (
                    <div className={`w-8 h-px mx-4 ${
                      index < currentStepIndex ? 'bg-success' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Progress */}
          <div className="md:hidden w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Étape {currentStepIndex + 1} sur {workflowSteps?.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(((currentStepIndex + 1) / workflowSteps?.length) * 100)}%
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2 mb-3">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / workflowSteps?.length) * 100}%` }}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Icon name={workflowSteps?.[currentStepIndex]?.icon} size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                {workflowSteps?.[currentStepIndex]?.name}
              </span>
              <span className="text-xs text-muted-foreground">
                - {workflowSteps?.[currentStepIndex]?.description}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgress;