import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const FilterPanel = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  isOpen, 
  onToggle 
}) => {
  const magazineTypeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'mode', label: 'Mode' },
    { value: 'actualites', label: 'Actualités' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'business', label: 'Business' },
    { value: 'culture', label: 'Culture' },
    { value: 'sport', label: 'Sport' }
  ];

  const complexityOptions = [
    { value: 'all', label: 'Toute complexité' },
    { value: 'Simple', label: 'Simple' },
    { value: 'Modéré', label: 'Modéré' },
    { value: 'Complexe', label: 'Complexe' }
  ];

  const pageCountOptions = [
    { value: 'all', label: 'Toutes les pages' },
    { value: '1-5', label: '1-5 pages' },
    { value: '6-10', label: '6-10 pages' },
    { value: '11-20', label: '11-20 pages' },
    { value: '20+', label: '20+ pages' }
  ];

  const sortOptions = [
    { value: 'recommended', label: 'Recommandés' },
    { value: 'rating', label: 'Mieux notés' },
    { value: 'popular', label: 'Plus populaires' },
    { value: 'recent', label: 'Plus récents' },
    { value: 'name', label: 'Nom A-Z' }
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = Object.values(filters)?.filter(value => 
    value !== '' && value !== 'all' && value !== false && 
    (Array.isArray(value) ? value?.length > 0 : true)
  )?.length;

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={onToggle}
          iconName="Filter"
          iconPosition="left"
          iconSize={16}
          className="w-full justify-center"
        >
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>
      {/* Filter Panel */}
      <div className={`bg-card border border-border rounded-lg p-4 space-y-6 ${
        isOpen ? 'block' : 'hidden lg:block'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-foreground flex items-center space-x-2">
            <Icon name="Filter" size={18} />
            <span>Filtres</span>
          </h3>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Effacer tout
            </Button>
          )}
        </div>

        {/* Search */}
        <div>
          <Input
            type="search"
            placeholder="Rechercher un modèle..."
            value={filters?.search}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>

        {/* Sort */}
        <div>
          <Select
            label="Trier par"
            options={sortOptions}
            value={filters?.sort}
            onChange={(value) => handleFilterChange('sort', value)}
          />
        </div>

        {/* Magazine Type */}
        <div>
          <Select
            label="Type de magazine"
            options={magazineTypeOptions}
            value={filters?.magazineType}
            onChange={(value) => handleFilterChange('magazineType', value)}
          />
        </div>

        {/* Complexity */}
        <div>
          <Select
            label="Complexité"
            options={complexityOptions}
            value={filters?.complexity}
            onChange={(value) => handleFilterChange('complexity', value)}
          />
        </div>

        {/* Page Count */}
        <div>
          <Select
            label="Nombre de pages"
            options={pageCountOptions}
            value={filters?.pageCount}
            onChange={(value) => handleFilterChange('pageCount', value)}
          />
        </div>

        {/* Image Requirements */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Exigences d'images
          </label>
          <div className="space-y-2">
            <Checkbox
              label="Images haute résolution"
              checked={filters?.highResImages}
              onChange={(e) => handleFilterChange('highResImages', e?.target?.checked)}
            />
            <Checkbox
              label="Images multiples"
              checked={filters?.multipleImages}
              onChange={(e) => handleFilterChange('multipleImages', e?.target?.checked)}
            />
            <Checkbox
              label="Images de couverture"
              checked={filters?.coverImages}
              onChange={(e) => handleFilterChange('coverImages', e?.target?.checked)}
            />
          </div>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Note minimum
          </label>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1]?.map((rating) => (
              <Checkbox
                key={rating}
                label={
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: rating }, (_, i) => (
                      <Icon key={i} name="Star" size={12} className="text-warning fill-current" />
                    ))}
                    <span className="text-sm">et plus</span>
                  </div>
                }
                checked={filters?.minRating === rating}
                onChange={(e) => handleFilterChange('minRating', e?.target?.checked ? rating : 0)}
              />
            ))}
          </div>
        </div>

        {/* InDesign Compatibility */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Compatibilité InDesign
          </label>
          <div className="space-y-2">
            <Checkbox
              label="InDesign 2024"
              checked={filters?.indesign2024}
              onChange={(e) => handleFilterChange('indesign2024', e?.target?.checked)}
            />
            <Checkbox
              label="InDesign 2023"
              checked={filters?.indesign2023}
              onChange={(e) => handleFilterChange('indesign2023', e?.target?.checked)}
            />
            <Checkbox
              label="InDesign 2022"
              checked={filters?.indesign2022}
              onChange={(e) => handleFilterChange('indesign2022', e?.target?.checked)}
            />
          </div>
        </div>

        {/* Processing Time */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Temps de traitement
          </label>
          <div className="space-y-2">
            <Checkbox
              label="Moins de 5 minutes"
              checked={filters?.fastProcessing}
              onChange={(e) => handleFilterChange('fastProcessing', e?.target?.checked)}
            />
            <Checkbox
              label="Moins de 10 minutes"
              checked={filters?.mediumProcessing}
              onChange={(e) => handleFilterChange('mediumProcessing', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;