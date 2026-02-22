import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import WorkflowProgress from '../../components/ui/WorkflowProgress';
import ImageUploadZone from './components/ImageUploadZone';
import ImageGrid from './components/ImageGrid';
import ImageFilters from './components/ImageFilters';
import ImageEditPanel from './components/ImageEditPanel';
import UploadProgress from './components/UploadProgress';

import Button from '../../components/ui/Button';

const ImageManager = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [editingImage, setEditingImage] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Mock data for images
  useEffect(() => {
    const mockImages = [
      {
        id: 1,
        name: 'hero-banner-lifestyle.jpg',
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
        size: 2456789,
        width: 1920,
        height: 1080,
        format: 'jpg',
        quality: 85,
        dimensions: '1920×1080',
        optimizationStatus: 'optimized',
        uploadDate: new Date('2024-12-10'),
        usedInProjects: ['Magazine Lifestyle Q1']
      },
      {
        id: 2,
        name: 'article-fashion-trends.png',
        url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
        size: 1234567,
        width: 1600,
        height: 900,
        format: 'png',
        quality: 90,
        dimensions: '1600×900',
        optimizationStatus: 'processing',
        uploadDate: new Date('2024-12-11'),
        usedInProjects: []
      },
      {
        id: 3,
        name: 'portrait-interview-ceo.tiff',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        size: 8901234,
        width: 2400,
        height: 3200,
        format: 'tiff',
        quality: 100,
        dimensions: '2400×3200',
        optimizationStatus: 'pending',
        uploadDate: new Date('2024-12-12'),
        usedInProjects: ['Magazine Business']
      },
      {
        id: 4,
        name: 'product-showcase-tech.jpg',
        url: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300',
        size: 3456789,
        width: 1800,
        height: 1200,
        format: 'jpg',
        quality: 80,
        dimensions: '1800×1200',
        optimizationStatus: 'optimized',
        uploadDate: new Date('2024-12-09'),
        usedInProjects: ['Tech Review Q4']
      },
      {
        id: 5,
        name: 'background-texture-paper.psd',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
        size: 15678901,
        width: 3000,
        height: 2000,
        format: 'psd',
        quality: 100,
        dimensions: '3000×2000',
        optimizationStatus: 'error',
        uploadDate: new Date('2024-12-08'),
        usedInProjects: []
      },
      {
        id: 6,
        name: 'infographic-data-viz.png',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300',
        size: 987654,
        width: 1200,
        height: 1600,
        format: 'png',
        quality: 95,
        dimensions: '1200×1600',
        optimizationStatus: 'optimized',
        uploadDate: new Date('2024-12-07'),
        usedInProjects: ['Data Report 2024']
      }
    ];
    setImages(mockImages);
  }, []);

  const handleFilesUploaded = (files) => {
    setIsUploading(true);
    const newUploads = files?.map((file, index) => ({
      id: Date.now() + index,
      name: file?.name,
      file: file,
      progress: 0,
      status: 'pending'
    }));
    
    setUploads(prev => [...prev, ...newUploads]);
    
    // Simulate upload process
    newUploads?.forEach((upload, index) => {
      setTimeout(() => {
        simulateUpload(upload?.id);
      }, index * 500);
    });
  };

  const simulateUpload = (uploadId) => {
    const updateProgress = (progress) => {
      setUploads(prev => prev?.map(upload => 
        upload?.id === uploadId 
          ? { ...upload, progress, status: 'uploading' }
          : upload
      ));
    };

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Complete upload
        setUploads(prev => prev?.map(upload => 
          upload?.id === uploadId 
            ? { ...upload, progress: 100, status: 'completed' }
            : upload
        ));
        
        // Add to images list
        const upload = uploads?.find(u => u?.id === uploadId);
        if (upload) {
          const newImage = {
            id: Date.now() + Math.random(),
            name: upload?.name,
            url: URL.createObjectURL(upload?.file),
            thumbnail: URL.createObjectURL(upload?.file),
            size: upload?.file?.size,
            width: 1920,
            height: 1080,
            format: upload?.file?.name?.split('.')?.pop()?.toLowerCase(),
            quality: 85,
            dimensions: '1920×1080',
            optimizationStatus: 'pending',
            uploadDate: new Date(),
            usedInProjects: []
          };
          setImages(prev => [newImage, ...prev]);
        }
        
        // Check if all uploads are complete
        setTimeout(() => {
          setUploads(prev => {
            const remaining = prev?.filter(u => u?.status !== 'completed');
            if (remaining?.length === 0) {
              setIsUploading(false);
            }
            return remaining;
          });
        }, 1000);
      } else {
        updateProgress(progress);
      }
    }, 200);
  };

  const handleUploadCancel = (uploadId) => {
    setUploads(prev => prev?.filter(upload => upload?.id !== uploadId));
  };

  const handleUploadRetry = (uploadId) => {
    setUploads(prev => prev?.map(upload => 
      upload?.id === uploadId 
        ? { ...upload, progress: 0, status: 'pending' }
        : upload
    ));
    setTimeout(() => simulateUpload(uploadId), 500);
  };

  const handleImageEdit = (image) => {
    setEditingImage(image);
  };

  const handleImageCrop = (image, ratio = null) => {
    // In a real app, this would open a crop modal
    console.log('Cropping image:', image?.name, 'with ratio:', ratio);
  };

  const handleImageDelete = (imageId) => {
    setImages(prev => prev?.filter(img => img?.id !== imageId));
    setSelectedImages(prev => prev?.filter(id => id !== imageId));
  };

  const handleBatchDelete = (imageIds) => {
    setImages(prev => prev?.filter(img => !imageIds?.includes(img?.id)));
    setSelectedImages([]);
  };

  const handleImageSave = (updatedImage) => {
    setImages(prev => prev?.map(img => 
      img?.id === updatedImage?.id ? updatedImage : img
    ));
    setEditingImage(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSortBy('date');
    setFilterBy('all');
  };

  // Filter and sort images
  const filteredImages = images?.filter(image => {
    const matchesSearch = image?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesFilter = filterBy === 'all' || 
      image?.format === filterBy || 
      image?.optimizationStatus === filterBy;
    return matchesSearch && matchesFilter;
  })?.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a?.name?.localeCompare(b?.name);
      case 'size':
        return b?.size - a?.size;
      case 'dimensions':
        return (b?.width * b?.height) - (a?.width * a?.height);
      case 'date':
      default:
        return new Date(b.uploadDate) - new Date(a.uploadDate);
    }
  });

  const handleContinueToTemplates = () => {
    navigate('/template-gallery');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WorkflowProgress />
      <main className="pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                Gestionnaire d'images
              </h1>
              <p className="text-muted-foreground">
                Téléchargez, organisez et optimisez vos images pour les modèles de magazine
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                iconName="ArrowLeft"
                iconPosition="left"
                onClick={() => navigate('/content-editor')}
              >
                Retour au contenu
              </Button>
              <Button
                variant="default"
                iconName="ArrowRight"
                iconPosition="right"
                onClick={handleContinueToTemplates}
                disabled={images?.length === 0}
              >
                Continuer vers les modèles
              </Button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploads?.length > 0 && (
            <UploadProgress
              uploads={uploads}
              onCancel={handleUploadCancel}
              onRetry={handleUploadRetry}
            />
          )}

          {/* Upload Zone */}
          {!editingImage && (
            <ImageUploadZone
              onFilesUploaded={handleFilesUploaded}
              isUploading={isUploading}
            />
          )}

          {/* Edit Panel */}
          {editingImage && (
            <ImageEditPanel
              image={editingImage}
              onSave={handleImageSave}
              onCancel={() => setEditingImage(null)}
              onCrop={handleImageCrop}
            />
          )}

          {/* Filters */}
          {!editingImage && (
            <ImageFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortChange={setSortBy}
              filterBy={filterBy}
              onFilterChange={setFilterBy}
              onClearFilters={handleClearFilters}
            />
          )}

          {/* Images Grid */}
          {!editingImage && (
            <ImageGrid
              images={filteredImages}
              selectedImages={selectedImages}
              onImageSelect={setSelectedImages}
              onImageEdit={handleImageEdit}
              onImageCrop={handleImageCrop}
              onImageDelete={handleImageDelete}
              onBatchDelete={handleBatchDelete}
            />
          )}

          {/* Stats */}
          {!editingImage && images?.length > 0 && (
            <div className="bg-card p-4 rounded-lg border border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{images?.length}</div>
                  <div className="text-sm text-muted-foreground">Images totales</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">
                    {images?.filter(img => img?.optimizationStatus === 'optimized')?.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Optimisées</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">
                    {images?.filter(img => img?.optimizationStatus === 'processing')?.length}
                  </div>
                  <div className="text-sm text-muted-foreground">En cours</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {(images?.reduce((sum, img) => sum + img?.size, 0) / 1024 / 1024)?.toFixed(1)} MB
                  </div>
                  <div className="text-sm text-muted-foreground">Taille totale</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImageManager;