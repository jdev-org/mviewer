"use strict";

import { applyTemplate, createContentHtml } from "./info/html.js";
import { queryVectorLayers } from "./info/vector.js";
import { buildWmsRequests } from "./info/wms.js";
import { renderInfoPanels } from "./info/render.js";

/**
 * Property: _map
 *  @type {ol.Map}
 */
var _map;

/**
 * Property: _projection
 *  @type {ol.proj.Projection}
 */
var _projection;

/**
 * Property: _mvReady
 * Boolean. The getFeatureInfo state
 */
var _mvReady = true;

var _panelsTemplate = {
  "right-panel": "default",
  "bottom-panel": "default",
  "modal-panel": "default",
};

/**
 * Property: _overLayers
 * {object} hash of all overlay Layers (static)
 */
var _overLayers = {};

/**
 * Property: _queryableLayers
 * Array of {ol.layer.Layer}.
 */

var _queryableLayers = [];

/**
 * Property: _clickCoordinates
 * {Array} Coordinate of the queryMap click
 */

var _clickCoordinates = null;

var _captureCoordinatesOnClick = false;
var _typeCoordinates = "";

/**
 * Property: _toolEnabled
 * {Boolean}
 */

var _toolEnabled = false;

/**
 * Property: _featureTooltip
 * {html element} used to render features tooltips
 * with bootstrap tooltip component
 */

var _featureTooltip;

/**
 * Property: _activeTooltipLayer
 * {variant} Only one layer can use feature tooltip at
 * same time. If feature tooltip is enabled for a layer,
 * _activeTooltipLayer = layerid. Otherwhise _activeTooltipLayer = false.
 * with bootstrap tooltip component
 */

var _activeTooltipLayer;

/**
 * Property: _sourceOverlay
 * @type {ol.source.Vector}
 * Used to hightlight hovered vector features
 */

var _sourceOverlay;

/**
 * Property: _queriedFeatures
 * Array of ol.Feature
 * Used to store features retrieved on click
 */
var _queriedFeatures;

/**
 * Property: _firstlayerFeatures
 * Array of ol.Feature
 * Used to store features of firstlayer retrieved on click
 */
var _firstlayerFeatures;

/**
 * Property: _tocsortedlayers
 * Array of string
 * Used to store all layerids sorted according to the toc
 */
var _tocsortedlayers;

/**
 * Private Method: _clickOnMap
 *
 */

var _clickOnMap = function (evt) {
  $("#loading-indicator").show();
  // TODO : Clear search results
  //_clearSearchResults();
  _queryMap(evt);
};

/**
 * Private Method: _queryMap()
 * @param evt {ol.MapBrowserEvent}
 * @param options {type: 'feature' || 'map', layer: {ol.layer.Layer}, featureid:'featureid'}
 *
 */

async function _queryMap(evt, options) {
  var isClick = evt.type === "singleclick";
  $(".popup-content").html("");
  _queriedFeatures = [];
  _firstlayerFeatures = [];
  var showPin = false;
  var queryType = "map"; // default behaviour
  mviewer.clickedCoordinates = { x: 0, y: 0 };
  var coord = ol.proj.transform(evt.coordinate, _projection.getCode(), "EPSG:4326");
  mviewer.clickedCoordinates.x = coord[0];
  mviewer.clickedCoordinates.y = coord[1];
  var views = {
    "right-panel": { panel: "right-panel", layers: [] },
    "bottom-panel": { panel: "bottom-panel", layers: [] },
    "modal-panel": { panel: "modal-panel", layers: [] },
  };
  if (options) {
    // used to link elasticsearch feature with wms getFeatureinfo
    var layer = options.layer;
    var featureid = options.featureid;
    queryType = options.type;
  }
  if (!_mvReady) {
    return false;
  }
  if (_captureCoordinatesOnClick && _typeCoordinates) {
    const coordAsText =
      _typeCoordinates === "dms" ? ol.coordinate.toStringHDMS : ol.coordinate.toStringXY;
    const coordPrec = _typeCoordinates === "dms" ? 0 : 5;
    let hdms = coordAsText(coord, coordPrec);
    hdms = _typeCoordinates === "xy" ? hdms : hdms.replace(/ /g, "").replace("N", "N - ");
    $("#coordinates span").text(hdms);
  }
  // read snapping interaction
  const snapInter = mviewer
    .getMap()
    .getInteractions()
    .getArray()
    .filter((w) => w instanceof ol.interaction.Snap)[0];
  const snapActive = snapInter && snapInter?.getActive?.();
  //Request vector layers only if snaping interaction doesn't exists
  if (queryType === "map" && !snapActive) {
    var vectorResult = await queryVectorLayers({
      evt,
      map: _map,
      projection: _projection,
      overLayers: _overLayers,
      panelsTemplate: _panelsTemplate,
      configuration,
      mviewer,
      views,
      queriedFeatures: _queriedFeatures,
    });
    showPin = vectorResult.showPin;
  }

  _clickCoordinates = evt.coordinate;

  var wmsResult = buildWmsRequests({
    evt,
    map: _map,
    overLayers: _overLayers,
    queryableLayers: _queryableLayers,
    layer,
    featureid,
  });

  await Promise.all(wmsResult.requests);

  await renderInfoPanels({
    views,
    featureInfoByLayer: wmsResult.featureInfoByLayer,
    panelsTemplate: _panelsTemplate,
    tocsortedlayers: _tocsortedlayers,
    projection: _projection,
    clickCoordinates: _clickCoordinates,
    queriedFeatures: _queriedFeatures,
    setFirstlayerFeatures: function (features) {
      _firstlayerFeatures = features;
    },
    isClick,
    showPin,
    configuration,
    mviewer,
    search,
    changeSubFeatureLayer,
  });

  $("#loading-indicator").hide();
  search.clearSearchField();
  _mvReady = true;
}

var changeSubFeatureLayer = function (e) {
  _firstlayerFeatures = _queriedFeatures.filter((feature) => {
    return feature.get("mviewerid") == e.currentTarget.dataset.layerid;
  });
  mviewer.highlightSubFeature(_firstlayerFeatures[0]);
};

/**
 * Private Method: _mouseOverFeature(evt)
 * @param evt {ol.MapBrowserEvent}
 *
 */

var _mouseOverFeature = function (evt) {
  if (evt.dragging) {
    return;
  }
  if (!_featureTooltip) {
    _featureTooltip = new ol.Overlay({
      element: document.getElementById("feature-info"),
      offset: [5, -10],
    });
    mviewer.getMap().addOverlay(_featureTooltip);
  }
  _featureTooltip.setPosition(evt.coordinate);
  const popup = _featureTooltip.getElement();

  var pixel = mviewer.getMap().getEventPixel(evt.originalEvent);
  // default tooltip state or reset tooltip
  $(popup).popover("dispose");
  $("#map").css("cursor", "");
  var feature = mviewer.getMap().forEachFeatureAtPixel(pixel, function (feature, layer) {
    if (
      !layer ||
      layer.get("mviewerid") === "featureoverlay" ||
      layer.get("mviewerid") === "selectoverlay" ||
      layer.get("mviewerid") === "subselectoverlay"
    ) {
      return;
    }
    var ret = false;
    var layerid = layer.get("mviewerid");
    if (
      _activeTooltipLayer === false ||
      (_activeTooltipLayer && layerid !== _activeTooltipLayer)
    ) {
      ret = false;
    } else {
      if (feature instanceof ol.Feature) {
        //test if cluster
        if (typeof feature.get("features") === "undefined") {
          feature.set("mviewerid", layerid);
          ret = feature.clone();
        } else {
          ret = feature.get("features")[0].clone();
          var clustercount = feature.get("features").length;
          if (clustercount > 1) {
            ret.set("mv_clustercount", clustercount - 1);
          }
          ret.set("mviewerid", layerid);
        }
      } else {
        ret = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.extent.getCenter(feature.getGeometry().getExtent())
          ),
        });
        ret.setProperties(feature.getProperties());
        ret.set("mviewerid", layerid);
      }
    }
    return ret;
  });
  //hack to check if feature is yet overlayed
  var newFeature = false;
  if (!feature) {
    $("#map").css("cursor", "");
    _sourceOverlay.clear();
    return;
  }
  if (feature && _sourceOverlay.getFeatures().length > 0) {
    if (feature.getProperties() === _sourceOverlay.getFeatures()[0].getProperties()) {
      newFeature = false;
    } else {
      newFeature = true;
    }
  } else if (feature && _sourceOverlay.getFeatures().length === 0) {
    newFeature = true;
  }

  var l =
    feature && Object.keys(feature.getProperties())
      ? _overLayers[feature.get("mviewerid")]
      : false;
  if (l && l.tooltip && ((l.fields && l.fields.length) || l.tooltipcontent)) {
    $("#map").css("cursor", "pointer");
    if (newFeature && !l.nohighlight) {
      _sourceOverlay.clear();
      _sourceOverlay.addFeature(feature);
    }
    var title;
    var tooltipcontent = l.tooltipcontent;
    if (tooltipcontent) {
      if (tooltipcontent.indexOf("{{") < 0 && tooltipcontent.indexOf("}}") < 0) {
        // one specific field
        title = feature.getProperties()[tooltipcontent];
      } else {
        // a Mustache template
        title = Mustache.render(tooltipcontent, feature.getProperties());
      }
    } else {
      title =
        feature.getProperties()["name"] ||
        feature.getProperties()["label"] ||
        feature.getProperties()["title"] ||
        feature.getProperties()["nom"] ||
        feature.getProperties()[l.fields[0]];
    }

    if (!title) {
      console.warn("Invalid tooltip field: check configuration !");
    } else {
      const popup = _featureTooltip.getElement();

      const existing = bootstrap.Popover.getInstance(popup);
      if (existing) {
        existing.dispose();
      }

      const popover = new bootstrap.Popover(popup, {
        container: popup,
        placement: "top",
        animation: false,
        html: true,
        content: title,
        template: mviewer.templates.popover,
      });
      popover.show();
    }
  }
};

/* PUBLIC */

/**
 * Public Method: queryLayer
 * @param y {Long}
 * @param x {Long}
 * @param proj {String} : SRS identifier code
 * @param layer {ol.layer.Layer}
 * @param featureid {String}
 *
 */

var queryLayer = function (x, y, proj, layer, featureid) {
  x, y, 16;
  var pt = ol.proj.transform([x, y], proj, _projection.getCode());
  var p = _map.getPixelFromCoordinate(pt);
  $("#loading-indicator").show();
  _queryMap(
    { coordinate: [pt[0], pt[1]] },
    { type: "feature", layer: layer, featureid: featureid }
  );
  search.clearSearchField();
};

/**
 * Public Method: init
 */

var init = function () {
  _map = mviewer.getMap();
  _projection = mviewer.getProjection();
  _overLayers = mviewer.getLayers();
  _captureCoordinatesOnClick = configuration.getCaptureCoordinates();
  _typeCoordinates = configuration.getTypeCoordinates();
  _tocsortedlayers = $(".mv-nav-item")
    .map(function () {
      return $(this).attr("data-layerid");
    })
    .get();
  if (configuration.getConfiguration().application.templaterightinfopanel) {
    _panelsTemplate["right-panel"] =
      configuration.getConfiguration().application.templaterightinfopanel;
    _panelsTemplate["modal-panel"] =
      configuration.getConfiguration().application.templaterightinfopanel;
  }
  if (configuration.getConfiguration().application.templatebottominfopanel) {
    _panelsTemplate["bottom-panel"] =
      configuration.getConfiguration().application.templatebottominfopanel;
  }
  _sourceOverlay = mviewer.getSourceOverlay();
  $.each(_overLayers, function (i, layer) {
    if (layer.queryable) {
      _addQueryableLayer(layer);
    }
  });
};

/**
 * Public Method: enable
 *
 */

var enable = function () {
  _map.on("singleclick", _clickOnMap);
  _map.on("pointermove", _mouseOverFeature);
  _toolEnabled = true;
};

/**
 * Public Method: disable
 *
 */

var disable = function () {
  _map.un("singleclick", _clickOnMap);
  _map.un("pointermove", _mouseOverFeature);
  _toolEnabled = false;
};

/**
 * Public Method: enabled
 * returns {boolean}
 *
 */

var enabled = function () {
  return _toolEnabled;
};

/**
 * Public Method: toggle
 *
 */

var toggle = function () {
  if (_toolEnabled) {
    disable();
  } else {
    enable();
  }
};

/**
 * Public Method: toggleTooltipLayer
 * @param el {element class=layer-tooltip}
 */

var toggleTooltipLayer = function (el) {
  var a = $(el);
  if (a.find("input").val() === "false") {
    //On désactive l'ancien tooltip
    $(".layer-tooltip span.mv-checked").closest("a").find("input").val(false);
    $(".layer-tooltip span.mv-checked")
      .removeClass("mv-checked")
      .addClass("mv-unchecked");
    //On active le nouveau tooltip
    a.find("span").removeClass("mv-unchecked").addClass("mv-checked");
    a.find("input").val(true);
    _activeTooltipLayer = a.attr("data-layerid");
  } else {
    a.find("span").removeClass("mv-checked").addClass("mv-unchecked");
    a.find("input").val(false);
    _activeTooltipLayer = false;
  }
};

/**
 * Public Method: addQueryableLayer
 * @param el {oLayer}
 */

var _addQueryableLayer = function (oLayer) {
  _queryableLayers.push(oLayer.layer);
};

/**
 * Public Method: _getQueriedFeatures
 *
 */
var _getQueriedFeatures = function () {
  return _queriedFeatures;
};

  var info = {
    init: init,
    enable: enable,
    toggle: toggle,
    disable: disable,
    enabled: enabled,
    toggleTooltipLayer: toggleTooltipLayer,
    queryLayer: queryLayer,
    queryMap: _queryMap,
    formatHTMLContent: createContentHtml,
    templateHTMLContent: applyTemplate,
    addQueryableLayer: _addQueryableLayer,
    getQueriedFeatures: _getQueriedFeatures,
  };

window.info = info;

export {
  _queryMap as queryMap,
  _addQueryableLayer as addQueryableLayer,
  _getQueriedFeatures as getQueriedFeatures,
  applyTemplate as templateHTMLContent,
  createContentHtml as formatHTMLContent,
  disable,
  enable,
  enabled,
  info,
  init,
  queryLayer,
  toggle,
  toggleTooltipLayer,
};

export default info;
