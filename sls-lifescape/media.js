'use strict';

const AWS = require('aws-sdk');

var uuid = require('uuid');

const dynamo = new AWS.DynamoDB.DocumentClient();

module.exports.getMedias = (event, context, callback) => {

    console.log(event);

    var object_id = event["path"]["object_id"];

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    };

    if(object_id == "")
    {
      const errorResponse = {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ statusCode: 400, message: "Invalid request body" })
      };
      return callback(null, errorResponse);
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
              const errorResponse = {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ statusCode: 500, message: "Server Error" })
              };
              return callback(null, errorResponse);
            } else {
              const response = {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(result.Items)
              };
              callback(null, response);             
            }
        });
    }

    queryExecute(callback);

}

module.exports.saveMedia = (event, context, callback) => {
    console.log(event)
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // Parse event body (could be string or object)
    let data = event.body;
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            const errorResponse = {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ statusCode: 400, message: "Invalid JSON in request body" })
            };
            return callback(null, errorResponse);
        }
    }
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
        const errorResponse = {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ statusCode: 500, message: "Server Error" })
        };
        return callback(null, errorResponse);
      }
      // TODO implement
      const response = {
          statusCode: 200,
          headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type,Authorization',
              'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              message: "Media Data saved successfully!",
              body: { media_id: id }
          })
      };
      callback(null, response);
    });
}

module.exports.saveMedias = (event, context, callback) => {

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    };

    // Parse event body (could be string or object)
    let data = event.body;
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            const errorResponse = {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ statusCode: 400, message: "Invalid JSON in request body" })
            };
            return callback(null, errorResponse);
        }
    }
    
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
          const errorResponse = {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type,Authorization',
              'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ statusCode: 500, message: "Server Error" })
          };
          return callback(null, errorResponse);
        }
        // TODO implement
        mediaid_arr.push(id);
        if(cnt == data.length)
        {
          const response = {
              statusCode: 200,
              headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  message: "Media Data saved successfully!",
                  body: { media_id: mediaid_arr }
              })
          };
          callback(null, response);
        }
      });

    });
    
}

// Wasabi S3-compatible upload function
module.exports.uploadToWasabi = (event, context, callback) => {
    console.log('Wasabi upload event:', event);
    
    const data = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : event;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    };

    if (!data.imageBase64 && !data.image) {
        const errorResponse = {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
                statusCode: 400, 
                message: "Image data (imageBase64 or image) is required" 
            })
        };
        return callback(null, errorResponse);
    }

    if (!data.user_id) {
        const errorResponse = {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
                statusCode: 400, 
                message: "user_id is required" 
            })
        };
        return callback(null, errorResponse);
    }

    // Configure Wasabi S3 client
    const wasabiEndpoint = process.env.WASABI_ENDPOINT || 'https://s3.us-east-1.wasabisys.com';
    const wasabiRegion = process.env.WASABI_REGION || 'us-east-1';
    
    const s3 = new AWS.S3({
        endpoint: wasabiEndpoint,
        region: wasabiRegion,
        credentials: {
            accessKeyId: process.env.WASABI_ACCESS_KEY,
            secretAccessKey: process.env.WASABI_SECRET_KEY
        },
        s3ForcePathStyle: true // Required for Wasabi
    });

    return new Promise(async (resolve, reject) => {
        try {
            // Extract base64 data
            let imageBase64 = data.imageBase64 || data.image;
            if (imageBase64.startsWith('data:image')) {
                imageBase64 = imageBase64.split(',')[1];
            }

            // Convert base64 to buffer
            const imageBuffer = Buffer.from(imageBase64, 'base64');
            
            // Generate unique key
            const timestamp = Date.now();
            const filename = data.filename || `image-${timestamp}.jpg`;
            const key = `moments/${data.user_id}/${timestamp}-${filename}`;
            
            // Upload to Wasabi
            const uploadParams = {
                Bucket: process.env.WASABI_BUCKET_NAME || 'lifescape-images',
                Key: key,
                Body: imageBuffer,
                ContentType: data.contentType || 'image/jpeg',
                ACL: 'public-read' // Or use bucket policy
            };

            const uploadResult = await s3.upload(uploadParams).promise();
            
            // Generate public URL
            const publicUrl = uploadResult.Location;
            
            // Optionally save media record to DynamoDB
            let mediaId = null;
            if (data.saveToDb !== false) {
                mediaId = uuid.v1();
                const mediaItem = {
                    "media_id": mediaId,
                    "user_id": data.user_id,
                    "media_desc": data.media_desc || '',
                    "media_ext": data.media_ext || 'jpg',
                    "media_type": data.media_type || 'image',
                    "media_size": imageBuffer.length,
                    "media_height": data.media_height || 0,
                    "media_width": data.media_width || 0,
                    "media_order": data.media_order || 0,
                    "wasabi_url": publicUrl,
                    "wasabi_key": key,
                    "cloudinary_url": publicUrl, // For backward compatibility
                    "created_datetime": Date.now(),
                    "updated_datetime": Date.now()
                };

                if (data.datalineobject_id) {
                    mediaItem.datalineobject_id = data.datalineobject_id;
                }

                if (data.metadata) {
                    mediaItem.metadata = JSON.stringify(data.metadata);
                }

                const params = {
                    TableName: 'Media',
                    Item: mediaItem
                };

                await dynamo.put(params).promise();
            }

            const response = {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    message: "Image uploaded to Wasabi successfully!",
                    body: {
                        media_id: mediaId,
                        wasabi_url: publicUrl,
                        wasabi_key: key,
                        url: publicUrl, // Alias for compatibility
                        bucket: uploadParams.Bucket,
                        size: imageBuffer.length
                    }
                })
            };

            callback(null, response);
            resolve(response);

        } catch (error) {
            console.error('Wasabi upload error:', error);
            const errorResponse = {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({
                    message: "Wasabi upload failed",
                    error: error.message
                })
            };
            callback(null, errorResponse);
            reject(error);
        }
    });
}
