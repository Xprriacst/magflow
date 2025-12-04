# 🎯 Roadmap v1 - Stratégie de Déploiement MagFlow

**Date:** 2025-10-14  
**Version cible:** 1.0.0  
**Durée estimée:** 3-4 semaines

---

## 📋 Résumé des 4 Objectifs

### 1. Amélioration Analyse IA ⚡ **PRIORITÉ 1**
**Problème:** L'IA reformule tout au lieu d'identifier les parties  
**Solution:** Modifier le prompt OpenAI pour extraction pure  
**Impact:** Fondamental - Affecte tout le workflow

### 2. Recommandation Intelligente Templates 🎨 **PRIORITÉ 2**
**Problème:** Pas de suggestion automatique basée sur structure  
**Solution:** Algorithme de scoring basé sur structure + photos  
**Impact:** UX majeure - Valeur ajoutée principale

### 3. Remplissage Correct InDesign 📄 **PRIORITÉ 3**
**Problème:** Toujours le même template + placeholders  
**Solution:** Mapper template sélectionné + vraies données  
**Impact:** Critique - Fonctionnalité core cassée

### 4. Système de Licensing 🔐 **PRIORITÉ 4**
**Problème:** Pas de monétisation ni contrôle d'accès  
**Solution:** Architecture licensing + serveur d'activation  
**Impact:** Business model - Peut être fait après MVP fonctionnel

---

## 🎯 Stratégie de Déploiement

### Phase 1: Fondations Techniques (Semaine 1)
**Objectif:** Corriger les fonctionnalités core cassées

#### Sprint 1.1 - Analyse IA Pure (2-3 jours)
```javascript
// backend/services/openaiService.js
// AVANT: L'IA reformule
// APRÈS: L'IA extrait sans reformuler
```

**Tâches:**
- [ ] Modifier le prompt OpenAI (1h)
- [ ] Ajouter instruction "NE PAS reformuler, extraire tel quel"
- [ ] Tester avec 10 articles différents (2h)
- [ ] Valider que le texte original est préservé

**Livrables:**
- Prompt OpenAI optimisé
- Tests unitaires
- Documentation du comportement

#### Sprint 1.2 - Fix Remplissage InDesign (2-3 jours)
```python
# Indesign automation v1/app.py
# AVANT: Template hardcodé
# APRÈS: Template dynamique selon sélection
```

**Tâches:**
- [ ] Mapper template_id → fichier .indt correct (2h)
- [ ] Remplacer placeholders par vraies données (3h)
- [ ] Gérer les cas edge (template non trouvé, etc.) (1h)
- [ ] Tests avec chaque template disponible (2h)

**Livrables:**
- Génération InDesign fonctionnelle
- Mapping template_id complet
- Tests E2E validés

---

### Phase 2: Intelligence & UX (Semaine 2)
**Objectif:** Ajouter la valeur ajoutée IA

#### Sprint 2.1 - Algorithme de Recommandation (3-4 jours)
```javascript
// backend/routes/templates.js
POST /api/templates/recommend
```

**Logique de Scoring:**
```javascript
function scoreTemplate(template, content) {
  let score = 0;
  
  // 1. Structure textuelle (40 points)
  if (content.sections.length === template.sections_expected) score += 40;
  else score += Math.max(0, 40 - Math.abs(content.sections.length - template.sections_expected) * 10);
  
  // 2. Images (30 points)
  if (content.images_count === template.image_slots) score += 30;
  else score += Math.max(0, 30 - Math.abs(content.images_count - template.image_slots) * 5);
  
  // 3. Longueur texte (20 points)
  const wordCount = content.total_words;
  if (wordCount >= template.min_words && wordCount <= template.max_words) score += 20;
  
  // 4. Catégorie (10 points)
  if (content.category === template.category) score += 10;
  
  return score;
}
```

**Tâches:**
- [ ] Créer fonction de scoring (4h)
- [ ] Enrichir metadata templates (nombre sections, slots images) (2h)
- [ ] Intégrer dans l'API recommend (2h)
- [ ] Interface: afficher suggestion en encadré (3h)
- [ ] Tests avec différents contenus (2h)

**Livrables:**
- Endpoint `/api/templates/recommend` fonctionnel
- UI avec suggestion mise en avant
- Documentation algorithme

---

### Phase 3: Licensing & Distribution (Semaine 3-4)
**Objectif:** Système de monétisation

#### Sprint 3.1 - Architecture Licensing (4-5 jours)

**Architecture Proposée:**
```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Client    │─────▶│  License Server  │─────▶│  Database   │
│  (Desktop)  │      │   (Cloud API)    │      │  (Licenses) │
└─────────────┘      └──────────────────┘      └─────────────┘
     │                        │
     │  1. Check license      │
     │  2. Get token         │
     │  3. Validate daily    │
     └────────────────────────┘
```

**Composants:**

1. **Serveur de Licenses (Node.js + Supabase)**
```javascript
// license-server/routes/licenses.js
POST /api/licenses/activate     // Activer une licence
POST /api/licenses/validate     // Valider une licence
POST /api/licenses/deactivate   // Désactiver (changement machine)
GET  /api/licenses/status       // Statut abonnement
```

2. **Client Desktop (Electron)**
```javascript
// Structure:
magflow-desktop/
├── main.js              // Electron main process
├── preload.js           // Security bridge
├── renderer/            // React app (existant)
├── license/
│   ├── validator.js     // Vérification license
│   └── hardware.js      // Hardware ID
└── package.json
```

3. **Base de Données Licenses**
```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY,
  license_key VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL, -- 'monthly', 'annual', 'lifetime'
  status VARCHAR(20) NOT NULL, -- 'active', 'expired', 'suspended'
  hardware_id VARCHAR(255), -- Machine ID
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE license_validations (
  id SERIAL PRIMARY KEY,
  license_id UUID REFERENCES licenses(id),
  validated_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45)
);
```

**Tâches:**
- [ ] Setup serveur licenses (API) (1 jour)
- [ ] Créer schéma DB licenses (2h)
- [ ] Wrapper Electron pour app React (1 jour)
- [ ] Système génération license keys (3h)
- [ ] Validation hardware ID (4h)
- [ ] Interface activation dans app (1 jour)
- [ ] Système de paiement (Stripe) (1 jour)
- [ ] Tests complets (1 jour)

**Livrables:**
- API license server déployée
- App Electron packagée (.dmg Mac / .exe Windows)
- Interface activation/validation
- Integration Stripe

#### Sprint 3.2 - Distribution & Packaging (2-3 jours)

**Packaging:**
```bash
# Mac
npm run build:mac
# Produit: MagFlow-1.0.0.dmg

# Windows
npm run build:win
# Produit: MagFlow-Setup-1.0.0.exe
```

**Tâches:**
- [ ] Configuration electron-builder (3h)
- [ ] Auto-updater (Electron) (4h)
- [ ] Code signing certificates (Mac/Windows) (1 jour)
- [ ] Installer customisé (2h)
- [ ] Landing page téléchargement (4h)

**Livrables:**
- Installers signés Mac/Windows
- Auto-update fonctionnel
- Page de téléchargement

---

## 📅 Planning Détaillé

### Semaine 1: Core Fixes
```
Lun-Mar:  Analyse IA pure (Sprint 1.1)
Mer-Ven:  Fix InDesign remplissage (Sprint 1.2)
Weekend:  Tests & validation
```

### Semaine 2: Intelligence
```
Lun-Jeu:  Algorithme recommandation (Sprint 2.1)
Ven:      Tests & UX polish
Weekend:  Beta testing interne
```

### Semaine 3: Licensing Foundation
```
Lun-Mar:  Serveur licenses + DB
Mer-Jeu:  Electron wrapper
Ven:      Validation hardware
```

### Semaine 4: Distribution
```
Lun-Mar:  Packaging & code signing
Mer-Jeu:  Auto-updater + Stripe
Ven:      Tests finaux & launch prep
```

---

## 🔧 Détails Techniques par Sprint

### SPRINT 1.1 - Analyse IA Pure

**Fichier:** `backend/services/openaiService.js`

**Modification du Prompt:**
```javascript
const ANALYSIS_PROMPT = `Tu es un analyseur de structure éditoriale. 
Ton rôle est d'IDENTIFIER et EXTRAIRE les différentes parties d'un article,
SANS RIEN REFORMULER.

RÈGLES STRICTES:
1. NE PAS reformuler le texte original
2. EXTRAIRE tel quel les titres, sous-titres, paragraphes
3. IDENTIFIER la structure (intro, corps, conclusion)
4. PRÉSERVER le style et le ton de l'auteur

Article à analyser:
${content}

Retourne un JSON avec:
{
  "titre_principal": "EXTRAIRE tel quel le titre existant",
  "chapo": "EXTRAIRE tel quel le premier paragraphe",
  "sections": [
    {
      "titre": "EXTRAIRE tel quel",
      "contenu": "EXTRAIRE tel quel",
      "type": "introduction|corps|conclusion"
    }
  ],
  "structure_detectee": {
    "nombre_sections": 3,
    "images_mentionnees": 2,
    "longueur_mots": 450
  }
}`;
```

**Tests à créer:**
```javascript
// backend/tests/openai.test.js
test('Ne reformule pas le contenu original', async () => {
  const original = "L'IA révolutionne le monde";
  const result = await analyzeContentStructure(original);
  expect(result.sections[0].contenu).toContain("L'IA révolutionne");
});
```

---

### SPRINT 1.2 - Fix Remplissage InDesign

**Fichier:** `Indesign automation v1/app.py`

**Problème actuel:**
```python
# AVANT - Toujours le même template
template_file = "template-mag-simple-1808.indt"  # HARDCODÉ !
```

**Solution:**
```python
# APRÈS - Template dynamique
TEMPLATE_MAPPING = {
    "fallback-1": "template-mag-simple-1808.indt",
    "fallback-2": "template-mag-simple-2-1808.indt",
    "fallback-3": "magazine-art-template-page-1.indd"
}

@app.route('/api/create-layout', methods=['POST'])
def create_layout():
    data = request.json
    template_id = data.get('template_id')  # Depuis le frontend
    content = data.get('content')
    
    # Mapper vers le bon fichier
    template_file = TEMPLATE_MAPPING.get(template_id)
    if not template_file:
        return jsonify({'error': 'Template non trouvé'}), 404
    
    # Remplacer placeholders par VRAIES données
    replacements = {
        '{{TITRE}}': content['titre_principal'],
        '{{CHAPO}}': content['chapo'],
        '{{ARTICLE}}': content['sections'][0]['contenu']
    }
    
    # Générer le fichier
    result = generate_indesign_layout(template_file, replacements)
    return jsonify(result)
```

**Frontend à modifier:**
```javascript
// src/pages/smart-content-creator/index.jsx
const handleGenerate = async () => {
  const response = await fetch('http://localhost:5003/api/create-layout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: selectedTemplate.id,  // ✅ Envoi du bon ID
      content: analyzedContent            // ✅ Vraies données
    })
  });
};
```

---

### SPRINT 2.1 - Recommandation Intelligente

**Enrichir les Templates:**
```javascript
// backend/data/templatesFallback.js
const TEMPLATES = [
  {
    id: "fallback-1",
    name: "Magazine Simple",
    // AJOUTER:
    structure: {
      sections_expected: 1,      // Article simple
      image_slots: 3,
      min_words: 200,
      max_words: 800,
      layout_type: "simple"
    }
  },
  {
    id: "fallback-2",
    name: "Magazine Avancé",
    structure: {
      sections_expected: 3,      // Article multi-sections
      image_slots: 5,
      min_words: 800,
      max_words: 2000,
      layout_type: "complex"
    }
  }
];
```

**API Endpoint:**
```javascript
// backend/routes/templates.js
router.post('/recommend', async (req, res) => {
  const { content } = req.body;
  
  // Calculer score pour chaque template
  const scoredTemplates = templates.map(template => ({
    ...template,
    score: calculateScore(template, content),
    reasons: getMatchReasons(template, content)
  }));
  
  // Trier par score
  scoredTemplates.sort((a, b) => b.score - a.score);
  
  res.json({
    recommended: scoredTemplates[0],  // Top 1
    alternatives: scoredTemplates.slice(1, 3),  // 2 alternatives
    all: scoredTemplates
  });
});
```

**UI Frontend:**
```jsx
// Afficher la suggestion en encadré
{recommendedTemplate && (
  <div className="recommended-template-card border-2 border-green-500 bg-green-50 p-4">
    <div className="flex items-center gap-2">
      <Star className="text-green-600" />
      <h3 className="font-bold">Recommandé pour votre contenu</h3>
    </div>
    <p className="text-sm text-gray-600">
      Score: {recommendedTemplate.score}/100
    </p>
    <ul className="mt-2 text-sm">
      {recommendedTemplate.reasons.map(reason => (
        <li key={reason}>✓ {reason}</li>
      ))}
    </ul>
    <Button onClick={() => selectTemplate(recommendedTemplate)}>
      Utiliser ce template
    </Button>
  </div>
)}
```

---

### SPRINT 3.1 - Système Licensing

**Architecture Licensing:**

1. **Génération de Clés:**
```javascript
// license-server/utils/keyGenerator.js
function generateLicenseKey() {
  const prefix = 'MGFL';  // MagFlow
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    const segment = crypto.randomBytes(4).toString('hex').toUpperCase();
    segments.push(segment);
  }
  
  return `${prefix}-${segments.join('-')}`;
  // Ex: MGFL-A3F2-8D4C-9E1B-7F6A
}
```

2. **Validation Hardware:**
```javascript
// desktop-app/license/hardware.js
const si = require('systeminformation');

async function getHardwareID() {
  const cpu = await si.cpu();
  const system = await si.system();
  
  const fingerprint = `${system.uuid}-${cpu.manufacturer}-${cpu.brand}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}
```

3. **Validation au Démarrage:**
```javascript
// desktop-app/main.js (Electron)
app.on('ready', async () => {
  const licenseValid = await validateLicense();
  
  if (!licenseValid) {
    // Afficher fenêtre d'activation
    showActivationWindow();
  } else {
    // Lancer l'app normale
    createMainWindow();
  }
});
```

4. **Vérification Périodique:**
```javascript
// Vérifier toutes les 24h
setInterval(async () => {
  const stillValid = await checkLicenseOnline();
  if (!stillValid) {
    // Bloquer l'app
    showLicenseExpiredDialog();
  }
}, 24 * 60 * 60 * 1000);
```

---

## 💰 Modèle de Licensing Proposé

### Plans Tarifaires

**Plan Solo - 29€/mois**
- 1 machine active
- Génération illimitée
- Support email
- Mises à jour incluses

**Plan Studio - 79€/mois**
- 3 machines actives
- Génération illimitée
- Support prioritaire
- Templates personnalisés
- API access

**Plan Entreprise - 199€/mois**
- 10 machines actives
- White-label possible
- Support dédié
- Formation incluse
- SLA 99.9%

**Licence Perpétuelle - 999€**
- 1 machine
- Mises à jour 1 an incluses
- Support 1 an

---

## 🎯 Critères de Succès

### Sprint 1.1 ✅
- [ ] 10 articles testés, texte préservé à 100%
- [ ] Temps d'analyse < 10s
- [ ] Structure correctement identifiée

### Sprint 1.2 ✅
- [ ] Les 3 templates fonctionnent correctement
- [ ] Vraies données dans InDesign (pas de placeholders)
- [ ] Fichier .indd ouvre sans erreur

### Sprint 2.1 ✅
- [ ] Recommandation pertinente dans 80% des cas
- [ ] UI claire avec raisons du choix
- [ ] Utilisateur peut override la suggestion

### Sprint 3.1 ✅
- [ ] Activation license en < 30 secondes
- [ ] Validation offline fonctionne 7 jours
- [ ] Changement de machine possible
- [ ] Paiement Stripe intégré

---

## 🚀 Go-Live Checklist

### Avant Launch
- [ ] Tous les sprints complétés
- [ ] Tests E2E passent à 100%
- [ ] Documentation utilisateur complète
- [ ] Vidéos tutoriels créées
- [ ] Page de vente/landing page prête
- [ ] Stripe configuré
- [ ] Support client ready

### Day 1
- [ ] Release installers (Mac + Windows)
- [ ] Activer serveur licenses
- [ ] Envoyer emails early adopters
- [ ] Monitoring actif

### Week 1
- [ ] Collecter feedback
- [ ] Fix bugs critiques
- [ ] Ajuster pricing si nécessaire

---

## 📞 Ressources Nécessaires

### Développement
- OpenAI API (GPT-4o)
- Supabase (DB + Auth)
- Stripe (Paiements)
- Cloudflare (CDN pour téléchargements)

### Code Signing
- Apple Developer Account (99$/an)
- Windows Code Signing Certificate (~300€/an)

### Hébergement
- Vercel/Netlify (Frontend + API)
- ~20€/mois

---

**Next Steps:** Commencer par Sprint 1.1 dès demain ! 🚀
