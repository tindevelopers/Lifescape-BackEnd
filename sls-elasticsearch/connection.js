var elasticsearch=require('elasticsearch');


let AWS = require('aws-sdk');

AWS.config.update({
  credentials: new AWS.Credentials(process.env.ACCESS_KEY, process.env.SECRET_KEY),
  region: 'us-east-1'
});

var client = new elasticsearch.Client( {  
  host: process.env.ES_CLOUD_HOST,
  connectionClass: require('http-aws-es'),
  httpOptions: {}
});

module.exports = client;  
