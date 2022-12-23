const LAYER_URL = "apps/christmas/data/school.geojson";
const LAYER_ID = "school";

// create styles
const legendStyle = (color) => [
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: 6,
      fill: new ol.style.Fill({
        color: color,
      }),
    }),
  }),
];

const getColors = (v) =>
  [
    {
      condition: v < 2711092,
      color: "#22b160",
    },
    {
      condition: v >= 2711092 && v <= 2747901,
      color: "#126737",
    },
    {
      condition: v > 2747901 && v <= 2784710,
      color: "#edab27",
    },
    {
      condition: v > 2784710 && v <= 2821520,
      color: "#e2432e",
    },
    {
      condition: v > 2821520,
      color: "#b42425",
    },
  ].filter((x) => x.condition)[0]?.color;

// create legend
const legend = {
  items: [
    {
      styles: legendStyle("#22b160"),
      label: "Plus près du Père Noël",
      geometry: "Point",
    },
    {
      styles: legendStyle("#b42425"),
      label: "Plus loin du Père Noël",
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
          let features = layer.getSource().getFormat().readFeatures(r, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
          layer.getSource().addFeatures(features);
        });
    },
    format: new ol.format.GeoJSON(),
  }),
  style: (feature) => {
    return new ol.style.Style({
      image: new ol.style.Circle({
        stroke: new ol.style.Stroke({
          color: "#ffffff",
          width: 1,
        }),
        fill: new ol.style.Fill({
          color: getColors(feature.get("Distance")),
        }),
        radius: 5,
      }),
    });
  },
});

new CustomLayer(LAYER_ID, layer, legend);
