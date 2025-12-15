'use strict';

var MapboxClient = require('mapbox');

var client = new MapboxClient('pk.eyJ1IjoiYWN0ZGV2ZWxvcGVyIiwiYSI6ImNqaGl4MDB5ZzAxNWszNm1sdm9pcnRhOGgifQ.g4DQWAAQsvfi2V8icc7d4A');

module.exports = 
{
	//Function to get the location from lat, long
	fetchLocation: function(location){

		return new Promise(function(resolve, reject){
			console.log(location);

		  client.geocodeReverse(location)
		  .then(function(res) {

		    var data = res.entity; // data is the geocoding result as parsed JSON
		    if(data.features.length > 0)
		    	resolve(data.features[0].place_name)
		    else
		    	resolve("")

		  })
		  .catch(function(err) {
		    // handle errors
		    console.log(err)
		  });



		});

	}

}