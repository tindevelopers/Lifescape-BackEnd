'use strict';

const AWS = require('aws-sdk');

var firebase = require('firebase');
var firebaseuserob = require('./lib/model/firebase-user.js');
var activitylog = require('./lib/model/activitylog.js');
var threadob = require('./lib/model/thread.js');
var snsob = require('./lib/model/sns.js');

const FIRESTORE_USER_TABLE = "users2"

let config = require('./firebase.config.json'); // The config for the firebase project

if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
    firebase.initializeApp(config);
}

var lambda = new AWS.Lambda({
    region: process.env.AWS_REGIONNAME //change to your region
});

//Function to add User Detail by User ID
module.exports.signup = (event, context, callback) => {

  console.log(event)
  
  var data = event.body;

  let email = data.email
  let password = data.password
  let displayName = data.name
  let redirect_url = data.redirect_url

  if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
  }
  
  //Call Method to create User in Firebase
  firebase.auth().createUserWithEmailAndPassword(email, password).then(function(userRecord) {

    let user = firebase.auth().currentUser;
    
    if(user){      

        //Update the profile name
        user.updateProfile({
          displayName: displayName,
          emailVerified: false,
          disabled: true
        });
        
        //Update the FireStore Database        
        var db = firebase.firestore();

        var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user.uid).set({
          "user_id": user.uid,
          "email": email,
          "displayName": displayName,
          "created_datetime": Date.now(),
          "moment_counter": 0
        })
        .then(function() {
            console.log("Inserted into DB")
            firebase.app().delete(); 
        })
        .catch(function(error) {
            return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
        });

        //create default thread
        var threaddata = {
          "user_id": user.uid,
          "thread_name": process.env.DEFAULT_CHANNEL,
        }
        var id = threadob.savedata(threaddata)

        //Send the Verification Email to User
        var actionCodeSettings = {
          url: redirect_url,
        };

        //Send the Verification Email
        user.sendEmailVerification(actionCodeSettings).then(function() {

          console.log("Verification Email is Sent");

          //Invoke Lambda to add data to Elastic Search
          lambda.invoke({
                FunctionName: 'LifeScape-ES-prod-es_add', 
                Payload: JSON.stringify({
                  'user_id': user.uid,
                  'email' : email,
                  'displayName' : displayName
                }) // pass params
            }, function(error, data) {
              if (error) {
                  console.log(error);
                  return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
              }

              const response = {
                message: 'User is created successfully. Please check your inbox to verify your email address!',
                body: { user_id: user.uid }
              };

              callback(null, JSON.stringify(response));
          });

        }).catch(function(error) {
          // An error happened.
          console.log(error)
          return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
        });
    }

  })
  .catch(function(error) {

    console.log("Error creating new user:", error);
    //admin.app().delete();
    return context.fail(JSON.stringify(
        {
          statusCode:400,
          message: error.message
        }
    ));

  });

}

//Function to reset forgot password
module.exports.resetPassword = (event, context, callback) => {

  console.log(event)
  
  var email = event.body.email;

  if(email != "undefined" && email != "" )
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
        firebase.initializeApp(config);
    }

    var auth = firebase.auth();

    auth.sendPasswordResetEmail(email)
    .then(function() {
        console.log("Reset password mail is sent");
        firebase.app().delete(); 
        callback(null, JSON.stringify({message: "Email with reset password link is sent successfully!"}))  
    })
    .catch(function(error) {
        console.log(error);
        firebase.app().delete(); 
        return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
    });

  }
  else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
}

//Function to add User Detail by User ID
module.exports.login = (event, context, callback) => {

  console.log(event)
  
  var data = event.body;

  let email =  data.email
  let password = data.password

  if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
  }

  //Call Signin method With the Email ID and Password
  firebase.auth().signInWithEmailAndPassword(email, password).then(async function(userRecord) {
    // See the UserRecord reference doc for the contents of userRecord
    let user = firebase.auth().currentUser;

    if(user){

        //if(user.emailVerified){
        if(1){
          //Call Method to get ID Token
          //user.getIdToken(true).then(async function(data) {
          user.getIdToken(true).then(async function(data) {

            let user_detail = await firebaseuserob.getUserDetail(user.uid);

            user_detail.idToken = data

            firebase.app().delete();

            callback(null, JSON.stringify(user_detail));

          });
      }else
      {
        firebase.app().delete();
        return context.fail(JSON.stringify( { statusCode:401, message: "Email ID is not verified yet." } ));
      }

    }

  })
  .catch(function(error) {
    firebase.app().delete();
    console.log("Error in login user:", error);
    return context.fail(JSON.stringify( { statusCode:401, message: error.message } ));

  });

}

//Function to modify User Detail by User ID
module.exports.sendFriendRequest = (event, context, callback) => {
  console.log(event)

  var user_id = event.path.user_id;
  var to_user_id = event.path.to_user_id;
  
  if(user_id != "" && to_user_id != "")//Check for the blank value
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
        firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

      //Check data for the old request
      var getDoc = db.collection("user_friend_requests").where("user_id", "==", user_id).where("to_user_id", "==", to_user_id).where("status", "==", "pending").get()
      .then(function(result){

          let request_sent = 0;

          result.forEach(function(item){
            request_sent = Object.keys(item.data()).length;
          }) ;
          
          if(request_sent == 0){//Check if Request is not sent before


            let getDoc1 = db.collection("user_friend_requests").where("to_user_id", "==", user_id).where("user_id", "==", to_user_id).where("status", "==", "pending").get()
              .then(function(result){

                let request_sent = 0;

                result.forEach(function(item){
                  request_sent = Object.keys(item.data()).length;
                }) ;

                if(request_sent == 0){
              
                  var getDoc = db.collection("user_friend_requests").doc().set({
                    "user_id": user_id,
                    "to_user_id": to_user_id,
                    "status": "pending"
                  })
                  .then(async function() {
                      console.log("Inserted into DB")
    //                  firebase.app().delete(); 

                      //Store Activity Log
                      var user_detail = await firebaseuserob.getUserDetail(user_id);
                      firebaseuserob.firebasedelete();

                      activitylog.store(to_user_id, {
                                  actor: to_user_id,
                                  verb: 'friendrequest_send',
                                  object: 'friendrequest:'+user_id,
                                  event: { 
                                      'profile_picture' : user_detail.profile_picture,
                                      'displayName' : user_detail.displayName, 
                                  },
                                  foreign_id: 'friendrequest:'+user_id,
                                  message: "<a href='/user/profile/"+ user_id +"'>"+ user_detail.displayName +"</a> sent you a friend request.",
                                  time: Date.now()
                              });
                      //Store Activity Log

                      callback(null, JSON.stringify({message: "Request sent successfully!"}))  
                  })
                  .catch(function(error) {
                      return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
                  });
                }
                else{
                    callback(null, JSON.stringify({message: "Request is already sent!"}))        
                    firebase.app().delete(); 
                }
              });
          }else{
              callback(null, JSON.stringify({message: "Request is already sent!"}))        
              firebase.app().delete(); 
          }

      }).catch(function(error) {
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      });
  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}

//Function to modify User Detail by User ID
module.exports.getUserFriendStatus = (event, context, callback) => {
  console.log(event)

  var user_id = event.path.user_id;
  var to_user_id = event.path.to_user_id;
  
  if(user_id != "" && to_user_id != "")//Check for the blank value
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
        firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    return new Promise(async (resolve) => {
      let friendstatus = await firebaseuserob.getUserFriendManageStatus(user_id, to_user_id);
      firebase.app().delete();
      callback(null, JSON.stringify(friendstatus));
            
    })
    .catch(function(error) {
      return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
    });

  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}


//Function to Cancel/Accept/Deny Friendship Request by User ID
module.exports.actOnFriendRequest = (event, context, callback) => {
  console.log(event)
  var action = event.path.action;
  if(action == "accept" || action == "deny")
  {
   var user_id = event.path.to_user_id;
   var to_user_id = event.path.user_id;
  }else
  {
    var user_id = event.path.user_id;
    var to_user_id = event.path.to_user_id;    
  }
  console.log("user_id=="+user_id)
  console.log("to_user_id=="+to_user_id)
  
  if(user_id != "" && to_user_id != "")//Check for the blank value
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
        firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    //Check data for the old request
    var getDoc = db.collection("user_friend_requests")
                    .where("user_id", "==", user_id)
                    .where("to_user_id", "==", to_user_id)
                    .where("status", "==", "pending")
                    .get()
    .then(function(result){
          
          
          let requestID = 0 ;
          result.forEach(function(item){
            requestID = item.id
          }) ;
          
          console.log("first requestID==" + requestID);

          if(requestID){//Check if Request is sent before

              if(action == "cancel" ){
                //Delete the Request
                console.log("Deleting..."+requestID)
                let getDoc = db.collection("user_friend_requests").doc(requestID).delete()
                .then(function() {
                    console.log("Document successfully deleted!");
                    firebase.app().delete(); 
                    callback(null, JSON.stringify({message: "Request is cancelled successfully!"}))  
                })
              }
              else if(action == "deny" )
              {
                //Delete the Request
                console.log("Deleting..."+requestID)
                let getDoc = db.collection("user_friend_requests").doc(requestID).delete()
                .then(async function() 
                {
                    console.log("Document successfully deleted!");
                    
                    var user_detail = await firebaseuserob.getUserDetail(to_user_id);

                    activitylog.store(user_id, {
                                actor: user_id,
                                verb: 'friendrequest_deny',
                                object: 'friendrequest_deny:'+user_id,
                                event: { 
                                    'profile_picture' : user_detail.profile_picture,
                                    'displayName' : user_detail.displayName, 
                                },
                                foreign_id: 'friendrequest_deny:'+user_id,
                                message: "<a href='/user/profile/"+ to_user_id +"'>"+ user_detail.displayName +"</a> has denied your friend request.",
                                time: Date.now()
                            });

                    firebase.app().delete(); 
                    callback(null, JSON.stringify({message: "Request denied successfully!"}))  
                })
              }else if(action == "accept")
              {
                //Update the status in table
                let getDoc = db.collection("user_friend_requests").doc(requestID).set({
                  "user_id": user_id,
                  "to_user_id": to_user_id,
                  "status": "accepted" 
                })
                .then(async function() {
                    //if accepted then add user as a friend in user_friends table
                    if(action == "accept")
                    {

                      console.log("Inserting into user_friends table")
                      let getDoc = db.collection("user_friends").doc().set({
                        "user_id": user_id,
                        "friend_id": to_user_id,
                        "created_datetime": Date.now()
                      })
                      //firebase.app().delete(); 

                      //Store Activity Log
                      var user_detail = await firebaseuserob.getUserDetail(to_user_id);
                      firebaseuserob.firebasedelete();

                      activitylog.store(user_id, {
                                  actor: user_id,
                                  verb: 'friendrequest_accept',
                                  object: 'friendrequest_accept:'+user_id,
                                  event: { 
                                      'profile_picture' : user_detail.profile_picture,
                                      'displayName' : user_detail.displayName, 
                                  },
                                  foreign_id: 'friendrequest_accept:'+user_id,
                                  message: "<a href='/user/profile/"+ to_user_id +"'>"+ user_detail.displayName +"</a> has accepted your friend request.",
                                  time: Date.now()
                              });
                      //Store Activity Log

                      //Invoke User Follow Event
                      lambda.invoke({
                          FunctionName: 'LifeScape-getStream-prod-user_follow', 
                          InvocationType: "Event", 
                          Payload: JSON.stringify(event.path) // pass params
                        }, function(error, data) {
                          if (error) {
                              console.log(error);
                              return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                          }
                      });


                      callback(null, JSON.stringify({message: "Request accepted successfully!"}))  
                    }

                });
              }

          }else{
              firebase.app().delete(); 
              return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
          }

    })
    .catch(function(error) {
        firebase.app().delete(); 
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
    });
  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}

//Function to modify User Detail by User ID
module.exports.listRequests = (event, context, callback) => {
  console.log(event)

  var user_id = event.path.user_id;
  var type = event.path.type;
  
  if(user_id != "")//Check for the blank value
  {
    //Initialize the FireStore
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
        firebase.initializeApp(config);
    }

    var db = firebase.firestore();

      var compare_column = (type == "received") ? "to_user_id" : "user_id" ;
      //Check data for the old request
      var getDoc = db.collection("user_friend_requests")
                .where(compare_column, "==", user_id)
                .where("status", "==", "pending")
                .get()

      .then(function(result){

          let friends_arr = [];
          let cnt = 0;

          result.forEach(function(item){
            friends_arr.push(item.data())
          }) ;

          if(friends_arr.length > 0){

            let friends_result_arr = []

            friends_arr.forEach(async(item) => {
            
                compare_column = (type == "received") ? "user_id" : "to_user_id" ;

                let user_detail = await firebaseuserob.getUserDetail(item[compare_column]);
                friends_result_arr.push(user_detail)
                
                cnt++;
  
                if(friends_arr.length == cnt)
                {
                  firebase.app().delete(); 
                  callback(null, JSON.stringify( friends_result_arr) );
                }

            });
          }else{
            firebase.app().delete(); 
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
          }

      }).catch(function(error) {
          firebase.app().delete(); 
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      });
  }

}


//Function to get User Detail by User ID
module.exports.getUserDetail = (event, context, callback) => {

  var user_id = event["path"]["user_id"];

  //Check if User ID is valid
  if(user_id != "")
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    return new Promise(async (resolve) => {

      let user_detail = await firebaseuserob.getUserDetail(user_id);

      firebase.app().delete(); 

      if (user_detail.length == 0) {
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
        } else {
          callback(null, JSON.stringify(user_detail));
      }

    });
  }else
  {
    //Return Not Found Error
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
  }

}


//Function to modify User Detail by User ID
module.exports.editProfile = (event, context, callback) => {
  console.log(event);

  var user_id = event.path.user_id;
  var data = event.body;  

  if(user_id && user_id != "" && event.principalId ==  user_id)
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    return new Promise(async (resolve) => {
      let params = await firebaseuserob.getUserDetail(user_id);

      if(params.email != data.email && typeof(data) != "undefined" && typeof(data.email) != "undefined" )
      {
        let res = await firebaseuserob.checkEmailExist(user_id, data.email);

        if(res)
        {
          firebase.app().delete(); 
          return context.fail(JSON.stringify( { statusCode:400, message: "Email ID already existed" } ));
        }
        params.email = data.email
      }

      if(typeof(data) != "undefined" && typeof(data.name) != "undefined" )
          params.displayName = data.name

      if(typeof(data) != "undefined" && typeof(data.spoken_lang) != "undefined" )
          params.spoken_lang = data.spoken_lang

      if(typeof(data) != "undefined" && typeof(data.latitude) != "undefined" )
          params.latitude = data.latitude

      if(typeof(data) != "undefined" && typeof(data.longitude) != "undefined") 
          params.longitude = data.longitude

      if(typeof(data) != "undefined" && typeof(data.location) != "undefined") 
          params.location = data.location

      if(typeof(data) != "undefined" && typeof(data.about_text) != "undefined") 
          params.about_text = data.about_text

      // if(typeof(data) != "undefined" && typeof(data.mobile_no) != "undefined") 
      //     params.mobile_no = data.mobile_no

      // if(typeof(data) != "undefined" && typeof(data.landline_no) != "undefined") 
      //     params.landline_no = data.landline_no

      if(typeof(data) != "undefined" && typeof(data.gender) != "undefined") 
          params.gender = data.gender

      if(typeof(data) != "undefined" && typeof(data.social_profiles) != "undefined") 
          params.social_profiles = data.social_profiles

      if(typeof(data) != "undefined" && typeof(data.profile_picture) != "undefined") 
          params.profile_picture = data.profile_picture

      if(typeof(data) != "undefined" && typeof(data.oneall_user_token) != "undefined") 
          params.oneall_user_token = data.oneall_user_token
      

      var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user_id).set(params)
      .then(function() {
          
          firebase.app().delete(); 

          if(params.profile_picture != "" || params.displayName != "" )
          {
              lambda.invoke({
                      FunctionName: 'LifeScape-prod-updateUserDatatoMoments', 
                      InvocationType: "Event", 
                      Payload: JSON.stringify(params) // pass params
                  }, function(error, data) {
                    if (error) {
                        console.log(error);
                        return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                    }
              });
          }

          lambda.invoke({
                  FunctionName: 'LifeScape-ES-prod-es_add', 
                  InvocationType: "Event", 
                  Payload: JSON.stringify(params) // pass params
              }, function(error, data) {
                if (error) {
                    console.log(error);
                    return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                }

          });

          callback(null, JSON.stringify({ message: 'User Data updated successfully!' }));

      })
      .catch(function(error) {
          firebase.app().delete(); 
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      });

    });

  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}


//Function to register Device ID
module.exports.registerDeviceID = (event, context, callback) => {

  console.log(event);

  var user_id =  event.path.user_id;
  var data = event.body;  

  //let res = snsob.sendSNSpushNotification(data.device_id);
  //return 1;
  if(user_id && user_id != "")
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    return new Promise(async (resolve) => {

      let user_res = await firebaseuserob.checkDeviceIDExist(data.device_id);
      if(user_res && user_res.user_id != user_id && user_res.devices)//Remove token from Existing User
      {
          let device_index = user_res.devices["ios"].indexOf(data.device_id)
          user_res.devices["ios"].splice(device_index, 1)
          console.log(user_res.devices["ios"])
          
          db.collection(FIRESTORE_USER_TABLE).doc(user_res.user_id).set(user_res)
          .then(async function() {
              //let res = await snsob.saveSNSDeviceToken(data.device_id);

              lambda.invoke({
                      FunctionName: 'LifeScape-ES-prod-es_add', 
                      InvocationType: "Event", 
                      Payload: JSON.stringify(user_res) // pass params
                  }, function(error, data) {
                    if (error) {
                        console.log(error);
                        return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                    }

              });

              console.log("Exisitng user device detail updated.")

          })

          // user_res.devices["ios"].forEach(function(item){

          // });
      }
      
      let params = await firebaseuserob.getUserDetail(user_id);
      //console.log(params);

      if(data.device_id && data.device_id != "") 
      {
        let temp = {};
        if(params.devices && params.devices != "")
          temp = params.devices;

        if(!temp[data.device_type])
          temp[data.device_type] = [];
        
        temp[data.device_type].push(data.device_id);
        temp[data.device_type] = [...new Set(temp[data.device_type])]; 

        //console.log(temp)
        params.devices = temp
        //params.device_id = data.device_id
      }
      //console.log(params)

      var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user_id).set(params)
      .then(async function() {
          
          //let res = await snsob.saveSNSDeviceToken(data.device_id);

          firebase.app().delete(); 

          lambda.invoke({
                  FunctionName: 'LifeScape-ES-prod-es_add', 
                  InvocationType: "Event", 
                  Payload: JSON.stringify(params) // pass params
              }, function(error, data) {
                if (error) {
                    console.log(error);
                    return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                }

          });

          callback(null, JSON.stringify({ message: 'User Devices updated successfully!' }));

      })
      .catch(function(error) {
          firebase.app().delete(); 
          return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      });

    });

  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}


//Function to modify User Password by User ID
module.exports.changePassword = (event, context, callback) => {
  //  console.log(event);
  console.log(event);
  let email = event.body.email ; 
  let password = event.body.old_password ; 
  let new_password = event.body.new_password ; 

  if(email != "" && password != "" && new_password != "")
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function(userRecord) {

        // See the UserRecord reference doc for the contents of userRecord
        let user = firebase.auth().currentUser;

        if(user){     

          user.updatePassword(new_password).then(function() {
            // Update successful.
            firebase.app().delete(); 
            callback(null, JSON.stringify({ message: 'Password is updated successfully!' }));
          }).catch(function(error) {
            // An error happened.
            firebase.app().delete(); 
            return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
          });


        }

    })
    .catch(function(error) {    
        firebase.app().delete(); 
        return context.fail(JSON.stringify( { statusCode:401, message: error.message } ));
    });
  }


}


//Function to get User Friends by User ID
module.exports.getUserFriendList = (event, context, callback) => {
  console.log(event)
  var user_id = event["path"]["user_id"];

  //Check if User ID is valid
  if(user_id != "")
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    let friends_arr = [];
    let friends_result_arr = [];
    let cnt = 0;

    return new Promise(async (resolve) => {
      let friends_arr = await firebaseuserob.getUserFriendIDs(user_id);
      //console.log(friends_arr)
      //firebase.app().delete(); 

      if(friends_arr.length > 0){

          for (let index = 0; index < friends_arr.length; index++) {
              let friend_id = friends_arr[index];
              
              let user_detail = await firebaseuserob.getUserDetail(friend_id);
              if(user_detail.length != 0)
                friends_result_arr.push(user_detail)
          }
          firebase.app().delete()
          callback(null, JSON.stringify( friends_result_arr) );

      }else{
        firebase.app().delete()
        return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
      }

    })

  }

}


//Function to get User Friends by User ID
module.exports.unFriendUser = (event, context, callback) => {

  var user_id =   event["path"]["user_id"];
  var friend_id = event["path"]["to_user_id"];

  //Check if User ID is valid
  if(user_id != "" && friend_id != "")
  {
    if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
      firebase.initializeApp(config);
    }

    //Initialize the FireStore
    var db = firebase.firestore();

    return new Promise(async (resolve) => {

        let res = await firebaseuserob.deleteUserFriend(user_id, friend_id);

        firebase.app().delete();

        if(res)
        {
          //Invoke User Follow Event
          lambda.invoke({
              FunctionName: 'LifeScape-getStream-prod-user_unfollow', 
              InvocationType: "Event", 
              Payload: JSON.stringify(event.path) // pass params
            }, function(error, data) {
              if (error) {
                  console.log(error);
                  return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
              }
          });
        
          callback(null, JSON.stringify( { message: "User is successfully deleted from friend list!"}) );
        }
        else
          callback(null, JSON.stringify( { message: "User is not in your friend list!"}) );

    })

  }else
    return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));


}

//Function to get User Friends by User ID
module.exports.getUserSuggestedFriends = (event, context, callback) => {
  console.log(event)

  if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
    firebase.initializeApp(config);
  }

  //Initialize the FireStore
  var db = firebase.firestore();

  let user_id = event.path.user_id;
  let friends_result_arr = [];
  let cnt = 0;

  return new Promise(async (resolve) => {

        //Invoke User Follow Event
        lambda.invoke({
            FunctionName: 'LifeScape-getStream-prod-getFollowers', 
            //InvocationType: "Event", 
            Payload: JSON.stringify(event.path) // pass params
          }, function(error, data) {
            if (error) {
                console.log(error);
                return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
            }
            let res = JSON.parse(data.Payload);
            //console.log(res);

            if(Object.keys(res).length > 0){

              let friends_arr = res.results
                

                if(friends_arr.length > 0){

                  friends_arr.forEach(async (item) => {
                      if(item.foreign_id == user_id){
                        cnt++;
                        return 1;
                      }
                      //Get User Detail
                      let user_detail = await firebaseuserob.getUserDetail(item.foreign_id);
                      let friendstatus = await firebaseuserob.getUserFriendManageStatus(user_id, item.foreign_id);

                      user_detail.friendrequest = friendstatus.status ;

                      if(user_detail.length != 0 && user_detail.friendrequest == 0)
                        friends_result_arr.push(user_detail)
                       
                      cnt++;

                      if(friends_arr.length == cnt)
                      {
                        firebase.app().delete()
                        
                        if(friends_result_arr.length > 0)
                        {
                          callback(null, JSON.stringify(friends_result_arr) );  
                        }  
                        else
                          return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
                      }

                    });
                }else{
                  firebase.app().delete()
                  return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
                }
            }else{
                  firebase.app().delete()
                  return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
            }
        });
    });        
}



module.exports.getNotifications = (event, context, callback) => {
  console.log(event)

  if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
    firebase.initializeApp(config);
  }

  //Initialize the FireStore
  var db = firebase.firestore();

  let friends_result_arr = [];
  let cnt = 0;

  return new Promise(async (resolve) => {
        //Invoke User Follow Event
        lambda.invoke({
            FunctionName: 'LifeScape-getStream-prod-getNotifications', 
            //InvocationType: "Event", 
            Payload: JSON.stringify(event.path) // pass params
          }, function(error, data) {
            if (error) {
                console.log(error);
                return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
            }

            let res = JSON.parse(data.Payload);
            console.log(res)
            return 1;
            if(Object.keys(res).length > 0){

              let friends_arr = res.results
              
                if(friends_arr.length > 0){

                  friends_arr.forEach(async (item) => {

                      //Get User Detail
                      let user_detail = await firebaseuserob.getUserDetail(item.foreign_id);
                      if(user_detail.length != 0)
                        friends_result_arr.push(user_detail)
                       
                      cnt++;

                      if(friends_arr.length == cnt)
                      {
                        firebase.app().delete()
                        callback(null, JSON.stringify( friends_result_arr) );
                      }

                    });
                }else{
                  firebase.app().delete()
                  return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
                }
            }else{
                  firebase.app().delete()
                  return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
            }
        });
    });        
}


//Function to get User Detail by User ID
module.exports.storeToES = (event, context, callback) => {
//console.log("storeToES")
  //Check if User ID is valid
      if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
          firebase.initializeApp(config);
      }

        //Initialize the FireStore
        var db = firebase.firestore();

        return new Promise( (resolve) => {
          console.log("Getting user data")
          var getDoc = db.collection(FIRESTORE_USER_TABLE).get()
          .then(function(querySnapshot) {
            console.log("query result")
            let i =0 ;
              querySnapshot.forEach(function(doc) {
                i++;

                //if(doc.id == "lmNFlFtnq0MaPOvtxkJj79vHk4m2")
                {
                  // doc.data() is never undefined for query doc snapshots
                  console.log("=======================================")
                  console.log(doc.id, " => ", doc.data());

                  let payload = {}
                  payload.user_id = doc.data().user_id
                  payload.email = doc.data().email
                  payload.displayName = doc.data().displayName
                  payload.profile_picture = doc.data().profile_picture
                  //payload. = doc.data().displayName
                  
                  //Invoke Lambda to add data to Elastic Search
                  lambda.invoke({
                        FunctionName: 'LifeScape-ES-prod-es_add', 
                        Payload: JSON.stringify(payload) 
                    }, function(error, data) {
                      if (error) {
                          console.log(error);
                          return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                      }

                  });

                }


              });
          })
          .catch(function(error) {
              console.log("Error getting documents: ", error);
          });


        })

    

}
