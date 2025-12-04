import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Image from '../../../components/AppImage';

const ImageEditPanel = ({ image, onSave, onCancel, onCrop }) => {
  const [editedImage, setEditedImage] = useState({
    name: image?.name || '',
    quality: image?.quality || 85,
    format: image?.format || 'jpg',
    width: image?.width || 1920,
    height: image?.height || 1080
  });

  const formatOptions = [
    { value: 'jpg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'tiff', label: 'TIFF' }
  ];

  const cropRatios = [
    { value: 'free', label: 'Libre', ratio: null },
    { value: '16:9', label: '16:9 (Paysage)', ratio: 16/9 },
    { value: '4:3', label: '4:3 (Standard)', ratio: 4/3 },
    { value: '1:1', label: '1:1 (Carré)', ratio: 1 },
    { value: '3:4', label: '3:4 (Portrait)', ratio: 3/4 },
    { value: '9:16', label: '9:16 (Mobile)', ratio: 9/16 }
  ];

  const qualityPresets = [
    { value: 100, label: 'Maximum (100%)', description: 'Qualité maximale, fichier volumineux' },
    { value: 85, label: 'Élevée (85%)', description: 'Recommandé pour l\'impression' },
    { value: 70, label: 'Moyenne (70%)', description: 'Bon compromis qualité/taille' },
    { value: 50, label: 'Faible (50%)', description: 'Pour le web uniquement' }
  ];

  const handleSave = () => {
    onSave({
      ...image,
      ...editedImage
    });
  };

  const handleInputChange = (field, value) => {
    setEditedImage(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const maintainAspectRatio = (field, value) => {
    if (!image) return;
    
    const originalRatio = image?.width / image?.height;
    
    if (field === 'width') {
      setEditedImage(prev => ({
        ...prev,
        width: parseInt(value),
        height: Math.round(parseInt(value) / originalRatio)
      }));
    } else if (field === 'height') {
      setEditedImage(prev => ({
        ...prev,
        height: parseInt(value),
        width: Math.round(parseInt(value) * originalRatio)
      }));
    }
  };

  if (!image) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Édition d'image
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button
            variant="default"
            size="sm"
            iconName="Save"
            iconPosition="left"
            onClick={handleSave}
          >
            Enregistrer
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Aperçu</h4>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <Image
              src={image?.url}
              alt={image?.name}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="sm"
              iconName="Crop"
              iconPosition="left"
              onClick={() => onCrop(image)}
            >
              Recadrer
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="RotateCw"
              iconPosition="left"
            >
              Rotation
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Paramètres</h4>
          
          {/* Name */}
          <Input
            label="Nom du fichier"
            type="text"
            value={editedImage?.name}
            onChange={(e) => handleInputChange('name', e?.target?.value)}
          />

          {/* Format */}
          <Select
            label="Format de sortie"
            options={formatOptions}
            value={editedImage?.format}
            onChange={(value) => handleInputChange('format', value)}
          />

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Largeur (px)"
              type="number"
              value={editedImage?.width}
              onChange={(e) => maintainAspectRatio('width', e?.target?.value)}
            />
            <Input
              label="Hauteur (px)"
              type="number"
              value={editedImage?.height}
              onChange={(e) => maintainAspectRatio('height', e?.target?.value)}
            />
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Qualité ({editedImage?.quality}%)
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={editedImage?.quality}
              onChange={(e) => handleInputChange('quality', parseInt(e?.target?.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="grid grid-cols-2 gap-2">
              {qualityPresets?.map((preset) => (
                <button
                  key={preset?.value}
                  onClick={() => handleInputChange('quality', preset?.value)}
                  className={`p-2 text-xs rounded border transition-colors ${
                    editedImage?.quality === preset?.value
                      ? 'border-primary bg-primary/10 text-primary' :'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{preset?.label}</div>
                  <div className="text-xs opacity-75">{preset?.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Crop Ratios */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Ratios de recadrage
            </label>
            <div className="grid grid-cols-2 gap-2">
              {cropRatios?.map((ratio) => (
                <Button
                  key={ratio?.value}
                  variant="outline"
                  size="sm"
                  onClick={() => onCrop(image, ratio?.ratio)}
                  className="justify-start"
                >
                  {ratio?.label}
                </Button>
              ))}
            </div>
          </div>

          {/* File Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h5 className="font-medium text-foreground">Informations</h5>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Taille originale :</span>
                <span>{image?.width} × {image?.height}</span>
              </div>
              <div className="flex justify-between">
                <span>Taille du fichier :</span>
                <span>{(image?.size / 1024 / 1024)?.toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Format :</span>
                <span>{image?.format?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Statut :</span>
                <span className={`inline-flex items-center space-x-1 ${
                  image?.optimizationStatus === 'optimized' ? 'text-success' : 'text-warning'
                }`}>
                  <Icon 
                    name={image?.optimizationStatus === 'optimized' ? 'CheckCircle' : 'Clock'} 
                    size={12} 
                  />
                  <span>
                    {image?.optimizationStatus === 'optimized' ? 'Optimisé' : 'En attente'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditPanel;