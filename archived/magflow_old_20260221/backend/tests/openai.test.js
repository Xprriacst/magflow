import { describe, it, expect, beforeAll } from 'vitest';
import { analyzeContentStructure } from '../services/openaiService.js';

describe('OpenAI Service - Extraction Pure (Sprint 1.1)', () => {
  
  // Test 1: Préservation du texte original
  describe('Préservation du texte original', () => {
    it('ne doit PAS reformuler le titre original', async () => {
      const content = `L'intelligence artificielle révolutionne le monde

L'IA transforme profondément notre société. Cette technologie permet d'automatiser des tâches complexes et d'améliorer notre quotidien de manière significative.`;

      const result = await analyzeContentStructure(content);
      
      // Le titre doit être EXACTEMENT celui du texte original
      expect(result.titre_principal).toContain("L'intelligence artificielle");
      expect(result.titre_principal).toContain("révolutionne");
    }, 15000);

    it('ne doit PAS reformuler le contenu des sections', async () => {
      const content = `Test de préservation

Le texte original est sacré. Il ne faut jamais le modifier, le paraphraser ou le réécrire. Chaque mot compte et doit être préservé tel quel.`;

      const result = await analyzeContentStructure(content);
      
      // Le contenu doit contenir les mots exacts
      const allContent = result.sections.map(s => s.contenu).join(' ');
      expect(allContent).toContain('texte original est sacré');
      expect(allContent).toContain('Il ne faut jamais le modifier');
    }, 15000);

    it('doit préserver la ponctuation et la casse', async () => {
      const content = `TITRE EN MAJUSCULES!

Voici un texte avec ponctuation : virgules, points-virgules; et tirets - ainsi que des accents: é, è, à, ù.`;

      const result = await analyzeContentStructure(content);
      
      expect(result.titre_principal).toContain('MAJUSCULES');
      const allContent = result.sections.map(s => s.contenu).join(' ');
      expect(allContent).toMatch(/virgules|points-virgules|tirets/);
    }, 15000);
  });

  // Test 2: Structure correctement identifiée
  describe('Identification de structure', () => {
    it('doit identifier les sections sans reformuler', async () => {
      const content = `L'avenir de l'IA

L'intelligence artificielle est en pleine expansion. Elle transforme tous les secteurs.

Section 1: Les applications
Les applications de l'IA sont nombreuses. Santé, transport, éducation.

Section 2: Les défis
Plusieurs défis restent à relever. Éthique, régulation, formation.`;

      const result = await analyzeContentStructure(content);
      
      expect(result.sections).toBeDefined();
      expect(result.sections.length).toBeGreaterThan(0);
      
      // Vérifier que les sections contiennent le texte original
      const section1 = result.sections.find(s => s.contenu.includes('applications'));
      expect(section1).toBeDefined();
      expect(section1.contenu).toContain('Santé, transport, éducation');
    }, 15000);

    it('doit identifier le type de section correctement', async () => {
      const content = `Introduction

Ceci est une introduction courte.

Corps principal

Ceci est le développement du sujet avec plus de détails.

Conclusion

Ceci est la conclusion de l'article.`;

      const result = await analyzeContentStructure(content);
      
      const types = result.sections.map(s => s.type);
      expect(types).toContain('introduction');
      expect(types).toContain('corps');
      expect(types).toContain('conclusion');
    }, 15000);
  });

  // Test 3: Métadonnées précises
  describe('Métadonnées de structure', () => {
    it('doit calculer les métadonnées correctement', async () => {
      const content = `Titre de test

Introduction avec quelques mots pour tester.

Section 1
Contenu de la première section avec du texte.

Section 2
Contenu de la deuxième section avec encore du texte.`;

      const result = await analyzeContentStructure(content);
      
      expect(result.structure_detectee).toBeDefined();
      expect(result.structure_detectee.nombre_sections).toBeGreaterThan(0);
      expect(result.structure_detectee.nombre_mots).toBeGreaterThan(10);
      expect(result.longueur_estimee).toBeGreaterThan(0);
      expect(result.temps_lecture).toBeGreaterThan(0);
    }, 15000);
  });

  // Test 4: Cas edge
  describe('Cas particuliers', () => {
    it('doit gérer un texte court', async () => {
      const content = `Titre court

Un seul paragraphe très court.`;

      const result = await analyzeContentStructure(content);
      
      expect(result.titre_principal).toBeDefined();
      expect(result.chapo).toBeDefined();
      expect(result.sections).toBeDefined();
    }, 15000);

    it('doit gérer un texte sans titre explicite', async () => {
      const content = `Voici un texte qui commence directement sans titre formel. Il continue avec plusieurs phrases pour former un paragraphe complet.`;

      const result = await analyzeContentStructure(content);
      
      // Doit extraire les premiers mots comme titre
      expect(result.titre_principal).toContain('Voici un texte');
    }, 15000);

    it('doit gérer des caractères spéciaux', async () => {
      const content = `L'été & l'hiver : "Une comparaison"

Voici un texte avec des caractères spéciaux : %, $, €, @, #. Il teste la préservation des guillemets "doubles" et 'simples'.`;

      const result = await analyzeContentStructure(content);
      
      expect(result.titre_principal).toMatch(/été|hiver/);
      const allContent = result.sections.map(s => s.contenu).join(' ');
      expect(allContent).toMatch(/[%$€@#]/);
    }, 15000);
  });

  // Test 5: Articles réels
  describe('Articles réalistes', () => {
    it('doit analyser un article de blog tech', async () => {
      const content = `Les 5 tendances IA en 2025

L'intelligence artificielle continue d'évoluer à un rythme effréné. Voici les principales tendances qui marqueront l'année 2025.

1. L'IA générative
Les modèles comme GPT-4 et Midjourney deviennent accessibles au grand public.

2. L'automatisation
Les entreprises adoptent massivement l'IA pour automatiser leurs processus.

3. L'éthique
Les questions éthiques deviennent centrales dans le développement de l'IA.`;

      const result = await analyzeContentStructure(content);
      
      expect(result.titre_principal).toContain('tendances');
      expect(result.sections.length).toBeGreaterThan(2);
      expect(result.mots_cles).toBeDefined();
      expect(result.categorie_suggeree).toBeDefined();
    }, 15000);
  });

  // Test 6: Validation du non-hallucination
  describe('Prévention des hallucinations', () => {
    it('ne doit PAS ajouter de contenu qui n\'existe pas', async () => {
      const content = `Titre simple

Un court paragraphe.`;

      const result = await analyzeContentStructure(content);
      
      // Vérifier que le nombre de sections est cohérent (pas 10 sections pour 2 lignes)
      expect(result.sections.length).toBeLessThan(5);
      
      // Vérifier que le nombre de mots est réaliste
      const wordCount = content.split(/\s+/).length;
      expect(result.structure_detectee.nombre_mots).toBeLessThanOrEqual(wordCount + 5); // Marge d'erreur
    }, 15000);
  });
});
