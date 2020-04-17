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
  var _filter_dialog = [
    '<div id="filter-modal" class="modal fade" tabindex="-1" role="dialog" >',
      '<div class="modal-dialog modal-md">',
        '<div class="modal-content" role="document">',
          '<div class="modal-header">',
            '<button type="button" class="close" data-dismiss="modal">&times;</button>',
            '<h4 class="modal-title">Filtres</h4>',
          '</div>',
          '<div class="modal-body" >',
            '<div class="form-group">',
              '<label for="text">Filtre texte {nom_plage}</label>',
              '<h3><input type="text" class="form-control"  onchange="filter.filterFeatures(this.value)"><h3>',
            '</div>',
          '</div>',
          '<div class="modal-footer">',
          '</div>',
        '</div>',
       '</div>',
    '</div>'
  ]. join("");

  /**
  * Private Method: _configFilterableLayer expored as Public Methode configFilterableLayer
  *  add filter params for current layer
  *
  **/
  var _configFilterableLayer = function (oLayer, params) {
      oLayer.filterparam = (params.filterparams) ? params.filterparams: '';
      return oLayer;
  };

  var createFilterPanel = function (layerIdList, params){

  }

  /**
  * Private Method: _toggle
  *
  * Open filtering panel
  **/
  var _toggle = function () {
      $("#filter-modal").modal("show");
  };


  /**
  * Private Method: _filterFeature
  *
  **/
  var _filterFeatures = function(value){

    var key="nom_plage";
    var filterparam = mviewer.getLayer("plage").filterparam;
    var featuresToBeFiltered = mviewer.getLayer("plage").layer.getSource().getFeatures();

    featuresToBeFiltered.forEach(feature => {
      // if feature map filter show it
      if(feature.get(key).includes(value)){
        feature.setStyle(null);
      }else{
        // hide
        feature.setStyle(new ol.style.Style({}));
      }
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
              ' onclick="filter.toggle();" id="filterbtn" title="Filtrer" i18n="filter.button.main"',
              ' tabindex="115" accesskey="f">',
                      '<span class="glyphicon glyphicon-filter" aria-hidden="true"></span>',
              '</button>'].join("");
      $("#toolstoolbar").prepend(button);
  };

  return {
      init: _initFilterTool,
      configFilterableLayer: _configFilterableLayer,
      toggle: _toggle,
      filterFeatures: _filterFeatures,
      getDialog: function (){ return _filter_dialog;}
  };

})();

$( document ).ready(function() {
    $("#main").append(filter.getDialog())
    $("#filter-modal .close").click(function(e) { $("#filter-modal").modal("hide")});
});
