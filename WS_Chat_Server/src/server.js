
//Server Vars
var http = require('http');
var fs = require('fs');
var socketio = require('socket.io');
var port = process.env.PORT || process.env.NODE_PORT || 3000;
var index = fs.readFileSync(__dirname + '/../client/client.html');

var users = {};

//Starting HTTP server for client index page
var app = http.createServer(onRequest).listen(port);

console.log("Listening on 127.0.0.1: " + port);

//Pass HTTP server into socketio and get websocket server 
var io = socketio(app);

//HTTP
function createServer(callback)
{
	
}

function onRequest(request, response)
{
	response.writeHead(200,{"Content-Type":"text"});
	response.write(index);
	response.end();
}
//End HTTP

//Websockets

//When a new socket joins
var onJoined = function(socket){
	//Setting EventListener for join
	socket.on("join",function(data){

		var key = data.name;

		users[key] = socket;

		var joinMsg = {
			name: 'server',
			msg: 'There are ' + Object.keys(users).length + ' users online'
		};

		//Send the join message to the socket that just joined
		socket.emit('msg',joinMsg);
		socket.name = data.name;

		socket.join('room1');

		//Send a message to all people in room 1
		socket.broadcast.to('room1').emit('msg',{name:'server',msg:data.name + " has joined the room.",sendTo:"global"});

		//Let the the socket that just joined know they joined
		socket.emit('msg',{name:'server',msg:'You joined the room'});
	});
};

var onMsg = function(socket){
	//Setting EventListener for msgToServer
	socket.on('msgToServer',function(data){
		io.sockets.in('room1').emit('msg',{name:data.name,msg:data.msg});
	});
};

var onUserListRequest = function(socket){
	socket.on('getUserList',function(data){

		var usersList = [];

		for(i = 0; i < Object.keys(users).length; i++)
		{
			usersList.push(Object.keys(users)[i]);
		}

		socket.emit('userList',{userList:usersList});
	});
}

var onPrivateMsg = function(socket){
	socket.on('privateMsg',function(data){
		var msg = "[Private Message] " + data.name + ": " + data.msg;
		var senderMsg = "[Private Message] To " + data.sendTo + ": " + data.msg;
		users[data.sendTo].emit('pvtMsg',msg);
		users[data.name].emit('pvtMsg',senderMsg);
	});
}

var onDisconnect = function(socket){
	socket.on('onDisconnect',function(data){
		console.log("Someone left");
	});
};

//When a socket connects, assign it's delegate functions
io.sockets.on("connection",function(socket){
	//Call these functions to hook up listener events
	onJoined(socket);
	onMsg(socket);
	onUserListRequest(socket);
	onDisconnect(socket);
	onPrivateMsg(socket);
});

console.log("websocket server started");