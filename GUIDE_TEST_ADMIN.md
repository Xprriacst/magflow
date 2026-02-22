# 🧪 Guide de Test - Fonctionnalités Admin & Multi-User

**Story 1.1** - Migration Multi-User SaaS  
**Date:** 2026-01-10  
**Application:** http://localhost:5173

---

## ✅ CORRECTIONS APPLIQUÉES

1. ✅ **Credentials Supabase** configurés dans `.env.local`
2. ✅ **Modèle Claude API** corrigé : `claude-3-5-sonnet-20241022`
3. ✅ **Services redémarrés** avec les nouvelles configurations

---

## 🔐 COMPTE ADMIN

**Email:** alexandre.errasti@gmail.com  
**Password:** FoJ1ENOxjAIJLWaTfOOw  
**Role:** admin  
**Tier:** pro  
**Monthly Limit:** -1 (illimité)

---

## 📋 TESTS À EFFECTUER

### 1️⃣ **Test Authentification Admin**

#### Actions:
1. Ouvrez http://localhost:5173
2. Cliquez sur "Se connecter" ou "Login"
3. Entrez les credentials admin ci-dessus
4. Cliquez sur "Connexion"

#### Résultats attendus:
- ✅ Connexion réussie
- ✅ Redirection vers le dashboard
- ✅ Nom/email affiché dans l'interface
- ✅ Menu admin visible (si implémenté)

---

### 2️⃣ **Test Visualisation des Données Admin**

#### Actions:
1. Une fois connecté, allez dans "Templates" ou "Mes Templates"
2. Comptez le nombre de templates affichés
3. Allez dans "Générations" ou "Historique"
4. Comptez le nombre de générations affichées

#### Résultats attendus:
- ✅ **5 templates** visibles (migrés depuis v1.0)
- ✅ **128 générations** visibles (migrées depuis v1.0)
- ✅ Toutes les données appartiennent à votre user_id
- ✅ Aucune erreur RLS (Row Level Security)

---

### 3️⃣ **Test Création de Template (avec RLS)**

#### Actions:
1. Cliquez sur "Ajouter un template" ou "Upload Template"
2. Uploadez un fichier `.indt` (ou créez un template test)
3. Remplissez les informations requises
4. Sauvegardez

#### Résultats attendus:
- ✅ Template créé avec succès
- ✅ Le template a automatiquement votre `user_id`
- ✅ Le template apparaît dans votre liste
- ✅ Total templates = 6 (5 migrés + 1 nouveau)

#### Vérification en base de données:
```sql
SELECT id, name, user_id, created_at 
FROM public.indesign_templates 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### 4️⃣ **Test Génération de Magazine**

#### Actions:
1. Cliquez sur "Nouvelle génération" ou "Créer un magazine"
2. Entrez du contenu texte (ex: un article de blog)
3. Uploadez 1-3 images
4. Sélectionnez un template
5. Lancez la génération

#### Résultats attendus:
- ✅ Analyse du contenu réussie (Claude API)
- ✅ Recommandations de templates affichées
- ✅ Génération lancée sans erreur
- ✅ La génération a votre `user_id`
- ⚠️ Flask API peut ne pas répondre (problème Python) - c'est OK pour ce test

#### Si erreur Claude API:
- Vérifiez que `ANTHROPIC_API_KEY` est configurée dans `backend/.env`
- Le modèle est maintenant `claude-3-5-sonnet-20241022` ✅

---

### 5️⃣ **Test Multi-User - Isolation des Données (RLS)**

#### Actions:
1. **Déconnectez-vous** de votre compte admin
2. **Créez un nouveau compte** utilisateur test:
   - Email: `test@example.com`
   - Password: `TestUser123!`
3. **Connectez-vous** avec ce nouveau compte
4. Allez dans "Templates" et "Générations"

#### Résultats attendus:
- ✅ **0 templates** visibles (le user test n'a rien créé)
- ✅ **0 générations** visibles
- ✅ Les données de l'admin ne sont PAS visibles
- ✅ RLS fonctionne correctement (isolation des données)

#### Vérification RLS:
```sql
-- En tant que user test, vous ne devriez voir QUE vos données
SELECT COUNT(*) FROM public.indesign_templates; -- Devrait être 0
SELECT COUNT(*) FROM public.magazine_generations; -- Devrait être 0
```

---

### 6️⃣ **Test Privilèges Admin - Voir Toutes les Données**

#### Actions:
1. **Reconnectez-vous** en tant qu'admin (`alexandre.errasti@gmail.com`)
2. Allez dans un panneau "Admin" ou "Tous les utilisateurs" (si implémenté)
3. Essayez de voir les données de tous les utilisateurs

#### Résultats attendus:
- ✅ En tant qu'admin, vous voyez VOS données (5 templates, 128+ générations)
- ✅ Si panneau admin existe, vous voyez les données de TOUS les users
- ✅ Vous pouvez voir le user test créé précédemment
- ✅ Policies RLS "Admins can read all" fonctionnent

#### Vérification SQL (en tant qu'admin):
```sql
-- Admin peut voir tous les profils
SELECT id, email, role, subscription_tier 
FROM public.profiles;

-- Admin peut voir tous les templates
SELECT COUNT(*) as total_templates, 
       COUNT(DISTINCT user_id) as unique_users
FROM public.indesign_templates;
```

---

### 7️⃣ **Test Freemium - Limites d'Utilisation**

#### Actions:
1. Connectez-vous avec le compte test (`test@example.com`)
2. Vérifiez votre profil:
   - Tier: `free`
   - Monthly limit: `5`
   - Monthly used: `0`
3. Créez **5 générations** de magazines
4. Tentez une **6ème génération**

#### Résultats attendus:
- ✅ Les 5 premières générations fonctionnent
- ✅ La 6ème génération est **bloquée** avec message:
  - "Limite mensuelle atteinte (5/5)"
  - "Passez à Pro pour générations illimitées"
- ✅ `monthly_generations_used` = 5 en base

#### Vérification:
```sql
SELECT email, subscription_tier, monthly_limit, monthly_generations_used
FROM public.profiles
WHERE email = 'test@example.com';
```

---

### 8️⃣ **Test Admin - Pas de Limites**

#### Actions:
1. Reconnectez-vous en admin (`alexandre.errasti@gmail.com`)
2. Créez **10+ générations** de magazines

#### Résultats attendus:
- ✅ Aucune limite appliquée
- ✅ `monthly_limit = -1` (illimité)
- ✅ Toutes les générations fonctionnent
- ✅ Pas de message de limite

---

## 🐛 PROBLÈMES CONNUS

### Flask API ne répond pas
**Symptôme:** `Flask API not responding. Is it running on port 5003?`

**Cause:** Python n'est pas trouvé par le script de démarrage

**Solution temporaire:**
- L'analyse de contenu fonctionne avec Claude API ✅
- La génération InDesign nécessite Flask (Desktop Agent)
- Pour tester sans Flask: testez uniquement l'analyse de contenu et la sélection de templates

**Solution permanente:**
```bash
cd "Indesign automation v1"
python3 app.py
```

---

## 📊 CHECKLIST DE VALIDATION

| Test | Status | Notes |
|------|--------|-------|
| ✅ Connexion admin | ⬜ | Email + password fonctionnent |
| ✅ Voir 5 templates migrés | ⬜ | Données v1.0 visibles |
| ✅ Voir 128 générations migrées | ⬜ | Données v1.0 visibles |
| ✅ Créer nouveau template | ⬜ | user_id auto-assigné |
| ✅ Analyser contenu (Claude) | ⬜ | Modèle corrigé |
| ✅ Isolation RLS (user test) | ⬜ | 0 templates/générations visibles |
| ✅ Admin voit tout | ⬜ | Policies admin fonctionnent |
| ✅ Limite freemium (5 max) | ⬜ | 6ème génération bloquée |
| ✅ Admin illimité | ⬜ | Pas de limite appliquée |

---

## 🎯 CRITÈRES DE SUCCÈS

**Story 1.1 est validée si:**
- ✅ 8/9 tests passent (Flask optionnel)
- ✅ RLS fonctionne (isolation des données)
- ✅ Admin a accès complet
- ✅ Freemium limits fonctionnent
- ✅ Aucune donnée perdue (5 templates + 128 générations)

---

## 📝 RAPPORT DE TEST

Une fois les tests terminés, remplissez ce rapport:

```
Date: ___________
Testeur: ___________

Tests réussis: ___/9
Tests échoués: ___/9

Problèmes rencontrés:
- 
- 

Recommandations:
- 
- 

Story 1.1 validée: ✅ OUI / ❌ NON
```

---

**Créé par:** James (Dev Agent)  
**Validé par:** Quinn (QA Agent)  
**Date:** 2026-01-10
