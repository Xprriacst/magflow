import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const TextStructureEditor = ({ content, onStructureChange, isAnalyzing = false }) => {
  const [structure, setStructure] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [tempValues, setTempValues] = useState({});

  // Initialize structure when received
  useEffect(() => {
    if (content && !structure) {
      // Default structure if analysis hasn't completed yet
      setStructure({
        titre_principal: '',
        chapo: '',
        sous_titres: [],
        sections: [],
        mots_cles: [],
        categorie_suggeree: '',
        temps_lecture: 0,
        niveau_complexite: 'moyen'
      });
    }
  }, [content, structure]);

  // Update structure when parent provides analyzed data
  useEffect(() => {
    if (content?.analyzedStructure) {
      setStructure(content?.analyzedStructure);
      onStructureChange?.(content?.analyzedStructure);
    }
  }, [content?.analyzedStructure, onStructureChange]);

  // Handle field editing
  const handleEdit = (field, value = null) => {
    setEditingField(field);
    if (value !== null) {
      setTempValues(prev => ({ ...prev, [field]: value }));
    } else {
      setTempValues(prev => ({ ...prev, [field]: structure?.[field] || '' }));
    }
  };

  // Save field changes
  const saveField = (field) => {
    const newValue = tempValues?.[field];
    const updatedStructure = { ...structure, [field]: newValue };
    setStructure(updatedStructure);
    setEditingField(null);
    setTempValues(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
    onStructureChange?.(updatedStructure);
  };

  // Cancel field editing
  const cancelEdit = () => {
    setEditingField(null);
    setTempValues({});
  };

  // Add new section
  const addSection = () => {
    const newSection = {
      titre: 'Nouveau sous-titre',
      contenu: 'Contenu de la section...',
      type: 'corps'
    };
    const updatedSections = [...(structure?.sections || []), newSection];
    const updatedStructure = { ...structure, sections: updatedSections };
    setStructure(updatedStructure);
    onStructureChange?.(updatedStructure);
  };

  // Remove section
  const removeSection = (index) => {
    const updatedSections = structure?.sections?.filter((_, i) => i !== index);
    const updatedStructure = { ...structure, sections: updatedSections };
    setStructure(updatedStructure);
    onStructureChange?.(updatedStructure);
  };

  // Update section
  const updateSection = (index, field, value) => {
    const updatedSections = structure?.sections?.map((section, i) =>
      i === index ? { ...section, [field]: value } : section
    );
    const updatedStructure = { ...structure, sections: updatedSections };
    setStructure(updatedStructure);
    onStructureChange?.(updatedStructure);
  };

  // Add keyword
  const addKeyword = () => {
    const keyword = prompt('Nouveau mot-clé:');
    if (keyword?.trim()) {
      const updatedKeywords = [...(structure?.mots_cles || []), keyword?.trim()];
      const updatedStructure = { ...structure, mots_cles: updatedKeywords };
      setStructure(updatedStructure);
      onStructureChange?.(updatedStructure);
    }
  };

  // Remove keyword
  const removeKeyword = (index) => {
    const updatedKeywords = structure?.mots_cles?.filter((_, i) => i !== index);
    const updatedStructure = { ...structure, mots_cles: updatedKeywords };
    setStructure(updatedStructure);
    onStructureChange?.(updatedStructure);
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Icon name="Brain" size={20} className="text-white" />
            <h3 className="text-lg font-semibold text-white">Analyse de la structure</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl animate-pulse">
                <Icon name="Sparkles" size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">Analyse en cours...</p>
                <p className="text-gray-500 text-sm">Identification des parties du texte</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!structure) {
    return null;
  }

  return (
    <div className="text-structure-editor bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <Icon name="FileEdit" size={20} className="text-white" />
          <h3 className="text-lg font-semibold text-white">Structure éditoriale</h3>
        </div>
        <p className="text-green-100 text-sm mt-1">
          Modifiez les parties identifiées de votre texte
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Titre principal */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Icon name="Type" size={16} />
            Titre principal
          </label>
          {editingField === 'titre_principal' ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempValues?.titre_principal || ''}
                onChange={(e) => setTempValues(prev => ({ 
                  ...prev, 
                  titre_principal: e?.target?.value 
                }))}
                className="flex-1"
                placeholder="Saisissez le titre principal..."
              />
              <Button 
                size="sm" 
                onClick={() => saveField('titre_principal')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Icon name="Check" size={14} />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={cancelEdit}
              >
                <Icon name="X" size={14} />
              </Button>
            </div>
          ) : (
            <div 
              className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleEdit('titre_principal')}
            >
              <p className="text-gray-800 font-medium">
                {structure?.titre_principal || 'Cliquez pour définir le titre principal'}
              </p>
            </div>
          )}
        </div>

        {/* Chapo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Icon name="Quote" size={16} />
            Chapo (introduction)
          </label>
          {editingField === 'chapo' ? (
            <div className="space-y-2">
              <textarea
                value={tempValues?.chapo || ''}
                onChange={(e) => setTempValues(prev => ({ 
                  ...prev, 
                  chapo: e?.target?.value 
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Saisissez le chapo..."
              />
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => saveField('chapo')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Icon name="Check" size={14} />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={cancelEdit}
                >
                  <Icon name="X" size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleEdit('chapo')}
            >
              <p className="text-gray-700 text-sm italic">
                {structure?.chapo || 'Cliquez pour définir le chapo'}
              </p>
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Icon name="List" size={16} />
              Sections ({structure?.sections?.length || 0})
            </label>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={addSection}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Icon name="Plus" size={14} className="mr-1" />
              Ajouter
            </Button>
          </div>

          {structure?.sections?.map((section, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={section?.type || 'corps'}
                  onChange={(e) => updateSection(index, 'type', e?.target?.value)}
                  className="text-xs bg-gray-100 border-0 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="introduction">Introduction</option>
                  <option value="corps">Corps</option>
                  <option value="conclusion">Conclusion</option>
                  <option value="citation">Citation</option>
                  <option value="encadre">Encadré</option>
                </select>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => removeSection(index)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>

              <Input
                value={section?.titre || ''}
                onChange={(e) => updateSection(index, 'titre', e?.target?.value)}
                placeholder="Titre de la section..."
                className="font-medium"
              />

              <textarea
                value={section?.contenu || ''}
                onChange={(e) => updateSection(index, 'contenu', e?.target?.value)}
                placeholder="Contenu de la section..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={3}
              />
            </div>
          ))}

          {(!structure?.sections || structure?.sections?.length === 0) && (
            <div className="text-center py-6 text-gray-500">
              <Icon name="FileText" size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Aucune section définie</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={addSection}
                className="mt-2 text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                Créer la première section
              </Button>
            </div>
          )}
        </div>

        {/* Mots-clés */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Icon name="Tag" size={16} />
              Mots-clés ({structure?.mots_cles?.length || 0})
            </label>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={addKeyword}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Icon name="Plus" size={14} className="mr-1" />
              Ajouter
            </Button>
          </div>

          {structure?.mots_cles && structure?.mots_cles?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {structure?.mots_cles?.map((keyword, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{keyword}</span>
                  <button
                    onClick={() => removeKeyword(index)}
                    className="hover:bg-purple-200 rounded-full p-1 transition-colors"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">Aucun mot-clé défini</p>
          )}
        </div>

        {/* Informations supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Catégorie</p>
            <p className="font-medium text-gray-800">
              {structure?.categorie_suggeree || 'Non définie'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Temps de lecture</p>
            <p className="font-medium text-gray-800">
              {structure?.temps_lecture ? `${structure?.temps_lecture} min` : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Complexité</p>
            <p className="font-medium text-gray-800 capitalize">
              {structure?.niveau_complexite || 'Moyen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextStructureEditor;