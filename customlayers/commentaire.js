const legend = {
  items: [],
};

const LAYER_ID = "commentaire";
const LAYER = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: "data/commune_simple.geojson",
    format: new ol.format.GeoJSON(),
  }),
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: "rgba(45, 64,89,255)",
      width: 0.8,
    }),
    fill: new ol.style.Fill({
      color: "rgba(0, 0, 0, 0)",
    }),
  }),
});

new CustomLayer(LAYER_ID, LAYER, legend);
