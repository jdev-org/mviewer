{
    mviewer.customLayers.multipoly = {};
     mviewer.customLayers.multipoly.legend = {items: [{
            geometry: "Polygon",
            label: "",
            styles: [new ol.style.Style({
                fill: new ol.style.Fill({
                        color: "rgba(255, 0, 0, 0.48)"
                }),
                stroke: new ol.style.Stroke({
                        color: "rgb(255, 0, 0)",
                        width: 1
                }),
            })]
        }]
    };
        
     mviewer.customLayers.multipoly.vectorSource = new ol.source.Vector({
        url: "demo/multigeom/data/poly.geojson",
        format: new ol.format.GeoJSON()
    });    
    
     mviewer.customLayers.multipoly.layer = new ol.layer.Vector({
            source:  mviewer.customLayers.multipoly.vectorSource,
            style: function(feature, resolution) {
                        return  mviewer.customLayers.multipoly.legend.items[0].styles;
            }
    });
    mviewer.customLayers.multipoly.handle = false;
    }