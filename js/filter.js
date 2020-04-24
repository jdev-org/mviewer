var filter = (function() {

  /**
   * Property: _layersParams
   *  @type {Map}
   */
  var _layersParams = new Map();

  /**
   * Property: _currentFilters
   *  @type {Map}
   */
  var _currentFilters = new Map();

  /**
   * Html template for filter panel, append to a global div
   * @param {string} layerIdList if several layer create a different panel
   */
  var _filter_dialog = function(layerIdList) {
    var _dialog = [
      '<div id="advancedFilter" class="advancedFilter form-group">',
      '<div><h2>Filtres</h2></div>',
      '</div>'
    ].join("");
    $("#sidebar-wrapper").append(_dialog);
  };

  /**
   * Private Method: _configFilterableLayer
   * expored as Public Methode configFilterableLayer
   *  add filter params for current layer
   *
   **/
  var _configFilterableLayer = function(oLayer, params) {
    oLayer.filterable = (params.filterable) ? params.filterable : false;
    var layerParams = (params.filterparams) ? JSON.parse(params.filterparams) : {};

    // Add params as json object to config only if exist and if layer is filtereable
    if (oLayer.filterable && layerParams != '') {
      console.log("Layer : " + oLayer.id + " is filtereable");
      // Should never happens but we could check if layer.id not already exist in _layersParams
      _layersParams.set(oLayer.id, layerParams);
    } else {
      console.log("Layer : " + oLayer.id + "  is not filterable");
    }
    return oLayer;
  };

  var _createFilterPanel = function(layerIdList, params) {
    // add master div
    _filter_dialog();

    // Parse all layer to get params
    for (var [layerId, params] of _layersParams) {
      console.log("Layer : " + layerId);

      // Parse all params to create panel
      for (var index in params) {

        console.log("   ->Type = " + params[index].type);
        console.log("   ->Attribut = " + params[index].attribut);
        console.log("   ->Label = " + params[index].label);

        // condition on type
        if (params[index].type == "checkbox") {
          params[index].values = _getDistinctValues(layerId, index);
          _addCheckboxFilter(layerId, params[index]);
        } else if (params[index].type == "combobox") {
          params[index].values = _getDistinctValues(layerId, index);
          _addComboboxFilter(layerId, params[index]);
        } else if (params[index].type == "textbox") {
          params[index].values = _getDistinctValues(layerId, index);
          _addTextFilter(layerId, params[index]);
        }


        // get attribut possible values
      }
    }

  };

  /**
   * return all disctinct values for an layerId and attribut
   */
  var _getDistinctValues = function(layerId, index) {

    // get layerParams information
    var layerParams = _layersParams.get(layerId);
    var attribut = layerParams[index].attribut;

    var result = [];

    var features = mviewer.getLayer(layerId).layer.getSource().getFeatures();

    features.forEach(feature => {

      if (feature.get(attribut) != null) {
        console.log(feature.get(attribut));
        result.push(feature.get(attribut));
      }

    });

    const distinct = (value, index, self) => {
      return self.indexOf(value) === index;
    };

    layerParams[index].values = result.filter(distinct);
    // update master fields
    _layersParams.set(layerId, layerParams);

    return layerParams[index].values;
  };

  var _addCheckboxFilter = function(layerId, params) {
    var _checkBox = [
      '<div class="form-check mb-2 mr-sm-2">',
      '<legend> ' + params.label + ' </legend>'
    ];

    params.values.forEach(function(value, index, array) {
      console.log("Value : " + value);
      _checkBox.push('<div class="form-check"><input type="checkbox" class="form-check-input" onclick="filter.onValueChange(this);" id="filterCheck-' + layerId + '-' + params.attribut + '-' + index + '">');
      _checkBox.push('<label class="form-check-label" for="filterCheck-' + layerId + '-' + params.attribut + '-' + index + '">' + value + '</label></div>');
    });

    _checkBox.push('</div>');
    $("#advancedFilter").append(_checkBox.join(""));
  };

  var _addTextFilter = function(layerId, params) {
    // ID - generate to be unique
    var id = "filterText-" + layerId + "-" + params.attribut;

    // HTML
    var _text = [
      '<div class="form-check mb-2 mr-sm-2">',
      '<legend> ' + params.label + ' </legend>'
    ];
    _text.push('<input type="text" value="" data-role="tagsinput" id="' + id + '" class="form-control">');
    _text.push('</div>');
    $("#advancedFilter").append(_text.join(""));

    //EVENT
    $("#" + id).tagsinput({
      typeahead: {
        source: params.values
      },
      freeInput: false
    });
    $("#" + id).on('itemAdded', function(event) {
      _addFilterElementToList(layerId, params.attribut, event.item);
      _filterFeatures(layerId);

    });
    $("#" + id).on('itemRemoved', function(event) {
      _removeFilterElementFromList(layerId, params.attribut, event.item);
      _filterFeatures(layerId);
    });
  };

  var _addComboboxFilter = function(layerId, params) {

    var _comboBox = [
      '<div class="form-group mb-2 mr-sm-2">',
      '<legend> ' + params.label + ' </legend>',
      '<select id="filterCombo-' + layerId + '-' + params.attribut + '" class="form-control" onchange="filter.onValueChange(this)">',
      '<option selected>Choisissez...</option>'
    ];

    params.values.forEach(function(value, index, array) {
      console.log("Value : " + value);
      _comboBox.push(' <option>' + value + '</option>');
    });
    _comboBox.push('</select></div>');
    $("#advancedFilter").append(_comboBox.join(""));

  };

  /**
   * Private Method: _toggle
   *
   * Open filtering panel
   **/
  var _toggle = function() {

    // show or hide filter panel
    $("#advancedFilter").show();

  };

  /**
   * Private Method: _addFilterElementToList
   * @param {string} layerId The layer id to be filter
   * @param {string} attribute The property key for filtering feature
   * @param {object} value The value to filter can be String, Number, Boolean, Date,
   * @param {String} type The value format to help filtering (text, date, boolean)
   **/
  var _addFilterElementToList = function(layerId, attribut, value, type) {

    // Add filter only if there something to filter
    if (layerId != null && attribut != null && value != null) {
      var filtersByLayer = (_currentFilters.get(layerId) != null ? _currentFilters.get(layerId) : []);

      var filter = {
        layerId: layerId,
        attribut: attribut,
        value: value,
        type: type
      };

      filtersByLayer.push(filter);
      _currentFilters.set(layerId, filtersByLayer);
    }
  };

  /**
   * Private Method: _removeFilterElementFromList
   * @param {string} layerId The layer id to be filter
   * @param {string} attribute The property key for filtering feature
   * @param {object} value The value to filter can be String, Number, Boolean, Date,
   * @param {String} type The value format to help filtering (text, date, boolean)
   **/
  var _removeFilterElementFromList = function(layerId, attribut, value) {
    var indexToRemove = -1;

    var filtersByLayer = _currentFilters.get(layerId);
    //search if value exist un currentFilters
    if (filtersByLayer != undefined) {
      filtersByLayer.forEach(function(filter, index, array) {
        if (filter.attribut == attribut && (value == null || filter.value == value)) {
          indexToRemove = index;
        }
      });

      //only remove if exist
      if (indexToRemove > -1) {
        filtersByLayer.splice(indexToRemove, 1);
        _currentFilters.set(layerId, filtersByLayer);
      }
    }

  };

  /**
   * Private Method: _onValueChange
   *
   *  action when filter from filter panel change (checkbox, combobox, textarea or datapicker )
   **/
  var _onValueChange = function(element) {

    // get information for elment id ( type-layerid-attribut-index)
    var filtreInformation = element.id.split("-");
    var type = filtreInformation[0];
    var layerId = filtreInformation[1];
    var attribut = filtreInformation[2];
    var value = element.value;

    // checkbox return index of value in _layersParams
    if (type == "filterCheck") {
      var indexValue = filtreInformation[3];
      value = _getValueFromInfo(layerId, attribut, indexValue);
      // if check add filter, else remove filter
      if (element.checked == true) {
        _addFilterElementToList(layerId, attribut, value);
      } else {
        _removeFilterElementFromList(layerId, attribut, value);
      }
    }
    // combobox only one possible value so remove previous if exist
    else if (type == "filterCombo") {
      _removeFilterElementFromList(layerId, attribut, null);
      // if value not the first text here ("Choississez...")
      if (element.selectedIndex != 0) {
        _addFilterElementToList(layerId, attribut, value);
      }
    } else {
      _addFilterElementToList(layerId, attribut, value);
    }

    _filterFeatures(layerId);
  };

  /**
   * Private Method: _createIdFromInfo
   *
   *
   **/
  var _createIdFromInfo = function(layerId, attribute, indexValue, type) {

  };

  /**
   * Private Method: _getValueFromInfo
   *
   *
   **/
  var _getValueFromInfo = function(layerId, attribute, indexValue) {

    var params = _layersParams.get(layerId);

    for (var index in params) {
      if (params[index].attribut == attribute) {
        return params[index].values[indexValue];
      }
    }
  };

  /**
   * Private Method: _clearFilterTools
   *
   */
  var _clearFilterTools = function() {
    $('#filterbtn').removeClass('active');
    $("#advancedFilter").hide();
  };

  /**
   * Private Method: _filterFeature
   *
   **/
  var _filterFeatures = function(layerId) {

    var filtersByLayer = _currentFilters.get(layerId);
    var featuresToBeFiltered = mviewer.getLayer(layerId).layer.getSource().getFeatures();

    featuresToBeFiltered.forEach(feature => {

      if (filtersByLayer.length > 0) {
        var hideFeature = false;
        //search if value exist un currentFilters
        filtersByLayer.forEach(function(filter, index, array) {

          // if feature map filter keep it
          if (feature.get(filter.attribut) != null && feature.get(filter.attribut).includes(filter.value)) {
            feature.setStyle(null);
          } else {
            // hide
            // TODO save style for each feature
            hideFeature = true;
          }

        });

        if (hideFeature) {
          feature.setStyle(new ol.style.Style({}));
        }
      }
      // clear filter
      else {
        feature.setStyle(null);
      }
    });
  };

  /**
   * Private Method: _clearFilterFeatures
   *
   **/
  var _clearFilterFeatures = function(layerId, key, value) {
    _clearAllFilter(layerId);
  };

  /**
   * Private Method: _clearAllFilter
   *
   **/
  var _clearAllFilter = function(layerId) {

    var featuresToUnFiltered = mviewer.getLayer(layerId).layer.getSource().getFeatures();
    featuresToUnFiltered.forEach(feature => {
      feature.setStyle(null);
    });
  };


  /**
   * Public Method: _initFilterTool exported as init
   *
   */
  var _initFilterTool = function() {

    if (_layersParams.size > 0) {

      //Add filter button to toolstoolbar
      var button = [
        '<button class="mv-modetools btn btn-default btn-raised" href="#"',
        ' onclick="filter.toggle();"  id="filterbtn" title="Filtrer" i18n="filter.button.main"',
        ' tabindex="115" accesskey="f">',
        '<span class="glyphicon glyphicon-filter" aria-hidden="true"></span>',
        '</button>'
      ].join("");
      $("#toolstoolbar").prepend(button);

      var layerId = "";
      for (var [layer, params] of _layersParams) {
        layerId = layer;
      }

      // wait until layer is load before create filters
      mviewer.getLayer(layerId).layer.once('change', function(e) {
        _createFilterPanel();
      });

    }
  };

  return {
    init: _initFilterTool,
    configFilterableLayer: _configFilterableLayer,
    toggle: _toggle,
    filterFeatures: _filterFeatures,
    onValueChange: _onValueChange
  };

})();

$(document).ready(function() {

});
