import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickAdjustments = ({ template, onAdjustmentChange, isVisible, onToggle }) => {
  const [adjustments, setAdjustments] = useState({
    textSize: 100,
    lineSpacing: 100,
    imageScale: 100,
    margins: 100,
    colorSaturation: 100
  });

  const [activeCategory, setActiveCategory] = useState('text');

  const adjustmentCategories = {
    text: {
      label: 'Texte',
      icon: 'Type',
      controls: [
        {
          id: 'textSize',
          label: 'Taille du texte',
          min: 80,
          max: 120,
          step: 5,
          unit: '%',
          icon: 'Type'
        },
        {
          id: 'lineSpacing',
          label: 'Interlignage',
          min: 80,
          max: 150,
          step: 10,
          unit: '%',
          icon: 'AlignLeft'
        }
      ]
    },
    images: {
      label: 'Images',
      icon: 'Image',
      controls: [
        {
          id: 'imageScale',
          label: 'Échelle des images',
          min: 80,
          max: 120,
          step: 5,
          unit: '%',
          icon: 'Maximize'
        },
        {
          id: 'colorSaturation',
          label: 'Saturation',
          min: 50,
          max: 150,
          step: 10,
          unit: '%',
          icon: 'Palette'
        }
      ]
    },
    layout: {
      label: 'Mise en page',
      icon: 'Layout',
      controls: [
        {
          id: 'margins',
          label: 'Marges',
          min: 80,
          max: 120,
          step: 5,
          unit: '%',
          icon: 'Square'
        }
      ]
    }
  };

  const handleAdjustmentChange = (controlId, value) => {
    const newAdjustments = {
      ...adjustments,
      [controlId]: value
    };
    setAdjustments(newAdjustments);
    onAdjustmentChange(newAdjustments);
  };

  const resetAdjustments = () => {
    const resetValues = {
      textSize: 100,
      lineSpacing: 100,
      imageScale: 100,
      margins: 100,
      colorSaturation: 100
    };
    setAdjustments(resetValues);
    onAdjustmentChange(resetValues);
  };

  const hasChanges = Object.values(adjustments)?.some(value => value !== 100);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        iconName="Sliders"
        iconPosition="left"
        iconSize={16}
        className="fixed bottom-16 right-4 z-20 shadow-lg"
      >
        Ajustements rapides
      </Button>
    );
  }

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 w-80 bg-card border border-border rounded-lg shadow-modal z-30">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="Sliders" size={18} className="text-primary" />
            <h3 className="font-heading font-semibold text-foreground">
              Ajustements rapides
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAdjustments}
                iconName="RotateCcw"
                iconSize={14}
                className="text-xs"
              >
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="w-6 h-6"
            >
              <Icon name="X" size={14} />
            </Button>
          </div>
        </div>
      </div>
      {/* Category Tabs */}
      <div className="flex border-b border-border">
        {Object.entries(adjustmentCategories)?.map(([categoryId, category]) => (
          <button
            key={categoryId}
            onClick={() => setActiveCategory(categoryId)}
            className={`flex-1 p-3 flex items-center justify-center space-x-2 transition-colors duration-150 ${
              activeCategory === categoryId
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <Icon name={category?.icon} size={16} />
            <span className="text-sm font-medium">{category?.label}</span>
          </button>
        ))}
      </div>
      {/* Controls */}
      <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
        {adjustmentCategories?.[activeCategory]?.controls?.map((control) => (
          <div key={control?.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon name={control?.icon} size={14} className="text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">
                  {control?.label}
                </label>
              </div>
              <span className="text-sm text-muted-foreground">
                {adjustments?.[control?.id]}{control?.unit}
              </span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min={control?.min}
                max={control?.max}
                step={control?.step}
                value={adjustments?.[control?.id]}
                onChange={(e) => handleAdjustmentChange(control?.id, parseInt(e?.target?.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{control?.min}{control?.unit}</span>
                <span>{control?.max}{control?.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Preview Impact */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="Eye" size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Impact des modifications</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Lisibilité:</span>
            <span className={`font-medium ${
              adjustments?.textSize >= 90 && adjustments?.lineSpacing >= 90 
                ? 'text-success' :'text-warning'
            }`}>
              {adjustments?.textSize >= 90 && adjustments?.lineSpacing >= 90 ? 'Optimale' : 'Réduite'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Équilibre:</span>
            <span className={`font-medium ${
              Math.abs(adjustments?.imageScale - 100) <= 10 && Math.abs(adjustments?.margins - 100) <= 10
                ? 'text-success' :'text-warning'
            }`}>
              {Math.abs(adjustments?.imageScale - 100) <= 10 && Math.abs(adjustments?.margins - 100) <= 10 ? 'Maintenu' : 'Modifié'}
            </span>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded text-xs text-warning">
            <Icon name="Info" size={12} className="inline mr-1" />
            Ces ajustements sont temporaires et seront appliqués lors de l'export.
          </div>
        )}
      </div>
      {/* Apply Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="default"
          fullWidth
          disabled={!hasChanges}
          iconName="Check"
          iconPosition="left"
          iconSize={16}
        >
          Appliquer les modifications
        </Button>
      </div>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default QuickAdjustments;