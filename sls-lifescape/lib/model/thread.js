
'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
var uuid = require('uuid');


module.exports = 
{
	//Function to updating Moment Counters in Thread
	savedata: function(data){

		return new Promise(function(resolve, reject){

			var id = uuid.v1();
		    var item_data = {
		      "thread_id": id,
		      "user_id": data.user_id,
		      "thread_name": data.thread_name,
		      "thread_name_lower": data.thread_name.toLowerCase(),
		      "moment_counter": 0,
		      "is_favourite": 0,
		      "created_datetime": Date.now(),
		      "updated_datetime": Date.now()
		    }
		    if(data.thread_type)
		    	item_data.thread_type = data.thread_type
		    if(data.lvl)
		    	item_data.lvl = data.lvl
		    if(data.parent_id)
		    	item_data.parent_id = data.parent_id
		    if(data.privacy)
		    	item_data.privacy = data.privacy.toLowerCase()
		    if(data.thread_desc)
		    	item_data.thread_desc = data.thread_desc
		    if(data.cloudinary_id)
		    	item_data.cloudinary_id = data.cloudinary_id
		    if(data.cover_pic)
		    	item_data.cover_pic = data.cover_pic		
		    if(data.banner_img)
		    	item_data.banner_img = data.banner_img

		    const params = {
		      TableName: 'Thread',
		      Item: item_data
		    };
		    
		    
		    dynamo.put(params, (error, result) => {
		      if (error) {
		        console.log(error)
		        resolve(0)
		      }
		      resolve(id)		      
		    });

		});
	},
	//Function to updating Moment Counters in Thread
	updateMomentCounter: function(thread_id = "", action = "add"){

		return new Promise(function(resolve, reject){

			if(action == 'delete')
				var UpdateExpressionStr = "set moment_counter = moment_counter - :inc ";

			if(action == 'add')
				var UpdateExpressionStr = "set moment_counter = moment_counter + :inc ";

			var params = {
			      TableName: 'Thread',
			      Key:{
			        "thread_id": thread_id
			      },
			      UpdateExpression: UpdateExpressionStr,
			      ExpressionAttributeValues : {
			            ':inc': 1
			      },
			      ReturnValues:"UPDATED_NEW"
			    };

			console.log(params);
			

			dynamo.update(params, (error, result) => {
		      if (error) {
	            resolve("ERROR");
	          }
		      if(result){
		        resolve("SUCCESS")
		      }
		    });
		});
	},

	//Function to update the Like Counter in the Moment Table
	getUserThreads: function(user_id, thread_id = ""){

		return new Promise(function(resolve, reject){

				const params = { 
		              TableName: 'Thread',
		              IndexName:"user_id-created_datetime-index",
		              KeyConditionExpression: "#user_id = :user_id",
		              ProjectionExpression:"thread_id, thread_name, moment_counter, is_favourite, cover_pic, cloudinary_id, banner_img",
		              ExpressionAttributeNames:{
		                  "#user_id": "user_id"
		              },
		              ExpressionAttributeValues: {
		                  ":user_id": user_id
		              },
		              ScanIndexForward: true     
			    };

			    if(thread_id != ""){
			    	params.FilterExpression = " #thread_id = :thread_id";
			    	params.ExpressionAttributeNames["#thread_id"]= "thread_id";
			    	params.ExpressionAttributeValues[":thread_id"]= thread_id
			    }

		      var queryExecute =  function(callback) { 
		      	
			      dynamo.query(params, async function(err, result) {
			      	
			        if (err) {
			        	console.log("Error")
			            reject("ERROR");
			        } else {
			        	//console.log(result.Items)
			        	if(result.Items.length > 0)
			            	resolve(result.Items)
			            else if(thread_id == ""){
					      //If user does not have default thread then create default thread
					      var id = await module.exports.savedata({"user_id": user_id, "thread_name": process.env.DEFAULT_CHANNEL})
					      queryExecute();
			            }
			        }
			      });
			  }
			  queryExecute();
			  //console.log(params);

		});
	},
	
	//Function to update the Like Counter in the Moment Table
	getThreadsByPrivacy: function(privacy, keyword = ""){

		return new Promise(function(resolve, reject){
			var params = { 
	            "TableName": "Thread",
	            "IndexName": "privacy-created_datetime-index",
	            "KeyConditions": {
	                "privacy": {
	                  "ComparisonOperator": "EQ",
	                  "AttributeValueList":  { "S" : "public" } 
	                }
	            }}
	        if(keyword != "")
	        {
	        	params["QueryFilter"] =
	            {
	              "thread_name_lower":
	              {
	                "ComparisonOperator": "CONTAINS",
	                "AttributeValueList": 
	                  {
	                    "L": keyword.toLowerCase()
	                  }
	              }
	            }
	        }
	        
			var queryExecute = function(callback) {       
			  dynamo.query(params, async function(err, result) {
			    if (err) {
			    	console.log(err)
			        reject("ERROR");
			    } else {
			    	//console.log(result.Items)
			    	if(result.Items.length > 0)
			        	resolve(result.Items)
			        else
			        	resolve([]);
			    }
			  });
			}
			queryExecute();
		});
	},

	//Function to update the Like Counter in the Moment Table
	addRemoveFavourite: function(user_id = "", thread_id = "", action = "add"){

		return new Promise(function(resolve, reject){

			var UpdateExpressionStr = "set is_favourite = :flag ";

			if(action == 'delete')
				var flagval = 0;
			if(action == 'add')
				var flagval = 1;

			var params = {
			      TableName: 'Thread',
			      Key:{
			        "thread_id": thread_id
			      },
			      UpdateExpression: UpdateExpressionStr,
			      ConditionExpression: "user_id = :user_id",
			      ExpressionAttributeValues : {
			            ':flag': flagval,
			            ':user_id': user_id
			      },
			      ReturnValues:"UPDATED_NEW"
			    };

			console.log(params);
			
			dynamo.update(params, (error, result) => {
		      if (error) {
		      	console.log(error)
	            resolve("ERROR");
	          }
		      if(result){
		        resolve("SUCCESS")
		      }
		    });
		});

	},

	//Function to 
	checkAccess: function(user_id = "", object_id = "", role = "admin"){

		// return new Promise(function(resolve, reject){

		// 		const params = { 
		//               TableName: 'users_permissons',
		//               KeyConditionExpression: "#object_id = :object_id and #user_id = :user_id ",
		//               ExpressionAttributeNames:{
		//                   "#object_id": "object_id",
		//                   "#user_id": "user_id"
		//               },
		//               ExpressionAttributeValues: {
		//                   ":object_id": object_id,
		//                   ":user_id": user_id
		//               },
		//               ScanIndexForward: true     
		// 	    };

		//       var queryExecute = function(callback) {       
		// 	      dynamo.query(params, async function(err, result) {
		// 	        if (err) {
		// 	        	console.log(err)
		// 	            reject("ERROR");
		// 	        } else {
		// 				resolve(result.Items)
		// 	        }
		// 	      });
		// 	  }
		// 	  queryExecute();
		// 	  //console.log(params);

		// });

	},
	

}