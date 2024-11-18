var comments = (function () {

    let _config;

    let _commonDrawStyleCmt;

    let _map;

    let _nbTextArea = 0;

    let _drawIntCmt;

    let _vectorDrawCmt;

    let _sourceDrawCmt;

    let _modCommentsEnabled = false;

    var _initCommentsTool = () => {
        // Get all configurations
        _config = mviewer.customComponents.comments.config.options.mviewer.comments;
        _map = mviewer.getMap();
        _sourceDrawCmt = new ol.source.Vector();

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
            if (event.key === "Escape" || event.key === "Esc") {
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

        for (const type of availableTypesComments) {

            let classIcon = "fas fa-map-pin";
            let dataOriginalTitle = "Point";
            if (type === "LineString") {
                classIcon = "fas fa-bezier-curve";
                dataOriginalTitle = "Ligne"
            } else if (type === "Polygon") {
                classIcon = "fas fa-draw-polygon";
                dataOriginalTitle = "Polygon"
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
        };

        let contentWrapper = document.getElementById("page-content-wrapper");
        contentWrapper.appendChild(commentsToolsOptions);

        commentsBtnList.addEventListener("click", function () {
            _toggle();
        });
    };

    var _drawStyleBaseCmt = (config) => {
        const commonLineStrokeCmt = new ol.style.Stroke ({
            color: config?.lineStroke || "#3399cc",
            width: 3,
        });
        const commonPointStrokeCmt = new ol.style.Stroke ({
            color: config?.lineStroke || "#3399cc",
            width: 3,
        });
        const commonFillCmt = new ol.style.Fill ({
            color: "rgba(0, 0, 255, 0.1)",
        });
        const pointFillCmt = new ol.style.Fill ({
            color: config?.pointFill || "rgba(0, 0, 255, 0.1)",
        });
        
        return {
            "Polygon": [
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
            "LineString": [
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
            "Point": new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: pointFillCmt,
                    stroke: commonPointStrokeCmt,
                }),
            }),
        };
    }

    var _addDrawInteractionCmt = (type) => {
           
        _drawIntCmt = new ol.interaction.Draw({
            source: _sourceDrawCmt,
            type: type,
            style: _commonDrawStyleCmt[type],
        });

        _map.addInteraction(_drawIntCmt);

        _drawIntCmt.on(
            "drawend", 
            function (event) {
                let currentFeature = event.feature;

                _createCommentsPanel(currentFeature);
            },
            this
        );
    };

    let divCommentsPanel;

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
        divCommentsPanel.style.width = "400px";
        divCommentsPanel.style.height = "400px";
        divCommentsPanel.style.borderRadius = "5px";
        divCommentsPanel.style.border = "1px solid black"
        divCommentsPanel.style.backgroundColor = "white";

        // Make the div flexible
        divCommentsPanel.style.display = "flex";
        divCommentsPanel.style.flexDirection = "column";
        divCommentsPanel.style.alignItems = "center";

        // Title for the comment div
        let divCommentsP = document.createElement("p");
        divCommentsP.innerHTML = "Ajout de commentaires";
        divCommentsP.style.fontSize = "16px";
        divCommentsP.style.margin = "10px";
        
        divCommentsPanel.appendChild(divCommentsP);

        // Dropdown list => custom select
        let customSelectComments = _createSelectComments(featureUid);

        divCommentsPanel.appendChild(customSelectComments);

        // Dropdown list => comments
        let divCommentsSection = _createCommentsSection(featureUid);

        divCommentsPanel.appendChild(divCommentsSection);

        // Add the div to the "page-content-wrapper"
        document.getElementById("page-content-wrapper").appendChild(divCommentsPanel);
    };

    var _createSelectComments = (featUid) => {
        // Custom select
        let contentSelectComments = _config.data.features.types;

        // let divDropdown = document.createElement("div");
        // divDropdown.className = "dropdown";
        // divDropdown.id = ""; // Useless for now

        // let divDropdownSelect = document.createElement("div");
        // divDropdownSelect.className = "select";

        // let span = document.createElement("span");
        // span.className = "selected";
        // span.innerHTML = "Choisir un type";

        // let spanDiv = document.createElement("div");
        // spanDiv.className = "caret";

        // let divDropdownUl = document.createElement("ul");
        // divDropdownUl.className = "menu";

        // divDropdownSelect.appendChild(span);
        // divDropdownSelect.appendChild(spanDiv);

        // divDropdown.appendChild(divDropdownSelect);
        // divDropdown.appendChild(divDropdownUl);

        // return divDropdown;

        let divDropdown = document.createElement("div");
        divDropdown.className = "dropdown";

        // Select style
        divDropdown.style.display = "inline-block";

        let divDropdownButton = document.createElement("button");
        divDropdownButton.className = "btn btn-default dropdown-toggle";
        divDropdownButton.type = "button";
        divDropdownButton.id = `dropdown_${featUid}`;
        divDropdownButton.setAttribute("data-toggle", "dropdown");
        divDropdownButton.setAttribute("aria-haspopup", "true");
        divDropdownButton.setAttribute("aria-expanded", "false");
        divDropdownButton.textContent = "Choisir un type";

        //divDropdownButton.style.width = "100%";
        divDropdownButton.style.marginBottom = "10px";
        divDropdownButton.style.boxSizing = "border-box";
        divDropdownButton.style.alignItems = "center";
        divDropdownButton.style.width = "158px";
        
        let span = document.createElement("span");
        span.className = "caret";

        let divDropdownUl = document.createElement("ul");
        divDropdownUl.className = "dropdown-menu";
        divDropdownUl.setAttribute("aria-labelledby", `dropdown_${featUid}`);

        // Style ul dropdown
        divDropdownUl.style.width = "100%";
        divDropdownUl.style.boxSizing = "border-box";

        for (const value of contentSelectComments) {
            let divDropdownLi = document.createElement("li");

            let divDropdownA = document.createElement("a");
            divDropdownA.className = "dropdown-item";
            divDropdownA.value = value;
            divDropdownA.href = "#";
            divDropdownA.textContent = value;

            divDropdownLi.appendChild(divDropdownA);

            divDropdownUl.appendChild(divDropdownLi);
        }

        let divider = document.createElement("li");
        divider.role = "separator";
        divider.className = "divider";

        divDropdownUl.appendChild(divider);

        let addTypeLi = document.createElement("li");
        
        let addTypeA = document.createElement("a");
        addTypeA.href = "#";
        addTypeA.textContent = "Ajouter un type";

        addTypeLi.appendChild(addTypeA);

        divDropdownUl.appendChild(addTypeLi);   

        divDropdownButton.appendChild(span);
        divDropdown.appendChild(divDropdownButton);
        divDropdown.appendChild(divDropdownUl);
        
        return divDropdown;
    };

    let listTextArea = [];

    var _createCommentsSection = (featUid) => {

        _nbTextArea += 1;

        let divTextArea = document.createElement("div");
        divTextArea.id = `textArea_${featUid}`;
        divTextArea.style.flexDirection = "column";
        divTextArea.style.alignItems = "center";

        let smallCountsTextArea = document.createElement("small");
        smallCountsTextArea.id = "countsTextArea";
        smallCountsTextArea.textContent = "0/254 caractères utilisés";
        smallCountsTextArea.style.display = "block";
        smallCountsTextArea.style.marginTop = "0px";
        smallCountsTextArea.style.color = "gray";
        smallCountsTextArea.style.textAlign = "center";

        let textArea = document.createElement("textarea");
        textArea.placeholder = "Saisir un commentaire...";
        textArea.id = "commentsArea";
        textArea.maxLength = "254";
        textArea.cols = "45";
        textArea.rows = "5";
        
        textArea.addEventListener("input", function () {
            updateCharacterCount();
        });

        // Style comments
        textArea.style.resize = "none";

        divTextArea.appendChild(textArea);
        divTextArea.appendChild(smallCountsTextArea);
        
        let addTextArea = document.createElement("div");
        addTextArea.className = "glyphicon glyphicon-plus";
        addTextArea.style.cursor = "pointer";

        addTextArea.addEventListener("click", function() {
            const newFeatUid = `${featUid + 1}`;
            _createCommentsSection(newFeatUid);
        });

        if (_nbTextArea < 4) { 
            divTextArea.appendChild(addTextArea);
        }

        divCommentsPanel.appendChild(divTextArea);

        listTextArea.push(
            divTextArea
        );
        
        return divTextArea;
    };

    function updateCharacterCount() {
        const contentTextArea = document.getElementById("commentsArea").value;
        const charCount = document.getElementById("countsTextArea");
        charCount.textContent = `${contentTextArea.length}/254 caractères utilisés`;
        if (contentTextArea.length === 254) {
            charCount.style.color = "red";
        } else {
            charCount.style.color = "gray";
        }
        
    }

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

    var _enableDrawToolCmt = () => {
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
    };

    return {
        init: _initCommentsTool,
    };
})();

new CustomComponent("comments", comments.init);