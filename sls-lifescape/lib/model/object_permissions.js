'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
var uuid = require('uuid');

module.exports = 
{
	//Function to store the permissons of invited users
	inviteusers: function(object_id, touid, object_type, role = 'author'){

	    return new Promise(function(resolve, reject){
	    	//Prepare the Data to store in table
	        let params = {
	          TableName: 'ObjectPermissions',
	          Item: {
		          "object_id": object_id,
		          "user_id": touid,
		          "object_type": object_type,
		          "role": role,
		          "status": "sent"
		        }
	        };

	        //Call the dynamo to store data
    	    dynamo.put(params, function(error, result)  {
	          if (error)	resolve(0)
	          else			resolve(1);
        	});
	    });
	},

	//Function to store the permissons of invited users
	getUserPermittedObjectList: function(user_id, object_type, role = 'author'){

	    return new Promise(function(resolve, reject){
	    	//Prepare the Data to store in table
	        let params = { 
		              TableName: 'ObjectPermissions',
		              KeyConditionExpression: "#user_id = :user_id and #object_type = :object_type",
		              ExpressionAttributeNames:{
		              		"#object_type":"object_type",
		                  "#user_id": "user_id"
		              },
		              ExpressionAttributeValues: {
		              	  ":object_type": "thread",
		                  ":user_id": user_id
		              },
		              ScanIndexForward: true     
			    };
			
	        //Call the dynamo to store data
    	    dynamo.query(params, function(error, result)  {
	          if (error)	resolve(0)
	          else{
				console.log(result);	
	          }
	          
        	});
	    });
	}
}