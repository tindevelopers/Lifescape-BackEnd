'use strict';

const AWS = require('aws-sdk');
 
var uuid = require('uuid');

var momentob = require('./lib/model/moment.js');
var threadob = require('./lib/model/thread.js');
var userob = require('./lib/model/user.js');
var object_permissions = require('./lib/model/object_permissions.js');
var snsob = require('./lib/model/sns.js');

const dynamo = new AWS.DynamoDB.DocumentClient();

//Function to Add Viewed Moment Logs
module.exports.addRecentMoment = (event, context, callback) => {

    console.log(event);
    
    var user_id = event["path"]["user_id"];
    var datalineobject_id =  event["path"]["object_id"];

    if(user_id != "" && datalineobject_id != "")
    {
        let myProm = new Promise(function(resolve, reject){

            var params = { 
                TableName: 'UserRecentViews',
                Key: {
                  "user_id": user_id,
                  "datalineobject_id": datalineobject_id
                }
            };
                
            dynamo.delete(params, function(error, result) {
              if(error) {
                console.log(error)
                return context.fail(JSON.stringify( { statusCode:500, message: "Server Errorr" } ));
              }

              var item_data = {
                "datalineobject_id": datalineobject_id,
                "user_id": user_id,
                "created_datetime": Date.now()
              }

              params = {
                TableName: 'UserRecentViews',
                Item: item_data
              };

              dynamo.put(params, function(err, result) {

                    if (err)
                      return context.fail(JSON.stringify({ statusCode:500, message: "Server Error" } ));
                    else{
                      const response = {
                          message: 'Data inserted successfully!'
                      };
                      callback(null, JSON.stringify({ message: 'Data inserted successfully!' } ));
                    } 

              });

            });

            

       });

    }else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));

}


//Function to Get Recent Moments
module.exports.getRecentMoments = (event, context, callback) => {

    console.log(event);
    
    var user_id = event["path"]["user_id"];

    if(user_id == "")
    {
      return context.fail(JSON.stringify(
              {
                statusCode:400,
                message: 'User ID is blank!'
              }
          ));
    }

    let myProm = new Promise(function(resolve, reject){

        const params = { 
                TableName: 'UserRecentViews',
                IndexName: "user_id-created_datetime-index",
                KeyConditionExpression: "#user_id = :user_id",
                ExpressionAttributeNames:{
                    "#user_id": "user_id"
                },
                ExpressionAttributeValues: {
                    ":user_id": user_id
                },
                ScanIndexForward: false,
                Limit: 30
        };

        var items = [];
        var res_arr = [];

        var queryExecute = function(callback) {
            
            dynamo.query(params, function(err, result) {

              if (err) {

                console.log(err);
                return context.fail(JSON.stringify(
                    {
                      statusCode:500,
                      message: "Server Error"
                    }
                ));

              } else {
                
                items = items.concat(result.Items);
                
                //if(result.LastEvaluatedKey) {

                //    params.ExclusiveStartKey = result.LastEvaluatedKey;
                //    queryExecute(callback);

                //} else 
                {

                  if(items.length == 0) 
                    return context.fail(JSON.stringify({ statusCode:404, message: "Records Not Found" } ));
                  else
                    resolve(items)

                }
              }
            });
        }
        queryExecute(callback);

    })

    .then(

      function(object_result) {
        
        console.log("Final Result1 ==>");
        //console.log(object_result)

        var momentdetaillist = [];
        var cnt = 0;
        var tot = object_result.length;
        console.log(tot)


          object_result.forEach(async function(value, i){
            
              let objectid = value.datalineobject_id

              let momentresult = await momentob.getMomentDetail(objectid);
              momentresult = momentresult[0];

              //console.log(momentresult)

              if(momentresult) {

                if(user_id)  
                  momentresult["mylike_status"] =  await momentob.checkMomentLikeStatus(objectid, user_id);

                for (var prop in momentresult) {
                    value[prop] = momentresult[prop];
                }
                
              } 
              cnt++;

              if(cnt == tot )
              {
                   for(let ii = 0; ii < object_result.length; ii++)
                   {
                     if(object_result[ii].object_title)
                     {
                       momentdetaillist.push(object_result[ii]);
                     }
                   }
                   if(momentdetaillist.length > 0)
                     callback(null, JSON.stringify(momentdetaillist.slice(0,10))); 
                   else
                     return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
              }


              
          });
          
      },

      function(error) { 
        return context.fail(JSON.stringify({ statusCode:500, message: "Server Error" } ));
      }

    )
  
}



//Function to get User's Recent Activity by Time (day/month/year/decade)
module.exports.getRecentMomentsByTime = (event, context, callback) => {

    console.log(event)

    var user_id = event["path"]["user_id"];
    var byTime = event["path"]["byTime"] ? event["path"]["byTime"] : "decade";

    var LastEvaluatedKey = "";
    if(event["body"]["last_moment_id"])
      var LastEvaluatedKey = event["body"]["last_moment_id"];

    var thread_id = "";
    if(event["body"]["thread_id"])
      var thread_id = event["body"]["thread_id"];

    var page_rec="100";
    if(event["body"]["page_rec"])
      var page_rec = event["body"]["page_rec"];

    if(event["body"]["start_year"])
      var startYear = event["body"]["start_year"];
    else
      var startYear = 2019; 

    if(event["body"]["end_year"])
      var curYear = event["body"]["end_year"];
    else
      var curYear = 2019;

    if(event["body"]["start_month"])
      var start_month = event["body"]["start_month"];

    if(event["body"]["start_day"])
      var start_day = event["body"]["start_day"];

    let myProm = new Promise(async function(resolve, reject){

        let thread_moment_arr = [];
        let t_index = 0;
        let timelineArr = [];

        let fromTS = new Date('01-01-' + startYear + ' 00:00:00').getTime() ;
        let toTS = new Date('12-31-' + curYear + ' 23:59:59').getTime() ;

        let userMomentListArr = await momentob.getRecentMomentByUserIdNTime(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
        //let userMomentListArr = await momentob.getTimelineMomentList(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);

        if(byTime == "decade" )
        {
          for(let ii = startYear; ii <= curYear; ii= ii + 10)
          {   

              let temp = {}
              //let fromTS = new Date('01-01-' + ii + ' 00:00:00').getTime() / 1000;
              let fromTS = new Date('01-01-' + ii + ' 00:00:00').getTime() ;
              let endYear = eval(ii + 9)
              let toTS = new Date('12-31-' + endYear + ' 23:59:59').getTime() ;

              //let userMomentList = await momentob.getRecentMomentByUserIdNTime(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
              let userMomentList = findInMomentArray(userMomentListArr, fromTS, toTS);

              let key =  ii + "-" + eval(ii+9)
              //timelineArr[key] = userMomentList
              temp.year = key
              temp.moment_counter = userMomentList.length
              temp.data = userMomentList.slice(0, 7);
              timelineArr.push(temp)
              
              if(curYear <= endYear)
              {
                //thread_moment_arr[] = timelineArr
                thread_moment_arr.push(timelineArr)
              }
              
          }
        } 
        
        if(byTime == "year")
        {

          for(let ii = startYear; ii <= curYear; ii= ii+ 1)
          {
            
              let temp = {}

              let fromTS = new Date('01-01-' + ii + ' 00:00:00').getTime() ;
              
              let endYear = eval(ii + 1);

              let toTS = new Date('12-31-' + ii + ' 23:59:59').getTime() ;

              //let userMomentList = await momentob.getRecentMomentByUserIdNTime(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
              let userMomentList = findInMomentArray(userMomentListArr, fromTS, toTS);


              let key = ii + "-" + eval(ii+1)
              //timelineArr[ii] = "userMomentList" 
              temp.year = ii
              temp.moment_counter = userMomentList.length
              temp.data = userMomentList.slice(0, 7);

              timelineArr.push(temp)

              //console.log(ii + "===" + curYear + " === " + endYear)
              if(curYear == ii || startYear == curYear)
              {          
                thread_moment_arr.push(timelineArr)
              }
          }
        }

        if(byTime == "month")
        {

          let fromTSDate = ""; 
          let endTSDate = ""; 
          //for(let ii = startYear; ii <= curYear; ii= ii+ 1)
          let flag = true;

          let i = 0;
          while(flag)
          {
              let temp = {}

              //let fromTS = new Date('01-01-' + ii + ' 00:00:00').getTime() ;
              if(i > 0)
                fromTSDate = endTSDate;  
              else
                fromTSDate = new Date('01-01-' + startYear + ' 00:00:00') ;

              if(i == 11) flag = false;

              i++;

              let fromTS = fromTSDate.getTime();

              //console.log(fromTSDate)                    
              fromTSDate.setMonth( fromTSDate.getMonth() + 1 );
              
              endTSDate = fromTSDate;
              //console.log(endTSDate)

              //let toTS = new Date('12-31-' + ii + ' 23:59:59').getTime() ;
              let toTS = fromTSDate.getTime();
              
              let userMomentList = await momentob.getRecentMomentByUserIdNTime(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
              //timelineArr[i + "-" + startYear] = userMomentList
              temp.month = i + "-" + startYear
              
              temp.moment_counter = userMomentList.length
              temp.data = userMomentList.slice(0, 7);

              timelineArr.push(temp)

              if(!flag)
              {
                  thread_moment_arr.push(timelineArr)
              }
          }
        }

        if(byTime == "day" && start_day && start_month)
        {
          let fromTSDate = ""; 
          let endTSDate = ""; 
          //for(let ii = startYear; ii <= curYear; ii= ii+ 1)
          let flag = true;

          let i = 0;
          while(flag)
          {
              let temp = {}

              //let fromTS = new Date('01-01-' + ii + ' 00:00:00').getTime() ;
              if(i > 0)
                fromTSDate = endTSDate;  
              else
              {
                fromTSDate = new Date(start_month + '-' + start_day + '-' + startYear + ' 00:00:00') ;
                fromTSDate.setDate( fromTSDate.getDate() - 3 );
              }  

              i++;

              let fromTS = fromTSDate.getTime();

              //console.log("Start==" + fromTSDate)

              fromTSDate.setDate( fromTSDate.getDate() + 1 );
              
              endTSDate = fromTSDate;
              // console.log("End==" +endTSDate)
              //console.log(endTSDate.getMonth() + "  " + startMonth)

              if(i == 7) flag = false;

              //let toTS = new Date('12-31-' + ii + ' 23:59:59').getTime() ;
              let toTS = fromTSDate.getTime();
              //let userMomentList = await momentob.getRecentMomentByUserIdNTime(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
              let userMomentList = await momentob.getRecentMomentByUserIdNTime(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);

              temp.day = ("0" + fromTSDate.getDate()).slice(-2)  + "-" + ("0" + eval(fromTSDate.getMonth()+1)).slice(-2) + "-" + fromTSDate.getFullYear() 
              
              temp.moment_counter = userMomentList.length
              temp.data = userMomentList.slice(0, 7);

              timelineArr.push(temp)

              if(!flag)
              {
                thread_moment_arr.push(timelineArr)
              }
          }
        }
        //callback(null, (thread_moment_arr[0].reverse()));
        resolve(thread_moment_arr[0].reverse())
        //callback(null, JSON.stringify(thread_moment_arr[0].reverse()));

    })
.then(
      function(thread_result) {

        // handle a successful result 
        return new Promise(function(resolve, reject) {

          var items = {};
          var thread_cnt = 0;
          let tot = Object.keys(thread_result).length
          
          if(tot > 0)
          {
            //console.log(thread_result)

            for(let thread_prop in thread_result) {//Loop through thread
              //console.log(thread_result[thread_prop]);
              //for(let prop in thread_result[thread_prop]) 
              {
                //if(thread_result.hasOwnProperty(thread_prop) && thread_result[thread_prop].hasOwnProperty(prop))
                {

                    let momentcnt = 0;

                    let totalobject = thread_result[thread_prop]['data'].length;

                    if(totalobject > 0)
                    {
                      
                      thread_result[thread_prop]['data'].forEach(async function(item, i){

                          //Fetch Media Data of Moments
                          let objectid = item.datalineobject_id
   
                          //let momentMediaList = await momentob.getMomentMedias(objectid, 1)
                          
                          let checkMyLikeStatus = await momentob.checkMomentLikeStatus(objectid, event.principalId);
                          momentcnt++;

                          thread_result[thread_prop]['data'][i].mylike_status = checkMyLikeStatus
              
                          //console.log( momentcnt +"=="+ totalobject)
                          if(momentcnt == totalobject)
                          {
                            thread_cnt++;

                            //console.log(thread_cnt + "=====" + tot)
                            
                            if(thread_cnt == tot)
                            {
                              console.log("FINAL====>")
                              //console.log(thread_result)
                              callback(null, JSON.stringify(thread_result));
                            }
                          }

                      });

                    }else{
                      thread_cnt++;        

                      if(thread_cnt == tot)
                      {
                        callback(null, JSON.stringify(thread_result));
                      }                      

                    }
                  }
                }
            }
          }else{
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
          }  
        });
      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
    )
    
    

}

function findInMomentArray(arr, from, to)
{
  //if(arr.length > 0)
  {
    let res = [];
    arr.forEach(function (item){
      if(item.start_date >= from && item.start_date <= to)
      {
        res.push(item)
      }
    });
    return res;
  }
}

//Function to get Time Matrix Moments
module.exports.getTimeMatrixMoments = (event, context, callback) => {

    console.log(event);

    var user_id = event["path"]["user_id"];
    var byTime = event["path"]["byTime"] ? event["path"]["byTime"] : "decade";

    var LastEvaluatedKey = thread_id = "";
    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["last_moment_id"]) != "undefined")
      var LastEvaluatedKey = event["body"]["last_moment_id"];

    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["page_rec"]) != "undefined")
      var page_rec = event["body"]["page_rec"];

    var returnall = 0;
    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["thread_id"]) != "undefined")
    {
      returnall = 1;
      var thread_id = event["body"]["thread_id"] ;
    }

   if(typeof(event["body"]) != "undefined" && typeof(event["body"]["start_year"]) != "undefined")
      var start_year = event["body"]["start_year"];
    else
      var start_year = 2019; 

    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["end_year"]) != "undefined")
      var end_year = event["body"]["end_year"];
    else
      var end_year = 2019;

    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["start_month"]) != "undefined")
      var start_month = event["body"]["start_month"];

    if(typeof(event["body"]) != "undefined" && typeof(event["body"]["start_day"]) != "undefined")
      var start_day = event["body"]["start_day"];

    let myProm = new Promise(async function(resolve, reject){

        let startYear = start_year;
        let curYear = end_year;;
        
        let thread_moment_arr = {};
        let t_index = 0;
        let momentot = 0;
        let seepastdatescnt = 0 

        var userThreadList =  await threadob.getUserThreads(user_id, thread_id);
        //console.log(userThreadList);

        if(userThreadList.length > 0 )
        {

            userThreadList.forEach(async function( thread )
            //for(let ind=0; ind < userThreadList.length; ind++)
            {
              //let thread = userThreadList[ind];

              let thread_id = thread.thread_id;
              //console.log(thread_id)


              let thread_name = thread.thread_name;
              let timelineArr = [];

              if(byTime == "decade" )
              {

                let fromTS = new Date('01-01-' + start_year + ' 00:00:00').getTime() ;
                let toTS = new Date('12-31-' + end_year + ' 23:59:59').getTime() ;
                let userMomentListArr = await momentob.getTimelineMomentList(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);

                for(let ii = curYear; ii >= startYear; ii= ii - 10)  
                {   

                    let temp = {}

                    let fromYear = eval(ii - 9);
                    let fromTS = "" 
                    if(fromYear <= startYear)
                       fromTS = new Date('01-01-' + startYear + ' 00:00:00').getTime() ;
                    else 
                       fromTS = new Date('01-01-' + fromYear + ' 00:00:00').getTime() ;
                    //let endYear = eval(ii + 9)
                    let toTS = new Date('12-31-' + ii + ' 23:59:59').getTime() ;

                    //let userMomentList = await momentob.getTimelineMomentList(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
                    let userMomentList = findInMomentArray(userMomentListArr, fromTS, toTS);

                    let key = fromYear + "-" + ii
                    //timelineArr[key] = userMomentList
                    temp.year = key
                    temp.moment_counter = userMomentList.length
                    temp.thread_name = thread_name
                    if(returnall == 1)
                      temp.data = userMomentList;  
                    else
                      temp.data = userMomentList.slice(0, 11);
                    timelineArr.push(temp);
                    momentot += userMomentList.length 
                    
                    //if(curYear <= endYear)
                    if(fromYear <= startYear )
                    {
                      thread_moment_arr[thread_id] = timelineArr
                      if(momentot == 0 && seepastdatescnt < 3 ){
                        seepastdatescnt++; 
                        startYear = startYear - 9;
                      }
                    }   
                }
              } 

              if(byTime == "year")
              {
                
                let fromTS = new Date('01-01-' + start_year + ' 00:00:00').getTime() ;
                let toTS = new Date('12-31-' + end_year + ' 23:59:59').getTime() ;
                let userMomentListArr = await momentob.getTimelineMomentList(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
//return 1;
                for(let ii = curYear; ii >= startYear; ii= ii - 1)
                {
                    let temp = {}

                    let fromTS = new Date('01-01-' + ii + ' 00:00:00').getTime() ;
                    
                    let endYear = eval(ii + 1);

                    let toTS = new Date('12-31-' + ii + ' 23:59:59').getTime() ;

                    //let userMomentList = await momentob.getTimelineMomentList(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
                    let userMomentList = findInMomentArray(userMomentListArr, fromTS, toTS);
                    //console.log(userMomentList)
                    //return 1;

                    //return 1;
                    //timelineArr[ii] = "userMomentList" 
                    temp.year = ii
                    temp.moment_counter = userMomentList.length 
                    temp.thread_name = thread_name
                    if(returnall == 1)
                      temp.data = userMomentList;  
                    else
                      temp.data = userMomentList.slice(0, 11);
                    timelineArr.push(temp);

                    momentot += userMomentList.length 
                    //console.log(timelineArr)
                    //console.log(ii + "====="+ curYear + " === " + startYear + " +++ " + endYear)
                    //if(curYear == startYear || startYear == curYear)

                    if(ii == startYear  )
                    {                      
                      thread_moment_arr[thread_id] = timelineArr;

                      if(momentot == 0 && seepastdatescnt < 5 ){
                        seepastdatescnt++; 
                        startYear = startYear - 1;
                      }

                      //console.log(startYear)
                    }

                    if(returnall == 1)
                    {
                      thread_moment_arr[thread_id] = timelineArr;
                      break;
                    }

                }
                /*
                for(let ii = curYear; ii >= startYear; ii= ii - 1)
                {
                    let temp = {}

                    let fromTS = new Date('01-01-' + ii + ' 00:00:00').getTime() ;
                    
                    let endYear = eval(ii + 1);

                    let toTS = new Date('12-31-' + ii + ' 23:59:59').getTime() ;

                    let userMomentList = await momentob.getTimelineMomentList(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
                    
                    //timelineArr[ii] = "userMomentList" 
                    temp.year = ii
                    temp.moment_counter = userMomentList.length 
                    temp.thread_name = thread_name
                    if(returnall == 1)
                      temp.data = userMomentList;  
                    else
                      temp.data = userMomentList.slice(0, 11);
                    timelineArr.push(temp);

                    momentot += userMomentList.length 
                    //console.log(timelineArr)
                    //console.log(ii + "====="+ curYear + " === " + startYear + " +++ " + endYear)
                    //if(curYear == startYear || startYear == curYear)

                    if(ii == startYear  )
                    {                      
                      thread_moment_arr[thread_id] = timelineArr;

                      if(momentot == 0 && seepastdatescnt < 5 ){
                        seepastdatescnt++; 
                        startYear = startYear - 1;
                      }

                      //console.log(startYear)
                    }

                    if(returnall == 1)
                    {
                      thread_moment_arr[thread_id] = timelineArr;
                      break;
                    }

                }*/
              }

              if(byTime == "month")
              {

                let fromTSDate = ""; 
                let endTSDate = ""; 
                //for(let ii = startYear; ii <= curYear; ii= ii+ 1)
                let flag = true;

                let i = 0;
                while(flag)
                {
                    let temp = {}

                    //let fromTS = new Date('01-01-' + ii + ' 00:00:00').getTime() ;
                    if(i > 0)
                      fromTSDate = endTSDate;  
                    else
                      fromTSDate = new Date('01-01-' + startYear + ' 00:00:00') ;

                    if(returnall == 1)
                    {
                      fromTSDate = new Date( start_month +'-01-' + startYear + ' 00:00:00') ;                      
                      flag = false;
                    }
                    if(i == 11) flag = false;

                    i++;

                    let fromTS = fromTSDate.getTime();

                    //console.log(fromTSDate)                    
                    fromTSDate.setMonth( fromTSDate.getMonth() + 1 );
                    
                    endTSDate = fromTSDate;
                    //console.log(endTSDate)

                    //let toTS = new Date('12-31-' + ii + ' 23:59:59').getTime() ;
                    let toTS = fromTSDate.getTime();
                    let userMomentList = await  momentob.getTimelineMomentList(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);

                    //timelineArr[i + "-" + startYear] = userMomentList
                    if(returnall == 1)
                      temp.month = start_month + "-" + startYear
                    else
                      temp.month = i + "-" + startYear
                    temp.moment_counter = userMomentList.length
                    temp.thread_name = thread_name
                    if(returnall == 1)
                      temp.data = userMomentList;  
                    else
                      temp.data = userMomentList.slice(0, 11);
                    timelineArr.push(temp)

                    if(!flag)
                    {
                        thread_moment_arr[thread_id] = timelineArr
                    }
                }
              }

              if(byTime == "day" && start_day && start_month)
              {
                let fromTSDate = ""; 
                let endTSDate = ""; 
                //for(let ii = startYear; ii <= curYear; ii= ii+ 1)
                let flag = true;

                let i = 0;
                while(flag)
                {
                    let temp = {}
                    let endTSDate1 = ""
                    //let fromTS = new Date('01-01-' + ii + ' 00:00:00').getTime() ;
                    if(i > 0)
                    {
                      fromTSDate = endTSDate;  
                      endTSDate1 = new Date(start_month + '-' + start_day + '-' + startYear + ' 00:00:00') ;
                    } 
                    else
                    {
                      fromTSDate = new Date(start_month + '-' + start_day + '-' + startYear + ' 00:00:00') ;
                      endTSDate1 = new Date(start_month + '-' + start_day + '-' + startYear + ' 00:00:00') ;
                      //fromTSDate.setDate( fromTSDate.getDate() - 3 );
                    }
                    //console.log("from=" + fromTSDate.getDate())
                    
                    if(returnall == 1)
                      fromTSDate = new Date(start_month + '-' + start_day + '-' + startYear + ' 00:00:00') ;

                    endTSDate1.setDate( fromTSDate.getDate() + 1 ); 

                    i++;

                    let fromTS = fromTSDate.getTime();
                    let toTS = endTSDate1.getTime();
                    console.log(fromTSDate + " ==== " + endTSDate1)
                    console.log(fromTS + " ==== " + toTS)
                    
                    if(returnall == 1) flag = false;
                    if(i == 6 ) flag = false;

                    let userMomentList = await  momentob.getTimelineMomentList(user_id, thread_id, fromTS, toTS, LastEvaluatedKey, page_rec);
                    //console.log(userMomentList)
                    //console.log(fromTSDate)

                    if(returnall == 1)
                      temp.day = start_day  + "-" + start_month + "-" + start_year
                    else
                      temp.day = ("0" + fromTSDate.getDate()).slice(-2)  + "-" + ("0" + eval(fromTSDate.getMonth()+1)).slice(-2) + "-" + fromTSDate.getFullYear() 

                    temp.moment_counter = userMomentList.length
                    temp.thread_name = thread_name

                    if(returnall == 1)
                      temp.data = userMomentList;  
                    else
                      temp.data = userMomentList.slice(0, 11);
                    
                    timelineArr.push(temp)

                    endTSDate = endTSDate1;

                    if(!flag)
                    {

                      thread_moment_arr[thread_id] = timelineArr
                    }
                }
              }

              t_index++
              //console.log(t_index + " " + userThreadList.length)
              if(t_index == userThreadList.length)
              {
                //console.log(thread_moment_arr)
                if(Object.keys(thread_moment_arr).length > 0 )
                {
                  //resolve(thread_moment_arr)
                  //console.log(thread_moment_arr)
                  callback(null, JSON.stringify(thread_moment_arr));  
                }    
                else
                   return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
              }


          });

        }
        else
          return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));

    })
    .then(
      function(thread_result) {

        // handle a successful result 
        return new Promise(function(resolve, reject) {

          var items = {};
          var thread_cnt = 0;
          let tot = Object.keys(thread_result).length
          //console.log(tot);
          return 1;
          if(tot > 0)
          {
            
            for(let thread_prop in thread_result) {//Loop through thread
              //console.log(thread_result[thread_prop]);

              let maincnt = 0;
              let total_timeline = Object.keys(thread_result[thread_prop]).length

              for(let prop in thread_result[thread_prop]) {
                
                if(thread_result.hasOwnProperty(thread_prop) && thread_result[thread_prop].hasOwnProperty(prop))
                {

                    let momentcnt = 0;
                    let totalobject = thread_result[thread_prop][prop]['data'].length;

                    if(totalobject > 0)
                    {
                      //totalobject = (( totalobject < 6 ) ? totalobject : 6 );
                      
                      thread_result[thread_prop][prop]['data'].forEach(async function(item, i){

                          //Fetch Media Data of Moments
                          let objectid = item.datalineobject_id
   
                          //let momentMediaList = await momentob.getMomentMedias(objectid, 1)
                           
                          momentcnt++;
                          let checkMyLikeStatus = await momentob.checkMomentLikeStatus(objectid, user_id);

                          thread_result[thread_prop][prop]['data'][i].mylike_status = checkMyLikeStatus
              
                          if(momentcnt == totalobject)
                          {
                              maincnt++;
                          }

                          
                          if(maincnt == total_timeline && momentcnt == totalobject)
                          {
                            thread_cnt++;
                            
                            if(thread_cnt == tot)
                            {
                              console.log("FINAL====>")
                              //console.log(thread_result)
                              callback(null, JSON.stringify(thread_result));
                            }
                          }

                      });

                    }else{
                      maincnt++;        

                      if(maincnt == total_timeline )
                            thread_cnt++;

                      if(thread_cnt == tot)
                      {
                        callback(null, JSON.stringify(thread_result));
                      }                      

                    }
                  }
                }
            }
          }else{
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
          }  
        });
      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
    )

}

module.exports.getPlaces = (event, context, callback) => {
    console.log(event)
    var user_id = event["path"]["user_id"];

    return new Promise(async function(resolve, reject) {
        //let ProjectionExpression = "datalineobject_id,comments_counter, like_counter, object_title, user_id, latitude, longitude, location";
        let usermoments = await momentob.getUserMapMomentList(user_id, "", "", 500);
        
        if(usermoments.length > 0){
          callback(null, JSON.stringify(usermoments));
          //resolve(usermoments)
        }else
        {
          return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
        }
    })
    .then(
      function(object_result) {

        return new Promise(function(resolve, reject) {

          var items = {};
          var cnt = 0;
          var totalobject = object_result.length

          if(totalobject > 0)
          {
            object_result.forEach(async function(item, i){
              
              //Fetch Media Data of Moments
              let objectid = item.datalineobject_id
              items[objectid] = item

              let momentMediaList = await momentob.getMomentMedias(objectid)
              
              var moments_items = []

              cnt  = cnt + 1;
              
              if(momentMediaList.length > 0)
              {
                momentMediaList.forEach(function(item1){
                  moments_items.push(item1)
                });
                items[objectid].mediadata = moments_items 
              } 
              items[objectid].media_counter = momentMediaList.length 
              
              if(cnt == totalobject)
                callback(null, JSON.stringify(object_result));
      
            });
          }
        });
      },

      function(error) { 
        console.log(error)
        return context.fail(JSON.stringify( { statusCode:500, message: "Server Error" } ));
      }
    )
}
//Function to get Time Matrix Moments
module.exports.getPlaces1 = (event, context, callback) => {

    console.log(event)
    var user_id = event["path"]["user_id"];

    return new Promise(async function(resolve, reject) {
        //let ProjectionExpression = "ALL";
        let usermoments = await momentob.getUserMomentList(user_id);
        
        if(usermoments.length > 0){

          let locations = [];
          let templocations = [];

          usermoments.forEach(function(moment){
            //console.log(moment)
            let temp = {}

            if(typeof(moment.location) == 'string')
            {
              if(templocations.indexOf(moment.location) < 0)
              {
                templocations.push(moment.location);
                temp.location = moment.location
                temp.latitude = moment.latitude
                temp.longitude = moment.longitude
                temp.moment_data = Array(  )
                locations.push(temp)
              }
            }
            
          });

          let locmoments = [];
          usermoments.forEach(function(moment){
            if(templocations.indexOf(moment.location) > -1)
            {
              //console.log(finalres[moment.location])
              if(typeof(locmoments[moment.location]) == "undefined")
                locmoments[moment.location] = []

              locmoments[moment.location].push(moment) 
            }

          });  

          locations.forEach(function(item, i){
            //console.log(item)
            locations[i].moment_counter = locmoments[item.location].length
            locations[i].moment_data = locmoments[item.location]
            //item.momentdata = locmoments[item.location]
          });
          console.log(locations);

          //resolve(locations);
          //callback(null, JSON.stringify(locations));

        }else
          return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));


    })
    .then(
      function(object_result) {
        console.log(object_result);

        // handle a successful result 
        return new Promise(function(resolve, reject) {

          var items = {};
          var thread_cnt = 0;
          //let tot = Object.keys(object_result).length
          let tot = object_result.length
          
          if(tot > 0)
          {

            for(let thread_prop in object_result) {
              console.log("=====")
              console.log(object_result[thread_prop])

              let maincnt = 0;
              let total_timeline = Object.keys(object_result[thread_prop]).length
              //console.log(thread_prop)
              

              for(let prop in object_result[thread_prop].moment_data) 
              {
                 console.log(object_result[thread_prop].moment_data[prop])
              
              //   {
                    let cnt1 = 0;
                    let totalobject = object_result[thread_prop][prop]['data'].length;
                    //console.log(totalobject)

              //       // if(totalobject > 0)
              //       // {
                      
              //       //   thread_result[thread_prop][prop]['data'].forEach(async function(item, i){

              //       //       //Fetch Media Data of Moments
              //       //       let objectid = item.datalineobject_id
   
              //       //       let momentMediaList = await momentob.getMomentMedias(objectid)
              //       //       let checkMyLikeStatus = await momentob.checkMomentLikeStatus(objectid, user_id);
              //       //       let momentTags = await momentob.getMomentTags(objectid);
                          

              //       //       thread_result[thread_prop][prop]['data'][i].mylike_status = checkMyLikeStatus
                          
              //       //       if(momentTags.length > 0)
              //       //         thread_result[thread_prop][prop]['data'][i].tags = momentTags
                          
              //       //       cnt1  = cnt1 + 1;

              //       //       let moments_items = []
              //       //       if(momentMediaList.length > 0)
              //       //       {
              //       //         momentMediaList.forEach(function(item1){
              //       //           moments_items.push(item1)
              //       //         });
              //       //         thread_result[thread_prop][prop]['data'][i].mediadata = moments_items   
              //       //       }
          
              //       //       if(cnt1 == totalobject)
              //       //           maincnt++;
              //       //       console.log("FINAL")

              //       //       if(maincnt == total_timeline && cnt1 == totalobject)
              //       //       {
              //       //         thread_cnt++;

              //       //         if(thread_cnt == tot)
              //       //         {
              //       //           console.log("FINAL==>")
              //       //           console.log(thread_result)
              //       //           callback(null, JSON.stringify(thread_result))
              //       //         }
              //       //       }

              //       //   });

              //       // }else{
              //       //   maincnt++;        

              //       //   if(maincnt == total_timeline )
              //       //         thread_cnt++;

              //       //   console.log("ELSE" + thread_cnt + "==" + tot)

              //       //   //thread_result[thread_prop][prop][i] = ""   
              //       //   if(thread_cnt == tot)
              //       //   {
              //       //     console.log("FINAL>>")
              //       //     //console.log(thread_result)
              //       //     callback(null, JSON.stringify(thread_result))
              //       //     return 1;
              //       //   }
                      
              //       // }
              //     }
                }
            }
          }else{
            return context.fail(JSON.stringify( { statusCode:404, message: "Records Not Found" } ));
          }  
        });
      },
      function(error) { 
        return context.fail(JSON.stringify( { statusCode:500, message: "Internal Server Error" } ));
      }
    )
}



//Function to invite users to contribute to my Channel or Moment
module.exports.inviteUsersToObject = (event, context, callback) => {

    console.log(event)
    var user_id =  event["path"]["user_id"];
    var to_user_id =   event["body"]["to_user_id"];
    var object_type =   event["body"]["object_type"];
    var object_id =   event["body"]["object_id"];
    var role =   event["body"]["role"];

    if(user_id && to_user_id )
    {
      return new Promise(async function(resolve, reject) {
        to_user_id.forEach(async function(touid, i){
          await object_permissions.inviteusers(object_id, touid, object_type, role);
          callback(null, JSON.stringify({ message: "Invitation Sent successfully!"}));
        });
      });
    }
    else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    
}


//Function to send Reference Email to join LifeScape
module.exports.inviteFriendByEmail = (event, context, callback) => {

    console.log(event)
    var user_id =  event["path"]["user_id"];
    var to_email =   event["body"]["to_email"];
    console.log(to_email);

    if(user_id != "undefined" && user_id != "" && to_email.length > 0)
    {
      return new Promise(async function(resolve, reject) {
        //Get Sender Detail
        let fromemail = "admin@lifescape.com";
        var userob = require('./lib/model/user.js');
        let user_detail = await userob.getUserDetail(user_id);
        let res = null;

        let username = user_detail.displayName;
        if(user_detail.email)
          fromemail = user_detail.email;

        //Send Mail through AWS SES
        var sesob = require('./lib/model/ses.js');
        
        var subject = 'Live your life to the fullest and share your story with LifeScape';
        var textBody = 'Hi,\r\n' + username + ' has invited you to join Lifescape and share your experience.\r\n\r\n' + 
                      process.env.SITE_URL + '/register\r\n\r\n' +
                      'LifeScape… a revolutionary way to view, experience, display and share your life. We make it easy to capture the important moments of your life and place them in context with the people, events and media that enrich and shape your world.\r\n\r\n' +
                      'Thanks and Regards,\r\nLifeScape Team';
        
        var htmlBody = 'Hi,<BR><BR>' + username + ' has invited you to join Lifescape and share your experience.<BR><BR>' + 
                      '<a href="' + process.env.SITE_URL + '/register">' + process.env.SITE_URL + '/register</a><BR><BR>' +
                      'LifeScape… a revolutionary way to view, experience, display and share your life. We make it easy to capture the important moments of your life and place them in context with the people, events and media that enrich and shape your world.<BR><BR>' +
                      'Thanks and Regards,<BR><BR>LifeScape Team.';
        
        try {
          var result = await sesob.sendEmail(to_email, fromemail, subject, textBody, htmlBody);
          callback(null, JSON.stringify({ message: "Invitation Sent successfully!" }));
        } catch (err) {
          console.error('SES sendEmail error:', err, err.stack);
          return context.fail(JSON.stringify({ statusCode: 500, message: "Invitation is not sent successfully!" }));
        }
      });
    }
    else
      return context.fail(JSON.stringify( { statusCode:400, message: "Invalid request body" } ));
    
}

//Function to send Push Notifications
module.exports.sendSNSNotificaton = (event, context, callback) => {
  console.log(event);

  var user_id = event.user_id;
  var data = event.data;

  if(user_id && data){
    return new Promise(async function(resolve, reject) {

      //Get User Detail
      let user_detail = await userob.getUserDetail(user_id);
      
      if(user_detail.devices.ios != "" && user_detail.devices.ios.length > 0 ){
        //sendSNSpushNotification
        let res = await snsob.sendSNSNotificaton(user_detail.devices.ios, data);
      }

    });
  }

}
