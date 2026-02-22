# 👥 Instructions Dev 2 - Sprint 1.2

**Date:** 2025-10-15  
**Sprint:** 1.2 - Fix Remplissage InDesign  
**Durée:** 2 jours (Mer-Ven)  
**Branche:** `feature/sprint-1.2-frontend-integration`

---

## 🎯 Ton Objectif

**Modifier le frontend pour:**
1. Envoyer le bon `template_id` au backend
2. Envoyer les vraies données analysées (pas des placeholders)
3. Afficher le feedback de progression
4. Tests E2E de génération complète

---

## 📁 Fichiers à Modifier

### 1. **`src/pages/smart-content-creator/index.jsx`**

#### Changement 1: Envoyer template_id sélectionné

**Localiser la fonction `handleGenerate`** (rechercher "handleGenerate" dans le fichier)

**AVANT (problème):**
```javascript
const handleGenerate = async () => {
  // Appel sans template_id
  const response = await fetch('http://localhost:5003/api/create-layout', {
    method: 'POST',
    body: formData
  });
};
```

**APRÈS (solution):**
```javascript
const handleGenerate = async () => {
  if (!selectedTemplate) {
    toast.error('Veuillez sélectionner un template');
    return;
  }
  
  if (!analyzedContent) {
    toast.error('Veuillez d\'abord analyser le contenu');
    return;
  }
  
  setIsGenerating(true);
  
  try {
    // Créer FormData avec les vraies données
    const formData = new FormData();
    
    // 🔴 IMPORTANT: Envoyer le template_id sélectionné
    formData.append('template_id', selectedTemplate.id);
    
    // 🔴 IMPORTANT: Envoyer les vraies données (pas des placeholders)
    formData.append('titre', analyzedContent.titre_principal);
    formData.append('chapo', analyzedContent.chapo);
    formData.append('text_content', JSON.stringify(analyzedContent.sections));
    
    // Images
    if (uploadedImages && uploadedImages.length > 0) {
      uploadedImages.forEach(img => {
        formData.append('images', img);
      });
    }
    
    // Appel au backend Flask
    const response = await fetch('http://localhost:5003/api/create-layout', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      toast.success('Magazine généré avec succès !');
      // Rediriger vers page de résultat
      navigate(`/generation-result/${result.project_id}`);
    } else {
      toast.error(result.error || 'Erreur lors de la génération');
    }
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur lors de la génération du magazine');
  } finally {
    setIsGenerating(false);
  }
};
```

#### Changement 2: Ajouter feedback de progression

**Ajouter ce code dans le return JSX:**
```jsx
{/* Feedback génération en cours */}
{isGenerating && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        <h3 className="text-xl font-bold">Génération en cours...</h3>
        <p className="text-gray-600 text-center">
          Création de votre magazine avec InDesign
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
        </div>
      </div>
    </div>
  </div>
)}
```

#### Changement 3: Afficher le template sélectionné

**Ajouter avant le bouton "Générer":**
```jsx
{selectedTemplate && (
  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
    <div className="flex items-center gap-2">
      <CheckCircle className="text-green-600" size={20} />
      <div>
        <p className="font-medium text-green-900">Template sélectionné</p>
        <p className="text-sm text-green-700">{selectedTemplate.name}</p>
      </div>
    </div>
  </div>
)}
```

---

### 2. **Créer `src/pages/generation-result/index.jsx`** (NOUVEAU)

```jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, CheckCircle, FileText, ArrowLeft } from 'lucide-react';

export default function GenerationResult() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`http://localhost:5003/api/download/${projectId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `magazine-${projectId}.indd`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <CheckCircle className="text-green-600" size={48} />
            </div>
            
            <h1 className="text-3xl font-bold mb-2">
              Magazine généré avec succès !
            </h1>
            
            <p className="text-gray-600 mb-6">
              Votre fichier InDesign est prêt à être téléchargé
            </p>
            
            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download size={20} />
              {isDownloading ? 'Téléchargement...' : 'Télécharger le fichier .indd'}
            </button>
          </div>
        </div>
        
        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <FileText className="text-blue-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">
                Prochaines étapes
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Téléchargez le fichier .indd</li>
                <li>Ouvrez-le avec Adobe InDesign</li>
                <li>Vérifiez et ajustez la mise en page si nécessaire</li>
                <li>Exportez en PDF pour l'impression</li>
              </ol>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/smart-content-creator')}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
            Créer un nouveau magazine
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. **Ajouter la route dans `src/App.jsx`**

**Localiser les routes et ajouter:**
```jsx
import GenerationResult from './pages/generation-result';

// Dans le <Routes>
<Route path="/generation-result/:projectId" element={<GenerationResult />} />
```

---

## 🧪 Tests E2E à Créer

### Créer `e2e/frontend-integration.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Sprint 1.2 - Frontend Integration', () => {
  
  test('doit envoyer le template_id au backend', async ({ page }) => {
    await page.goto('http://localhost:5173/smart-content-creator');
    
    // Coller du contenu
    await page.fill('textarea[placeholder*="contenu"]', 'Test\n\nContenu test');
    
    // Analyser
    await page.click('button:has-text("Analyser")');
    await page.waitForTimeout(5000); // Attendre analyse IA
    
    // Sélectionner un template
    await page.click('[data-testid="template-card"]:first-child');
    
    // Intercepter la requête
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/api/create-layout') && 
      req.method() === 'POST'
    );
    
    // Générer
    await page.click('button:has-text("Générer")');
    
    const request = await requestPromise;
    const formData = request.postDataJSON();
    
    // Vérifier que template_id est envoyé
    expect(formData.template_id).toBeDefined();
  });
  
  test('doit envoyer les vraies données analysées', async ({ page }) => {
    await page.goto('http://localhost:5173/smart-content-creator');
    
    const testContent = 'Mon titre\n\nMon contenu principal.';
    await page.fill('textarea', testContent);
    await page.click('button:has-text("Analyser")');
    await page.waitForTimeout(5000);
    
    await page.click('[data-testid="template-card"]:first-child');
    
    const requestPromise = page.waitForRequest(req => 
      req.url().includes('/api/create-layout')
    );
    
    await page.click('button:has-text("Générer")');
    const request = await requestPromise;
    const formData = request.postDataJSON();
    
    // Vérifier les données
    expect(formData.titre).toContain('Mon titre');
    expect(formData.text_content).toBeDefined();
  });
  
  test('doit afficher le feedback de progression', async ({ page }) => {
    await page.goto('http://localhost:5173/smart-content-creator');
    
    await page.fill('textarea', 'Test\n\nContenu');
    await page.click('button:has-text("Analyser")');
    await page.waitForTimeout(5000);
    
    await page.click('[data-testid="template-card"]:first-child');
    await page.click('button:has-text("Générer")');
    
    // Vérifier modal de progression
    await expect(page.locator('text=Génération en cours')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });
  
  test('doit rediriger vers page résultat après génération', async ({ page }) => {
    await page.goto('http://localhost:5173/smart-content-creator');
    
    await page.fill('textarea', 'Test\n\nContenu');
    await page.click('button:has-text("Analyser")');
    await page.waitForTimeout(5000);
    
    await page.click('[data-testid="template-card"]:first-child');
    await page.click('button:has-text("Générer")');
    
    // Attendre redirection (max 60s pour génération InDesign)
    await page.waitForURL(/\/generation-result\//, { timeout: 60000 });
    
    // Vérifier page résultat
    await expect(page.locator('text=Magazine généré avec succès')).toBeVisible();
    await expect(page.locator('button:has-text("Télécharger")')).toBeVisible();
  });
});
```

---

## 🔧 Configuration

### Variables d'environnement à vérifier

**`.env` (à la racine):**
```bash
VITE_BACKEND_URL=http://localhost:3001
VITE_FLASK_URL=http://localhost:5003
```

---

## ✅ Checklist de Validation

### Avant de commencer
- [ ] Lire ce document complet
- [ ] Créer branche `feature/sprint-1.2-frontend-integration`
- [ ] S'assurer que backend + Flask sont lancés

### Pendant le dev
- [ ] Modifier `smart-content-creator/index.jsx`
- [ ] Créer `generation-result/index.jsx`
- [ ] Ajouter route dans `App.jsx`
- [ ] Créer tests E2E

### Tests manuels
- [ ] Analyser un article
- [ ] Sélectionner un template
- [ ] Cliquer "Générer"
- [ ] Vérifier feedback progression
- [ ] Vérifier redirection
- [ ] Télécharger fichier .indd

### Tests automatiques
- [ ] `npm run test:e2e` passe
- [ ] 4/4 tests passent

---

## 🐛 Debugging

### Si "template_id undefined"
```javascript
// Vérifier dans la console
console.log('Selected template:', selectedTemplate);
console.log('Template ID:', selectedTemplate?.id);
```

### Si génération échoue
```javascript
// Vérifier les logs Flask
tail -f flask.log

// Vérifier les données envoyées
console.log('FormData sent:', {
  template_id: formData.get('template_id'),
  titre: formData.get('titre')
});
```

### Si tests E2E échouent
```bash
# Lancer avec UI pour débugger
npm run test:e2e:ui

# Vérifier que tous les services sont up
curl http://localhost:3001/health
curl http://localhost:5003/api/status
curl http://localhost:5173
```

---

## 📞 Communication

### Daily Standup
**Partager chaque jour à 9h:**
- Ce que tu as fait hier
- Ce que tu vas faire aujourd'hui
- Tes blocages éventuels

### Questions/Blocages
Si tu es bloqué >1h:
1. Documenter le problème
2. Chercher dans les logs
3. Me contacter pour quick sync

---

## 🎯 Critères de Succès

Sprint 1.2 validé si:
- ✅ Template_id correctement envoyé
- ✅ Vraies données envoyées (pas placeholders)
- ✅ Feedback progression fonctionne
- ✅ Page résultat affichée
- ✅ Téléchargement .indd fonctionne
- ✅ Tests E2E passent (4/4)

---

## 📚 Ressources

**Documentation:**
- [PLAN_2_DEVS.md](../PLAN_2_DEVS.md) - Plan complet
- [ROADMAP_V1_STRATEGIE.md](../ROADMAP_V1_STRATEGIE.md) - Détails Sprint 1.2

**Code à consulter:**
- `backend/routes/magazine.js` - Endpoint génération
- `Indesign automation v1/app.py` - Flask API

---

## ⏱️ Timeline

**Jour 1 (Mer):**
- Modifier smart-content-creator (4h)
- Créer generation-result (2h)
- Tests manuels (1h)

**Jour 2 (Jeu):**
- Tests E2E (3h)
- Corrections bugs (2h)
- Validation finale (1h)

**Vendredi 17h:** Review commune Sprint 1.2

---

## 🚀 Let's Go!

**Prochaine action:**
```bash
git checkout -b feature/sprint-1.2-frontend-integration
code src/pages/smart-content-creator/index.jsx
```

**Bon dev ! 💪**
