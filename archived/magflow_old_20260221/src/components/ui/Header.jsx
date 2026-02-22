import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, message: 'Traitement du modèle terminé', type: 'success', time: '2 min' },
    { id: 2, message: 'Nouveau commentaire sur l\'article', type: 'info', time: '5 min' },
    { id: 3, message: 'Erreur de synchronisation', type: 'error', time: '10 min' }
  ]);
  
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { 
      name: 'Créateur de Magazine Intelligent', 
      path: '/smart-content-creator', 
      icon: 'Sparkles',
      tooltip: 'Créateur intelligent de magazines avec IA'
    },
    { 
      name: 'Modèles', 
      path: '/admin/templates', 
      icon: 'Layout',
      tooltip: 'Gestion et configuration des templates'
    },
  ];

  const currentUser = {
    name: 'Marie Dubois',
    role: 'Éditrice en chef',
    avatar: '/assets/images/no_image.png'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef?.current && !userMenuRef?.current?.contains(event?.target)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef?.current && !mobileMenuRef?.current?.contains(event?.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    navigate('/login');
    setIsUserMenuOpen(false);
  };

  const isActivePath = (path) => {
    if (path === '/smart-content-creator') {
      return location?.pathname === '/smart-content-creator' || location?.pathname === '/';
    }
    if (path === '/dashboard') {
      return location?.pathname === '/dashboard';
    }
    if (path === '/template-gallery') {
      return location?.pathname?.includes('/template-gallery') || location?.pathname?.includes('/template-preview');
    }
    return location?.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-card">
      <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
        {/* Logo - Amélioré pour éviter la troncature */}
        <div className="flex items-center flex-shrink-0 min-w-0">
          <div 
            className="flex items-center cursor-pointer transition-opacity duration-150 hover:opacity-80"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <Icon name="Zap" size={20} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-heading font-semibold text-foreground whitespace-nowrap">
              MagFlow
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 flex-1 justify-center max-w-4xl">
          {navigationItems?.map((item) => (
            <div key={item?.path} className="relative group">
              <Button
                variant={isActivePath(item?.path) ? "default" : "ghost"}
                size="sm"
                onClick={() => handleNavigation(item?.path)}
                iconName={item?.icon}
                iconPosition="left"
                iconSize={16}
                className="transition-all duration-150 ease-out whitespace-nowrap"
              >
                {item?.name}
              </Button>
              
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-modal opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-800 pointer-events-none whitespace-nowrap z-10">
                {item?.tooltip}
              </div>
            </div>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              iconName="Bell"
              iconSize={18}
              className="relative"
            >
              {notifications?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium">
                  {notifications?.length}
                </span>
              )}
            </Button>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 transition-all duration-150 ease-out"
            >
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Icon name="User" size={16} color="var(--color-muted-foreground)" />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-foreground">{currentUser?.name}</div>
                <div className="text-xs text-muted-foreground">{currentUser?.role}</div>
              </div>
              <Icon 
                name="ChevronDown" 
                size={16} 
                className={`transition-transform duration-150 ${isUserMenuOpen ? 'rotate-180' : ''}`}
              />
            </Button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-modal animate-fade-in">
                <div className="p-3 border-b border-border">
                  <div className="font-medium text-popover-foreground">{currentUser?.name}</div>
                  <div className="text-sm text-muted-foreground">{currentUser?.role}</div>
                </div>
                <div className="py-1">
                  <button className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-colors duration-150 flex items-center">
                    <Icon name="User" size={16} className="mr-2" />
                    Profil
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-colors duration-150 flex items-center">
                    <Icon name="Settings" size={16} className="mr-2" />
                    Paramètres
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-colors duration-150 flex items-center">
                    <Icon name="HelpCircle" size={16} className="mr-2" />
                    Aide
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-left text-sm text-error hover:bg-muted transition-colors duration-150 flex items-center"
                  >
                    <Icon name="LogOut" size={16} className="mr-2" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden" ref={mobileMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              iconName="Menu"
              iconSize={20}
            />

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-modal animate-slide-in">
                <div className="py-2">
                  {navigationItems?.map((item) => (
                    <button
                      key={item?.path}
                      onClick={() => handleNavigation(item?.path)}
                      className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-150 ${
                        isActivePath(item?.path) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-popover-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon name={item?.icon} size={18} />
                      <span className="font-medium">{item?.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
