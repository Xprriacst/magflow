export const fallbackTemplates = [
  {
    id: 'fallback-1',
    name: 'Magazine Artistique Simple',
    filename: 'template-mag-simple-1808.indt',
    description: 'Template simple et élégant pour articles artistiques et culturels',
    placeholders: ['{{TITRE}}', '{{SOUS-TITRE}}', '{{ARTICLE}}'],
    image_slots: 3,
    category: 'Art & Culture',
    style: 'simple',
    recommended_for: ['Art & Culture', 'Design', 'Photographie'],
    preview_url: null,
    file_path: '/indesign_templates/template-mag-simple-1808.indt',
    is_active: true,
    created_at: null,
    updated_at: null
  },
  {
    id: 'fallback-2',
    name: 'Magazine Artistique Avancé',
    filename: 'template-mag-simple-2-1808.indt',
    description: 'Template avec mise en page plus complexe pour contenus riches',
    placeholders: ['{{TITRE}}', '{{SOUS-TITRE}}', '{{ARTICLE}}', '{{ENCADRE_1}}', '{{ENCADRE_2}}'],
    image_slots: 5,
    category: 'Art & Culture',
    style: 'moyen',
    recommended_for: ['Art & Culture', 'Design', 'Magazine', 'Editorial'],
    preview_url: null,
    file_path: '/indesign_templates/template-mag-simple-2-1808.indt',
    is_active: true,
    created_at: null,
    updated_at: null
  },
  {
    id: 'fallback-3',
    name: 'Magazine Art - Page 1',
    filename: 'magazine-art-template-page-1.indd',
    description: "Template page 1 pour magazines d'art avec design sophistiqué",
    placeholders: ['{{TITRE}}', '{{CHAPO}}', '{{SECTION_1}}', '{{SECTION_2}}'],
    image_slots: 4,
    category: 'Art & Culture',
    style: 'complexe',
    recommended_for: ['Art & Culture', 'Design', 'Mode', 'Lifestyle'],
    preview_url: null,
    file_path: '/indesign_templates/magazine-art-template-page-1.indd',
    is_active: true,
    created_at: null,
    updated_at: null
  }
];

export default fallbackTemplates;
