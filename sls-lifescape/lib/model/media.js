
'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();


module.exports = 
{
	//Function to update the Like Counter in the Moment Table
	updateMomentIds: function(datalineobject_id, media_id){

		//return new Promise(function(resolve, reject){
			
			media_id.forEach(function(mid){

				var params = {
			      TableName: 'Media',
			      Key:{
			        "media_id": mid
			      },
			      UpdateExpression: "set datalineobject_id = :datalineobject_id",

			      ExpressionAttributeValues : {
			            ':datalineobject_id': datalineobject_id
			      },
			      ReturnValues:"UPDATED_NEW"
			    };
			    //console.log(params);

				dynamo.update(params, (error, result) => {
		      		if (error) {
		        		console.log(error);
		      		}
		      		console.log("Media Table: moment ids are updated")
		      		//resolve(1)
			    });
			});	

		//});
	},

	//Function to update the Like Counter in the Moment Table
	deleteMedias: function(datalineobject_id, old_media_id, media_id){

//		return new Promise(function(resolve, reject){
			
			old_media_id.forEach(function(mid){
				
				if(media_id.indexOf(mid) > -1){
				}
				else{
					var params = {
				      TableName: 'Media',
				      Key:{
				        "media_id": mid
				      },
				      ConditionExpression: "datalineobject_id = :datalineobject_id",

				      ExpressionAttributeValues : {
				        ':datalineobject_id': datalineobject_id
				      }
				    };
			    	console.log(params);

					dynamo.delete(params, (error, result) => {});
				}
			});	

//		});
	},

	getMediaDetail: function(media_id){

	    return new Promise(function(resolve, reject){
	    	
	    	const params = { 
	            TableName: 'Media',
	            KeyConditionExpression: "#media_id = :media_id",
	            ExpressionAttributeNames:{
	                "#media_id": "media_id",
	            },
	            ExpressionAttributeValues: {
	                ":media_id": media_id,
	            },
	            ScanIndexForward: false
	        };

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						resolve([])
					} else {
						resolve(result.Items);
					}
				});

			}

			queryExecute();
			
	    });

	},	
	

}