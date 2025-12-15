'use strict';

let stream = require('getstream');

var API_KEY =  "2kcns77xgk3g";
var API_SECRET = "78ztrwbazhg7sf2urgutp8sazwwmwc7zgzna7ggvb2qgjc2xe2bh3mnxkbppfyda";
var APP_ID = '46242';

let client = stream.connect(API_KEY, API_SECRET, APP_ID);

//Function to follow user
module.exports.follow = (event, context, callback) => {
  console.log(event);

  var user_id = event.user_id;
  var to_user_id = event.to_user_id;

  var from = client.feed('user', user_id );
  var to = client.feed('user', to_user_id );

  //User Follow Method
  from.follow('user', to_user_id).then(
    function(res) {
      console.log("Success")
    }, // nothing further to do
    function(err) {
      console.log(err)
      console.log("Error")
    }
  );

}

//Function to unfollow user
module.exports.unfollow = (event, context, callback) => {
  console.log(event);

  var user_id = event.user_id;
  var to_user_id = event.to_user_id;

  var from = client.feed('user', user_id );
  var to = client.feed('user', to_user_id );

  //User Follow Method
  from.unfollow('user', to_user_id).then(
    function(res) {
      console.log("Success")
    }, // nothing further to do
    function(err) {
      console.log(err)
      console.log("Error")
    }
  );

}

//Function to unfollow user
module.exports.getFollowers = (event, context, callback) => {
  console.log(event);

  var user_id = "lmNFlFtnq0MaPOvtxkJj79vHk4m2";// event.user_id;

  //var from = client.feed('user', user_id );

  let params = {
    user_id: user_id,
    source_feed_slug: 'user',
    target_feed_slug: 'user'
  };

  console.log(params)
  //Get Personalization Feed for Recommended Followers
  client.personalization.get('follow_recommendations', params )
  .then(function(results) { //Success
    
    console.log("========follow_recommendations========");
    //console.log(results);
    if(user_id == "zvrZyrUEqbSJjtq3IDv1uPlOMwh1")
      callback(null, []);
    else
      callback(null, results);

  },function(err) { //Error
    console.log("========follow_recommendations========ERROR======");
    console.log(err.message)
    callback(null, []);
  });


}


