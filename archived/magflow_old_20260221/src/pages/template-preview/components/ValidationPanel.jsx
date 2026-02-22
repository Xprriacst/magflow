import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ValidationPanel = ({ template, content, validationResults, onValidationUpdate }) => {
  const [expandedSections, setExpandedSections] = useState({
    images: true,
    text: true,
    compatibility: true,
    typography: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev?.[section]
    }));
  };

  const validationChecks = {
    images: [
      {
        id: 'image_resolution',
        label: 'Résolution des images',
        status: validationResults?.imageResolution,
        description: 'Toutes les images doivent avoir une résolution ≥ 300 DPI',
        critical: true
      },
      {
        id: 'image_format',
        label: 'Format des images',
        status: validationResults?.imageFormat,
        description: 'Formats supportés: JPEG, PNG, TIFF',
        critical: true
      },
      {
        id: 'image_size',
        label: 'Taille des fichiers',
        status: validationResults?.imageSize,
        description: 'Taille recommandée < 10MB par image',
        critical: false
      }
    ],
    text: [
      {
        id: 'text_overflow',
        label: 'Débordement de texte',
        status: validationResults?.textOverflow,
        description: 'Le texte ne doit pas dépasser les zones définies',
        critical: true
      },
      {
        id: 'text_length',
        label: 'Longueur du contenu',
        status: validationResults?.textLength,
        description: 'Contenu adapté aux zones de texte du modèle',
        critical: false
      },
      {
        id: 'special_characters',
        label: 'Caractères spéciaux',
        status: validationResults?.specialCharacters,
        description: 'Vérification des caractères français (é, è, à, ç)',
        critical: false
      }
    ],
    compatibility: [
      {
        id: 'indesign_version',
        label: 'Version InDesign',
        status: validationResults?.indesignVersion,
        description: 'Compatible avec InDesign CS6 et versions ultérieures',
        critical: true
      },
      {
        id: 'fonts_available',
        label: 'Polices disponibles',
        status: validationResults?.fontsAvailable,
        description: 'Toutes les polices sont installées sur le système',
        critical: true
      },
      {
        id: 'color_profile',
        label: 'Profil colorimétrique',
        status: validationResults?.colorProfile,
        description: 'Profil CMYK pour impression',
        critical: false
      }
    ],
    typography: [
      {
        id: 'french_typography',
        label: 'Typographie française',
        status: validationResults?.frenchTypography,
        description: 'Respect des règles typographiques françaises',
        critical: false
      },
      {
        id: 'line_spacing',
        label: 'Interlignage',
        status: validationResults?.lineSpacing,
        description: 'Espacement optimal pour la lisibilité',
        critical: false
      }
    ]
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return { name: 'CheckCircle', color: 'var(--color-success)' };
      case 'warning':
        return { name: 'AlertTriangle', color: 'var(--color-warning)' };
      case 'error':
        return { name: 'XCircle', color: 'var(--color-error)' };
      default:
        return { name: 'Clock', color: 'var(--color-muted-foreground)' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Validé';
      case 'warning':
        return 'Attention';
      case 'error':
        return 'Erreur';
      default:
        return 'En attente';
    }
  };

  const runValidation = () => {
    // Simulate validation process
    onValidationUpdate({
      imageResolution: Math.random() > 0.3 ? 'success' : 'error',
      imageFormat: 'success',
      imageSize: Math.random() > 0.5 ? 'success' : 'warning',
      textOverflow: Math.random() > 0.2 ? 'success' : 'error',
      textLength: 'success',
      specialCharacters: 'success',
      indesignVersion: 'success',
      fontsAvailable: Math.random() > 0.1 ? 'success' : 'error',
      colorProfile: 'warning',
      frenchTypography: 'success',
      lineSpacing: 'success'
    });
  };

  const criticalIssues = Object.values(validationChecks)?.flat()?.filter(check => check?.critical && check?.status === 'error')?.length;

  const warnings = Object.values(validationChecks)?.flat()?.filter(check => check?.status === 'warning')?.length;

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-foreground">
            Validation du modèle
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={runValidation}
            iconName="RefreshCw"
            iconPosition="left"
            iconSize={14}
          >
            Vérifier
          </Button>
        </div>
        
        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-error/10 border border-error/20 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} color="var(--color-error)" />
              <span className="text-sm font-medium text-error">{criticalIssues}</span>
            </div>
            <p className="text-xs text-error/80 mt-1">Erreurs critiques</p>
          </div>
          
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <Icon name="AlertTriangle" size={16} color="var(--color-warning)" />
              <span className="text-sm font-medium text-warning">{warnings}</span>
            </div>
            <p className="text-xs text-warning/80 mt-1">Avertissements</p>
          </div>
        </div>
      </div>
      {/* Validation Sections */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(validationChecks)?.map(([sectionKey, checks]) => {
          const sectionTitles = {
            images: 'Images',
            text: 'Contenu textuel',
            compatibility: 'Compatibilité',
            typography: 'Typographie'
          };

          const sectionIcons = {
            images: 'Image',
            text: 'Type',
            compatibility: 'Settings',
            typography: 'AlignLeft'
          };

          return (
            <div key={sectionKey} className="border-b border-border last:border-b-0">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors duration-150"
              >
                <div className="flex items-center space-x-3">
                  <Icon name={sectionIcons?.[sectionKey]} size={18} className="text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {sectionTitles?.[sectionKey]}
                  </span>
                </div>
                <Icon 
                  name="ChevronDown" 
                  size={16} 
                  className={`transition-transform duration-200 ${
                    expandedSections?.[sectionKey] ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections?.[sectionKey] && (
                <div className="pb-4">
                  {checks?.map((check) => {
                    const statusIcon = getStatusIcon(check?.status);
                    
                    return (
                      <div key={check?.id} className="px-4 py-2 hover:bg-muted/30 transition-colors duration-150">
                        <div className="flex items-start space-x-3">
                          <Icon 
                            name={statusIcon?.name} 
                            size={16} 
                            color={statusIcon?.color}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">
                                {check?.label}
                              </p>
                              {check?.critical && (
                                <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full">
                                  Critique
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {check?.description}
                            </p>
                            <p className={`text-xs mt-1 font-medium ${
                              check?.status === 'success' ? 'text-success' :
                              check?.status === 'warning' ? 'text-warning' :
                              check?.status === 'error'? 'text-error' : 'text-muted-foreground'
                            }`}>
                              {getStatusText(check?.status)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Action Buttons */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="space-y-2">
          <Button
            variant="default"
            fullWidth
            disabled={criticalIssues > 0}
            iconName="Download"
            iconPosition="left"
            iconSize={16}
          >
            Exporter vers InDesign
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            iconName="FileText"
            iconPosition="left"
            iconSize={16}
          >
            Rapport de validation
          </Button>
        </div>
        
        {criticalIssues > 0 && (
          <p className="text-xs text-error mt-2 text-center">
            Corrigez les erreurs critiques avant l'export
          </p>
        )}
      </div>
    </div>
  );
};

export default ValidationPanel;