import React from 'react';
import Button from '../../../components/ui/Button';


const ProjectFilters = ({ activeFilter, onFilterChange, projectCounts }) => {
  const filters = [
    {
      id: 'all',
      label: 'Tous les projets',
      icon: 'FolderOpen',
      count: projectCounts?.all
    },
    {
      id: 'en_cours',
      label: 'En cours',
      icon: 'Clock',
      count: projectCounts?.en_cours
    },
    {
      id: 'en_revision',
      label: 'En révision',
      icon: 'Eye',
      count: projectCounts?.en_revision
    },
    {
      id: 'termine',
      label: 'Terminés',
      icon: 'CheckCircle',
      count: projectCounts?.termine
    },
    {
      id: 'urgent',
      label: 'Urgents',
      icon: 'AlertTriangle',
      count: projectCounts?.urgent
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-wrap gap-2">
        {filters?.map((filter) => (
          <Button
            key={filter?.id}
            variant={activeFilter === filter?.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange(filter?.id)}
            iconName={filter?.icon}
            iconPosition="left"
            iconSize={16}
            className="transition-all duration-150"
          >
            {filter?.label}
            {filter?.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                activeFilter === filter?.id 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {filter?.count}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ProjectFilters;