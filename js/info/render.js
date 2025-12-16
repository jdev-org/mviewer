"use strict";

import { applyTemplate, createContentHtml, customizeHTML } from "./html.js";
import {
  checkMimeType,
  orderViewsLayersByMap,
  parseWMSGetFeatureInfo,
} from "./utils.js";

async function renderInfoPanels({
  views,
  featureInfoByLayer,
  panelsTemplate,
  tocsortedlayers,
  projection,
  clickCoordinates,
  queriedFeatures,
  setFirstlayerFeatures,
  isClick,
  showPin,
  configuration,
  mviewer,
  search,
  changeSubFeatureLayer,
}) {
  var showPinFlag = showPin;

  for (const response of featureInfoByLayer) {
    var layerinfos = response.layerinfos;
    var panel = layerinfos.infospanel;
    if (configuration.getConfiguration().mobile) {
      panel = "modal-panel";
    }
    var contentType = response.contenttype;
    var layerResponse = response.response;
    var mimeType = checkMimeType(layerResponse, contentType);
    var name = layerinfos.name;
    var layerid = layerinfos.layerid;
    var theme_icon = layerinfos.icon;
    var infohighlight = layerinfos.infohighlight;
    var html_result = [];

    var xml = null;
    var html = null;

    switch (mimeType) {
      case "text/html":
        if (
          typeof layerResponse === "string" &&
          layerResponse.search("<!--nodatadetect--><!--nodatadetect-->") < 0 &&
          layerResponse.search("<!--nodatadetect-->\n<!--nodatadetect-->") < 0
        ) {
          html = layerResponse;
          showPinFlag = true; // no geometry in html
        }
        break;
      case "application/vnd.ogc.gml":
        if ($.isXMLDoc(layerResponse)) {
          xml = layerResponse;
        } else {
          xml = $.parseXML(layerResponse);
        }
        break;
      case "application/vnd.esri.wms_raw_xml":
      case "application/vnd.esri.wms_featureinfo_xml":
        if ($.isXMLDoc(layerResponse)) {
          xml = layerResponse;
        } else {
          xml = $.parseXML(layerResponse);
        }
        break;
      default:
        mviewer.toast(
          "" + name + "",
          "Format de réponse non pris en charge : " + contentType + " "
        );
    }
    if (html) {
      var features = $(layerResponse).find(".mv-features li").addClass("item");
      if (features.length == 0) {
        html_result.push('<li class="item active">' + layerResponse + "</li>");
      } else {
        $(features).each(function (i, feature) {
          html_result.push(feature);
        });
        html_result = customizeHTML(html_result, features.length);
      }
    } else if (xml) {
      var getFeatureInfo = parseWMSGetFeatureInfo(xml, layerid);
      if (!getFeatureInfo.hasGeometry || !getFeatureInfo.features.length || !infohighlight) {
        showPinFlag = true;
      } else {
        queriedFeatures.push.apply(queriedFeatures, getFeatureInfo.features);
      }
      var features = getFeatureInfo.features;
      var languages = configuration.getLanguages();
      if (features.length > 0) {
        if (panelsTemplate[panel] == "allintabs") {
          features.forEach(function (feature, index) {
            if (Object.keys(layerinfos.template).some((key) => key !== "url")) {
              html_result.push(applyTemplate([feature], layerinfos));
            } else if (languages.length > 1) {
              languages.forEach(function (lang) {
                var template_field_name = "template_" + lang;
                if (layerinfos[template_field_name]) {
                  html_result.push(applyTemplate([feature], layerinfos, lang));
                } else if (Object.keys(layerinfos.template).some((key) => key !== "url")) {
                  html_result.push(applyTemplate([feature], layerinfos));
                } else {
                  html_result.push(createContentHtml([feature], layerinfos));
                }
              });
            } else {
              html_result.push(createContentHtml([feature], layerinfos));
            }
          });
        } else if (Object.keys(layerinfos.template).some((key) => key !== "url")) {
          html_result.push(applyTemplate(features, layerinfos));
        } else if (languages.length > 1) {
          languages.forEach(function (lang) {
            var template_field_name = "template_" + lang;
            if (layerinfos[template_field_name]) {
              html_result.push(applyTemplate(features, layerinfos, lang));
            } else if (Object.keys(layerinfos.template).some((key) => key !== "url")) {
              html_result.push(applyTemplate(features, layerinfos));
            } else {
              html_result.push(createContentHtml(features, layerinfos));
            }
          });
        } else {
          html_result.push(createContentHtml(features, layerinfos));
        }
      }
    }
    if (mviewer.customLayers[layerid] && mviewer.customLayers[layerid].handle) {
      await mviewer.customLayers[layerid].handle(features, views);
    } else if (html_result.length > 0) {
      if (panelsTemplate[panel] == "allintabs") {
        for (var i = 0; i < html_result.length; i++) {
          views[panel].layers.push({
            panel: panel,
            id: views[panel].layers.length + 1,
            firstlayer: false,
            manyfeatures: false,
            nbfeatures: 1,
            name: name,
            layerid: layerid + "_" + i,
            initiallayerid: layerid,
            theme_icon: theme_icon,
            html: html_result[i],
            pin: showPinFlag,
          });
        }
      } else {
        views[panel].layers.push({
          panel: panel,
          id: views[panel].layers.length + 1,
          firstlayer: false,
          manyfeatures: features.length > 1,
          nbfeatures: features.length,
          name: name,
          layerid: layerid,
          theme_icon: theme_icon,
          html: html_result.join(""),
          pin: showPinFlag,
        });
      }
    }
  }

  var infoLayers = [];
  for (var panel in views) {
    infoLayers = infoLayers.concat(views[panel].layers);
  }
  mviewer.setInfoLayers(infoLayers);

  var firstlayerFeatures = [];

  $.each(views, function (panel, view) {
    if (view.layers.length > 0) {
      view.layers = orderViewsLayersByMap(views[panel].layers, tocsortedlayers);
      view.layers[0].firstlayer = true;
      var template = "";
      if (configuration.getConfiguration().mobile) {
        const templateMobileInfo =
          configuration.getConfiguration().application.templatemobileinfopanel;
        if (templateMobileInfo === "brut") {
          template = Mustache.render(mviewer.templates.featureInfo.brut, view);
        } else {
          template = Mustache.render(mviewer.templates.featureInfo.accordion, view);
        }
      } else {
        template = Mustache.render(mviewer.templates.featureInfo[panelsTemplate[panel]], view);
      }
      $("#" + panel + " .popup-content").append(template);

      const firstLayer = view.layers.find((layer) => layer.firstlayer);

      var firstlayer_id = "";
      if (firstLayer) {
        firstlayer_id =
          panelsTemplate[panel] === "allintabs"
            ? firstLayer.initiallayerid
            : firstLayer.layerid;
      }

      let panel_header = $("#" + panel + " .mv-header h6");

      if (panelsTemplate[panel] === "allintabs" || panelsTemplate[panel] === "default") {
        panel_header.attr("i18n", "layers." + firstlayer_id);
      }

      var layer_picker_container_selector = "#sidebar-wrapper";
      if (configuration.getConfiguration().mobile) {
        layer_picker_container_selector = "#thematic-modal";
      }

      var layer_picker_container = $(layer_picker_container_selector);

      if (layer_picker_container.length === 0) {
        throw new Error("sidebar-wrapper not found");
      }
      const layer_title_el = layer_picker_container.find(
        `[i18n="${panel_header.attr("i18n")}"]`
      );

      if (layer_title_el.length > 1) {
        throw new Error("i18n layers id has been used in more than one html element");
      }

      var title = layer_title_el.text();
      panel_header.text(title);

      if (configuration.getLanguages().length > 1) {
        $("#" + panel + " .nav-tabs li")
          .toArray()
          .reverse()
          .forEach(function (item, index) {
            mviewer.setInfoPanelTitle(
              $(item).find("a"),
              panel,
              `layers.${$(item).attr("data-layerid")}`
            );
          });
      }

      const infoPanelReadyEvent = new CustomEvent("infopanel-ready", {
        detail: {
          panel: panel,
        },
      });
      document.dispatchEvent(infoPanelReadyEvent);

      if (configuration.getConfiguration().mobile) {
        $("#modal-panel").modal("show");
      } else if (!$("#" + panel).hasClass("active")) {
        $("#" + panel).toggleClass("active");
      }

      $("#" + panel + " .popup-content iframe[class!='chartjs-hidden-iframe']").each(
        function (index) {
          $(this).on("load", function () {
            $(this).closest("li").find(".mv-iframe-indicator").hide();
          });
          $(this)
            .closest("li")
            .append(
              [
                '<div class="mv-iframe-indicator" >',
                '<div class="loader">Loading...</div>',
                "</div>",
              ].join("")
            );
        }
      );
      $("#" + panel + " .popup-content img").click(function () {
        mviewer.popupPhoto($(this).attr("src"));
      });
      $("#" + panel + " .popup-content img")
        .on("vmouseover", function () {
          $(this).css("cursor", "pointer");
        })
        .attr("title", "Cliquez pour agrandir cette image");
      $(".popup-content .nav-tabs li>a").tooltip("dispose").tooltip({
        animation: false,
        trigger: "hover",
        container: "body",
        placement: "right",
        html: true,
        template: mviewer.templates.tooltip,
      });

      firstlayerFeatures = queriedFeatures.filter((feature) => {
        return feature.get("mviewerid") == view.layers[0].layerid;
      });
      setFirstlayerFeatures(firstlayerFeatures);

      $(".carousel.slide").on("slide.bs.carousel", function (e) {
        $(e.currentTarget)
          .find(".counter-slide")
          .text($(e.relatedTarget).attr("data-counter"));
        var selectedFeature = queriedFeatures.filter((feature) => {
          return feature.ol_uid == e.relatedTarget.id;
        });
        if (!_.isEmpty(queriedFeatures) && !queriedFeatures[0].get("features")) {
          mviewer.highlightSubFeature(selectedFeature[0]);
        }
      });

      if (configuration.getConfiguration().mobile) {
        $(".panel-heading").on("click", function (e) {
          changeSubFeatureLayer(e);
        });
      } else {
        $(".nav-tabs li").on("click", function (e) {
          changeSubFeatureLayer(e);
        });
      }
    } else {
      $("#" + panel).removeClass("active");
    }
  });

  if (queriedFeatures[0] && queriedFeatures[0].get("features")) {
    mviewer.highlightSubFeature(queriedFeatures[0]);
  } else {
    mviewer.highlightFeatures(queriedFeatures);
    if (firstlayerFeatures[0]) {
      mviewer.highlightSubFeature(firstlayerFeatures[0]);
    }
  }

  if (showPinFlag || (!queriedFeatures.length && !firstlayerFeatures.length && !isClick)) {
    mviewer.showLocation(
      projection.getCode(),
      clickCoordinates[0],
      clickCoordinates[1],
      !showPinFlag ? search.options.marker : showPinFlag
    );
  } else {
    $("#mv_marker").hide();
  }
}

export { renderInfoPanels };
