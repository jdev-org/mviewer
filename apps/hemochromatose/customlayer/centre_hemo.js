let layer = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'apps/hemochromatose/data/hemochromatose.geojson',
        format: new ol.format.GeoJSON()
    }),
    style: new ol.style.Style({
        image: new ol.style.Icon({
            scale: 0.15,
            opacity:0.9,
            src: 'apps/hemochromatose/img/centreMap.svg',
        })
    })
});


new CustomLayer('centre_hemo', layer);