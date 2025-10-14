import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Mock credentials for authentication
  const mockCredentials = {
    editor: { email: 'marie.dubois@magflow.fr', password: 'Editor2024!' },
    admin: { email: 'admin@magflow.fr', password: 'Admin2024!' },
    designer: { email: 'jean.martin@magflow.fr', password: 'Designer2024!' }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email) {
      newErrors.email = 'L\'adresse e-mail est requise';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Format d\'e-mail invalide';
    }

    if (!formData?.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData?.password?.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check mock credentials
      const isValidCredential = Object.values(mockCredentials)?.some(
        cred => cred?.email === formData?.email && cred?.password === formData?.password
      );

      if (isValidCredential) {
        // Store authentication state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', formData?.email);
        if (formData?.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setErrors({
          general: 'Identifiants invalides. Veuillez vérifier votre e-mail et mot de passe.\n\nComptes de test disponibles:\n• marie.dubois@magflow.fr / Editor2024!\n• admin@magflow.fr / Admin2024!\n• jean.martin@magflow.fr / Designer2024!'
        });
      }
    } catch (error) {
      setErrors({
        general: 'Une erreur est survenue lors de la connexion. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error Message */}
        {errors?.general && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <Icon name="AlertCircle" size={16} color="var(--color-error)" className="mt-0.5 flex-shrink-0" />
              <div className="text-sm text-error whitespace-pre-line">
                {errors?.general}
              </div>
            </div>
          </div>
        )}

        {/* Email Field */}
        <Input
          label="Adresse e-mail"
          type="email"
          name="email"
          placeholder="votre.email@exemple.fr"
          value={formData?.email}
          onChange={handleInputChange}
          error={errors?.email}
          required
          disabled={isLoading}
          className="w-full"
        />

        {/* Password Field */}
        <Input
          label="Mot de passe"
          type="password"
          name="password"
          placeholder="Entrez votre mot de passe"
          value={formData?.password}
          onChange={handleInputChange}
          error={errors?.password}
          required
          disabled={isLoading}
          className="w-full"
        />

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <Checkbox
            label="Se souvenir de moi"
            name="rememberMe"
            checked={formData?.rememberMe}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-primary hover:text-primary/80 transition-colors duration-150"
            disabled={isLoading}
          >
            Mot de passe oublié ?
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          iconName="LogIn"
          iconPosition="left"
          iconSize={18}
        >
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </Button>

        {/* Register Link */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas de compte ?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-150"
              disabled={isLoading}
            >
              Créer un compte
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;