var comments = (function () {
  let _config;

  let _commonDrawStyleCmt;

  let _map;

  let _url;

  let _panelComments = false;

  let _nbTextArea = 0;

  let _drawIntCmt;

  let _vectorDrawCmt;

  let _sourceDrawCmt;

  let _modCommentsEnabled = false;

  var _initCommentsTool = () => {
    // Get all configurations
    _config = mviewer.customComponents.comments.config.options.mviewer.comments;
    _map = mviewer.getMap();
    _url = _config.layer.url;
    _sourceDrawCmt = new ol.source.Vector({
      format: new ol.format.GML({
        featureNS: _config.layer.namespace,
        featureType: _config.layer.id,
        srsName: "EPSG:2154",
      }),
    });

    _commonDrawStyleCmt = _drawStyleBaseCmt(_config);

    _vectorDrawCmt = new ol.layer.Vector({
      source: _sourceDrawCmt,
      style: function (feature) {
        return _commonDrawStyleCmt[feature.getGeometry().getType()];
      },
    });

    _map.addLayer(_vectorDrawCmt);

    _initButtons();

    document.addEventListener("keypress", function (event) {
      if (event.key === "Escape" || event.key === "Esc") {
        console.log("Esc");
        console.log(event.key);
        if (_drawIntCmt) {
          console.log("remove");
          _map.removeInteraction(_drawIntCmt);
        }
      }
    });
  };

  var _initButtons = () => {
    // Get the toolsbar and the new button to add
    let toolsBar = document.getElementById("toolstoolbar");
    let commentsBtnList = document.getElementById("commentsOptionsBtn");

    // Add the button on the toolsbar
    toolsBar.appendChild(commentsBtnList);

    let availableTypesComments = ["Point", "LineString", "Polygon"];

    let commentsToolsOptions = document.createElement("div");
    commentsToolsOptions.id = "commentstoolsoptions";
    commentsToolsOptions.style.display = "none";
    commentsToolsOptions.className = "btn-group btn-group-sm";
    commentsToolsOptions.role = "group";
    commentsToolsOptions.ariaLabel = true;

    for (const type of availableTypesComments) {
      let classIcon = "fas fa-map-pin";
      let dataOriginalTitle = "Point";
      if (type === "LineString") {
        classIcon = "fas fa-bezier-curve";
        dataOriginalTitle = "Ligne";
      } else if (type === "Polygon") {
        classIcon = "fas fa-draw-polygon";
        dataOriginalTitle = "Polygon";
      }

      let divCommentsBtn = document.createElement("button");
      divCommentsBtn.id = `comments${type}Btn`;
      divCommentsBtn.title = "";
      divCommentsBtn.className = "btn btn-default button-tools";
      divCommentsBtn.setAttribute("data-original-title", dataOriginalTitle);

      divCommentsBtn.addEventListener("click", function () {
        if (_drawIntCmt) {
          _map.removeInteraction(_drawIntCmt);
        }
        _addDrawInteractionCmt(type);
      });

      let divCommentBtnI = document.createElement("i");
      divCommentBtnI.className = classIcon;

      divCommentsBtn.appendChild(divCommentBtnI);

      commentsToolsOptions.appendChild(divCommentsBtn);
    }

    let contentWrapper = document.getElementById("page-content-wrapper");
    contentWrapper.appendChild(commentsToolsOptions);

    commentsBtnList.addEventListener("click", function () {
      _toggle();
    });
  };

  var _drawStyleBaseCmt = (config) => {
    const commonLineStrokeCmt = new ol.style.Stroke({
      color: config?.lineStroke || "#3399cc",
      width: 3,
    });
    const commonPointStrokeCmt = new ol.style.Stroke({
      color: config?.lineStroke || "#3399cc",
      width: 3,
    });
    const commonFillCmt = new ol.style.Fill({
      color: "rgba(0, 0, 255, 0.1)",
    });
    const pointFillCmt = new ol.style.Fill({
      color: config?.pointFill || "rgba(0, 0, 255, 0.1)",
    });

    return {
      Polygon: [
        // Polygon line style
        new ol.style.Style({
          stroke: commonLineStrokeCmt,
          fill: commonFillCmt,
        }),
        // Polygon point style
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: 5,
            fill: pointFillCmt,
            stroke: commonPointStrokeCmt,
          }),
          geometry: function (feature) {
            const coordinates = feature.getGeometry().getCoordinates()[0];
            if (coordinates.length > 2) {
              return new ol.geom.MultiPoint(coordinates);
            }
          },
        }),
      ],
      LineString: [
        // LineString line style
        new ol.style.Style({
          stroke: commonLineStrokeCmt,
          // fill: commonFillCmt,
        }),
        // LineString point style
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: 5,
            fill: pointFillCmt,
            stroke: commonPointStrokeCmt,
          }),
        }),
      ],
      Point: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: pointFillCmt,
          stroke: commonPointStrokeCmt,
        }),
      }),
    };
  };

  let currentFeature;

  var _addDrawInteractionCmt = (type) => {
    if (!_panelComments) {
      _drawIntCmt = new ol.interaction.Draw({
        source: _sourceDrawCmt,
        type: type,
        style: _commonDrawStyleCmt[type],
      });

      _map.addInteraction(_drawIntCmt);

      _panelComments = true;

      _drawIntCmt.on(
        "drawend",
        function (event) {
          _map.removeInteraction(_drawIntCmt);

          currentFeature = event.feature;

          currentFeature.set("drawNow", true);

          _createCommentsPanel(currentFeature);
        },
        this
      );
    }
  };

  let divCommentsPanel;

  let buttonSaveCancel;

  var _createCommentsPanel = (feature) => {
    let featureUid = feature.getGeometry().ol_uid;
    let featureType = feature.getGeometry().getType();
    let featurePos;

    if (featureType === "Point") {
      featurePos = feature.getGeometry().getCoordinates();
    }

    divCommentsPanel = document.createElement("div");
    // Add the uid feature to the div id to make it unique
    divCommentsPanel.id = `commentsPanel_${featureUid}`;

    if (featurePos) {
      const featPosPixel = _map.getPixelFromCoordinate(featurePos);

      // Div position if point
      divCommentsPanel.style.position = "fixed";
      divCommentsPanel.style.top = `${featPosPixel[1] + 20}px`;
      divCommentsPanel.style.left = `${featPosPixel[0]}px`;
    } else {
      // Div position if linestring or polygon
      divCommentsPanel.style.position = "fixed";
      divCommentsPanel.style.top = "100px";
      divCommentsPanel.style.left = "100px";
    }

    // Div style
    divCommentsPanel.style.padding = "4px";
    divCommentsPanel.style.borderRadius = "5px";
    divCommentsPanel.style.border = "1px solid black";
    divCommentsPanel.style.backgroundColor = "white";

    // Make the div flexible
    divCommentsPanel.style.display = "flex";
    divCommentsPanel.style.flexDirection = "column";
    divCommentsPanel.style.alignItems = "center";
    divCommentsPanel.style.justifyContent = "space-between";

    // Title for the comment div
    let divCommentsP = document.createElement("p");
    divCommentsP.innerHTML = "Ajout de commentaires";
    divCommentsP.style.fontSize = "16px";
    divCommentsP.style.margin = "10px";

    divCommentsPanel.appendChild(divCommentsP);

    // Dropdown list => custom select
    let customSelectComments = _createSelectComments(featureUid);

    divCommentsPanel.appendChild(customSelectComments);

    // Dropdown list => save and cancel button
    buttonSaveCancel = _createSaveCancelButton();

    divCommentsPanel.appendChild(buttonSaveCancel);

    // Dropdown list => comments
    let divCommentsSection = _createCommentsSection();

    divCommentsPanel.insertBefore(divCommentsSection, buttonSaveCancel);

    // Add the div to the "page-content-wrapper"
    document.getElementById("page-content-wrapper").appendChild(divCommentsPanel);
  };

  var _createSaveCancelButton = () => {
    let buttonSave = document.createElement("button");
    buttonSave.type = "button";
    buttonSave.className = "btn btn-success";
    buttonSave.textContent = "Sauvegarder";

    let buttonCancel = document.createElement("button");
    buttonCancel.type = "button";
    buttonCancel.className = "btn btn-danger";
    buttonCancel.textContent = "Annuler";

    let divButton = document.createElement("div");
    divButton.style.position = "relative";
    divButton.style.display = "flex";
    divButton.style.justifyContent = "space-between";
    divButton.style.width = "100%";
    divButton.style.padding = "10px";
    divButton.style.marginTop = "auto";

    buttonSave.addEventListener("click", function () {
      console.log(currentFeature);
      if (currentFeature) {
        _transactWFSComments(currentFeature, function (response) {});
      } else {
        console.error("Feature is not defined!");
      }
    });

    buttonCancel.addEventListener("click", function () {
      _disableDrawToolCmt();
    });

    divButton.appendChild(buttonCancel);
    divButton.appendChild(buttonSave);

    return divButton;
  };

  var _createSelectComments = () => {
    // Custom select
    let contentSelectComments = _config.data.features.types;

    let divDropdown = document.createElement("div");
    divDropdown.className = "dropdown";

    let divDropdownSelect = document.createElement("div");
    divDropdownSelect.className = "select";

    let span = document.createElement("span");
    span.className = "selected";
    span.innerHTML = "Choisir un type";

    let spanDiv = document.createElement("div");
    spanDiv.className = "caret";

    let divDropdownUl = document.createElement("ul");
    divDropdownUl.className = "menu";

    divDropdownSelect.appendChild(span);
    divDropdownSelect.appendChild(spanDiv);

    divDropdown.appendChild(divDropdownSelect);
    divDropdown.appendChild(divDropdownUl);

    for (const value of contentSelectComments) {
      let divDropdownLi = document.createElement("li");
      divDropdownLi.id = "selectCustomDropdownMegalis";
      divDropdownLi.textContent = value;

      divDropdownUl.appendChild(divDropdownLi);
    }

    const select = divDropdown.querySelector(".select");
    const caret = divDropdown.querySelector(".caret");
    const menu = divDropdown.querySelector(".menu");
    const options = divDropdown.querySelectorAll(".menu li");
    const selected = divDropdown.querySelector(".selected");

    select.addEventListener("click", () => {
      select.classList.toggle("select-clicked");

      caret.classList.toggle("caret-rotate");

      menu.classList.toggle("menu-open");
    });

    options.forEach((option) => {
      option.addEventListener("click", () => {
        selected.innerText = option.innerText;
        select.classList.remove("selected-clicked");
        caret.classList.remove("caret-rotate");
        menu.classList.remove("menu-open");

        options.forEach((option) => {
          option.classList.remove("active");
        });

        option.classList.add("active");
      });
    });

    return divDropdown;
  };

  var _getComments = (commentId) => {
    let comment = document.getElementById(`commentsArea_${commentId}`);
    let res = null;

    if (comment && comment.value !== "") {
      res = comment.value;
    }

    return res;
  };

  var _getCurrentUser = () => {};

  var _createCommentsSection = () => {
    _nbTextArea += 1;

    let divTextArea = document.createElement("div");
    divTextArea.id = `textArea_${_nbTextArea}`;
    divTextArea.style.flexDirection = "column";
    divTextArea.style.alignItems = "center";
    divTextArea.style.display = "flex";

    let smallCountsTextArea = document.createElement("small");
    smallCountsTextArea.id = `countsTextArea_${_nbTextArea}`;
    smallCountsTextArea.textContent = "0/254 caractères utilisés";
    smallCountsTextArea.style.display = "block";
    smallCountsTextArea.style.marginTop = "0px";
    smallCountsTextArea.style.color = "gray";
    smallCountsTextArea.style.textAlign = "center";

    let textArea = document.createElement("textarea");
    textArea.placeholder = "Saisir un commentaire...";
    textArea.id = `commentsArea_${_nbTextArea}`;
    textArea.maxLength = "254";
    textArea.cols = "45";
    textArea.rows = "5";

    textArea.addEventListener("input", function (event) {
      _updateCharacterCount(event);
    });

    // Style comments
    textArea.style.resize = "none";

    divTextArea.appendChild(textArea);
    divTextArea.appendChild(smallCountsTextArea);

    let addTextArea = document.createElement("div");
    addTextArea.id = `plusComments_${_nbTextArea}`;
    addTextArea.className = "glyphicon glyphicon-plus";
    addTextArea.style.cursor = "pointer";
    addTextArea.style.marginBottom = "4px";

    addTextArea.addEventListener("click", function () {
      addTextArea.style.display = "none";
      _createCommentsSection();
    });

    if (_nbTextArea < 4) {
      divTextArea.appendChild(addTextArea);
    }

    divCommentsPanel.insertBefore(divTextArea, buttonSaveCancel);

    return divTextArea;
  };

  var _transactWFSComments = (feature, callback) => {
    let s;
    let node;
    let str;

    if (!feature || !feature.getGeometry()) {
      console.error("Invalid feature or geometry is missing :", feature);
      return;
    }

    var formatWFS = new ol.format.WFS();
    var formatSource = _sourceDrawCmt.getFormat();

    // Clone and clean feature
    var f = feature.clone();
    f.setId(feature.getId());
    f.unset("boundedBy");
    f.unset("mviewerid");

    const selectCustom = document.getElementById("selectCustomDropdownMegalis");

    // Set attributes
    // Type
    f.set("type", selectCustom.textContent);
    // Username
    f.set("user", "");
    // Comments 1
    f.set("commentaire_1", _getComments(1));
    // Comments 2
    f.set("commentaire_2", _getComments(2));
    // Comments 3
    f.set("commentaire_3", _getComments(3));
    // Comments 4
    f.set("commentaire_4", _getComments(4));

    // Insert
    node = formatWFS.writeTransaction([f], null, null, formatSource);

    s = new XMLSerializer();
    str = s.serializeToString(node);

    // Send to API
    fetch(_url + "wfs", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: str,
    })
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.log(error);
      });
    // $.ajax(_url + "wfs", {
    //   type: "POST",
    //   dataType: "xml",
    //   processData: false,
    //   contentType: "text/xml",
    //   data: str,
    // })
    //   .done(function (resxml) {
    //     if (
    //       !resxml ||
    //       (resxml.activeElement &&
    //         resxml.activeElement.nodeName === "ows:ExceptionReport")
    //     ) {
    //       _clearForm();
    //       //TODO mviewer.customLayers.elagage_edit.vectorSource.clear(true);
    //       mviewer.alert("Une erreur s'est produite lors de l'envoi", "alert-warning");
    //       console.error(resxml);
    //     } else {
    //       callback(resxml);
    //     }
    //   })
    //   .fail(function (jqXHR, textStatus) {
    //     _clearForm();
    //     //TODO mviewer.customLayers.elagage_edit.vectorSource.clear(true);
    //     mviewer.alert("Une erreur s'est produite lors de l'envoi", "alert-warning");
    //     console.error(textStatus);
    //   });
  };

  var _updateCharacterCount = (event) => {
    const id = event.currentTarget.id;
    const number = id.split("_")[1];
    const contentTextArea = document.getElementById(`commentsArea_${number}`).value;
    let charCount = document.getElementById(`countsTextArea_${number}`);
    charCount.textContent = `${contentTextArea.length}/254 caractères utilisés`;

    if (contentTextArea.length === 254) {
      charCount.style.color = "red";
    } else {
      charCount.style.color = "gray";
    }
  };

  var _toggle = function () {
    if (_modCommentsEnabled) {
      // If the module comments is active
      // Useless to call this method below
      // Todo => find out why?
      //mviewer.tools.info.enable();
      _disableDrawToolCmt();
    } else {
      // If the module comments is not active
      mviewer.tools.info.disable();
      _enableDrawToolCmt();
    }
  };

  var _enableDrawToolCmt = () => {
    _modCommentsEnabled = true;

    if (document.getElementById("commentsOptionsBtn")) {
      document.getElementById("commentsOptionsBtn").classList.add("active");
    }
    if (document.getElementById("commentstoolsoptions")) {
      document.getElementById("commentstoolsoptions").style.display = "block";
    }
  };

  var _disableDrawToolCmt = () => {
    _modCommentsEnabled = false;

    _map.removeInteraction(_drawIntCmt);

    _sourceDrawCmt.clear();

    _clearDrawToolCmt();
  };

  var _clearDrawToolCmt = () => {
    if (document.getElementById("commentsOptionsBtn")) {
      document.getElementById("commentsOptionsBtn").classList.remove("active");
    }
    if (document.getElementById("commentsPointBtn")) {
      document.getElementById("commentsPointBtn").classList.remove("active");
    }
    if (document.getElementById("commentsLineStringBtn")) {
      document.getElementById("commentsLineStringBtn").classList.remove("active");
    }
    if (document.getElementById("commentsPolygonBtn")) {
      document.getElementById("commentsPolygonBtn").classList.remove("active");
    }

    document.getElementById("commentstoolsoptions").style.display = "none";

    if (divCommentsPanel) {
      divCommentsPanel.remove();
    }
    _panelComments = false;
    _nbTextArea = 0;
  };

  return {
    init: _initCommentsTool,
  };
})();

new CustomComponent("comments", comments.init);
