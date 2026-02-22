import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const ImageGrid = ({ 
  images, 
  selectedImages, 
  onImageSelect, 
  onImageEdit, 
  onImageCrop, 
  onImageDelete,
  onBatchDelete 
}) => {
  const [viewMode, setViewMode] = useState('grid');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const getOptimizationStatus = (status) => {
    switch (status) {
      case 'optimized':
        return { icon: 'CheckCircle', color: 'text-success', label: 'Optimisé' };
      case 'processing':
        return { icon: 'Loader2', color: 'text-warning', label: 'En cours' };
      case 'error':
        return { icon: 'XCircle', color: 'text-error', label: 'Erreur' };
      default:
        return { icon: 'Clock', color: 'text-muted-foreground', label: 'En attente' };
    }
  };

  const handleSelectAll = () => {
    if (selectedImages?.length === images?.length) {
      onImageSelect([]);
    } else {
      onImageSelect(images?.map(img => img?.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedImages?.length === images?.length && images?.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <span className="text-sm text-foreground">
              {selectedImages?.length > 0 
                ? `${selectedImages?.length} sélectionnée(s)`
                : `${images?.length} image(s)`
              }
            </span>
          </div>
          
          {selectedImages?.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              iconName="Trash2"
              iconPosition="left"
              onClick={() => onBatchDelete(selectedImages)}
            >
              Supprimer ({selectedImages?.length})
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            iconName="Grid3X3"
            onClick={() => setViewMode('grid')}
          />
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            iconName="List"
            onClick={() => setViewMode('list')}
          />
        </div>
      </div>
      {/* Images Grid/List */}
      {images?.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="ImageOff" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune image</h3>
          <p className="text-muted-foreground">Commencez par télécharger des images</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' ?'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' :'space-y-3'
        }>
          {images?.map((image) => {
            const isSelected = selectedImages?.includes(image?.id);
            const optimizationStatus = getOptimizationStatus(image?.optimizationStatus);
            
            return (
              <div
                key={image?.id}
                className={`bg-card rounded-lg border transition-all duration-200 hover:shadow-card ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                } ${viewMode === 'list' ? 'flex items-center p-4 space-x-4' : 'p-3'}`}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Image Thumbnail */}
                    <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={image?.thumbnail}
                        alt={image?.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e?.target?.checked) {
                              onImageSelect([...selectedImages, image?.id]);
                            } else {
                              onImageSelect(selectedImages?.filter(id => id !== image?.id));
                            }
                          }}
                          className="w-4 h-4 text-primary border-white rounded focus:ring-primary bg-white/80"
                        />
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <div className={`w-6 h-6 rounded-full bg-card flex items-center justify-center ${optimizationStatus?.color}`}>
                          <Icon 
                            name={optimizationStatus?.icon} 
                            size={12} 
                            className={optimizationStatus?.icon === 'Loader2' ? 'animate-spin' : ''}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Info */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground truncate" title={image?.name}>
                        {image?.name}
                      </h4>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{image?.dimensions}</span>
                        <span>{formatFileSize(image?.size)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          iconName="Edit3"
                          onClick={() => onImageEdit(image)}
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          iconName="Crop"
                          onClick={() => onImageCrop(image)}
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          iconName="Trash2"
                          onClick={() => onImageDelete(image?.id)}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e?.target?.checked) {
                            onImageSelect([...selectedImages, image?.id]);
                          } else {
                            onImageSelect(selectedImages?.filter(id => id !== image?.id));
                          }
                        }}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                    </div>
                    
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={image?.thumbnail}
                        alt={image?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {image?.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span>{image?.dimensions}</span>
                        <span>{formatFileSize(image?.size)}</span>
                        <div className="flex items-center space-x-1">
                          <Icon 
                            name={optimizationStatus?.icon} 
                            size={12} 
                            className={`${optimizationStatus?.color} ${optimizationStatus?.icon === 'Loader2' ? 'animate-spin' : ''}`}
                          />
                          <span className={optimizationStatus?.color}>
                            {optimizationStatus?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Edit3"
                        onClick={() => onImageEdit(image)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Crop"
                        onClick={() => onImageCrop(image)}
                      >
                        Recadrer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Trash2"
                        onClick={() => onImageDelete(image?.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageGrid;