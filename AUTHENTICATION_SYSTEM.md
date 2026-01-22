# 🔐 Système d'Authentification MagFlow

**Status:** ✅ **100% FONCTIONNEL** (Janvier 2026)

## 📋 Vue d'ensemble

Le système d'authentification de MagFlow est entièrement opérationnel et intégré avec Supabase Auth. Il gère l'inscription, la connexion, les sessions persistantes, et les rôles utilisateurs (user/admin).

## ✅ Fonctionnalités Implémentées

### Backend API (`/api/auth/*`)

| Endpoint | Méthode | Description | Status |
|----------|---------|-------------|--------|
| `/api/auth/register` | POST | Inscription nouvel utilisateur | ✅ |
| `/api/auth/login` | POST | Connexion avec email/password | ✅ |
| `/api/auth/logout` | POST | Déconnexion et invalidation token | ✅ |
| `/api/auth/me` | GET | Récupération profil utilisateur | ✅ |
| `/api/auth/verify` | POST | Vérification validité token | ✅ |
| `/api/auth/password-reset` | POST | Demande réinitialisation mot de passe | ✅ |
| `/api/auth/password-update` | POST | Mise à jour mot de passe | ✅ |
| `/api/auth/resend-confirmation` | POST | Renvoyer email de confirmation | ✅ |

### Frontend

- ✅ **Pages d'authentification**
  - Page de connexion (`/login`)
  - Page d'inscription (`/register`)
  - Validation des formulaires
  - Messages d'erreur clairs

- ✅ **Gestion de session**
  - Stockage token dans `localStorage` (`magflow_token`)
  - Stockage user dans `localStorage` (`magflow_user`)
  - Persistance après refresh de page
  - Auto-reconnexion si token valide

- ✅ **Protection des routes**
  - Routes protégées nécessitent authentification
  - Redirection automatique vers `/login` si non connecté
  - Middleware de vérification de token

- ✅ **Interface utilisateur**
  - Badge **ADMIN** visible dans le header pour les administrateurs
  - Affichage du nom d'utilisateur
  - Menu déroulant avec options profil/paramètres/déconnexion
  - Badge avec dégradé violet/indigo pour les admins

### Base de Données (Supabase)

- ✅ **Table `profiles`**
  - `id` (UUID, FK vers auth.users)
  - `email` (text)
  - `company_name` (text)
  - `role` (text: 'user' ou 'admin')
  - `subscription_tier` (text: 'free', 'pro', 'enterprise')
  - `subscription_status` (text)
  - `monthly_generations_used` (integer)
  - `monthly_limit` (integer, -1 = illimité)
  - `usage_reset_date` (date)

- ✅ **Supabase Auth**
  - Gestion des utilisateurs
  - Confirmation par email
  - JWT tokens
  - Service role pour opérations admin

## 🧪 Tests Validés

### Tests API (curl)
```bash
# ✅ Inscription
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@magflow.com","password":"testpass123","fullName":"Test User","companyName":"Test Co"}'

# ✅ Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@magflow.com","password":"testpass123"}'

# ✅ Vérification profil
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"

# ✅ Déconnexion
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer <TOKEN>"
```

### Tests Fonctionnels
- ✅ Inscription avec validation email
- ✅ Connexion avec JWT
- ✅ Persistance de session après refresh
- ✅ Déconnexion et invalidation token
- ✅ Rôles admin/user fonctionnels
- ✅ Badge admin visible dans l'interface
- ✅ Protection des routes admin

## 👥 Comptes de Test

### Utilisateur Standard
```
Email: testuser1769111433@magflow.com
Mot de passe: testpass123
Rôle: user
Limite: 5 générations/mois
```

### Administrateur
```
Email: admin@magflow.com
Mot de passe: AdminPass123!
Rôle: admin
Limite: illimitée (monthly_limit: -1)
```

## 🎨 Badge Admin

Le badge admin est affiché dans deux endroits:

1. **Header principal** (desktop uniquement)
   - À côté du nom d'utilisateur
   - Style: dégradé violet/indigo avec ombre
   - Texte: "ADMIN" en blanc

2. **Menu déroulant**
   - Dans l'en-tête du dropdown
   - Même style que le header

### Code du badge
```jsx
{currentUser?.isAdmin && (
  <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-sm">
    ADMIN
  </span>
)}
```

## 📁 Fichiers Clés

### Backend
- `backend/routes/auth.js` - Routes d'authentification
- `backend/middleware/auth.js` - Middleware de vérification token
- `backend/services/supabaseClient.js` - Client Supabase
- `backend/tests/auth.test.js` - Tests unitaires (11/11 passent)

### Frontend
- `src/contexts/AuthContext.jsx` - Context React pour l'authentification
- `src/pages/login/Login.jsx` - Page de connexion
- `src/pages/register/Signup.jsx` - Page d'inscription
- `src/components/ui/Header.jsx` - Header avec badge admin
- `src/services/api.js` - Service API avec endpoints auth

## 🔒 Sécurité

- ✅ Mots de passe hashés par Supabase
- ✅ JWT tokens avec expiration
- ✅ Validation des emails
- ✅ Rate limiting sur les endpoints sensibles
- ✅ CORS configuré
- ✅ Tokens invalidés après déconnexion
- ✅ Service role key séparée de la clé publique

## 🚀 Utilisation

### Inscription d'un nouvel utilisateur
```javascript
import { useAuth } from './contexts/AuthContext';

const { signUp } = useAuth();

await signUp(
  'user@example.com',
  'password123',
  {
    fullName: 'John Doe',
    companyName: 'Acme Corp'
  }
);
```

### Connexion
```javascript
const { signIn } = useAuth();

await signIn('user@example.com', 'password123');
```

### Déconnexion
```javascript
const { signOut } = useAuth();

await signOut();
```

### Vérifier si admin
```javascript
const { user } = useAuth();

if (user?.role === 'admin') {
  // Afficher fonctionnalités admin
}
```

## 📊 Workflow d'Authentification

```
1. Utilisateur remplit formulaire inscription/connexion
   ↓
2. Frontend → POST /api/auth/register ou /login
   ↓
3. Backend → Supabase Auth (création user ou vérification)
   ↓
4. Supabase → Retourne JWT token + user data
   ↓
5. Backend → Crée/récupère profil dans table profiles
   ↓
6. Backend → Retourne {success, token, user, profile}
   ↓
7. Frontend → Stocke token + user dans localStorage
   ↓
8. Frontend → Redirige vers dashboard
   ↓
9. Header → Affiche nom + badge admin si applicable
```

## 🔄 Prochaines Améliorations Possibles

- ⏳ Authentification OAuth (Google, GitHub)
- ⏳ Authentification à deux facteurs (2FA)
- ⏳ Gestion des permissions granulaires
- ⏳ Historique des connexions
- ⏳ Notifications par email
- ⏳ Reset password avec lien sécurisé
- ⏳ Gestion des sessions multiples

## 📝 Notes Techniques

### Configuration Supabase
Les clés Supabase sont stockées dans `backend/.env`:
```env
SUPABASE_URL=https://wxtrhxvyjfsqgphboqwo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Confirmation d'Email
Par défaut, Supabase envoie un email de confirmation. Pour les tests, les emails peuvent être confirmés automatiquement via l'API admin:

```javascript
await supabase.auth.admin.updateUserById(userId, { 
  email_confirm: true 
});
```

### Limites Mensuelles
- **Free tier:** 5 générations/mois
- **Admin:** Illimité (monthly_limit: -1)
- Reset automatique le 1er de chaque mois

---

**Date de mise à jour:** 22 Janvier 2026  
**Status:** ✅ Production Ready
