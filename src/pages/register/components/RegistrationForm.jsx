import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmationMotDePasse: '',
    organisation: '',
    role: '',
    telephone: '',
    accepteConditions: false,
    accepteNewsletter: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const roleOptions = [
    { value: 'editeur', label: 'Éditeur' },
    { value: 'directeur-artistique', label: 'Directeur Artistique' },
    { value: 'gestionnaire-publication', label: 'Gestionnaire de Publication' },
    { value: 'designer-freelance', label: 'Designer Freelance' },
    { value: 'redacteur-chef', label: 'Rédacteur en Chef' },
    { value: 'assistant-editorial', label: 'Assistant Éditorial' }
  ];

  const validatePassword = (password) => {
    const minLength = password?.length >= 8;
    const hasUpperCase = /[A-Z]/?.test(password);
    const hasLowerCase = /[a-z]/?.test(password);
    const hasNumbers = /\d/?.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/?.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      criteria: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex?.test(email);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.nom?.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData?.prenom?.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData?.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData?.motDePasse) {
      newErrors.motDePasse = 'Le mot de passe est requis';
    } else {
      const passwordValidation = validatePassword(formData?.motDePasse);
      if (!passwordValidation?.isValid) {
        newErrors.motDePasse = 'Le mot de passe ne respecte pas les critères de sécurité';
      }
    }

    if (!formData?.confirmationMotDePasse) {
      newErrors.confirmationMotDePasse = 'La confirmation du mot de passe est requise';
    } else if (formData?.motDePasse !== formData?.confirmationMotDePasse) {
      newErrors.confirmationMotDePasse = 'Les mots de passe ne correspondent pas';
    }

    if (!formData?.organisation?.trim()) {
      newErrors.organisation = 'L\'organisation est requise';
    }

    if (!formData?.role) {
      newErrors.role = 'Le rôle est requis';
    }

    if (!formData?.accepteConditions) {
      newErrors.accepteConditions = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful registration
      console.log('Registration successful:', formData);
      navigate('/login', { 
        state: { 
          message: 'Inscription réussie ! Vérifiez votre email pour activer votre compte.',
          type: 'success'
        }
      });
    } catch (error) {
      setErrors({ submit: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.' });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData?.motDePasse);

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Informations personnelles
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom"
              type="text"
              placeholder="Votre nom"
              value={formData?.nom}
              onChange={(e) => handleInputChange('nom', e?.target?.value)}
              error={errors?.nom}
              required
            />
            
            <Input
              label="Prénom"
              type="text"
              placeholder="Votre prénom"
              value={formData?.prenom}
              onChange={(e) => handleInputChange('prenom', e?.target?.value)}
              error={errors?.prenom}
              required
            />
          </div>

          <Input
            label="Adresse email"
            type="email"
            placeholder="votre.email@exemple.com"
            value={formData?.email}
            onChange={(e) => handleInputChange('email', e?.target?.value)}
            error={errors?.email}
            required
          />

          <Input
            label="Téléphone (optionnel)"
            type="tel"
            placeholder="+33 1 23 45 67 89"
            value={formData?.telephone}
            onChange={(e) => handleInputChange('telephone', e?.target?.value)}
          />
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Informations professionnelles
          </h3>
          
          <Input
            label="Organisation"
            type="text"
            placeholder="Nom de votre entreprise ou publication"
            value={formData?.organisation}
            onChange={(e) => handleInputChange('organisation', e?.target?.value)}
            error={errors?.organisation}
            required
          />

          <Select
            label="Rôle"
            placeholder="Sélectionnez votre rôle"
            options={roleOptions}
            value={formData?.role}
            onChange={(value) => handleInputChange('role', value)}
            error={errors?.role}
            required
          />
        </div>

        {/* Password Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Sécurité
          </h3>
          
          <div className="relative">
            <Input
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="Créez un mot de passe sécurisé"
              value={formData?.motDePasse}
              onChange={(e) => handleInputChange('motDePasse', e?.target?.value)}
              error={errors?.motDePasse}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
            </button>
          </div>

          {formData?.motDePasse && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">Critères de sécurité :</p>
              <div className="space-y-1">
                {[
                  { key: 'minLength', label: 'Au moins 8 caractères' },
                  { key: 'hasUpperCase', label: 'Une majuscule' },
                  { key: 'hasLowerCase', label: 'Une minuscule' },
                  { key: 'hasNumbers', label: 'Un chiffre' },
                  { key: 'hasSpecialChar', label: 'Un caractère spécial' }
                ]?.map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Icon 
                      name={passwordValidation?.criteria?.[key] ? "Check" : "X"} 
                      size={12} 
                      color={passwordValidation?.criteria?.[key] ? "var(--color-success)" : "var(--color-error)"}
                    />
                    <span className={`text-xs ${
                      passwordValidation?.criteria?.[key] ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <Input
              label="Confirmation du mot de passe"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmez votre mot de passe"
              value={formData?.confirmationMotDePasse}
              onChange={(e) => handleInputChange('confirmationMotDePasse', e?.target?.value)}
              error={errors?.confirmationMotDePasse}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name={showConfirmPassword ? "EyeOff" : "Eye"} size={16} />
            </button>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-4">
          <Checkbox
            label="J'accepte les conditions d'utilisation et la politique de confidentialité"
            checked={formData?.accepteConditions}
            onChange={(e) => handleInputChange('accepteConditions', e?.target?.checked)}
            error={errors?.accepteConditions}
            required
          />

          <Checkbox
            label="Je souhaite recevoir des informations sur les nouvelles fonctionnalités (optionnel)"
            checked={formData?.accepteNewsletter}
            onChange={(e) => handleInputChange('accepteNewsletter', e?.target?.checked)}
          />
        </div>

        {/* Submit Error */}
        {errors?.submit && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} color="var(--color-error)" />
              <span className="text-sm text-error">{errors?.submit}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          iconName="UserPlus"
          iconPosition="left"
        >
          {isLoading ? 'Création du compte...' : 'Créer mon compte'}
        </Button>
      </form>
    </div>
  );
};

export default RegistrationForm;