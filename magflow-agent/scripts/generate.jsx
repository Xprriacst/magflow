// Script InDesign simple qui marche - sans JSON.parse
#target indesign

function parseSimpleJSON(jsonString) {
    // Parser JSON simple - extraction des valeurs clés
    try {
        alert("🔍 Début parsing JSON...");
        
        // Méthode simple : extraire juste les valeurs dont on a besoin
        var config = {};
        
        // Extraire project_id
        var projectMatch = jsonString.match(/"project_id":\s*"([^"]+)"/);
        if (projectMatch) {
            config.project_id = projectMatch[1];
            alert("✅ Project ID trouvé: " + config.project_id);
        }
        
        // Extraire prompt
        var promptMatch = jsonString.match(/"prompt":\s*"([^"]+)"/);
        if (promptMatch) {
            config.prompt = promptMatch[1];
            alert("✅ Prompt trouvé: " + config.prompt);
        }
        
        // Extraire text_content
        var textMatch = jsonString.match(/"text_content":\s*"([^"]+)"/);
        if (textMatch) {
            config.text_content = textMatch[1];
        }
        
        // Extraire subtitle
        var subtitleMatch = jsonString.match(/"subtitle":\s*"([^"]+)"/);
        if (subtitleMatch) {
            config.subtitle = subtitleMatch[1];
        }
        
        // Extraire rectangle_index
        var rectangleMatch = jsonString.match(/"rectangle_index":\s*"([^"]+)"/);
        config.rectangle_index = rectangleMatch ? parseInt(rectangleMatch[1]) : 0;
        
        // Extraire template
        var templateMatch = jsonString.match(/"template":\s*"([^"]+)"/);
        if (templateMatch) {
            config.template = templateMatch[1];
            alert("✅ Template trouvé: " + config.template);
        }
        alert("🔍 Rectangle sélectionné: " + config.rectangle_index);
        
        // Extraire images (chercher les chemins absolus)
        config.images = [];
        var imageMatches = jsonString.match(/"\/[^"]+\.(jpg|jpeg|png|gif|tiff|psd)"/gi);
        if (imageMatches) {
            for (var i = 0; i < imageMatches.length; i++) {
                // Enlever les guillemets
                var imagePath = imageMatches[i].substring(1, imageMatches[i].length - 1);
                config.images.push(imagePath);
            }
            alert("✅ Images trouvées: " + config.images.length);
        }
        
        alert("✅ Parsing terminé avec succès");
        return config;
        
    } catch (e) {
        alert("❌ Erreur parsing JSON: " + e.toString());
        return null;
    }
}

function main() {
    try {
        alert("🚀 Début du script InDesign");
        
        var basePath = $.getenv("MAGFLOW_DATA_DIR");
        if (!basePath) {
            alert("❌ MAGFLOW_DATA_DIR n'est pas configuré");
            return false;
        }
        var templatesPath = $.getenv("MAGFLOW_TEMPLATES_DIR") || (basePath + "/templates");
        
        // Trouver le dernier projet
        var uploadsFolder = new Folder(basePath + "/uploads");
        if (!uploadsFolder.exists) {
            alert("❌ Dossier uploads non trouvé");
            return false;
        }
        
        var projectFolders = uploadsFolder.getFiles();
        var latestProject = null;
        var latestTime = 0;
        
        for (var i = 0; i < projectFolders.length; i++) {
            if (projectFolders[i] instanceof Folder) {
                var configFile = new File(projectFolders[i] + "/config.json");
                if (configFile.exists) {
                    var modTime = configFile.modified.getTime();
                    if (modTime > latestTime) {
                        latestTime = modTime;
                        latestProject = projectFolders[i];
                    }
                }
            }
        }
        
        if (!latestProject) {
            alert("❌ Aucun projet trouvé");
            return false;
        }
        
        alert("✅ Projet trouvé: " + latestProject.name);
        
        // Lire la config
        var configFile = new File(latestProject + "/config.json");
        configFile.open("r");
        var configData = configFile.read();
        configFile.close();
        
        // Parser le JSON avec notre fonction
        var config = parseSimpleJSON(configData);
        if (!config) {
            alert("❌ Erreur parsing config");
            return false;
        }
        
        alert("✅ Config parsée: " + config.project_id);
        
        // Ouvrir le template (dynamique depuis config ou fallback)
        var templateName = config.template || "template-mag-simple-1808.indt";
        var templatePath = templatesPath + "/" + templateName;
        var templateFile = new File(templatePath);
        
        if (!templateFile.exists) {
            alert("❌ Template non trouvé: " + templatePath);
            return false;
        }
        
        alert("📄 Template trouvé, taille: " + templateFile.length + " bytes");
        alert("📄 Tentative d'ouverture du template...");
        
        try {
            var doc = app.open(templateFile);
            alert("✅ Template ouvert avec succès!");
            alert("📄 Document pages: " + doc.pages.length);
        } catch (openError) {
            alert("❌ Erreur ouverture template: " + openError.toString());
            return false;
        }
        
        // Remplacer le texte selon le template utilisé
        try {
            app.findTextPreferences = NothingEnum.NOTHING;
            app.changeTextPreferences = NothingEnum.NOTHING;
            
            // Détecter quel template on utilise depuis le nom du fichier
            var templateName = templateFile.name;
            alert("🔍 Template détecté: " + templateName);
            
            if (templateName.indexOf("template-mag-simple-1808") !== -1) {
                // Template 1: {{TITRE}}, {{SOUS-TITRE}}, {{ARTICLE}}
                
                // 1. Remplacer "{{TITRE}}" 
                app.findTextPreferences.findWhat = "{{TITRE}}";
                app.changeTextPreferences.changeTo = config.prompt || "Nouveau titre";
                var foundTitre = doc.changeText();
                alert("✅ {{TITRE}} remplacé: " + foundTitre.length + " occurrence(s)");
                
                app.findTextPreferences = NothingEnum.NOTHING;
                app.changeTextPreferences = NothingEnum.NOTHING;
                
                // 2. Remplacer "{{SOUS-TITRE}}"
                app.findTextPreferences.findWhat = "{{SOUS-TITRE}}";
                var subtitleText = config.subtitle || "Sous-titre par défaut";
                app.changeTextPreferences.changeTo = subtitleText;
                var foundSousTitre = doc.changeText();
                alert("✅ {{SOUS-TITRE}} remplacé: " + foundSousTitre.length + " occurrence(s)");
                
                app.findTextPreferences = NothingEnum.NOTHING;
                app.changeTextPreferences = NothingEnum.NOTHING;
                
                // 3. Remplacer "{{ARTICLE}}"
                app.findTextPreferences.findWhat = "{{ARTICLE}}";
                app.changeTextPreferences.changeTo = config.text_content || "Contenu de l'article";
                var foundArticle = doc.changeText();
                alert("✅ {{ARTICLE}} remplacé: " + foundArticle.length + " occurrence(s)");
                
            } else if (templateName.indexOf("template-mag-simple-2-1808") !== -1) {
                // Template 2: seulement {{ARTICLE}}
                
                app.findTextPreferences.findWhat = "{{ARTICLE}}";
                var fullText = config.prompt || "Titre";
                if (config.text_content) {
                    fullText += "\n\n" + config.text_content;
                }
                app.changeTextPreferences.changeTo = fullText;
                var foundArticle = doc.changeText();
                alert("✅ {{ARTICLE}} remplacé: " + foundArticle.length + " occurrence(s)");
                
            } else {
                // Template générique avec TITRE et ARTICLE (nouveaux templates)
                alert("🔍 Template générique, recherche TITRE et ARTICLE");
                
                // Remplacer TITRE
                app.findTextPreferences.findWhat = "TITRE";
                app.changeTextPreferences.changeTo = config.prompt || "Nouveau titre";
                var foundTitre = doc.changeText();
                alert("✅ TITRE remplacé: " + foundTitre.length + " occurrence(s)");
                
                app.findTextPreferences = NothingEnum.NOTHING;
                app.changeTextPreferences = NothingEnum.NOTHING;
                
                // Remplacer ARTICLE
                app.findTextPreferences.findWhat = "ARTICLE";
                app.changeTextPreferences.changeTo = config.text_content || "Contenu de l'article";
                var foundArticle = doc.changeText();
                alert("✅ ARTICLE remplacé: " + foundArticle.length + " occurrence(s)");
            }
            
            app.findTextPreferences = NothingEnum.NOTHING;
            app.changeTextPreferences = NothingEnum.NOTHING;
            
        } catch (textError) {
            alert("⚠️ Erreur texte: " + textError.toString());
        }
        
        // Debug: vérifier qu'on arrive à la partie image
        alert("🔍 DEBUT section image - Images config: " + (config.images ? config.images.length : 0));
        
        // Placer l'image (si elle existe)
        if (config.images && config.images.length > 0) {
            try {
                // Debug: écrire dans log
                var logFile = new File(basePath + "/debug_indesign.log");
                logFile.open("a");
                logFile.writeln("=== DEBUG IMAGE " + new Date() + " ===");
                logFile.writeln("📊 Rectangles: " + doc.pages[0].rectangles.length);
                logFile.writeln("🔍 Image path: " + config.images[0]);
                logFile.close();
                
                var imageFile = new File(config.images[0]);
                
                if (imageFile.exists) {
                    if (doc.pages[0].rectangles.length > 0) {
                        // Utiliser le rectangle choisi par l'utilisateur
                        var rectangleIndex = config.rectangle_index || 0;
                        
                        if (rectangleIndex < doc.pages[0].rectangles.length) {
                            var rectangle = doc.pages[0].rectangles[rectangleIndex];
                            rectangle.place(imageFile);
                            rectangle.fit(FitOptions.CONTENT_TO_FRAME);
                            rectangle.fit(FitOptions.CENTER_CONTENT);
                            alert("✅ Image placée dans rectangle " + rectangleIndex);
                        } else {
                            alert("❌ Rectangle " + rectangleIndex + " n'existe pas");
                        }
                    } else {
                        alert("⚠️ Pas de rectangle pour l'image");
                    }
                } else {
                    alert("⚠️ Image non trouvée: " + config.images[0]);
                }
            } catch (imageError) {
                alert("⚠️ Erreur image: " + imageError.toString());
            }
        }
        
        // Sauvegarder
        try {
            var outputFolder = new Folder(basePath + "/output");
            if (!outputFolder.exists) {
                outputFolder.create();
            }
            
            var outputFile = new File(outputFolder + "/" + config.project_id + ".indd");
            doc.save(outputFile);
            doc.close();
            
            alert("🎉 SUCCÈS! Document créé: " + config.project_id + ".indd");
            return true;
            
        } catch (saveError) {
            alert("❌ Erreur sauvegarde: " + saveError.toString());
            try { doc.close(); } catch(e) {}
            return false;
        }
        
    } catch (error) {
        alert("❌ ERREUR GÉNÉRALE: " + error.toString());
        return false;
    }
}

// Exécuter
main();
