var trackview = (function () {

  var _initTool= function () {
    console.log("Initialisation de l'outil"); // Affichage dans les logs

    var layerID = mviewer.customComponents.trackview.config.options.mviewer.parcours.stats[0].layerId;
    console.log(layerID);  // Affichage dans les logs
    
    var mvLayer = mviewer.getLayer(layerID).layer;
    console.log(mvLayer);  // Affichage dans les logs

    mviewer.getMap().once("rendercomplete", function (e) {
      var source = mvLayer.getSource(); 
      console.log(source); // Affichage dans les logs
      var feature = source.getFeatures();
      console.log(feature); // Affichage dans les logs
      //console.log(feature[0].getGeometry().getExtent()); // Affichage dans les logs
      //console.log(feature[0].getGeometry().getExtent()[0]); // Affichage dans les logs
      //mviewer.zoomToLocation(feature[0].getGeometry().getExtent()[0], feature[0].getGeometry().getExtent()[1], 12, null, "EPSG:3857");
      mviewer.getMap().getView().fit(feature[0].getGeometry().getExtent(), {
        duration: 4000, // Permet de définir le temps de l'animation en ms
      });
      _setStyle();
    })
  };

  var _setStyle= function () {
    console.log("Initialisation du style");

    var style = mviewer.customComponents.trackview.config.options.mviewer.parcours.style;
    console.log(style);
    mvLayer.vectorLayer.setStyle({
      "geometry": style.geometry,
      "stroke-color": style.color,
      "stroke-width": style.width,
    });
  };

return {
  init: _initTool, 
};
})();

new CustomComponent("trackview", trackview.init);