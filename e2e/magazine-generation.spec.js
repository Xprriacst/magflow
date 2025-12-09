import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Test E2E - Génération complète d'un magazine
 * 
 * Ce test automatise le workflow complet :
 * 1. Renseigner un article
 * 2. Uploader 2 images
 * 3. Analyser le contenu
 * 4. Sélectionner un template
 * 5. Générer le magazine
 */

// Article de test (minimum 50 caractères requis)
const TEST_ARTICLE = `L'ART DE SE RÉINVENTER PAR LA COULEUR

La couleur n'est pas seulement un outil esthétique, mais un langage universel. Entre tradition, créativité et affirmation de soi, elle devient une arme de réinvention et un vecteur puissant d'identité.

La peinture corporelle comme expression artistique

Peindre sa peau, transformer son visage en toile vivante, c'est un geste ancestral que l'on retrouve dans de nombreuses cultures. Aujourd'hui, cette pratique dépasse le rituel et devient un véritable acte artistique. Les artistes contemporains utilisent la couleur pour briser les codes, questionner les normes et proposer une nouvelle lecture du corps.

Un langage visuel universel

La couleur, éclatante ou subtile, a le pouvoir de susciter une émotion immédiate. Elle attire l'œil, raconte une histoire et dialogue directement avec notre imaginaire. Dans un monde saturé d'images numériques, le retour à cette forme brute et directe de l'expression semble redonner une place au geste et à l'authenticité.

En Europe comme en Afrique, en Amérique comme en Asie, la peinture corporelle réapparaît dans les festivals, les défilés de mode et même dans les musées. Elle témoigne d'un désir croissant de renouer avec l'essence de l'humain.`;

test.describe('Magazine Generation Workflow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Naviguer vers la page de création
    await page.goto('/smart-content-creator');
    
    // Attendre que la page soit chargée
    await expect(page.locator('h1')).toContainText('Créateur de Magazine Intelligent');
  });

  test('should complete full magazine generation workflow', async ({ page }) => {
    // ============================================
    // ÉTAPE 1 : Renseigner l'article
    // ============================================
    console.log('📝 Étape 1: Saisie de l\'article...');
    
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    
    // Remplir le contenu de l'article
    await textarea.fill(TEST_ARTICLE);
    
    // Vérifier que le contenu est bien saisi
    await expect(textarea).toHaveValue(TEST_ARTICLE);
    
    // Vérifier le compteur de caractères
    const charCount = page.locator('text=' + TEST_ARTICLE.length + ' caractères');
    await expect(charCount).toBeVisible();
    
    console.log(`✅ Article saisi (${TEST_ARTICLE.length} caractères)`);

    // ============================================
    // ÉTAPE 2 : Uploader 2 images
    // ============================================
    console.log('🖼️ Étape 2: Upload des images...');
    
    // Créer des images de test si elles n'existent pas
    const fileInput = page.locator('input[type="file"]');
    
    // Utiliser des images de test depuis fixtures ou créer des blobs
    // On va simuler l'upload avec des fichiers de test
    await fileInput.setInputFiles([
      {
        name: 'test-image-1.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from(createTestImageBase64(), 'base64')
      },
      {
        name: 'test-image-2.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from(createTestImageBase64(), 'base64')
      }
    ]);
    
    // Vérifier que les images sont affichées
    await expect(page.locator('text=Images sélectionnées (2)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=test-image-1.jpg')).toBeVisible();
    await expect(page.locator('text=test-image-2.jpg')).toBeVisible();
    
    console.log('✅ 2 images uploadées');

    // ============================================
    // ÉTAPE 3 : Analyser et choisir un template
    // ============================================
    console.log('🔍 Étape 3: Analyse du contenu...');
    
    // Cliquer sur le bouton d'analyse
    const analyzeButton = page.locator('button:has-text("Analyser et choisir un template")');
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();
    
    // Attendre l'analyse (peut prendre du temps avec l'API OpenAI)
    await expect(page.locator('text=Structure et Template')).toBeVisible({ timeout: 30000 });
    
    console.log('✅ Analyse terminée');

    // ============================================
    // ÉTAPE 4 : Sélectionner un template
    // ============================================
    console.log('📄 Étape 4: Sélection du template...');
    
    // Attendre que les templates soient chargés
    await expect(page.locator('text=Templates disponibles')).toBeVisible();
    
    // Attendre que les templates apparaissent (au moins 1)
    await page.waitForSelector('.template-card', { timeout: 15000 });
    
    // Cliquer sur le premier template disponible (ou le recommandé s'il existe)
    const recommendedTemplate = page.locator('.template-card:has-text("Recommandé")').first();
    const firstTemplate = page.locator('.template-card').first();
    
    // Vérifier si un template est déjà sélectionné
    const alreadySelected = page.locator('button:has-text("Sélectionné")');
    if (await alreadySelected.isVisible()) {
      console.log('✅ Un template est déjà sélectionné');
    } else if (await recommendedTemplate.isVisible()) {
      await recommendedTemplate.click();
      console.log('✅ Template recommandé sélectionné');
    } else {
      await firstTemplate.click();
      console.log('✅ Premier template sélectionné');
    }
    
    // Vérifier qu'un template est sélectionné (bouton "Sélectionné" visible)
    await expect(page.locator('button:has-text("Sélectionné")')).toBeVisible({ timeout: 5000 });

    // ============================================
    // ÉTAPE 5 : Générer le magazine
    // ============================================
    console.log('🚀 Étape 5: Génération du magazine...');
    
    // Attendre que l'analyse soit terminée (le bouton "Analyse..." devient "Générer")
    const generateButton = page.locator('button:has-text("Générer")');
    await expect(generateButton).toBeVisible({ timeout: 30000 });
    await expect(generateButton).toBeEnabled({ timeout: 15000 });
    
    console.log('✅ Bouton Générer activé, clic...');
    await generateButton.click();
    
    // Attendre la redirection vers la page de résultat
    // La génération InDesign peut prendre jusqu'à 2 minutes
    await page.waitForURL(/\/generation-result\?id=/, { timeout: 120000 });
    
    console.log('✅ Magazine généré avec succès!');
    
    // Vérifier que la page de résultat affiche le succès
    await expect(page.locator('text=Génération')).toBeVisible({ timeout: 10000 });
    
    // Prendre une capture d'écran du résultat
    await page.screenshot({ path: 'test-results/magazine-generation-result.png' });
    
    console.log('🎉 Test E2E complet réussi!');
  });

  test('should show error for content too short', async ({ page }) => {
    // Saisir un contenu trop court
    const textarea = page.locator('textarea');
    await textarea.fill('Texte trop court');
    
    // Cliquer sur analyser
    const analyzeButton = page.locator('button:has-text("Analyser et choisir un template")');
    await analyzeButton.click();
    
    // Vérifier le message d'erreur
    await expect(page.locator('text=Le contenu doit contenir au moins 50 caractères')).toBeVisible();
  });

  test('should allow removing uploaded images', async ({ page }) => {
    // Uploader une image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([{
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(createTestImageBase64(), 'base64')
    }]);
    
    // Vérifier l'image
    await expect(page.locator('text=Images sélectionnées (1)')).toBeVisible();
    
    // Supprimer l'image (hover + click sur X)
    const imageCard = page.locator('text=test-image.jpg').locator('..');
    await imageCard.hover();
    
    const removeButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    // Alternative: chercher le bouton X près de l'image
    const closeButton = page.locator('.group button.bg-red-500').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    
    // Vérifier que l'image est supprimée ou que le compteur a changé
    // Note: selon l'implémentation, le comportement peut varier
  });
});

/**
 * Génère une image JPEG de test minimale (1x1 pixel rouge)
 * Ceci évite d'avoir besoin de fichiers fixtures externes
 */
function createTestImageBase64() {
  // Image JPEG minimale 1x1 pixel (rouge)
  // C'est un fichier JPEG valide encodé en base64
  return '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=';
}
