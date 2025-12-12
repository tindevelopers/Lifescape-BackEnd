'use strict';

const AWS = require('aws-sdk');

var uuid = require('uuid');

var momentob = require('./lib/model/moment.js');
var mediaob = require('./lib/model/media.js');
var firebaseuserob = require('./lib/model/firebase-user.js');
var threadob = require('./lib/model/thread.js');

const dynamo = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {

    const data = event.body;//JSON.parse(event.body);
    console.log(event);

    var user_id = event.body.user_id;
    var thread_name = event.body.thread_name;

    if(!user_id || !thread_name)
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

    let myProm = new Promise(async function(resolve, reject){

      var id = await threadob.savedata(data)

      if(id){
        const response = {
          message: 'Channel Data inserted successfully!',
          body: { thread_id: id }
        };
        callback(null, JSON.stringify(response));
      }else
      {
        return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
      }
      

    });

}

module.exports.edit = (event, context, callback) => {

    console.log(event)
    const data = event.body;//JSON.parse(event.body);

    var thread_id = event.path.thread_id
    var user_id = event.path.user_id

    if(user_id && thread_id && data.thread_name != "")
    {

      var params = {

        TableName: 'Thread',
        Key:{
          "thread_id": thread_id
        },

        UpdateExpression: "set " +  
                        "thread_type = :thread_type, " +
                        "updated_datetime = :updated_datetime, " +
                        "thread_name_lower = :thread_name_lower, " +
                        "thread_name = :thread_name",
        ConditionExpression: "user_id = :user_id",
        ExpressionAttributeValues: {
              
              ":thread_type": data.thread_type,
              ":thread_name": data.thread_name,
              ":thread_name_lower": data.thread_name.toLowerCase(),
              ":updated_datetime": Date.now(),
              ":user_id": user_id
          },

          ReturnValues:"UPDATED_NEW"
      };
      if(data.privacy && data.privacy != ""){
        params.UpdateExpression += ", privacy = :privacy";
        params.ExpressionAttributeValues[":privacy"] = data.privacy.toLowerCase();
      }
      
      if(data.thread_desc && data.thread_desc != ""){
        params.UpdateExpression += ", thread_desc = :thread_desc";
        params.ExpressionAttributeValues[":thread_desc"] = data.thread_desc;
      }
      if(data.lvl && data.lvl != ""){
        params.UpdateExpression += ", lvl = :lvl";
        params.ExpressionAttributeValues[":lvl"] = data.lvl;
      }
      if(data.parent_id && data.parent_id != ""){
        params.UpdateExpression += ", parent_id = :parent_id";
        params.ExpressionAttributeValues[":parent_id"] = data.parent_id;
      }      
      if(data.cloudinary_id && data.cloudinary_id != ""){
        params.UpdateExpression += ", cloudinary_id = :cloudinary_id";
        params.ExpressionAttributeValues[":cloudinary_id"] = data.cloudinary_id;
      }
      if(data.cover_pic  && data.cover_pic != ""){
        params.UpdateExpression += ", cover_pic = :cover_pic";
        params.ExpressionAttributeValues[":cover_pic"] = data.cover_pic;
      }
      if(data.banner_img  && data.banner_img != ""){
        params.UpdateExpression += ", banner_img = :banner_img";
        params.ExpressionAttributeValues[":banner_img"] = data.banner_img;
      }

      console.log(params);

      dynamo.update(params, (error, result) => {

        if (error) {
          //console.error(error);
          return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
        }
        // TODO implement
        const response = {
          message: 'Channel Data updated successfully!',
        };
        callback(null, JSON.stringify( response ));

      });
    }

}


module.exports.get = (event, context, callback) => {
    console.log(event)
    //event.principalId =  event.path.user_id
    var thread_id = event.path.thread_id
    var user_id = event.path.user_id
    var role = '';

    //Check OwnerShip of Thread
    if(!user_id || !thread_id)
    {
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    }


    //if(event.principalId != user_id) //if User is not Owner
    // {
    //   let myProm = new Promise(async function(resolve, reject){
    //     let res = await threadob.checkAccess(user_id, thread_id, 'subscriber');
        
    //     if(res.length > 0)
    //     {
    //         const params = { 
    //                 TableName: 'Thread',
    //                 KeyConditionExpression:"thread_id = :thread_id",
    //                 ExpressionAttributeValues: {
    //                   ":thread_id": thread_id
    //                 }
    //         };
    //         console.log(params);

    //         dynamo.query(params, function(error, result) {
    //                 if (error) {
    //                   console.log(error)
    //                   return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
    //                 } else {
    //                   //console.log(result.Items)
    //                   callback(null, JSON.stringify(result.Items));
    //                 }
    //         });

    //     }else
    //       return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    //   });
    // }
    const params = { 
            TableName: 'Thread',
            KeyConditionExpression:"thread_id = :thread_id",
            ExpressionAttributeValues: {
              ":thread_id": thread_id
            }
    };
    console.log(params);

    dynamo.query(params, function(error, result) {
            if (error) {
              console.log(error)
              return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
            } else {
              //console.log(result.Items)
              callback(null, JSON.stringify(result.Items));
            }
    });


    
    
}

module.exports.delete = (event, context, callback) => {
    console.log(event)

    var thread_id = event.path.thread_id
    var user_id = event.path.user_id

    if(user_id == "" || typeof(user_id) == "undefined" || 
       thread_id == "" || typeof(thread_id) == "undefined" || 
       event.principalId != user_id)
    {
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    }

    const params = { 
            TableName: 'Thread',
            Key: {
              "thread_id": thread_id
            },
            ConditionExpression:"user_id = :user_id",
            ExpressionAttributeValues: {
               ":user_id": user_id
               
            },
    };
    console.log(params);

    dynamo.delete(params, function(error, result) {
            if (error) {
              console.log(error)
              return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
            } else {
                callback(null, JSON.stringify({ message: "Thread is Deleted successfully!"}));
            }
    });
    
}

//Function to Add or Remove Thread From Favourite List of User
module.exports.addRemoveFavouriteThread = (event, context, callback) => {

    console.log(event);

    //Get the parameters
    var user_id = event["path"]["user_id"];
    var thread_id = event["path"]["thread_id"];
    var action = event["path"]["action"];

    //Validate for request parameters
    if(user_id == "" || typeof(user_id) == "undefined" || 
       thread_id == "" || typeof(thread_id) == "undefined")
    {
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    }

    let myProm = new Promise(async function(resolve, reject){

      var res = await threadob.addRemoveFavourite(user_id, thread_id, action)
      console.log(res)
      if(res == "SUCCESS"){
        if(action == "add")
          var resmessage = "Channel is successfully added to Favourite List!";
        else
          var resmessage = "Channel is successfully deleted from Favourite List!";
        callback(null, JSON.stringify({message: resmessage}));
      }else
      {
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
      

    });
}

module.exports.getThreads = (event, context, callback) => {
    
    if(typeof(event["path"]) != "undefined" && typeof(event["path"]["flag"]) != "undefined")
      var flag = event["path"]["flag"];
    else
      var flag = "detail";

    var byfilter = event["path"]["byfilter"];
    var byfilter_id = event["path"]["byfilter_id"];

    if(event["path"]["keyword"])
      var keyword = event["path"]["keyword"];
    else
      var keyword = ""

    if(byfilter == 'user')
    {
      var user_id = byfilter_id;

      if(user_id == "")
        return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

      var myProm = new Promise(async function(resolve, reject){

        var userThreadList =  await threadob.getUserThreads(user_id);

        if(userThreadList.length > 0){
          if(flag == "list") //Check if only threads list is required to return
              return callback(null, JSON.stringify(userThreadList));
          resolve(userThreadList);
        }else
          return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));

      })
    }

    if(byfilter == 'privacy')
    {
      var privacy = byfilter_id.toLowerCase();
      if(privacy == "")
        return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

      var myProm = new Promise(async function(resolve, reject){

        var threads_res =  await threadob.getThreadsByPrivacy(privacy, keyword);

        if(threads_res.length > 0){
          if(flag == "list") //Check if only threads list is required to return
              return callback(null, JSON.stringify(threads_res));
          resolve(threads_res);
        }else
          return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));

      })
    }

    myProm.then(
      function(thread_result) {
        // handle a successful result 
        
        return new Promise(function(resolve, reject) {

          const mainarray = [];
          var cnt = 0;
          var total_thread = thread_result.length
          //var cnt2 = 0;

          thread_result.forEach(async function(item, i){

            let tempThreadData = {};
            //Fetch Media Data of Moments
            let thread_id = item.thread_id

            let threadMomentList = await momentob.getThreadMomentList(thread_id);

            item.moment_counter = threadMomentList.length;
            tempThreadData = item            

            cnt  = cnt + 1;
            let items1 = [];
            
            
            let moment_count = threadMomentList.length;
            //console.log(i + " === " +thread_id + " ===" + moment_count) ;

            if(moment_count > 0)
            {
                    let cnt2 = 0;

                    threadMomentList.forEach(async function(value1){
                          
                          let tempMomentData = {};
                          //Fetch Media Data of Moments
                          let objectid = value1.datalineobject_id
                          //items1[objectid] = value1
                          tempMomentData = value1
                              
                          let momentMediaList = await momentob.getMomentMedias(objectid, 1)
                          
                          let media_items = []
                          
                          //console.log(result.Items)
                          //console.log(result.Items.length)
                          if(momentMediaList.length > 0)
                          {
                            // momentMediaList.forEach(function(v2){
                            //     media_items.push(v2)
                            // });
                            
                            // tempMomentData.mediadata = media_items
                            tempMomentData.mediadata = momentMediaList[0]
                      
                          }

                          items1.push(tempMomentData)
                          cnt2++;
                          //console.log(cnt2 + " ----- "+ moment_count)
                          if(cnt2 == moment_count)
                          { 
                            tempThreadData.moment_data = items1  
                            mainarray.push(tempThreadData)
                          }
                          
                    });
                 
            }else
            {
              mainarray.push(tempThreadData)              
            }

            setTimeout(() => {
              if(cnt == total_thread)
              {
                resolve(mainarray)
              }
            }, 5000);

          });

        });

      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
    )


    .then(
      function(object_result) {
        console.log("Final Result ====>");
        //console.log(object_result)
        callback(null, JSON.stringify(object_result));
      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));      
      }
    );


}

//Function to get thread media files by user id
module.exports.getUserThreadsMedias = (event, context, callback) => {

    console.log(event);

    var user_id = event["path"]["user_id"];

    if(user_id == "")
    {
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    }

    let myProm = new Promise(async function(resolve, reject){

      var userThreadList =  await threadob.getUserThreads(user_id);
      //console.log(userThreadList);

      if(userThreadList.length > 0){
        resolve(userThreadList);
      }else
        return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));

    })

    .then(
      function(thread_result) {
        
        return new Promise(function(resolve, reject) {

          var cnt = 0;
          var total_thread = thread_result.length

          thread_result.forEach(async function(item, i){//Loop through Threads
              
            let thread_media_arr = [];
            //Fetch Media Data of Moments
            let thread_id = item.thread_id
            let threadMomentList = await momentob.getThreadMomentList(thread_id, user_id);

            item.moment_counter = threadMomentList.length;
            //tempThreadData = item            
            
            let moment_count = threadMomentList.length;
            //console.log(i + " === " +thread_id + " ===" + moment_count) ;

            if(moment_count > 0)
            {
              let cnt2 = 0; //Counter to track moment

              threadMomentList.forEach(async function(value1){
                    
                    
                    //Fetch Media Data of Moments
                    let momentMediaList = await momentob.getMomentMedias(value1.datalineobject_id)

                    if(momentMediaList.length > 0)
                    {
                      momentMediaList.forEach(function(v2){
                        
                         v2.object_title = value1.object_title;
                         thread_media_arr.push(v2)
                      });
                    }

                    cnt2++;
                    //console.log(cnt2 + " ----- "+ moment_count)
                    if(cnt2 == moment_count)
                    { 
                      thread_result[i].media_counter = thread_media_arr.length;
                      thread_result[i].mediadata = thread_media_arr;
                    }

              });
                 
            }else
            {
              thread_result[i].mediadata = []
              thread_result[i].media_counter = 0;
            }
            cnt++;

            //Wait for 3 Sec to complete the process
             setTimeout(() => {
               if(cnt == total_thread)
                 resolve(thread_result)
             }, 3000);

          });

        });

      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
    )

    .then(
      function(object_result) {
        console.log("Final Result ==>");
        //firebaseuserob.firebasedelete();
        callback(null, JSON.stringify(object_result));
      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));      
      }
    );


}

//Function to Get All Threads
module.exports.updateMomentCounter = (event, context, callback) => {

  const params = { 
    TableName: 'Thread'
  };

  var items = [];

  var queryExecute = function(callback) {       

    dynamo.scan(params, function(err, result) {
      if (err) {
          reject("ERROR");
      } else {
          
          items = items.concat(result.Items);

          if(result.LastEvaluatedKey) {
              console.log("recursive call..")
              params.ExclusiveStartKey = result.LastEvaluatedKey;
              queryExecute();
          } else {

            items.forEach(function(item,i)
            {

                //if(i < 5 )
                {

                  let params1 = { 
                      "TableName": 'DatalineObject',
                      "IndexName": "user_id-created_datetime-index",
                      //"ProjectionExpression": "#location, object_desc, start_date, user_id, posted_by, user_profile_picture, datalineobject_id, thread_id, object_title, created_datetime, like_counter, comments_counter, mediadata[0].cloudinary_url,mediadata[0].media_type, mediadata[0].media_width, mediadata[0].media_height",
                      
                      "KeyConditions": {
                        "user_id": {
                          "ComparisonOperator": "EQ",
                          "AttributeValueList":  { "S" : item.user_id } 
                        }
                      },
                      "QueryFilter":
                      {
                        "thread_id":
                        {
                          "ComparisonOperator": "CONTAINS",
                          "AttributeValueList": 
                            {
                              "L": item.thread_id 
                            }
                        },
                        "is_published":
                        {
                          "ComparisonOperator": "EQ",
                          "AttributeValueList": 
                            {
                              "S": "1" 
                            }
                        }
                      },
                      "ScanIndexForward": false
                    };

                  let momentitems = []

                  let queryExecute1 = function() {

                    dynamo.query(params1,function(err,result) {

                      if(err) {
                        console.log(err);
                        //callback(new Error('An Error occured while scanning for results.'));
                        return;
                      } else {

                        momentitems = momentitems.concat(result.Items);


                        if(result.LastEvaluatedKey) {
                          params1.ExclusiveStartKey = result.LastEvaluatedKey;
                          queryExecute1();
                        } else {
                          console.log(item.thread_id)
                          console.log(momentitems.length)

                          let params = {
                              TableName: 'Thread',
                              Key:{
                                "thread_id": item.thread_id
                              },
                              UpdateExpression: "SET moment_counter = :moment_counter",
                              ExpressionAttributeValues : {
                                    ':moment_counter': momentitems.length
                              },
                              ReturnValues:"UPDATED_NEW"
                            };

                                console.log(params);
                                

                                dynamo.update(params, (error, result) => {
                                    if (error) {
                                        console.log(error);
                                      }
                                    if(result){
                                      console.log("SUCCESS UPDATED")
                                    }
                                  });


                        }
                      }
                    });

                  }

                  queryExecute1();

                }
                
            });

          }
              
              

      }
    });
  }
  queryExecute();

}

module.exports.searchUserThread = (event, context, callback) => {
    console.log(event);
    //event.principalId =  event.path.user_id
    var keyword = event.path.keyword
    var user_id = event.path.user_id
    //event.principalId = event.path.user_id;

    if(!user_id || !keyword || event.principalId != user_id)
    {
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    }

    if(keyword == "is_favourite")
    {
      var params = { 
            "TableName": "Thread",
            "IndexName": "user_id-created_datetime-index",
            "KeyConditions": {
                "user_id": {
                  "ComparisonOperator": "EQ",
                  "AttributeValueList":  { "S" : user_id } 
                }
            },
            "QueryFilter":
            {
              "is_favourite":
              {
                "ComparisonOperator": "EQ",
                "AttributeValueList": 
                  {
                    "S": 1
                  }
              }
            }       
      };
    }else
    {
      var params = { 
            "TableName": "Thread",
            "IndexName": "user_id-created_datetime-index",
            "KeyConditions": {
                "user_id": {
                  "ComparisonOperator": "EQ",
                  "AttributeValueList":  { "S" : user_id } 
                }
            },
            "QueryFilter":
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
      };
    }

    dynamo.query(params, function(error, result) {
            if (error) {
              console.log(error)
              return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
            } else {
              //console.log(result.Items)
              if(result.Items.length > 0) 
                callback(null, JSON.stringify(result.Items));
              else
                return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
            }
    });

}

module.exports.updateThreadTitle = (event, context, callback) => {

    return new Promise( function(resolve, reject){

      console.log(event);

      if(1)
      {
        const params = { 
              TableName: 'Thread',
              ProjectionExpression: "thread_id, thread_name, thread_name_lower",
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
                        //if(moment.thread_id && moment.thread_name && moment.thread_name  != "" && !moment.thread_name_lower)
                        {
                            let params = {
                                TableName: 'Thread',
                                Key:{
                                  "thread_id": moment.thread_id
                                },
                                UpdateExpression: "set #thread_name_lower = :thread_name_lower",
                                ExpressionAttributeNames: {
                                  "#thread_name_lower": "thread_name_lower"
                                },
                                ExpressionAttributeValues: {
                                  ":thread_name_lower": moment.thread_name.toLowerCase(),
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

module.exports.updateThreadinPermissions = (event, context, callback) => {

    return new Promise( function(resolve, reject){

      console.log(event);

      if(1)
      {
        const params = { 
              TableName: 'Thread',
              ProjectionExpression: "thread_id, user_id, thread_name",
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
                        //if(moment.thread_id && moment.thread_name && moment.thread_name  != "" && !moment.thread_name_lower)
                        {

                          let params = {
                            TableName: 'ObjectPermissions',
                            Item: {
                              'object_id' : moment.thread_id,
                              'user_id' : moment.user_id,
                              'object_type' : "thread",
                              'role' : "owner"
                            }
                          };
                          
                          console.log(params);

                          dynamo.put(params, (error, result) => {
                            if (error) {
                              console.log(error)
                              //resolve(0)
                            }
                            //resolve(id)          
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

