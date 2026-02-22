#!/usr/bin/env node

/**
 * Script de test pour l'analyse des templates
 * Teste le workflow complet sans InDesign
 */

import { default as fetch } from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function testAnalysis() {
  console.log('🧪 Test de l\'analyse automatique des templates\n');

  try {
    // 1. Récupérer la liste des templates
    console.log('1️⃣  Récupération des templates...');
    const templatesRes = await fetch(`${API_URL}/api/templates`);
    const templatesData = await templatesRes.json();
    
    if (!templatesData.success || !templatesData.templates) {
      throw new Error('Impossible de récupérer les templates');
    }

    console.log(`   ✓ ${templatesData.templates.length} templates trouvés\n`);

    // Afficher l'état actuel
    console.log('📊 État actuel des templates:\n');
    templatesData.templates.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name}`);
      console.log(`      - ID: ${t.id}`);
      console.log(`      - Fichier: ${t.filename}`);
      console.log(`      - Images: ${t.image_slots ?? 'Non défini'}`);
      console.log(`      - Catégorie: ${t.category ?? 'Non définie'}`);
      console.log(`      - Style: ${t.style ?? 'Non défini'}`);
      console.log(`      - Placeholders: ${t.placeholders ? t.placeholders.length : 0}`);
      console.log('');
    });

    // 2. Vérifier que le script JSX existe
    console.log('2️⃣  Vérification du script d\'analyse...');
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const scriptPath = path.join(__dirname, 'Indesign automation v1', 'scripts', 'analyze_templates.jsx');
    
    try {
      await fs.access(scriptPath);
      console.log(`   ✓ Script trouvé: ${scriptPath}\n`);
    } catch (err) {
      throw new Error(`Script introuvable: ${scriptPath}`);
    }

    // 3. Vérifier le dossier d'analyse
    console.log('3️⃣  Vérification du dossier d\'analyse...');
    const analysisDir = path.join(__dirname, 'Indesign automation v1', 'analysis');
    try {
      await fs.access(analysisDir);
      console.log(`   ✓ Dossier d'analyse: ${analysisDir}\n`);
    } catch (err) {
      console.log(`   ⚠️  Dossier d'analyse non trouvé, sera créé automatiquement\n`);
    }

    // 4. Test de l'enrichissement IA (sans InDesign)
    console.log('4️⃣  Test de l\'enrichissement IA...');
    console.log('   ℹ️  Pour tester l\'analyse complète, il faut:');
    console.log('      1. Ouvrir Adobe InDesign');
    console.log('      2. Aller sur http://localhost:5173/admin/templates');
    console.log('      3. Cliquer sur "Analyser tous les templates"\n');

    // 5. Afficher les routes disponibles
    console.log('5️⃣  Routes API disponibles:\n');
    console.log('   GET  /api/templates');
    console.log('        → Liste tous les templates\n');
    console.log('   POST /api/templates/analyze');
    console.log('        → Analyse tous les templates avec InDesign + IA\n');
    console.log('   POST /api/templates/:id/analyze');
    console.log('        → Analyse un template spécifique\n');

    console.log('✅ Test préliminaire réussi !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Ouvrir InDesign');
    console.log('   2. Ouvrir http://localhost:5173/admin/templates');
    console.log('   3. Tester l\'analyse automatique\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testAnalysis();
