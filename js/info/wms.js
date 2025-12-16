"use strict";

function buildWmsRequests({
  evt,
  map,
  overLayers,
  queryableLayers,
  layer,
  featureid,
}) {
  var featureInfoByLayer = [];
  var visibleLayers = [];
  if (layer) {
    visibleLayers.push(overLayers[layer].layer);
  } else {
    visibleLayers = $.grep(queryableLayers, function (l, i) {
      return l.getVisible();
    });
  }
  var urls = [];
  var params;
  for (var i = 0; i < visibleLayers.length; i++) {
    if (visibleLayers[i] instanceof ol.layer.BaseVector === false) {
      params = {
        INFO_FORMAT: overLayers[visibleLayers[i].get("mviewerid")].infoformat,
        FEATURE_COUNT: overLayers[visibleLayers[i].get("mviewerid")].featurecount,
      };
      var url = visibleLayers[i]
        .getSource()
        .getFeatureInfoUrl(
          evt.coordinate,
          map.getView().getResolution(),
          map.getView().getProjection(),
          params
        );
      var urlParams = new URLSearchParams(url);
      var cql = new URLSearchParams(url).get("CQL_FILTER");
      if (layer && featureid) {
        // create new cql to insert feature id
        const attributeFilter =
          overLayers[layer].searchid + "%3D%27" + featureid + "%27";
        // create new cql filter
        urlParams.delete("CQL_FILTER");
        cql = `&CQL_FILTER=${cql || ""}${cql ? " AND " : ""}${attributeFilter}`;
        // force to decode to string result and avoid unreadable params
        url = decodeURIComponent(urlParams.toString()) + cql;
      }
      urls.push({
        url: url,
        layerinfos: overLayers[visibleLayers[i].get("mviewerid")],
      });
    }
  }

  var requests = [];

  urls.forEach(function (request) {
    var _ba_ident = sessionStorage.getItem(request.layerinfos.url);
    requests.push(
      $.ajax({
        url: mviewer.ajaxURL(request.url),
        layer: request.layerinfos,
        beforeSend: function (req) {
          if (_ba_ident) req.setRequestHeader("Authorization", "Basic " + btoa(_ba_ident));
        },
        success: function (response, textStatus, request) {
          featureInfoByLayer.push({
            response: response,
            layerinfos: this.layer,
            contenttype: request.getResponseHeader("Content-Type"),
          });
        },
      })
    );
  });

  return { requests, featureInfoByLayer };
}

export { buildWmsRequests };
