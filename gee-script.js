// JavaScript code here
// Define your Earth Engine app here
// Remember to replace with your EE code
// You can remove any UI-specific code and place it directly in the HTML file if you prefer

// Initialize the Earth Engine API
ee.initialize();

// Define your Earth Engine app here
// Remember to replace with your EE code

var text = require('users/gena/packages:text')
var geometry = ui.import && ui.import("geometry", "geometry", {
      "geometries": [],
      "displayProperties": [],
      "properties": {},
      "color": "#23cba7",
      "mode": "Geometry",
      "shown": true,
      "locked": false
    }) || /* color: #23cba7 */ee.Geometry.MultiPoint();
/**
 * @license
 * Copyright 2020 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 *
 * @description
 * A Sentinel-2 Level-2A image browser to accompany a Medium blog post
 * on working with the s2cloudless collection. A user can use this app
 * to easily find an image to test cloud and cloud shadow identification
 * parameters on for a region relevant to their work.
 */

var S2_SR_COL = ee.ImageCollection("COPERNICUS/S2_SR");
var FCOL_VIS = {
  bands: ['B8A', 'B4', 'B3'],
  min: 1600,
  max: 5500,
  gamma: [0.95,1,1]
};
var RBG_VIS = {
  bands: ['B4', 'B3', 'B2'],
  min: 900,
  max: 2400,
  gamma: [1,1,1]
};
var predstyle={color: '3daa06', fillColor: '00000000'}
ui.root.clear();
var map = ui.Map();

var predios = ee.FeatureCollection('projects/seguridad-1555430161746/assets/PREDIO_20230202T1149')

map.setCenter(-65.848527,-32.304814 , 6);
map.setOptions('SATELLITE')
map.addLayer(predios.style(predstyle),{},'Predios FASA')
/*var Scale = Map.getScale()*1
var labels = predios.map(function(feat){
  feat = ee.Feature(feat)
  var name = ee.String (feat.get("PREDIO"))
  var centroid = feat.geometry().centroid()
  var t = text.draw(name, centroid,Scale,{
    fontSize: 12,
    textColor:'white',
     OutlineWidth:2,
     OutlineColor:'black'

  })
  return t
  })
var Labels_Final = ee.ImageCollection(labels)
map.addLayer(Labels_Final,{})*/
var drawingTools = map.drawingTools();
drawingTools.setShown(false);
drawingTools.onDraw(function() {
  drawingTools.setShape(null);
});

while (drawingTools.layers().length() > 0) {
  var layer = drawingTools.layers().get(0);
  drawingTools.layers().remove(layer);
}

var dummyGeometry =
    ui.Map.GeometryLayer({geometries: null, name: 'geometry', color: 'EA7600'});

drawingTools.layers().add(dummyGeometry);

function clearGeometry() {
  var layers = drawingTools.layers();
  layers.get(0).geometries().remove(layers.get(0).geometries().get(0));
}

function drawPoint() {
  clearGeometry();
  drawingTools.setShape('point');
  drawingTools.draw();
}
function displayMapImgRGB(button) {
  var imgId = button.style().get('whiteSpace');
  var imgIdShort = imgId.split('/')[2];
  var img = ee.Image(imgId);
  //map.centerObject(img, 9 );
  var im = map.addLayer(img, RBG_VIS, imgIdShort);
  var pr = map.addLayer(predios.style(predstyle),{},'Predios FASA');
  map.layers().reset([im,pr])
}
function displayMapImgFC(button) {
  var imgId = button.style().get('whiteSpace');
  var imgIdShort = imgId.split('/')[2];
  var img = ee.Image(imgId);
  //map.centerObject(img, 9 );
  var im = map.addLayer(img, FCOL_VIS, imgIdShort);
  var pr = map.addLayer(predios.style(predstyle),{},'Predios FASA');
  map.layers().reset([im, pr])
}


function clearImgs() {
  while (map.layers().length() > 0) {
    map.layers().remove(map.layers().get(0));
  }
  imgCardPanel.clear();
}

function getDateInterval() {
  var advance = {
    '1 semana' : {n: -1, units: 'week'},
    '1 mes': {n: -1, units: 'month'},
    '3 meses': {n: -3, units: 'months'},
    '6 meses': {n: -6, units: 'months'}
  };
  return advance[dateInterval.getValue()];
}

function getCol() {
  var endDate = ee.Date(ee.List(targetDateSlider.getValue()).get(1));
  var advance = getDateInterval();
  var startDate = endDate.advance(advance.n, advance.units);
  var cldThrsh = maxCldCvr.getValue();
  var pointGeom = drawingTools.layers().get(0).getEeObject();
  var pointCoords = ee.List(pointGeom.coordinates());
  return S2_SR_COL
    .filterBounds(pointGeom)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', cldThrsh))
    .map(function(img) {
      var date = img.date().format('YYYY-MM-dd');
      return img.set('date', date);
    })
    .sort('system:time_start', false)
    .map(function(img) {
      return img.set({info: {
        id: img.id(),
        date: img.get('date'),
        dateEnd: img.date().advance(1, 'day').format('YYYY-MM-dd'),
        crs: img.select([0]).projection().crs(),
        cloud: img.get('CLOUDY_PIXEL_PERCENTAGE'),
        pointX: pointCoords.get(0),
        pointY: pointCoords.get(1)
      }});
    });
}

function reducePrecision(number, places) {
  var scalar = Math.pow(10, places);
  return Math.round(number * scalar) / scalar;
}

function displayBrowseImg() {
  clearImgs()
  map.addLayer(predios.style(predstyle),{})
  waitMsg.style().set('shown', true);
  imgCardPanel.add(waitMsg);
  var imgList = getCol();
  var imgInfoList = imgList.reduceColumns(ee.Reducer.toList(), ['info']).get('list');

  imgInfoList.evaluate(function(imgInfoList) {
    waitMsg.style().set('shown', false);
    imgInfoList.forEach(function(imgInfo) {
      var img = ee.Image('COPERNICUS/S2_SR'+'/'+imgInfo.id);
      var visImg = img.visualize(FCOL_VIS);
      var thumbnail = ui.Thumbnail({
        image: visImg,
        params: {
          dimensions: '295', // '295x295'
          crs: imgInfo.crs
        },
        style: {margin: '6px 8px 8px 8px'}
      });

      var imgId = 'COPERNICUS/S2_SR'+'/'+imgInfo.id;
      var importId = "ee.Image('COPERNICUS/S2_SR"+"/"+imgInfo.id+"')";
      var pointX = reducePrecision(imgInfo.pointX, 3);
      var pointY = reducePrecision(imgInfo.pointY, 3);
      var aoiVar = "AOI = ee.Geometry.Point(" + pointX.toString() + ", " + pointY.toString() + ")\n";
      var startDateVar = "START_DATE = '" + imgInfo.date + "'\n";
      var endDateVar = "END_DATE = '" + imgInfo.dateEnd + "'\n";
      var cloudFilter = "CLOUD_FILTER = " + maxCldCvr.getValue().toString();

      var nbInfo = aoiVar + startDateVar + endDateVar + cloudFilter;
      var nbInfoLabel = ui.Label(nbInfo, {fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'pre', backgroundColor: '#d3d3d3', padding: '4px', margin: '0px 8px 0px 8px', stretch: 'horizontal'});

      var imgCard = ui.Panel([
        ui.Panel([
          ui.Label(imgInfo.date, {padding: '6px 0px 0px 0px', fontSize: '16px', fontWeight: 'bold', width: '88px'}),
          ui.Button({label: '+ RGB', onClick: displayMapImgRGB, style: {whiteSpace: imgId, width: '16%', margin: '8px 0px 6px 10px'}}),
          ui.Button({label: '+ Falso Color', onClick: displayMapImgFC, style: {whiteSpace: imgId, width: '25%', margin: '8px 0px 6px 10px'}}),
          //ui.Button({label: '+ NDVI', onClick: displayMapImg, style: {whiteSpace: imgId, width: '16%', margin: '8px 0px 6px 10px'}}),
        ], ui.Panel.Layout.flow('horizontal')),
        nbInfoLabel,
        thumbnail
      ], null, {margin: '4px 0px 0px 4px' , width: '311px'});

      imgCardPanel.add(imgCard);
    });
  });
}

var dateVal = new Date();
dateVal.setDate(dateVal.getDate() - 10);
var targetDateSlider = ui.DateSlider({
  start: '2017-03-28',
  end: new Date(),
  value: dateVal,
  period: 1,
  style: {stretch: 'horizontal', shown: true}
});

var symbol = {
  point: '●',
};
var regionButtonPanel = ui.Panel([
    ui.Button({
      label: symbol.point + ' indique punto en mapa',
      onClick: drawPoint,
      style: {stretch: 'horizontal', margin:'1px'}}),
    ], ui.Panel.Layout.flow('horizontal'), {margin: '8px'}
);

var maxCldCvr = ui.Slider({min: 0, max: 100, value: 60, step: 1,
  style: {stretch: 'horizontal'}});

var browseButton = ui.Button({
  label: 'Busqueda de escena',
  onClick: displayBrowseImg,
  style: {stretch: 'horizontal'}
});

var dateInterval = ui.Select({
  items: ['1 semana', '1 mes', '3 meses', '6 meses'],
  placeholder: '1 mes',
  value: '1 mes',
  style: {stretch: 'horizontal'}
});


var title = ui.Label('Visualizador Sentinel-2 SR', {fontSize: '16px', fontWeight: 'bold'});
var instr1 = ui.Label('1. Seleccione un punto en el mapa', {fontSize: '14px'});
var instr2 = ui.Label('2. Seleccione fecha final', {fontSize: '14px', margin: '8px 8px 4px 8px'});
var instr3 = ui.Label('3. Seleccione rango de tiempo', {fontSize: '14px', margin: '8px 8px 4px 8px'});
var instr4 = ui.Label('4. Seleccione máximo porcentaje de nubes', {fontSize: '14px'});

var controlPanel = ui.Panel([
    title,
    instr1,
    regionButtonPanel,
    instr2,
    targetDateSlider,
    instr3,
    dateInterval,
    instr4,
    maxCldCvr,
    browseButton,
  ],
  null, {position: 'bottom-left', width: '250px'}
);

var waitMsg = ui.Label({
  value: '⚙️' + ' Procesando, favor espere...',
  style: {
    stretch: 'horizontal',
    textAlign: 'center',
    backgroundColor: '#BFB800'
  }
});

var imgCardPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal', true),
  style: {width: '337px', backgroundColor: '#BFB800'}
});

var splitPanel = ui.SplitPanel({
  firstPanel: map,
  secondPanel: imgCardPanel,
  orientation: 'horizontal',
  wipe: false,
});

map.setControlVisibility({zoomControl: false});
map.add(controlPanel);
ui.root.add(splitPanel);