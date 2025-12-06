import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import WorkflowProgress from '../../components/ui/WorkflowProgress';
import TemplateCard from './components/TemplateCard';
import FilterPanel from './components/FilterPanel';
import TemplateComparison from './components/TemplateComparison';
import RecommendedSection from './components/RecommendedSection';
import TemplatePreviewModal from './components/TemplatePreviewModal';

const TemplateGallery = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [comparisonTemplates, setComparisonTemplates] = useState([]);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filters, setFilters] = useState({
    search: '',
    sort: 'recommended',
    magazineType: 'all',
    complexity: 'all',
    pageCount: 'all',
    minRating: 0,
    highResImages: false,
    multipleImages: false,
    coverImages: false,
    indesign2024: false,
    indesign2023: false,
    indesign2022: false,
    fastProcessing: false,
    mediumProcessing: false
  });

  // Mock templates data
  const mockTemplates = [
    {
      id: 1,
      name: "UGANEM DUS QUIS-TIONEM. AXEM",
      description: "Modèle de magazine moderne avec mise en page double page artistique, typographie créative et espaces dédiés aux visuels haute résolution avec peintures corporelles colorées.",
      type: "Mode",
      previewImage: "/assets/images/Capture_d_ecran_2025-09-12_a_22.10.38-1757771169491.png",
      pageCount: 2,
      imageSlots: 3,
      textCapacity: "1500 mots",
      complexity: "Complexe",
      processingTime: "8-10 min",
      indesignVersion: "2024",
      rating: 5,
      reviews: 245,
      usageCount: "3.2k",
      isRecommended: true,
      isFeatured: true
    },
    {
      id: 2,
      name: "Magazine Mode Élégant",
      description: "Modèle sophistiqué pour magazines de mode avec mise en page moderne et espaces généreux pour les images haute résolution.",
      type: "Mode",
      previewImage: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop&crop=center&q=80",
      pageCount: 8,
      imageSlots: 12,
      textCapacity: "2500 mots",
      complexity: "Modéré",
      processingTime: "6-8 min",
      indesignVersion: "2024",
      rating: 5,
      reviews: 127,
      usageCount: "1.2k",
      isRecommended: true
    },
    {
      id: 3,
      name: "Actualités Express",
      description: "Template optimisé pour les magazines d\'actualités avec une structure claire et une hiérarchie d\'information efficace.",
      type: "Actualités",
      previewImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop&crop=center&q=80",
      pageCount: 12,
      imageSlots: 8,
      textCapacity: "4000 mots",
      complexity: "Simple",
      processingTime: "4-6 min",
      indesignVersion: "2023",
      rating: 4,
      reviews: 89,
      usageCount: "856",
      isRecommended: true
    },
    {
      id: 4,
      name: "Lifestyle Moderne",
      description: "Design contemporain pour magazines lifestyle avec équilibre parfait entre texte et visuels pour une lecture agréable.",
      type: "Lifestyle",
      previewImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=center&q=80",
      pageCount: 16,
      imageSlots: 20,
      textCapacity: "3200 mots",
      complexity: "Complexe",
      processingTime: "10-12 min",
      indesignVersion: "2024",
      rating: 5,
      reviews: 203,
      usageCount: "2.1k",
      isRecommended: true
    },
    {
      id: 5,
      name: "Business Professional",
      description: "Template professionnel pour magazines business avec design épuré et mise en valeur des données et graphiques.",
      type: "Business",
      previewImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop&crop=center&q=80",
      pageCount: 10,
      imageSlots: 6,
      textCapacity: "3500 mots",
      complexity: "Simple",
      processingTime: "5-7 min",
      indesignVersion: "2023",
      rating: 4,
      reviews: 156,
      usageCount: "934",
      isRecommended: false
    },
    {
      id: 6,
      name: "Culture & Arts",
      description: "Design artistique pour magazines culturels avec typographie créative et espaces dédiés aux œuvres d\'art.",
      type: "Culture",
      previewImage: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=600&fit=crop&crop=center&q=80",
      pageCount: 14,
      imageSlots: 18,
      textCapacity: "2800 mots",
      complexity: "Complexe",
      processingTime: "8-10 min",
      indesignVersion: "2024",
      rating: 5,
      reviews: 91,
      usageCount: "567",
      isRecommended: false
    },
    {
      id: 7,
      name: "Sport Dynamique",
      description: "Template énergique pour magazines sportifs avec mise en page dynamique et espaces pour photos d'action.",
      type: "Sport",
      previewImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=600&fit=crop&crop=center&q=80",
      pageCount: 12,
      imageSlots: 15,
      textCapacity: "3000 mots",
      complexity: "Modéré",
      processingTime: "7-9 min",
      indesignVersion: "2023",
      rating: 4,
      reviews: 134,
      usageCount: "1.1k",
      isRecommended: false
    },
    {
      id: 8,
      name: "Minimaliste Chic",
      description: "Design épuré et minimaliste pour magazines haut de gamme avec focus sur la qualité du contenu et des images.",
      type: "Mode",
      previewImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=600&fit=crop&crop=center&q=80",
      pageCount: 6,
      imageSlots: 8,
      textCapacity: "1800 mots",
      complexity: "Simple",
      processingTime: "3-5 min",
      indesignVersion: "2024",
      rating: 5,
      reviews: 78,
      usageCount: "445",
      isRecommended: false
    },
    {
      id: 9,
      name: "Tech Innovation",
      description: "Template moderne pour magazines technologiques avec design futuriste et espaces pour infographies complexes.",
      type: "Business",
      previewImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&crop=center&q=80",
      pageCount: 18,
      imageSlots: 14,
      textCapacity: "4500 mots",
      complexity: "Complexe",
      processingTime: "12-15 min",
      indesignVersion: "2024",
      rating: 4,
      reviews: 167,
      usageCount: "789",
      isRecommended: false
    }
  ];

  const [filteredTemplates, setFilteredTemplates] = useState(mockTemplates);

  // Filter templates based on current filters
  useEffect(() => {
    let filtered = [...mockTemplates];

    // Search filter
    if (filters?.search) {
      filtered = filtered?.filter(template =>
        template?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        template?.description?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        template?.type?.toLowerCase()?.includes(filters?.search?.toLowerCase())
      );
    }

    // Magazine type filter
    if (filters?.magazineType !== 'all') {
      const typeMap = {
        'mode': 'Mode',
        'actualites': 'Actualités',
        'lifestyle': 'Lifestyle',
        'business': 'Business',
        'culture': 'Culture',
        'sport': 'Sport'
      };
      filtered = filtered?.filter(template => template?.type === typeMap?.[filters?.magazineType]);
    }

    // Complexity filter
    if (filters?.complexity !== 'all') {
      filtered = filtered?.filter(template => template?.complexity === filters?.complexity);
    }

    // Page count filter
    if (filters?.pageCount !== 'all') {
      filtered = filtered?.filter(template => {
        const pageCount = template?.pageCount;
        switch (filters?.pageCount) {
          case '1-5':
            return pageCount >= 1 && pageCount <= 5;
          case '6-10':
            return pageCount >= 6 && pageCount <= 10;
          case '11-20':
            return pageCount >= 11 && pageCount <= 20;
          case '20+':
            return pageCount > 20;
          default:
            return true;
        }
      });
    }

    // Rating filter
    if (filters?.minRating > 0) {
      filtered = filtered?.filter(template => template?.rating >= filters?.minRating);
    }

    // InDesign version filters
    if (filters?.indesign2024 || filters?.indesign2023 || filters?.indesign2022) {
      filtered = filtered?.filter(template => {
        if (filters?.indesign2024 && template?.indesignVersion === '2024') return true;
        if (filters?.indesign2023 && template?.indesignVersion === '2023') return true;
        if (filters?.indesign2022 && template?.indesignVersion === '2022') return true;
        return false;
      });
    }

    // Processing time filters
    if (filters?.fastProcessing || filters?.mediumProcessing) {
      filtered = filtered?.filter(template => {
        const processingTime = template?.processingTime;
        if (filters?.fastProcessing && processingTime?.includes('3-5') || processingTime?.includes('4-6')) return true;
        if (filters?.mediumProcessing && processingTime?.includes('6-8') || processingTime?.includes('7-9')) return true;
        return false;
      });
    }

    // Sort templates
    filtered?.sort((a, b) => {
      switch (filters?.sort) {
        case 'recommended':
          if (a?.isRecommended && !b?.isRecommended) return -1;
          if (!a?.isRecommended && b?.isRecommended) return 1;
          return b?.rating - a?.rating;
        case 'rating':
          return b?.rating - a?.rating;
        case 'popular':
          return parseInt(b?.usageCount?.replace('k', '000')?.replace('.', '')) - 
                 parseInt(a?.usageCount?.replace('k', '000')?.replace('.', ''));
        case 'recent':
          return b?.id - a?.id;
        case 'name':
          return a?.name?.localeCompare(b?.name);
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [filters]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
  };

  const handleCompareTemplate = (template) => {
    if (comparisonTemplates?.find(t => t?.id === template?.id)) {
      setComparisonTemplates(prev => prev?.filter(t => t?.id !== template?.id));
    } else if (comparisonTemplates?.length < 3) {
      setComparisonTemplates(prev => [...prev, template]);
    }
  };

  const handleRemoveFromComparison = (templateId) => {
    setComparisonTemplates(prev => prev?.filter(t => t?.id !== templateId));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      sort: 'recommended',
      magazineType: 'all',
      complexity: 'all',
      pageCount: 'all',
      minRating: 0,
      highResImages: false,
      multipleImages: false,
      coverImages: false,
      indesign2024: false,
      indesign2023: false,
      indesign2022: false,
      fastProcessing: false,
      mediumProcessing: false
    });
  };

  const handleProceedToPreview = () => {
    if (selectedTemplate) {
      navigate('/template-preview', { 
        state: { selectedTemplate } 
      });
    }
  };

  const handleBackToContent = () => {
    navigate('/content-editor');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WorkflowProgress />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Galerie de modèles
            </h1>
            <p className="text-muted-foreground">
              Découvrez et sélectionnez le modèle parfait pour votre magazine
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                iconName="Grid3X3"
                iconSize={16}
              />
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                iconName="List"
                iconSize={16}
              />
            </div>

            {/* Comparison Button */}
            {comparisonTemplates?.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowComparison(true)}
                iconName="GitCompare"
                iconPosition="left"
                iconSize={16}
              >
                Comparer ({comparisonTemplates?.length})
              </Button>
            )}

            {/* Navigation Buttons */}
            <Button
              variant="outline"
              onClick={handleBackToContent}
              iconName="ArrowLeft"
              iconPosition="left"
              iconSize={16}
            >
              Retour au contenu
            </Button>
            
            {selectedTemplate && (
              <Button
                variant="default"
                onClick={handleProceedToPreview}
                iconName="ArrowRight"
                iconPosition="right"
                iconSize={16}
              >
                Aperçu du modèle
              </Button>
            )}
          </div>
        </div>

        {/* Selected Template Banner */}
        {selectedTemplate && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name="Check" size={20} className="text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">
                    Modèle sélectionné: {selectedTemplate?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate?.pageCount} pages • {selectedTemplate?.imageSlots} images • {selectedTemplate?.processingTime}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTemplate(null)}
                iconName="X"
                iconSize={14}
              >
                Désélectionner
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Panel */}
          <div className="lg:w-80 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={handleClearFilters}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
            />
          </div>

          {/* Templates Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {filteredTemplates?.length} modèle{filteredTemplates?.length !== 1 ? 's' : ''} trouvé{filteredTemplates?.length !== 1 ? 's' : ''}
                </span>
                {filters?.search && (
                  <span className="text-sm text-muted-foreground">
                    pour "{filters?.search}"
                  </span>
                )}
              </div>
            </div>

            {/* Recommended Section */}
            <RecommendedSection
              templates={filteredTemplates}
              onSelectTemplate={handleSelectTemplate}
              onPreviewTemplate={handlePreviewTemplate}
              selectedTemplate={selectedTemplate}
              onCompareTemplate={handleCompareTemplate}
              comparisonTemplates={comparisonTemplates}
            />

            {/* All Templates */}
            <div className="mb-6">
              <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
                Tous les modèles
              </h2>
              
              {filteredTemplates?.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Aucun modèle trouvé
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez d'ajuster vos filtres pour voir plus de résultats
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    iconName="RotateCcw"
                    iconPosition="left"
                    iconSize={16}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" :"space-y-4"
                }>
                  {filteredTemplates?.map((template) => (
                    <TemplateCard
                      key={template?.id}
                      template={template}
                      onSelect={handleSelectTemplate}
                      onPreview={handlePreviewTemplate}
                      isSelected={selectedTemplate?.id === template?.id}
                      onCompare={handleCompareTemplate}
                      isInComparison={comparisonTemplates?.some(t => t?.id === template?.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={handleSelectTemplate}
          onCompare={handleCompareTemplate}
        />
      )}
      {/* Template Comparison Modal */}
      {showComparison && (
        <TemplateComparison
          templates={comparisonTemplates}
          onClose={() => setShowComparison(false)}
          onSelect={handleSelectTemplate}
          onRemoveFromComparison={handleRemoveFromComparison}
        />
      )}
    </div>
  );
};

export default TemplateGallery;