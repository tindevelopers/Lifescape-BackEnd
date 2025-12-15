'use strict';

const AWS = require('aws-sdk');

var momentob = require('./lib/model/moment.js');
var mediaob = require('./lib/model/media.js');
var threadob = require('./lib/model/thread.js');
var mapboxob = require('./lib/model/mapbox.js');
var activitylog = require('./lib/model/activitylog.js');
var userob = require('./lib/model/user.js');

var uuid = require('uuid');

const dynamo = new AWS.DynamoDB.DocumentClient();
var lambda = new AWS.Lambda({
    region: process.env.AWS_REGIONNAME //change to your region
});


//function to create the moment
module.exports.createMoment = (event, context, callback) => {

    const data = event.body;//JSON.parse(event.body);
    console.log(event)
    var id = uuid.v1();//Create Unique ID

    return new Promise(async function(resolve, reject){

      let title = data.object_title.trim();
      //Set the Params to Insert
      var item_data = {
        "datalineobject_id": id,
        "user_id": data.user_id,
        "object_title": title,
        "object_title_lower": title.toLowerCase(),
        "start_date": data.start_date,
        "created_datetime": Date.now(),
        "updated_datetime": Date.now(),
        "is_published": data.is_published,
        "like_counter": 0,
        "mylike_status": 0,
        "comments_counter": 0
      }

      item_data.object_type = "moment";

      if(data.thread_id && data.thread_id != "")
        item_data.thread_id = data.thread_id
      
      if(data.end_date && data.end_date != "")
        item_data.end_date = data.end_date

      if(data.object_type && data.object_type != "")
        item_data.object_type = data.object_type

      if(data.brand_id && data.brand_id != "")  
        item_data.brand_id = data.brand_id

      if(data.object_desc && data.object_desc != "")  
        item_data.object_desc = data.object_desc

      if(data.location && data.location != "" && data.location.latitude != "" && data.location.longitude != "")  
      {
        item_data.latitude = data.location.latitude;
        item_data.longitude = data.location.longitude;

        let res = await mapboxob.fetchLocation(data.location);
        if(res != "") 
          item_data.location = res;
      }

      if(data.moment_link && data.moment_link != "")  
        item_data.moment_link = data.moment_link

      if(data.access && data.access != "")  
        item_data.access = data.access

      if(data.tagtofriends && data.tagtofriends != "")
        item_data.tagtofriends = data.tagtofriends

      if(data.tags && data.tags != "")
        item_data.tags = data.tags

      if(data.user_id && data.user_id != "")  
      {
        var user_detail = await userob.getUserDetail(data.user_id);

        if(Object.keys(user_detail).length > 0){
          if(user_detail.profile_picture != "")
            item_data.user_profile_picture = user_detail.profile_picture;
          if(user_detail.displayName != "")
          item_data.posted_by = user_detail.displayName;
        }
      }

      var media_id = data.media_id;
      if(media_id != undefined && media_id.length > 0)  
      {
        var default_media_detail = await mediaob.getMediaDetail(media_id[0]);

        if(default_media_detail && default_media_detail.length > 0 ){
          delete default_media_detail[0].metadata
          item_data.mediadata = default_media_detail;  
        }
        
      }

      const params = {
        TableName: 'DatalineObject',
        Item: item_data
      };

      console.log(params);
      
      //Call Put Function to Insert Data
      dynamo.put(params, async function(error, result) {
        
        if (error) //If Error
        {
          console.log(error)
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
        }

        //Insert the Media Files Data
        if(media_id && media_id.length > 0)
          var res = await mediaob.updateMomentIds(id, media_id);

        var thread_id = data.thread_id;
        if(thread_id && thread_id.length > 0)
          var res = await threadob.updateMomentCounter(thread_id, "add");


        var post_to_social = data.post_to_social;
        if(post_to_social && post_to_social.length > 0)
        {
          console.log("invoking oneall publish lambda function")
          //Invoke Lambda to add data to Elastic Search
            lambda.invoke({
                  FunctionName: 'LifeScape-prod-shareMoments', 
                  InvocationType: "Event", 
                  Payload: JSON.stringify({
                    'datalineobject_id': id,
                    'user_id': data.user_id,
                    'post_to_social' : post_to_social
                  }) // pass params
              }, function(error, data) {
                if (error) {
                    console.log(error);
                //    resolve(0)
                }
            });
        }

        let friends_arr = await userob.getUserFriendIDs(data.user_id);


        if(friends_arr.length > 0)
        {
          console.log(friends_arr);
          //Store Activity Log
          await activitylog.store(friends_arr, {
                      actor: data.user_id,
                      verb: 'moment_add',
                      object: 'moment:'+id,
                      foreign_id: 'moment:'+id,
                      event: { 
                          'profile_picture' : user_detail.profile_picture,
                          'displayName' : user_detail.displayName, 
                      },
                      //message: "&lt; a href='/user/"+data.user_id+"' &gt; "+ user_detail.displayName +"&lt;/a&gt; created a &lt;a href='/moment/"+id+"'&gt;Moment&lt;/a&gt;!",
                      message: "<a href='/user/profile/"+data.user_id+"' > "+ user_detail.displayName +"</a> created a <a href='/moment/"+id+"'>Moment</a>!",
                      time: Date.now()
                  });
        }

        const response = {
            message: 'Moment Data inserted successfully!',
            body: { object_id: id }
        };
        console.log(response)

        callback(null, JSON.stringify(response));

      });
    });
}

//Function to Edit Moment
module.exports.editMoment = (event, context, callback) => {
    console.log(event);

    var object_id = event.path.object_id
    var user_id = event.path.user_id
    const data = event.body;//JSON.parse(event.body);

    return new Promise(async function(resolve, reject){

      let title = data.object_title.trim();
      var item_data = {
          ":object_title": title,
          ":object_title_lower": title.toLowerCase(),
          ":start_date": data.start_date,
          ":updated_datetime": Date.now(),
          ":access": data.access
      }

      var UpdateExpression = " SET object_title = :object_title, object_title_lower = :object_title_lower, start_date = :start_date, updated_datetime = :updated_datetime, ";
      if(typeof(data.thread_id) != "undefined" && data.thread_id != "")
      {
        item_data[":thread_id"] = data.thread_id
        UpdateExpression += " thread_id = :thread_id, ";
      }

      if(typeof(data.end_date) != "undefined" && data.end_date != "")
      {
        item_data[":end_date"] = data.end_date
        UpdateExpression += " end_date = :end_date, ";
      }

      if(typeof(data.object_type) != "undefined" && data.object_type != "")
      {
        item_data[":object_type"] = data.object_type
        UpdateExpression += " object_type = :object_type, ";
      }

      if(typeof(data.brand_id) != "undefined" && data.brand_id != "")  {
        item_data[":brand_id"] = data.brand_id
        UpdateExpression += " brand_id = :brand_id, ";
      }

      if(typeof(data.object_desc) != "undefined" && data.object_desc != "")  {
        item_data[":object_desc"] = data.object_desc
        UpdateExpression += " object_desc = :object_desc, ";
      }

      if(typeof(data.location) != "undefined" && data.location != "" && data.location.latitude != "" && data.location.longitude != "")  
      {
        item_data[":latitude"] = data.location.latitude;
        item_data[":longitude"] = data.location.longitude;

        let res = await mapboxob.fetchLocation(data.location);
        console.log(res);

        if(res != "")
        {
          UpdateExpression += " #location = :location, ";
          item_data[":location"] = res;
        }
        UpdateExpression += "  latitude = :latitude, longitude = :longitude ,  ";
      }

      if(typeof(data.moment_link) != "undefined" && data.moment_link != "")  {
        item_data[":moment_link"] = data.moment_link
        UpdateExpression += " moment_link = :moment_link, ";
      }

      if(typeof(data.tags) != "undefined" && data.tags != "")  {
        item_data[":tags"] = data.tags
        UpdateExpression += " tags = :tags, ";
      }

      var media_id = data.media_id;
      if(media_id != undefined && media_id.length > 0)  
      {
        var default_media_detail = await mediaob.getMediaDetail(media_id[0]);

        delete default_media_detail[0].metadata
        item_data[":mediadata"] = default_media_detail
        UpdateExpression += " mediadata = :mediadata, ";
      }

      if(typeof(data.access) != "undefined" && data.access != "")  {
        item_data[":access"] = data.access
        UpdateExpression += " access = :access ";
      }

      
      //console.log(UpdateExpression)
      
      //Set the Params
      var params = {
          TableName: 'DatalineObject',
          Key:{
            "datalineobject_id": object_id
          },
          //UpdateExpression: "set object_title = :object_title, object_desc = :object_desc, thread_id = :thread_id, brand_id = :brand_id, start_date = :start_date, end_date = :end_date, updated_datetime = :updated_datetime, #location = :location, latitude = :latitude, longitude = :longitude,  access = :access, moment_link = :moment_link",
          UpdateExpression: UpdateExpression,
          ExpressionAttributeValues: item_data,
          //ReturnValues:"UPDATED_NEW"
          ReturnValues:"ALL_OLD"
      };
      if(item_data[":location"])
        params["ExpressionAttributeNames"] = { "#location": "location" }
      //console.log(params);
      //return 1;
      //Update the function
      dynamo.update(params, async function(error, result) {

        if (error) 
        {
          console.log(error)
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
        }

        var media_id = data.media_id;
        if(media_id != undefined && media_id.length > 0)
        {
          //deleteMedias
          var media_res = await momentob.getMomentMedias(object_id)
          var old_media_id = [];
          media_res.forEach(function(item){
            old_media_id.push(item.media_id)
          });
          //console.log(old_media_id);
          //console.log(media_id);
          var media_res = await mediaob.deleteMedias(object_id, old_media_id, media_id)

          var res = await mediaob.updateMomentIds(object_id, media_id);
        }

        let old_thread_id = result.Attributes.thread_id;

        if(typeof(old_thread_id) != "undefined"  &&  typeof(data.thread_id) != "undefined"  && old_thread_id != data.thread_id )
        {
          let res1 = await threadob.updateMomentCounter(old_thread_id, "delete");
          let res2 = await threadob.updateMomentCounter(data.thread_id, "add");
        }

        // TODO implement
        if(result){
          const response = {
              message: 'Moment Data updated successfully!'
          };
          callback(null, JSON.stringify(response));
          return 1;
        }
      });
  });
}

//Function to Delete Moment
module.exports.deleteMoment = (event, context, callback) => {
    console.log(event)

    if(typeof(event["path"]) != "undefined" 
        && typeof(event["path"]["object_id"]) != "undefined" 
        && typeof(event["path"]["user_id"]) != "undefined" 
        && event.principalId == event["path"]["user_id"])
    {

      var object_id = event.path.object_id
      var user_id = event.path.user_id

      const params = { 
          TableName: 'DatalineObject',
          Key: {
            "datalineobject_id": object_id
          },
          ConditionExpression:"user_id = :user_id",
          ExpressionAttributeValues: {
             ":user_id": user_id
          },
          ReturnValues:"ALL_OLD"
      };
      console.log(params);

      //Delete Function
      dynamo.delete(params, async function(error, result) {
          
          if (error) 
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
          
          else {

            let old_thread_id = result.Attributes.thread_id;

            if(typeof(old_thread_id) != "undefined"  )
            {
              let res1 = await threadob.updateMomentCounter(old_thread_id, "delete");
            }

            const response = {
                message: "Moment is Deleted successfully!"
            };
            callback(null, JSON.stringify(response));
          }
      });
    }
    else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    
}

//Get Moment Tags
module.exports.getMomentTags = (event, context, callback) => {
    console.log(event);

    if(typeof(event["path"]) != "undefined" 
        && typeof(event["path"]["object_id"]) != "undefined")
    {
        var datalineobject_id = event.path.object_id;

        return new Promise(async function(resolve, reject){
          //Get Moment Tags
          let momentTags = await momentob.getMomentTags(datalineobject_id);
          
          if(momentTags.length > 0)//Check the Length
            callback(null, JSON.stringify(momentTags));  
          else
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));

        })
     
    }else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}


module.exports.getMomentDetail = (event, context, callback) => {
    console.log(event);

    var datalineobject_id = event.path.object_id;

    if(typeof(event["path"]) != "undefined" && typeof(event["path"]["user_id"]) != "undefined")
      var user_id = event["path"]["user_id"];
    
    if(datalineobject_id != "" )
    {
        return new Promise(async function(resolve, reject){

          //Get the Moment Detail
          var momentdetail = await momentob.getMomentDetail(datalineobject_id);

          if(momentdetail.length > 0 && momentdetail[0].access.toLowerCase() != 'private' )//Check the Length
          {
            resolve(momentdetail);
          }
          else
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));

        })
        .then(
          function(object_result) {
            // handle a successful result 

            return new Promise(function(resolve, reject) {

              var items = {};
              var cnt = 0;
              var totalobject = object_result.length

                //Fetch the Moment Media and Hastag Detail  
                object_result.forEach(async function(item, i){
                  
                  //Fetch Media Data of Moments
                  let objectid = item.datalineobject_id
                  //items[objectid] = item

                  let momentMediaList = await momentob.getMomentMedias(objectid)

                  if(typeof(user_id) != "undefined")  
                  {
                    let checkMyLikeStatus =  await momentob.checkMomentLikeStatus(objectid, user_id);                    
                    item.mylike_status = checkMyLikeStatus
                  }

                  //let momentTags = await momentob.getMomentTags(objectid);
                  
                  //if(momentTags.length > 0)
                  //  item.tags = momentTags
                    
                  cnt  = cnt + 1;
                  //console.log(result.Items)
                  //console.log(result.Items.length)
                  if(momentMediaList.length > 0)
                  {
                    let moments_items = [];

                    momentMediaList.forEach(function(item1){
                      moments_items.push(item1)
                    });
                    item.mediadata = moments_items 
                  }  
                  //callback(null, (item));  
                  callback(null, JSON.stringify(item));  

                });

            });
          },
          function(error) { 
            return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
          }
        );
     
    }else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}


module.exports.getUserMoments = (event, context, callback) => {

    console.log(event)
    
    var user_id = event["path"]["user_id"];

    if(user_id == "")
    {
      const response = {
          statusCode: 404,
          body: JSON.stringify('User ID is blank!'),
      };
      callback(null, response);
    }

    const params = { 
            TableName: 'DatalineObject',
            IndexName:"user_id-start_date-index",
            KeyConditionExpression: "#user_id = :user_id",
            FilterExpression: "#is_published = :is_published",
            ExpressionAttributeNames:{
                "#user_id": "user_id",
                "#is_published": "is_published",
            },
            ExpressionAttributeValues: {
                ":user_id": user_id,
                ":is_published": "1",
            },
            ScanIndexForward: false     
    };
    //console.log(params)

    var queryExecute = function(callback) {        

        dynamo.query(params, function(error, result) {
            if (error) {
              return context.fail(JSON.stringify({message:"server_error"}));
            }else {
              callback(null, result.Items);
            }
        });
    }

    queryExecute(callback);

}

//Function to get Moments or get Collection by user/thread id
module.exports.getObjects = (event, context, callback) => {

    console.log(event)
    
    let byfilter =  event["path"]["byfilter"];   
    let byfilter_id = event["path"]["byfilter_id"];   
    let page_rec = 100;
    let LastEvaluatedKey = "";
     
    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["LastEvaluatedKey"]) != "undefined")
      LastEvaluatedKey = event["body"]["LastEvaluatedKey"];

    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["page_rec"]) != "undefined")
      page_rec = event["body"]["page_rec"];

    let user_id = (byfilter == "user") ? byfilter_id : "";
    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["user_id"]) != "undefined")
      user_id = event["body"]["user_id"];

    //var user_id = event["path"]["user_id"];
    if(typeof(event["path"]["byfilter"]) == "undefined" || typeof(event["path"]["byfilter_id"]) == "undefined" )
    {
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    }

    var object_type = "moment";

    if(typeof(event["path"]["object_type"]) != "undefined" && event["path"]["object_type"] != "")
      object_type = event["path"]["object_type"];

    let myProm = new Promise(async function(resolve, reject){

      var params = "";
      if(byfilter == "user")
      {
        params = { 
                TableName: 'DatalineObject',
                IndexName: "user_id-created_datetime-index",
                //ProjectionExpression: "datalineobject_id",
                KeyConditionExpression: "#user_id = :user_id",
                FilterExpression: "#is_published = :is_published and #object_type = :object_type ",
                ExpressionAttributeNames:{
                    "#user_id": "user_id",
                    "#is_published": "is_published",
                    "#object_type": "object_type"
                },
                ExpressionAttributeValues: {
                    ":user_id": byfilter_id,
                    ":is_published": "1",
                    ":object_type": object_type
                },
                ScanIndexForward: false,
                Limit: page_rec
        };
      }else if(byfilter == "thread")
      {
        //let threadMomentList = await momentob.getThreadMomentList(byfilter_id);

        params = { 
                "TableName": 'DatalineObject',
                "IndexName": "is_published-created_datetime-index",
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
                        "L": byfilter_id 
                      }
                  }
                },
                "ScanIndexForward": false,
                //Limit: page_rec
          };
      }

      if(typeof(LastEvaluatedKey) != "undefined" && LastEvaluatedKey != "")
      {
        
        let momentdetail = await momentob.getMomentDetail(LastEvaluatedKey);

        if(momentdetail.length > 0 ){

          params.ExclusiveStartKey = {
            "created_datetime": momentdetail[0].created_datetime,
            "datalineobject_id": momentdetail[0].datalineobject_id,
          }

          if(byfilter == "thread")
            params.ExclusiveStartKey.thread_id = momentdetail[0].thread_id;
          else
            params.ExclusiveStartKey.user_id = momentdetail[0].user_id;
        }
      }

      var items = []

      var queryExecute = function(callback) {
        
        dynamo.query(params, function(error, result) {

          if (error) {
              console.log(error)
              return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
          }
          else {

            items = items.concat(result.Items);

            if(result.LastEvaluatedKey && items.length <= page_rec ) {
  
                params.ExclusiveStartKey = result.LastEvaluatedKey;
                queryExecute();

            } else {
              
              if(items.length > 0) {
                var res = items.slice(0, page_rec);
                resolve(res)
              }
              else
                return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
            }

          }
        });

      }  
      queryExecute();
      
    })
    .then(
      function(object_result) {

        return new Promise(function(resolve, reject) {

          console.log(object_result);

          //return 1;
          var items = {};
          var cnt = 0;
          var totalobject = object_result.length
          if(totalobject > 0)
          {
            object_result.forEach(async function(item, i){
              
              //Fetch Media Data of Moments
              let objectid = item.datalineobject_id
              items[objectid] = item

              let momentMediaList =  await momentob.getMomentMedias(objectid, 1)
              let checkMyLikeStatus =  await momentob.checkMomentLikeStatus(objectid, item.user_id);
              
              items[objectid].mylike_status = checkMyLikeStatus
              
              var moments_items = []

              cnt  = cnt + 1;
              
              if(momentMediaList.length > 0)
              {
                momentMediaList.forEach(function(item1){
                  moments_items.push(item1)
                });
                items[objectid].mediadata = moments_items 
              }  
              
              if(cnt == totalobject)
                callback(null, JSON.stringify(object_result));
      
            });
          }else
          {
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));

          }

        });
      },

      function(error) { 
        console.log(error)
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
    )

    .then(
      function(object_result) {
        console.log("Final Result ==>");
        //console.log(object_result)
        callback(null, JSON.stringify( object_result) );
        //callback(null, { "status_code": 200, "data" : object_result });
      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
    );
    

}


//Function to get user's wall moments
module.exports.getUserWall = (event, context, callback) => {
    console.log(event)
    var user_id = event["path"]["user_id"];
    //event.principalId = user_id;

    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["LastEvaluatedKey"]) != "undefined")
      var LastEvaluatedKey = event["body"]["LastEvaluatedKey"];

    var page_rec = 10;
    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["page_rec"]) != "undefined")
      page_rec = event["body"]["page_rec"];

    var listtype = 'all'
    if(event["body"] && event["body"]["listtype"])
      listtype = event["body"]["listtype"];

    let myProm = new Promise(async function(resolve, reject){
        
        if(event.principalId ==  user_id && listtype == 'all')
        {
          //Get User Friend Lists
          var friends_arr = await userob.getUserFriendDetails(user_id);
        }else
        {
          var friends_arr = [];
          friends_arr[user_id] = await userob.getUserDetail(user_id);
        }
        
        let userMomentList = await momentob.getUserMomentScanList(Object.keys(friends_arr), LastEvaluatedKey, page_rec);

        if(userMomentList.length > 0){
          //userMomentList.forEach(function(moment){
          for (let i in userMomentList) { 

            if(friends_arr[userMomentList[i].user_id])
            {
              userMomentList[i].posted_by = friends_arr[userMomentList[i].user_id].displayName
              userMomentList[i].user_profile_picture = friends_arr[userMomentList[i].user_id].profile_picture            
            }
            
          }
          resolve(userMomentList);
        }
        else 
          return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));

    })
    .then(
      function(object_result) {
        // handle a successful result 
        let myProm = new Promise(function(resolve, reject) {

          var items = {};
          var cnt = 0;
          var totalobject = object_result.length

          object_result.forEach(async function(item, i){
            if(item.access.toLowerCase() == "private" && item.user_id != event.principalId)
            {
              console.log("deleting private....")
              object_result.splice(i, 1);
            }
          });

          object_result = object_result.slice(0, page_rec);

          totalobject = object_result.length;

          if(totalobject > 0)
          {

            object_result.forEach(async function(item, i)
            {
                //Fetch Media Data of Moments
                let objectid = item.datalineobject_id
                items[objectid] = item

                let momentMediaList = await momentob.getMomentMedias(objectid)
                let checkMyLikeStatus =  await momentob.checkMomentLikeStatus(objectid, user_id);
                //let momentTags = await momentob.getMomentTags(objectid);

                items[objectid].mylike_status = checkMyLikeStatus
                
                var moments_items = []

                if(momentMediaList.length > 0)
                {
                  momentMediaList.forEach(function(item1){
                    moments_items.push(item1)
                  });
                  items[objectid].mediadata = moments_items 
                }
              

                cnt  = cnt + 1;

                console.log(cnt + " ======= " + totalobject)
                
                if(cnt == totalobject || cnt == page_rec )
                {  
                  return callback(null, (object_result.slice(0, page_rec)));
                }
      
            });
          }else
          {
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
          }

        })
      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
    )

}

//Function to Save the tags to Moments
module.exports.saveTags = (event, context, callback) => {
    console.log(event)

    var datalineobject_id = event["path"]["object_id"];
    var user_id = event["body"]["user_id"];
    var tags = event["body"]["tags"];

    return new Promise(async function(resolve, reject) {

      if(tags != undefined && tags.length > 0)
      {
        var res = await momentob.updateMomentTags(datalineobject_id, tags, "update");

        const response = { message: 'Tags are saved successfully!' };

        callback(null, JSON.stringify(response));
      }else
      {
        return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
      }

    });
}


//Function to Save the tags to Moments
module.exports.deleteTags = (event, context, callback) => {
    console.log(event)

    var datalineobject_id = event["path"]["object_id"];
    var tag = event["path"]["tag"];

    if(datalineobject_id != "")
    {
        return new Promise(async function(resolve, reject){
          
          let res = await momentob.updateMomentTags(datalineobject_id, tag, "delete");
          
          if(res)//Check the Length
          {
              callback(null, JSON.stringify({message: 'Tags are deleted successfully!'}))
          }
          else
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));

        })
     
    }else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}

//Function to save Like or Dislikes Moment
module.exports.saveMomentLikes = (event, context, callback) => {
    console.log(event);

    //Get the Request Data
    var object_id = event["path"]["object_id"].trim();
    var user_id = event["body"]["user_id"].trim();
    var is_like = event["body"]["like"];

    new Promise(async (resolve, reject) => {
      //Update moment table
      let momentres = await momentob.getMomentDetail(object_id);

      if(momentres && momentres[0].user_id == user_id){
        await momentob.updateMomentLikeStatus(object_id, is_like);
      }
    

      if(is_like == 1)//If user liked the post
      {
          await momentob.saveMomentLikes(user_id, object_id);
          await momentob.updateMomentLikeCounter(object_id, is_like);

          const response = {  message: 'Moment is liked successfully!' };
          callback(null, JSON.stringify(response));

      }else if(is_like == 0)
      {
          await momentob.deleteMomentLikes(user_id, object_id);
          await momentob.updateMomentLikeCounter(object_id, is_like);

          const response = {  message: 'Moment is dis-liked successfully!' };
          callback(null, JSON.stringify(response));
      }

    });
    
}

//Function to get Moment Like Counter
module.exports.getMomentLikeCounter = (event, context, callback) => {
  console.log(event)

  var datalineobject_id = event["path"]["object_id"];

  if(datalineobject_id != "")
  {
    let myProm = new Promise(async function(resolve, reject){
      let momentdetail = await momentob.getMomentDetail(datalineobject_id);

      //console.log(momentdetail);
      let response = { "like_counter": ((momentdetail.length > 0 ) ? momentdetail[0].like_counter : 0 )}
      callback(null, JSON.stringify(response));

    });
  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
}

//Function for Search 
module.exports.searchGlobal = (event, context, callback) => {
    console.log(event)

    var keyword =  event["path"]["keyword"];
    var user_id =  event["path"]["user_id"];

    if(keyword && keyword != "")
      keyword = decodeURI(keyword.toLowerCase());

    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["LastEvaluatedKey"]) != "undefined")
      var LastEvaluatedKey = event["body"]["LastEvaluatedKey"];

    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["page_rec"]) != "undefined")
      var page_rec = event["body"]["page_rec"];

    let myProm = new Promise(async function(resolve, reject){
        let main_arr = {};

//search from Moments
        let extra_params = { keyword : keyword};

        //console.log(extra_params)
        
        let userMomentList = [];
        if(keyword && keyword != "")
          userMomentList = await momentob.searchUserMomentList(user_id, extra_params, LastEvaluatedKey, page_rec);
        main_arr['moments'] = userMomentList

        //search from People
        let user_arr = [];
        let user_data = await userob.searchUsers(keyword);

        let cnt = 0;
        if(user_data && user_data.length > 0){

          user_data.forEach(async (item) => {

              //Get Search User's Status as Friend
              let friendstatus = await userob.getUserFriendManageStatus(user_id, item.user_id);
              item.friendrequest = friendstatus
              cnt++;

              if(cnt == user_data.length)
              {
                // Firebase removed - firebaseuserob.firebasedelete();
                main_arr['users'] = user_data;
                resolve(main_arr);
              }
          });

        }else 
        {
          main_arr['users'] = user_data;
          resolve(main_arr);
        }

        //search from Locations

    })
    .then(
      function(object_result) {
        // handle a successful result 
        return new Promise(function(resolve, reject) {

          var items = {};
          var cnt = 0;
          //var totalobject = object_result["moments"].length

          callback(null, JSON.stringify(object_result));
          return 1;


          if(totalobject > 0 )
          {  
              object_result["moments"].forEach(async function(item, i)
              {
                  //Fetch Media Data of Moments
                  let objectid = item.datalineobject_id
                  items[objectid] = item

                  let momentMediaList = await momentob.getMomentMedias(objectid)
                  
                  var moments_items = []

                  cnt  = cnt + 1;

                  if(momentMediaList.length > 0)
                  {
                    momentMediaList.forEach(function(item1){
                      moments_items.push(item1)
                    });
                    items[objectid].mediadata = moments_items 
                  }  
                  
                  if(cnt == totalobject)
                      callback(null, JSON.stringify(object_result));          
              });
          }else
              callback(null, JSON.stringify(object_result));          
          //console.log(object_result)
          //callback(null, object_result);

        });
      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:404, message: "Server Error" } ));
      }
    )

}


//Update User Profile to Moments
module.exports.updateUserDatatoMoments = (event, context, callback) => {

    return new Promise(async function(resolve, reject){

      console.log(event);

      let user_id = event.user_id;
      let profile_picture = event.profile_picture;
      let posted_by = event.displayName;

      if(user_id)
      {
        const params = { 
              TableName: 'DatalineObject',
              IndexName:"user_id-start_date-index",
              KeyConditionExpression: "#user_id = :user_id",
              ProjectionExpression: "datalineobject_id, user_profile_picture",
              ExpressionAttributeNames:{
                  "#user_id": "user_id"
              },
              ExpressionAttributeValues: {
                  ":user_id": user_id
              },
              ScanIndexForward: false     
        };
        //console.log(params)

        var items = [];
        var queryExecute = function(callback) {

            dynamo.query(params, function(error, result) {
                if (error) {
                  console.log(error)
                  return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
                }else {
                  items = items.concat(result.Items);

                  if(result.LastEvaluatedKey ) {
                    console.log("Recursively Call===>>>>")
                    params.ExclusiveStartKey = result.LastEvaluatedKey;
                    queryExecute();
                  } else {
                      
                      let momentlist = items

                      //momentlist.forEach(function(moment)
                      for(let ii = 0; ii < momentlist.length; ii++)
                      {
                         let moment = momentlist[ii];
                        //if(moment.user_profile_picture)

                        {
                            let params = {
                                TableName: 'DatalineObject',
                                Key:{
                                  "datalineobject_id": moment.datalineobject_id
                                },
                                UpdateExpression: "set #posted_by = :posted_by, #user_profile_picture = :user_profile_picture",
                                ExpressionAttributeNames: {
                                  "#posted_by": "posted_by",
                                  "#user_profile_picture": "user_profile_picture"
                                },
                                ExpressionAttributeValues: {
                                  ":posted_by": posted_by,
                                  ":user_profile_picture": profile_picture
                                },
                                ReturnValues:"UPDATED_NEW"
                            };

                            //console.log(params)
                        
                            ///Update the function
                            dynamo.update(params, (error, result) => {

                              if (error) 
                              {
                                console.log(error);
                                return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
                              }else
                              console.log("Success")

                            });
                        }
                        console.log("process done")

                      }

                  }

                }
            });
        }

        queryExecute();
      }
    });


}


//Update User Profile to Moments
module.exports.updateMomentTitle = (event, context, callback) => {

    return new Promise( function(resolve, reject){

      console.log(event);

      if(1)
      {
        const params = { 
              TableName: 'DatalineObject',
              ProjectionExpression: "datalineobject_id, object_title, object_title_lower",
        };
        //console.log(params)

        var items = [];
        var queryExecute = function(callback) {

            dynamo.scan(params, function(error, result) {
                if (error) {
                  console.log(error)
                  return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
                }else {
                  items = items.concat(result.Items);

                  if(result.LastEvaluatedKey ) {
                    console.log("Recursively Call===>>>>")
                    params.ExclusiveStartKey = result.LastEvaluatedKey;
                    queryExecute();
                  } else {
                      
                      //console.log(items)

                      items.forEach(function(moment)
                      
                      {
                        if(moment.datalineobject_id && moment.object_title && moment.object_title  != "" && !moment.object_title_lower)
                        //if(moment.datalineobject_id && moment.object_title && moment.object_title  != "" )
                        {
                            let params = {
                                TableName: 'DatalineObject',
                                Key:{
                                  "datalineobject_id": moment.datalineobject_id
                                },
                                UpdateExpression: "set #object_title_lower = :object_title_lower",
                                ExpressionAttributeNames: {
                                  "#object_title_lower": "object_title_lower"
                                },
                                ExpressionAttributeValues: {
                                  ":object_title_lower": moment.object_title.toLowerCase(),
                                },
                                ReturnValues:"UPDATED_NEW"
                            };

                             console.log(params)
                            // return 1;
                        
                            ///Update the function
                            dynamo.update(params, (error, result) => {

                              if (error) 
                              {
                                console.log(error);
                                return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
                              }else
                              console.log("Success")

                            });
                        

                        console.log("process done")

                      }

                      });

                  }

                }
            });
        }

        queryExecute();
      }
    });


}

//Function to Block/UnBlock Moment
module.exports.editMomentBlockStatus = (event, context, callback) => {
    console.log(event)

    if(typeof(event["path"]) != "undefined" 
        && typeof(event["path"]["object_id"]) != "undefined" 
        && typeof(event["path"]["user_id"]) != "undefined" 
        && typeof(event["path"]["block_status"]) != "undefined" 
        //&& event.principalId == event["path"]["user_id"]
        )
    {

      var datalineobject_id = event.path.object_id
      var user_id = event.path.user_id
      var block_status = event.path.block_status

      return new Promise(async function(resolve, reject){

        //Get Moment Detail
        var momentdetail = await momentob.getMomentDetail(datalineobject_id);
        
        if(momentdetail.length > 0)
        {
          var block_users = momentdetail[0]["block_users"]
          var list = (block_users ? block_users : []);
          //if(!block_users)
          
          if(block_status == "1") //While Add User to Block List
          {
            list.push(user_id)
            list = Array.from(new Set(list)); //Remove Duplicate Values
          }else //While Remove User to Block List
          {
            let index = list.indexOf(user_id);
            if (index > -1) {
              list.splice(index, 1);
            }
          }
        }
      
        //Set the Params
        var params = {
            TableName: 'DatalineObject',
            Key:{
              "datalineobject_id": datalineobject_id
            },
            UpdateExpression: "SET #block_users = :block_users",
            ExpressionAttributeNames: {
             "#block_users": "block_users"
            },
            ExpressionAttributeValues: {
              ":block_users": list,
            },
            ReturnValues:"UPDATED_NEW"
        };

        console.log(params)

        //Update the function
        dynamo.update(params, async function(error, result) {

          if (error) 
          {
            console.log(error)
            return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
          }

          // TODO implement
          if(result){
            if(block_status == "1") {
              var response = {
                  message: 'Moment is blocked successfully!'
              };
            }else{
              var response = {
                  message: 'Moment is unblocked successfully!'
              };
            }
            callback(null, JSON.stringify(response));
            return 1;
          }
        });
      }); 
    }
}


