import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { magazineAPI } from '../../services/api';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

/**
 * Page de résultat de génération de magazine
 * Affiche le statut et permet le téléchargement
 */
const GenerationResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { generationId, projectId, initialStatus } = location.state || {};
  
  const [status, setStatus] = useState(initialStatus || 'processing');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Polling du statut
  useEffect(() => {
    if (!generationId) {
      navigate('/smart-content-creator');
      return;
    }

    let pollInterval;
    let progressInterval;

    const checkStatus = async () => {
      try {
        const result = await magazineAPI.getStatus(generationId);
        
        setStatus(result.status);
        
        if (result.status === 'completed') {
          setDownloadUrl(result.downloadUrl);
          setProgress(100);
          clearInterval(pollInterval);
          clearInterval(progressInterval);
        } else if (result.status === 'error') {
          setError(result.error || 'Une erreur est survenue lors de la génération');
          clearInterval(pollInterval);
          clearInterval(progressInterval);
        }
      } catch (err) {
        console.error('Error checking status:', err);
        setError(err.message);
        clearInterval(pollInterval);
        clearInterval(progressInterval);
      }
    };

    // Animation de la progress bar
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 1000);

    // Poll toutes les 3 secondes
    pollInterval = setInterval(checkStatus, 3000);
    
    // Check immédiat
    checkStatus();

    return () => {
      clearInterval(pollInterval);
      clearInterval(progressInterval);
    };
  }, [generationId, navigate]);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleNewGeneration = () => {
    navigate('/smart-content-creator');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          
          {/* Processing State */}
          {status === 'processing' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
                  <Icon 
                    name="loader" 
                    className="w-10 h-10 text-blue-600 animate-spin"
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Génération en cours...
                </h1>
                <p className="text-lg text-gray-600">
                  Votre magazine est en cours de création. Cela peut prendre jusqu'à 2 minutes.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {Math.round(progress)}% complété
                </p>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <Icon name="check-circle" className="w-6 h-6 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Analyse terminée</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Icon name="loader" className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-gray-700">Génération InDesign</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Icon name="clock" className="w-6 h-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">En attente</span>
                </div>
              </div>
            </>
          )}

          {/* Success State */}
          {status === 'completed' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                  <Icon 
                    name="check-circle" 
                    className="w-12 h-12 text-green-600"
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  🎉 Magazine généré avec succès !
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Votre magazine est prêt. Vous pouvez maintenant le télécharger et l'ouvrir dans Adobe InDesign.
                </p>

                {/* Download Button */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleDownload}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Icon name="download" className="w-6 h-6" />
                    <span>Télécharger le fichier .indd</span>
                  </Button>
                  
                  <Button
                    onClick={handleNewGeneration}
                    variant="outline"
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Créer un nouveau magazine
                  </Button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
                <div className="flex items-start space-x-3">
                  <Icon name="info" className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Prochaines étapes
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Ouvrir le fichier dans Adobe InDesign</li>
                      <li>• Ajuster les images si nécessaire</li>
                      <li>• Personnaliser les couleurs et la typographie</li>
                      <li>• Exporter en PDF pour impression</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
                  <Icon 
                    name="alert-circle" 
                    className="w-12 h-12 text-red-600"
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Erreur de génération
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Une erreur est survenue lors de la génération du magazine.
                </p>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-red-800 font-mono">
                      {error}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleNewGeneration}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Réessayer
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Retour à l'accueil
                  </Button>
                </div>
              </div>

              {/* Support Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
                <div className="flex items-start space-x-3">
                  <Icon name="help-circle" className="w-6 h-6 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Besoin d'aide ?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Si le problème persiste, vérifiez que :
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 mt-2">
                      <li>• Le serveur Flask est bien démarré (port 5003)</li>
                      <li>• Adobe InDesign est installé sur votre machine</li>
                      <li>• Les templates InDesign sont accessibles</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ID de génération : <code className="bg-gray-100 px-2 py-1 rounded text-xs">{generationId}</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenerationResult;
