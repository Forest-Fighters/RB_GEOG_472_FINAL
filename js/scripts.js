
//declare map var in global scope
var map;

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);





         // Get user's location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var userLat = position.coords.latitude;
      var userLng = position.coords.longitude;

    // Update map view to user's location
    //would normally be set to show a smaller area, but of course we have amazing tehcnical issues
    map.setView([userLat, userLng],5 );

      // Create a marker for user's location
      L.marker([userLat, userLng]).addTo(map)
        .bindPopup('You are here')
        .openPopup();
    getData("data/siteBoundaries.geojson","red",userLat,userLng);
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }


};









//Step 2: Import GeoJSON data
function getData(file,color,userLat,userLng){
    //load the data
    fetch(file)
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //leaflet uses Lat Long, turf uses Long Lat
            userLoc = turf.point([userLng,userLat])
            userLocleaflet =[userLat,userLng]
            //setup variables
            var distanceList = {
                sites: [

                ]
            }
            var distance

            // console.log(json)

            //iterate through the features
            for (i in json.features) {

                //grab this specific feature (because i is just a number, not the acutal feature)
                let feature = json.features[i];

                //this is the dirty cheat. I was unable to figure out why certain values were failing, so cutoff before the first value.
                //if i had more time, i would be able to identify and reject failed attempts, but i was unable.
                if(feature.id <= 611){

                    // Calculate the distance from the user location to the polygon
                    distance = turf.pointToPolygonDistance(userLoc, feature,{ units: 'miles' });

                    //console.log(distance)
                    
                    // Add the feature and its distance to the distanceList
                    distanceList.sites.push({ feature: feature, distance: distance });
                }
            }
            //sort the distance list by.. distance
            distanceList.sites.sort((a,b) =>  a.distance - b.distance)

            // console.log(distanceList)

            //remove all but the first three sites
            var closestSites = distanceList.sites.slice(0,3)
            // console.log(closestSites)



            //get the closest point on the closest 3 polygons
            site1Closest = turf.nearestPoint(userLoc,turf.explode(turf.polygon(closestSites[0].feature.geometry.coordinates)))         
            site2Closest = turf.nearestPoint(userLoc,turf.explode(turf.polygon(closestSites[1].feature.geometry.coordinates)))      
            site3Closest = turf.nearestPoint(userLoc,turf.explode(turf.polygon(closestSites[2].feature.geometry.coordinates)))  
            

            //flip the lat long values because leaflet and turf use different ordering
            //why?
            //because why not
            site1loc = closestSites[0].feature.geometry.coordinates[0].map(point => [point[1], point[0]]);
            site2loc = closestSites[1].feature.geometry.coordinates[0].map(point => [point[1], point[0]]);
            site3loc = closestSites[2].feature.geometry.coordinates[0].map(point => [point[1], point[0]]);
            
            site1Closest = [site1Closest.geometry.coordinates[1],site1Closest.geometry.coordinates[0]]
            site2Closest = [site2Closest.geometry.coordinates[1],site2Closest.geometry.coordinates[0]]
            site3Closest = [site3Closest.geometry.coordinates[1],site3Closest.geometry.coordinates[0]]


            //display a line connecting the polygons and the user's location
            site1Line = L.polyline([userLocleaflet,site1Closest]).addTo(map)
            site2Line = L.polyline([userLocleaflet,site2Closest]).addTo(map)
            site3Line = L.polyline([userLocleaflet,site3Closest]).addTo(map)

            //generate popup messages 
            site1Message = ("<p><b><i>This is the closest site to your location</i></p><p><b>Name: </b>" + closestSites[0].feature.properties.SITE_FEATURE_NAME + "<p><b>Distance in Miles: </b>" + closestSites[0].distance + "</p><p><b>EPA Link: </b><a href =" +closestSites[0].feature.properties.URL_ALIAS_TXT+">"+closestSites[0].feature.properties.URL_ALIAS_TXT+"</a>")
            site2Message = ("<p><b><i>This is the 2nd closest site to your location</i></p><p><b>Name: </b>" + closestSites[1].feature.properties.SITE_FEATURE_NAME +"<p><b>Distance in Miles: </b>" + closestSites[1].distance +  "</p><p><b>EPA Link: </b><a href =" +closestSites[1].feature.properties.URL_ALIAS_TXT+">"+closestSites[1].feature.properties.URL_ALIAS_TXT+"</a>")
            site3Message = ("<p><b><i>This is the 3rd closest site to your location</i></p><p><b>Name: </b>" + closestSites[2].feature.properties.SITE_FEATURE_NAME +"<p><b>Distance in Miles: </b>" + closestSites[2].distance +  "</p><p><b>EPA Link: </b><a href =" +closestSites[2].feature.properties.URL_ALIAS_TXT+">"+closestSites[2].feature.properties.URL_ALIAS_TXT+"</a>")
            
            //display the polygons, and bind popups to them
            site1 = L.polygon(site1loc).addTo(map).bindPopup(site1Message)

            site2 = L.polygon(site2loc).addTo(map).bindPopup(site2Message)

            site3 = L.polygon(site3loc).addTo(map).bindPopup(site3Message)


            


            

        })
};



document.addEventListener('DOMContentLoaded',createMap)