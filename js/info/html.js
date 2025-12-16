"use strict";

function customizeHTML(html, featurescount, lang_to_add = "", template_to_use = "none") {
  var tmp = document.createElement("div");
  $(tmp).append(html);

  // activate first item, except when multiple langs, activate the first one of the active lang
  $(tmp).find("li.item").first().addClass("active");

  switch (template_to_use) {
    case "none":
      $(tmp).find("li.item").first().addClass("active");

      break;

    case "one":
      // activate first element
      // for retrocompatibility reasons we ignore the number of langs
      $(tmp).find("li.item").first().addClass("active");

      break;

    case "multi":
      // some quick checks
      if (lang_to_add != "" || configuration.getLanguages().includes(lang_to_add)) {
        //mark current lang elements
        $(tmp).find("li.item").slice(0, featurescount).addClass(`mst_${lang_to_add}`);
      }

      // hide all items
      $(tmp).find("li.item").hide();

      $(tmp)
        .find(`li.item.mst_${configuration.getLang()}`)
        .slice(0, featurescount)
        .css("display", "");

      // do NOT use .show() as it will set display to something we dont want
      $(tmp)
        .find("li.item.mst_" + configuration.getLang())
        .first()
        .addClass("active");

      // hide other languages slides
      $(tmp)
        .find("li.item")
        .not(".mst_" + configuration.getLang())
        .addClass("hidden-item")
        .removeClass("item");

      break;

    default:
      // weird cases, only activate first element
      $(tmp).find("li.item").first().addClass("active");
      break;
  }

  //manipulate html to add data-counter attribute to each feature.
  if (featurescount > 1) {
    if (
      configuration.getLanguages().length > 1 &&
      lang_to_add !== "" &&
      configuration.getLanguages().includes(lang_to_add)
    ) {
      $(tmp)
        .find("li.item.mst_" + lang_to_add)
        .each(function (i, item) {
          $(item).attr("data-counter", i + 1 + "/" + featurescount);
          $(item).addClass("carousel-item");
        });
    } else {
      $(tmp)
        .find("li.item")
        .each(function (i, item) {
          $(item).attr("data-counter", i + 1 + "/" + featurescount);
          $(item).addClass("carousel-item");
        });
    }
  }
  return [$(tmp).html()];
}

function getAlias(value, aliases, fields) {
  var alias = "";
  if (aliases) {
    alias = aliases[$.inArray(value, fields)];
  } else {
    alias = value.substring(0, 1).toUpperCase() + value.substring(1, 50).toLowerCase();
  }
  return alias;
}

function createContentHtml(features, olayer) {
  var html = "";
  var counter = 0;
  features.forEach(function (feature) {
    counter += 1;
    var attributes = feature.getProperties();
    var fields = olayer.fields
      ? olayer.fields
      : $.map(attributes, function (value, key) {
          if (typeof value !== "object") {
            return key;
          }
        });
    var featureTitle =
      feature.getProperties().title ||
      feature.getProperties().name ||
      feature.getProperties()[fields[0]];
    var li =
      '<li id="' +
      feature.ol_uid +
      '" class="item" ><div class="gml-item" ><div class="gml-item-title">';
    if (typeof featureTitle != "undefined") {
      li += featureTitle;
    }
    li += "</div>";

    var aliases = olayer.fields ? olayer.aliases : false;
    fields.forEach(function (f) {
      if (attributes[f] && f != fields[0]) {
        // si valeur != null
        var fieldValue = attributes[f];
        if (
          typeof fieldValue == "string" &&
          (fieldValue.indexOf("http://") == 0 || fieldValue.indexOf("https://") == 0)
        ) {
          if (fieldValue.toLowerCase().match(/(.jpg|.png|.bmp)/)) {
            li +=
              "<a onclick=\"mviewer.popupPhoto('" +
              fieldValue +
              "')\" >" +
              '<img class="popphoto" src="' +
              fieldValue +
              '" alt="image..." ></a>';
          } else {
            li +=
              '<p><a href="' +
              fieldValue +
              '" target="_blank">' +
              getAlias(f, aliases, fields) +
              "</a></p>";
          }
        } else {
          li +=
            '<div class="gml-item-field"><div class="gml-item-field-name">' +
            getAlias(f, aliases, fields) +
            '</div><div class="gml-item-field-value" > ' +
            fieldValue +
            "</div></div>";
        }
      }
    });
    li += "</div></li>";
    html += $(li)[0].outerHTML + "\n";
  });
  return customizeHTML(html, features.length);
}

function applyTemplate(olfeatures, olayer, lang = "") {
  var tpl = olayer["template" + (lang == "" ? "" : "_" + lang)];
  var _json = function (str) {
    var result = null;
    try {
      result = JSON.parse(str);
    } catch (e) {
      result = str;
    }
    return result;
  };
  var obj = { features: [] };
  var activeAttributeValue = false;
  // if attributeControl is used for this layer, get the active attribute value and
  // set this value as property like 'value= true'. This allows use this value in Mustache template
  if (olayer.attributefilter && olayer.layer.getSource().getParams()["CQL_FILTER"]) {
    var activeFilter = olayer.layer.getSource().getParams()["CQL_FILTER"];
    activeAttributeValue = activeFilter
      .split(olayer.attributeoperator)
      .map((e) => e.replace(/[\' ]/g, ""))[1];
  }
  olfeatures.forEach(function (feature) {
    olayer.jsonfields.forEach(function (fld) {
      if (feature.get(fld)) {
        var json = _json(feature.get(fld));
        // convert String value to JSON value
        // Great for use in Mustache template
        feature.set(fld, json);
      }
    });
    if (activeAttributeValue) {
      feature.set(activeAttributeValue, true);
    }
    var geometryName = feature.getGeometryName ? feature.getGeometryName() : "";
    var excludedPropNames = [
      "fields_kv",
      "serialized",
      "feature_ol_uid",
      "mviewerid",
      geometryName,
    ];
    var extractFeaturePropertiesFn = function (properties) {
      return Object.keys(properties).reduce((filteredProps, propertyName) => {
        var value = properties[propertyName];
        if (!excludedPropNames.includes(propertyName) && typeof value !== "object") {
          filteredProps[propertyName] = value;
        }
        return filteredProps;
      }, {});
    };

    // add a key_value array with all the fields, allowing to iterate through all fields in a mustache template
    var fields_kv = function () {
      var properties = extractFeaturePropertiesFn(this);
      return Object.entries(properties).map(([key, value]) => {
        return { key, value };
      });
    };
    // except  vector tile feature
    if (feature.setProperties) {
      feature.setProperties({ fields_kv: fields_kv });
      // add a serialized version of the object so it can easily be passed through HTML GET request
      // you can deserialize it with `JSON.parse(decodeURIComponent(feature.getProperties().serialized()))`
      // when data is the serialized data
      var serialized = function () {
        return encodeURIComponent(
          JSON.stringify(extractFeaturePropertiesFn(feature.getProperties()))
        );
      };
      feature.setProperties({ serialized: serialized });
    }
    // attach ol_uid to identify feature in DOM (not all features have a feature id as property)
    obj.features.push({ ...feature.getProperties(), feature_ol_uid: feature.ol_uid });
  });
  var rendered = Mustache.render(tpl, obj);

  // none: no template given, need auto generate
  // one: one template given, need to use it
  // multi: multiple templates given, need to use them

  var template_to_use = "none";

  if (!olayer.template) {
    template_to_use = "one";
  } else if (olayer[`template_${lang}`]) {
    template_to_use = "multi";
  }

  return customizeHTML(rendered, olfeatures.length, lang, template_to_use);
}

export { applyTemplate, createContentHtml, customizeHTML, getAlias };
