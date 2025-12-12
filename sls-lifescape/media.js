'use strict';

const AWS = require('aws-sdk');

var uuid = require('uuid');

const dynamo = new AWS.DynamoDB.DocumentClient();

module.exports.getMedias = (event, context, callback) => {

    console.log(event);

    var object_id = event["path"]["object_id"];

    if(object_id == "")
    {
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    }

    const params = { 
            TableName: 'Media',
            IndexName:"datalineobject_id-created_datetime-index",
            KeyConditionExpression: "#datalineobject_id = :datalineobject_id",
            ExpressionAttributeNames:{
                "#datalineobject_id": "datalineobject_id",
            },
            ExpressionAttributeValues: {
                ":datalineobject_id": object_id,
            },
            ScanIndexForward: false     
    };
    
    var queryExecute = function(callback) {        

        dynamo.query(params, function(error, result) {
            if (error) {
              console.log(error)
              return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
            } else {
              callback(null, JSON.stringify(result.Items));             
            }
        });
    }

    queryExecute(callback);

}

module.exports.saveMedia = (event, context, callback) => {
    console.log(event)
    const data = event.body;//JSON.parse(event.body);
    var id = uuid.v1();

    var item_data = {
      "media_id": id,
      "user_id": data.user_id,
      //"datalineobject_id": mediaref_id,
      "media_desc": data.media_desc,
      "media_ext": data.media_ext,
      "media_type": data.media_type,
      "media_size": data.media_size,
      "media_height": data.media_height,
      "media_width": data.media_width,
      "media_order": data.media_order,
      "cloudinary_url": data.cloudinary_url.replace(".heic",".jpg"),
      "created_datetime": Date.now(),
      "updated_datetime": Date.now()
    }
    
    if(data.cloudinary_id)
      item_data.cloudinary_id = data.cloudinary_id

    if(data.datalineobject_id)
      item_data.datalineobject_id = data.datalineobject_id

    if(data.metadata)
      item_data.metadata = JSON.stringify(data.metadata)

    const params = {
      TableName: 'Media',
      Item: item_data
    };
    console.log(params);
    
    dynamo.put(params, (error, result) => {
      if (error) {
        console.log(error)
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
      // TODO implement
      const response = {
          message: "Media Data saved successfully!",
          body: { media_id: id }
      };
      callback(null, JSON.stringify(response));
    });
}

module.exports.saveMedias = (event, context, callback) => {

    const data = event.body;//JSON.parse(event.body);
    
    console.log(event);
    console.log(data.length);

    let mediaid_arr = [];
    let cnt = 0;
    data.forEach(function(item){

      let id = uuid.v1();

      let item_data = {
            "media_id": id,
            //"datalineobject_id": mediaref_id,
            "media_desc": item.media_desc,
            "media_ext": item.media_ext,
            "media_type": item.media_type,
            "media_size": item.media_size,
            "media_height": item.media_height,
            "media_width": item.media_width,
            "media_order": item.media_order,
            "cloudinary_url": item.cloudinary_url.replace(".heic",".jpg"),
            "created_datetime": Date.now(),
            "updated_datetime": Date.now()
      }

      if(typeof(item.cloudinary_id) != "undefined" && item.cloudinary_id != " ")
        item_data.cloudinary_id = item.cloudinary_id;

      if(typeof(item.user_id) != "undefined" && item.user_id != " ")
        item_data.user_id = item.user_id;

      if(typeof(item.media_desc) != "undefined" && item.media_desc != " ")
        item_data.media_desc = item.media_desc;

      if(typeof(item.media_type) != "undefined" && item.media_type != " ")
        item_data.media_type = item.media_type

      if(typeof(item.media_size) != "undefined" && item.media_size != " ")
        item_data.media_size = item.media_size

      if(typeof(item.media_ext) != "undefined" && item.media_ext != " ")
        item_data.media_ext = item.media_ext

      if(typeof(item.media_height) != "undefined" && item.media_height != " ")
        item_data.media_height = item.media_height

      if(typeof(item.media_width) != "undefined" && item.media_width != " ")
        item_data.media_width = item.media_width

      if(typeof(item.media_order) != "undefined" && item.media_order != " ")
        item_data.media_order = item.media_order

      if(typeof(item.cloudinary_url) != "undefined" && item.cloudinary_url != " ")
        item_data.cloudinary_url = item.cloudinary_url            

      if(typeof(item.datalineobject_id) != "undefined" && item.datalineobject_id != " ")
        item_data.datalineobject_id = item.datalineobject_id

      if(typeof(item.metadata) != "undefined" && item.metadata != " ")  
        item_data.metadata = JSON.stringify(item.metadata)

      let params = {
        TableName: 'Media',
        Item: item_data
      };
      
      console.log(params);
      
      dynamo.put(params, (error, result) => {
        cnt++;

        if (error) {
          console.log(error)
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
        }
        // TODO implement
        mediaid_arr.push(id);
        if(cnt == data.length)
        {
          const response = {
              message: "Media Data saved successfully!",
              body: { media_id: mediaid_arr }
          };
          callback(null, JSON.stringify(response));
        }
      });

    });
    
}
