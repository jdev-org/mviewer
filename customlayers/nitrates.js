{
mviewer.customLayers.nitrates = {};
var uniqueStyle = function(feature) {
    var colorClass;
    // get feature value
    var val = feature.get("nitrate_2018");
    // convert to get flaot value
    val = parseFloat(val);
    // get style class value
    if (val < 2.1) {
        colorClass = [19, 183, 228]; //blue
    } else if (val > 50.0) {
        colorClass = [255, 0, 4]; //red
    } else if (val > 2.0 && val < 10.01) {
        colorClass = [47, 206, 55]; //green
    } else if (val > 10.0 && val < 25.01) {
        colorClass = [245, 233, 2]; //yellow
    } else if (val > 25.0 && val < 50.01) {
        colorClass = [255, 133, 3]; //orange
    }
    // create {ol.style.Style} return as array
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

    return style
};

var manyStyle = function (radius, radius2, size) {
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
    var radius = 10 + Math.sqrt(size)*(max_radius / Math.sqrt(max_value));
    var radius2 = radius *80 /100 ;
    if (size < 5 ) {
        return uniqueStyle(feature.get("features")[0]);
    } else {
        return manyStyle(radius, radius2, size);
    }
};
mviewer.customLayers.nitrates.layer = new ol.layer.Vector({
    source: new ol.source.Cluster({
        distance: 50,
        source: new ol.source.Vector({
            url: "data/nitrates.geojson",
            format: new ol.format.GeoJSON()
        })
    }),
    style: clusterStyle

});
}