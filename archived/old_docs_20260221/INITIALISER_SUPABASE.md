# 🗄️ Initialiser la Base de Données Supabase

## 📋 Étapes (2 minutes)

### Étape 1 : Ouvrir le Dashboard Supabase

Cliquer sur ce lien : 
👉 **https://supabase.com/dashboard/project/wxtrhxvyjfsqgphboqwo**

### Étape 2 : Aller dans SQL Editor

1. Dans le menu de gauche, cliquer sur **"SQL Editor"**
2. Cliquer sur **"New query"** (bouton en haut à droite)

### Étape 3 : Copier-coller le SQL

1. Ouvrir le fichier : `backend/supabase-schema.sql`
2. Tout sélectionner (`Cmd+A`)
3. Copier (`Cmd+C`)
4. Coller dans l'éditeur SQL de Supabase (`Cmd+V`)

### Étape 4 : Exécuter

1. Cliquer sur **"Run"** (ou `Cmd+Enter`)
2. Attendre 2-3 secondes

### Étape 5 : Vérifier

✅ Vous devriez voir : **"Success. No rows returned"**

### Étape 6 : Vérifier les données

Dans l'éditeur SQL, exécuter :

```sql
SELECT * FROM indesign_templates;
```

✅ **Résultat attendu :** 3 lignes (3 templates)

```
Magazine Artistique Simple
Magazine Artistique Avancé  
Magazine Art - Page 1
```

---

## ✅ C'est terminé !

Votre base de données est maintenant configurée avec :

- ✅ 2 tables (`indesign_templates`, `magazine_generations`)
- ✅ 3 templates pré-configurés
- ✅ Indexes pour performance
- ✅ Fonctions et triggers
- ✅ Vue de statistiques

---

## 🧪 Test rapide

Dans votre terminal :

```bash
cd backend
npm run dev
```

Puis dans un autre terminal :

```bash
curl http://localhost:3001/api/templates
```

✅ **Résultat attendu :**
```json
{
  "success": true,
  "templates": [
    {
      "id": "uuid...",
      "name": "Magazine Artistique Simple",
      "filename": "template-mag-simple-1808.indt",
      ...
    }
  ]
}
```

---

## 🐛 En cas de problème

### "relation already exists"
C'est normal ! Les tables existent déjà. Pas de souci.

### "permission denied"
Vérifier que vous utilisez bien la **Service Role Key** dans `.env`

### "syntax error"
Vérifier que TOUT le SQL a bien été copié (le fichier fait 249 lignes)

---

## 🔄 Réinitialiser les tables (si besoin)

Si vous voulez recommencer de zéro :

```sql
-- Supprimer les tables
DROP TABLE IF EXISTS magazine_generations CASCADE;
DROP TABLE IF EXISTS indesign_templates CASCADE;
DROP VIEW IF EXISTS templates_stats CASCADE;
DROP FUNCTION IF EXISTS search_templates CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

Puis réexécuter `supabase-schema.sql`.

---

**Prêt pour la suite !** 🚀
