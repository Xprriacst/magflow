import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ metric }) => {
  const getIconColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'var(--color-success)';
      case 'down':
        return 'var(--color-error)';
      default:
        return 'var(--color-muted-foreground)';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return 'TrendingUp';
      case 'down':
        return 'TrendingDown';
      default:
        return 'Minus';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon 
              name={metric?.icon} 
              size={24} 
              color="var(--color-primary)"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {metric?.label}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {metric?.value}
            </p>
          </div>
        </div>
        
        {metric?.trend && (
          <div className="flex items-center space-x-1">
            <Icon 
              name={getTrendIcon(metric?.trend)} 
              size={16} 
              color={getIconColor(metric?.trend)}
            />
            <span className={`text-sm font-medium ${
              metric?.trend === 'up' ? 'text-success' : 
              metric?.trend === 'down'? 'text-error' : 'text-muted-foreground'
            }`}>
              {metric?.change}
            </span>
          </div>
        )}
      </div>
      {metric?.subtitle && (
        <p className="text-xs text-muted-foreground mt-2">
          {metric?.subtitle}
        </p>
      )}
    </div>
  );
};

export default MetricsCard;