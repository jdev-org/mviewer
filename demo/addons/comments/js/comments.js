var comments = (function () {

    let _config;

    let _commonDrawStyleCmt;

    let _map;

    let _drawIntCmt;

    let _vectorDrawCmt;

    let _sourceDrawCmt;

    let _modCommentsEnabled = false;

    var _initCommentsTool = () => {
        // Get all configurations
        _config = mviewer.customComponents.comments.config.options.mviewer.comments;
        _map = mviewer.getMap();

        _commonDrawStyleCmt = _drawStyleBaseCmt(_config);

        _vectorDrawCmt = new ol.layer.Vector ({
            source: _sourceDrawCmt,
            style: function (feature) {
                return _commonDrawStyleCmt[feature.getGeometry().getType()];
            },
        });

        _initButtons();
    };

    var _initButtons = () => {

        let toolsBar = document.getElementById("toolstoolbar");
        let commentsBtnList = document.getElementById("commentsOptionsBtn");

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
                _addDrawInteraction(type);
            });

            let divCommentBtnI = document.createElement("i");
            divCommentBtnI.className = classIcon;

            divCommentsBtn.appendChild(divCommentBtnI);

            commentsToolsOptions.appendChild(divCommentsBtn);
        };

        let contentWrapper = document.getElementById("page-content-wrapper");
        contentWrapper.appendChild(commentsToolsOptions);

        let commentsOptionBtn = document.getElementById("commentsOptionsBtn");
        commentsOptionBtn.addEventListener("click", function () {
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
            Polygon: [
                new ol.style.Style({
                    stroke: commonLineStrokeCmt,
                    fill: commonFillCmt,
                }),
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
                new ol.style.Style({
                    stroke: commonLineStrokeCmt,
                    fill: commonFillCmt,
                }),
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
    }

    var _addDrawInteractionCmt = (type) => {
        console.log("addDrawInteraction");
        console.log(type);

        _drawIntCmt = new DeleteOnRightClick({
            source: _sourceDrawCmt,
            type: type,
            style: _commonDrawStyleCmt[type],
        });

        _map.addInteraction(_drawIntCmt);
    };

    var _toggle = function () {
        if (_modCommentsEnabled) {
          // If the module comments is active
          // Launch comments.disable
          //mviewer.unsetTool("comments");
          _disableDrawToolCmt();
        } else {
          // If the module comments is not active
          // Launch comments.enable
          //mviewer.setTool("comments");
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
        toggle: _initButtons,
        // enable: _enableCommentsTool,
        // disable: _disableCommentsTool,
    };
})();

new CustomComponent("comments", comments.init);