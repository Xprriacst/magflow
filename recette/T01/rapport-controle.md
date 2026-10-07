# T01 — Rapport de contrôle

Date : 7 octobre 2026  
Statut : **bloqué avant rendu InDesign**

## Périmètre attendu

- 2 pages.
- 1 titre.
- 1 article.
- 1 lettrine.
- 1 photo.
- Comparaison visuelle avec la référence T01.

## Résultat

Le document T01 et ses aperçus n'ont pas pu être produits dans cet environnement.
Le runner est Linux et ne fournit ni InDesign, ni `osascript`.
Le dépôt ne contient volontairement aucun gabarit client (`.indd`, `.indt`, `.idml`).
Il ne contient pas non plus la photo ni la référence visuelle propres à T01.

Il serait trompeur d'utiliser les miniatures historiques de `flask-api/thumbnails/` : elles ne sont pas identifiées comme sortie ou référence T01.

## Contrôles effectués

| Contrôle | Résultat | Preuve |
|---|---|---|
| API vers file/agent | Partiel | Le backend sélectionne un agent enregistré et émet `job:new`. |
| Agent vers ExtendScript | Partiel | L'agent reçoit `job:new`, prépare une configuration et lance InDesign par AppleScript sur macOS. |
| Syntaxe JavaScript ciblée | Conforme | `node --check` passe sur `backend/services/jobDispatcher.js`, `backend/routes/magazine.js`, `backend/server.js` et `magflow-agent/main.js`. |
| Test unitaire du dispatch | Non exécuté | `vitest` est absent, car les dépendances backend ne sont pas installées. |
| Rendu 2 pages | Non vérifiable | Aucun Mac InDesign ni gabarit T01 disponible. |
| Titre et article | Non vérifiable visuellement | Aucun rendu produit. |
| Lettrine | Non vérifiable | Aucun rendu produit et aucun contrôle explicite de la lettrine dans le moteur courant. |
| Photo | Non conforme au contrat v2 | Le moteur cible encore les rectangles par index, pas uniquement par étiquette de script. |
| Déterminisme et idempotence | Non conforme | Le projet reçoit un UUID et la configuration embarque l'heure courante. |
| Sortie et aperçu | Non conforme | Le JSX généré n'enregistre ni `.indd` ni PDF/PNG dans le chemin annoncé par l'agent. |
| Chemins absolus | À corriger | Le script historique `magflow-agent/scripts/generate.jsx` contient des chemins utilisateur absolus. |

## Anomalies bloquantes du moteur courant

1. L'ExtendScript généré ouvre le gabarit et remplace globalement des placeholders. Il ne garantit pas un document de 2 pages.
2. Les images sont placées dans `doc.rectangles[i]`. La règle produit impose une identification uniquement par `label`.
3. Le script ne sauvegarde pas le document et n'exporte aucun aperçu. L'agent renvoie pourtant un `outputPath` théorique.
4. Le résultat InDesign n'est pas contrôlé : pages, texte en excès, liens, polices, lettrine et image ne sont pas inspectés.
5. Le flux sans agent bascule vers Flask. Cela crée un second chemin de rendu, contraire au chemin d'exécution unique.

## Éléments requis pour reprendre la recette

Alexandre doit mettre à disposition sur la machine de rendu autorisée :

- le gabarit T01 à 2 pages, avec les blocs étiquetés ;
- la photo T01 ;
- la référence visuelle T01 ;
- InDesign et les polices client installées et licenciées ;
- la configuration de l'agent donnant les répertoires d'entrée et de sortie, sans chemin absolu dans le code.

Le moteur doit ensuite être corrigé pour cibler les labels, sauvegarder la sortie, exporter les aperçus et retourner un manifeste de contrôle. La recette pourra alors comparer page par page le rendu à la référence.

## Verdict

**T01 non accepté.** Aucun aperçu T01 authentique ne peut être livré avec les actifs et l'environnement actuellement disponibles.
