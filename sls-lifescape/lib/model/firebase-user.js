
'use strict';

const AWS = require('aws-sdk');

var firebase = require('firebase');

var momentob = require('./moment.js');

const FIRESTORE_USER_TABLE = "users2"

let config = require('./../../firebase.config.json'); // The config for the firebase project

if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
    firebase.initializeApp(config);
}

var lambda = new AWS.Lambda({
    region: process.env.AWS_REGIONNAME //change to your region
});

//var otherDatabase = admin.database();


module.exports = 
{
  	//Function to update the Moment Tags
  	searchUsers: function(keyword){

	    if(keyword != "")
	    {
	    	return new Promise(function(resolve, reject){

		    	lambda.invoke({
	                FunctionName: 'LifeScape-ES-prod-es_search', 
	                Payload: JSON.stringify({ 'keyword': keyword }) // pass params
		        }, function(error, data) {
		              if (error) {
		                  console.log(error);
		                  resolve([])
		              }else{
						  resolve(JSON.parse(data.Payload))
	              	  }
		        });

		    });

	    	
	    }
	},


	getUserDetail: function(user_id, momentcount = 0){

	    if(user_id != "")
	    {
	    	if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
			    firebase.initializeApp(config);
			}

		    //Initialize the FireStore
		    var db = firebase.firestore();

		    return new Promise( (resolve) => {
		      var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user_id).get()
			  .then(async function(doc)  {
		        if (!doc.exists) {
		            resolve([])
		        } else {
		        	//console.log(doc.data())

		        	let res = doc.data();
			       	res.user_id = user_id 	

		        	if(momentcount)
		        	{
			        	//Fetch the Count for Moments by UserID
			        	let ProjectionExpression = "datalineobject_id";
			        	let moment_data = await momentob.getUserMomentList(user_id, ProjectionExpression);
			        	//console.log(moment_data.length)

			        	//Prepare the return result
			       		res.moment_counter = moment_data.length
			       	}
		          	resolve(res)
		        }
		      })


		    })
		}
	},

	//Function to check email id exist or not
	checkEmailExist: function(user_id, email){

	    if(user_id && email)
	    {
	    	if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
			    firebase.initializeApp(config);
			}

		    //Initialize the FireStore
		    var db = firebase.firestore();
		    console.log("QUERYING to Check Duplicate..")
			return new Promise((resolve) => {
		    		var getDoc = db.collection(FIRESTORE_USER_TABLE)
		    					//.where("user_id", "<>", user_id)
		    					.where("email", "==", email)
		    					.get()

					.then(function(querySnapshot) {
						let cnt = 0;
				        querySnapshot.forEach(function(doc) {
				            //console.log(doc.id, " => ", doc.data());
				            if(doc.id != user_id)
				            {
				            	resolve(1)
				            }else 
				            	resolve(0)
				        });
				        if(cnt == 0) resolve(0)
				    })
		      	
				    .catch(function(error) {
				        console.log("Error getting documents: ", error);
				    });
		    });

		}else
			resolve(0)
	},

	//Internal Function to get User Friend IDs
	getUserFriendManageStatus: function(user_id, to_user_id)
	{
		if(user_id && to_user_id)
		{
			return new Promise(async (resolve) => {

				let userfriends = await module.exports.getUserFriendIDs(user_id);

				if(userfriends.indexOf(to_user_id) > -1)
					resolve({ status: 1, message: "Request is accepted successfully!"})

				let friendstatus = await module.exports.getUserFriendStatus(user_id, to_user_id);

				if(friendstatus == "pending")
					friendstatus = { status: 3, message: "Request is already sent!"}

				if(friendstatus == "")
				{
					friendstatus = await module.exports.getUserFriendStatus(to_user_id, user_id);

					if(friendstatus == "pending")
						friendstatus = { status: 2, message: "Request is received!"}
				}

				if(friendstatus == "")
					friendstatus = { status: 0, message: "Request is not sent yet!"}

				if(friendstatus == "accepted")
					friendstatus = { status: 1, message: "Request is accepted successfully!"}

				if(friendstatus == "denied")
					friendstatus = { status: 4, message: "Request is denied successfully!"}
				console.log(to_user_id)
				resolve(friendstatus)
			});
		}

	},
	//Internal Function to get User Friend IDs
	getUserFriendStatus: function(user_id, to_user_id)
	{

		if(user_id != "" && to_user_id != "")
	  	{
		  	if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
			    firebase.initializeApp(config);
			}

		    //Initialize the FireStore
		    var db = firebase.firestore();

		    return new Promise((resolve) => {
		    	var getDoc = db.collection("user_friend_requests")
		            .where("user_id", "==", user_id)
		            .where("to_user_id", "==", to_user_id)
		            .get()

		      	.then(doc => {

	          		let status = "";
	          		doc.forEach(function(item){
	            		if(Object.keys(item.data()).length > 0)
	            			status = item.data().status;
	            	});
		      		resolve(status)
			        
			    });
		    });
		}  
	},
	//Internal Function to get User Friend IDs
	getUserFriendIDs: function(user_id)
	{
	  if(user_id != "")
	  {
	  	if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
		    firebase.initializeApp(config);
		}

	    //Initialize the FireStore
	    var db = firebase.firestore();

	    return new Promise((resolve) => {
	      var getDoc = db.collection("user_friends").
	      				where("user_id", "==", user_id).
	      				get()
	      .then(doc1 => {

	      		let friends_arr = []
	      		doc1.forEach(function(item){
            		friends_arr.push(item.data().friend_id)
          		}) ;

  			    var getDoc = db.collection("user_friends").
  					where("friend_id" , "==", user_id).
  					get()
  				.then(doc2 => {

	          		doc2.forEach(function(item){
	            		friends_arr.push(item.data().user_id)
	          		}) ;
	          		
	          		friends_arr = [...new Set(friends_arr)]; 
	          		
					resolve(friends_arr)
  				});

		      })
	    })

	  }  
	},

	//Internal Function to delete User Friend ID
	deleteUserFriend: function(user_id, friend_id)
	{
	  if(user_id != "" && friend_id != "")
	  {
	  	if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
		    firebase.initializeApp(config);
		}

	    //Initialize the FireStore
	    var db = firebase.firestore();

	    return new Promise((resolve) => {
	      var getDoc = db.collection("user_friends").where("user_id", "==", user_id).where("friend_id", "==", friend_id).get()
	      .then(doc => {
	      	console.log("First Call==>" + doc.size);

	      	if(doc.size == 0)
	      	{
	      		var getDoc = db.collection("user_friends")
	      						.where("friend_id", "==", user_id)
	      						.where("user_id", "==", friend_id)
	      						.get()
	      						.then(doc => {
									console.log("Second Call==>" + doc.size);
	      							if(doc.size == 0)	resolve(0);

					      			doc.forEach(function(item){
					            	let docid = item.id
					            	var getDoc = db.collection("user_friends").doc(docid).delete()
								    .then(doc => {
								      	//console.log("deleted")

								      	var getDoc = db.collection("user_friend_requests").where("to_user_id", "==", user_id).where("user_id", "==", friend_id).get()
								      	.then(doc => {
					      	
								      	//console.log(doc.size)
								      	if(doc.size > 0){
									      	doc.forEach(function(item){
								            	let docid = item.id
								            	var getDoc = db.collection("user_friend_requests").doc(docid).delete()
											    .then(doc => {
											      	console.log("deleted")

											      	resolve(1)
											    });
								          	}) ;
									     }else resolve(0)

					      				});

								      	
								    });
					          	}) ;

	      						});
	      	}else if(doc.size > 0){
	      		
		      	doc.forEach(function(item){
	            	let docid = item.id
	            	var getDoc = db.collection("user_friends").doc(docid).delete()
				    .then(doc => {
				      	//console.log("deleted")

				      	var getDoc = db.collection("user_friend_requests").where("user_id", "==", user_id).where("to_user_id", "==", friend_id).get()
				      	.then(doc => {
	      	
				      	//console.log(doc.size)
				      	if(doc.size > 0){
					      	doc.forEach(function(item){
				            	let docid = item.id
				            	var getDoc = db.collection("user_friend_requests").doc(docid).delete()
							    .then(doc => {
							      	console.log("deleted")

							      	resolve(1)
							    });
				          	}) ;
					     }else resolve(0)

	      				});

				      	
				    });
	          	}) ;
		     }else resolve(0)

	      });
	    });

	  }  
	},


	//Internal Function to get User Friend IDs
	deleteFriendFromGroups: function(user_id, friend_id)
	{
	  if(user_id != "" && friend_id != "")
	  {
	  	if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
		    firebase.initializeApp(config);
		}

	    //Initialize the FireStore
	    var db = firebase.firestore();

	    return new Promise((resolve) => {
	      var getDoc = db.collection("user_friends").where("user_id", "==", user_id).get()
	      .then(doc => {

	      		let friends_arr = []
	      		doc.forEach(function(item){
            		friends_arr.push(item.data().friend_id)
          		}) ;
	      		resolve(friends_arr)
		        
		      })
	    })

	  }  
	},
	firebasedelete: function()
	{
		firebase.app().delete()
	},

	updateUserDetail: function(user_detail)
	{
		if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
		    firebase.initializeApp(config);
		}

	    //Initialize the FireStore
	    var db = firebase.firestore();
	    
	    return new Promise((resolve) => {

	    	//Initialize the FireStore
              var db = firebase.firestore();
              var getDoc = db.collection(FIRESTORE_USER_TABLE).doc(user_detail.user_id).set(user_detail)
              .then(function() {
                
                firebase.app().delete(); 

                lambda.invoke({
                        FunctionName: 'LifeScape-ES-prod-es_add', 
                        InvocationType: "Event", 
                        Payload: JSON.stringify(user_detail) // pass params
                    }, function(error, data) {
                      if (error) {
                          console.log(error);
                          //return context.fail(JSON.stringify( { statusCode:500, message: error.message } ));
                      }
                      resolve(1)

                });
              });
        });

	},

	//Internal Function to get User Friends' Details
	getUserFriendDetails: function(user_id)
	{
	  if(user_id != "")
	  {
	  	if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
		    firebase.initializeApp(config);
		}

	    //Initialize the FireStore
	    var db = firebase.firestore();

	    return new Promise((resolve) => {
	      var getDoc = db.collection("user_friends").where("user_id", "==", user_id).get()
	      .then(doc1 => {

	      		let friends_arr  = [user_id];
	      		let friends_res_arr  = [];

	      		let cnt = 0;

	      		doc1.forEach(function(item){
            		friends_arr.push(item.data().friend_id);
            	});
            	
  			    var getDoc = db.collection("user_friends").
  					where("friend_id" , "==", user_id).
  					get()
  				.then(doc2 => {

	          		doc2.forEach(function(item){
	            		friends_arr.push(item.data().user_id)
	          		}) ;
	          		
	          		friends_arr = [...new Set(friends_arr)]; 
	          		
	          		friends_arr.forEach(function(friend_id){

		                //Get Friend Detail
		              	let user_detail = module.exports.getUserDetail(friend_id);
		              	
		              	user_detail.then(function(res){

		              		friends_res_arr[friend_id] = res;
		              		cnt++;
		              		
		              		if(friends_arr.length == cnt) 
		              			resolve(friends_res_arr);
		              	});
			        });
  				});

		     })
	    })

	  }  
	},


	//Function to check email id exist or not
	checkDeviceIDExist: function(device_token){

	    if(device_token)
	    {
	    	if(firebase.apps.length == 0) {   // <---Important!!! In lambda, it will cause double initialization.
			    firebase.initializeApp(config);
			}

		    //Initialize the FireStore
		    var db = firebase.firestore();
		    console.log("QUERYING to Check Duplicate..")
			return new Promise((resolve) => {
		    		var getDoc = db.collection(FIRESTORE_USER_TABLE)
		    					//.where("user_id", "<>", user_id)
		    					.where("devices.ios", "array-contains", device_token)
		    					.get()

					.then(function(querySnapshot) {
						let cnt = 0;
				        querySnapshot.forEach(function(doc) {
				            //console.log(doc.id, " => ", doc.data());
				            // if(doc.id != user_id)
				            // {
				            // 	resolve(1)
				            // }else 
				            // 	resolve(0)
				            resolve(doc.data())
				        });
				        if(cnt == 0) resolve(0)
				    })
		      	
				    .catch(function(error) {
				        console.log("Error getting documents: ", error);
				    });
		    });

		}else
			resolve(0)
	},
}


