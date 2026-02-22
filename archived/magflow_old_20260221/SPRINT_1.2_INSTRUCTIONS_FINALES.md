# 🚀 Sprint 1.2 - Instructions Finales

**Date:** 2025-10-15 10:30  
**Status:** Backend ✅ FAIT | Frontend ⏳ À DÉMARRER

---

## 📊 Situation Actuelle

### ✅ Ce qui est FAIT (Dev 1 - Moi)

**Backend Flask modifié** en 15 minutes:
- ✅ Mapping dynamique `template_id` → fichiers `.indt/.indd`
- ✅ Support des vraies données (`titre`, `chapo`)
- ✅ Gestion d'erreurs robuste
- ✅ 7 tests créés
- ✅ Documentation complète
- ✅ Commit pushed sur branche `feature/sprint-1.2-fix-indesign`

### ⏳ Ce qui reste (Dev 2 - Ton développeur)

**Frontend React à modifier** (2 jours):
- Envoyer `template_id` sélectionné au backend
- Envoyer vraies données analysées (pas placeholders)
- Afficher feedback de progression
- Créer page résultat génération
- Tests E2E

---

## 👥 INSTRUCTIONS POUR TON DÉVELOPPEUR

### 📄 Document Principal

**Fichier à donner à ton dev:** `DEV2_INSTRUCTIONS_SPRINT_1.2.md`

Ce document contient:
- ✅ Objectifs clairs
- ✅ Fichiers à modifier (code exact)
- ✅ Tests E2E à créer
- ✅ Checklist de validation
- ✅ Guide debugging

---

## 🎯 Résumé pour Dev 2

### **Objectif Simple**

Modifier le frontend pour que:
1. Le template sélectionné par l'utilisateur soit envoyé au backend
2. Les vraies données analysées (titre, chapo) soient envoyées
3. Un feedback de progression s'affiche pendant la génération
4. L'utilisateur soit redirigé vers une page de résultat

---

### **Tâches Principales** (2 jours)

#### **Jour 1 (Mercredi) - 6h**

**1. Modifier `src/pages/smart-content-creator/index.jsx`** (4h)

```javascript
// Ajouter dans handleGenerate:
formData.append('template_id', selectedTemplate.id);  // ← NOUVEAU
formData.append('titre', analyzedContent.titre_principal);  // ← NOUVEAU
formData.append('chapo', analyzedContent.chapo);  // ← NOUVEAU
```

**2. Ajouter feedback progression** (1h)
```jsx
{isGenerating && (
  <div>Génération en cours...</div>
)}
```

**3. Tests manuels** (1h)
- Sélectionner template
- Générer
- Vérifier données envoyées

---

#### **Jour 2 (Jeudi) - 6h**

**4. Créer `src/pages/generation-result/index.jsx`** (2h)
- Page de succès
- Bouton téléchargement
- Navigation

**5. Tests E2E** (3h)
- 4 tests Playwright
- Validation workflow complet

**6. Validation finale** (1h)
- Tests passent
- Workflow complet OK

---

### **Fichiers à Créer/Modifier**

```
✏️ src/pages/smart-content-creator/index.jsx (MODIFIER)
   - handleGenerate() 
   - Feedback progression
   
📄 src/pages/generation-result/index.jsx (CRÉER)
   - Page résultat
   - Téléchargement

✏️ src/App.jsx (MODIFIER)
   - Ajouter route /generation-result/:projectId

📄 e2e/frontend-integration.spec.js (CRÉER)
   - 4 tests E2E
```

---

### **Branche Git**

```bash
# Dev 2 doit créer sa branche:
git checkout main
git pull
git checkout -b feature/sprint-1.2-frontend-integration
```

---

### **Commande de Démarrage**

```bash
# 1. Lancer tous les services
./start-all.sh

# 2. Ouvrir le fichier
code src/pages/smart-content-creator/index.jsx

# 3. Commencer les modifications
```

---

## 🔗 Coordination Dev 1 ↔ Dev 2

### **Ce que je (Dev 1) fournis:**

| Élément | Status | Où ? |
|---------|--------|------|
| Backend Flask modifié | ✅ FAIT | `Indesign automation v1/app.py` |
| Mapping templates | ✅ FAIT | `TEMPLATE_MAPPING` dict |
| Tests backend | ✅ FAIT | `test_templates.py` |
| Documentation API | ✅ FAIT | Commentaires dans code |
| Instructions Dev 2 | ✅ FAIT | `DEV2_INSTRUCTIONS_SPRINT_1.2.md` |

### **Ce que Dev 2 doit faire:**

| Tâche | Durée | Fichier |
|-------|-------|---------|
| Modifier smart-content-creator | 4h | `src/pages/smart-content-creator/index.jsx` |
| Créer generation-result | 2h | `src/pages/generation-result/index.jsx` |
| Créer tests E2E | 3h | `e2e/frontend-integration.spec.js` |
| Tests & validation | 3h | - |
| **TOTAL** | **12h (2 jours)** | - |

---

## 📋 Checklist pour Démarrer

### **Pour Toi (Manager)**

- [x] ✅ Lire ce document
- [ ] Transmettre `DEV2_INSTRUCTIONS_SPRINT_1.2.md` à Dev 2
- [ ] Vérifier que Dev 2 a accès au repo
- [ ] S'assurer que les services tournent

### **Pour Dev 2**

- [ ] Lire `DEV2_INSTRUCTIONS_SPRINT_1.2.md`
- [ ] Créer branche `feature/sprint-1.2-frontend-integration`
- [ ] Lancer `./start-all.sh`
- [ ] Ouvrir `src/pages/smart-content-creator/index.jsx`
- [ ] Commencer les modifications

---

## 🔍 Points de Validation

### **Daily Standup** (Chaque jour 9h)

**Questions à poser à Dev 2:**
1. Qu'as-tu fait hier ?
2. Que vas-tu faire aujourd'hui ?
3. As-tu des blocages ?

### **Quick Sync** (Si blocage >1h)

**Dev 2 doit:**
1. Documenter le problème
2. Vérifier les logs (backend.log, flask.log)
3. Contacter Dev 1 (moi)

---

## 🧪 Comment Valider

### **Test Manuel Simple** (5 min)

```bash
# 1. Ouvrir frontend
http://localhost:5173/smart-content-creator

# 2. Coller un article
"Test\n\nContenu test"

# 3. Analyser

# 4. Sélectionner template (fallback-1)

# 5. Générer

# 6. Vérifier logs Flask:
tail -f flask.log
# Devrait voir:
# [Flask] 🎨 Template sélectionné: fallback-1 → template-mag-simple-1808.indt
# [Flask] 📝 Données: titre=Test...
```

### **Tests E2E** (Après Dev 2)

```bash
npm run test:e2e
# Devrait passer 4/4 tests
```

---

## 📞 Support & Communication

### **Si Dev 2 est bloqué:**

**Option 1: Quick Sync** (5-10 min)
- Call/vidéo rapide
- Debug ensemble
- Déblocage immédiat

**Option 2: Message Async**
- Décrire le problème
- Logs d'erreur
- Screenshots
- J'aide dès que possible

### **Canaux de Communication:**

- **Urgent:** [À définir - Slack/Discord/etc.]
- **Questions:** [À définir]
- **Code Review:** GitHub PR

---

## 🎯 Critères de Succès Sprint 1.2

### **Backend** ✅ VALIDÉ
- [x] Mapping templates fonctionne
- [x] Vraies données acceptées
- [x] Gestion erreurs OK
- [x] Tests passent
- [x] Commit pushed

### **Frontend** ⏳ À VALIDER
- [ ] template_id envoyé correctement
- [ ] Vraies données envoyées
- [ ] Feedback progression fonctionne
- [ ] Page résultat créée
- [ ] Tests E2E passent (4/4)

### **Intégration Complète** ⏳ À VALIDER
- [ ] Workflow bout en bout fonctionne
- [ ] Fichier .indd généré avec bon template
- [ ] Vraies données dans .indd
- [ ] Téléchargement fonctionne

---

## 📅 Timeline

```
┌─────────────────────────────────────────────────────────┐
│                    SPRINT 1.2 (3 jours)                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Lundi 10:30  ✅ Dev 1: Backend FAIT                    │
│               ✅ Instructions Dev 2 prêtes               │
│                                                           │
│  Mercredi     ⏳ Dev 2: Modifier smart-content-creator  │
│               ⏳ Dev 2: Feedback progression             │
│                                                           │
│  Jeudi        ⏳ Dev 2: Page génération-result          │
│               ⏳ Dev 2: Tests E2E                        │
│                                                           │
│  Vendredi 17h 🎯 Review Sprint 1.2                      │
│               🎯 Demo complète                           │
│               🎯 Validation finale                       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Ressources Disponibles

### **Pour Dev 2:**
- `DEV2_INSTRUCTIONS_SPRINT_1.2.md` - Instructions détaillées
- `ROADMAP_V1_STRATEGIE.md` - Contexte Sprint 1.2
- `PLAN_2_DEVS.md` - Plan complet 2 devs
- `backend/README.md` - Doc API

### **Pour Toi (Manager):**
- `SPRINT_1.2_BACKEND_DONE.md` - Ce que j'ai fait
- `SPRINT_1.2_INSTRUCTIONS_FINALES.md` - Ce document
- `START_HERE.md` - Vue d'ensemble

---

## 🚨 Problèmes Potentiels & Solutions

### **Problème 1: "template_id undefined"**
**Solution:** Vérifier `selectedTemplate` dans console
```javascript
console.log('Selected:', selectedTemplate);
```

### **Problème 2: "Flask 404"**
**Solution:** Vérifier Flask tourne
```bash
curl http://localhost:5003/api/status
```

### **Problème 3: "Tests échouent"**
**Solution:** Lancer avec UI
```bash
npm run test:e2e:ui
```

---

## ✨ Bonus: Quick Win

Si Dev 2 finit avant:
- [ ] Ajouter animations
- [ ] Améliorer UI/UX
- [ ] Ajouter validations
- [ ] Optimiser performance

---

## 🎉 Résumé pour Toi

### **Ce que j'ai fait (15 min):**
✅ Backend Flask complet  
✅ Tests créés  
✅ Documentation exhaustive  
✅ Instructions Dev 2 prêtes

### **Ce que Dev 2 doit faire (2 jours):**
⏳ Frontend modifications  
⏳ Tests E2E  
⏳ Validation complète

### **Ton rôle:**
📋 Transmettre `DEV2_INSTRUCTIONS_SPRINT_1.2.md`  
👀 Suivre l'avancement (daily standup)  
✅ Valider vendredi 17h

---

## 📄 Fichier à Envoyer à Dev 2

**Unique fichier nécessaire:**
```
📄 DEV2_INSTRUCTIONS_SPRINT_1.2.md
```

Ce fichier contient TOUT ce dont il a besoin:
- Objectifs
- Code à modifier (avec exemples)
- Tests à créer
- Checklist
- Debugging

---

## 🚀 Action Immédiate

**Pour Toi:**
```bash
# 1. Lire ce document ✅
# 2. Transmettre à Dev 2:
#    - DEV2_INSTRUCTIONS_SPRINT_1.2.md
# 3. Lui dire de créer sa branche:
#    - git checkout -b feature/sprint-1.2-frontend-integration
# 4. Daily standup demain 9h
```

**Pour Dev 2:**
```bash
# 1. Lire DEV2_INSTRUCTIONS_SPRINT_1.2.md
# 2. Créer branche
# 3. Lancer ./start-all.sh
# 4. Commencer modifications
```

---

## 🎯 Objectif Final Sprint 1.2

**Workflow complet fonctionnel:**
```
1. Utilisateur analyse article
   ↓
2. IA extrait structure (Sprint 1.1 ✅)
   ↓
3. Utilisateur sélectionne template
   ↓
4. Backend reçoit bon template_id (Sprint 1.2 ✅)
   ↓
5. Frontend envoie vraies données (Sprint 1.2 ⏳)
   ↓
6. InDesign génère avec bon template + vraies données
   ↓
7. Utilisateur télécharge .indd
   ↓
8. ✅ SUCCÈS
```

---

**Go ! Ton dev peut démarrer dès maintenant ! 🚀**

---

**Créé par:** Cascade (Dev 1)  
**Pour:** Manager + Dev 2  
**Date:** 2025-10-15 10:30  
**Sprint:** 1.2 (Semaine 1, Mer-Ven)
