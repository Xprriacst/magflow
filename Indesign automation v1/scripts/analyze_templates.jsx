/*
 * Magflow - analyse deterministe de gabarits InDesign.
 * Entree : TEMPLATE_ANALYSIS_CONFIG (JSON).
 * Sortie : chemin `output_path` de la configuration.
 */
(function () {
    function readText(path) {
        var file = new File(path);
        if (!file.exists || !file.open("r")) {
            throw new Error("Fichier introuvable: " + path);
        }
        file.encoding = "UTF-8";
        var value = file.read();
        file.close();
        return value;
    }

    function writeText(path, value) {
        var file = new File(path);
        var folder = file.parent;
        if (!folder.exists && !folder.create()) {
            throw new Error("Dossier de sortie inaccessible: " + folder.fsName);
        }
        if (!file.open("w")) {
            throw new Error("Fichier de sortie inaccessible: " + path);
        }
        file.encoding = "UTF-8";
        file.write(value);
        file.close();
    }

    function quote(value) {
        return '"' + String(value)
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t") + '"';
    }

    function stringify(value) {
        var parts;
        var key;
        var i;
        if (value === null) return "null";
        if (typeof value === "string") return quote(value);
        if (typeof value === "number" || typeof value === "boolean") return String(value);
        if (value instanceof Array) {
            parts = [];
            for (i = 0; i < value.length; i++) parts.push(stringify(value[i]));
            return "[" + parts.join(",") + "]";
        }
        parts = [];
        for (key in value) {
            if (value.hasOwnProperty(key) && typeof value[key] !== "undefined") {
                parts.push(quote(key) + ":" + stringify(value[key]));
            }
        }
        return "{" + parts.join(",") + "}";
    }

    function unique(values) {
        var result = [];
        var seen = {};
        var i;
        for (i = 0; i < values.length; i++) {
            if (!seen[values[i]]) {
                seen[values[i]] = true;
                result.push(values[i]);
            }
        }
        result.sort();
        return result;
    }

    function labelledItems(doc) {
        var items = doc.allPageItems;
        var result = [];
        var i;
        var item;
        var label;
        for (i = 0; i < items.length; i++) {
            item = items[i];
            label = "";
            try { label = item.label || ""; } catch (ignoreLabel) {}
            if (label !== "") result.push({ item: item, label: label });
        }
        return result;
    }

    function analyze(entry) {
        var result = {
            id: entry.id,
            filename: entry.filename,
            imageSlots: [],
            textPlaceholders: [],
            fonts: [],
            swatches: [],
            metadata: { labelledBlocks: [] },
            pageCount: 0,
            errors: []
        };
        var doc = null;
        try {
            var source = new File(entry.file_path);
            if (!source.exists) throw new Error("Gabarit introuvable: " + entry.file_path);
            doc = app.open(source, false);
            result.pageCount = doc.pages.length;

            var labelled = labelledItems(doc);
            var i;
            var type;
            for (i = 0; i < labelled.length; i++) {
                type = labelled[i].item.constructor.name;
                result.metadata.labelledBlocks.push({ label: labelled[i].label, type: type });
                if (type === "TextFrame") result.textPlaceholders.push(labelled[i].label);
                else if (type === "Rectangle" || type === "Oval" || type === "Polygon") {
                    result.imageSlots.push(labelled[i].label);
                }
            }
            result.textPlaceholders = unique(result.textPlaceholders);
            result.imageSlots = unique(result.imageSlots);

            for (i = 0; i < doc.fonts.length; i++) result.fonts.push(doc.fonts[i].name);
            result.fonts = unique(result.fonts);
            for (i = 0; i < doc.swatches.length; i++) result.swatches.push(doc.swatches[i].name);
            result.swatches = unique(result.swatches);
        } catch (error) {
            result.errors.push(String(error));
        } finally {
            if (doc !== null) {
                try { doc.close(SaveOptions.NO); } catch (ignoreClose) {}
            }
        }
        return result;
    }

    var configPath = $.getenv("TEMPLATE_ANALYSIS_CONFIG");
    if (!configPath) throw new Error("TEMPLATE_ANALYSIS_CONFIG non defini");
    var config = eval("(" + readText(configPath) + ")");
    var output = { templates: [] };
    var index;
    for (index = 0; index < config.templates.length; index++) {
        output.templates.push(analyze(config.templates[index]));
    }
    writeText(config.output_path, stringify(output));
}());
