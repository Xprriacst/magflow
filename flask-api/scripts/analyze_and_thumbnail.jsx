/**
 * MagFlow - Analyse Template et Génération Miniature
 * Ce script ouvre un template InDesign, extrait ses métadonnées et génère une miniature
 * 
 * Configuration attendue dans config.json:
 * {
 *   "template_path": "/chemin/vers/template.indt",
 *   "output_dir": "/chemin/vers/output/",
 *   "thumbnail_width": 800,
 *   "thumbnail_height": 600
 * }
 */

// ============================================
// POLYFILLS EXTENDSCRIPT
// ============================================

// JSON.stringify polyfill
if (typeof JSON === 'undefined') {
    JSON = {};
}

if (typeof JSON.stringify !== 'function') {
    JSON.stringify = function(obj) {
        var t = typeof obj;
        if (t !== "object" || obj === null) {
            if (t === "string") return '"' + obj.replace(/"/g, '\\"') + '"';
            return String(obj);
        }
        var n, v, json = [], arr = (obj && obj.constructor === Array);
        for (n in obj) {
            if (obj.hasOwnProperty(n)) {
                v = obj[n];
                t = typeof v;
                if (t === "string") {
                    v = '"' + v.replace(/"/g, '\\"') + '"';
                } else if (t === "object" && v !== null) {
                    v = JSON.stringify(v);
                }
                json.push((arr ? "" : '"' + n + '":') + String(v));
            }
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    };
}

if (typeof JSON.parse !== 'function') {
    JSON.parse = function(text) {
        return eval('(' + text + ')');
    };
}

// Array.indexOf polyfill
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
        var k;
        if (this == null) throw new TypeError('"this" is null or not defined');
        var o = Object(this);
        var len = o.length >>> 0;
        if (len === 0) return -1;
        var n = fromIndex | 0;
        if (n >= len) return -1;
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            if (k in o && o[k] === searchElement) return k;
            k++;
        }
        return -1;
    };
}

// String.trim polyfill
function trimString(str) {
    if (!str) return '';
    return str.replace(/^\s+|\s+$/g, '');
}

// ============================================
// CONFIGURATION
// ============================================

// Chemin dynamique basé sur le script
var scriptFile = new File($.fileName);
var BASE_PATH = scriptFile.parent.parent.fsName; // Remonte au dossier flask-api
var CONFIG_PATH = BASE_PATH + '/analysis/config.json';
var OUTPUT_PATH = BASE_PATH + '/analysis/results.json';

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function readFile(filePath) {
    var file = new File(filePath);
    if (!file.exists) {
        return null;
    }
    file.open('r');
    file.encoding = 'UTF-8';
    var content = file.read();
    file.close();
    return content;
}

function writeFile(filePath, content) {
    var file = new File(filePath);
    file.open('w');
    file.encoding = 'UTF-8';
    file.write(content);
    file.close();
}

function ensureFolder(folderPath) {
    var folder = new Folder(folderPath);
    if (!folder.exists) {
        folder.create();
    }
    return folder;
}

// ============================================
// EXTRACTION DES MÉTADONNÉES
// ============================================

function extractPlaceholders(doc) {
    var placeholders = [];
    var seen = {};
    
    // Parcourir tous les blocs de texte
    for (var i = 0; i < doc.textFrames.length; i++) {
        var frame = doc.textFrames[i];
        var content = frame.contents;
        
        // Chercher les patterns {{PLACEHOLDER}} (lettres, chiffres, underscores)
        var matches = content.match(/\{\{[A-Za-z_0-9]+\}\}/g);
        if (matches) {
            for (var j = 0; j < matches.length; j++) {
                var placeholder = matches[j];
                // Extraire le nom sans les accolades et normaliser en majuscules
                var name = placeholder.replace(/\{\{|\}\}/g, '').toUpperCase();
                // Dédupliquer
                if (!seen[name]) {
                    seen[name] = true;
                    placeholders.push(name);
                }
            }
        }
    }
    
    return placeholders;
}

function countImageSlots(doc) {
    var imageSlots = 0;
    
    // Compter les rectangles vides (potentiels emplacements d'images)
    for (var i = 0; i < doc.rectangles.length; i++) {
        var rect = doc.rectangles[i];
        
        // Un slot d'image est un rectangle sans contenu texte
        // et avec un fond visible ou transparent
        try {
            if (!rect.allGraphics || rect.allGraphics.length === 0) {
                // Rectangle vide = slot potentiel
                imageSlots++;
            }
        } catch (e) {
            // Si erreur, on compte quand même
            imageSlots++;
        }
    }
    
    // Ajouter les polygones et ovales vides aussi
    for (var j = 0; j < doc.polygons.length; j++) {
        try {
            if (!doc.polygons[j].allGraphics || doc.polygons[j].allGraphics.length === 0) {
                imageSlots++;
            }
        } catch (e) {}
    }
    
    for (var k = 0; k < doc.ovals.length; k++) {
        try {
            if (!doc.ovals[k].allGraphics || doc.ovals[k].allGraphics.length === 0) {
                imageSlots++;
            }
        } catch (e) {}
    }
    
    return imageSlots;
}

function extractFonts(doc) {
    var fonts = [];
    var seen = {};
    
    try {
        for (var i = 0; i < doc.fonts.length; i++) {
            var font = doc.fonts[i];
            var fontName = font.name;
            if (!seen[fontName]) {
                seen[fontName] = true;
                fonts.push({
                    name: fontName,
                    family: font.fontFamily || '',
                    style: font.fontStyleName || ''
                });
            }
        }
    } catch (e) {
        // Erreur lors de l'extraction des polices
    }
    
    return fonts;
}

function extractColors(doc) {
    var colors = [];
    
    try {
        for (var i = 0; i < doc.swatches.length; i++) {
            var swatch = doc.swatches[i];
            if (swatch.name !== '[None]' && swatch.name !== '[Registration]') {
                colors.push({
                    name: swatch.name
                });
            }
        }
    } catch (e) {}
    
    return colors;
}

function extractDocumentInfo(doc) {
    var info = {
        pageCount: doc.pages.length,
        width: 0,
        height: 0,
        units: 'points'
    };
    
    try {
        var page = doc.pages[0];
        info.width = page.bounds[3] - page.bounds[1];
        info.height = page.bounds[2] - page.bounds[0];
    } catch (e) {}
    
    return info;
}

// ============================================
// GÉNÉRATION DE MINIATURE
// ============================================

function generateThumbnail(doc, outputPath, width, height) {
    try {
        // Créer les options d'export JPEG
        var exportFile = new File(outputPath);
        
        // Réinitialiser les préférences d'export JPEG
        app.jpegExportPreferences.exportingSpread = false;
        app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.HIGH;
        app.jpegExportPreferences.jpegRenderingStyle = JPEGOptionsFormat.PROGRESSIVE_ENCODING;
        app.jpegExportPreferences.antiAlias = true;
        app.jpegExportPreferences.useDocumentBleeds = false;
        
        // IMPORTANT: Utiliser RANGE pour exporter une seule page
        app.jpegExportPreferences.jpegExportRange = ExportRangeOrAllPages.EXPORT_RANGE;
        
        // Obtenir le nom de la première page (peut être différent de "1")
        var firstPage = doc.pages[0];
        var pageName = firstPage.name; // Utilise le nom réel de la page
        app.jpegExportPreferences.pageString = pageName;
        
        // Calculer la résolution pour obtenir la taille désirée
        var pageWidth = firstPage.bounds[3] - firstPage.bounds[1];
        var pageHeight = firstPage.bounds[2] - firstPage.bounds[0];
        
        // Résolution fixe de 150 dpi pour des miniatures de bonne qualité
        // (évite les problèmes de calcul variable)
        app.jpegExportPreferences.exportResolution = 150;
        
        // Exporter
        doc.exportFile(ExportFormat.JPG, exportFile, false);
        
        // Vérifier que le fichier a été créé
        if (!exportFile.exists) {
            return {
                success: false,
                error: 'Export file was not created'
            };
        }
        
        return {
            success: true,
            path: outputPath
        };
    } catch (e) {
        return {
            success: false,
            error: e.toString()
        };
    }
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

function analyzeTemplate() {
    var results = {
        success: false,
        template: null,
        thumbnail: null,
        errors: []
    };
    
    try {
        // Lire la configuration
        var configContent = readFile(CONFIG_PATH);
        if (!configContent) {
            results.errors.push('Config file not found: ' + CONFIG_PATH);
            writeFile(OUTPUT_PATH, JSON.stringify(results));
            return;
        }
        
        var config = JSON.parse(configContent);
        var templatePath = config.template_path;
        var outputDir = config.output_dir || BASE_PATH + '/analysis/';
        var thumbnailWidth = config.thumbnail_width || 800;
        var thumbnailHeight = config.thumbnail_height || 600;
        
        // Vérifier que le template existe
        var templateFile = new File(templatePath);
        if (!templateFile.exists) {
            results.errors.push('Template file not found: ' + templatePath);
            writeFile(OUTPUT_PATH, JSON.stringify(results));
            return;
        }
        
        // Ouvrir le template
        var doc = app.open(templateFile);
        
        // Extraire les métadonnées
        var placeholders = extractPlaceholders(doc);
        var imageSlots = countImageSlots(doc);
        var fonts = extractFonts(doc);
        var colors = extractColors(doc);
        var docInfo = extractDocumentInfo(doc);
        
        // Extraire le nom du fichier
        var fileName = templateFile.name;
        
        // Générer le chemin de la miniature
        var thumbnailName = fileName.replace(/\.(indt|indd)$/i, '_thumbnail.jpg');
        var thumbnailPath = outputDir + thumbnailName;
        
        // S'assurer que le dossier de sortie existe
        ensureFolder(outputDir);
        
        // Générer la miniature
        var thumbnailResult = generateThumbnail(doc, thumbnailPath, thumbnailWidth, thumbnailHeight);
        
        // Fermer le document sans sauvegarder
        doc.close(SaveOptions.NO);
        
        // Préparer les résultats
        results.success = true;
        results.template = {
            filename: fileName,
            path: templatePath,
            placeholders: placeholders,
            image_slots: imageSlots,
            fonts: fonts,
            colors: colors,
            page_count: docInfo.pageCount,
            width: docInfo.width,
            height: docInfo.height
        };
        
        if (thumbnailResult.success) {
            results.thumbnail = {
                path: thumbnailPath,
                filename: thumbnailName
            };
        } else {
            results.errors.push('Thumbnail generation failed: ' + thumbnailResult.error);
        }
        
    } catch (e) {
        results.success = false;
        results.errors.push('Error: ' + e.toString());
        
        // Fermer le document s'il est ouvert
        try {
            if (app.documents.length > 0) {
                app.activeDocument.close(SaveOptions.NO);
            }
        } catch (closeError) {}
    }
    
    // Écrire les résultats
    writeFile(OUTPUT_PATH, JSON.stringify(results));
    
    // Alert finale (optionnelle)
    // alert('Analyse terminée: ' + (results.success ? 'Succès' : 'Échec'));
}

// Exécuter
analyzeTemplate();
