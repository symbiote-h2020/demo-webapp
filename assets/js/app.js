var map, featureList, boroughSearch = [], theaterSearch = [], museumSearch = [];

var sensors_markers = Array();
var measurements = Array();
var ids = Array();
var units = Array();
var coordinates = Array();
var obsProperties = Array();


var total = 0;

var table;

var properties = {1:'SO2', 5:'PM10', 7:'O3', 8:'NO2', 10:'CO', 38:'NO', 53:'Pressure', 54:'Temperature', 58:'Relative humidity', 6001:'PM2.5', };

$(window).resize(function() {
  sizeLayerControl();
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

/* Basemap Layers */
var cartoLight = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
});
var usgsImagery = L.layerGroup([L.tileLayer("http://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 15,
}), L.tileLayer.wms("http://raster.nationalmap.gov/arcgis/services/Orthoimagery/USGS_EROS_Ortho_SCALE/ImageServer/WMSServer?", {
  minZoom: 16,
  maxZoom: 19,
  layers: "0",
  format: 'image/jpeg',
  transparent: true,
  attribution: "Aerial Imagery courtesy USGS"
})]);

map = L.map("map", {
  zoom: 5,
  center: [48.208253, 16.3724584],
  layers: [cartoLight],
  zoomControl: false,
  attributionControl: false
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  // div.innerHTML = "<span class='hidden-xs'>Developed by <a href='http://bryanmcbride.com'>bryanmcbride.com</a> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "fa fa-location-arrow",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

// ----- FUNCTIONS -----

function expandMap (){
  if(document.getElementById('map').style.height == '85%'){
    var height = '50%';
    document.getElementById("expandButton").value="Expand Map";
    var bounds = new L.LatLngBounds(coordinates);
    map.fitBounds(bounds);
  }else{
    var height = '85%';
    document.getElementById("expandButton").value="Reduce Map";
    var bounds = new L.LatLngBounds(coordinates);
    map.fitBounds(bounds);
  }
  $('#map').animate({
    height: height
  }, 500, function() {
  });
}

//  Handle the click in a row that opens a modal with ths historic of the sensor of the clicked line
function handleClickRow(e){
  var table = document.getElementById("historicTable");

  var table = $('#historicTable').DataTable();

  var rows = table.rows().remove().draw();

  $("#loading").show();

  // console.log(e.target.parentNode.getAttribute('url'));

  // var url = 'http://enviro5.ait.ac.at:8080/openUwedat-oData/DemoService.svc/Sensors(%27'+e.target.parentNode.id+'%27)/Observations?%24format=json';

  var url = e.target.parentNode.getAttribute('url');
  $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        cache: false,
        success: function(data){
          $("#loading").hide();

          for (var i = 0; i < data.value.length; i++){

            var dateTime = data.value[i].ResultTime.replace("T", " ").replace("Z", " ");
            var date = dateTime.split(" ")[0];
            var time = dateTime.split(" ")[1];
            var measurementValue = data.value[i].ObservationValue.Value;
            var unit = data.value[i].ObservationValue.UnitOfMeasurement
            var feature = data.value[i].Location.name;
            try{
              var observedProperty = properties[data.value[0].ObservationValue.ObservedProperty.match(/\d+/)[0]];
            }
            catch(err){
              var observedProperty = data.value[0].ObservationValue.ObservedProperty;
            }

            measurementValue = Math.round(measurementValue * 100)/100;

            // var row = table.insertRow(-1);
            // var cell1 = row.insertCell(0);
            // var cell2 = row.insertCell(1);
            // var cell3 = row.insertCell(2);
            // var cell4 = row.insertCell(3);
            // var cell5 = row.insertCell(4);
            // var cell6 = row.insertCell(5);
            // cell1.innerHTML = date;
            // cell2.innerHTML = time;
            // cell3.innerHTML = measurementValue;
            // cell4.innerHTML = observedProperty;
            // cell5.innerHTML = unit;
            // cell6.innerHTML = feature;

            var table = $('#historicTable').DataTable();
            var row = table
            .row.add( [ date, time, measurementValue, observedProperty, unit, feature ] )
            .draw()
            .node();
          }
          $('#infoSensorModal').modal('show');
           $('#infoSensorModalTitle').text("Sensor " + e.target.parentNode.id  + " historic data")

        },
        error:function(){
          $("#loading").hide();
          // Error code goes here.
          $('#errorModal').modal('show');
        }
    });
}

// Remove data (sensors) from previous search
function deleteSensor(){
  for (var i = 0; i < sensors_markers.length; i++){
    map.removeLayer(sensors_markers[i]);
  }
}

// Get the sensors
function getSensors(){

  var searchForm = document.forms["searchForm"];

  var name = $('#name').val();
  var owner = $('#owner').val();
  var temperature = $('#temperature').prop("checked");
  var humidity = $('#humidity').prop("checked");

  console.log(name + " " + owner + " " + temperature + " " + humidity)

  function parseSensor(data) {
    $('#searchModal').modal('hide');

    if (data.value.length != 0 && data.value[0].Location.lat != 0 && data.value[0].Location.lon !=0){

      var url = this.url.split("%27")
      id = url[1];

      var measurementValue = data.value[0].ObservationValue.Value;
      var lat = data.value[0].Location.lat;
      var lon = data.value[0].Location.lon;
      var time = data.value[0].ResultTime;
      var unit = data.value[0].ObservationValue.UnitOfMeasurement;

      try{
        var observedProperty = properties[data.value[0].ObservationValue.ObservedProperty.match(/\d+/)[0]];
      }
      catch(err){
        var observedProperty = data.value[0].ObservationValue.ObservedProperty;
      }

      measurementValue = Math.round(measurementValue * 100)/100;

      var marker = L.marker([lat, lon]).addTo(map);

      sensors_markers.push(marker);
      measurements.push(measurementValue);
      ids.push(id);
      units.push(data.value[0].ObservationValue.UnitOfMeasurement);
      obsProperties.push(observedProperty);

      var currentCoordinates = Array();
      currentCoordinates.push(data.value[0].Location.lat);
      currentCoordinates.push(data.value[0].Location.lon);
      coordinates.push(currentCoordinates);

      for (var i = 1; i<data.value.length; i++){
        if (String(data.value[0].ResultTime) == String(data.value[i].ResultTime) && data.value[0].Location.lat ==  data.value[i].Location.lat && data.value[0].Location.lon == data.value[i].Location.lon){
          console.log("ENTRA")
          var measurementValue = data.value[i].ObservationValue.Value;
          var unit = data.value[i].ObservationValue.UnitOfMeasurement;

          try{
            var observedProperty = properties[data.value[i].ObservationValue.ObservedProperty.match(/\d+/)[0]];
          }
          catch(err){
            var observedProperty = data.value[i].ObservationValue.ObservedProperty;
          }
          measurementValue = Math.round(measurementValue * 100)/100;

          sensors_markers.push(marker);
          measurements.push(measurementValue);
          ids.push(id);
          units.push(data.value[i].ObservationValue.UnitOfMeasurement);
          obsProperties.push(observedProperty);
        }
      }

      marker.on('click', function(e) {
        var content = "<table class='table table-striped' cellspacing='0' <thead> <th>Longitude</th> <th>Latitude</th> </thead> <tbody> <tr> <td>" + e.latlng.lng + " </td> <td>" + e.latlng.lat + " </td> </tr></tbody></table> <p></p>"
        content += "<table class='table table-hover table-striped' cellspacing='0'> <thead> <th>Sensor</th> <th>Obs. property</th> <th> Last Measurement </th> <th> Unit </th> </thead> <tbody> ";
        // console.log(e.latlng)
        for (i = 0; i < sensors_markers.length; i++){
          if(sensors_markers[i]._latlng.lat  == e.latlng.lat && sensors_markers[i]._latlng.lng  == e.latlng.lng){
            total += 1;
            content += "<tr><td>" + ids[i] + "</td>" + "<td>" + obsProperties[i] + "</td>" + "<td>" + measurements[i] + "</td>"+ "<td>" + units[i] + "</td></tr>"
          }
        }
        console.log(total)
        content += "</tbody></table> <p></p>"
        var popup = L.popup({maxHeight:500, maxWidth:500})
         .setLatLng(e.latlng)
         .setContent(content)
         .openOn(map);
      });

      var dateTime = time.replace("T", " ").replace("Z", " ");
      var date = dateTime.split(" ")[0];
      var time = dateTime.split(" ")[1];

      var table = $('#sensorsTable').DataTable();
      var row = table
      .row.add( [ id, lon, lat, measurementValue, observedProperty, data.value[0].ObservationValue.UnitOfMeasurement, date, time ] )
      .draw()
      .node();

      row.setAttribute("id", id);
      row.setAttribute("url", this.url);
      row.addEventListener('click', handleClickRow);
      // console.log(sensors_markers.length + " " +ids.length)
  }

};

  $(document).ajaxStop(function() {
    // LAST AJAX CALL Finishes
    $("#loading").hide();

    var bounds = new L.LatLngBounds(coordinates);
    map.fitBounds(bounds);

  });
  //
  // var url = 'http://62.3.168.148:8201/core_api/resources';
  //
  // if (name)
  //   url += '?name='+name
  // if (owner)
  //   url += '?owner='+owner
  // if(temperature == true)
  //   url += '?temperature='
  //
  // $("#loading").show();
  // $.ajax({
  //       url: url,
  //       type: "GET",
  //       dataType: "json",
  //       cache: false,
  //       success: function(data){
  //         $.each(data, function( index, each ) {
  //           console.log(index + " " + each)
  //           // Enviar (POST) todos os ID's recebidos para ir buscar o url de cada um e depois passar cada um dos url ao parseSensor para ir buscar retirar os dados de cada sensor
  //           // var idUrl = 'http://enviro5.ait.ac.at:8080/openUwedat-oData/DemoService.svc/Sensors(%27'+each.ID+'%27)/Observations?%24format=json';
  //           // $.ajax({
  //           //     url: idUrl,
  //           //     type: "GET",
  //           //     dataType: "json",
  //           //     cache: false,
  //               // success: parseSensor,  //fazer um for each para cada url (um url por ID devolvido na pesquisa) recebido no POST
  //           //   });
  //         });
  //
  //       },
  //       error:function(){
  //         // TODO add error message
  //       }
  //   });

  var url = 'http://enviro5.ait.ac.at:8080/openUwedat-oData/DemoService.svc/Sensors?%24format=json';

  // var url ="http://161.53.19.121:8080/openiotRAP/Sensors?%24format=json"
  $("#loading").show();
  $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        cache: false,
        success: function(data){

          $('#map').animate({
            height: '50%'
          }, 500, function() {
            // Animation complete.
          });
          document.getElementById("errorFooter").style.display = "none";

          $.each(data.value, function( index, each ) {
            var idUrl = 'http://enviro5.ait.ac.at:8080/openUwedat-oData/DemoService.svc/Sensors(%27'+each.ID+'%27)/Observations?%24format=json';
            // var idUrl = "http://161.53.19.121:8080/openiotRAP/Sensors(%27" + each.ID + "%27)/Observations"
            $.ajax({
                url: idUrl,
                type: "GET",
                dataType: "json",
                cache: false,
                success: parseSensor,
                error: function(){
                  // document.getElementById("sensorsContent").style.display = "none";
                  // document.getElementById("expandButton").style.display = "none";
                  //
                  // $('#searchModal').modal('show');
                  // document.getElementById("errorFooter").style.display = "initial";
                  // document.getElementById("errorSearch").innerHTML="It was not possible to proceed with the search. Please try again."
                  //
                  // $('#map').animate({
                  //   height: '85%'
                  // }, 500, function() {
                  //   // Animation complete.
                  // });
                  // $("#loading").hide();
                }
              });
          });

          document.getElementById("sensorsContent").style.display = "initial";
          document.getElementById("expandButton").style.display = "initial";

        },
        error: function(){
          $('#searchModal').modal('show');

          document.getElementById("errorFooter").style.display = "initial";
          document.getElementById("errorSearch").innerHTML="It was not possible to proceed with the search. Please try again."
          //
          document.getElementById("sensorsContent").style.display = "none";
          document.getElementById("expandButton").style.display = "none";

          $('#map').animate({
            height: '85%'
          }, 500, function() {

          });
        },
        // timeout:3000
    });
}

// ----- EVENT LISTENERS -----

// Show modal for search
searchTopBar.addEventListener('click', function() {
  $('#searchModal').modal('show');

  document.getElementById("errorFooter").style.display = "none";
  document.getElementById("errorSearch").innerHTML=""
}, false);


// Submit model search
searchModalButton.addEventListener('click', function() {
  document.getElementById("sensorsContent").style.display = "none";
  document.getElementById("expandButton").style.display = "none";

  var table = $('#sensorsTable').DataTable();

  var rows = table.rows().remove().draw();

  $('#map').animate({
    height: '85%'
  }, 500, function() {
    // Animation complete.
  });

  deleteSensor();
  sensors_markers = [];
  measurements = [];
  ids = [];
  units = [];
  coordinates = [];
  obsProperties = [];

  getSensors();
}, false);


// ----- DOCUMENT READY -----
$(document).on("ready", function () {
  $("#loading").hide();

  $('#searchModal').modal('show');

  var searchButton = document.getElementById('searchButton');
  var searchTopBar = document.getElementById('searchTopBar');
  var searchModalButton = document.getElementById('searchModalButton');

});
// Leaflet patch to make layer control scrollable on touch browsers
// var container = $(".leaflet-control-layers")[0];
// if (!L.Browser.touch) {
//   L.DomEvent
//   .disableClickPropagation(container)
//   .disableScrollPropagation(container);
// } else {
//   L.DomEvent.disableClickPropagation(container);
// }
