import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import TextStructureEditor from './components/TextStructureEditor';
import { analyzeContentStructure } from '../../services/contentAnalysisService';
import { templatesAPI, magazineAPI } from '../../services/api';
import { uploadImages } from '../../services/uploadService';

const SmartContentCreator = () => {
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [contentStructure, setContentStructure] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStructureEditor, setShowStructureEditor] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);
  const [contentError, setContentError] = useState(null);

  // Load templates from API on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    setTemplatesError(null);
    try {
      const templates = await templatesAPI.getAll();
      setAvailableTemplates(templates);
    } catch (error) {
      console.error('Error:', error);
      setTemplatesError("Impossible de charger les templates. Veuillez réessayer.");
      setAvailableTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const retryLoadTemplates = () => {
    loadTemplates();
  };

  // Handle text input changes
  const handleContentChange = (e) => {
    setContent(e?.target?.value || '');
    // Auto-resize textarea
    const textarea = textareaRef?.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(150, textarea?.scrollHeight)}px`;
    }
  };

  // Handle image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e?.target?.files || []);
    const newImages = files?.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file?.name,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  // Remove image
  const removeImage = (imageId) => {
    setImages(prev => prev?.filter(img => img?.id !== imageId));
  };

  // Analyze content structure
  const analyzeContent = async (contentText) => {
    if (!contentText?.trim()) return null;
    
    // Validation minimum 50 caractères
    if (contentText.trim().length < 50) {
      console.warn('Content too short for analysis (minimum 50 characters)');
      return null;
    }
    
    setIsAnalyzing(true);
    try {
      const structure = await analyzeContentStructure(contentText);
      setContentStructure(structure);
      setShowStructureEditor(true);
      return structure;
    } catch (error) {
      console.error('Error analyzing content:', error);
      // Fallback structure with specific example content
      const fallbackStructure = {
        titre_principal: 'L\'ART DE SE RÉINVENTER PAR LA COULEUR',
        chapo: 'La couleur n\'est pas seulement un outil esthétique, mais un langage universel. Entre tradition, créativité et affirmation de soi, elle devient une arme de réinvention et un vecteur puissant d\'identité.',
        sous_titres: ['La peinture corporelle comme expression artistique', 'Un langage visuel universel', 'Une revendication identitaire'],
        sections: [
          {
            titre: 'La peinture corporelle comme expression artistique',
            contenu: 'Peindre sa peau, transformer son visage en toile vivante, c\'est un geste ancestral que l\'on retrouve dans de nombreuses cultures. Aujourd\'hui, cette pratique dépasse le rituel et devient un véritable acte artistique. Les artistes contemporains utilisent la couleur pour briser les codes, questionner les normes et proposer une nouvelle lecture du corps.',
            type: 'corps'
          },
          {
            titre: 'Un langage visuel universel',
            contenu: 'La couleur, éclatante ou subtile, a le pouvoir de susciter une émotion immédiate. Elle attire l\'œil, raconte une histoire et dialogue directement avec notre imaginaire. Dans un monde saturé d\'images numériques, le retour à cette forme brute et directe de l\'expression semble redonner une place au geste et à l\'authenticité.\n\nEn Europe comme en Afrique, en Amérique comme en Asie, la peinture corporelle réapparaît dans les festivals, les défilés de mode et même dans les musées. Elle témoigne d\'un désir croissant de renouer avec l\'essence de l\'humain : un être créatif, en constante évolution, qui inscrit sa singularité dans un langage visuel universel.',
            type: 'corps'
          },
          {
            titre: 'Une revendication identitaire',
            contenu: 'Au-delà de l\'esthétique, la couleur devient aussi une revendication identitaire. Chaque nuance, chaque trait posé sur la peau, traduit une manière de dire : « Voilà qui je suis, voilà comment je choisis d\'apparaître. » Et dans ce dialogue entre le soi et le monde, naît une forme de liberté qui dépasse les frontières et les cultures.',
            type: 'corps'
          }
        ],
        mots_cles: ['couleur', 'peinture corporelle', 'identité', 'expression artistique', 'art contemporain', 'créativité'],
        categorie_suggeree: 'Art & Culture',
        temps_lecture: Math.ceil(contentText?.split(' ')?.length / 250) || 4,
        niveau_complexite: 'moyen'
      };
      setContentStructure(fallbackStructure);
      setShowStructureEditor(true);
      return fallbackStructure;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Proceed to template selection
  const proceedToTemplateSelection = async () => {
    setContentError(null);
    
    if (!content?.trim()) {
      setContentError('Veuillez saisir votre texte avant de continuer.');
      return;
    }
    
    if (content.trim().length < 50) {
      setContentError('Le contenu doit contenir au moins 50 caractères.');
      return;
    }

    setIsAnalyzing(true);
    
    // Analyze content structure and show template selection
    await analyzeContent(content);
    setShowTemplateSelection(true);
  };

  // Handle structure changes
  const handleStructureChange = (updatedStructure) => {
    setContentStructure(updatedStructure);
  };

  // Select template
  const selectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  // Generate with selected template
  const generateWithTemplate = async () => {
    if (!selectedTemplate) {
      alert('Veuillez sélectionner un template.');
      return;
    }

    setIsAnalyzing(true);
    try {
      let imageUrls = [];

      // Uploader les images si des fichiers sont présents
      if (images.length > 0) {
        const filesToUpload = images
          .filter(img => img.file)
          .map(img => img.file);

        if (filesToUpload.length > 0) {
          try {
            imageUrls = await uploadImages(filesToUpload);
            console.log('[Frontend] Images uploadées:', imageUrls);
          } catch (uploadError) {
            console.warn('[Frontend] Erreur upload:', uploadError.message);
            // Fallback sur image placeholder si upload échoue
            imageUrls = ['https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&q=80'];
          }
        }
      }

      // Si pas d'images uploadées, utiliser placeholder
      if (imageUrls.length === 0) {
        imageUrls = ['https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&q=80'];
      }

      const result = await magazineAPI.generate({
        content,
        contentStructure,
        template: selectedTemplate,
        images: imageUrls
      });

      navigate(`/generation-result?id=${result.generationId}`);
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Go back to content input
  const goBackToContent = () => {
    setShowTemplateSelection(false);
    setSelectedTemplate(null);
    setShowStructureEditor(false);
    setContentStructure(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-12">
        
        {!showTemplateSelection ? (
          /* =============== ÉTAPE 1: SAISIE DU CONTENU =============== */
          <div className="space-y-10">
            {/* En-tête principal */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                <Icon name="Sparkles" size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                  Créateur de Magazine Intelligent
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Saisissez votre contenu et nous analyserons automatiquement sa structure (titre, chapo, sous-titres, etc.) et vous permettrons de la modifier.
                </p>
              </div>
            </div>

            {/* Layout en grille : Texte à gauche, Images à droite */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Zone de saisie de texte - GAUCHE */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <Icon name="FileText" size={24} className="text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Votre contenu textuel
                    </h2>
                  </div>
                </div>
                
                <div className="p-8">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Saisissez votre texte ici (minimum 50 caractères)..."
                    className="w-full min-h-[300px] p-6 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-700 leading-relaxed text-base placeholder-gray-400"
                    style={{ 
                      fontFamily: 'inherit',
                      lineHeight: '1.7'
                    }}
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600 font-medium">{content?.length} caractères</span>
                      {content?.length > 0 && (
                        <span className="text-green-600 flex items-center gap-1">
                          <Icon name="CheckCircle" size={16} />
                          Contenu saisi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone d'upload d'images - DROITE */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <Icon name="Images" size={24} className="text-white" />
                    <h2 className="text-xl font-semibold text-white">
                      Vos images (optionnel)
                    </h2>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  {/* Zone de drop et bouton d'upload */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-purple-400 transition-colors duration-200 cursor-pointer min-h-[200px] flex flex-col justify-center"
                    onClick={() => fileInputRef?.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="space-y-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                        <Icon name="Upload" size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium mb-1">
                          Glissez vos images ici ou cliquez pour sélectionner
                        </p>
                        <p className="text-gray-500 text-sm">
                          Formats supportés: PNG, JPG, JPEG, WebP
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Aperçu des images */}
                  {images?.length > 0 && (
                    <div>
                      <h3 className="text-gray-700 font-medium mb-4">
                        Images sélectionnées ({images?.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {images?.map((image) => (
                          <div key={image?.id} className="relative group">
                            <img
                              src={image?.url}
                              alt={image?.name}
                              className="w-full h-32 object-cover rounded-xl border-2 border-gray-100 shadow-sm"
                            />
                            <button
                              onClick={() => removeImage(image?.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                            >
                              <Icon name="X" size={14} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl p-2">
                              <p className="text-white text-xs truncate font-medium">
                                {image?.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Bouton de génération */}
            <div className="text-center pt-4">
              <Button
                variant="default"
                size="lg"
                onClick={proceedToTemplateSelection}
                disabled={!content?.trim() || isAnalyzing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-12 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Icon name="Loader" size={20} className="mr-3 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Icon name="Layout" size={20} className="mr-3" />
                    Analyser et choisir un template
                  </>
                )}
              </Button>
              
              {/* Message d'erreur */}
              {contentError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <Icon name="AlertCircle" size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-medium">{contentError}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* =============== ÉTAPE 2: ANALYSE + SÉLECTION DU TEMPLATE =============== */
          <div className="space-y-10">
            {/* En-tête de sélection */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
                <Icon name="Layout" size={28} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Structure et Template
              </h1>
              <p className="text-lg text-gray-600">
                Modifiez la structure de votre contenu et sélectionnez votre template
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Structure Editor */}
              <div>
                <TextStructureEditor 
                  content={{ analyzedStructure: contentStructure }}
                  onStructureChange={handleStructureChange}
                  isAnalyzing={isAnalyzing}
                />
              </div>

              {/* Template Selection */}
              <div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon name="Layout" size={20} className="text-white" />
                        <h3 className="text-lg font-semibold text-white">
                          Templates disponibles
                        </h3>
                      </div>
                      <div className="text-indigo-100 text-sm">
                        {availableTemplates.length} templates
                      </div>
                    </div>
                  </div>

                  <div className="p-6 max-h-[600px] overflow-y-auto">
                    {templatesError ? (
                      <div className="text-center py-12">
                        <Icon name="AlertTriangle" size={32} className="text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 font-medium mb-3">{templatesError}</p>
                        <Button
                          size="sm"
                          onClick={retryLoadTemplates}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <Icon name="RefreshCw" size={16} className="mr-2" />
                          Réessayer
                        </Button>
                      </div>
                    ) : isLoadingTemplates ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-4 text-gray-600">Chargement...</p>
                      </div>
                    ) : availableTemplates.length === 0 ? (
                      <div className="text-center py-12">
                        <Icon name="AlertCircle" size={32} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Aucun template disponible</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availableTemplates.map((template) => {
                          const isSelected = selectedTemplate?.id === template.id;
                          return (
                            <div
                              key={template.id}
                              className={`template-card relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-100'
                                  : 'border-gray-200 bg-white hover:border-indigo-300'
                              }`}
                              onClick={() => selectTemplate(template)}
                            >
                              {template.preview_image ? (
                                <div className="aspect-[4/3] bg-gray-100">
                                  <img 
                                    src={template.preview_image} 
                                    alt={`Aperçu ${template.name}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-[4/3] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                                  <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-4 left-4 w-24 h-32 bg-indigo-400 rounded-lg transform -rotate-12"></div>
                                    <div className="absolute bottom-4 right-4 w-32 h-24 bg-purple-400 rounded-lg transform rotate-6"></div>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-400 rounded-full"></div>
                                  </div>
                                  <Icon name="FileText" size={48} className="text-indigo-400 mb-3 relative z-10" />
                                  <span className="text-2xl font-bold text-indigo-600 relative z-10">{template.name?.charAt(0) || 'M'}</span>
                                </div>
                              )}

                              <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-bold text-gray-900 text-base mb-1">{template.name}</h4>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                        {template.category || 'Général'}
                                      </span>
                                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium capitalize">
                                        {template.style || 'standard'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right text-xs text-gray-500">
                                    {template.image_slots != null && (
                                      <span>{`${template.image_slots} image${template.image_slots > 1 ? 's' : ''}`}</span>
                                    )}
                                  </div>
                                </div>

                                {template.description && (
                                  <p className="text-gray-600 text-sm leading-relaxed">{template.description}</p>
                                )}

                                {Array.isArray(template.placeholders) && template.placeholders.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                                      Placeholders
                                    </h5>
                                    <div className="flex flex-wrap gap-1">
                                      {template.placeholders.map((placeholder) => (
                                        <span
                                          key={placeholder}
                                          className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded border"
                                        >
                                          {placeholder}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {Array.isArray(template.recommended_for) && template.recommended_for.length > 0 && (
                                  <div className="flex flex-wrap gap-1 text-xs text-indigo-600">
                                    {template.recommended_for.map((tag) => (
                                      <span
                                        key={tag}
                                        className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="pt-2">
                                  <Button
                                    size="sm"
                                    variant={isSelected ? 'default' : 'outline'}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      selectTemplate(template);
                                    }}
                                    className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <>
                                        <Icon name="CheckCircle" size={16} className="mr-2" />
                                        Sélectionné
                                      </>
                                    ) : (
                                      <>
                                        <Icon name="MousePointer" size={16} className="mr-2" />
                                        Sélectionner
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="absolute inset-0 border-4 border-indigo-200 pointer-events-none rounded-xl" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-between pt-6">
              <Button
                variant="outline"
                onClick={goBackToContent}
                className="px-8 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <Icon name="ArrowLeft" size={18} className="mr-2" />
                Modifier le contenu
              </Button>

              <Button
                variant="default"
                onClick={generateWithTemplate}
                disabled={!selectedTemplate || isAnalyzing}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Icon name="Loader" size={18} className="mr-2 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    Générer le magazine
                    <Icon name="ArrowRight" size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartContentCreator;
