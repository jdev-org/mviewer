{
    // GÃ©nÃ©ration de la liste des lÃ©gendes
    mviewer.customLayers.mv_zdep_label_point = {};
    var mv_zdep_label_point = mviewer.customLayers.mv_zdep_label_point; 
    mv_zdep_label_point.legend = {items: [{
            geometry: "Point",
            label: "",
            styles: [new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: "rgba(0, 0, 0, 0.48)"
                    }),
                    stroke: new ol.style.Stroke({
                        color: "rgb(0, 0, 0)",
                        width: 1
                    })
                })
            })]
        }]
    };
        
    // ------------------------------------------------------------------------------------------------------
    // Ne pas modifier ci-aprÃ¨s
    // Appel de la source de donnÃ©e et affichage du style sur la carte
    mv_zdep_label_point.vectorSource = new ol.source.Vector({
        url: "apps/megalis_multigeom/data/data_point.geojson",
        format: new ol.format.GeoJSON()
    });    
    // mv_zdep_label_point.vectorSource = new ol.source.Vector({
    //     format: new ol.format.GeoJSON(),
    //     loader: function(extent, resolution, projection) {
    //         var proj = projection.getCode();
    //         var url = "apps/megalis_multigeom/data/data.geojson";
    //         var xhr = new XMLHttpRequest();
    //         xhr.open('GET', url);
    //         var onError = function() {
    //             mv_zdep_label_point.vectorSource.removeLoadedExtent(extent);
    //         }
    //         xhr.onerror = onError;
    //         xhr.onload = function() {
    //           if (xhr.status == 200) {
    //                 mv_zdep_label_point.vectorSource.addFeatures(
    //                     mv_zdep_label_point.vectorSource.getFormat().readFeatures(xhr.responseText));
    //           } else {
    //             onError();
    //           }
    //         }
    //         xhr.send();
    //       }
    // });
    
    mviewer.customLayers.mv_zdep_label_point.layer = new ol.layer.Vector({
            source: mv_zdep_label_point.vectorSource,
            style: function(feature, resolution) {
                        return mv_zdep_label_point.legend.items[0].styles;
            }
    });
    mviewer.customLayers.mv_zdep_label_point.handle = false;
    }