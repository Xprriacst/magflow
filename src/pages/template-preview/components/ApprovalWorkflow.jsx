import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ApprovalWorkflow = ({ template, validationResults, onApproval }) => {
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const criticalIssues = Object.values(validationResults)?.filter(status => status === 'error')?.length;
  const warnings = Object.values(validationResults)?.filter(status => status === 'warning')?.length;

  const workflowActions = [
    {
      id: 'approve',
      label: 'Approuver',
      icon: 'CheckCircle',
      variant: 'default',
      color: 'var(--color-success)',
      disabled: criticalIssues > 0,
      description: 'Valider le modèle pour traitement InDesign'
    },
    {
      id: 'request_changes',
      label: 'Demander des modifications',
      icon: 'Edit3',
      variant: 'outline',
      color: 'var(--color-warning)',
      disabled: false,
      description: 'Retourner pour modifications'
    },
    {
      id: 'reject',
      label: 'Rejeter',
      icon: 'XCircle',
      variant: 'outline',
      color: 'var(--color-error)',
      disabled: false,
      description: 'Rejeter le modèle actuel'
    }
  ];

  const handleActionClick = (action) => {
    if (action?.id === 'approve' && criticalIssues === 0) {
      handleApproval(action?.id, '');
    } else {
      setCurrentAction(action);
      setShowCommentModal(true);
    }
  };

  const handleApproval = async (actionId, commentText) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const approvalData = {
        action: actionId,
        comment: commentText,
        timestamp: new Date(),
        user: 'Marie Dubois',
        templateId: template?.id
      };

      onApproval(approvalData);

      // Navigate based on action
      switch (actionId) {
        case 'approve': navigate('/generation-loading', {
            state: {
              template: template,
              approval: approvalData
            }
          });
          break;
        case 'request_changes': navigate('/content-editor');
          break;
        case 'reject': navigate('/template-gallery');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
    } finally {
      setIsSubmitting(false);
      setShowCommentModal(false);
      setComment('');
      setCurrentAction(null);
    }
  };

  const getStatusSummary = () => {
    if (criticalIssues > 0) {
      return {
        icon: 'AlertCircle',
        color: 'var(--color-error)',
        text: `${criticalIssues} erreur${criticalIssues > 1 ? 's' : ''} critique${criticalIssues > 1 ? 's' : ''}`,
        description: 'Correction requise avant approbation'
      };
    } else if (warnings > 0) {
      return {
        icon: 'AlertTriangle',
        color: 'var(--color-warning)',
        text: `${warnings} avertissement${warnings > 1 ? 's' : ''}`,
        description: 'Vérification recommandée'
      };
    } else {
      return {
        icon: 'CheckCircle',
        color: 'var(--color-success)',
        text: 'Validation réussie',
        description: 'Prêt pour approbation'
      };
    }
  };

  const statusSummary = getStatusSummary();

  return (
    <>
      <div className="bg-card border-t border-border p-4">
        {/* Status Summary */}
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <Icon name={statusSummary?.icon} size={20} color={statusSummary?.color} />
            <div>
              <p className="font-medium text-foreground">{statusSummary?.text}</p>
              <p className="text-sm text-muted-foreground">{statusSummary?.description}</p>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="bg-muted/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">{template?.name}</h4>
              <p className="text-sm text-muted-foreground">
                {template?.category} • {template?.pages} page{template?.pages > 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Dernière modification</p>
              <p className="text-sm font-medium text-foreground">
                {new Date()?.toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {workflowActions?.map((action) => (
            <Button
              key={action?.id}
              variant={action?.variant}
              onClick={() => handleActionClick(action)}
              disabled={action?.disabled || isSubmitting}
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <Icon name={action?.icon} size={24} color={action?.color} />
              <span className="font-medium">{action?.label}</span>
              <span className="text-xs text-muted-foreground text-center">
                {action?.description}
              </span>
            </Button>
          ))}
        </div>

        {/* Critical Issues Warning */}
        {criticalIssues > 0 && (
          <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <Icon name="AlertCircle" size={16} color="var(--color-error)" className="mt-0.5" />
              <div>
                <p className="text-sm font-medium text-error">
                  Correction requise
                </p>
                <p className="text-xs text-error/80 mt-1">
                  Veuillez corriger les erreurs critiques avant d'approuver le modèle.
                  Utilisez le panneau de validation pour identifier les problèmes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Comment Modal */}
      {showCommentModal && currentAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-modal w-full max-w-md">
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <Icon name={currentAction?.icon} size={20} color={currentAction?.color} />
                <h3 className="font-heading font-semibold text-foreground">
                  {currentAction?.label}
                </h3>
              </div>
            </div>

            <div className="p-4">
              <Input
                label="Commentaire"
                type="text"
                placeholder={
                  currentAction?.id === 'approve' ?'Commentaire optionnel...' :'Expliquez les modifications requises...'
                }
                value={comment}
                onChange={(e) => setComment(e?.target?.value)}
                required={currentAction?.id !== 'approve'}
                description={
                  currentAction?.id === 'request_changes' ?'Détaillez les modifications à apporter'
                    : currentAction?.id === 'reject' ?'Expliquez les raisons du rejet' :'Ajoutez un commentaire si nécessaire'
                }
              />
            </div>

            <div className="p-4 border-t border-border flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommentModal(false);
                  setComment('');
                  setCurrentAction(null);
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant={currentAction?.variant}
                onClick={() => handleApproval(currentAction?.id, comment)}
                disabled={
                  isSubmitting || 
                  (currentAction?.id !== 'approve' && !comment?.trim())
                }
                loading={isSubmitting}
                className="flex-1"
              >
                {currentAction?.label}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApprovalWorkflow;