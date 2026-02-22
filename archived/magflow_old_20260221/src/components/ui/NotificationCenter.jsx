import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Traitement terminé',
      message: 'Le modèle "Magazine Lifestyle" a été généré avec succès.',
      time: '2 minutes',
      read: false,
      timestamp: new Date(Date.now() - 2 * 60 * 1000)
    },
    {
      id: 2,
      type: 'info',
      title: 'Nouveau commentaire',
      message: 'Jean Martin a ajouté un commentaire sur l\'article "Tendances 2025".',
      time: '5 minutes',
      read: false,
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: 3,
      type: 'warning',
      title: 'Attention requise',
      message: 'La qualité de l\'image "hero-banner.jpg" est insuffisante pour l\'impression.',
      time: '8 minutes',
      read: true,
      timestamp: new Date(Date.now() - 8 * 60 * 1000)
    },
    {
      id: 4,
      type: 'error',
      title: 'Erreur de synchronisation',
      message: 'Impossible de synchroniser avec InDesign. Vérifiez votre connexion.',
      time: '10 minutes',
      read: false,
      timestamp: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
      id: 5,
      type: 'info',
      title: 'Sauvegarde automatique',
      message: 'Votre travail a été sauvegardé automatiquement.',
      time: '15 minutes',
      read: true,
      timestamp: new Date(Date.now() - 15 * 60 * 1000)
    }
  ]);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications?.filter(n => !n?.read)?.length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return { name: 'CheckCircle', color: 'var(--color-success)' };
      case 'error':
        return { name: 'XCircle', color: 'var(--color-error)' };
      case 'warning':
        return { name: 'AlertTriangle', color: 'var(--color-warning)' };
      default:
        return { name: 'Info', color: 'var(--color-primary)' };
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev?.map(notification => 
        notification?.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev?.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev?.filter(notification => notification?.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative transition-all duration-150 ease-out hover:bg-muted"
      >
        <Icon name="Bell" size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-modal animate-fade-in z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-heading font-semibold text-popover-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications?.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="Bell" size={32} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications?.map((notification) => {
                  const iconConfig = getNotificationIcon(notification?.type);
                  
                  return (
                    <div
                      key={notification?.id}
                      className={`px-4 py-3 border-b border-border last:border-b-0 transition-colors duration-150 hover:bg-muted/50 ${
                        !notification?.read ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon 
                            name={iconConfig?.name} 
                            size={16} 
                            color={iconConfig?.color}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification?.read ? 'text-popover-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification?.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification?.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Il y a {notification?.time}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification?.read && (
                                <button
                                  onClick={() => markAsRead(notification?.id)}
                                  className="p-1 hover:bg-muted rounded transition-colors duration-150"
                                  title="Marquer comme lu"
                                >
                                  <Icon name="Check" size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification?.id)}
                                className="p-1 hover:bg-muted rounded transition-colors duration-150 text-muted-foreground hover:text-error"
                                title="Supprimer"
                              >
                                <Icon name="X" size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications?.length > 0 && (
            <div className="p-3 border-t border-border">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-error"
                >
                  Tout effacer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Voir tout
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;