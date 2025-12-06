import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ImageUploadZone = ({ onFilesUploaded, isUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e?.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e?.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e?.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e?.dataTransfer?.files)?.filter(file => 
      file?.type?.startsWith('image/')
    );
    
    if (files?.length > 0) {
      onFilesUploaded(files);
    }
  }, [onFilesUploaded]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e?.target?.files);
    if (files?.length > 0) {
      onFilesUploaded(files);
    }
    e.target.value = '';
  }, [onFilesUploaded]);

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-8 text-center transition-all duration-200 hover:border-primary/50">
      <div
        className={`transition-all duration-200 ${
          isDragOver ? 'scale-105 opacity-80' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Icon 
            name={isUploading ? "Loader2" : "Upload"} 
            size={32} 
            className={`text-primary ${isUploading ? 'animate-spin' : ''}`}
          />
        </div>
        
        <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
          {isUploading ? 'Téléchargement en cours...' : 'Glissez vos images ici'}
        </h3>
        
        <p className="text-muted-foreground mb-6">
          Ou cliquez pour sélectionner des fichiers
        </p>
        
        <div className="space-y-3">
          <Button
            variant="default"
            size="lg"
            iconName="FolderOpen"
            iconPosition="left"
            disabled={isUploading}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            Parcourir les fichiers
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Formats supportés : JPG, PNG, TIFF, PSD • Taille max : 50 MB par fichier
          </p>
        </div>
        
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploadZone;