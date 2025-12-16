"use strict";

import { applyTemplate, createContentHtml } from "./html.js";

async function queryVectorLayers({
  evt,
  map,
  projection,
  overLayers,
  panelsTemplate,
  configuration,
  mviewer,
  views,
  queriedFeatures,
}) {
  var showPin = false;
  var pixel = evt.pixel;
  var vectorLayers = {};
  var f_idx = 0;

  map.forEachFeatureAtPixel(pixel, function (feature, layer) {
    var l = layer.get("mviewerid");
    if (
      l &&
      l != "featureoverlay" &&
      l != "selectoverlay" &&
      l != "subselectoverlay" &&
      l != "elasticsearch"
    ) {
      var queryable = overLayers[l].queryable;
      if (queryable) {
        if (layer.get("infohighlight")) {
          queriedFeatures.push(feature);
        } else {
          showPin = true;
        }
        if (vectorLayers[l] && vectorLayers[l].features) {
          vectorLayers[l].features.push(feature);
        } else {
          if (overLayers[l] && panelsTemplate[overLayers[l].infospanel] == "allintabs") {
            l = l + "_#" + f_idx;
            f_idx++;
          }
          vectorLayers[l] = { features: [] };
          vectorLayers[l].features.push(feature);
        }
      }
    }
  });

  for (var layerid in vectorLayers) {
    var originLayer =
      layerid in overLayers ? layerid : layerid.substring(0, layerid.lastIndexOf("_#"));
    if (mviewer.customLayers[originLayer] && mviewer.customLayers[originLayer].handle) {
      mviewer.customLayers[originLayer].handle(vectorLayers[originLayer].features, views);
    } else if (
      mviewer.customControls[originLayer] &&
      mviewer.customControls[originLayer].handle
    ) {
      mviewer.customControls[originLayer].handle(vectorLayers[originLayer].features);
    } else {
      var l = overLayers[originLayer];
      let features = vectorLayers[layerid]?.features;
      if (l && l.type === "sensorthings") {
        let parentDomEl = document.querySelector(
          `#layers-container [data-layerid='${layerid}']`
        );
        l.layer.sensorthings.setLastQuery(evt);
        //call features information
        async function waitAllSensorFeatures(features) {
          return new Promise((resolve) => {
            let sensorFeatures = features.map((f) => {
              let sensorFeature = new SensorFeature(f, l.layer);
              return sensorFeature.startSensorProcess();
            });
            Promise.all(sensorFeatures).then((responses) => resolve(responses));
          });
        }
        features = await waitAllSensorFeatures(features);
        if (parentDomEl.querySelector(".mv-layer-options").style.display === "none") {
          parentDomEl.querySelector(`.icon-options`).click();
        }
      }

      if (l) {
        var panel = l.infospanel;
        if (configuration.getConfiguration().mobile) {
          panel = "modal-panel";
        }
        var name = l.name;
        var theme_icon = l.icon;
        var id = views[panel].layers.length + 1;
        //Create html content from features
        var html_result = [];
        // check if l.template has a field other than url
        if (Object.keys(l.template).some((key) => key !== "url")) {
          // contains an  actual template not just url
          html_result.push(applyTemplate(features, l));
        } else {
          var languages = configuration.getLanguages();

          if (languages.length < 2) {
            // 0: if lang param is empty, 1: one lang in config
            html_result.push(createContentHtml(features, l));
          } else {
            if (l.template) {
              // actually provided multiple mst
              languages.forEach(function (lang) {
                var template_field_name = "template_" + lang;
                if (l[template_field_name]) {
                  html_result.push(applyTemplate(features, l, lang));
                } else {
                  html_result.push(createContentHtml(features, l));
                }
              });
            } else {
              // no mst found
              html_result.push(createContentHtml(features, l));
            }
          }
        }

        //Set view with layer info & html formated features
        views[panel].layers.push({
          panel: panel,
          id: id,
          firstlayer: false, // firstlayer attribute is calculated after ordering layers with orderViewsLayersByMap
          manyfeatures: features.length > 1,
          nbfeatures: features.length,
          name: name,
          layerid: layerid,
          initiallayerid: originLayer,
          theme_icon: theme_icon,
          html: html_result,
        });
      }
    }
  }

  return { showPin };
}

export { queryVectorLayers };
