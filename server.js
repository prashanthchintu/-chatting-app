var express = require('express');
var app = express();
var server = require('http').Server(app);
var client = require('socket.io')(server).sockets;
var path = require('path');
var ip = require('ip');
var mongo = require('mongodb').MongoClient;

//connect to mongo
mongo.connect('mongodb://localhost/chatdb', function(err,db){
    if(err){
        throw err;
    }
    console.log('mongo connected');
    //connect to socket
    client.on('connection', function(socket){
        console.log('A new user is connected.');
        let chat = db.collection('chats');

        // create functio to send status
        sendStatus = function (s) {
            socket.emit('status',s);
        }
        //get the chats from mongo collection
        chat.find().limit(100).sort({_id: 1}).toArray(function (err,res){
            if(err){
                throw err;
            }
            //emit the messages
            socket.emit('output',res);

        })
        //handle the user inouts
        socket.on('input',function (data){
            let name = data.name;
            let message = data.message;
             //check for name and message
            if(name == '' || message == ''){
                //send error status
                sendStatus('please enter a name and message')

            }  else {
                //insert messages
                chat.insert({ name: name, message: message }, function () {
                    client.emit('output', [data]);

                    //send status objects
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    })


                })

            }
        })

        //handle clear
        socket.on('clear', function(data){
            //Remove all chats from collection
            chat.remove({},function () {
                socket.emit('cleared.')
            })
        })

       

       
        
       
        socket.on('disconnect',function(){
            console.log('A user is disconnected');
        })
    })
        
})
var port = 8080;
// chat 1
// var users = [];

// io.on('connection', function(socket){
//     console.log('New connectionmade.');
//     socket.on('disconnect',function(){
//         console.log('A user is disconnected');
//     })
// })

app.get('/',function(req,res){
    res.sendfile('index.html');
})

server.listen(port, function(){
    console.log('Server is listening at http:// ' + ip.address() + ":" +port);
})