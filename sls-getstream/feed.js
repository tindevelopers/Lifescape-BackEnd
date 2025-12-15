'use strict';

let stream = require('getstream');

var API_KEY =  "2kcns77xgk3g";
var API_SECRET = "78ztrwbazhg7sf2urgutp8sazwwmwc7zgzna7ggvb2qgjc2xe2bh3mnxkbppfyda";
var APP_ID = '46242';

let client = stream.connect(API_KEY, API_SECRET, APP_ID);

//Function to follow user
module.exports.sendNotification = (event, context, callback) => {
  console.log(event);

  var user_id = event.user_id;
  var data = event.data;

  if(typeof(user_id) == "object" && user_id.length > 0)
  {
    //Sent Notification to Friends
    user_id.forEach((itemid) => {

      let user_feed = client.feed('notification', itemid );

      //Add Activity
      user_feed.addActivity(data).then(
        function(res) {
          //Success
          console.log("Success")
        }, 
        function(err) {
          // Handle or raise the Error.
          console.log(err)
          console.log("Error")
        }
      );

    });
    

  }else
  {

    let user_feed = client.feed('notification', user_id );

    //Add Activity
    user_feed.addActivity(data).then(
      function(res) {
        //Success
        console.log("Success")
      }, 
      function(err) {
        // Handle or raise the Error.
        console.log(err)
        console.log("Error")
      }
    );

  }

  

}

//Function to follow user
module.exports.markFlagtoNotification = (event, context, callback) => {
  console.log(event);

  var user_id = event.path.user_id;
  var flag =  event.body.flag;
  var notification_ids = event.body.notification_ids;

  if(typeof(user_id) == 'undefined' || user_id == "" || typeof(notification_ids) == 'undefined' || notification_ids == "" )
  {
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
  }

  let notifications = client.feed('notification', user_id).get(
      {  "mark_seen" : notification_ids }
    ).then(
      function(res) {
        callback(null, JSON.stringify({message : "Notifications are marked as seen!"}));
      },function(err) {
        // Handle or raise the Error.
        console.log(err);
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
  );

}

//Function to follow user
module.exports.getNotifications = (event, context, callback) => {
  console.log(event);

  var user_id = event.path.user_id;

  if(typeof(user_id) != "undefined" && user_id != "")
  {
    var user_feed = client.feed('notification', user_id );

    user_feed.get({ limit: 50 }).then(function(results) {
      console.log(results);
      
      let cnt = 0;
      results.results.forEach(function(item){
        
        if(item.is_seen == false)
        {
          cnt++;
        }
        //console.log(item.activities)
        //item.activities[0].time = new Date()
        //item.updated_at = ""

      });

      results.unseen = cnt
      //console.log(cnt)
      //console.log(results)
      callback(null, JSON.stringify(results));
    },function(err) {
      // Handle or raise the Error.
      console.log(err);
      return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
    });

  }
}


