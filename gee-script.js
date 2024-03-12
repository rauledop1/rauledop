// Load the Earth Engine API
google.charts.load('current', { 'packages': ['map'] });

// Authenticate with Earth Engine
google.charts.setOnLoadCallback(initMap);

function initMap() {
  // Set the map center to Chillan, Chile
  var map = new google.visualization.Map(document.getElementById('map'));
  map.drawChart({
    options: {
      region: 'Chile',
      resolution: '10m',
      center: { lat: -36.6065, lng: -72.1034 },
      zoomLevel: 10
    },
    mapType: 'satellite',
  });

  // Calculate NDVI and add it to the map
  var collection = ee.ImageCollection('LANDSAT/LC08/C01/T1_8DAY_NDVI')
    .filterBounds(ee.Geometry.Point(-72.1034, -36.6065))
    .filterDate('2022-01-01', '2022-12-31');
    
  var ndviVis = {
    min: -1,
    max: 1,
    palette: ['blue', 'white', 'green']
  };

  var ndvi = collection.mean();
  map.overlayImages().clear();
  map.overlayImages().addBands(ndvi, ndviVis);
}