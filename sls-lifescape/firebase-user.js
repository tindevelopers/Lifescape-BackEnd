'use strict';

var admin = require('firebase-admin');

let firebaseConfig = require('./firebase.config.json'); // The config for the firebase project

const FIRESTORE_USER_TABLE = "users2"

//Intialize the App
var defaultApp = admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
  databaseURL: 'https://tin-app-db.firebaseio.com'
});

// //Function to get User Detail by User ID
// module.exports.getUserDetail = (event, context, callback) => {

//   var user_id = event["path"]["user_id"];

//   //Check if User ID is valid
//   if(user_id != "")
//   {
//     //Initialize the FireStore
//     var db = admin.firestore();

//     var userRef = db.collection(FIRESTORE_USER_TABLE).doc(user_id);
//     var getDoc = userRef.get()
//       .then(doc => {
//         if (!doc.exists) {
//             return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
//         } else {
//           callback(null, JSON.stringify(doc.data()));
//         }
//       })
//     .catch(err => {
//         return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
//     });
//   }else
//   {
//     //Return Not Found Error
//     return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
//   }

// }

// //Function to add User Detail by User ID
// module.exports.signupWithFB = (event, context, callback) => {

//   console.log(event)
  
//   var data = event.body;

//   let email = data.email
//   //let password = data.password
//   let displayName = data.name
//   //let redirect_url = data.redirect_url

//   if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
//       firebase.initializeApp(config);
//   }
  
//   //Call Method to create User in Firebase
//   //firebase.auth().createUserWithEmailAndPassword(email, password).then(function(userRecord) 
//   {

//     let user = firebase.auth().currentUser;
    
//     if(user){      

//         //Update the FireStore Database        
//         var db = firebase.firestore();

//         var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user.uid).set({
//           "user_id": user.uid,
//           "email": email,
//           "displayName": displayName,
//           "created_datetime": Date.now()
//         })
//         .then(function() {
//             console.log("Inserted into DB")
//             firebase.app().delete(); 
//         })
//         .catch(function(error) {
//             return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
//         });

//         //Send the Verification Email to User
//         var actionCodeSettings = {
//           url: redirect_url,
//           // iOS: {
//           //   bundleId: 'com.example.ios'
//           // },
//           // android: {
//           //   packageName: 'com.example.android',
//           //   installApp: true,
//           //   minimumVersion: '12'
//           // },
//           // handleCodeInApp: true,
//           // // When multiple custom dynamic link domains are defined, specify which
//           // // one to use.
//           // dynamicLinkDomain: "example.page.link"
//         };

//         //Send the Verification Email
//         //user.sendEmailVerification(actionCodeSettings).then(function() {

//           console.log("Verification Email is Sent");

//           //Invoke Lambda to add data to Elastic Search
//           lambda.invoke({
//                 FunctionName: 'LifeScape-ES-prod-es_add', 
//                 Payload: JSON.stringify({
//                   'user_id': user.uid,
//                   'email' : email,
//                   'displayName' : displayName
//                 }) // pass params
//             }, function(error, data) {
//               if (error) {
//                   console.log(error);
//                   return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
//               }

//               const response = {
//                 message: 'User is created successfully. Please check your inbox to verify your email address!',
//                 body: { user_id: user.uid }
//               };

//               callback(null, JSON.stringify(response));
//           });

//         // }).catch(function(error) {
//         //   // An error happened.
//         //   console.log(error)
//         //   return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
//         // });
//     }

//   //})
//   /*
//   .catch(function(error) {
//     //resolve(error)
//     console.log("Error creating new user:", error);
//     //admin.app().delete();
//     return context.fail(JSON.stringify(
//         {
//           statusCode:400,
//           message: error.message
//         }
//     ));

//   });*/

// }

/*
//Function to add User Detail by User ID
module.exports.signup = (event, context, callback) => {

  console.log(event)
  var data = event.body;

  let email = data.email
  let password = data.password
  let displayName = data.name

  if(defaultApp.isDeleted_)
  {
    defaultApp = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      databaseURL: 'https://tin-app-db.firebaseio.com'
    });
  }

  if(!defaultApp.isDeleted_)
  {  
    var res = admin.auth().createUser({
      displayName: displayName,
      email: email,
      password: password,
      emailVerified: false,
      disabled: true
    })
    .then(function(userRecord) {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log("Successfully created new user:", userRecord.uid);

      const response = {
        message: 'User created successfully!',
        body: { user_id: userRecord.uid }
      };
      admin.app().delete();

      callback(null, JSON.stringify(response));
      return 1
    })
    .catch(function(error) {
      //resolve(error)
      console.log("Error creating new user:", error);
      admin.app().delete();
      return context.fail(JSON.stringify({message:"server_error"}));
    });
  }else
    return context.fail(JSON.stringify({message:"server_error"}));
}*/


// module.exports.changePassword = (event, context, callback) => {
//     console.log(event);
//     let uid = event.path.user_id;
    
//     admin.auth().getUser(uid)
//     .then(function(userRecord) {
//       // See the UserRecord reference doc for the contents of userRecord.
//       console.log('Successfully fetched user data:', userRecord.toJSON());
//     })
//     .catch(function(error) {
//       console.log('Error fetching user data:', error);
//     });
//     return 1;
//     admin.auth().updateUser(uid, {
//       // email: 'modifiedUser@example.com',
//       // phoneNumber: '+11234567890',
//       // emailVerified: true,
//       password: 'test1234',
//     //  displayName: 'Jane Doe',
//       // photoURL: 'http://www.example.com/12345678/photo.png',
//       // disabled: true
//     })
//       .then(function(userRecord) {
//         // See the UserRecord reference doc for the contents of userRecord.
//         console.log('Successfully updated user', userRecord.toJSON());
//       })
//       .catch(function(error) {
//         console.log('Error updating user:', error);
//       });
//   return 1;
    


//       // admin.auth().verifyIdToken(idToken)
//       // .then(function(decodedToken) {
//       //   console.log("Logged IN>>>")
//       //   var user = admin.auth().currentUser;
//       //   console.log(user)

//       //   return 1;
//       // });

// // admin.auth().createCustomToken("1xYy4qJmjnU6HV1dPOYj38uH0l13")
// //   .then(function(token) {
// //     console.log(token)

// //     admin.auth().signInWithCustomToken(token)
// //     .then(function(res) {
// //       console.log(res)
// //     })
// //     .catch(function(error) {
// //       // Handle Errors here.
// //       var errorCode = error.code;
// //       var errorMessage = error.message;
// //       // ...
// //     });
// //     // Send token back to client
// //     console.log("donee")
// //   })
// //   .catch(function(error) {
// //     console.log('Error creating custom token:', error);
// //   });
// // return 1

// }
/*
//Function to get User Friends by User ID
module.exports.getUserFriendList = (event, context, callback) => {

  var user_id = event["path"]["user_id"];

  //Check if User ID is valid
  if(user_id != "")
  {
    //Initialize the FireStore
    var db = admin.firestore();

    let friends_arr = [];
    let friends_result_arr = {};
    let cnt = 0;

    return new Promise(async (resolve) => {
      let friendIDs = await getUserFriendIDs(user_id);

      friendIDs.forEach(function(item){
          friends_arr.push(item.data().friend_id) 
      })      

      if(friends_arr.length > 0){

          friends_arr.forEach(async(friend_id) => {

              let user_detail = await getUserDetail(friend_id);
              //console.log(user_detail.exists)
              if (user_detail.exists) 
              {
                friends_result_arr[friend_id] = user_detail.data()   
              } 

              cnt++;

              if(friends_arr.length == cnt)
              {
                callback(null, JSON.stringify( friends_result_arr) );
              }

          });
      }else{
        return context.fail(JSON.stringify({message:"not_found"}));
      }

    })

  }

}

//Internal Function to get User Detail by ID
function getUserDetail(user_id)
{
  if(user_id != "")
  {
    //Initialize the FireStore
    var db = admin.firestore();
    return new Promise((resolve) => {
      var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user_id).get();
      resolve(getDoc)
    })

  }  
}

//Internal Function to get User Friend IDs
function getUserFriendIDs(user_id)
{
  if(user_id != "")
  {
    //Initialize the FireStore
    var db = admin.firestore();
    return new Promise((resolve) => {
      var getDoc = db.collection("user_friends").where("user_id", "==", user_id).get();
      resolve(getDoc)
    })

  }  
}
*/

