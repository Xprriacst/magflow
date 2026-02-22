# 🧪 Guide de Test - Sprint 1.1

**Date:** 2025-10-15  
**Objectif:** Valider l'extraction pure sans reformulation

---

## 🚀 Lancer les Tests

### Tests Automatiques (Vitest)
```bash
cd backend

# Tests complets
npm test

# Mode watch (recommandé pendant dev)
npm test -- --watch

# Avec UI interactive
npm run test:ui

# Avec coverage
npm run test:coverage
```

---

## 📋 Tests à Effectuer Manuellement

### 1. Test Article de Blog Tech
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Les 5 tendances IA en 2025\n\nL'\''intelligence artificielle continue d'\''évoluer à un rythme effréné. Voici les principales tendances qui marqueront l'\''année 2025.\n\n1. L'\''IA générative\nLes modèles comme GPT-4 et Midjourney deviennent accessibles au grand public.\n\n2. L'\''automatisation\nLes entreprises adoptent massivement l'\''IA pour automatiser leurs processus."
  }' | jq
```

**✅ Vérifier:**
- Titre contient "Les 5 tendances IA en 2025" (exact)
- Sections contiennent "GPT-4 et Midjourney" (exact)
- Aucun mot remplacé par un synonyme

---

### 2. Test Article de Presse
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Élection présidentielle : Les enjeux économiques au cœur du débat\n\nLes candidats s'\''opposent sur la question du pouvoir d'\''achat. Les propositions divergent fortement sur la fiscalité et les aides sociales.\n\nLe contexte inflationniste complique les promesses de campagne."
  }' | jq
```

**✅ Vérifier:**
- Titre préserve les accents: "présidentielle", "cœur"
- Guillemets apostrophes préservés: "s'opposent", "d'achat"
- Ponctuation exacte

---

### 3. Test Contenu Court
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Titre court\n\nUn seul paragraphe très court pour tester."
  }' | jq
```

**✅ Vérifier:**
- Titre: "Titre court" (exact)
- Contenu: "Un seul paragraphe très court pour tester." (exact)
- Pas d'hallucination (pas de sections inventées)

---

### 4. Test Contenu Long (>1000 mots)
```bash
# Utiliser un vrai article de blog/magazine
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d @long-article.json | jq
```

**✅ Vérifier:**
- Temps de réponse < 10s
- Pas de timeout
- Structure correcte
- Texte préservé

---

### 5. Test Caractères Spéciaux
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "L'\''été & l'\''hiver : \"Une comparaison\"\n\nVoici un texte avec des caractères spéciaux : %, $, €, @, #. Il teste la préservation des guillemets \"doubles\" et '\''simples'\''."
  }' | jq
```

**✅ Vérifier:**
- Apostrophes: L'été, l'hiver
- Guillemets doubles: "Une comparaison", "doubles"
- Symboles: &, :, %, $, €, @, #

---

### 6. Test avec Listes
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Top 3 des frameworks JavaScript\n\n1. React - Créé par Facebook\n2. Vue.js - Léger et performant\n3. Angular - Solution complète de Google"
  }' | jq
```

**✅ Vérifier:**
- Numérotation préservée: 1., 2., 3.
- Tirets préservés: "React -", "Vue.js -"
- Noms exacts: "Facebook", "Vue.js", "Google"

---

### 7. Test avec Citations
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "L'\''IA selon les experts\n\nComme l'\''a dit Alan Turing : \"Une machine peut-elle penser ?\"\n\nCette question fondamentale reste d'\''actualité."
  }' | jq
```

**✅ Vérifier:**
- Citation exacte: "Une machine peut-elle penser ?"
- Attribution exacte: "Alan Turing"
- Guillemets français préservés

---

### 8. Test avec Emojis
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Les tendances tech 2025 🚀\n\nL'\''IA 🤖 et le cloud ☁️ dominent le marché. Les développeurs 👨‍💻 adoptent massivement ces technologies."
  }' | jq
```

**✅ Vérifier:**
- Emojis préservés: 🚀, 🤖, ☁️, 👨‍💻
- Texte autour des emojis intact

---

### 9. Test Contenu Marketing
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🎉 Offre spéciale -50% !\n\nProfitez de notre SUPER PROMO jusqu'\''à dimanche. Livraison gratuite pour toute commande > 50€.\n\nCode promo : MAGFLOW2025"
  }' | jq
```

**✅ Vérifier:**
- Majuscules: "SUPER PROMO"
- Symboles: -50%, €, >
- Code promo exact: "MAGFLOW2025"

---

### 10. Test Texte Littéraire
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Dans la brume du soir\n\nLa ville s'\''endormait doucement, bercée par le murmure des fontaines. Les réverbères projetaient des ombres dansantes sur les pavés humides.\n\nAu loin, une cloche sonnait minuit."
  }' | jq
```

**✅ Vérifier:**
- Style littéraire préservé
- Métaphores intactes: "bercée par le murmure"
- Descriptions exactes: "ombres dansantes"

---

## 📊 Grille de Validation

### Pour chaque test, noter:

| Critère | Score | Note |
|---------|-------|------|
| **Titre préservé** | 0-10 | ___ |
| **Contenu préservé** | 0-10 | ___ |
| **Ponctuation préservée** | 0-10 | ___ |
| **Caractères spéciaux** | 0-10 | ___ |
| **Structure identifiée** | 0-10 | ___ |
| **Métadonnées précises** | 0-10 | ___ |
| **Pas d'hallucination** | 0-10 | ___ |
| **Temps < 10s** | 0-10 | ___ |
| **TOTAL** | **/80** |  |

**Seuil de validation:** ≥ 70/80 (87.5%)

---

## 🐛 Checklist Debug

Si les tests échouent:

### 1. Vérifier l'API Key OpenAI
```bash
echo $OPENAI_API_KEY
# ou
cat backend/.env | grep OPENAI_API_KEY
```

### 2. Vérifier le modèle
```javascript
// Dans openaiService.js ligne 18
model: 'gpt-4o', // ✅ Correct
// PAS: 'gpt-4' ou 'gpt-3.5-turbo'
```

### 3. Vérifier le timeout
```javascript
// vitest.config.js
testTimeout: 20000, // 20s suffisant
```

### 4. Tester manuellement le service
```bash
node -e "
import { analyzeContentStructure } from './backend/services/openaiService.js';
const result = await analyzeContentStructure('Test\n\nContenu test');
console.log(result);
"
```

---

## 📈 Résultats Attendus

### Taux de Préservation
```
Avant Sprint 1.1: ~60%
Après Sprint 1.1: >95%
```

### Performance
```
Temps moyen: 3-8s
Max acceptable: 10s
```

### Erreurs
```
Taux d'erreur: <5%
Timeout: <1%
```

---

## 📝 Rapporter les Résultats

### Format de Rapport
```markdown
# Résultats Tests Sprint 1.1

**Date:** 2025-10-15
**Testeur:** [Nom]

## Tests Automatiques
- ✅ 28/28 tests passent

## Tests Manuels
1. Article Blog Tech: ✅ 78/80
2. Article Presse: ✅ 75/80
3. Contenu Court: ✅ 80/80
...

## Problèmes Identifiés
- Aucun

## Conclusion
✅ Sprint 1.1 validé - Ready pour Sprint 1.2
```

---

## 🎯 Critères Go/No-Go Sprint 1.2

### GO si:
- ✅ Tests automatiques passent à 100%
- ✅ 8/10 tests manuels ≥ 70/80
- ✅ Aucun bug critique
- ✅ Performance acceptable

### NO-GO si:
- ❌ <80% tests automatiques
- ❌ Bugs critiques non résolus
- ❌ Performance inacceptable (>15s)
- ❌ Reformulation détectée >20%

---

**Bon testing! 🧪**
