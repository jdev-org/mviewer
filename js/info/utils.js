"use strict";

function checkMimeType(content, contentType) {
  var mimeType = contentType.split(";")[0];
  //Test string content to check if content is XML or HTML
  if (typeof content === "string") {
    if (content.indexOf("<wfs:FeatureCollection") > 0) {
      mimeType = "application/vnd.ogc.gml";
    } else if (content.indexOf("<div") >= 0) {
      mimeType = "text/html";
    }
  }
  return mimeType;
}

function orderViewsLayersByMap(viewsLayers, tocsSortedLayers) {
  var mapLayers = mviewer.getMap().getLayers().getArray();
  mapLayers = mapLayers.map((l) => l.getProperties().mviewerid).filter((l) => l);

  var mapLayersOrder = [];
  viewsLayers.forEach((lv) => {
    if (mapLayers.indexOf(lv.layerid) > -1) {
      mapLayersOrder[mapLayers.indexOf(lv.layerid)] = lv;
    } else {
      mapLayersOrder[lv.id] = lv; // when display template is allintabs all layers are virtually renamed (one fictive layer per feature)
    }
  });
  var infoLayers = mapLayersOrder.filter((f) => f);
  var orderedlayers = [];
  var tocs = tocsSortedLayers || [];
  if (
    configuration.getConfiguration().application.sortlayersinfopanel &&
    configuration.getConfiguration().application.sortlayersinfopanel == "toc"
  ) {
    //toc order
    // les couches de la toc dans l'ordre
    for (var j = 0; j < infoLayers.length; j++) {
      // layers not shown in toc but queried first
      if (
        tocs.indexOf(
          infoLayers[j].initiallayerid
            ? infoLayers[j].initiallayerid
            : infoLayers[j].layerid
        ) === -1
      ) {
        orderedlayers.push(infoLayers[j]);
      }
    }
    for (var i = 0; i < tocs.length; i++) {
      for (var k = 0; k < infoLayers.length; k++) {
        if (
          (infoLayers[k].initiallayerid
            ? infoLayers[k].initiallayerid
            : infoLayers[k].layerid) == tocs[i]
        ) {
          orderedlayers.push(infoLayers[k]);
        }
      }
    }
  } else {
    // ordered with legend (=map order)
    orderedlayers = infoLayers.reverse();
  }
  return orderedlayers;
}

function parseWMSGetFeatureInfo(xml, layerid) {
  var features = new ol.format.WMSGetFeatureInfo().readFeatures(xml);
  var hasGeometry = true;
  features.forEach((feature) => {
    // set layer mviewerid for features from WMS layers (already present for vector layers)
    feature.set("mviewerid", layerid);
    // if getfeatureinfo does not return geometry try to set geometry with center of extent
    if (feature.getGeometry() === undefined) {
      var properties = feature.getProperties();
      hasGeometry = false;
      for (var p in properties) {
        if (Array.isArray(properties[p]) && properties[p].length === 4) {
          var center = ol.extent.getCenter(properties[p]);
          feature.setGeometry(new ol.geom.Point(center));
          hasGeometry = true;
        }
      }
    }
  });
  return {
    features: features,
    hasGeometry: hasGeometry,
  };
}

export { checkMimeType, orderViewsLayersByMap, parseWMSGetFeatureInfo };
