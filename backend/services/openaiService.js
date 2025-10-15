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

export default { analyzeContentStructure, recommendTemplates };
