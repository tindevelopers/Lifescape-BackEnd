'use strict';

const AWS = require('aws-sdk');

var uuid = require('uuid');

var mysql = require('mysql');


const dynamo = new AWS.DynamoDB.DocumentClient();

// var connection = mysql.createConnection({
//     host: "lifescape-prod1.cdy6stn9acy6.us-east-1.rds.amazonaws.com",
//     user: "production",
//     password: "pr0ddbpa55",
//     database: "production",
// });
var connection = mysql.createConnection({
    host: "lifescape.cdy6stn9acy6.us-east-1.rds.amazonaws.com",
    user: "production",
    password: "pr0ddbpa55",
    database: "production",
});


//const USERID = "zvrZyrUEqbSJjtq3IDv1uPlOMwh1" //For Linwood
//const old_userid = 39;
const USERID = "MukHSTtRWAM4i76RZ0jUAdX13nE3" //For Linwood
const old_userid = 196;

module.exports.thread = async (event, context) => {

	return new Promise(async function(resolve, reject){

		let query = 'select *, ThreadId as mainthreadid from ObjectThread where UserId = '+old_userid ;

		connection.query(query, function (error, results, fields) {
	        if (error) {
	            connection.destroy();
	            throw error;
	        } else {
	            // connected!
	            //console.log(results);

	            results.forEach(function(item, i){
	            	
	            	//console.log(item)
	            	let data = {}

	            	data.thread_id = uuid.v1();
	            	data.old_thread_id = item.ThreadId;
	            	data.user_id = USERID;
	            	data.thread_name = item.ThreadName;
	            	data.thread_type = item.ThreadType;
	            	data.is_personal = item.IsPersonal;
	            	if(item.ThreadDesc != "" && item.ThreadDesc != null)
	            		data.thread_desc = item.ThreadDesc;
	            	data.brand_id = item.BrandId;
	            	data.group_id = item.GroupId;
	            	data.main_thread = item.MainThread;
	            	
	            	data.thread_order = item.ThreadOrder; 

	            	connection.query("select count(*) as cnt from DatalineThread where ThreadId = '"+ item.mainthreadid + "'", function (error1, results1, fields1) {
	            		//console.log(item.mainthreadid + "===="+results1[0].cnt)
	            	
		            	data.moment_counter = results1[0].cnt;
		            	data.is_favourite = 0;

		            	//data.created_datetime = item.CreationDate;
		            	data.created_datetime = Date.now();
		            	data.updated_datetime = Date.now();            	

		            	const params = {
					      TableName: 'Thread',
					      Item: data
					    };
					    
					    console.log(params)
					    //return 1;
					    
					    dynamo.put(params, (error, result) => {
					      if (error) {
					        console.log(error)
					      }else{
					      	console.log("Success...")
					      }  
					    });

					});

			    });
	        }
	    });

	});

};

function getAllThreads(){

	return new Promise(function(resolve, reject){

				const params = { 
		              TableName: 'Thread',
		              ProjectionExpression: "thread_id, old_thread_id",
		              FilterExpression : "user_id = :user_id ",
		              ExpressionAttributeValues: {
		                ":user_id": USERID
		              },
			    };

			    
			  	var items = [];
			    
		   	  var queryExecute = function(callback) {       
			      dynamo.scan(params, async function(err, result) {
			        if (err) {
			            reject("ERROR");
			        } else {
			        	items = items.concat(result.Items);

			        	if(result.LastEvaluatedKey) {
							params.ExclusiveStartKey = result.LastEvaluatedKey;
							queryExecute();
						}else
						{
							resolve(items)
						}

			        }
			      });
			  }
			  queryExecute();
			  

		});

}




var deleteItem = function(id) {
  var params = {
    TableName: "DatalineObject",
    Key: {
      "datalineobject_id": id
    },
  };


  console.log(params)

  return new Promise(function(resolve, reject) {
    dynamo.delete(params, function(err, data) {
      if (err) {
      	console.log(err)
      	//setInterval(deleteItem, 20000, id)
        //reject(err);
      } else {
        resolve();
      }
    });
  });
}

var deleteMediaItem = function(id) {
  var params = {
    TableName: "Media",
    Key: {
      "media_id": id
    },
  };

  return new Promise(function(resolve, reject) {
    dynamo.delete(params, function(err, data) {
      if (err) {
      	console.log(err)
        reject(err);
      } else {
        resolve();
      }
    });
  });
}


function getRecords() {
  let params = {
    TableName: 'DatalineObject',
    IndexName: "user_id-start_date-index",
    ProjectionExpression: "datalineobject_id, old_moment_id",
    KeyConditionExpression: "#user_id = :user_id",
    ExpressionAttributeNames:{
        "#user_id": "user_id",
    },
    ExpressionAttributeValues: {
        ":user_id": USERID,
    }
  };

  console.log(params)
  
  return new Promise(function(resolve, reject) {
  	var items = [];

  	var queryExecute = function() {
	    dynamo.query(params, function(err, result) {
	      if (err) {
	        console.log(err);
	      } else {
			//console.log(result)
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
	queryExecute()
  });
}

function getAllMomentRecords() {

  let params = {
    TableName: 'DatalineObject',
    ProjectionExpression: "datalineobject_id, user_id, mediadata",
    
  };

  //console.log(params)
  
  return new Promise(function(resolve, reject) {
  	var items = [];

  	var queryExecute = function() {
	    dynamo.scan(params, function(err, result) {
	      if (err) {
	        console.log(err);
	      } else {
			//console.log(result)
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
	queryExecute()
  });
}


function getMediaRecords() {
  var params = {
    TableName: 'Media',
    IndexName: 'user_id-index',
    ProjectionExpression: "media_id,user_id",
    KeyConditionExpression: "#user_id = :user_id",
    ExpressionAttributeNames:{
        "#user_id": "user_id",
    },
    ExpressionAttributeValues: {
        ":user_id": USERID,
    }
    
  };

  
  return new Promise(function(resolve, reject) {
  	var items = []
  	var queryExecute = function() {
	    dynamo.query(params, function(err, result) {
	      if (err) {
	        reject(err);
	      } else {
	        //resolve(data);
	        items = items.concat(result.Items);
	        if(result.LastEvaluatedKey) {
				params.ExclusiveStartKey = result.LastEvaluatedKey;
				queryExecute();
			} else {
				//console.log("Total")
				console.log(items)
				resolve(items)
			}
	      }
	    });
	}
	queryExecute()
  });
}

function getAllMediaRecords(datalineobject_id) {

	let params = { 
        TableName: 'Media',
        IndexName: "datalineobject_id-created_datetime-index",
        KeyConditionExpression: "#datalineobject_id = :datalineobject_id",
        //FilterExpression: "is_media_posted <> :is_media_posted",
        ExpressionAttributeNames:{
            "#datalineobject_id": "datalineobject_id",
        },
        ExpressionAttributeValues: {
            ":datalineobject_id": datalineobject_id,
        //    ":is_media_posted": "N",
        },
        ScanIndexForward: false
    };
  	//console.log(params)
	return new Promise(function(resolve, reject) {
	  	var items = []
	  	var queryExecute = function() {
	    dynamo.query(params, function(err, result) {
	      if (err) {
	        reject(err);
	      } else {
	        //resolve(data);
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
	queryExecute()
  });
}

var momentdeleted = 0;
function momentclearRecords() {
  getRecords().then((data) => {
  	console.log(data)
    data.forEach(function(item, i) {
    	//console.log(item.datalineobject_id)
      	deleteItem(item.datalineobject_id).then((data1) => { 
      		console.log(momentdeleted++)
      		console.log("deleted moment data=="+item.datalineobject_id)
      	});
    });
    //console.log("RECURSIVE====================")
    momentclearRecords(); // Will call the same function over and over
  });
}

var mediadeleted =0;
function mediaclearRecords() {
  getMediaRecords().then((data) => {
    data.forEach(function(item) {
    	//if(item.user_id == USERID){
	      	deleteMediaItem(item.media_id).then((data1) => { 
	      		console.log(mediadeleted++)
	      		console.log("deleted media data=="+item.media_id )
	      	});
      	//}
    });
    mediaclearRecords(); // Will call the same function over and over
  });
}

module.exports.flushdata = function(context, callback) {
  //momentclearRecords();
  mediaclearRecords();//9207
};



var insertmoment = 0;
function saveMoment(data)
{
	return new Promise(function(resolve, reject){

		let params = {
	      TableName: 'DatalineObject',
	      Item: data
		};
					    
		console.log(params)

		dynamo.put(params, (error, result) => {
			if (error) {
		        console.log(error)
		        setInterval(saveMoment, 5000, data)
		        //saveMoment(params)
				//resolve(0)
			
			}else{
				insertmoment++;
				console.log("MOMENT DATA INSERT SUCCESSFULLY===" + insertmoment)
				resolve(1)
			}
		});
	});
}


var mediacnt = 0;
function saveMedia(data)
{
	return new Promise( function(resolve, reject){

		data.media_id = uuid.v1();
		let mediaparams = {
	      TableName: 'Media',
	      Item: data
		};
					    
		console.log(mediaparams)

		dynamo.put(mediaparams, (error, result) => {
			if (error) {
		        console.log(error)
		        //setInterval(saveMedia, 10000, data)
				//resolve(0)
			
			}else{
				mediacnt++;
				console.log("Media DATA INSERT SUCCESSFULLY==>" + mediacnt)
				resolve(1)
			}
		});
	});
}

function getMediaData(datalineobject_id)
{
	
	return new Promise(function(resolve, reject){

		if(datalineobject_id)
		{
			//let mediaquery = "SELECT md.*, om.* FROM MediaData as md JOIN ObjectMedia as om WHERE om.DataLineObjectId = "+ item.DataLineObjectId +" and om.FindMediaRef = md.FindMediaRef and md.UserId = 39 and md.IsMediaPosted = 'Y'";
	      let mediaquery = "SELECT md.*, om.* FROM MediaData as md JOIN ObjectMedia as om WHERE om.DataLineObjectId = "+ datalineobject_id +" and om.FindMediaRef = md.FindMediaRef  ";
		  //console.log(mediaquery);

	      connection.query(mediaquery, async function (error1, results1, fields1) 
	      	{
		        if (error1) {
		            //connection.destroy();
		            console.log(error1)
		            //throw error1;
		        } 
		        else 
		        {
		        	resolve(results1)
		        }
	    	});
	  }
    });



}

module.exports.moment = async (event, context) => {




	return new Promise(async function(resolve, reject){

		let newthreadres = await getAllThreads();
		//console.log(newthreadres);
		var newthreadres_arr = [];
		newthreadres.forEach(function(item){
			newthreadres_arr["thread_" + item.old_thread_id]= item
		});

		connection.query('select \
dt.ThreadId as mainthreadid, dt.DataLineObjectId as oldmomentid, dlo.*, \
ol.ObjectLatitude, ol.ObjectLongitude, ol.ObjectLocationName, \
od.* \
FROM \
DatalineThread as dt  \
INNER JOIN \
DatalineObject as dlo ON dt.DataLineObjectId = dlo.DataLineObjectId \
INNER JOIN \
ObjectDetails as od ON dt.DataLineObjectId = od.dataline_object_object_id \
LEFT JOIN \
ObjectLocation as ol ON ol.dataline_object_object_id = dlo.DataLineObjectId \
WHERE dlo.UserId = ' + old_userid, async  function (error, results, fields) {


	        if (error) {
	            connection.destroy();
	            throw error;
	        } else {

	        	let titlearray = [];
	            results.forEach(async function(item, ii)
	            //for(let ii=0;ii< results.length; ii++)
	            
	            {
            		//let item = results[ii]

	            	//console.log(item)
	            	
	            	if(titlearray.indexOf(item.ObjectTitle) < 0)
	            	{
	            	
	            		titlearray.push(item.ObjectTitle);
	            	
		            	let data = {}
		            	data.datalineobject_id = uuid.v1();

		            	data.user_id = USERID;

		            	data.object_title = item.ObjectTitle;

		            	data.access = "public";
		            	data.comments_counter = 0;

		            	if(item.RecFlag == "L")
		            		data.is_published = "1";
		            	else
		            		data.is_published = "0";

		            	data.like_counter = item.IsLike;

		            	data.start_date = new Date( item.DataLineObjectDate )
		            	data.start_date = data.start_date.getTime()
		            	data.having_event = item.HavingEvent
		            	data.having_pet = item.HavingPet
		            	data.having_item = item.HavingItem

		            	if(item.ObjectType == 1)
		            		data.object_type = "moment";
		            	else
		            		data.object_type = item.ObjectType;

		            	data.old_thread_id = item.mainthreadid;
		            	data.old_moment_id = item.oldmomentid;

		            	//console.log(item.mainthreadid);
		            	
		            	if(item.mainthreadid != "" && item.mainthreadid != null)
		            	{
		            		if(newthreadres_arr["thread_" + item.mainthreadid])
								data.thread_id = newthreadres_arr["thread_" + item.mainthreadid]["thread_id"]
							else
								data.thread_id = "========="
		            	}

		            	if(item.ObjectDesc != "" && item.ObjectDesc != null)
		            		data.object_desc = item.ObjectDesc;

		            	data.priority = item.Priority
		            	data.brand_id = item.BrandId;
		            	
		            	if(item.ObjectLatitude)
		            	{ 
		            		data.latitude = item.ObjectLatitude;
		            		data.longitude = item.ObjectLongitude;
		            		data.location = item.ObjectLocationName;
		            	}

		            	if(item.URLEmbedURL != "")
		            		data.moment_link = item.URLEmbedURL
		            	//data.posted_by = "";
		            	//data.user_profile_picture = "";
		            	data.created_datetime = new Date( item.CreationDate )
		            	data.created_datetime = data.created_datetime.getTime()

		            	if(item.LastUpdate != "0000-00-00 00:00:00")
		            	{
		            		data.updated_datetime = new Date( item.LastUpdate )
		            		data.updated_datetime = data.updated_datetime.getTime();
		            	}
		            	else
		            		data.updated_datetime = data.created_datetime
				    	
				    	console.log("Inserting")
				   		//setInterval(saveMoment, 10000, data)
				   		
				    	let momentres = await saveMoment(data)
				    }	

// 				    	if(momentres)
// 				    	{
// 				    		let mysqlmediares = await getMediaData(item.DataLineObjectId).then(async function(results1)
// 				    		{
// 				        		console.log(results1)
				        		
// 				        		for(let jj=0; jj < results1.length; jj++)
// 				        		{
// 				        			console.log(jj)
// 				        			let mediaitem = results1[jj] 
// 				        			//console.log(item)
// 				        			let media_data = {}

// //$imgPosArr[$posName] = 'mylife/viewimage/'.$MediaArrMedia[$mediaId]['MediaFolderId']
// //."/".$MediaArrMedia[$mediaId]['MediaColId']."L/".str_replace("$","/", $MediaArrMedia[$mediaId]['MediaColId']);
// 				        			//media_data.media_id = uuid.v1();
// 				        			if(mediaitem.cloudinary_url != "" && mediaitem.cloudinary_url != null)
// 				        				media_data.cloudinary_url = mediaitem.cloudinary_url
// 				        			else	
// 				        				media_data.cloudinary_url = "https://res.cloudinary.com/lifescape/image/upload/v1538803170/viewimage/" + mediaitem.MediaFolderId + "/" + mediaitem.MediaColId + "L." + mediaitem.MediaType.replace("/",".");

// 				        			media_data.created_datetime = new Date( mediaitem.CreationDate )
// 					            	media_data.created_datetime = media_data.created_datetime.getTime()

// 					            	if(mediaitem.LastUpdate != "0000-00-00 00:00:00" && mediaitem.LastUpdate != null)
// 					            	{
// 					            		media_data.updated_datetime = new Date( mediaitem.LastUpdate )
// 					            		media_data.updated_datetime = media_data.updated_datetime.getTime();
// 					            	}else
// 					            		media_data.updated_datetime = media_data.created_datetime

// 					            	if(mediaitem.MediaDesc != "" && mediaitem.MediaDesc != null)
// 					            		media_data.media_desc = mediaitem.MediaDesc

// 					            	if(mediaitem.MediaExt != "" && mediaitem.MediaExt != null)
// 					            		media_data.media_ext = mediaitem.MediaExt

// 					            	if(mediaitem.MediaHeight != "" && mediaitem.MediaHeight != null)
// 					            		media_data.media_height = mediaitem.MediaHeight

// 					            	if(mediaitem.MediaOrder != "" && mediaitem.MediaOrder != null)
// 					            		media_data.media_order = mediaitem.MediaOrder

// 					            	if(mediaitem.MediaSize != "" && mediaitem.MediaSize != null)
// 					            		media_data.media_size = mediaitem.MediaSize

// 					            	if(mediaitem.MediaWidth != "" && mediaitem.MediaWidth != null)
// 					            	media_data.media_width = mediaitem.MediaWidth

// 					            	media_data.media_type = mediaitem.MediaType
// 					            	if(mediaitem.MediaType.search("image") > -1)
// 					            		media_data.media_type = "image"
// 					            	if(mediaitem.MediaType.search("video") > -1)
// 					            		media_data.media_type = "video"

// 					            	media_data.datalineobject_id = data.datalineobject_id
// 					            	media_data.user_id = data.user_id			
					            	
// 					            	media_data.MediaFolderId = mediaitem.MediaFolderId
// 					            	media_data.MediaColId = mediaitem.MediaColId

// 			    					let mediaresult = await saveMedia(media_data)
// 			    					//setInterval(saveMedia, 5000, media_data)

// 				        		}
// 				    		});
// 						}
			    });
			    connection.destroy();
	        }
	    });

	});

};



module.exports.calcmedia = async (event, context) => {

	return new Promise(async function(resolve, reject){

		// let newthreadres = await getAllThreads();
		// //console.log(newthreadres);
		// var newthreadres_arr = [];
		// newthreadres.forEach(function(item){
		// 	newthreadres_arr["thread_" + item.old_thread_id]= item
		// });

		var TOT = 0;
		getRecords().then((data) => {
		  	

		    data.forEach( function(item, i) {
		    	
		      	//if(i == 0)
		      	{
		    		let mysqlmediares = getMediaData(item.old_moment_id).then(function(results1)
		    		{
		        		//console.log(results1)
		        		TOT = TOT +  results1.length;
		        		console.log(TOT)
		    		});
		    	}
		    });
		    
		});
	});

};

module.exports.media = async (event, context) => {

	return new Promise(async function(resolve, reject){

		// let newthreadres = await getAllThreads();
		// //console.log(newthreadres);
		// var newthreadres_arr = [];
		// newthreadres.forEach(function(item){
		// 	newthreadres_arr["thread_" + item.old_thread_id]= item
		// });


		getRecords().then((data) => {
		  	
		    data.forEach(async function(item, i) {
		    	
		      	//if(i == 0)
		      	{
		    		let mysqlmediares = await getMediaData(item.old_moment_id).then(async function(results1)
		    		{
		        		console.log(results1)
		        		
		        		for(let jj=0; jj < results1.length; jj++)
		        		{
		        			//console.log(jj)
		        			let mediaitem = results1[jj] 
		        			//console.log(item)
		        			let media_data = {}


							

//$imgPosArr[$posName] = 'mylife/viewimage/'.$MediaArrMedia[$mediaId]['MediaFolderId']
//."/".$MediaArrMedia[$mediaId]['MediaColId']."L/".str_replace("$","/", $MediaArrMedia[$mediaId]['MediaColId']);
		        			//media_data.media_id = uuid.v1();
		        			if(mediaitem.cloudinary_url != "" && mediaitem.cloudinary_url != null)
		        				media_data.cloudinary_url = mediaitem.cloudinary_url
		        			else	
		        				media_data.cloudinary_url = "https://res.cloudinary.com/lifescape/image/upload/v1538803170/viewimage/" + mediaitem.MediaFolderId + "/" + mediaitem.MediaColId + "L." + mediaitem.MediaType.replace("/",".");

							// urlExists(media_data.cloudinary_url, function(err, exists) {
							// 	  console.log(exists); // true
							// });

		        			media_data.created_datetime = new Date( mediaitem.CreationDate )
			            	media_data.created_datetime = media_data.created_datetime.getTime()

			            	if(mediaitem.LastUpdate != "0000-00-00 00:00:00" && mediaitem.LastUpdate != null)
			            	{
			            		media_data.updated_datetime = new Date( mediaitem.LastUpdate )
			            		media_data.updated_datetime = media_data.updated_datetime.getTime();
			            	}else
			            		media_data.updated_datetime = media_data.created_datetime

			            	if(mediaitem.MediaDesc != "" && mediaitem.MediaDesc != null)
			            		media_data.media_desc = mediaitem.MediaDesc

			            	if(mediaitem.MediaExt != "" && mediaitem.MediaExt != null)
			            		media_data.media_ext = mediaitem.MediaExt

			            	if(mediaitem.MediaHeight != "" && mediaitem.MediaHeight != null)
			            		media_data.media_height = mediaitem.MediaHeight

			            	if(mediaitem.MediaOrder != "" && mediaitem.MediaOrder != null)
			            		media_data.media_order = mediaitem.MediaOrder

			            	if(mediaitem.MediaSize != "" && mediaitem.MediaSize != null)
			            		media_data.media_size = mediaitem.MediaSize

			            	if(mediaitem.MediaWidth != "" && mediaitem.MediaWidth != null)
			            	media_data.media_width = mediaitem.MediaWidth


			            	
			            	media_data.is_media_posted = mediaitem.IsMediaPosted

			            	media_data.media_type = mediaitem.MediaType
			            	if(mediaitem.MediaType.search("image") > -1)
			            		media_data.media_type = "image"
			            	if(mediaitem.MediaType.search("video") > -1)
			            		media_data.media_type = "video"

			            	media_data.datalineobject_id = item.datalineobject_id
			            	media_data.user_id = USERID
			            	
			            	media_data.MediaFolderId = mediaitem.MediaFolderId
			            	media_data.MediaColId = mediaitem.MediaColId

			            	//console.log(media_data)
			            	//return 1;

	    					let mediaresult = await saveMedia(media_data)
	    					//setInterval(saveMedia, 5000, media_data)

		        		}
		    		});
		    	}
		    });
		    
		});
	});

}


//Update User Data to moments
module.exports.updateUserDatatoMoments1 = (event, context, callback) => {

    return new Promise(async function(resolve, reject){

      const params = {
        TableName: 'DatalineObject'
      };
      //console.log(params);return 1;

      //Call Put Function to Insert Data
      dynamo.scan(params, function(error, result) {

        if (error) //If Error
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));

        console.log("starting");
        let cnt = 0;

        result.Items.forEach(async function(item){
          //console.log(item);
          let user_id = item.user_id;
          if(cnt < 100)
          {
            // let user_detail = await firebaseuserob.getUserDetail(user_id);
            // console.log(user_detail);
            // cnt++;

            // //item_data.user_profile_picture = user_detail.profile_picture;
            // //item_data.posted_by = user_detail.displayName;
            // let posted_by = "";
            // let profile_picture = "";
            // if(typeof(user_detail.displayName) != "undefined" )
            //   posted_by = user_detail.displayName
            // if(typeof(user_detail.name) != "undefined" )
            //   posted_by = user_detail.name

            // if(typeof(user_detail.profile_picture) != "undefined" )
            //   profile_picture = user_detail.profile_picture

            //if(posted_by != "" && profile_picture != "")
            {
                // //Update Process
                // var params = {
                //     TableName: 'DatalineObject',
                //     Key:{
                //       "datalineobject_id": item.datalineobject_id
                //     },
                //     UpdateExpression: "set #posted_by = :posted_by, #user_profile_picture = :user_profile_picture",
                //     ExpressionAttributeNames: {
                //       "#posted_by": "posted_by",
                //       "#user_profile_picture": "user_profile_picture"
                //     },
                //     ExpressionAttributeValues: {
                //       ":posted_by": posted_by,
                //       ":user_profile_picture": profile_picture
                //     },
                //     ReturnValues:"UPDATED_NEW"
                // };
                var params = {
                    TableName: 'DatalineObject',
                    Key:{
                      "datalineobject_id": item.datalineobject_id
                    },
                    UpdateExpression: "set #object_type = :object_type",
                    ExpressionAttributeNames: {
                      "#object_type": "object_type"
                    },
                    ExpressionAttributeValues: {
                      ":object_type": "moment"
                    },
                    ReturnValues:"UPDATED_NEW"
                };

                console.log(params)
            
                //Update the function
                dynamo.update(params, (error, result) => {

                  if (error) 
                    return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));

                  // TODO implement
                  if(result){
                    console.log("Updated")
                    
                    //callback(null, JSON.stringify(response));
                  }
                });
            }
          }
        });
        //firebaseuserob.firebasedelete();
        return 1;
      });
    });
}


var momentupdate_arr = [];
var momentupdated = 0;

function updateMomentDefaultMediaItem(mediaitem){


	return new Promise(async function(resolve, reject){

		if(momentupdate_arr.indexOf(mediaitem.datalineobject_id) < 0)
		{
			
			delete mediaitem.metadata;
// 			console.log("=============")
// console.log(mediaitem)
// console.log("=============")

		    let params = {
		        TableName: 'DatalineObject',
		        Key:{
		          "datalineobject_id": mediaitem.datalineobject_id
		        },
		        UpdateExpression: "set mediadata = :mediadata",
		        
		        ExpressionAttributeValues: {
		          ":mediadata": [mediaitem],
		        },
		        ReturnValues:"UPDATED_NEW"
		    };

		    console.log(JSON.stringify(params))

		    ///Update the function
		    dynamo.update(params, (error, result) => {

		      if (error) 
		      {
		      	console.log(error)
		      	resolve(0)
		      }else{
		      		momentupdated++
			      momentupdate_arr.push(mediaitem.datalineobject_id)  
			      console.log("Moment data updated == " + mediaitem.datalineobject_id + " === " + momentupdated)
			      resolve(1)
		      }
		      

		    });


		}
		else
			resolve(1)

	});

}

module.exports.updateMediaDatatoMoments = (event, context, callback) => {

    return new Promise(async function(resolve, reject){

    	var urlExists = require('url-exists');


    	getAllMomentRecords().then( function (data) {
    		//data.forEach(function(item){
    		for(let ii = 0; ii < data.length; ii++)
    		{

    			let item = data[ii]
    			if(item.user_id == USERID)
    			{
    			//console.log(item.mediadata)

    			if(typeof(item.mediadata) == "undefined" || item.mediadata == "")
    			//if(typeof(item.mediadata[0].metadata) != "undefined")
	    			{
	    				getAllMediaRecords(item.datalineobject_id).then(function (mediadata) 
	    				{
							for(let i = 0; i < mediadata.length; i++)
							//data.forEach(async function(item)
							{	
								return urlExists(mediadata[i].cloudinary_url, function(err, exists) {
								  	console.log(exists); // true

								  	if(exists)
								  	{

										return new Promise(async function(resolve, reject){
											let mediaitem = mediadata[i]
											let res = await updateMomentDefaultMediaItem(mediaitem)
										});

									}

								});
								
							}	
							//});

	    				});			
	    			}

    			}
    		}
    		//}) 

    	});
    });    		

    	//return 1;
	//   getAllMediaRecords().then( function (data) {
	//     //data.forEach(async function(item) 
	//     for(let i = 0; i < data.length; i++)
	//     {
	//     	new Promise(async function(resolve, reject)
	//     	{
	//     		let item = data[i]
	// 	    	let res = await updateMomentDefaultMediaItem(item)
	// 		});
	//     }
	//     //getAllMediaRecords(); // Will call the same function over and over
	//   });
	// });


    //   let user_id = event.user_id;
    //   let profile_picture = event.profile_picture;
    //   let posted_by =  event.displayName;

    //   if(typeof (user_id) != "undefined" && user_id != "" )
    //   {
    //     const params = { 
    //           TableName: 'Media'
    //     };
    //     console.log(params)

    //     var queryExecute = function(callback) {

    //         dynamo.scan(params, function(error, result) {
    //             if (error) {
    //               return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
    //             }else {
    //               console.log("resutl===");
    //               //console.log(result.Items);
    //               //callback(null, result.Items);
    //               let momentlist = result.Items

    //               momentlist.forEach(function(moment){
                    
    //                 let params = {
    //                     TableName: 'DatalineObject',
    //                     Key:{
    //                       "datalineobject_id": moment.datalineobject_id
    //                     },
    //                     UpdateExpression: "set #posted_by = :posted_by, #user_profile_picture = :user_profile_picture",
    //                     ExpressionAttributeNames: {
    //                       "#posted_by": "posted_by",
    //                       "#user_profile_picture": "user_profile_picture"
    //                     },
    //                     ExpressionAttributeValues: {
    //                       ":posted_by": posted_by,
    //                       ":user_profile_picture": profile_picture
    //                     },
    //                     ReturnValues:"UPDATED_NEW"
    //                 };

    //                 console.log(params)
                
    //                 ///Update the function
    //                 dynamo.update(params, (error, result) => {

    //                   if (error) 
    //                     return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));

    //                 });

    //               });

    //             }
    //         });
    //     }

    //     queryExecute();
    //   }
    // });


}

