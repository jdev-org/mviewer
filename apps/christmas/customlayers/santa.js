const LAYER_URL = "apps/christmas/data/santa.geojson";
const LAYER_ID = "santa";

let santaStyle = (size) =>
  new ol.style.Style({
    image: new ol.style.Icon({
      src: "apps/christmas/img/santa1.png",
      scale: size || 0.03,
    }),
  });

// create legend
const legend = {
  items: [
    {
      styles: santaStyle(0.01),
      label: "Père Noël",
      geometry: "Point",
    },
  ],
};
let layer = new ol.layer.Vector({
  source: new ol.source.Vector({
    loader: () => {
      fetch(LAYER_URL)
        .then((r) => r.json())
        .then((r) => {
          // nettoie la layer
          layer.getSource().clear();
          // charge les features
          let features = layer.getSource().getFormat().readFeatures(r);
          layer.getSource().addFeatures(features);
        });
    },
    format: new ol.format.GeoJSON(),
  }),
  style: santaStyle(),
});

new CustomLayer(LAYER_ID, layer, legend);
