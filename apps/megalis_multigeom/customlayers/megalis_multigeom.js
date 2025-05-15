{
    // GÃ©nÃ©ration de la liste des lÃ©gendes
    mviewer.customLayers.mv_zdep_label = {};
    var mv_zdep_label = mviewer.customLayers.mv_zdep_label; 
    mv_zdep_label.legend = {items: [{
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
        
    // ------------------------------------------------------------------------------------------------------
    // Ne pas modifier ci-aprÃ¨s
    // Appel de la source de donnÃ©e et affichage du style sur la carte
    mv_zdep_label.vectorSource = new ol.source.Vector({
        url: "apps/megalis_multigeom/data/data.geojson",
        format: new ol.format.GeoJSON()
    });    
    // mv_zdep_label.vectorSource = new ol.source.Vector({
    //     format: new ol.format.GeoJSON(),
    //     loader: function(extent, resolution, projection) {
    //         var proj = projection.getCode();
    //         var url = "apps/megalis_multigeom/data/data.geojson";
    //         var xhr = new XMLHttpRequest();
    //         xhr.open('GET', url);
    //         var onError = function() {
    //             mv_zdep_label.vectorSource.removeLoadedExtent(extent);
    //         }
    //         xhr.onerror = onError;
    //         xhr.onload = function() {
    //           if (xhr.status == 200) {
    //                 mv_zdep_label.vectorSource.addFeatures(
    //                     mv_zdep_label.vectorSource.getFormat().readFeatures(xhr.responseText));
    //           } else {
    //             onError();
    //           }
    //         }
    //         xhr.send();
    //       }
    // });
    
    mviewer.customLayers.mv_zdep_label.layer = new ol.layer.Vector({
            source: mv_zdep_label.vectorSource,
            style: function(feature, resolution) {
                        return mv_zdep_label.legend.items[0].styles;
            }
    });
    mviewer.customLayers.mv_zdep_label.handle = false;
    }