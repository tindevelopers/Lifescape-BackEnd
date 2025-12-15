
'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const APPLICATION_ARN = "arn:aws:sns:us-east-1:872469723818:app/APNS/lifescapenew"


const createSNSEndpoint = (deviceToken) => {
  let params = {
    PlatformApplicationArn: APPLICATION_ARN /* from step 1 */,
    Token: deviceToken
  };
  
  return sns.createPlatformEndpoint(params).promise();
};

const subscribeDeviceToTopic = (endpointArn) => {
  let params = {
    Protocol: 'application',
    TopicArn: TOPIC_ARN /* from step 2 */,
    Endpoint: endpointArn
  };
  
  return sns.subscribe(params).promise();
};

module.exports = 
{
	//Function to create sns endpoint
	saveSNSDeviceToken: function(deviceToken){
		return new Promise(function(resolve, reject){

			//console.log("sns register" + deviceToken);
			//const registerDeviceWithAWS = (deviceToken) => {
			  return createSNSEndpoint(deviceToken).then((result) => {
			  	console.log(result)
			    const endpointArn = result.EndpointArn;
			    resolve(1)
			    //return subscribeDeviceToTopic(endpointArn);
			  });
			//};

		});
	},

	//Function to create sns endpoint
	sendSNSNotificaton: function(deviceToken, data ){

		deviceToken.forEach((token) => {

			return createSNSEndpoint(token).then((result) => {

			    let endpointArn = result.EndpointArn;

				if(endpointArn)
				{
					let params = {
					    TargetArn: endpointArn,
					    Message: data.message.replace(/<[^>]*>/g, ''),
					    Subject: data.verb
					};
					console.log(params)
					sns.publish(params, function(err,data){
				        if (err) 	console.log('Error sending a message', err);
					});
				}

			});

		});
			// return createSNSEndpoint(deviceToken).then((result) => {

			//     let endpointArn = result.EndpointArn;

			// 	if(endpointArn)
			// 	{
			// 		let params = {
			// 		    TargetArn: endpointArn,
			// 		    Message:'Success!!! ',
			// 		    Subject: 'TestSNS'
			// 		};
			// 		console.log(params)
			// 		sns.publish(params, function(err,data){
			// 		        if (err) {
			// 		            console.log('Error sending a message', err);
			// 		            resolve(0)
			// 		        } else {
			// 		            console.log('Sent message:', data.MessageId);
			// 		            resolve(1)
			// 		        }
			// 		});
			// 	}else
			// 		resolve(0)

			// });

			
	},
	
}