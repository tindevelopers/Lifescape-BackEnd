'use strict';

const request = require('request');

const oneall_host = "https://8b1f6c68-af96-46cc-9096-05176c4057bb:9934415f-b59e-4c5a-b78d-73c073f71397@app-903852-1.api.oneall.com";

//var request = require('request').defaults({ encoding: null });

module.exports = 
{
	//Function to get the location from lat, long
	createUser: function(oneall_user_token = "", provider, access_token){

		return new Promise(function(resolve, reject){
		
			let request_params = {  "request": {
							"user": 
							{
				                "identity": 
				                {
				                  "source": 
				                  {
				                    "key": provider,
				                    "access_token": access_token
				                  }
				                }
		                	}}
		              	};

		    if(oneall_user_token && oneall_user_token != "")
		    	request_params.request.user.user_token = oneall_user_token;

		    const formData = JSON.stringify( request_params  );

		    console.log(formData)

		    request.put(
		        { url: oneall_host+ '/users.json', form: formData }, 
		        function(err,httpResponse,body){ 
		          
			        if (err) resolve(0);

			        let response = JSON.parse(body).response
			        console.log(response)
			        if(typeof(response.result) != "undefined"){
				        let user_token = response.result.data.user.user_token;
				        //callback(null, response)
				        //console.log(user_token);
				        if(typeof(user_token) != "undefined")
				        	resolve(user_token)	
			        }
			        // else if(response.request.status.info)
			        //  	resolve(response.request.status.info);
			        else 
			        	resolve("")
		   	});
		  
		});

	},

	getBase64: function(url){
		return new Promise(function(resolve, reject){

			var request = require('request').defaults({ encoding: null });

			request.get(url , function (error, response, body) {
			
			    if (!error && response.statusCode == 200) {
			        //let data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
			        let mdata = new Buffer(body).toString('base64');
			        //console.log(mdata)
			        resolve(mdata)
				}
			});
		});
	},

	//Function to get the location from lat, long
	publish: function(user_token, providers, momentdetail, momentMediaList){

		return new Promise(async function(resolve, reject){
		
		//user_token = "0409d4ff-e3d5-4eb6-9d5b-3630c718e471"
		let mdata = "";
		if(momentMediaList[0].cloudinary_url != ""){
			mdata = await module.exports.getBase64(momentMediaList[0].cloudinary_url)			
		}

		let moment_url = process.env.SITE_URL + "/moment/" + momentdetail[0].datalineobject_id
		    const formData = JSON.stringify({
				"request": {
				    "sharing_message": {
				      "publish_for_user": {
				        "user_token": user_token,
				        "providers": providers
				    },
				    "parts":{
				        "text":{
				          "body": momentdetail[0].object_title + " " + moment_url
				          //"body": "asddaasdfsdffs"
				        },
				        // "video":{
				        //   "url": "#video_url#"
				        // },
				        "picture":{
				           "url": momentMediaList[0].cloudinary_url 
				        },
				        "link":{
				          "url": moment_url,
				          "name": "LifeScape : " + momentdetail[0].object_title,
				          "caption": "LifeScape : " + momentdetail[0].object_title,
				          "description": "LifeScape : " + momentdetail[0].object_title,
				        },
				        "uploads":[
				          {
				            "name": "test",
				            "data": mdata
				          }
				        ]
				      }        
				    }
				}
			});

		    console.log("Sharing..");
		    console.log(formData)
		    //return 1;
		    request.post(
		        { url: oneall_host+ '/sharing/messages.json', form: formData }, 
		        function(err,httpResponse,body){ 
		          
			        if (err){
			        	console.log(err)
			        	resolve(0);	
			        } 

			        let response = JSON.parse(body).response
			        //console.log(response.request.status.code)
			       	resolve(response.request.status.code)
			        //resolve(body)
			        // if(typeof(response.result) != "undefined"){
				       //  let user_token = response.result.data.user.user_token;
				       //  //callback(null, response)
				       //  //console.log(user_token);
				       //  if(typeof(user_token) != "undefined")
				       //  	resolve(user_token)	
			        // }
			        // else
			        //  	resolve(0);
		   	});


		  
		});

	},

	//Function to get the location from lat, long
	publishnew: function(user_token, providers, momentdetail, momentMediaList){

		return new Promise(async function(resolve, reject){
		

		let mdata = "";
		let identity = "883cec3d-7167-4862-83f0-408462a414a6";

		if(momentMediaList[0].cloudinary_url != ""){
			mdata = await module.exports.getBase64(momentMediaList[0].cloudinary_url)			
		}

		    const formData = JSON.stringify({
							 "request": {
							   "push": {   
							      "post": {   
							       "message": "hiii",
							       "location": "Ahmedabad",
							       "attachments": [
							         "#video/picture_id#"
							       ]
							   	 }
							   }
							 }
							});

		    console.log("Sharing..");
		    console.log(formData)
		    //return 1;
		    request.post(
		        { url: oneall_host+ '/push/identities/' + identity +'/twitter/post.json' , form: formData }, 
		        function(err,httpResponse,body){ 
		          
			        if (err){
			        	console.log(err)
			        	resolve(0);	
			        } 

			        let response = JSON.parse(body).response
			        console.log(response)
			       	resolve(response.request.status.code)
			        //resolve(body)
			        // if(typeof(response.result) != "undefined"){
				       //  let user_token = response.result.data.user.user_token;
				       //  //callback(null, response)
				       //  //console.log(user_token);
				       //  if(typeof(user_token) != "undefined")
				       //  	resolve(user_token)	
			        // }
			        // else
			        //  	resolve(0);
		   	});


		  
		});

	},

	//Function to make url shorter
	makeshorturl: function(momentdetail){

		return new Promise(async function(resolve, reject)
		{
		
			let moment_url = process.env.SITE_URL ;//+ "/moment/" + momentdetail[0].datalineobject_id

		    const formData = JSON.stringify({
							  "request":{
							    "shorturl":{
							      "original_url": moment_url 
							    }
							  }
							});

		    console.log(formData)


		    //request.post(
		    //   { url: oneall_host+ '/shorturls.json' , form: formData }, 
		     request.get(
		        { url: oneall_host+ '/shorturls.json'}, 
		        function(err,httpResponse,body){ 
		          
			        if (err){
			        	console.log(err)
			        	resolve(0);	
			        } 

			        let response = JSON.parse(body).response
			        
			       	resolve(body)
			        //resolve(body)
			        // if(typeof(response.result) != "undefined"){
				       //  let user_token = response.result.data.user.user_token;
				       //  //callback(null, response)
				       //  //console.log(user_token);
				       //  if(typeof(user_token) != "undefined")
				       //  	resolve(user_token)	
			        // }
			        // else
			        //  	resolve(0);
		   	});


		  
		});

	}

}