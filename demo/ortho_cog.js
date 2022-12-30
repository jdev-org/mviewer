const layer = new ol.layer.WebGLTile({
    source: new ol.source.GeoTIFF({
		convertToRGB: true,
		sources: [
			{
				// url: 'https://www.geo2france.fr/public/cog/ortho/2021_R32_Ortho_0m20_RVB_COG.tif',
				url: 'https://sig.hautsdefrance.fr/ext/ol_cog/2021_PNR_SE_Ortho_0m20_RVB_COG.tif',
			},
		],
	}),
});

new CustomLayer('ortho_cog', layer);