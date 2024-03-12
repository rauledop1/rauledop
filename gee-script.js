// Use your Earth Engine authentication token
var token = 'YOUR_AUTHENTICATION_TOKEN';

// Initialize Earth Engine with authentication token
ee.initialize({
  token: token,
  apiBaseUrl: 'https://earthengine.googleapis.com/map',
});

// Set up the map
var map = new ee.Map({
  center: [-72.1034, -36.6065],
  zoom: 10
});

// Add NDVI layer to the map
var ndvi = ee.ImageCollection('LANDSAT/LC08/C01/T1_8DAY_NDVI')
            .filterBounds(ee.Geometry.Point(-72.1034, -36.6065))
            .filterDate('2022-01-01', '2022-12-31')
            .mean();

var ndviVis = {
  min: -1,
  max: 1,
  palette: ['blue', 'white', 'green']
};

map.addLayer(ndvi, ndviVis, 'NDVI');

// Display the map on the webpage
var mapPanel = document.getElementById('map');
mapPanel.appendChild(map.getCanvas());
