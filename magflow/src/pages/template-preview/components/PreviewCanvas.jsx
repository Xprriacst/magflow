import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const PreviewCanvas = ({ template, content, onZoomChange, zoom, currentPage, onPageChange }) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (zoom > 100) {
      setIsDragging(true);
      setDragStart({
        x: e?.clientX - canvasPosition?.x,
        y: e?.clientY - canvasPosition?.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 100) {
      setCanvasPosition({
        x: e?.clientX - dragStart?.x,
        y: e?.clientY - dragStart?.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const zoomLevels = [25, 50, 75, 100, 125, 150, 200];

  const handleZoomIn = () => {
    const currentIndex = zoomLevels?.indexOf(zoom);
    if (currentIndex < zoomLevels?.length - 1) {
      onZoomChange(zoomLevels?.[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels?.indexOf(zoom);
    if (currentIndex > 0) {
      onZoomChange(zoomLevels?.[currentIndex - 1]);
    }
  };

  const handleFitToWidth = () => {
    onZoomChange(100);
    setCanvasPosition({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 bg-muted/30 relative overflow-hidden">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-card border border-border rounded-lg shadow-sm p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={zoom <= 25}
          className="w-8 h-8"
        >
          <Icon name="ZoomOut" size={16} />
        </Button>
        
        <span className="text-sm font-medium text-foreground min-w-[3rem] text-center">
          {zoom}%
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          className="w-8 h-8"
        >
          <Icon name="ZoomIn" size={16} />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFitToWidth}
          className="text-xs"
        >
          Ajuster
        </Button>
      </div>
      {/* Page Navigation */}
      {template?.pages > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2 bg-card border border-border rounded-lg shadow-sm p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-8 h-8"
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>
          
          <span className="text-sm font-medium text-foreground px-2">
            Page {currentPage} sur {template?.pages}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= template?.pages}
            className="w-8 h-8"
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      )}
      {/* Canvas Container */}
      <div 
        className="w-full h-full flex items-center justify-center p-8 overflow-hidden"
        style={{ cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <div
          ref={canvasRef}
          className="bg-white shadow-2xl transition-transform duration-200 ease-out"
          style={{
            width: `${(template?.width * zoom) / 100}px`,
            height: `${(template?.height * zoom) / 100}px`,
            transform: zoom > 100 ? `translate(${canvasPosition?.x}px, ${canvasPosition?.y}px)` : 'none'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Template Preview Content */}
          <div className="w-full h-full relative overflow-hidden">
            {/* Background */}
            <div 
              className="absolute inset-0"
              style={{ backgroundColor: template?.backgroundColor || '#ffffff' }}
            />
            
            {/* Header Section */}
            {template?.layout?.header && (
              <div 
                className="absolute"
                style={{
                  top: `${template?.layout?.header?.y}%`,
                  left: `${template?.layout?.header?.x}%`,
                  width: `${template?.layout?.header?.width}%`,
                  height: `${template?.layout?.header?.height}%`
                }}
              >
                <div className="w-full h-full flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary/30">
                  <h1 className="text-2xl font-bold text-primary text-center px-4">
                    {content?.title || "Titre de l'article"}
                  </h1>
                </div>
              </div>
            )}

            {/* Main Image */}
            {template?.layout?.mainImage && (
              <div 
                className="absolute overflow-hidden"
                style={{
                  top: `${template?.layout?.mainImage?.y}%`,
                  left: `${template?.layout?.mainImage?.x}%`,
                  width: `${template?.layout?.mainImage?.width}%`,
                  height: `${template?.layout?.mainImage?.height}%`
                }}
              >
                {content?.images && content?.images?.length > 0 ? (
                  <Image
                    src={content?.images?.[0]?.url}
                    alt={content?.images?.[0]?.alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="Image" size={32} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Image principale</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text Content */}
            {template?.layout?.textAreas && template?.layout?.textAreas?.map((area, index) => (
              <div 
                key={index}
                className="absolute overflow-hidden"
                style={{
                  top: `${area?.y}%`,
                  left: `${area?.x}%`,
                  width: `${area?.width}%`,
                  height: `${area?.height}%`
                }}
              >
                <div className="w-full h-full p-4 bg-white/80">
                  <div 
                    className="text-sm leading-relaxed text-foreground"
                    style={{ 
                      fontSize: `${area?.fontSize || 14}px`,
                      fontFamily: area?.fontFamily || 'Inter, sans-serif',
                      textAlign: area?.textAlign || 'left'
                    }}
                  >
                    {content?.content ? (
                      <div dangerouslySetInnerHTML={{ 
                        __html: content?.content?.substring(0, area?.maxLength || 500) + 
                               (content?.content?.length > (area?.maxLength || 500) ? '...' : '')
                      }} />
                    ) : (
                      <p className="text-muted-foreground italic">
                        Contenu de l'article sera affiché ici...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Secondary Images */}
            {template?.layout?.secondaryImages && template?.layout?.secondaryImages?.map((imageArea, index) => (
              <div 
                key={index}
                className="absolute overflow-hidden"
                style={{
                  top: `${imageArea?.y}%`,
                  left: `${imageArea?.x}%`,
                  width: `${imageArea?.width}%`,
                  height: `${imageArea?.height}%`
                }}
              >
                {content?.images && content?.images?.[index + 1] ? (
                  <Image
                    src={content?.images?.[index + 1]?.url}
                    alt={content?.images?.[index + 1]?.alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="Image" size={24} className="mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Image {index + 2}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Footer */}
            {template?.layout?.footer && (
              <div 
                className="absolute"
                style={{
                  top: `${template?.layout?.footer?.y}%`,
                  left: `${template?.layout?.footer?.x}%`,
                  width: `${template?.layout?.footer?.width}%`,
                  height: `${template?.layout?.footer?.height}%`
                }}
              >
                <div className="w-full h-full flex items-center justify-between px-4 bg-muted/50 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {content?.author || "Auteur"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Page {currentPage}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCanvas;