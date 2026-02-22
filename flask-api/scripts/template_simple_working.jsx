/**
 * Script de génération de magazine InDesign (MagFlow)
 * Lit la configuration JSON et remplit le template
 */

#target "InDesign"

function main() {
    // Désactiver les dialogues
    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;

    try {
        // 1. Récupérer le chemin de la configuration
        var configPath = "";
        var scriptDir = (new File($.fileName)).parent;
        var appDir = scriptDir.parent;

        // Méthode 1: Lire depuis current_config_path.txt (créé par Flask)
        // Cette méthode est la plus fiable avec InDesign 2026
        var configPointerFile = new File(appDir + "/current_config_path.txt");
        if (configPointerFile.exists) {
            configPointerFile.open("r");
            configPath = configPointerFile.read();
            configPointerFile.close();
            // Trim whitespace
            configPath = configPath.replace(/^\s+|\s+$/g, "");
        }

        // Méthode 2: Via scriptArgs (ancienne méthode, peut ne pas fonctionner avec InDesign 2026)
        if (!configPath && app.scriptArgs.isDefined("configPath")) {
            configPath = app.scriptArgs.getValue("configPath");
        }

        // Méthode 3: Fallback sur variable d'environnement
        if (!configPath) {
            configPath = $.getenv("MAGFLOW_CONFIG_PATH");
        }

        // Méthode 4: Fallback sur chemin par défaut (analysis/config.json)
        if (!configPath) {
            configPath = appDir + "/analysis/config.json";
        }
        
        if (!configPath) {
            throw new Error("Chemin de configuration non défini (ni scriptArgs, ni env, ni défaut)");
        }

        var configFile = new File(configPath);
        if (!configFile.exists) {
            throw new Error("Fichier de configuration introuvable : " + configPath);
        }

        // Lire la config
        configFile.open("r");
        var configContent = configFile.read();
        configFile.close();
        
        // Parser le JSON (eval sécurisé pour ExtendScript)
        var config = eval("(" + configContent + ")");
        config.__configPath = configPath;

        // 2. Ouvrir le template
        // Le template peut être un nom (dans le dossier templates par défaut) ou un chemin absolu
        var templatePath = config.template;
        var templateFile = new File(templatePath);
        
        // Si c'est juste un nom, chercher dans le dossier templates par défaut
        if (!templateFile.exists) {
            // Remonter d'un niveau depuis le dossier du script, puis 'indesign_templates'
            // Structure: flask-api/scripts/script.jsx -> flask-api/indesign_templates/
            var scriptDir = (new File($.fileName)).parent;
            var appDir = scriptDir.parent; // flask-api
            var templatesDir = new Folder(appDir + "/indesign_templates");
            
            // Chercher dans flask-api/indesign_templates
            templateFile = new File(templatesDir + "/" + templatePath);
            
            // Si toujours pas trouvé, essayer le dossier global "Indesign automation v1"
            if (!templateFile.exists) {
                 var globalTemplatesDir = new Folder(appDir.parent + "/Indesign automation v1");
                 templateFile = new File(globalTemplatesDir + "/" + templatePath);
            }
        }

        if (!templateFile.exists) {
            // Essayer avec extension .indt si absente
            if (templatePath.indexOf(".indt") === -1) {
                templateFile = new File(templateFile.fullName + ".indt");
            }
            
            if (!templateFile.exists) {
                throw new Error("Template introuvable : " + templatePath);
            }
        }

        var doc = app.open(templateFile);

        // 3. Remplissage du contenu
        processDocument(doc, config);

        // 4. Sauvegarde
        // Le nom de fichier de sortie est basé sur le project_id
        var outputFolder = new Folder(configFile.parent); // Sauvegarder à côté du config.json par défaut
        var outputName = config.project_id + ".indd";
        
        // Si un dossier output spécifique est configuré (relatif à flask-api)
        // Mais Flask attend le fichier dans app.config['OUTPUT_FOLDER']
        // Le plus simple est de le sauvegarder là où Flask l'attend.
        // Flask copie ensuite le résultat ou le sert depuis 'output'.
        // Pour simplifier, on sauvegarde dans le dossier du projet temporaire (là où est config.json)
        // et Flask s'occupera de le déplacer si nécessaire, ou on le met direct dans flask-api/output
        
        var outputFile = new File(outputFolder + "/" + outputName);
        doc.save(outputFile);
        
        // Export PDF (optionnel, pour preview rapide)
        // var pdfFile = new File(outputFolder + "/" + config.project_id + ".pdf");
        // doc.exportFile(ExportFormat.PDF_TYPE, pdfFile);

        doc.close(SaveOptions.NO);

    } catch (e) {
        try {
            if (configPath) {
                var cfg = new File(configPath);
                var errFile = new File(cfg.parent + "/placement_error.log");
                errFile.open("w");
                errFile.write("Erreur InDesign: " + e.message + " (Ligne " + e.line + ")");
                errFile.close();
            }
        } catch (wErr) {}
        throw e;
    } finally {
        app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
    }
}

function processDocument(doc, config) {
    // A. Remplissage des Textes
    // On cherche les frames par leur nom de script (label) ou par contenu placeholder
    
    // Mapping des champs config -> placeholders potentiels
    var textMapping = {
        "titre": ["{{TITRE}}", "{{titre}}", "[Titre]", "Titre Principal", "Titre de l'article"],
        "chapo": ["{{SOUS-TITRE}}", "{{sous-titre}}", "{{chapo}}", "[Chapo]", "Chapo", "Introduction"],
        "text_content": ["{{ARTICLE}}", "{{article}}", "{{texte}}", "[Texte]", "Texte Principal", "Corps de texte"],
        "subtitle": ["{{SOUS-TITRE}}", "{{sous-titre}}", "[Sous-titre]", "Sous-titre"]
    };

    // Ajouter les valeurs directes de la config
    // Priorité: prompt (titre principal envoyé par l'utilisateur)
    var data = {
        "titre": config.prompt || config.title_text || "Sans titre",
        "chapo": config.subtitle || "",
        "text_content": config.text_content || ""
    };

    // Note: On n'utilise PAS layout_instructions.title_text car c'est une valeur par défaut de l'IA

    var allItems = [];
    var fromAllPageItems = 0;
    var fromPageItems = 0;
    var fromMasterItems = 0;

    try {
        if (doc.allPageItems && doc.allPageItems.length) {
            var resolvedAllItems = doc.allPageItems.everyItem().getElements();
            for (var api = 0; api < resolvedAllItems.length; api++) {
                allItems.push(resolvedAllItems[api]);
            }
            fromAllPageItems = resolvedAllItems.length;
        }
    } catch (e0) {}

    if (allItems.length === 0) {
        try {
            var directItems = doc.pageItems.everyItem().getElements();
            for (var dpi = 0; dpi < directItems.length; dpi++) {
                allItems.push(directItems[dpi]);
            }
            fromPageItems = directItems.length;
        } catch (e1) {}
    }

    // Fallback important: certains templates portent leurs éléments sur les masters.
    if (allItems.length === 0) {
        try {
            for (var ms = 0; ms < doc.masterSpreads.length; ms++) {
                var msItems = doc.masterSpreads[ms].pageItems.everyItem().getElements();
                for (var mi = 0; mi < msItems.length; mi++) {
                    allItems.push(msItems[mi]);
                    fromMasterItems++;
                }
            }
        } catch (e2) {}
    }
    var imageIndex = 0;
    var debugLines = [];

    function logDebug(line) {
        try {
            debugLines.push(line);
        } catch (e) {}
    }

    function flushDebug() {
        try {
            if (!config.__configPath) return;
            var cfgFile = new File(config.__configPath);
            var debugFile = new File(cfgFile.parent + "/placement_debug.log");
            debugFile.open("w");
            debugFile.write(debugLines.join("\n"));
            debugFile.close();
        } catch (e) {}
    }

    function safeName(obj) {
        try {
            if (obj.label && obj.label.length > 0) return obj.label;
            if (obj.name && obj.name.length > 0) return obj.name;
        } catch (e) {}
        return "(sans_nom)";
    }

    function readFillName(obj) {
        try {
            return obj.fillColor ? String(obj.fillColor.name || "") : "";
        } catch (e) {}
        return "";
    }
    
    for (var i = 0; i < allItems.length; i++) {
        var item = allItems[i];
        
        // TEXTES
        if (item instanceof TextFrame) {
            // 1. Par Script Label (Prioritaire)
            if (item.label && data[item.label]) {
                item.contents = data[item.label];
                continue;
            }
            
            // 2. Par remplacement de contenu
            var text = item.contents;
            if (text.length < 100) { // Optimisation
                for (var key in textMapping) {
                    var placeholders = textMapping[key];
                    for (var p = 0; p < placeholders.length; p++) {
                        if (text.indexOf(placeholders[p]) !== -1 && data[key]) {
                            item.contents = data[key];
                            break;
                        }
                    }
                }
            }
        }
        
        // IMAGES
        // Traitement image fait après scan complet pour classer correctement les cadres.
    }

    // B. Placement des images: sélectionner les meilleurs cadres (score), puis placer séquentiellement.
    var imageCandidates = [];
    var shapeDiagnostics = [];
    for (var c = 0; c < allItems.length; c++) {
        var candidate = allItems[c];
        var dbgType = "unknown";
        try { dbgType = String(candidate.reflect.name); } catch (eType) {}
        var cb = null;
        try { cb = candidate.geometricBounds; } catch (e) { cb = null; }
        if (!cb || cb.length !== 4) {
            shapeDiagnostics.push("RAW type=" + dbgType + " bounds=none");
            continue;
        }
        shapeDiagnostics.push("RAW type=" + dbgType + " bounds=" + cb.join(","));

        if (candidate instanceof TextFrame) {
            continue;
        }

        var cw = cb[3] - cb[1];
        var ch = cb[2] - cb[0];
        var area = cw * ch;
        if (cw < 1 || ch < 1) {
            continue;
        }

        var ctype = null;
        try { ctype = candidate.contentType; } catch (e) {}

        var score = 0;
        // Priorité type cadre
        if (ctype === ContentType.GRAPHIC_TYPE) score += 2000;
        if (ctype === ContentType.UNASSIGNED) score += 1300;

        // Priorité aux grands cadres (mais on pénalise les rectangles "fond de page")
        score += Math.floor(area * 10);
        if (area > 160) {
            score -= 4000;
        }

        // Priorité aux labels explicites
        var lbl = "";
        try { lbl = (candidate.label || "").toLowerCase(); } catch (e) {}
        if (lbl.indexOf("image") !== -1 || lbl.indexOf("photo") !== -1 || lbl.indexOf("visuel") !== -1) {
            score += 1500;
        }

        // Heuristique visuelle: placeholders souvent jaunes
        var fillName = readFillName(candidate).toLowerCase();
        if (fillName.indexOf("yellow") !== -1 || fillName.indexOf("jaune") !== -1) {
            score += 2200;
        }

        var typeName = "";
        try { typeName = String(candidate.reflect.name); } catch (e) { typeName = "unknown"; }

        // Priorité aux items posés sur une page (et pas objets parasites)
        try {
            if (candidate.parentPage) score += 300;
        } catch (e) {}

        shapeDiagnostics.push("RAW type=" + typeName + " area=" + area + " fill=" + fillName + " label=" + lbl);

        imageCandidates.push({
            item: candidate,
            score: score,
            w: cw,
            h: ch,
            area: area,
            type: String(ctype),
            typeName: typeName,
            hasGraphics: (function() {
                try { return candidate.allGraphics.length; } catch (e) { return -1; }
            })(),
            fill: fillName,
            name: safeName(candidate)
        });
    }

    imageCandidates.sort(function(a, b) { return b.score - a.score; });

    logDebug("=== IMAGE PLACEMENT DEBUG ===");
    logDebug("ITEM SOURCES allPageItems=" + fromAllPageItems + " pageItems=" + fromPageItems + " masterItems=" + fromMasterItems + " total=" + allItems.length);
    logDebug("Images input: " + (config.images ? config.images.length : 0));
    logDebug("Placable raw items: " + shapeDiagnostics.length);
    for (var sd = 0; sd < shapeDiagnostics.length && sd < 40; sd++) {
        logDebug(shapeDiagnostics[sd]);
    }
    logDebug("Candidates: " + imageCandidates.length);
    for (var cc = 0; cc < imageCandidates.length; cc++) {
        var ic = imageCandidates[cc];
        logDebug("CAND[" + cc + "] score=" + ic.score + " type=" + ic.type + " typeName=" + ic.typeName + " area=" + ic.area + " fill=" + ic.fill + " g=" + ic.hasGraphics + " name=" + ic.name);
    }

    if (config.images && config.images.length > 0) {
        for (var p = 0; p < imageCandidates.length && imageIndex < config.images.length; p++) {
            var picked = imageCandidates[p];
            var imagePath = config.images[imageIndex];
            var imgFile = new File(imagePath);

            if (!imgFile.exists) {
                logDebug("SKIP image not found: " + imagePath);
                imageIndex++;
                continue;
            }

            try {
                // Déverrouiller si nécessaire
                try { picked.item.locked = false; } catch (u1) {}
                try { picked.item.itemLayer.locked = false; } catch (u2) {}
                try { picked.item.itemLayer.visible = true; } catch (u3) {}

                // Si un visuel existe déjà, le remplacer explicitement
                try {
                    while (picked.item.allGraphics && picked.item.allGraphics.length > 0) {
                        picked.item.allGraphics[0].remove();
                    }
                } catch (rmErr) {}

                picked.item.place(imgFile);
                picked.item.fit(FitOptions.FILL_PROPORTIONALLY);
                picked.item.fit(FitOptions.CENTER_CONTENT);
                logDebug("PLACED image[" + imageIndex + "] -> cand[" + p + "] name=" + picked.name + " area=" + picked.area);
                imageIndex++;
            } catch (placeErr) {
                logDebug("ERROR cand[" + p + "] name=" + picked.name + " : " + placeErr.message);
            }
        }
    }

    logDebug("Placed images: " + imageIndex + "/" + (config.images ? config.images.length : 0));
    flushDebug();

    // Fallback final: si rien placé, ne pas masquer le problème.
    if (config.images && config.images.length > 0 && imageIndex === 0) {
        throw new Error("Aucune image n'a pu être placée. Voir placement_debug.log");
    }
}

main();
