'use strict';

const AWS = require('aws-sdk');

var lambda = new AWS.Lambda({
    region: process.env.AWS_REGIONNAME //change to your region
});

module.exports = 
{
	//Function to get the location from lat, long
	store: function(user_id, data){

		return new Promise(function(resolve, reject){
			 
			  //Invoke Lambda to add data to Elastic Search
	          // lambda.invoke({
	          //       FunctionName: 'LifeScape-getStream-prod-sendNotification', 
	          //       InvocationType: "Event", 
	          //       Payload: JSON.stringify({
	          //         'user_id': user_id,
	          //         'data' : data
	          //       }) // pass params
	          //   }, function(error, data) {
	          //     if (error) {
	          //         console.log(error);
	          //         //resolve(0)
	          //     }
	          //     //resolve(1)
	          // });

	          // //Invoke Lambda to send Push Notifications
	          // lambda.invoke({
	          //       FunctionName: 'LifeScape-prod-sendSNSNotificaton', 
	          //       InvocationType: "Event", 
	          //       Payload: JSON.stringify({
	          //         'user_id': user_id,
	          //         'data' : data
	          //       }) // pass params
	          //   }, function(error, data) {
	          //     if (error) {
	          //         console.log(error);
	          //       	//resolve(0)
	          //     }
	              
	          // });

	          resolve(1)
		});

	}

}