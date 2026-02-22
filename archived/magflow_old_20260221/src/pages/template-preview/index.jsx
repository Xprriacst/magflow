import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import WorkflowProgress from '../../components/ui/WorkflowProgress';
import PreviewCanvas from './components/PreviewCanvas';
import ValidationPanel from './components/ValidationPanel';
import AnnotationTools from './components/AnnotationTools';
import ApprovalWorkflow from './components/ApprovalWorkflow';
import QuickAdjustments from './components/QuickAdjustments';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const TemplatePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [showValidation, setShowValidation] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [validationResults, setValidationResults] = useState({
    imageResolution: 'success',
    imageFormat: 'success',
    imageSize: 'warning',
    textOverflow: 'success',
    textLength: 'success',
    specialCharacters: 'success',
    indesignVersion: 'success',
    fontsAvailable: 'success',
    colorProfile: 'warning',
    frenchTypography: 'success',
    lineSpacing: 'success'
  });

  // Mock data - Template information
  const template = {
    id: 'template_lifestyle_001',
    name: 'Magazine Lifestyle - Mise en page moderne',
    category: 'Lifestyle',
    pages: 2,
    width: 210, // A4 width in mm
    height: 297, // A4 height in mm
    backgroundColor: '#ffffff',
    layout: {
      header: {
        x: 10,
        y: 5,
        width: 80,
        height: 15
      },
      mainImage: {
        x: 10,
        y: 25,
        width: 50,
        height: 40
      },
      textAreas: [
        {
          x: 65,
          y: 25,
          width: 25,
          height: 40,
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
          maxLength: 800
        },
        {
          x: 10,
          y: 70,
          width: 80,
          height: 20,
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          textAlign: 'justify',
          maxLength: 600
        }
      ],
      secondaryImages: [
        {
          x: 65,
          y: 70,
          width: 25,
          height: 20
        }
      ],
      footer: {
        x: 0,
        y: 95,
        width: 100,
        height: 5
      }
    }
  };

  // Mock data - Content information
  const content = {
    title: "Les Tendances Mode Automne 2025",
    author: "Sophie Laurent",
    content: `<p>L'automne 2025 s'annonce riche en couleurs et en textures. Les créateurs rivalisent d'ingéniosité pour proposer des collections qui allient confort et élégance.</p>

<p>Cette saison, les tons terreux dominent les podiums : ocre, terracotta et brun chocolat se mélangent harmonieusement avec des touches de vert sauge et de bleu pétrole.</p>

<p>Les matières naturelles sont à l'honneur avec le retour du lin, de la laine mérinos et du cachemire recyclé. L'industrie de la mode continue sa transition vers plus de durabilité.</p>

<p>Les silhouettes se veulent fluides et confortables, avec des coupes oversize qui n'enlèvent rien à la féminité. Les détails brodés et les motifs géométriques apportent une touche d'originalité.</p>`,
    images: [
      {
        id: 'img_001',url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',alt: 'Collection automne 2025 - Look principal',resolution: '300 DPI',
        format: 'JPEG',size: '2.4 MB'
      },
      {
        id: 'img_002',url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop',alt: 'Détail textile - Matières naturelles',resolution: '300 DPI',
        format: 'JPEG',size: '1.8 MB'
      }
    ]
  };

  // Load data from previous steps
  useEffect(() => {
    const savedContent = localStorage.getItem('magflow_content');
    const savedTemplate = localStorage.getItem('magflow_selected_template');
    
    if (savedContent) {
      // Use saved content if available
    }
    if (savedTemplate) {
      // Use saved template if available
    }
  }, []);

  // Event handlers
  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleValidationUpdate = (newResults) => {
    setValidationResults(newResults);
  };

  const handleAddAnnotation = (annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  };

  const handleDeleteAnnotation = (annotationId) => {
    setAnnotations(prev => prev?.filter(a => a?.id !== annotationId));
  };

  const handleUpdateAnnotation = (annotationId, updates) => {
    setAnnotations(prev => 
      prev?.map(a => a?.id === annotationId ? { ...a, ...updates } : a)
    );
  };

  const handleAdjustmentChange = (adjustments) => {
    // Apply adjustments to template preview
    console.log('Ajustements appliqués:', adjustments);
  };

  const handleApproval = (approvalData) => {
    // Save approval data
    localStorage.setItem('magflow_approval', JSON.stringify(approvalData));
    console.log('Approbation enregistrée:', approvalData);
  };

  const handleBackToGallery = () => {
    navigate('/template-gallery');
  };

  const handleEditContent = () => {
    navigate('/content-editor');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WorkflowProgress />
      <div className="pt-32">
        {/* Top Toolbar */}
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBackToGallery}
                iconName="ArrowLeft"
                iconPosition="left"
                iconSize={16}
              >
                Retour à la galerie
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <div className="flex items-center space-x-2">
                <Icon name="Layout" size={18} className="text-primary" />
                <div>
                  <h1 className="font-heading font-semibold text-foreground">
                    {template?.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Prévisualisation avec contenu • Page {currentPage} sur {template?.pages}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditContent}
                iconName="Edit3"
                iconPosition="left"
                iconSize={16}
              >
                Modifier le contenu
              </Button>
              
              <Button
                variant={showValidation ? "default" : "outline"}
                size="sm"
                onClick={() => setShowValidation(!showValidation)}
                iconName="CheckSquare"
                iconPosition="left"
                iconSize={16}
              >
                Validation
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnnotations(!showAnnotations)}
                iconName="MessageSquare"
                iconPosition="left"
                iconSize={16}
              >
                Annotations ({annotations?.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-200px)]">
          {/* Preview Canvas */}
          <PreviewCanvas
            template={template}
            content={content}
            zoom={zoom}
            currentPage={currentPage}
            onZoomChange={handleZoomChange}
            onPageChange={handlePageChange}
          />

          {/* Validation Panel */}
          {showValidation && (
            <ValidationPanel
              template={template}
              content={content}
              validationResults={validationResults}
              onValidationUpdate={handleValidationUpdate}
            />
          )}
        </div>

        {/* Approval Workflow */}
        <ApprovalWorkflow
          template={template}
          validationResults={validationResults}
          onApproval={handleApproval}
        />

        {/* Annotation Tools */}
        <AnnotationTools
          annotations={annotations}
          onAddAnnotation={handleAddAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onUpdateAnnotation={handleUpdateAnnotation}
          isActive={showAnnotations}
          onToggle={() => setShowAnnotations(!showAnnotations)}
        />

        {/* Quick Adjustments */}
        <QuickAdjustments
          template={template}
          onAdjustmentChange={handleAdjustmentChange}
          isVisible={showAdjustments}
          onToggle={() => setShowAdjustments(!showAdjustments)}
        />
      </div>
    </div>
  );
};

export default TemplatePreview;