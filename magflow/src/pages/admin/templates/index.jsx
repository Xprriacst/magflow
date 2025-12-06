import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/ui/Header';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import { templatesAPI } from '../../../services/api';
import { uploadImages } from '../../../services/uploadService';

const TemplatesAdmin = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [previewEditor, setPreviewEditor] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [updatingPreviewId, setUpdatingPreviewId] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await templatesAPI.getAll();
      setTemplates(data);
    } catch (err) {
      setError(`Erreur lors du chargement: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeAll = async () => {
    setIsAnalyzing(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await templatesAPI.analyzeAll();
      setSuccessMessage(
        `✅ Analyse terminée ! ${result.analyzed} templates analysés, ${result.updated} mis à jour.`
      );
      // Recharger les templates pour voir les nouvelles métadonnées
      await loadTemplates();
    } catch (err) {
      setError(`Erreur lors de l'analyse: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeOne = async (templateId) => {
    setError(null);
    setSuccessMessage(null);
    
    try {
      await templatesAPI.analyzeOne(templateId);
      setSuccessMessage(`✅ Template analysé avec succès`);
      await loadTemplates();
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    }
  };

  const closePreviewEditor = () => {
    setPreviewEditor(null);
    setPreviewError(null);
  };

  const openPreviewEditor = (template) => {
    if (previewEditor?.templateId === template.id) {
      closePreviewEditor();
      return;
    }

    setPreviewEditor({
      templateId: template.id,
      value: template.preview_url || ''
    });
    setPreviewError(null);
    setSuccessMessage(null);
  };

  const handlePreviewInputChange = (event) => {
    const { value } = event.target;
    setPreviewEditor((prev) => (prev ? { ...prev, value } : prev));
  };

  const handleSavePreview = async () => {
    if (!previewEditor?.templateId) {
      return;
    }

    const templateId = previewEditor.templateId;
    const normalizedValue = typeof previewEditor.value === 'string'
      ? previewEditor.value.trim()
      : '';

    setUpdatingPreviewId(templateId);
    setPreviewError(null);
    setError(null);

    try {
      const updated = await templatesAPI.updatePreview(
        templateId,
        normalizedValue === '' ? null : normalizedValue
      );

      setTemplates((prevTemplates) =>
        prevTemplates.map((tpl) =>
          tpl.id === updated.id ? { ...tpl, ...updated } : tpl
        )
      );

      setSuccessMessage(
        normalizedValue
          ? '✅ Image de preview mise à jour.'
          : '🗑️ Image de preview supprimée.'
      );
      closePreviewEditor();
    } catch (err) {
      console.error('[TemplatesAdmin] Preview update failed:', err);
      setPreviewError(err.message);
      setError(`Erreur lors de la mise à jour de l'image: ${err.message}`);
    } finally {
      setUpdatingPreviewId(null);
    }
  };

  const handleUploadPreview = async (templateId, fileList) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const hasTemplate = templates.some((tpl) => tpl.id === templateId);
    if (!hasTemplate) {
      setPreviewError('Template introuvable.');
      return;
    }

    setUpdatingPreviewId(templateId);
    setPreviewError(null);
    setError(null);

    try {
      const [uploadedUrl] = await uploadImages([fileList[0]]);

      if (!uploadedUrl) {
        throw new Error("Upload incomplet: aucune URL reçue.");
      }

      const updated = await templatesAPI.updatePreview(templateId, uploadedUrl);

      setTemplates((prevTemplates) =>
        prevTemplates.map((tpl) =>
          tpl.id === updated.id ? { ...tpl, ...updated } : tpl
        )
      );

      setSuccessMessage('✅ Image de preview mise à jour.');
      closePreviewEditor();
    } catch (err) {
      console.error('[TemplatesAdmin] Preview upload failed:', err);
      setPreviewError(err.message);
      setError(`Impossible de mettre à jour l'image: ${err.message}`);
    } finally {
      setUpdatingPreviewId(null);
    }
  };

  const handleRemovePreview = async (templateId) => {
    setUpdatingPreviewId(templateId);
    setPreviewError(null);
    setError(null);

    try {
      const updated = await templatesAPI.updatePreview(templateId, null);

      setTemplates((prevTemplates) =>
        prevTemplates.map((tpl) =>
          tpl.id === updated.id ? { ...tpl, ...updated } : tpl
        )
      );

      setSuccessMessage('🗑️ Image de preview supprimée.');
      closePreviewEditor();
    } catch (err) {
      console.error('[TemplatesAdmin] Preview removal failed:', err);
      setPreviewError(err.message);
      setError(`Impossible de supprimer l'image: ${err.message}`);
    } finally {
      setUpdatingPreviewId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestion des Templates
              </h1>
              <p className="text-gray-600">
                Analysez et enrichissez automatiquement les métadonnées des templates InDesign
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="secondary"
              leftIcon={<Icon name="ArrowLeft" size={18} />}
            >
              Retour
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <Icon name="AlertCircle" size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Erreur</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Icon name="CheckCircle" size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">Succès</p>
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Analyse Automatique
              </h2>
              <p className="text-sm text-gray-600">
                Extrait les métadonnées depuis InDesign et enrichit avec l'IA
              </p>
            </div>
            <Button
              onClick={handleAnalyzeAll}
              disabled={isAnalyzing || isLoading}
              leftIcon={<Icon name="Zap" size={18} />}
            >
              {isAnalyzing ? 'Analyse en cours...' : 'Analyser tous les templates'}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <Icon name="Loader" size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-indigo-900 font-medium">Analyse en cours...</p>
                  <p className="text-indigo-700 text-sm">
                    Ouverture des templates InDesign, extraction des métadonnées et enrichissement IA
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Liste des templates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Templates ({templates.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin inline-block mb-4">
                <Icon name="Loader" size={32} className="text-indigo-600" />
              </div>
              <p className="text-gray-600">Chargement des templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center">
              <Icon name="FileText" size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun template trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {templates.map((template) => {
                const isEditingPreview = previewEditor?.templateId === template.id;
                const isUpdatingPreview = updatingPreviewId === template.id;

                return (
                  <div key={template.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-6">
                      {/* Preview */}
                      <div className="flex-shrink-0">
                        {template.preview_url ? (
                          <img
                            src={template.preview_url}
                            alt={template.name}
                            className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-32 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <Icon name="FileText" size={32} className="text-indigo-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {template.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {template.description || 'Aucune description'}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {template.filename}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleAnalyzeOne(template.id)}
                              variant="secondary"
                              size="sm"
                              leftIcon={<Icon name="RefreshCw" size={14} />}
                            >
                              Analyser
                            </Button>
                            <Button
                              onClick={() => openPreviewEditor(template)}
                              variant="outline"
                              size="sm"
                              disabled={isUpdatingPreview}
                              leftIcon={<Icon name="Image" size={14} />}
                            >
                              {isEditingPreview
                                ? 'Fermer'
                                : template.preview_url
                                  ? "Modifier l'image"
                                  : 'Ajouter une image'}
                            </Button>
                          </div>
                        </div>

                        {/* Métadonnées */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Images</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {template.image_slots ?? '?'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Catégorie</p>
                            <p className="text-sm font-medium text-gray-900">
                              {template.category || 'Non définie'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Style</p>
                            <p className="text-sm font-medium text-gray-900">
                              {template.style || 'Non défini'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Statut</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              template.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {template.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </div>

                        {/* Placeholders */}
                        {template.placeholders && template.placeholders.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Placeholders détectés:</p>
                            <div className="flex flex-wrap gap-2">
                              {template.placeholders.map((placeholder, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-mono"
                                >
                                  {placeholder}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended for */}
                        {template.recommended_for && template.recommended_for.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Recommandé pour:</p>
                            <div className="flex flex-wrap gap-2">
                              {template.recommended_for.map((category, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {isEditingPreview && (
                          <div className="mt-6 border border-indigo-100 bg-indigo-50/60 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-semibold text-indigo-900">
                                  Image de preview
                                </h4>
                                <p className="text-xs text-indigo-700">
                                  Importez un visuel ou renseignez une URL publique.
                                </p>
                              </div>
                              {isUpdatingPreview && (
                                <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                                  <Icon name="Loader" size={14} className="animate-spin" />
                                  <span>Mise à jour...</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-indigo-800 mb-2">
                                  Aperçu actuel
                                </p>
                                {template.preview_url ? (
                                  <img
                                    src={template.preview_url}
                                    alt={template.name}
                                    className="w-full max-w-xs h-36 object-cover rounded-md border border-indigo-200 shadow-sm"
                                  />
                                ) : (
                                  <div className="h-36 max-w-xs bg-white/70 border border-dashed border-indigo-300 rounded-md flex items-center justify-center text-xs text-indigo-500">
                                    Aucune image définie
                                  </div>
                                )}
                              </div>
                              <div className="space-y-4">
                                <Input
                                  label="URL de l'image"
                                  placeholder="https://..."
                                  value={previewEditor?.value || ''}
                                  onChange={handlePreviewInputChange}
                                  disabled={isUpdatingPreview}
                                  description="Collez une URL (Supabase, CDN, site externe)"
                                />
                                <div>
                                  <label className="block text-xs font-medium text-indigo-800 mb-2">
                                    Importer une image (PNG, JPG, GIF, WebP)
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => {
                                      handleUploadPreview(template.id, event.target.files);
                                      event.target.value = '';
                                    }}
                                    disabled={isUpdatingPreview}
                                    className="block w-full text-xs text-indigo-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                                  />
                                  <p className="mt-1 text-[11px] text-indigo-600">
                                    Taille max 10 Mo. L'upload enregistre l'image automatiquement.
                                  </p>
                                </div>
                              </div>
                            </div>
                            {previewError && (
                              <p className="mt-3 text-sm text-red-600">{previewError}</p>
                            )}
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <Button
                                onClick={handleSavePreview}
                                size="sm"
                                disabled={isUpdatingPreview}
                                loading={isUpdatingPreview}
                                leftIcon={<Icon name="Save" size={14} />}
                              >
                                Enregistrer l'URL
                              </Button>
                              <Button
                                onClick={closePreviewEditor}
                                variant="ghost"
                                size="sm"
                                disabled={isUpdatingPreview}
                              >
                                Annuler
                              </Button>
                              {template.preview_url && (
                                <Button
                                  onClick={() => handleRemovePreview(template.id)}
                                  variant="danger"
                                  size="sm"
                                  disabled={isUpdatingPreview}
                                  leftIcon={<Icon name="Trash2" size={14} />}
                                >
                                  Supprimer l'image
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-900 font-semibold mb-2">
                Comment fonctionne l'analyse automatique ?
              </h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• <strong>Extraction InDesign:</strong> Ouvre chaque template et compte les emplacements d'images, extrait les placeholders de texte</li>
                <li>• <strong>Métadonnées:</strong> Récupère les polices, couleurs, dimensions du document</li>
                <li>• <strong>Enrichissement IA:</strong> GPT-4 analyse les données et suggère catégorie, style et tags</li>
                <li>• <strong>Mise à jour:</strong> Les métadonnées sont automatiquement enregistrées dans Supabase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesAdmin;
