import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import WorkflowProgress from '../../components/ui/WorkflowProgress';
import ProjectCard from './components/ProjectCard';
import MetricsCard from './components/MetricsCard';
import ActivityFeed from './components/ActivityFeed';
import QuickActions from './components/QuickActions';
import ProjectFilters from './components/ProjectFilters';
import ApiStatusIndicator from './components/ApiStatusIndicator';
import Icon from '../../components/AppIcon';


const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredProjects, setFilteredProjects] = useState([]);

  // Mock data for projects
  const projects = [
    {
      id: 1,
      name: "Magazine Lifestyle Automne 2024",
      description: "Édition spéciale mode et tendances automne",
      status: "en_cours",
      progress: 75,
      deadline: "2024-12-20",
      teamSize: 4,
      indesignStatus: "connected",
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 2,
      name: "Guide Gastronomique Paris",
      description: "Sélection des meilleurs restaurants parisiens",
      status: "en_revision",
      progress: 90,
      deadline: "2024-12-15",
      teamSize: 3,
      indesignStatus: "processing",
      lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: 3,
      name: "Tech Innovations 2025",
      description: "Aperçu des technologies émergentes",
      status: "termine",
      progress: 100,
      deadline: "2024-12-10",
      teamSize: 5,
      indesignStatus: "connected",
      lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 4,
      name: "Culture & Arts Contemporains",
      description: "Exploration de l\'art moderne français",
      status: "en_cours",
      progress: 45,
      deadline: "2024-12-25",
      teamSize: 2,
      indesignStatus: "error",
      lastActivity: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 5,
      name: "Voyage & Découvertes",
      description: "Destinations incontournables 2025",
      status: "en_cours",
      progress: 30,
      deadline: "2024-12-13",
      teamSize: 6,
      indesignStatus: "connected",
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ];

  // Mock data for metrics
  const metrics = [
    {
      id: 'templates_used',
      label: 'Modèles utilisés ce mois',
      value: '47',
      icon: 'Layout',
      trend: 'up',
      change: '+12%',
      subtitle: 'Par rapport au mois dernier'
    },
    {
      id: 'avg_processing_time',
      label: 'Temps de traitement moyen',
      value: '3.2 min',
      icon: 'Clock',
      trend: 'down',
      change: '-8%',
      subtitle: 'Amélioration des performances'
    },
    {
      id: 'team_productivity',
      label: 'Productivité équipe',
      value: '94%',
      icon: 'TrendingUp',
      trend: 'up',
      change: '+5%',
      subtitle: 'Objectif mensuel atteint'
    },
    {
      id: 'active_projects',
      label: 'Projets actifs',
      value: '12',
      icon: 'FolderOpen',
      trend: 'stable',
      change: '0%',
      subtitle: 'Charge de travail stable'
    }
  ];

  // Mock data for activities
  const activities = [
    {
      id: 1,
      type: 'template_generated',
      user: 'Marie Dubois',
      action: 'a généré le modèle pour',
      target: 'Magazine Lifestyle Automne 2024',
      details: 'Modèle "Modern Magazine" appliqué avec succès',
      timestamp: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: 2,
      type: 'collaboration',
      user: 'Jean Martin',
      action: 'a ajouté un commentaire sur',
      target: 'Guide Gastronomique Paris',
      details: 'Suggestion d\'amélioration pour la section photos',
      timestamp: new Date(Date.now() - 45 * 60 * 1000)
    },
    {
      id: 3,
      type: 'content_updated',
      user: 'Sophie Laurent',
      action: 'a mis à jour le contenu de',
      target: 'Tech Innovations 2025',
      details: 'Ajout de 3 nouveaux articles sur l\'IA',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 4,
      type: 'upload',
      user: 'Pierre Durand',
      action: 'a téléchargé 12 images pour',
      target: 'Culture & Arts Contemporains',
      details: 'Images haute résolution des œuvres du Louvre',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: 5,
      type: 'error',
      user: 'Système',
      action: 'erreur de synchronisation avec InDesign pour',
      target: 'Voyage & Découvertes',
      details: 'Tentative de reconnexion automatique en cours',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ];

  // Calculate project counts for filters
  const getProjectCounts = () => {
    const now = new Date();
    return {
      all: projects?.length,
      en_cours: projects?.filter(p => p?.status === 'en_cours')?.length,
      en_revision: projects?.filter(p => p?.status === 'en_revision')?.length,
      termine: projects?.filter(p => p?.status === 'termine')?.length,
      urgent: projects?.filter(p => {
        const deadline = new Date(p.deadline);
        const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && p?.status !== 'termine';
      })?.length
    };
  };

  // Filter projects based on active filter
  useEffect(() => {
    let filtered = [...projects];
    const now = new Date();

    switch (activeFilter) {
      case 'en_cours':
        filtered = projects?.filter(p => p?.status === 'en_cours');
        break;
      case 'en_revision':
        filtered = projects?.filter(p => p?.status === 'en_revision');
        break;
      case 'termine':
        filtered = projects?.filter(p => p?.status === 'termine');
        break;
      case 'urgent':
        filtered = projects?.filter(p => {
          const deadline = new Date(p.deadline);
          const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          return diffDays <= 3 && p?.status !== 'termine';
        });
        break;
      default:
        filtered = projects;
    }

    // Sort by last activity (most recent first)
    filtered?.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    setFilteredProjects(filtered);
  }, [activeFilter]);

  const projectCounts = getProjectCounts();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tableau de Bord - MagFlow</title>
        <meta name="description" content="Tableau de bord pour la gestion des projets de magazines et l'automatisation des workflows éditoriaux" />
      </Helmet>
      <Header />
      <WorkflowProgress />
      <main className="pt-4 pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Tableau de Bord
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos projets de magazines et suivez les workflows d'automatisation
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Dernière mise à jour
              </p>
              <p className="text-sm font-medium text-foreground">
                {new Date()?.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics?.map((metric) => (
              <MetricsCard key={metric?.id} metric={metric} />
            ))}
          </div>

          {/* API Status */}
          <ApiStatusIndicator 
            status="connected" 
            lastSync={new Date(Date.now() - 5 * 60 * 1000)} 
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projects Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Filters */}
              <ProjectFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                projectCounts={projectCounts}
              />

              {/* Projects Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">
                    Projets
                    {activeFilter !== 'all' && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({filteredProjects?.length} résultat{filteredProjects?.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </h2>
                </div>

                {filteredProjects?.length === 0 ? (
                  <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="FolderOpen" size={24} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Aucun projet trouvé
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {activeFilter === 'all' ? "Vous n'avez pas encore de projets. Créez votre premier projet pour commencer." : `Aucun projet ne correspond au filtre"${activeFilter}".`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredProjects?.map((project) => (
                      <ProjectCard key={project?.id} project={project} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;