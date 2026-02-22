import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const AnnotationTools = ({ annotations, onAddAnnotation, onDeleteAnnotation, onUpdateAnnotation, isActive, onToggle }) => {
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [annotationMode, setAnnotationMode] = useState(false);
  const canvasRef = useRef(null);

  const handleCanvasClick = (e) => {
    if (!annotationMode) return;

    const rect = e?.currentTarget?.getBoundingClientRect();
    const x = ((e?.clientX - rect?.left) / rect?.width) * 100;
    const y = ((e?.clientY - rect?.top) / rect?.height) * 100;

    const newAnnotation = {
      id: Date.now(),
      x: x,
      y: y,
      comment: '',
      author: 'Marie Dubois',
      timestamp: new Date(),
      status: 'open',
      type: 'comment'
    };

    onAddAnnotation(newAnnotation);
    setActiveAnnotation(newAnnotation?.id);
    setAnnotationMode(false);
  };

  const handleCommentSubmit = (annotationId, comment) => {
    if (comment?.trim()) {
      onUpdateAnnotation(annotationId, { comment: comment?.trim() });
      setActiveAnnotation(null);
      setNewComment('');
    }
  };

  const annotationTypes = [
    { id: 'comment', label: 'Commentaire', icon: 'MessageCircle', color: 'var(--color-primary)' },
    { id: 'issue', label: 'Problème', icon: 'AlertTriangle', color: 'var(--color-error)' },
    { id: 'suggestion', label: 'Suggestion', icon: 'Lightbulb', color: 'var(--color-warning)' }
  ];

  const getAnnotationIcon = (type) => {
    const annotationType = annotationTypes?.find(t => t?.id === type) || annotationTypes?.[0];
    return annotationType;
  };

  if (!isActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        iconName="MessageSquare"
        iconPosition="left"
        iconSize={16}
        className="fixed bottom-4 right-4 z-20 shadow-lg"
      >Annotations ({annotations?.length})
              </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm">
      {/* Annotation Overlay */}
      <div 
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleCanvasClick}
      >
        {/* Existing Annotations */}
        {annotations?.map((annotation) => {
          const annotationType = getAnnotationIcon(annotation?.type);
          
          return (
            <div
              key={annotation?.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${annotation?.x}%`,
                top: `${annotation?.y}%`
              }}
            >
              <button
                onClick={(e) => {
                  e?.stopPropagation();
                  setActiveAnnotation(activeAnnotation === annotation?.id ? null : annotation?.id);
                }}
                className="w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: annotationType?.color }}
              >
                <Icon name={annotationType?.icon} size={16} color="white" />
              </button>
              {/* Annotation Popup */}
              {activeAnnotation === annotation?.id && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-64 bg-card border border-border rounded-lg shadow-modal p-3 z-40">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon name={annotationType?.icon} size={14} color={annotationType?.color} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {annotationType?.label}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteAnnotation(annotation?.id)}
                      className="text-muted-foreground hover:text-error transition-colors duration-150"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>

                  {annotation?.comment ? (
                    <div>
                      <p className="text-sm text-foreground mb-2">{annotation?.comment}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{annotation?.author}</span>
                        <span>{annotation?.timestamp?.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Ajouter un commentaire..."
                        value={newComment}
                        onChange={(e) => setNewComment(e?.target?.value)}
                        className="text-sm"
                      />
                      <div className="flex space-x-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleCommentSubmit(annotation?.id, newComment)}
                          disabled={!newComment?.trim()}
                          className="flex-1"
                        >
                          Ajouter
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onDeleteAnnotation(annotation?.id);
                            setActiveAnnotation(null);
                            setNewComment('');
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Annotation Toolbar */}
      <div className="absolute top-4 left-4 bg-card border border-border rounded-lg shadow-modal p-3">
        <div className="flex items-center space-x-2 mb-3">
          <Icon name="MessageSquare" size={18} className="text-primary" />
          <span className="font-medium text-foreground">Outils d'annotation</span>
        </div>

        <div className="space-y-2">
          <Button
            variant={annotationMode ? "default" : "outline"}
            size="sm"
            fullWidth
            onClick={() => setAnnotationMode(!annotationMode)}
            iconName="Plus"
            iconPosition="left"
            iconSize={14}
          >
            {annotationMode ? 'Cliquez pour annoter' : 'Ajouter annotation'}
          </Button>

          <div className="grid grid-cols-3 gap-1">
            {annotationTypes?.map((type) => (
              <button
                key={type?.id}
                className="p-2 rounded border border-border hover:bg-muted transition-colors duration-150 flex flex-col items-center space-y-1"
                title={type?.label}
              >
                <Icon name={type?.icon} size={16} color={type?.color} />
                <span className="text-xs text-muted-foreground">{type?.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Close Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className="absolute top-4 right-4 bg-card shadow-lg"
      >
        <Icon name="X" size={18} />
      </Button>
      {/* Annotation List */}
      {annotations?.length > 0 && (
        <div className="absolute bottom-4 right-4 w-80 max-h-64 bg-card border border-border rounded-lg shadow-modal overflow-hidden">
          <div className="p-3 border-b border-border">
            <h4 className="font-medium text-foreground">
              Annotations ({annotations?.length})
            </h4>
          </div>
          <div className="overflow-y-auto max-h-48">
            {annotations?.map((annotation) => {
              const annotationType = getAnnotationIcon(annotation?.type);
              
              return (
                <div key={annotation?.id} className="p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors duration-150">
                  <div className="flex items-start space-x-2">
                    <Icon name={annotationType?.icon} size={14} color={annotationType?.color} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {annotation?.comment || 'Commentaire en attente...'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {annotation?.author}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {annotation?.timestamp?.toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationTools;