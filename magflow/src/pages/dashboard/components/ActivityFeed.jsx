import React from 'react';
import Icon from '../../../components/AppIcon';

const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'template_generated':
        return { name: 'CheckCircle', color: 'var(--color-success)' };
      case 'content_updated':
        return { name: 'Edit3', color: 'var(--color-primary)' };
      case 'collaboration':
        return { name: 'MessageCircle', color: 'var(--color-accent)' };
      case 'error':
        return { name: 'AlertTriangle', color: 'var(--color-error)' };
      case 'upload':
        return { name: 'Upload', color: 'var(--color-warning)' };
      default:
        return { name: 'Info', color: 'var(--color-muted-foreground)' };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour(s)`;
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <Icon name="Activity" size={20} className="mr-2" />
          Activité récente
        </h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {activities?.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="Clock" size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Aucune activité récente</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {activities?.map((activity) => {
              const iconConfig = getActivityIcon(activity?.type);
              
              return (
                <div key={activity?.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Icon 
                      name={iconConfig?.name} 
                      size={16} 
                      color={iconConfig?.color}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity?.user}</span>
                      {' '}
                      <span>{activity?.action}</span>
                      {activity?.target && (
                        <span className="font-medium"> "{activity?.target}"</span>
                      )}
                    </p>
                    
                    {activity?.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity?.details}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(activity?.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;