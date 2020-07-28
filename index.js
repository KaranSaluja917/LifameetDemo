var express = require('express');
const session = require('express-session');
const bodyParser = require("body-parser");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
let stream = require( './ws/stream' );
var moment = require('moment');
var mysql = require('mysql');


const urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(express.static('./assets'));


let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'law',
    multipleStatements: true
});

app.use(session({
	secret: 'ABCD232#@!LKM454565',
	resave: true,
	saveUninitialized: true,
  maxAge: 24 * 60 * 60 * 1000
}));

// Set up template engine
app.set('view engine','ejs');


// Database Connection
connection.connect(function(err) {
  if (err) {
    return console.error('error: ' + err.message);
  }
  console.log('Connected to the MySQL server.');
});


app.get('/', function(req, res) {
  if (req.session.loggedin) {
    res.render('index',{qs: req.query,user:req.session.username,Sessionlogid:req.session.logid,SessionUser:req.session.usertype,sessionpresent:true});
  }else{
    res.render('index', {qs:req.query, user:'',sessionpresent:false});
  }
   //res.sendfile('views/index.html');
});

// Login View
app.get('/auth-login', function(req, res) {
   res.render('login');
});

// Destroy Current Session
app.get('/logout', function(req, res){
  //res.render('ServeSevaLogin');
  req.session.destroy();

  res.render('index', {qs:req.query, user:'',sessionpresent:false}); //to Redirect Page

});

app.post('/enterroom', urlencodedParser, function(req, res){
  var newusername = req.body.newusername;
  var refroomname = req.body.refroomname;
  connection.query("SELECT * from `tblmeetingroom` where roomname='"+refroomname+"'", function(error, results, fields){
    if (error) {
      res.send({"status":"0","msg":"error ocurred" + error});
    }else{
        if(results.length > 0){
            // Insert Partipant Details in DB
            // Check User is already Joined or not
            connection.query("SELECT * from tblmeetingparticipant where roommeetingrefid='"+refroomname+"' and participantname='"+newusername+"'", function(errors, results, fields){
                if (results.length == 0) {
                  connection.query("INSERT INTO `tblmeetingparticipant`(`roommeetingrefid`, `participantname`) VALUES ('"+refroomname+"','"+newusername+"')", function(errors, results, fields){
                      res.send({"status":"1","msg":"Joined Successfully"});
                      io.of( '/stream' ).on( 'connection', function(socket){
                        socket.emit('newjoining',{
                            'username': newusername
                        });
                      });
                  });
                }else{
                  res.send({"status":"1","msg":"Already entry Available .Joined Successfully"});
                  io.of( '/stream' ).on( 'connection', function(socket){
                    socket.emit('newjoining',{
                        'username': newusername
                    });
                  });
                }
            })
        }else{
          res.send({"status":"0","msg":"Sorry Room Not Found!!!"});
        }
    }
  });
})
app.post('/userlogin', urlencodedParser, function(req, res){
  var MobileNUmber  = req.body.txtUserNameSSK;
  var Password = req.body.txtPasswordSSK;
  connection.query('select logid,personname,mobilenumber,userpassword,usertype from logintbl where mobilenumber=?',MobileNUmber, function(error, results, fields){
    if (error) {
      res.send({"code":400,"msg":"error ocurred" + error})
    }else{
      if(results.length >0){
        if(results[0].userpassword == Password){
          var username = results[0].personname;
          var logid = results[0].logid;
          var usertype = results[0].usertype;

          req.session.loggedin = true;
  				req.session.username = username;
          req.session.logid = logid;
          req.session.usertype = usertype;

          res.send({"code":200,"msg":"login sucessfull","usertype": results[0].usertype,"logid":results[0].logid,"fullname":results[0].fullname});
        }
        else{
          res.send({"code":204,"msg":"Username and password does not match"});
        }
      }
      else{
        res.send({"code":204,"msg":"Username does not exits"});
      }
    }

  });
});
app.get('/StartMeeting', function(req, res){
  if (req.session.loggedin ) {
    console.log(req.query.room, req.session);
    if(req.query.newroom && req.query.newroom=='true'){
      //this is a new meetings//todo : code to store the meeting in db;
      // Check room
      connection.query("select * from tblmeetingroom where roomname='"+req.query.room+"'", function(error, result, fields){
        if (result.length == 0) {
          connection.query("INSERT INTO `tblmeetingroom`(`roomname`, `creatorname`) VALUES ('"+req.query.room+"','"+req.session.username+"')", function(error, results, fields){
            if (error) {
              res.send({"code":400,"msg":"error ocurred" + error})
            }else{
                res.render('StartMeeting',{qs: req.query,user:req.session.username,Sessionlogid:req.session.logid,SessionUser:req.session.usertype,sessionpresent:true});
            }
          });
        }else{
            res.render('StartMeeting',{qs: req.query,user:req.session.username,Sessionlogid:req.session.logid,SessionUser:req.session.usertype,sessionpresent:true});
        }

      });
    }else{
      res.render('StartMeeting',{qs: req.query,user:req.session.username,Sessionlogid:req.session.logid,SessionUser:req.session.usertype,sessionpresent:true});
    }
  }else{
    res.render('StartMeeting',{qs: req.query,user:'',sessionpresent:false});
  }
});

app.get('/TestConnection', function(req, res) {
  res.render('index.html');
});

//Whenever someone connects this gets executed
io.on('connection', function(socket) {
  console.log('A user Connected');
   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', function () {
      console.log('A user disconnected');
   });
});
var client = 0;
var users = [];
io.of( '/stream' ).on( 'connection', function(socket){

      socket.on('subscribe', function(data){
          socket.join(data.room);
          io.of("/stream").in(data.room).clients(function (error, clients) {
              if (error) { throw error; }
              client = clients.length;
          });
      });

        setInterval(function(){
          socket.emit('clientcount',{clients:client});
        }, 2000);
        //socket.emit('clientnickname', { username:users});
      //  socket.emit('clientnickname',{clientname:'Karan Saluja'});
});


http.listen(3000, function() {
   console.log('listening on *:3000');
});
