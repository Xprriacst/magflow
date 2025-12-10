import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Analyse la structure éditoriale d'un contenu avec Claude Sonnet 4
 * EXTRACTION PURE - Ne reformule JAMAIS le contenu original
 * @param {string} content - Le contenu textuel à analyser
 * @returns {Promise<Object>} Structure éditoriale analysée
 */
export async function analyzeContentStructure(content) {
  try {
    console.log('[Claude] 🤖 Analyzing content structure with Claude Sonnet 4...');

    const prompt = `Tu es un analyseur de structure éditoriale. 
Ton rôle est d'IDENTIFIER et EXTRAIRE les différentes parties d'un article, SANS RIEN REFORMULER.

RÈGLES STRICTES - IMPÉRATIF :
1. NE PAS reformuler, paraphraser ou modifier le texte original
2. EXTRAIRE tel quel les titres, sous-titres, paragraphes existants
3. IDENTIFIER la structure (introduction, corps, conclusion) en préservant le texte exact
4. PRÉSERVER le style, le ton et les mots exacts de l'auteur
5. Si un titre n'existe pas, extraire les premiers mots significatifs TELS QUELS
6. Copier-coller le texte original sans aucune modification

Ta mission : ANALYSER la structure, PAS créer du contenu.

EXTRAIT tel quel la structure de ce contenu (NE RIEN REFORMULER) :

${content}

RETOURNE UN OBJET JSON avec exactement cette structure:
{
  "titre_principal": "EXTRAIRE tel quel le titre existant dans le texte",
  "chapo": "EXTRAIRE tel quel le premier paragraphe ou introduction",
  "sous_titres": ["EXTRAIRE tels quels les sous-titres présents dans le texte"],
  "sections": [
    {
      "titre": "EXTRAIRE tel quel le titre de section",
      "contenu": "EXTRAIRE tel quel le contenu sans modification",
      "type": "introduction | corps | conclusion | citation | encadre"
    }
  ],
  "mots_cles": ["Mots-clés principaux identifiés"],
  "categorie_suggeree": "Catégorie éditoriale suggérée",
  "structure_detectee": {
    "nombre_sections": 0,
    "nombre_mots": 0,
    "images_mentionnees": 0
  },
  "longueur_estimee": 0,
  "temps_lecture": 0,
  "niveau_complexite": "simple | moyen | complexe"
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

    const response = await anthropic.messages.create({
      model: 'claude-4-5-sonnet-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parser la réponse de Claude
    const responseContent = response.content[0].text;

    // Extraire le JSON de la réponse
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const structure = JSON.parse(jsonMatch[0]);
    console.log('[Claude] ✅ Content structure analyzed:', structure.titre_principal);

    return structure;
  } catch (error) {
    console.error('[Claude] ❌ Error analyzing content structure:', error);
    throw new Error(`Claude API Error: ${error.message}`);
  }
}

/**
 * Recommande des templates basés sur la structure de contenu et les images
 * @param {Object} contentStructure - Structure éditoriale analysée
 * @param {number} imageCount - Nombre d'images
 * @param {Array} availableTemplates - Templates disponibles
 * @returns {Promise<Array>} Templates recommandés avec score
 */
export async function recommendTemplates(contentStructure, imageCount, availableTemplates) {
  try {
    // Scoring basique
    const scored = availableTemplates.map(template => {
      let score = 0;
      
      // Matching nombre d'images
      if (template.image_slots === imageCount) {
        score += 30;
      } else if (Math.abs(template.image_slots - imageCount) <= 2) {
        score += 15;
      }
      
      // Matching catégorie
      if (template.recommended_for?.includes(contentStructure.categorie_suggeree)) {
        score += 25;
      }
      
      // Matching complexité
      if (template.style === contentStructure.niveau_complexite) {
        score += 20;
      }
      
      // Longueur du contenu
      if (contentStructure.longueur_estimee < 1000 && template.name.includes('simple')) {
        score += 15;
      } else if (contentStructure.longueur_estimee > 2000 && template.name.includes('complet')) {
        score += 15;
      }
      
      return { ...template, score };
    });
    
    // Trier par score décroissant
    const topTemplates = scored.sort((a, b) => b.score - a.score).slice(0, 3);
    
    // Optionnel : Affiner avec OpenAI si nécessaire
    // Pour l'instant, on retourne les 3 meilleurs
    
    return topTemplates;
  } catch (error) {
    console.error('Error recommending templates:', error);
    throw new Error(`Template Recommendation Error: ${error.message}`);
  }
}

/**
 * Enrichit les métadonnées d'un template avec l'IA (Claude Sonnet 4.5)
 * @param {Object} templateData - Données extraites du template
 * @returns {Promise<Object>} Métadonnées enrichies
 */
export async function enrichTemplateMetadata(templateData) {
  try {
    console.log('[Claude] 🤖 Analyzing template with Claude Sonnet 4.5...');

    const prompt = `Analyse ce template InDesign et suggère des métadonnées appropriées.

DONNÉES DU TEMPLATE:
- Fichier: ${templateData.filename}
- Emplacements images: ${templateData.imageSlots}
- Pages: ${templateData.pageCount}
- Placeholders texte: ${JSON.stringify(templateData.textPlaceholders)}
- Polices: ${JSON.stringify(templateData.fonts?.slice(0, 5))}

CRITÈRES D'ANALYSE:
- Nombre d'images (peu = simple, beaucoup = complexe)
- Structure éditoriale (placeholders de texte)
- Polices (serif = classique/élégant, sans-serif = moderne/minimaliste)
- Nombre de pages (1-2 = simple, 3+ = complexe)

RETOURNE UN OBJET JSON avec exactement cette structure:
{
  "category": "une catégorie principale parmi: Art & Culture, Tech, Business, Lifestyle, Mode, Sport, Science",
  "style": "simple | moyen | complexe",
  "recommended_for": ["2-4 catégories pour lesquelles ce template est adapté"],
  "description": "Description courte et attractive du template (max 100 caractères)"
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

    const response = await anthropic.messages.create({
      model: 'claude-4-5-sonnet-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parser la réponse de Claude
    const content = response.content[0].text;

    // Extraire le JSON de la réponse (au cas où Claude ajoute du texte)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const enriched = JSON.parse(jsonMatch[0]);

    // Validation
    if (!enriched.category || !enriched.style || !enriched.recommended_for || !enriched.description) {
      throw new Error('Invalid response structure from Claude');
    }

    console.log(`[Claude] ✅ Enriched template ${templateData.filename}:`, enriched);

    return enriched;
  } catch (error) {
    console.error('[Claude] ❌ Error enriching template metadata:', error.message);

    // Fallback basique basé sur les données extraites
    const fallback = {
      category: 'Art & Culture',
      style: templateData.imageSlots <= 2 ? 'simple' : templateData.imageSlots <= 4 ? 'moyen' : 'complexe',
      recommended_for: ['Art & Culture', 'Design'],
      description: `Template avec ${templateData.imageSlots} emplacements images`
    };

    console.log(`[Claude] ⚠️  Using fallback metadata:`, fallback);

    return fallback;
  }
}

export default { analyzeContentStructure, recommendTemplates, enrichTemplateMetadata };
