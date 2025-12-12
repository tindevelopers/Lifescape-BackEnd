'use strict';

const AWS = require('aws-sdk');

var firebase = require('firebase');
var firebaseuserob = require('./lib/model/firebase-user.js');

const FIRESTORE_USER_TABLE = "users2"

let config = require('./firebase.config.json'); // The config for the firebase project

if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
    firebase.initializeApp(config);
}

var lambda = new AWS.Lambda({
    region: process.env.AWS_REGIONNAME //change to your region
});

//Function to create User Group
module.exports.createUserGroup = (event, context, callback) => {
  console.log(event);

  let user_id = event.path.user_id;
  let data = event.body;

  if(user_id != "")
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    return new Promise(async (resolve) => {
      let params = await firebaseuserob.getUserDetail(user_id);

      if(params.length == 0)
      {
        return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
      }

      
      let user_groups = (typeof(params.groups) != "undefined" ? params.groups : []) ;    

      let group_name = data.name;
      let group_desc = data.desc;
      let friend_ids = data.friend_ids;

      if(group_name != "")
      {
        let groupname_arr = [];

        user_groups.forEach((item) => {
          groupname_arr.push(Object.keys(item)[0])
        });

        if(groupname_arr.indexOf(group_name) > -1 )
        {
          firebase.app().delete(); 
          return context.fail(JSON.stringify( { statusCode:400, message: "Group Name is already Exist!" } ));
        }else{

          let post_data = {};
          post_data[group_name] = {};

          if(typeof(group_desc) != "undefined")
            post_data[group_name]["description"] = group_desc;

          if(typeof(friend_ids) != "undefined")
            post_data[group_name]["friend_ids"] = friend_ids;
          
          user_groups.push(post_data);
          
          params.groups = user_groups
        }
      }
      console.log(params)

      var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user_id).set(params)
      .then(function() {
          
          firebase.app().delete(); 

          lambda.invoke({
                  FunctionName: 'LifeScape-ES-prod-es_add', 
                  Payload: JSON.stringify(params) // pass params
              }, function(error, data) {
                if (error) {
                    console.log(error);
                    return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                }
                callback(null, JSON.stringify({ message: 'User Group is created successfully!' }));
          });
      })
      .catch(function(error) {
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      });

    });

  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
}


//Function to edit User Group
module.exports.editUserGroup = (event, context, callback) => {
  console.log(event);

  let user_id = event.path.user_id;
  let data = event.body;

  if(user_id != "")
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    return new Promise(async (resolve) => {
      let params = await firebaseuserob.getUserDetail(user_id);

      if(params.length == 0)
      {
        return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
      }

      let user_groups = (typeof(params.groups) != "undefined" ? params.groups : []) ;    

      let group_name = data.name;
      let group_new_name = data.new_name;
      let group_desc = data.desc;
      let friend_ids = data.friend_ids;

      if(group_name != "")
      {
        let groupname_arr = [];

        //Delete the Old Group Element
        let groups_res = [];
        user_groups.forEach((item) => {
            let group_name  = Object.keys(item)[0];

            if(group_name != data.name)
              groups_res.push(item)
        });
        user_groups  = groups_res;
        group_name = group_new_name;

        user_groups.forEach((item) => {
          groupname_arr.push(Object.keys(item)[0])
        });

        if(groupname_arr.indexOf(group_name) > -1 )
        {
          firebase.app().delete(); 
          return context.fail(JSON.stringify( { statusCode:400, message: "Group Name is already Exist!" } ));
        }else{

          let post_data = {};
          post_data[group_name] = {};

          if(typeof(group_desc) != "undefined")
            post_data[group_name]["description"] = group_desc;

          if(typeof(friend_ids) != "undefined")
            post_data[group_name]["friend_ids"] = friend_ids;
          
          user_groups.push(post_data);
          
          params.groups = user_groups
        }
      }
      console.log(params)

      var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user_id).set(params)
      .then(function() {
          
          firebase.app().delete(); 

          lambda.invoke({
                  FunctionName: 'LifeScape-ES-prod-es_add', 
                  Payload: JSON.stringify(params) // pass params
              }, function(error, data) {
                if (error) {
                    console.log(error);
                    return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                }

                callback(null, JSON.stringify({ message: 'User Group is updated successfully!' }));
          });

      })
      .catch(function(error) {
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      });

    });

  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
}


//Function to Delete User Group
module.exports.deleteUserGroup = (event, context, callback) => {
  console.log(event);
  let user_id = event.path.user_id;
  let name = decodeURI(event.path.name);

  console.log(name);

  if(user_id != "" && typeof(name) != "undefined" && name != "")
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    return new Promise(async (resolve) => {
      //Get User Detail
      let params = await firebaseuserob.getUserDetail(user_id);
      console.log(params);

      if(params.length == 0 || typeof(params.groups) == "undefined" )
      {
        firebase.app().delete();
        return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
      }

      let groups = params.groups;

      if(groups.length > 0){

        let groups_res = [];
        groups.forEach((item) => {
            let group_name  = Object.keys(item)[0];

            if(group_name != name)
              groups_res.push(item)
        });
        console.log(groups_res);
        
        if(JSON.stringify(groups_res) == JSON.stringify(groups))
        {
          firebase.app().delete();
          return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
        }

        params.groups = groups_res;
        //console.log(params);

        var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user_id).set(params)
        .then(function() {
            
            firebase.app().delete(); 

            lambda.invoke({
                    FunctionName: 'LifeScape-ES-prod-es_add', 
                    Payload: JSON.stringify(params) // pass params
                }, function(error, data) {
                  if (error) {
                      console.log(error);
                      return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                  }

                  callback(null, JSON.stringify({ message: 'User Group is deleted successfully!' }));

            });

        })
        .catch(function(error) {
            return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
        });

      }  
    });
  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
}


//Function to create User Group
module.exports.getUserGroups = (event, context, callback) => {
  console.log(event);
  let user_id = event.path.user_id;
 
  if(user_id != "")
  {

    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    return new Promise(async (resolve) => {
      //Get User Detail
      let params = await firebaseuserob.getUserDetail(user_id);
      console.log(params)

      if(params.length == 0 || typeof(params.groups) == "undefined" )
      {
        firebase.app().delete();
        return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
      }

      let groups = params.groups;

      if(groups.length > 0){

          //Prepare array for Friend IDs
          var friends_arr = [];

          groups.forEach((item) => {
            let friend_ids = item[Object.keys(item)]['friend_ids'];
            
            if(typeof(friend_ids) != "undefined"){
                friends_arr = friends_arr.concat(friend_ids);

            }
            
          });
          friends_arr = [...new Set(friends_arr)];

          let friends_result_arr = [];
          let cnt = 0;

          //Get the Friend Details
          if(friends_arr.length > 0){

              friends_arr.forEach(async(friend_id) => {
                  //Get Friend Detail
                  let user_detail = await firebaseuserob.getUserDetail(friend_id);
                  cnt++;

                  //if(user_detail.length > 0)
                  {
                    friends_result_arr[friend_id] = user_detail;

                    let groups_res = [];

                    if(friends_arr.length == cnt)
                    {
                      groups.forEach((item, index) => {
                        
                        groups_res[index] = item;

                        let group_name  = Object.keys(item)[0];
                        
                        let friend_ids = item[Object.keys(item)]['friend_ids'];

                        //Overwrite the User Detail to Group Array
                        if(typeof(friend_ids) != "undefined")
                        {
                            //Reset Friend Array of current Group
                            groups_res[index][group_name]['friend_ids'] = []; 

                            //Write Friend Array to current Group
                            friend_ids.forEach((fid)=>{
                              groups_res[index][group_name]['friend_ids'].push(friends_result_arr[fid])
                            });
                        }

                      });
                      firebase.app().delete();
                      return callback(null, JSON.stringify( groups_res ) );
                    }
                  }

              });
          }else{
           firebase.app().delete()
           return callback(null, JSON.stringify( groups ) );
           //return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
          }
    
      }
      else
      {
           firebase.app().delete()
           return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
      }

    });

  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}

//Function to create User Group Friends
module.exports.getUserGroupFriends = (event, context, callback) => {
  //console.log(event);
  let user_id =  event.path.user_id;
  let name    =  decodeURI(event.path.name);

  if(user_id != "")
  {

    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    return new Promise(async (resolve) => {
      //Get User Detail
      let params = await firebaseuserob.getUserDetail(user_id);

      if(params.length == 0 || typeof(params.groups) == "undefined" )
      {
        firebase.app().delete();
        return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
      }

      let groups = params.groups;

      if(groups.length > 0){

          //Prepare array for Friend IDs
          var friends_arr = [];

          groups.forEach((item) => {

            if(Object.keys(item)[0] == name){
                friends_arr = item[Object.keys(item)]['friend_ids'];
            }
            
          });
          friends_arr = [...new Set(friends_arr)];

          let friends_result_arr = [];
          let cnt =0;
          //Get the Friend Details
          if(friends_arr.length > 0){

              friends_arr.forEach(async(friend_id) => {
                  //Get Friend Detail
                  console.log(friend_id)

                  if(typeof(friend_id) == "string")
                  {
                    let user_detail = await firebaseuserob.getUserDetail(friend_id);

                    friends_result_arr.push(user_detail)
                  }
                  cnt++;

                  if(cnt == friends_arr.length)
                  {
                    firebase.app().delete();
                    return callback(null,( friends_result_arr ) );
                  }

              });
          }else{
            firebase.app().delete()
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
          }

      }

    });

  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}

