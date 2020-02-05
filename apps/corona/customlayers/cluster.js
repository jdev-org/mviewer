{
    mviewer.customLayers.cluster = {};
    var cl = mviewer.customLayers.cluster;
    cl.layer = new ol.layer.Heatmap({
        source: new ol.source.Vector({
            url: "https://gis.jdev.fr/geoserver/corona/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=corona%3Adatacorona&outputFormat=application%2Fjson",
            format: new ol.format.GeoJSON()
        }),
        blur: 38,
        radius: 6,
        weight: function(feature) {
            var name = feature.get('confirmed');
            var confirmed = parseFloat(name);
            return confirmed;
        }        
    });


    cl.handle = function(clusters, views) {
        if (clusters.length > 0 && clusters[0].properties.features) {
            var features = clusters[0].properties.features;
            var elements = [];
            var l = mviewer.getLayer("heatmap");
            features.forEach(function(feature, i) {
                elements.push({
                    properties: feature.getProperties()
                });
            });
            var html;
            if (l.template) {
                html = info.templateHTMLContent(elements, l);
            } else {
                html = info.formatHTMLContent(elements, l);
            }
            var view = views["right-panel"];
            view.layers.push({
                "id": view.layers.length + 1,
                "firstlayer": true,
                "manyfeatures": (features.length > 1),
                "nbfeatures": features.length,
                "name": l.name,
                "layerid": "heatmap",
                "theme_icon": l.icon,
                "html": html
            });
        }

    };
}