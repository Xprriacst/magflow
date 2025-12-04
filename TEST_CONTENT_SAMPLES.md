# 🧪 Exemples de Contenu pour Tests

**Date:** 2025-10-15  
**Objectif:** Tester l'extraction pure (Sprint 1.1)

---

## 📋 Test 1 - Article Tech Simple

### Contenu à coller:
```
L'intelligence artificielle révolutionne le monde

L'IA transforme profondément notre société. Cette technologie permet d'automatiser des tâches complexes et d'améliorer notre quotidien de manière significative.

Les applications concrètes

Dans le domaine médical, l'IA aide au diagnostic précoce des maladies. Les algorithmes analysent des millions de données pour détecter des anomalies invisibles à l'œil humain.

Le secteur des transports bénéficie aussi de ces avancées. Les véhicules autonomes promettent de réduire les accidents et d'optimiser le trafic urbain.

Les défis à relever

Malgré ces progrès, plusieurs défis persistent. La question de l'éthique et de la protection des données reste centrale. Il faut aussi former les travailleurs aux nouveaux métiers de l'IA.
```

### ✅ Résultat Attendu:
- **Titre:** "L'intelligence artificielle révolutionne le monde" (EXACT)
- **Sections:** 3 sections détectées
- **Texte préservé:** "L'IA transforme profondément notre société" (mot à mot)
- **Aucune reformulation**

---

## 📋 Test 2 - Article Court

### Contenu à coller:
```
Les 3 tendances tech de 2025

Cette année marque un tournant décisif pour la technologie.

1. L'IA générative devient accessible à tous
2. Le cloud computing se démocratise
3. La cybersécurité devient prioritaire

Ces tendances transformeront le paysage digital.
```

### ✅ Résultat Attendu:
- **Titre:** "Les 3 tendances tech de 2025" (EXACT avec le chiffre)
- **Numérotation préservée:** 1., 2., 3.
- **Pas d'ajout de contenu**

---

## 📋 Test 3 - Avec Caractères Spéciaux

### Contenu à coller:
```
L'été & l'hiver : "Une comparaison"

Le contraste entre été et hiver est saisissant. L'un nous offre 30°C de chaleur, l'autre -5°C de froid glacial.

Les saisons en chiffres:
- Été: +25°C en moyenne
- Hiver: -2°C en moyenne

Budget annuel: ~1500€ pour le chauffage !

Contact: info@exemple.fr | Tél: +33 6 12 34 56 78
```

### ✅ Résultat Attendu:
- **Apostrophes:** L'été, l'hiver (préservés)
- **Guillemets:** "Une comparaison" (préservés)
- **Symboles:** &, :, °C, ~, €, @, +, -, | (tous préservés)
- **Format:** Tirets de liste préservés

---

## 📋 Test 4 - Style Littéraire

### Contenu à coller:
```
Dans la brume du soir

La ville s'endormait doucement, bercée par le murmure des fontaines. Les réverbères projetaient des ombres dansantes sur les pavés humides, créant une atmosphère féerique.

Au loin, une cloche sonnait minuit. C'était l'heure où les rêveurs parcouraient les ruelles désertes, cherchant l'inspiration dans chaque recoin obscur.

Le silence n'était troublé que par le vent qui chuchotait des secrets aux vieilles pierres.
```

### ✅ Résultat Attendu:
- **Style poétique préservé:** "bercée par le murmure", "ombres dansantes"
- **Métaphores intactes:** "vent qui chuchotait des secrets"
- **Ton littéraire maintenu:** Aucune simplification

---

## 📋 Test 5 - Article Marketing

### Contenu à coller:
```
🎉 Offre Spéciale -50% !

Profitez MAINTENANT de notre SUPER PROMO jusqu'à dimanche ! Ne ratez pas cette occasion EXCEPTIONNELLE.

✓ Livraison gratuite pour toute commande > 50€
✓ Garantie satisfait ou remboursé 30 jours
✓ Code promo: MAGFLOW2025

⚡ ATTENTION: Stock limité !

Commandez dès aujourd'hui sur www.exemple.com 🚀
```

### ✅ Résultat Attendu:
- **Emojis préservés:** 🎉, ✓, ⚡, 🚀
- **MAJUSCULES préservées:** MAINTENANT, SUPER PROMO, ATTENTION
- **Ponctuation:** -50%, > 50€
- **Codes:** MAGFLOW2025 (exact)

---

## 📋 Test 6 - Avec Citations

### Contenu à coller:
```
L'innovation selon les grands penseurs

Steve Jobs disait : "L'innovation distingue un leader d'un suiveur."

Cette phrase résume parfaitement sa philosophie. Apple a toujours été à la pointe de l'innovation.

Albert Einstein affirmait de son côté : "La créativité, c'est l'intelligence qui s'amuse."

Ces citations nous rappellent l'importance de l'audace et de la créativité dans le monde des affaires.
```

### ✅ Résultat Attendu:
- **Citations exactes:** "L'innovation distingue...", "La créativité, c'est..."
- **Attributions correctes:** Steve Jobs, Albert Einstein
- **Guillemets préservés**

---

## 🎯 Comment Tester

### Dans l'interface frontend:

1. **Aller sur Smart Content Creator**
2. **Coller un des exemples ci-dessus**
3. **Cliquer "Analyser"**
4. **Vérifier:**
   - ✅ Le titre est EXACT (pas reformulé)
   - ✅ Les sections contiennent le texte ORIGINAL
   - ✅ Les caractères spéciaux sont préservés
   - ✅ Le style est intact
   - ✅ Pas de synonymes (ex: "voiture" → reste "voiture", pas "automobile")

---

## ⚠️ Signes de Reformulation (À ÉVITER)

### ❌ AVANT Sprint 1.1 (Mauvais):
```
Input: "L'IA révolutionne le monde"
Output: "L'intelligence artificielle transforme notre planète"
→ REFORMULÉ (mauvais)
```

### ✅ APRÈS Sprint 1.1 (Bon):
```
Input: "L'IA révolutionne le monde"
Output: "L'IA révolutionne le monde"
→ EXACT (bon)
```

---

## 📊 Grille d'Évaluation

Pour chaque test, noter sur 10:

| Critère | Note /10 |
|---------|----------|
| Titre préservé exactement | ___ |
| Contenu sections exact | ___ |
| Caractères spéciaux OK | ___ |
| Style/Ton préservé | ___ |
| Pas d'hallucination | ___ |
| Structure correcte | ___ |
| Métadonnées précises | ___ |
| Temps < 10s | ___ |

**Score minimum acceptable:** 60/80 (75%)

---

## 🐛 Si Problème Détecté

### Reformulation détectée:
```bash
# Vérifier les logs backend
tail -f backend.log
```

### Erreur OpenAI:
```bash
# Vérifier la clé API
echo $OPENAI_API_KEY
cat backend/.env | grep OPENAI_API_KEY
```

### Timeout:
```bash
# Réduire la taille du contenu
# ou augmenter timeout dans vitest.config.js
```

---

## 📝 Rapport de Test

Après les tests, remplir:

```markdown
# Rapport Test Sprint 1.1

**Date:** 2025-10-15
**Testeur:** [Nom]

## Résultats

Test 1 (Tech Simple): ✅ _/80
Test 2 (Court): ✅ _/80
Test 3 (Caractères): ✅ _/80
Test 4 (Littéraire): ✅ _/80
Test 5 (Marketing): ✅ _/80
Test 6 (Citations): ✅ _/80

**Score moyen:** _/80

## Problèmes identifiés:
- [Liste]

## Conclusion:
□ Sprint 1.1 validé
□ Sprint 1.1 à corriger
```

---

**Bon test ! 🧪**
