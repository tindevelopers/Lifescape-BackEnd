'use strict';

var client = require('./connection.js');

var uuid = require('uuid');

var indexname = "ls-dev-users-index";
var indextype = "users";

module.exports.es_createindex = (event, context, callback) => {
  console.log(event);
  client.indices.create({  
    index: indexname
  },function(err,resp,status) {
    if(err) {
      console.log(err);
    }
    else {
      console.log("create",resp);
    }
  });
}


module.exports.es_search = (event, context, callback) => {
  console.log(event)
  var keyword =  decodeURI(event.keyword)
  
  client.search({  
    index: indexname,
    type: indextype,
    body: {
      // query: {
      //   wildcard: { "displayName": "*"+ keyword +"*" }
      //   //regexp: { "displayName": "/Share/ig" }
      // }
       "query": {
        "match_phrase_prefix" : {
            "displayName" : {
                "query" : keyword
            }
        }
      }
    }
  }
  //hiP1eVZD3uTKdIMGwzpgWsaEPUU2
  /*client.search({  
    index: indexname,
    type: indextype,
    body: {
        query: 
        {
          match:{  "user_id" : "c4u7vBiKzXXZOvhRe6ZRoIjW2Ut1|hiP1eVZD3uTKdIMGwzpgWsaEPUU2|lmNFlFtnq0MaPOvtxkJj79vHk4m2"  }
        }
    }
  }*/
  ,function (error, response,status) {

      if (error){
        console.log("search error: "+error)
      }
      else {
        console.log("--- Hits ---");
        let user_arr = []

        response.hits.hits.forEach(function(hit){
          user_arr.push(hit._source)
        });

        callback(null, user_arr)
      }
  });

}

module.exports.es_add = (event, context, callback) => {
  console.log(event);
  
  client.index({  
    id: event.user_id,
    index: indexname,
    type: indextype,
    body: event
  },function(error,response,status) {
      if (error){
        console.log("error: "+error)
      }
      else {
        console.log("--- Response ---");
        console.log(response);
      }
  });

}
