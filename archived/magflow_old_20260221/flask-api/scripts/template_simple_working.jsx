/**
 * Script de génération de magazine InDesign (MagFlow)
 * Lit la configuration JSON et remplit le template
 */

#target "InDesign"

function main() {
    // Désactiver les dialogues
    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;

    try {
        // 1. Récupérer le chemin de la configuration via scriptArgs (passé par AppleScript)
        var configPath = "";
        
        // Méthode 1: Via scriptArgs (recommandé)
        if (app.scriptArgs.isDefined("configPath")) {
            configPath = app.scriptArgs.getValue("configPath");
        }
        
        // Méthode 2: Fallback sur variable d'environnement
        if (!configPath) {
            configPath = $.getenv("MAGFLOW_CONFIG_PATH");
        }
        
        // Méthode 3: Fallback sur chemin par défaut (analysis/config.json)
        if (!configPath) {
            var scriptDir = (new File($.fileName)).parent;
            var appDir = scriptDir.parent;
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
    // A. Remplissage des Textes - DÉTECTION INTELLIGENTE
    
    // Données à injecter
    var data = {
        "titre": config.prompt || config.title_text || "",
        "chapo": config.subtitle || "",
        "text_content": config.text_content || ""
    };
    
    // Collecter tous les TextFrames avec leurs caractéristiques
    var textFrames = [];
    var allItems = doc.allPageItems;
    
    for (var i = 0; i < allItems.length; i++) {
        var item = allItems[i];
        if (item instanceof TextFrame && item.contents.length > 0) {
            var bounds = item.geometricBounds; // [top, left, bottom, right]
            var fontSize = 12; // défaut
            try {
                if (item.paragraphs.length > 0 && item.paragraphs[0].pointSize) {
                    fontSize = item.paragraphs[0].pointSize;
                }
            } catch(e) {}
            
            textFrames.push({
                frame: item,
                top: bounds[0],
                left: bounds[1],
                width: bounds[3] - bounds[1],
                height: bounds[2] - bounds[0],
                fontSize: fontSize,
                content: item.contents,
                label: item.label || "",
                charCount: item.contents.length
            });
        }
    }
    
    // Trier par position (haut vers bas, gauche vers droite)
    textFrames.sort(function(a, b) {
        if (Math.abs(a.top - b.top) < 10) return a.left - b.left;
        return a.top - b.top;
    });
    
    // Identifier les rôles par heuristiques
    var titreFrame = null;
    var articleFrame = null;
    var chapoFrame = null;
    
    for (var j = 0; j < textFrames.length; j++) {
        var tf = textFrames[j];
        
        // 1. Par Script Label (prioritaire)
        if (tf.label.toLowerCase() === "titre" || tf.label.toLowerCase() === "title") {
            titreFrame = tf;
            continue;
        }
        if (tf.label.toLowerCase() === "article" || tf.label.toLowerCase() === "texte" || tf.label.toLowerCase() === "body") {
            articleFrame = tf;
            continue;
        }
        if (tf.label.toLowerCase() === "chapo" || tf.label.toLowerCase() === "intro" || tf.label.toLowerCase() === "subtitle") {
            chapoFrame = tf;
            continue;
        }
        
        // 2. Par contenu placeholder ({{...}} ou texte connu)
        var content = tf.content.toUpperCase();
        if (content.indexOf("{{TITRE}}") !== -1 || content.indexOf("{{TITLE}}") !== -1) {
            titreFrame = tf;
            continue;
        }
        if (content.indexOf("{{ARTICLE}}") !== -1 || content.indexOf("{{TEXTE}}") !== -1 || content.indexOf("{{BODY}}") !== -1) {
            articleFrame = tf;
            continue;
        }
        if (content.indexOf("{{CHAPO}}") !== -1 || content.indexOf("{{INTRO}}") !== -1 || content.indexOf("{{SUBTITLE}}") !== -1) {
            chapoFrame = tf;
            continue;
        }
    }
    
    // 3. Détection par heuristiques si pas trouvé
    if (!titreFrame || !articleFrame) {
        for (var k = 0; k < textFrames.length; k++) {
            var tf2 = textFrames[k];
            if (tf2 === titreFrame || tf2 === articleFrame || tf2 === chapoFrame) continue;
            
            // TITRE: grande police (>18pt) OU en haut de page OU texte court (<100 chars)
            if (!titreFrame && (tf2.fontSize >= 18 || (tf2.top < 100 && tf2.charCount < 100))) {
                titreFrame = tf2;
                continue;
            }
            
            // ARTICLE: le plus long texte OU grande surface
            if (!articleFrame && (tf2.charCount > 200 || (tf2.width > 200 && tf2.height > 100))) {
                articleFrame = tf2;
                continue;
            }
            
            // CHAPO: texte moyen, entre titre et article
            if (!chapoFrame && tf2.charCount > 50 && tf2.charCount < 300 && tf2.fontSize >= 10 && tf2.fontSize < 18) {
                chapoFrame = tf2;
            }
        }
    }
    
    // 4. Appliquer les remplacements
    if (titreFrame && data.titre) {
        titreFrame.frame.contents = data.titre;
    }
    if (articleFrame && data.text_content) {
        articleFrame.frame.contents = data.text_content;
    }
    if (chapoFrame && data.chapo) {
        chapoFrame.frame.contents = data.chapo;
    }
    
    // B. IMAGES - Remplir les rectangles vides séquentiellement
    var imageIndex = 0;
    
    for (var m = 0; m < allItems.length; m++) {
        var imgItem = allItems[m];
        
        if ((imgItem instanceof Rectangle || imgItem instanceof Polygon || imgItem instanceof Oval) && 
            (imgItem.contentType === ContentType.GRAPHIC_TYPE || imgItem.contentType === ContentType.UNASSIGNED)) {
            
            // Vérifier si c'est un placeholder d'image (taille suffisante)
            var imgBounds = imgItem.geometricBounds;
            var w = imgBounds[3] - imgBounds[1];
            var h = imgBounds[2] - imgBounds[0];
            
            if (w > 20 && h > 20 && config.images && imageIndex < config.images.length) {
                var imagePath = config.images[imageIndex];
                var imgFile = new File(imagePath);
                
                if (imgFile.exists) {
                    try {
                        imgItem.place(imgFile);
                        imgItem.fit(FitOptions.FILL_PROPORTIONALLY);
                        imgItem.fit(FitOptions.CENTER_CONTENT);
                        imageIndex++;
                    } catch(e) {
                        // Ignorer erreur de placement
                    }
                }
            }
        }
    }
}

main();
