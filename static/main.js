
// Mapbox api key
const Key = '...';

window.onload = init;

var L_Map = {};
var Router = {};

var route_polyline = {};
var current_length = 0;

var isPlanning = false;

var StartMarker = {};
var EndMarker =  {};

const fileInput = document.getElementById('fileInput');

var latlngHistory = [];

// Clears line and markers off the map
function clearMap(){


    // Remove map layers
    L_Map.removeLayer(route_polyline)
    L_Map.removeLayer(StartMarker)
    L_Map.removeLayer(EndMarker)

    
    
    recalculateLength();
    //document.getElementById("DistanceCount").innerText = "Distance: " + (current_length/1000).toFixed(2) + " Km";

}

// Recalculates route length
function recalculateLength(){
    current_length = 0;
    if(L_Map.hasLayer(route_polyline)){
        latlngs = route_polyline.getLatLngs();
        for(let i = 0; i < latlngs.length-1; i++){
            current_length += L_Map.distance(latlngs[i],latlngs[i+1]);
        }
    }
    
    document.getElementById("DistanceCount").innerText = "Distance: " + (current_length/1000).toFixed(2) + " Km";
}

// NEEDS REWORK
// Removes end of route
function undoPoint(){
    latlngs = route_polyline.getLatLngs();
    if(latlngs.length > 0){

        // Remove last point
        latlngs.pop();

        // Redraw line
        route_polyline.setLatLngs(latlngs);
        
        // Update start/end markers
        if(latlngs.length == 0){
            L_Map.removeLayer(StartMarker);
            L_Map.removeLayer(EndMarker);
        }else{
            EndMarker.setLatLng(latlngs[latlngs.length - 1]);
        }
        
    }

    recalculateLength();
}

// Downloads file
function downloadFile(data, fileName, fileType){
    var a = document.createElement('a');
    var file = new Blob([data], {type: fileType});
    a.href = URL.createObjectURL(file);
    a.download = fileName
    a.click();
}

// Saves route to geoJSON
function SaveRoute(){
    if(L_Map.hasLayer(route_polyline)){

        // Convert route to GeoJson and trigger download
        GJson = route_polyline.toGeoJSON(5);
        downloadFile(JSON.stringify(GJson), "MyRoute.geojson", "text/plain");
        
    }
}

// Saves route to GPX
function ExportGPX(){
    gpxString = togpx(route_polyline.toGeoJSON(5), {creator:"RunningPlanner"});
    downloadFile(gpxString, "MyRoute.gpx", "text/plain");
}

// Loads route from geoJSON file
function LoadRoute(event){

    // Get file and create reader
    const file = event.target.files[0];
    const reader = new FileReader();

    var fileTypes = ["geojson"];
    var extention = file.name.split('.').pop().toLowerCase(), 
    allowedfile = fileTypes.indexOf(extention) > -1;

    if(!allowedfile){
        alert("Files must be .geojson");
        return;
    }
    
    reader.onload = function (e) {
        const contents = e.target.result;
        
        clearMap();

        // Array for coords
        coords = [];

        // Load Json file
        JsonData = L.geoJson(JSON.parse(contents), {
            // For each feature get all Coords
            onEachFeature: function (feature, layer) {
                
                // Swapping lat and lng
                coords.push(feature.geometry.coordinates.map(function(value, index) {return [value[1],value[0]]; }));
            }
        });

        // Loading route from coords
        route_polyline = L.polyline(coords[0]).addTo(L_Map);
        
        // Updating Markers and Calculating length
        latlngs = route_polyline.getLatLngs();
        StartMarker = L.marker(latlngs[0]).addTo(L_Map);
        EndMarker = L.marker(latlngs[latlngs.length - 1]).addTo(L_Map);
        recalculateLength();

        L_Map.fitBounds(route_polyline.getBounds());

    };

    reader.readAsText(file);
}

// Add point to route on click (TODO)
function addToRoute(e){

    // Create polyline route if empty
    if(L_Map.hasLayer(route_polyline) == false){
        route_polyline = L.polyline([]).addTo(L_Map);
        StartMarker = L.marker([e.latlng.lat,e.latlng.lng]).addTo(L_Map);
        route_polyline.addLatLng(e.latlng);
        return;
    }

    // Routing ON
    if (document.getElementById("routingToggle").checked){
        
        var latlngs = route_polyline.getLatLngs(); // Fetching polyline points

        var pointA = latlngs[latlngs.length - 1] // End of polyline
        var pointB = [e.latlng.lat, e.latlng.lng]// Clicked location

        // Create routing control
        rControl = L.Routing.control({
            show: false,
            routeWhileDragging: false,
            autoRoute: false,
            router: Router,
            waypoints: [
                pointA, // Input start
                pointB // Input finish
            ]
        });
        // On routes found, add points to route_polyline
        rControl.on("routesfound", function(e){
            foundRoute = e.routes[0].coordinates; 
            for(let i = 0; i < foundRoute.length; i++){
                route_polyline.addLatLng(foundRoute[i]);
            }
            recalculateLength();
        })
        rControl.route(); // Find route.

    }

    // Routing OFF
    else{
        // Add point to polyline route
        route_polyline.addLatLng(e.latlng);
    }
        
    // Updating end marker
    if(L_Map.hasLayer(EndMarker) == false){
        EndMarker = L.marker([e.latlng.lat,e.latlng.lng]).addTo(L_Map);
    }
    else{
        EndMarker.setLatLng([e.latlng.lat,e.latlng.lng]);
    }

    // Update total length
    recalculateLength();
    
}

// Send route data to database
function post_route(){

    if(L_Map.hasLayer(route_polyline)){

        // TO DO;
        // GET AND SET ROUTE NAME

        // Convert route to JSON and Set form value
        route_data = document.getElementById("routeFormData");
        route_data.setAttribute('value',JSON.stringify(route_polyline.toGeoJSON(5)));

        // Submit form
        document.getElementById("routeForm").submit();
    }
}

// Load selected route from DB
function DB_Load_Route(){

    //Get selected route
    var sel = document.getElementById("routeSelect")

    // Return on empty value
    if(!sel.value){return;}

    clearMap();

    var coords = []

    var Data = L.geoJson(JSON.parse(sel.value), {
        // For each feature get all Coords
        onEachFeature: function (feature, layer) {
            //coords.push([feature.geometry.coordinates[1],feature.geometry.coordinates[0]]);
            
            // Swapping X and Y
            coords.push(feature.geometry.coordinates.map(function(value,index) {return [value[1],value[0]]; }));
        }
    });
    
    // Loading route from coords
    route_polyline = L.polyline(coords[0]).addTo(L_Map);
        
    // Updating Markers and Calculating length
    latlngs = route_polyline.getLatLngs();
    StartMarker = L.marker(latlngs[0]).addTo(L_Map);
    EndMarker = L.marker(latlngs[latlngs.length - 1]).addTo(L_Map);
    recalculateLength();

    L_Map.fitBounds(route_polyline.getBounds());
}

function init(){
    
    // Creates map
    L_Map = L.map("mapID",
        {
            center: [48, 14],
            zoom: 4,
            layers: [
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }) 
            ]
        })
    
    // ROUTER
    Router = L.Routing.mapbox(Key,
        {profile: "mapbox/walking"}
    )
    // On click events
    L_Map.on('click', function(e){

        if(isPlanning){
            addToRoute(e);
            recalculateLength();
        }
    })

    // -- Buttons --
    document.getElementById("ClearButton").onclick = clearMap;
    document.getElementById("UndoButton").onclick = undoPoint;

    // Enable / Disable
    document.getElementById("StartButton").onclick = function(){
        isPlanning = true
        document.getElementById("StartButton").disabled = true;
        document.getElementById("EndButton").disabled = false;
    }
    document.getElementById("EndButton").onclick = function(){
        isPlanning = false
        document.getElementById("StartButton").disabled = false;
        document.getElementById("EndButton").disabled = true;
    }

    // Set up save button
    document.getElementById("SaveButton").onclick = SaveRoute;

    // Add listener for loading route from file
    fileInput.addEventListener('change', LoadRoute)

    // Export to gpx
    document.getElementById("ExportButton").onclick = ExportGPX;


    // Buttons to close Login & Register popups
    document.getElementById("CloseLogin").onclick = function(e){
        document.getElementById('loginPopup').toggleAttribute("hidden");
    }
    document.getElementById("CloseRegister").onclick = function(e){
        document.getElementById('registerPopup').toggleAttribute("hidden");
    }
    
    // Buttons to Save and load from DB
    try{
        document.getElementById("SaveButton_DB").onclick = post_route;
        document.getElementById("loadButton_DB").onclick = DB_Load_Route;
    }catch{}


    recalculateLength();

}

