
'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();


module.exports = 
{
	//Function to update the Like Counter in the Moment Table
	getCommentDetail: function(comment_id = ""){

		return new Promise(function(resolve, reject){

				const params = { 
		              TableName: 'Thread',
		              IndexName:"user_id-created_datetime-index",
		              KeyConditionExpression: "#user_id = :user_id",
		              ProjectionExpression:"thread_id, thread_name, moment_counter",
		              ExpressionAttributeNames:{
		                  "#user_id": "user_id"
		              },
		              ExpressionAttributeValues: {
		                  ":user_id": user_id
		              },
		              ScanIndexForward: false     
			    };

			    if(thread_id != ""){
			    	params.FilterExpression = " #thread_id = :thread_id";
			    	params.ExpressionAttributeNames["#thread_id"]= "thread_id";
			    	params.ExpressionAttributeValues[":thread_id"]= thread_id
			    }
			    
		      //var queryExecute = function(callback) {       
		      dynamo.query(params, function(err, result) {
		        if (err) {
		            reject("ERROR");
		        } else {
		            resolve(result.Items)
		        }
		      });
			  //console.log(params);

		});
	},

	

}