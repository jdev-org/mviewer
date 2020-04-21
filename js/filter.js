var filter = (function () {

  /**
   * Property: _layerIdList
   *  @type {}
   */

  var _layerIdList;

  /**
  * Html template for filter panel
  *
  */
  var _filter_dialog = function (layerIdList, params){
    var _dialog = [
    '<div id="advancedFilter" class="advancedFilter form-group">',
      '<div><h2> Filtres </h2></div>',
    '</div>'
  ]. join("");
  $("#sidebar-wrapper").append(_dialog);
}

  /**
  * Private Method: _configFilterableLayer expored as Public Methode configFilterableLayer
  *  add filter params for current layer
  *
  **/
  var _configFilterableLayer = function (oLayer, params) {
      oLayer.filterparam = (params.filterparams) ? params.filterparams: '';
      return oLayer;
  };

  var _createFilterPanel = function (layerIdList, params){
      //if checkbox

  };

  var _addCheckboxFilter = function (layerIdList, params){
      var _checkBox = [
      '<div class="form-check mb-2 mr-sm-2">',
        '<legend> Equipement public </legend>',
        '<label class="form-check-label">',
          '<input class="form-check-input" type="checkbox" id="equip1" onclick="filter.onCheckBoxClick(this);"> Aire de pique-nique',
        '</label>',
        '<label class="form-check-label">',
          '<input class="form-check-input" type="checkbox" id="equip2" onclick="filter.onCheckBoxClick(this);"> Douches',
        '</label>',
        '<label class="form-check-label">',
          '<input class="form-check-input" type="checkbox" id="equip3" onclick="filter.onCheckBoxClick(this);"> Jeux pour enfants',
        '</label>',
        '<label class="form-check-label">',
          '<input class="form-check-input" type="checkbox" id="equip4" onclick="filter.onCheckBoxClick(this);"> Toilettes',
        '</label>',
        '<label class="form-check-label">',
          '<input class="form-check-input" type="checkbox" id="equip5" onclick="filter.onCheckBoxClick(this);"> Wifi',
        '</label>',
      '</div>'
    ].join("");
      $("#advancedFilter").append(_checkBox);
  };

  /**
  * Private Method: _toggle
  *
  * Open filtering panel
  **/
  var _toggle = function () {
    // ouverture de la fenêtre de filtrage
    $('#filterbtn').addClass('active');
    $("#advancedFilter").show();

  };

  /**
  * Private Method: _manageCheckbox
  *
  * Action on checkbox
  **/
  var _onCheckBoxClick = function (checkbox) {

    //TODO generated ass array
    var key="equipements_publics";
    var value="Aire de pique-nique";
    if(checkbox.id=='equip1'){
      value="Aire de pique-nique";
    }
    if(checkbox.id=='equip2'){
      value="Douches";
    }
    if(checkbox.id=='equip3'){
      value="Jeux pour enfants";
    }
    if(checkbox.id=='equip4'){
      value="Toilettes";
    }
    if(checkbox.id=='equip5'){
      value="Wifi";
    }


    if(checkbox.checked == true){
      _filterFeatures(key, value);
    }else{
      _clearFilterFeatures(key, value);
    }

  };

  /**
   * Private Method: _clearFilterTools
   *
   */
  var _clearFilterTools = function () {
      $('#filterbtn').removeClass('active');
      $("#advancedFilter").hide();
  };

  /**
  * Private Method: _filterFeature
  *
  **/
  var _filterFeatures = function(key, value){

    if(value != null && value.length > 0){
    var filterparam = mviewer.getLayer("plage").filterparam;
    var featuresToBeFiltered = mviewer.getLayer("plage").layer.getSource().getFeatures();

    featuresToBeFiltered.forEach(feature => {
      // if feature map filter show it
      if(feature.get(key) != null && feature.get(key).includes(value)){
        feature.setStyle(null);
      }else{
        // hide
        feature.setStyle(new ol.style.Style({}));
      }
    });
  }
  };

  /**
  * Private Method: _filterFeature
  *
  **/
  var _clearFilterFeatures = function(key, value){
    _clearAllFilter();
  };

  /**
  * Private Method: _filterFeature
  *
  **/
  var _clearAllFilter = function(){
    var filterparam = mviewer.getLayer("plage").filterparam;
    var featuresToUnFiltered = mviewer.getLayer("plage").layer.getSource().getFeatures();

    featuresToUnFiltered.forEach(feature => {
        feature.setStyle(null);
    });
  };


  /**
   * Public Method: _initFilterTool exported as init
   *
   */
  var _initFilterTool = function () {

      //Add html elements to the DOM
      var button = [
          '<button class="mv-modetools btn btn-default btn-raised" href="#"',
            ' onclick="filter.toggle();"  id="filterbtn" title="Filtrer" i18n="filter.button.main"',
              ' tabindex="115" accesskey="f">',
                      '<span class="glyphicon glyphicon-filter" aria-hidden="true"></span>',
              '</button>'].join("");
      $("#toolstoolbar").prepend(button);

      _filter_dialog ();
      _addCheckboxFilter();
  };

  return {
      init: _initFilterTool,
      configFilterableLayer: _configFilterableLayer,
      toggle: _toggle,
      filterFeatures: _filterFeatures,
      getDialog: _createFilterPanel,
      onCheckBoxClick: _onCheckBoxClick
  };

})();

$( document ).ready(function() {

});
