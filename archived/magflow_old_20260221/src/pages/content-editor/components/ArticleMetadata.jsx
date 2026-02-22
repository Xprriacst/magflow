import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ArticleMetadata = ({ metadata, onChange, onValidate }) => {
  const [formData, setFormData] = useState({
    titre: metadata?.titre || '',
    sousTitre: metadata?.sousTitre || '',
    auteur: metadata?.auteur || '',
    categorie: metadata?.categorie || '',
    tags: metadata?.tags || [],
    datePublication: metadata?.datePublication || '',
    statut: metadata?.statut || 'brouillon',
    priorite: metadata?.priorite || 'normale',
    ...metadata
  });

  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');

  const categorieOptions = [
    { value: 'actualites', label: 'Actualités' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'technologie', label: 'Technologie' },
    { value: 'culture', label: 'Culture' },
    { value: 'sport', label: 'Sport' },
    { value: 'economie', label: 'Économie' },
    { value: 'sante', label: 'Santé' },
    { value: 'voyage', label: 'Voyage' },
    { value: 'mode', label: 'Mode' },
    { value: 'gastronomie', label: 'Gastronomie' }
  ];

  const statutOptions = [
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'revision', label: 'En révision' },
    { value: 'approuve', label: 'Approuvé' },
    { value: 'publie', label: 'Publié' },
    { value: 'archive', label: 'Archivé' }
  ];

  const prioriteOptions = [
    { value: 'basse', label: 'Basse' },
    { value: 'normale', label: 'Normale' },
    { value: 'haute', label: 'Haute' },
    { value: 'urgente', label: 'Urgente' }
  ];

  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    if (onChange) {
      onChange(updatedData);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.titre?.trim()) {
      newErrors.titre = 'Le titre est obligatoire';
    } else if (formData?.titre?.length < 5) {
      newErrors.titre = 'Le titre doit contenir au moins 5 caractères';
    }
    
    if (!formData?.auteur?.trim()) {
      newErrors.auteur = 'L\'auteur est obligatoire';
    }
    
    if (!formData?.categorie) {
      newErrors.categorie = 'La catégorie est obligatoire';
    }
    
    if (formData?.datePublication && new Date(formData.datePublication) < new Date()) {
      newErrors.datePublication = 'La date de publication ne peut pas être dans le passé';
    }
    
    setErrors(newErrors);
    
    if (onValidate) {
      onValidate(Object.keys(newErrors)?.length === 0, newErrors);
    }
    
    return Object.keys(newErrors)?.length === 0;
  };

  const addTag = () => {
    if (newTag?.trim() && !formData?.tags?.includes(newTag?.trim())) {
      const updatedTags = [...formData?.tags, newTag?.trim()];
      handleInputChange('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    const updatedTags = formData?.tags?.filter(tag => tag !== tagToRemove);
    handleInputChange('tags', updatedTags);
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter') {
      e?.preventDefault();
      addTag();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Métadonnées de l'article
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={validateForm}
          iconName="CheckCircle"
          iconPosition="left"
          iconSize={16}
        >
          Valider
        </Button>
      </div>
      <div className="space-y-4">
        {/* Titre */}
        <Input
          label="Titre de l'article"
          type="text"
          placeholder="Saisissez le titre principal..."
          value={formData?.titre}
          onChange={(e) => handleInputChange('titre', e?.target?.value)}
          error={errors?.titre}
          required
          maxLength={100}
          description={`${formData?.titre?.length}/100 caractères`}
        />

        {/* Sous-titre */}
        <Input
          label="Sous-titre"
          type="text"
          placeholder="Sous-titre optionnel..."
          value={formData?.sousTitre}
          onChange={(e) => handleInputChange('sousTitre', e?.target?.value)}
          maxLength={150}
          description={`${formData?.sousTitre?.length}/150 caractères`}
        />

        {/* Auteur et Catégorie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Auteur"
            type="text"
            placeholder="Nom de l'auteur..."
            value={formData?.auteur}
            onChange={(e) => handleInputChange('auteur', e?.target?.value)}
            error={errors?.auteur}
            required
          />

          <Select
            label="Catégorie"
            placeholder="Sélectionnez une catégorie..."
            options={categorieOptions}
            value={formData?.categorie}
            onChange={(value) => handleInputChange('categorie', value)}
            error={errors?.categorie}
            required
          />
        </div>

        {/* Statut et Priorité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Statut"
            options={statutOptions}
            value={formData?.statut}
            onChange={(value) => handleInputChange('statut', value)}
          />

          <Select
            label="Priorité"
            options={prioriteOptions}
            value={formData?.priorite}
            onChange={(value) => handleInputChange('priorite', value)}
          />
        </div>

        {/* Date de publication */}
        <Input
          label="Date de publication"
          type="datetime-local"
          value={formData?.datePublication}
          onChange={(e) => handleInputChange('datePublication', e?.target?.value)}
          error={errors?.datePublication}
          description="Laissez vide pour une publication immédiate"
        />

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Mots-clés
          </label>
          
          <div className="flex items-center gap-2 mb-3">
            <Input
              type="text"
              placeholder="Ajouter un mot-clé..."
              value={newTag}
              onChange={(e) => setNewTag(e?.target?.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addTag}
              iconName="Plus"
              iconSize={16}
              disabled={!newTag?.trim()}
            >
              Ajouter
            </Button>
          </div>

          {formData?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData?.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-error transition-colors duration-150"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Résumé des métadonnées */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Icon name="Info" size={16} />
            Résumé
          </h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Titre:</strong> {formData?.titre || 'Non défini'}</p>
            <p><strong>Auteur:</strong> {formData?.auteur || 'Non défini'}</p>
            <p><strong>Catégorie:</strong> {categorieOptions?.find(c => c?.value === formData?.categorie)?.label || 'Non définie'}</p>
            <p><strong>Statut:</strong> {statutOptions?.find(s => s?.value === formData?.statut)?.label}</p>
            <p><strong>Mots-clés:</strong> {formData?.tags?.length > 0 ? formData?.tags?.join(', ') : 'Aucun'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleMetadata;