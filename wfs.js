import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import {fromLonLat} from 'ol/proj';
import OSM from 'ol/source/OSM';
import './style.css';
import {Map, View, Feature} from 'ol';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import Point from 'ol/geom/Point';
import {Voronoi} from './rhill-voronoi-core.js';
import Polygon from 'ol/geom/Polygon';
import {extend} from 'ol/extent';
import {Delaunay} from "https://cdn.skypack.dev/d3-delaunay@6";


var vectorSource;
var vector;

vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: function (extent) {
    return (
      'http://localhost:8082/geoserver/GeoPerformance/wfs?service=WFS&' +
      'version=2.0.0&request=GetFeature&typename=GeoPerformance:random2000_xy&' +
      'outputFormat=application/json&srsname=EPSG:3857&' +
      'bbox=' +
      extent.join(',') +
      ',EPSG:3857'
    );
  },
  strategy: bboxStrategy,
});



const myStyle = new Style({
      image: new Circle({
        radius: 5,
        fill: new Fill({color: 'red'}),
        stroke: new Stroke({
          color: [255,255,255], width: 1
        })
      })
      
});

const polyStyle = new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.01)',
    }),
});

vector = new VectorLayer({
  source: vectorSource,
  style: myStyle,
});



const raster = new TileLayer({
  source: new OSM()
});

var map = new Map({
  layers: [raster, vector/**/],
  target: 'map',
  view: new View({
    center: fromLonLat([10, 51.2]),
    
    zoom: 5,
  }),
});

//var voronoi = new Voronoi();

var voronoiLayer;

$('#button4').click(function createVoronoi(){
	map.removeLayer(voronoiLayer)
	var coord = [];
	var olPolygonArray = [[[]]];
	var voronoi = new Voronoi();
	//var bbox = {xl: 0, xr: 800000000, yt: 0, yb: 600000000000}; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
	var diagram;
	
    var features = vectorSource.getFeatures();
    var extent = features[0].getGeometry().getExtent().slice(0);
    features.forEach(function(feature){ extend(extent,feature.getGeometry().getExtent())});
    
    var bbox = {xl: extent[0], xr: extent[2], yt: extent[1], yb: extent[3]};
    //console.log(bbox);
    features.forEach((feature) => {
        var temp = feature.getGeometry().getCoordinates();
        coord.push({x: Math.trunc(temp[0]), y: Math.trunc(temp[1])});
    });
    
    diagram = voronoi.compute(coord, bbox);
	console.log(diagram);
	
	var edges = diagram.edges,
    iEdge = edges.length,
    edge, v;
    
    var temp = [[]];

	for(var i = 0; i < iEdge; i++)
	{
		edge = edges[i];
		v = edge.va;
		temp.push([v.x, v.y]);
		
		v = edge.vb;
		temp.push([v.x, v.y]);
		temp.shift();
		olPolygonArray.push(temp);
		temp = [[]];
		
	}
	olPolygonArray.shift();

	var polyFeature = new Feature({
    geometry: new Polygon(
        
            olPolygonArray
        
    	)
	});
	//polyFeature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
	voronoiLayer = new VectorLayer({
    	source: new VectorSource({
        	features: [
        	polyFeature]
    	}),
    	style: polyStyle
	});
	//console.log(vectorLayer);
	
	map.addLayer(voronoiLayer);
			
});

$('#button5').click(function createVoronoiDelaunay(){
	map.removeLayer(voronoiLayer)
	var coord = [];
	var delaunay, voronoi;
	
	
	
    var features = vectorSource.getFeatures();
    var extent = features[0].getGeometry().getExtent().slice(0);
    features.forEach(function(feature){ extend(extent,feature.getGeometry().getExtent())});
    
    //var bbox = {xl: extent[0], xr: extent[2], yt: extent[1], yb: extent[3]};
    //console.log(bbox);
    features.forEach((feature) => {
        var temp = feature.getGeometry().getCoordinates();
        coord.push([temp[0], temp[1]]);
    });
    
    const start = performance.now();
    delaunay = Delaunay.from(coord);
	voronoi = delaunay.voronoi(extent);
	const end = performance.now();
	console.log(`Execution time: ${end - start} ms`);
	//console.log(voronoi);
	
	const simplifiedPolygons = [];

    for(let cell of voronoi.cellPolygons()) {
      let polygon = [];

      for(let vertex of cell) {
        polygon.push([vertex[0], vertex[1]]);
      }

      simplifiedPolygons.push(polygon);
    }
	//console.log(simplifiedPolygons);
	
	var polyFeature = new Feature({
    geometry: new Polygon(
        
            simplifiedPolygons
        
    	)
	});
	//polyFeature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
	voronoiLayer = new VectorLayer({
    	source: new VectorSource({
        	features: [
        	polyFeature]
    	}),
    	style: polyStyle
	});
	//console.log(vectorLayer);
	
	map.addLayer(voronoiLayer);
			
});




$('#button9').click(function clearPolygons(){
	 map.removeLayer(voronoiLayer)
	 map.removeLayer(vector)
	// voronoiLayer.getSource().clear();
	 vectorSource.clear();
	 vectorSource = new VectorSource({
  		format: new GeoJSON(),
  		url: function (extent) {
    		return (
      		'http://localhost:8082/geoserver/GeoPerformance/wfs?service=WFS&' +
      		'version=2.0.0&request=GetFeature&typename=GeoPerformance:random2000_xy&' +
      		'outputFormat=application/json&srsname=EPSG:3857&' +
      		'bbox=' +
      		extent.join(',') +
      		',EPSG:3857'
    		);
  		},
  		strategy: bboxStrategy,
	});
	
	vector = new VectorLayer({
  		source: vectorSource,
  		style: myStyle,
	});
	map.addLayer(vector)
});

$('#button2').click(function filter1000(){
	 map.removeLayer(voronoiLayer);
	 map.removeLayer(vector);
	 //voronoiLayer.getSource().clear();
	 vectorSource.clear();
	 vectorSource = new VectorSource({
  		format: new GeoJSON(),
  		url: function (extent) {
    		return (
      		'http://localhost:8082/geoserver/GeoPerformance/wfs?service=WFS&' +
      		'version=2.0.0&request=GetFeature&typename=GeoPerformance:random2000_xy&' +
      		'outputFormat=application/json&srsname=EPSG:3857&' +
      		'bbox=' +
      		extent.join(',') +
      		',EPSG:3857&'+
      		'startIndex=0&count=1000'
    		);
  		},
  		strategy: bboxStrategy,
	});
	
	vector = new VectorLayer({
  		source: vectorSource,
  		style: myStyle,
	});
	map.addLayer(vector)
});

$('#button3').click(function filter1000(){
	 map.removeLayer(voronoiLayer);
	 map.removeLayer(vector);
	 //voronoiLayer.getSource().clear();
	 vectorSource.clear();
	 vectorSource = new VectorSource({
  		format: new GeoJSON(),
  		url: function (extent) {
    		return (
      		'http://localhost:8082/geoserver/GeoPerformance/wfs?service=WFS&' +
      		'version=2.0.0&request=GetFeature&typename=GeoPerformance:random2000_xy&' +
      		'outputFormat=application/json&srsname=EPSG:3857&' +
      		'bbox=' +
      		extent.join(',') +
      		',EPSG:3857&'+
      		'startIndex=0&count=100'
    		);
  		},
  		strategy: bboxStrategy,
	});
	
	vector = new VectorLayer({
  		source: vectorSource,
  		style: myStyle,
	});
	map.addLayer(vector)
});

