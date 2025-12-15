'use strict';

const AWS = require('aws-sdk');

var uuid = require('uuid');

var momentob = require('./lib/model/moment.js');
var userob = require('./lib/model/user.js');

const dynamo = new AWS.DynamoDB.DocumentClient();

//Function to create Moment
module.exports.save = (event, context, callback) => {
    
    const data = event.body;//JSON.parse(event.body);
    var datalineobject_id = event.path.object_id.trim();
    var comment_text = event.body.comment_text.trim();

    if(datalineobject_id != "" && typeof(datalineobject_id) != "undefined" 
      && comment_text != "" && typeof(comment_text) != "undefined")
    {
      return new Promise(async function(resolve, reject){

        var id = uuid.v1();
        
        var item_data = {
          "comment_id": id,
          "user_id": data.user_id.trim(),
          "datalineobject_id": datalineobject_id,
          "comment_text": data.comment_text.trim(),
          "created_datetime": Date.now(),
          "status": 1
        }

        if(typeof(data.user_id) != "undefined" && data.user_id != "")  
        {
          //Capture User Detail
          let user_detail = await userob.getUserDetail(data.user_id);
          
          if(Object.keys(user_detail).length > 0){
            if(user_detail.profile_picture != "")
              item_data.profile_picture = user_detail.profile_picture;
            if(user_detail.displayName != "")
            item_data.posted_by = user_detail.displayName;
          }
        }

        const params = {
          TableName: 'DatalineObjectComments',
          Item: item_data
        };

        console.log(params)

        dynamo.put(params, async function(error, result) {
          if (error) {
            console.log(error)
            return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
          }
          // TODO implement
          await momentob.updateMomentCommentCounter(datalineobject_id, 'add');
          const response = {
              message: 'Comment Data inserted successfully!',
              body: { comment_id: id }
          };
          callback(null, JSON.stringify(response));
        });
      });

    }else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
}

//Function to get Comments By Object ID
module.exports.getMomentLatestComments = (event, context, callback) => {
    
    const data = event.body;//JSON.parse(event.body);
    var user_id = event.path.user_id;
    var datalineobject_id = event.path.object_id;
    var page_rec = 20;
    var LastEvaluatedKey = "";

    if(event["body"] && event["body"]["last_comment_id"])
      LastEvaluatedKey = event["body"]["last_comment_id"];

    if(event["body"] && event["body"]["page_rec"])
      page_rec = event["body"]["page_rec"];
    
    if(datalineobject_id && datalineobject_id != "")
    {
      const params = { 
              TableName: 'DatalineObjectComments',
              IndexName:"datalineobject_id-created_datetime-index",
              KeyConditionExpression: "#datalineobject_id = :datalineobject_id",
              ExpressionAttributeNames:{
                  "#datalineobject_id": "datalineobject_id",
              },
              ExpressionAttributeValues: {
                  ":datalineobject_id": datalineobject_id,
              },
              ScanIndexForward: false
      };

      var items = [];

      var queryExecute = function(callback) {        

          dynamo.query(params, function(err, result) {

              if (err) {
                return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
              } else {

                  items = items.concat(result.Items);

                  if(result.LastEvaluatedKey && items.length < page_rec) {
                    params.ExclusiveStartKey = result.LastEvaluatedKey;
                    queryExecute();
                  } else {

                    return new Promise(function(resolve, reject){

                      let cnt = 0;
                      items.forEach(async function(item){

                          item.created_datetime = new Date(item.created_datetime);
                          
                          
                          let user_detail = await userob.getUserDetail(item.user_id);
                          cnt++;

                          if(Object.keys(user_detail).length > 0){
                            if(user_detail.profile_picture != "")
                              item.user_profile_picture = user_detail.profile_picture;
                            if(user_detail.displayName != "")
                              item.posted_by = user_detail.displayName;
                          }

                          if(cnt == items.length)
                          {
                            //console.log(items)
                            resolve(items)
                          }

                      });

                      if(items.length == 0)
                        resolve(items)
                    })
                    .then(function(items){

                      let start = 0;
                      if(LastEvaluatedKey && LastEvaluatedKey != "")
                      {
                          items.forEach(function(item, i){
                            
                            if(item.comment_id == LastEvaluatedKey) 
                              start = i + 1;

                          });
                      }
                      var response = {}

                      var res = items.slice(start, eval(start + page_rec));
                      response.comments_counter = items.length
                      response.comments_list = res

                      callback(null, JSON.stringify(response));


                  });
                    
                  }
              }
          });
      }

      queryExecute(callback);

    }else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}

//Function to get Comments By Object ID
module.exports.getMomentComments = (event, context, callback) => {
    
    const data = event.body;//JSON.parse(event.body);
    var datalineobject_id = event.path.object_id;
    
    if(datalineobject_id)
    {
      const params = { 
              TableName: 'DatalineObjectComments',
              IndexName:"datalineobject_id-created_datetime-index",
              KeyConditionExpression: "#datalineobject_id = :datalineobject_id",
              ExpressionAttributeNames:{
                  "#datalineobject_id": "datalineobject_id",
              },
              ExpressionAttributeValues: {
                  ":datalineobject_id": datalineobject_id,
              },
              ScanIndexForward: true
      };

      var items = [];

      var queryExecute = function(callback) {        

          dynamo.query(params, function(err, result) {

              if (err) {
                return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
              } else {
                  items = items.concat(result.Items);

                  if(result.LastEvaluatedKey) {
                    params.ExclusiveStartKey = result.LastEvaluatedKey;
                    queryExecute();
                  } else {
                    if(items.length > 0)
                    {
                      let cnt =0 ;
                      items.forEach(async function(item){
                        
                        let user_detail = await userob.getUserDetail(item.user_id);
                        cnt++;
                        //console.log(user_detail)

                        if(Object.keys(user_detail).length > 0){
                          if(user_detail.profile_picture != "")
                            item.user_profile_picture = user_detail.profile_picture;
                          if(user_detail.displayName != "")
                            item.posted_by = user_detail.displayName;
                        }

                        if(cnt == items.length){
                          callback(null, JSON.stringify(items));
                        }

                      });
                    }
                    else
                      return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
                  }
              }
          });
      }

      queryExecute(callback);

    }else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}

module.exports.delete = (event, context, callback) => {

    console.log(event)

    var comment_id = event.path.comment_id
    var user_id = event.body.user_id

    if(comment_id != "")
    {
        return new Promise(async function(resolve, reject){

            let commentdetail = await momentob.getCommentDetail(comment_id);

            if(commentdetail.length > 0)
            {
                  let datalineobject_id = commentdetail[0].datalineobject_id;
                  let params = { 
                      TableName: 'DatalineObjectComments',
                      Key: {
                        "comment_id": comment_id
                      }
                  };

                  dynamo.delete(params, async  function(error, result) {

                      if (error) {
                        return context.fail(JSON.stringify({message:"server_error"}));
                      }else{ 

                        await momentob.updateMomentCommentCounter(datalineobject_id, 'delete');

                        const response = {
                          message: 'Comment is deleted successfully!'
                        };
                        callback(null, JSON.stringify(response));
                      }
                  });

            }
            else
                return context.fail(JSON.stringify({message:"not_found"}));

        });
           
    }



}

