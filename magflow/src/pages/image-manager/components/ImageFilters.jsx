import React from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const ImageFilters = ({ 
  searchTerm, 
  onSearchChange, 
  sortBy, 
  onSortChange, 
  filterBy, 
  onFilterChange,
  onClearFilters 
}) => {
  const sortOptions = [
    { value: 'name', label: 'Nom' },
    { value: 'date', label: 'Date d\'ajout' },
    { value: 'size', label: 'Taille' },
    { value: 'dimensions', label: 'Dimensions' }
  ];

  const filterOptions = [
    { value: 'all', label: 'Tous les fichiers' },
    { value: 'jpg', label: 'Images JPG' },
    { value: 'png', label: 'Images PNG' },
    { value: 'tiff', label: 'Images TIFF' },
    { value: 'psd', label: 'Fichiers PSD' },
    { value: 'optimized', label: 'Optimisées' },
    { value: 'pending', label: 'En attente' }
  ];

  const hasActiveFilters = searchTerm || sortBy !== 'date' || filterBy !== 'all';

  return (
    <div className="bg-card p-4 rounded-lg border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Filtres et recherche
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            iconPosition="left"
            onClick={onClearFilters}
          >
            Effacer
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-1">
          <Input
            type="search"
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e?.target?.value)}
            className="w-full"
          />
        </div>

        {/* Sort */}
        <div className="md:col-span-1">
          <Select
            placeholder="Trier par..."
            options={sortOptions}
            value={sortBy}
            onChange={onSortChange}
          />
        </div>

        {/* Filter */}
        <div className="md:col-span-1">
          <Select
            placeholder="Filtrer par type..."
            options={filterOptions}
            value={filterBy}
            onChange={onFilterChange}
          />
        </div>
      </div>
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterBy === 'optimized' ? 'default' : 'outline'}
          size="sm"
          iconName="CheckCircle"
          iconPosition="left"
          onClick={() => onFilterChange(filterBy === 'optimized' ? 'all' : 'optimized')}
        >
          Optimisées
        </Button>
        <Button
          variant={filterBy === 'pending' ? 'default' : 'outline'}
          size="sm"
          iconName="Clock"
          iconPosition="left"
          onClick={() => onFilterChange(filterBy === 'pending' ? 'all' : 'pending')}
        >
          En attente
        </Button>
        <Button
          variant={filterBy === 'jpg' ? 'default' : 'outline'}
          size="sm"
          iconName="Image"
          iconPosition="left"
          onClick={() => onFilterChange(filterBy === 'jpg' ? 'all' : 'jpg')}
        >
          JPG
        </Button>
        <Button
          variant={filterBy === 'png' ? 'default' : 'outline'}
          size="sm"
          iconName="Image"
          iconPosition="left"
          onClick={() => onFilterChange(filterBy === 'png' ? 'all' : 'png')}
        >
          PNG
        </Button>
      </div>
    </div>
  );
};

export default ImageFilters;