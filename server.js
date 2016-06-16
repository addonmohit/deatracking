var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);

var sql = require('mssql');


var config = {
    user: 'Event',
    password: 'abc@123.com',
     server: 'jdoi3f538j.database.windows.net',
   // server: 'vivek', // You can use 'localhost\\instance' to connect to named instance
    database: 'Event',

    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
}

console.log(config); 

//var dbConn = new sql.Connection(config);
// sql.connect(config, function(err) {


io.sockets.on('connection', function(socket){

    //debugger
	socket.on('join room', function (data) {console.log('joined-->'+data.email);
	    socket.join(data.email); 
	});

	socket.on('leave room', function (data) {console.log('Leaved-->'+data.email);
	    socket.leave(data.email); 
	});
	
    socket.on('message', function (data) {
            console.log('sent==>'+data.id+"  ,  "+data.uname+"  ,  "+data.to+'  ,  '+data.from+'  ,  '+data.msg +','+data.touid + ',' + data.eventid);
            io.sockets.in(data.to).emit('chat message', {id: data.id, uname: data.uname, to:data.to,from: data.from, msg: data.msg , eventid : data.eventid});
          
             //debugger
             var dbConn = new sql.Connection(config);
			 dbConn.connect().then(function () {
        //4.
        var transaction = new sql.Transaction(dbConn);
        //5.
        transaction.begin().then(function () {
            var m=data.msg;
			var id=data.id;
			var  from=data.from;
			var to=data.to;
			var uname=data.uname;
            var toid = data.touid;
            var eventid= data.eventid;
            var request = new sql.Request(transaction);
            //7.
            request.query("INSERT INTO tbl_chatlog (Event_Id,from_uid,to_uid,fromid,toid,message,chat_time) VALUES ("+eventid+","+id+","+toid+",'"+from+"','"+to+"','"+m+"',getDate())").then(function () {
                //8.
                transaction.commit().then(function (recordSet) {
                    console.log(recordSet);
                   dbConn.close();
                }).catch(function (err) {
                    //9.
                    console.log("Error in Transaction Commit " + err);
                    dbConn.close();
                });
            }).catch(function (err) {
                //10.
                console.log("Error in Transaction Begin " + err);
                dbConn.close();
            });
            
        }).catch(function (err) {
            //11.
            console.log(err);
            dbConn.close();
        });
    }).catch(function (err) {
        //12.
        console.log(err);
    });
			
			
			
			
			
			
     });    


	//Group chat
	socket.on('group message', function (data) {console.log('group sent message==>'+data.id+"  ,  "+data.uname+"  ,  "+data.to+'  ,  '+data.from+'  ,  '+data.msg);
		io.sockets.in(data.to).emit('chat group message', {usersemail:data.usersemail,usersname:data.usersname,id: data.id, uname: data.uname, to:data.to,from: data.from, msg: data.msg});
        
	});


    //debugger
    socket.on('get history', function (data) {
      notes=[];


       //debugger

             var dbConn = new sql.Connection(config);
			 dbConn.connect().then(function () {
             var transaction = new sql.Transaction(dbConn);
             transaction.begin().then(function () {
                var m=data.msg;
			    var id=data.id;
			    var  from=data.from;
			    var to=data.to;
			    var uname=data.uname;
                var toid = data.touid;
                var eventid= data.eventid;
                var request = new sql.Request(transaction);

            request.query("SELECT * FROM (SELECT * FROM tbl_chatlog WHERE  Event_Id = "+eventid+" and ((fromid="+id+" or toid="+toid+") or (fromid="+toid+" or toid="+id+")) ORDER BY id desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY)a order by a.id asc").on('result', function(mydata){
                    
             //select * from tbl_chatlog  where Event_Id = 1056 and ((from_uid = 2088 and to_uid = 5109) or (from_uid = 5109 and to_uid = 2088)) ORDER BY id desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;

                // Push results onto the notes array
                    notes.push(mydata)
                })
                .on('end', function(){
                    // Only emit notes after query has been completed
                    socket.emit('fetch history', notes,data.name);
               })

                .then(function (){
               



                transaction.commit().then(function (recordSet) {
                    console.log(recordSet);
                   dbConn.close();
                }).catch(function (err) {
                   
                    console.log("Error in Transaction Commit " + err);
                    dbConn.close();
                });
            }).catch(function (err) {
             
                console.log("Error in Transaction Begin " + err);
                dbConn.close();
            });
            
        }).catch(function (err) {
           
            console.log(err);
            dbConn.close();
        });
    }).catch(function (err) {
       
        console.log(err);
    });
			


       // db.query('SELECT * FROM chatlog WHERE from_uid='+data.toid+' or to_uid='+data.toid+' order by id asc limit 10')
      
        //db.query('SELECT * FROM (SELECT * FROM tbl_chatlog WHERE from_uid='+data.id+' or to_uid='+data.id+' order by id desc limit 10)a order by a.id asc')
        //        .on('result', function(mydata){
        //            // Push results onto the notes array
        //            notes.push(mydata)
        //        })
        //        .on('end', function(){
        //            // Only emit notes after query has been completed
        //            socket.emit('fetch history', notes,data.name);
        //       })



     });


});

//http.listen(5555, function(){
//  console.log('listening on *:5555');
//});

http.listen(443, function(){
  console.log('listening on *:443');
});


// });