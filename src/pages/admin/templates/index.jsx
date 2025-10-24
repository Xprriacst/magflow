import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/ui/Header';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { templatesAPI } from '../../../services/api';

const TemplatesAdmin = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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
              {templates.map((template) => (
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
                        <Button
                          onClick={() => handleAnalyzeOne(template.id)}
                          variant="secondary"
                          size="sm"
                          leftIcon={<Icon name="RefreshCw" size={14} />}
                        >
                          Analyser
                        </Button>
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
                    </div>
                  </div>
                </div>
              ))}
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
