
'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
var uuid = require('uuid');


module.exports = 
{
	//Function to update the Moment Tags
	updateMomentTags: function(datalineobject_id, tags, action){

		return new Promise(async function(resolve, reject){

			let momentdetail = await module.exports.getMomentDetail(datalineobject_id);

			if(action == "update"){
				if(momentdetail.length > 0 && momentdetail[0].tags){
					var old_tags = momentdetail[0].tags
					tags = old_tags.concat(tags)
				}	
			}
			else if(action == "delete")
			{
				if(momentdetail.length > 0 && momentdetail[0].tags)
				{
					var old_tags = momentdetail[0].tags				
					var index = old_tags.indexOf(tags);

		            if (index > -1) {
		            	old_tags.splice(index, 1);
		            }else{
		            	resolve(0)
		            }
	            	tags = old_tags;
	            }
			}
			
			tags = [...new Set(tags)];  //Get Unique Records

			var params = {
			      TableName: 'DatalineObject',
			      Key:{
			        "datalineobject_id": datalineobject_id
			      },
			      UpdateExpression: " SET tags = :tags ",
			      ExpressionAttributeValues : {
			            ':tags': tags
			      },
			      ReturnValues:"UPDATED_NEW"
			    };

			dynamo.update(params, (error, result) => {
		      if (error) {
	            resolve(0);
	          }
		      if(result){
		        resolve(1)
		      }
		    });

		});
	},

	//Function to update the Moment Tags
	/*
	deleteMomentTags: function(tag_id){

		return new Promise(function(resolve, reject){
			if(tag_id != "")
			{
				const params = { 
		            TableName: 'DatalineObjectTags',
		            Key: {
		            	"tag_id": tag_id
		            }
		        };
				        
	    		dynamo.delete(params, function(error, result) {
		    		if(error) {
		    			return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
				    }
	
				    if(result){
					    resolve("SUCCESS")
				    }
			    });
	    	}

		});
	},	
	*/
	
	//Function to update the Like Counter in the Moment Table
	updateMomentLikeStatus: function(datalineobject_id, is_like){
		return new Promise(function(resolve, reject){
			
			var UpdateExpressionStr = "set mylike_status = :mylike_status ";
			
			var params = {
			      TableName: 'DatalineObject',
			      Key:{
			        "datalineobject_id": datalineobject_id
			      },
			      UpdateExpression: UpdateExpressionStr,
			      ExpressionAttributeValues : {
			            ':mylike_status': is_like
			      },
			      ReturnValues:"UPDATED_NEW"
			    };
			    console.log(params)
			dynamo.update(params, (error, result) => {
		      if (error) {
		      	console.log(error)
	            resolve("ERROR");
	          }
		      if(result){
		      	console.log("success")
		        resolve("SUCCESS")
		      }
		    });
		});
	},
	
	//Function to update the Like Counter in the Moment Table
	deleteMomentLikes: function(user_id, object_id){

		return new Promise(function(resolve, reject){
			
			let params = { 
	            TableName: 'DatalineObjectLike',
	            Key: {
	              "user_id": user_id,
	              "datalineobject_id": object_id
	            }   
	        };
        

	        dynamo.delete(params, (error, result) => {
		      if (error) {
		      	console.log(error)
	            resolve("ERROR");
	          }
		      if(result){
		      	console.log("success")
		        resolve("SUCCESS")
		      }
		    });

		});
	},

	//Function to update the Like Counter in the Moment Table
	updateMomentLikeCounter: function(datalineobject_id, is_like){
		return new Promise(function(resolve, reject){
			if(is_like == 0)
				var UpdateExpressionStr = "set like_counter = like_counter - :inc ";
			if(is_like == 1)
				var UpdateExpressionStr = "set like_counter = like_counter + :inc ";

			var params = {
			      TableName: 'DatalineObject',
			      Key:{
			        "datalineobject_id": datalineobject_id
			      },
			      UpdateExpression: UpdateExpressionStr,
			      ExpressionAttributeValues : {
			            ':inc': 1
			      },
			      ReturnValues:"UPDATED_NEW"
			    };

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
	updateMomentCommentCounter: function(datalineobject_id, action){
		return new Promise(function(resolve, reject){

			if(action == 'delete')
				var UpdateExpressionStr = "set comments_counter = comments_counter - :inc ";
			if(action == 'add')
				var UpdateExpressionStr = "set comments_counter = comments_counter + :inc ";

			var params = {
			      TableName: 'DatalineObject',
			      Key:{
			        "datalineobject_id": datalineobject_id
			      },
			      UpdateExpression: UpdateExpressionStr,
			      ExpressionAttributeValues : {
			            ':inc': 1
			      },
			      ReturnValues:"UPDATED_NEW"
			    };

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

	checkMomentLikeStatus: function(datalineobject_id, user_id){

		return new Promise(function(resolve, reject){
	    	
	    	const params = { 
	            TableName: 'DatalineObjectLike',
	            KeyConditionExpression: "#datalineobject_id = :datalineobject_id and #user_id = :user_id",
	            ExpressionAttributeNames:{
	                "#datalineobject_id": "datalineobject_id",
	                "#user_id": "user_id",
	            },
	            ExpressionAttributeValues: {
	                ":datalineobject_id": datalineobject_id,
	                ":user_id": user_id,
	            },
	        };

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(params)
						console.log(err);
						//throw err; 
						//resolve(0)
					} else {
						resolve(result.Items.length)
					}
				});

			}

			queryExecute();
			
	    });
	},

	getMomentDetail: function(datalineobject_id, ProjectionExpression = "ALL"){

	    return new Promise(function(resolve, reject){
	    	
	    	const params = { 
	            TableName: 'DatalineObject',
	            KeyConditionExpression: "#datalineobject_id = :datalineobject_id",
	            ExpressionAttributeNames:{
	                "#datalineobject_id": "datalineobject_id",
	            },
	            ExpressionAttributeValues: {
	                ":datalineobject_id": datalineobject_id,
	            },
	            ScanIndexForward: false
	        };
	        if(ProjectionExpression != "ALL")
	        	params.ProjectionExpression = ProjectionExpression

	        console.log(params)

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

	getMomentMedias: function(datalineobject_id, limit = ""){
	    return new Promise(function(resolve, reject){
	    	
	    	const params = { 
                    TableName: 'Media',
                    IndexName:"datalineobject_id-created_datetime-index",
                    ProjectionExpression: "media_id, media_type, user_id, datalineobject_id, cloudinary_url, cloudinary_id, media_desc, media_height, media_width, is_media_posted",
                    KeyConditionExpression: "#datalineobject_id = :datalineobject_id",
                    //FilterExpression: "is_media_posted <> :is_media_posted",
                    ExpressionAttributeNames:{
                        "#datalineobject_id": "datalineobject_id",
                    },
                    ExpressionAttributeValues: {
                        ":datalineobject_id": datalineobject_id,
                    //    ":is_media_posted": "N"
                    },
                    ScanIndexForward: false
            };

            if(limit != "")
            	params.limit = 1
		

			var items = []

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						//callback(new Error('An Error occured while scanning for results.'));
						return;
					} else {

						items = items.concat(result.Items);

						if(result.LastEvaluatedKey && limit == "") {
							console.log("RECUSIVE CALL===")
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						} else {
							//console.log(items)
							resolve(items)
						}
					}
				});

			}

			queryExecute();
			
	    });

	},

	getMomentTags: function(datalineobject_id, ProjectionExpression = ""){
		
		return new Promise(function(resolve, reject){
	    	
	    	const params = { 
	            TableName: 'DatalineObject',
	            KeyConditionExpression: "#datalineobject_id = :datalineobject_id",
	            ProjectionExpression: "tags",
	            ExpressionAttributeNames:{
	                "#datalineobject_id": "datalineobject_id",
	            },
	            ExpressionAttributeValues: {
	                ":datalineobject_id": datalineobject_id,
	            },
	            ScanIndexForward: false
	        };

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						resolve([])
					} else {
						console.log(result)
						if(result.Items[0].tags)
							resolve(result.Items[0].tags);
						else
							resolve([])
					}
				});

			}

			queryExecute();
			
	    });

	  //   return new Promise(function(resolve, reject){
	    	
	  //   	const params = { 
   //                  TableName: 'DatalineObject',
   //                  KeyConditionExpression: "#datalineobject_id = :datalineobject_id",
   //                  ExpressionAttributeNames:{
   //                      "#datalineobject_id": "datalineobject_id",
   //                  },
   //                  ExpressionAttributeValues: {
   //                      ":datalineobject_id": datalineobject_id,
   //                  },
   //                  ScanIndexForward: false
   //          };
		
			// var items = []

			// var queryExecute = function() {

			// 	dynamo.query(params,function(err,result) {

			// 		if(err) {
			// 			console.error(err);
			// 			resolve([])
			// 			//callback(new Error('An Error occured while scanning for results.'));
			// 			return;
			// 		} else {

			// 			items = items.concat(result.Items);

			// 			if(result.LastEvaluatedKey) {
			// 				params.ExclusiveStartKey = result.LastEvaluatedKey;
			// 				queryExecute();
			// 			} else {
			// 				items.forEach(function (item){

			// 					if(ProjectionExpression == "")
			// 						tagArray.push(item.tag)
			// 					else
			// 						tagArray.push(item)
			// 				});
			// 				resolve(tagArray)
			// 			}
			// 		}
			// 	});

			// }

			// queryExecute();
			
	  //   });

	},

	getThreadMomentList: function(thread_id, user_id = "", page_rec = ""){

		return new Promise(function(resolve, reject){
	    	
      		const params = { 
                "TableName": 'DatalineObject',
                "IndexName": "is_published-created_datetime-index",
                //"ProjectionExpression": "#location, object_desc, start_date, user_id, posted_by, user_profile_picture, datalineobject_id, thread_id, object_title, created_datetime, like_counter, comments_counter, mediadata[0].cloudinary_url,mediadata[0].media_type, mediadata[0].media_width, mediadata[0].media_height",
                "KeyConditions": {
                  "is_published": {
                    "ComparisonOperator": "EQ",
                    "AttributeValueList":  { "S" : "1" } 
                  }
                },
                "QueryFilter":
                {
                  "thread_id":
                  {
                    "ComparisonOperator": "CONTAINS",
                    "AttributeValueList": 
                      {
                        "L": thread_id 
                      }
                  }
                },
                "ScanIndexForward": false,
                //Limit: page_rec
        	};

      		if(page_rec != "")
      			params.Limit = page_rec;

			console.log(params)

			var items = []

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						//callback(new Error('An Error occured while scanning for results.'));
						return;
					} else {

						items = items.concat(result.Items);

						if(result.LastEvaluatedKey) {
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						} else {
							resolve(items)
						}
					}
				});

			}

			queryExecute();
			
	    });
	},

	getTimelineMomentList: function(user_id, thread_id, from, to, LastEvaluatedKey = null, page_rec = 1){

		return new Promise(async function(resolve, reject){
	    	
	    	/*const params = { 
              TableName: 'DatalineObject',
              
              //IndexName:"thread_id-created_datetime-index",
              //ProjectionExpression: "#location, start_date, user_id, posted_by, user_profile_picture, datalineobject_id, thread_id, object_title, created_datetime, like_counter, comments_counter",
              ProjectionExpression: "#location, object_desc, start_date, user_id, posted_by, user_profile_picture, datalineobject_id, thread_id, object_title, created_datetime, like_counter, comments_counter, mediadata[0].cloudinary_url,mediadata[0].media_type, mediadata[0].media_width, mediadata[0].media_height, access, mediadata[0].media_id, latitude, longitude, mylike_status ",
              //KeyConditionExpression: "#user_id = :user_id and #start_date between :from and :to ",
              KeyConditionExpression: "#thread_id = :thread_id",
              FilterExpression: "  #user_id = :user_id and #is_published = :is_published  and #start_date between :from and :to ",
              ExpressionAttributeNames:{
                  "#user_id": "user_id",
                  "#thread_id": "thread_id",
                  "#is_published": "is_published",
                  "#start_date": "start_date",
                  "#location":"location"
              },
              ExpressionAttributeValues: {
                  ":user_id": user_id,
                  ":thread_id": thread_id,
                  ":is_published": "1",
                  ":from": from,
                  ":to": to
              },
              ScanIndexForward: false,
              //Limit: page_rec
      		};*/


      		const params = { 
                "TableName": 'DatalineObject',
                "IndexName": "user_id-created_datetime-index",
                //"ProjectionExpression": "#location, object_desc, start_date, user_id, posted_by, user_profile_picture, datalineobject_id, thread_id, object_title, created_datetime, like_counter, comments_counter, mediadata[0].cloudinary_url,mediadata[0].media_type, mediadata[0].media_width, mediadata[0].media_height",
                
                "KeyConditions": {
                  "user_id": {
                    "ComparisonOperator": "EQ",
                    "AttributeValueList":  { "S" : user_id } 
                  }
                },
                "QueryFilter":
                {
                  "thread_id":
                  {
                    "ComparisonOperator": "CONTAINS",
                    "AttributeValueList": 
                      {
                        "L": thread_id 
                      }
                  },
                  "is_published":
                  {
                    "ComparisonOperator": "EQ",
                    "AttributeValueList": 
                      {
                        "S": "1" 
                      }
                  },
                  "start_date":
                  {
                    "ComparisonOperator": "BETWEEN",
                    "AttributeValueList":  [from , to]  
                  }
                },
                "ScanIndexForward": false,
                //Limit: page_rec
        };

      		if(typeof(LastEvaluatedKey) != 'undefined' && LastEvaluatedKey != "")
      		{
      			let ProjectionExpression = "datalineobject_id,created_datetime,thread_id";
      			let momentdetail = await module.exports.getMomentDetail(LastEvaluatedKey, ProjectionExpression);
      			if(momentdetail.length > 0 ){
	      			params.ExclusiveStartKey = {
	      				"created_datetime": momentdetail[0].created_datetime,
	      				"thread_id": momentdetail[0].thread_id,
	      				"datalineobject_id": momentdetail[0].datalineobject_id,
	      			}
	      		}
      		}

			let items = [];

			console.log(JSON.stringify(params));

			//console.log("Querying====>")
			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						resolve([])
					} else {
						//console.log(result.LastEvaluatedKey )
						items = items.concat(result.Items);
						//resolve(items)

						if(result.LastEvaluatedKey ) {
							console.log("Recursively Call===>>>>")
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						} else {
							resolve(items)
						}
					}
				});

			}

			queryExecute();
			
	    });
	},

getTimelineMomentListNew: function(user_id, from, to, LastEvaluatedKey = null, page_rec = 1){

		return new Promise(async function(resolve, reject){
	    	
	    	/*const params = { 
              TableName: 'DatalineObject',
              
              //IndexName:"thread_id-created_datetime-index",
              //ProjectionExpression: "#location, start_date, user_id, posted_by, user_profile_picture, datalineobject_id, thread_id, object_title, created_datetime, like_counter, comments_counter",
              ProjectionExpression: "#location, object_desc, start_date, user_id, posted_by, user_profile_picture, datalineobject_id, thread_id, object_title, created_datetime, like_counter, comments_counter, mediadata[0].cloudinary_url,mediadata[0].media_type, mediadata[0].media_width, mediadata[0].media_height, access, mediadata[0].media_id, latitude, longitude, mylike_status ",
              //KeyConditionExpression: "#user_id = :user_id and #start_date between :from and :to ",
              KeyConditionExpression: "#thread_id = :thread_id",
              FilterExpression: "  #user_id = :user_id and #is_published = :is_published  and #start_date between :from and :to ",
              ExpressionAttributeNames:{
                  "#user_id": "user_id",
                  "#thread_id": "thread_id",
                  "#is_published": "is_published",
                  "#start_date": "start_date",
                  "#location":"location"
              },
              ExpressionAttributeValues: {
                  ":user_id": user_id,
                  ":thread_id": thread_id,
                  ":is_published": "1",
                  ":from": from,
                  ":to": to
              },
              ScanIndexForward: false,
              //Limit: page_rec
      		};*/


      		const params = { 
                "TableName": 'DatalineObject',
                "IndexName": "user_id-created_datetime-index",
                //"ProjectionExpression": "#location, object_desc, start_date, user_id, posted_by, user_profile_picture, datalineobject_id, thread_id, object_title, created_datetime, like_counter, comments_counter, mediadata[0].cloudinary_url,mediadata[0].media_type, mediadata[0].media_width, mediadata[0].media_height",
                
                "KeyConditions": {
                  "user_id": {
                    "ComparisonOperator": "EQ",
                    "AttributeValueList":  { "S" : user_id } 
                  }
                },
                "QueryFilter":
                {
                  "is_published":
                  {
                    "ComparisonOperator": "EQ",
                    "AttributeValueList": 
                      {
                        "S": "1" 
                      }
                  },
                  "start_date":
                  {
                    "ComparisonOperator": "BETWEEN",
                    "AttributeValueList":  [from , to]  
                  }
                },
                "ScanIndexForward": false,
                //Limit: page_rec
        };

      		if(typeof(LastEvaluatedKey) != 'undefined' && LastEvaluatedKey != "")
      		{
      			let ProjectionExpression = "datalineobject_id,created_datetime,thread_id";
      			let momentdetail = await module.exports.getMomentDetail(LastEvaluatedKey, ProjectionExpression);
      			if(momentdetail.length > 0 ){
	      			params.ExclusiveStartKey = {
	      				"created_datetime": momentdetail[0].created_datetime,
	      				///"thread_id": momentdetail[0].thread_id,
	      				"datalineobject_id": momentdetail[0].datalineobject_id,
	      			}
	      		}
      		}

			let items = [];

			console.log(JSON.stringify(params));

			//console.log("Querying====>")
			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						resolve([])
					} else {
						//console.log(result.LastEvaluatedKey )
						items = items.concat(result.Items);
						//resolve(items)

						if(result.LastEvaluatedKey ) {
							console.log("Recursively Call===>>>>")
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						} else {
							resolve(items)
						}
					}
				});

			}

			queryExecute();
			
	    });
	},


	getRecentMomentByUserIdNTime: function(user_id, thread_id, from, to, LastEvaluatedKey = null, page_rec = 100){

		return new Promise(async function(resolve, reject){
	    	
	    	const params = { 
              TableName: 'DatalineObject',
              IndexName:"user_id-start_date-index",
              ProjectionExpression: "#location, start_date, user_id, posted_by, user_profile_picture, datalineobject_id, thread_id, object_title, object_desc, created_datetime, like_counter, comments_counter, mediadata[0].cloudinary_url,mediadata[0].media_type, mediadata[0].media_width,  access, mediadata[0].media_id, latitude, longitude",
              KeyConditionExpression: "#user_id = :user_id and #start_date between :from and :to ",
              FilterExpression: "  #is_published = :is_published  ",
              ExpressionAttributeNames:{
                  "#user_id": "user_id",
                  "#is_published": "is_published",
                  "#start_date": "start_date",
                  "#location":"location"
              },
              ExpressionAttributeValues: {
                  ":user_id": user_id,
                  ":is_published": "1",
                  ":from": from,
                  ":to": to
              },
              ScanIndexForward: false,
              //Limit: page_rec
      		};

      		if(thread_id != "")
      		{
      			params.FilterExpression += " and #thread_id = :thread_id ";
      			params.ExpressionAttributeNames["#thread_id"] = "thread_id";
      			params.ExpressionAttributeValues[":thread_id"] = thread_id;
      		}

      		if(LastEvaluatedKey)
      		{
      			let ProjectionExpression = "datalineobject_id,start_date,user_id";
      			let momentdetail = await module.exports.getMomentDetail(LastEvaluatedKey, ProjectionExpression);
      			if(momentdetail.length > 0 ){
	      			params.ExclusiveStartKey = {
	      				"start_date": momentdetail[0].start_date,
	      				"user_id": momentdetail[0].user_id,
	      				"datalineobject_id": momentdetail[0].datalineobject_id,
	      			}
	      		}
      		}

			let items = [];

			//console.log(params)
			
			var queryExecute = function() {
				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						resolve([])
					} else {
						items = items.concat(result.Items);
						//console.log(result)
						if(result.LastEvaluatedKey) {
						//if(result.LastEvaluatedKey && items.length < page_rec ) {
							console.log("Recursively Call===>>>>")
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						} else {
							//result.Items = items.slice(0, page_rec)
							resolve(items)
						}
					}
				});

			}

			queryExecute();
			
	    });
	},

	getUserMomentList: function(user_id, ProjectionExpression = "", LastEvaluatedKey = "", page_rec = 100){

		return new Promise(async function(resolve, reject){
	    	
	    	const params = { 
              TableName: 'DatalineObject',
              IndexName:"user_id-created_datetime-index",
              //ProjectionExpression: "datalineobject_id",
              KeyConditionExpression: "#user_id = :user_id",
              FilterExpression: "#is_published = :is_published",
              ExpressionAttributeNames:{
                  "#user_id": "user_id",
                  "#is_published": "is_published"
              },
              ExpressionAttributeValues: {
                  ":user_id": user_id,
                  ":is_published": "1",
              },
              ScanIndexForward: false,
              Limit: page_rec
      		};
      		if(ProjectionExpression != "")
      			params.ProjectionExpression = ProjectionExpression;

      		if(typeof(LastEvaluatedKey) != "undefined" && LastEvaluatedKey != "")
      		{
      			let momentdetail = await module.exports.getMomentDetail(LastEvaluatedKey);
      			console.log(momentdetail)
      			if(momentdetail.length > 0 ){
	      			params.ExclusiveStartKey = {
	      				"created_datetime": momentdetail[0].created_datetime,
	      				"user_id": momentdetail[0].user_id,
	      				"datalineobject_id": momentdetail[0].datalineobject_id,
	      			}
	      		}

      		}
 			console.log(params);

			var items = []

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						resolve([])						
					} else {
						console.log(result.ScannedCount)
						items = items.concat(result.Items);

						if(result.LastEvaluatedKey && items.length <= page_rec ) {
						//if(result.LastEvaluatedKey ) {
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						} else {
							//var res = items.slice(0, page_rec);
							resolve(items)
						}
						
					}
				});

			}

			queryExecute();
			
	    });
	},

	getUserMapMomentList: function(user_id, ProjectionExpression = "", LastEvaluatedKey = "", page_rec = 100){

		return new Promise(async function(resolve, reject){
	    	
	    	const params = { 
              TableName: 'DatalineObject',
              IndexName:"user_id-created_datetime-index",
              //ProjectionExpression: "datalineobject_id",
              KeyConditionExpression: "#user_id = :user_id",
              FilterExpression: "#is_published = :is_published and attribute_exists(latitude)",
              ExpressionAttributeNames:{
                  "#user_id": "user_id",
                  "#is_published": "is_published"
                  //"#latitude": "latitude"
                  
              },
              ExpressionAttributeValues: {
                  ":user_id": user_id,
                  ":is_published": "1",
                  //":latitude": -50
              },
              ScanIndexForward: false,
              Limit: page_rec
      		};
      		if(ProjectionExpression != "")
      			params.ProjectionExpression = ProjectionExpression;

      		if(typeof(LastEvaluatedKey) != "undefined" && LastEvaluatedKey != "")
      		{
      			let momentdetail = await module.exports.getMomentDetail(LastEvaluatedKey);
      			console.log(momentdetail)
      			if(momentdetail.length > 0 ){
	      			params.ExclusiveStartKey = {
	      				"created_datetime": momentdetail[0].created_datetime,
	      				"user_id": momentdetail[0].user_id,
	      				"datalineobject_id": momentdetail[0].datalineobject_id,
	      			}
	      		}

      		}
 			console.log(params);

			var items = []

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						resolve([])						
					} else {
						console.log(result.ScannedCount)
						items = items.concat(result.Items);

						if(result.LastEvaluatedKey && items.length <= page_rec ) {
						//if(result.LastEvaluatedKey ) {
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						} else {
							//var res = items.slice(0, page_rec);
							resolve(items)
						}
						
					}
				});

			}

			queryExecute();
			
	    });
	},

	getUserMomentScanList: function(user_id, LastEvaluatedKey = "", page_rec = 100){
		
		return new Promise(async function(resolve, reject){
	    	//console.log(user_id);
			const params = { 
              TableName: 'DatalineObject',
              IndexName:"is_published-created_datetime-index",
              KeyConditionExpression: "#is_published = :is_published ",
              FilterExpression: "contains(:user_id, #user_id) and #object_type = :object_type ",
              //ProjectionExpression:"datalineobject_id",
              ExpressionAttributeNames:{
                  "#user_id": "user_id",
                  "#is_published": "is_published",
                  "#object_type": "object_type",
              },
              ExpressionAttributeValues: {
                  ":user_id": JSON.stringify(user_id),
                  ":is_published": "1",
                  ":object_type": "moment",
//                  ":access" : "public"
              },
              ScanIndexForward: false,
              //Limit: page_rec
      		};

      		if(typeof(LastEvaluatedKey) != "undefined" && LastEvaluatedKey != "")
      		{
      			let momentdetail = await module.exports.getMomentDetail(LastEvaluatedKey);
      			//console.log(momentdetail)

      			if(momentdetail.length > 0 ){
	      			params.ExclusiveStartKey = {
	      				"created_datetime": momentdetail[0].created_datetime,
	      				//"user_id": momentdetail[0].user_id,
	      				"is_published": "1",
	      				"datalineobject_id": momentdetail[0].datalineobject_id,
	      			}
	      		}
	      		
      		}
 			//console.log(params);

			var items = []

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						resolve([])
						//callback(new Error('An Error occured while scanning for results.'));
					} else {
						items = items.concat(result.Items);

						if(result.LastEvaluatedKey && items.length <= page_rec ) {
							console.log("recursive call..")
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						} else {
							//var res = items.slice(0, 20);
							var res = items
							resolve(res)
						}
						
					}
				});

			}

			queryExecute();
			
	    });
	},

	searchUserMomentList: function(user_id, extra_params = "", LastEvaluatedKey = "", page_rec = 10){

		return new Promise(async function(resolve, reject){
	    	
	    	const params = { 
              TableName: 'DatalineObject',
              IndexName:"user_id-created_datetime-index",
              //ProjectionExpression: "datalineobject_id",
              KeyConditionExpression: "#user_id = :user_id",
              FilterExpression: "#is_published = :is_published and begins_with(#object_title_lower , :object_title_lower)",
              ExpressionAttributeNames:{
                  "#user_id": "user_id",
                  "#is_published": "is_published",
                  "#object_title_lower": "object_title_lower"
              },
              ExpressionAttributeValues: {
                  ":user_id": user_id,
                  ":is_published": "1",
                  ":object_title_lower": extra_params.keyword
              },
              ScanIndexForward: false,
              //Limit: page_rec
      		};

      		if(typeof(LastEvaluatedKey) != "undefined" && LastEvaluatedKey != "")
      		{
      			let momentdetail = await module.exports.getMomentDetail(LastEvaluatedKey);
      			console.log(momentdetail)
      			if(momentdetail.length > 0 ){
	      			params.ExclusiveStartKey = {
	      				"created_datetime": momentdetail[0].created_datetime,
	      				"user_id": momentdetail[0].user_id,
	      				"datalineobject_id": momentdetail[0].datalineobject_id,
	      			}
	      		}

      		}
 			//console.log(params);

			var items = []

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						resolve([])
					} else {

						items = items.concat(result.Items);
						//resolve(result.Items)
						
						if(result.LastEvaluatedKey) {
							console.log("recursive....")
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						} else {
							//console.log(items)
							resolve(items)
						}
						
					}
				});

			}

			queryExecute();
			
	    });
	},

	getCommentDetail: function(comment_id){

	    return new Promise(function(resolve, reject){
	    	
	    	const params = { 
	            TableName: 'DatalineObjectComments',
	            KeyConditionExpression: "#comment_id = :comment_id",
	            ExpressionAttributeNames:{
	                "#comment_id": "comment_id",
	            },
	            ExpressionAttributeValues: {
	                ":comment_id": comment_id,
	            }
	        };
		
			var items = []

			var queryExecute = function() {

				dynamo.query(params,function(err,result) {

					if(err) {
						console.log(err);
						//callback(new Error('An Error occured while scanning for results.'));
						return;
					} else {
						resolve(result.Items);
					}
				});

			}

			queryExecute();
			
	    });

	},

	//Save User Like Action
	saveMomentLikes: function(user_id, object_id){

	    return new Promise(function(resolve, reject){

			var item_data = {
	          "user_id": user_id,
	          "created_datetime": Date.now(),
	          "datalineobject_id": object_id
	        }
	        //Prepare the Data to store in table
	        const params = {
	          TableName: 'DatalineObjectLike',
	          Item: item_data
	        };

	        //Call the dynamo to store data
    	    dynamo.put(params, async function(error, result)  {
	          if (error)	resolve(0)
	          else			resolve(1);
        	});
	    });

	}


}