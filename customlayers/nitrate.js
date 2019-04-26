{
    mviewer.customLayers.nitrate = {};
    var cl = mviewer.customLayers.nitrate;
    /**
     * Get class color and return {ol.style.Style}
     * @param {ol.Feature} feature 
     */
    var getClass = function(feature) {
        // set default class
        var colorClass = 'rgba(231, 76, 60, 0.7)';
        var features = feature ? feature.get("features") : null;
        if (feature && features.length === 1) {
            t = true;
            // get feature value            
            var val = features[0].get("value");
            // convert to get flaot value
            val = parseFloat(val);
            // get style class value
            if (val < 2) {
                colorClass = [19, 183, 228]; //blue
            } else if (val >= 50.0) {
                colorClass = [255, 0, 4]; //red
            } else if (val >= 2 && val < 10) {
                colorClass = [47, 206, 55]; //green
            } else if (val >= 10 && val < 25) {
                colorClass = [245, 233, 2]; //yellow
            } else if (val >= 25 && val < 50) {
                colorClass = [255, 133, 3]; //orange
            }
        }
        // create {ol.style.Style}
        var style = [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                fill: new ol.style.Fill({
                    color: colorClass,
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 255, 255, 0.8)',
                    width: 3
                })
            })
        })];
        return style;
    };
    var manyStyle = function(radius, radius2, size) {
        return [
            new ol.style.Style({
                image: new ol.style.Circle({
                    radius: radius,
                    fill: new ol.style.Fill({
                        color: 'rgba(236, 240, 241,0.7)'
                    })
                }),
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 255, 0.1)'
                })
            }),
            new ol.style.Style({
                image: new ol.style.Circle({
                    radius: radius2,
                    fill: new ol.style.Fill({
                        color: 'rgba(231, 76, 60, 0.7)'
                    })
                }),
                text: new ol.style.Text({
                    font: '12px roboto_regular, Arial, Sans-serif',
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            })
        ];
    };
    var clusterStyle = function(feature) {
        var size = feature.get('features').length;
        var max_radius = 40;
        var max_value = 500;
        var radius = 10 + Math.sqrt(size) * (max_radius / Math.sqrt(max_value));
        var radius2 = radius * 80 / 100;
        // return {ol.style.Style} as array create by function
        if (size == 1) {
            return getClass(feature);
        } else {
            return manyStyle(radius, radius2, size);
        }
    };
    // create layer as {ol.layer.Vector}
    cl.layer = new ol.layer.Vector({
        source: new ol.source.Cluster({
            distance: 50,
            source: new ol.source.Vector({
                url: "data/nitrate.geojson",
                format: new ol.format.GeoJSON()
            })
        }),
        style: clusterStyle

    });
    cl.handle = function(clusters, views) {
        if (clusters.length > 0 && clusters[0].properties.features) {
            var features = clusters[0].properties.features;
            var elements = [];
            var l = mviewer.getLayer("nitrate");
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
            var view = views["bottom-panel"];
            view.layers.push({
                "id": view.layers.length + 1,
                "firstlayer": true,
                "manyfeatures": (features.length > 1),
                "nbfeatures": features.length,
                "name": l.name,
                "layerid": "nitrate",
                "theme_icon": l.icon,
                "html": html
            });
        }

    };
}