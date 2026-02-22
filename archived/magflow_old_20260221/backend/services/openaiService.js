import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyse la structure éditoriale d'un contenu
 * EXTRACTION PURE - Ne reformule JAMAIS le contenu original
 * @param {string} content - Le contenu textuel à analyser
 * @returns {Promise<Object>} Structure éditoriale analysée
 */
export async function analyzeContentStructure(content) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Tu es un analyseur de structure éditoriale. 
Ton rôle est d'IDENTIFIER et EXTRAIRE les différentes parties d'un article, SANS RIEN REFORMULER.

RÈGLES STRICTES - IMPÉRATIF :
1. NE PAS reformuler, paraphraser ou modifier le texte original
2. EXTRAIRE tel quel les titres, sous-titres, paragraphes existants
3. IDENTIFIER la structure (introduction, corps, conclusion) en préservant le texte exact
4. PRÉSERVER le style, le ton et les mots exacts de l'auteur
5. Si un titre n'existe pas, extraire les premiers mots significatifs TELS QUELS
6. Copier-coller le texte original sans aucune modification

Ta mission : ANALYSER la structure, PAS créer du contenu.`
        },
        {
          role: 'user',
          content: `EXTRAIT tel quel la structure de ce contenu (NE RIEN REFORMULER) :\n\n${content}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'content_structure',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              titre_principal: { 
                type: 'string',
                description: 'EXTRAIRE tel quel le titre existant dans le texte'
              },
              chapo: { 
                type: 'string',
                description: 'EXTRAIRE tel quel le premier paragraphe ou introduction'
              },
              sous_titres: {
                type: 'array',
                items: { type: 'string' },
                description: 'EXTRAIRE tels quels les sous-titres présents dans le texte'
              },
              sections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    titre: { 
                      type: 'string',
                      description: 'EXTRAIRE tel quel le titre de section'
                    },
                    contenu: { 
                      type: 'string',
                      description: 'EXTRAIRE tel quel le contenu sans modification'
                    },
                    type: { 
                      type: 'string', 
                      enum: ['introduction', 'corps', 'conclusion', 'citation', 'encadre'],
                      description: 'Type de section identifié'
                    }
                  },
                  required: ['titre', 'contenu', 'type'],
                  additionalProperties: false
                },
                description: 'Sections extraites du texte original'
              },
              mots_cles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Mots-clés principaux identifiés (peuvent être extraits ou inférés)'
              },
              categorie_suggeree: { 
                type: 'string',
                description: 'Catégorie éditoriale suggérée'
              },
              structure_detectee: {
                type: 'object',
                properties: {
                  nombre_sections: { type: 'number' },
                  nombre_mots: { type: 'number' },
                  images_mentionnees: { type: 'number' }
                },
                required: ['nombre_sections', 'nombre_mots', 'images_mentionnees'],
                additionalProperties: false,
                description: 'Métadonnées sur la structure détectée'
              },
              longueur_estimee: { type: 'number' },
              temps_lecture: { type: 'number' },
              niveau_complexite: { 
                type: 'string', 
                enum: ['simple', 'moyen', 'complexe'] 
              }
            },
            required: [
              'titre_principal', 
              'chapo', 
              'sous_titres', 
              'sections', 
              'mots_cles', 
              'categorie_suggeree',
              'structure_detectee',
              'longueur_estimee',
              'temps_lecture',
              'niveau_complexite'
            ],
            additionalProperties: false
          }
        }
      }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing content structure:', error);
    throw new Error(`OpenAI API Error: ${error.message}`);
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
 * Enrichit les métadonnées d'un template avec l'IA
 * @param {Object} templateData - Données extraites du template
 * @returns {Promise<Object>} Métadonnées enrichies
 */
export async function enrichTemplateMetadata(templateData) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en design éditorial et templates InDesign.
Analyse les métadonnées d'un template et suggère des catégories et styles appropriés.

RÈGLES:
- category: Une catégorie principale parmi: "Art & Culture", "Tech", "Business", "Lifestyle", "Mode", "Sport", "Science"
- style: Le niveau de complexité parmi: "simple", "moyen", "complexe"
- recommended_for: Array de 2-4 catégories pour lesquelles ce template est adapté
- description: Description courte et attractive (max 100 caractères)

Base ton analyse sur:
- Le nombre d'emplacements images (peu = simple, beaucoup = complexe)
- Les placeholders de texte (structure éditoriale)
- Les polices utilisées (serif = classique, sans-serif = moderne)
- Le nombre de pages (1-2 = simple, 3+ = complexe)`
        },
        {
          role: 'user',
          content: `Analyse ce template InDesign:

Fichier: ${templateData.filename}
Emplacements images: ${templateData.imageSlots}
Pages: ${templateData.pageCount}
Placeholders texte: ${JSON.stringify(templateData.textPlaceholders)}
Polices: ${JSON.stringify(templateData.fonts?.slice(0, 5))}

Métadonnées InDesign:
${JSON.stringify(templateData.metadata, null, 2)}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'template_metadata',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Catégorie principale du template'
              },
              style: {
                type: 'string',
                enum: ['simple', 'moyen', 'complexe'],
                description: 'Niveau de complexité'
              },
              recommended_for: {
                type: 'array',
                items: { type: 'string' },
                description: 'Catégories recommandées (2-4 éléments)'
              },
              description: {
                type: 'string',
                description: 'Description courte et attractive'
              }
            },
            required: ['category', 'style', 'recommended_for', 'description'],
            additionalProperties: false
          }
        }
      }
    });

    const enriched = JSON.parse(response.choices[0].message.content);
    
    console.log(`[OpenAI] Enriched template ${templateData.filename}:`, enriched);
    
    return enriched;
  } catch (error) {
    console.error('Error enriching template metadata:', error);
    
    // Fallback basique basé sur les données extraites
    return {
      category: 'Art & Culture',
      style: templateData.imageSlots <= 2 ? 'simple' : templateData.imageSlots <= 4 ? 'moyen' : 'complexe',
      recommended_for: ['Art & Culture', 'Design'],
      description: `Template avec ${templateData.imageSlots} emplacements images`
    };
  }
}

export default { analyzeContentStructure, recommendTemplates, enrichTemplateMetadata };
