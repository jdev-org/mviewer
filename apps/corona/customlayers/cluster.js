{
    mviewer.customLayers.cluster = {};
    var cl = mviewer.customLayers.cluster;
    cl.legend = { items:[] };
    var uniqueStyle = [
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                fill: new ol.style.Fill({
                    color: 'rgba(231, 76, 60, 0.7)'
                })
            })
        }),
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({
                    color: 'rgba(236, 240, 241,7.0)'
                })
            })
        })
    ];
    var manyStyle = function (radius2, size) {
        return [
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
        var sum=0;
        feature.get('features').forEach(function(e){
            var props = e.getProperties();
            if(props.confirmed) {
                sum = sum + parseInt(props.confirmed);
            }
        });

        var size = sum;
        var max_radius = 40;
        var max_value = 1000;
        //var radius = 10 + Math.sqrt(size)*(max_radius / Math.sqrt(max_value));
        radius2 = sum / 100;
        if (size == 1) {
            return uniqueStyle;
        } else {
            return manyStyle(radius2, size);
        }
    };

    cl.layer = new ol.layer.Vector({
        source: new ol.source.Cluster({
            distance: 50,
            source: new ol.source.Vector({
                url: "https://gis.jdev.fr/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeNames=corona:datacorona&outputFormat=application/json&srsName=EPSG:3857&BBOX=-6966165.009797825%2C-3297187.6521093627%2C21211581.097249553%2C10928660.556101361",
                format: new ol.format.GeoJSON()
            })
        }),
        style: clusterStyle

    });
    cl.handle = function(clusters, views) {
        if (clusters.length > 0 && clusters[0].properties.features) {
            var features = clusters[0].properties.features;
            var elements = [];
            var l = mviewer.getLayer("cluster");
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
                "layerid": "cluster",
                "theme_icon": l.icon,
                "html": html
            });
        }

    };
}