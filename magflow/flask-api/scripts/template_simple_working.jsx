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
        var configPath = $.getenv("MAGFLOW_CONFIG_PATH");
        if (!configPath) {
            throw new Error("Variable d'environnement MAGFLOW_CONFIG_PATH non définie");
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
        alert("Erreur InDesign : " + e.message + " (Ligne " + e.line + ")");
    } finally {
        app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
    }
}

function processDocument(doc, config) {
    // A. Remplissage des Textes
    // On cherche les frames par leur nom de script (label) ou par contenu placeholder
    
    // Mapping des champs config -> placeholders potentiels
    var textMapping = {
        "titre": ["{{titre}}", "[Titre]", "Titre Principal", "Titre de l'article"],
        "chapo": ["{{chapo}}", "[Chapo]", "Chapo", "Introduction"],
        "text_content": ["{{texte}}", "[Texte]", "Texte Principal", "Corps de texte"],
        "subtitle": ["{{sous-titre}}", "[Sous-titre]", "Sous-titre"]
    };

    // Ajouter les valeurs directes de la config
    var data = {
        "titre": config.prompt || config.title_text, // Fallback
        "chapo": config.subtitle,
        "text_content": config.text_content
    };
    
    // Si l'IA a généré des instructions précises
    if (config.layout_instructions) {
        if (config.layout_instructions.title_text) data.titre = config.layout_instructions.title_text;
    }

    var allItems = doc.allPageItems;
    
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
        // On remplit les rectangles d'images séquentiellement
        else if ((item instanceof Rectangle || item instanceof Polygon || item instanceof Oval) && 
                 (item.contentType === ContentType.GRAPHIC_TYPE || item.contentType === ContentType.UNASSIGNED)) {
            
            // Vérifier si c'est un placeholder d'image (taille suffisante)
            var bounds = item.geometricBounds;
            var w = bounds[3] - bounds[1];
            var h = bounds[2] - bounds[0];
            
            if (w > 20 && h > 20) {
                // On utilise une propriété statique pour compter les images déjà placées
                if (typeof main.imageIndex == 'undefined') main.imageIndex = 0;
                
                if (config.images && main.imageIndex < config.images.length) {
                    var imagePath = config.images[main.imageIndex];
                    var imgFile = new File(imagePath);
                    
                    if (imgFile.exists) {
                        try {
                            item.place(imgFile);
                            item.fit(FitOptions.FILL_PROPORTIONALLY);
                            item.fit(FitOptions.CENTER_CONTENT);
                            main.imageIndex++;
                        } catch(e) {
                            // Ignorer erreur de placement
                        }
                    }
                }
            }
        }
    }
}

main();
