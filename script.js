class OLMap {
  constructor(map_div, zoom, center) {
    this.map = new ol.Map({
      target: map_div,
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat(center),
        zoom: zoom
      })
    });
  }
}

class Overlay {
  constructor(map, element = document.getElementById("popup"), offset = [0, -15], positioning = 'bottom-center',   className = 'ol-tooltip-measure ol-tooltip .ol-tooltip-static') {
    this.map = map;
    this.overlay = new ol.Overlay({
      element: element,
      offset: offset,
      positioning: positioning,
      className: className
    });
    this.overlay.setPosition([0,0]);
    this.overlay.element.style.display = 'block';      
    this.map.addOverlay(this.overlay);    
    
  }
}


class Draw {
  
  constructor(type, map) {
    this.map = map;
    this.draw = new ol.interaction.Draw({
        type: type,
        stopClick: true
    });
    this.draw.on('drawstart', this.onDrawStart);
    this.draw.on('drawend', this.onDrawEnd);
    this.map.addInteraction(this.draw);    
    
  } 
  
  onDrawStart = (e) => {        
    this.coordinates_length = 0;
    this.partDistanceOverlay = null;
    this.totalAreaDistanceOverlay = new Overlay(this.map).overlay;
    this.lastPartLineOverlay = new Overlay(this.map).overlay;
    e.feature.getGeometry().on('change', this.onGeomChange);    
  }
  
  onDrawEnd = (e) => {        
    //Do Something
  }

  onGeomChange = (e) => {    
    let geomType = e.target.getType();
    let coordinates = e.target.getCoordinates();
    if(geomType == "Polygon"){
      coordinates = e.target.getCoordinates()[0];
    }    

    if (coordinates.length > this.coordinates_length) {                
      this.partDistanceOverlay = new Overlay(this.map).overlay;
      this.coordinates_length =  coordinates.length;      
    }
    else {                     
      this.coordinates_length =  coordinates.length;            
    }    
    
    let partLine = new ol.geom.LineString([coordinates[this.coordinates_length-2], coordinates[this.coordinates_length-1]]);    

    if(geomType == "Polygon") {
      partLine = new ol.geom.LineString([coordinates[this.coordinates_length-3], coordinates[this.coordinates_length-2]]);    
    }  

    this.calDistance(this.partDistanceOverlay, partLine.getFlatMidpoint(), partLine.getLength());  

    if (geomType == "LineString" && this.coordinates_length > 2 && e.target.getLength() > new ol.geom.LineString([coordinates[0], coordinates[1]]).getLength()) {
      this.calDistance(this.totalAreaDistanceOverlay, coordinates[this.coordinates_length-1], e.target.getLength());
    }  
    if (geomType == "Polygon" && this.coordinates_length > 3) {
      this.calArea(this.totalAreaDistanceOverlay, e.target.getFlatInteriorPoint(), e.target.getArea());      
      partLine = new ol.geom.LineString([coordinates[this.coordinates_length-2], coordinates[this.coordinates_length-1]]);    
      this.calDistance(this.lastPartLineOverlay, partLine.getFlatMidpoint(), partLine.getLength());
    } 
  }

  calDistance = (overlay, overlayPosition, distance) => {  
    if(parseInt(distance) == 0) {    
      overlay.setPosition([0,0]);       
    }
    else {
      overlay.setPosition(overlayPosition);      
      if (distance >= 1000) {
        overlay.element.innerHTML = (distance/1000).toFixed(2) + ' km';
      }
      else {
        overlay.element.innerHTML = distance.toFixed(2) + ' m';
      }
    }    
  }

  calArea = (overlay, overlayPosition, area) => {    
    if(parseInt(area) == 0) {    
      overlay.setPosition([0,0]);  
    }
    else {
      overlay.setPosition(overlayPosition);  
      if (area >= 10000) {
        overlay.element.innerHTML = Math.round((area / 1000000) * 100) / 100  + ' km<sup>2<sup>';
      }
      else {
        overlay.element.innerHTML =  Math.round(area * 100) / 100  + ' m<sup>2<sup>';
      }
    }   
  }

}

let map = new OLMap('map', 9, [-96.6345990807462, 32.81890764151014]).map;
let draw = new Draw('Polygon', map);
