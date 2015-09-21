
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

//Helper Function
function validateName(username)
{
	for(var key in users)
	{
		if(users[key].username == username)
		{
			return false;
		}
	}

	return true;
}

//Helper function
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Get the socket id from the username
function findSocketIDFromUsername(username)
{
	for (var s in users)
	{
		//console.log("Socket in users " + s + " username " + username);
		if(users[s].username == username)
		{
			return s;
		}
	}

	return null;
}

//When a new socket joins
var onJoined = function(socket){
	//Setting EventListener for join
	socket.on("join",function(data){

		socket.username = data.name;

		if(!validateName(socket.username))
		{
			socket.emit('msg',{name:'Server',msg:'Name already taken. Defaulting name to "Unknown"! Click change to change the username'});
			var num = getRandomInt(0,9000);
			socket.username = "Unknown" + num;
			socket.emit('changeName',{name:socket.username});
		}
		
		var key = socket.id;
	
		//Set up additional listeners
		onMsg(socket);
		onUserListRequest(socket);
		onDisconnect(socket);
		onPrivateMsg(socket);
		validate(socket);
		poke(socket);
	
		//Add the socket at socket id in users
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
		socket.broadcast.to('room1').emit('msg',{name:'Server',msg:data.name + " has joined the room."});
	
		//Let the the socket that just joined know they joined
		socket.emit('msg',{name:'Server',msg:'You joined the room'})
	});
};

//Event listener for poke function
var poke = function(socket){
	socket.on('poke',function(data){
		var currentdate = new Date(); 
		var datetime = "At: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
		io.sockets.in('room1').emit('msg',{name:'Server',msg:socket.username + " has poked the room " + datetime});
	});
};

//Event listener for validate function
var validate = function(socket){
	socket.on('validate',function(data){

		if(validateName(data.newName))
		{
			var socketUsername = socket.id;
			users[socketUsername].username = data.newName;
			socket.emit('changeName',{name:socket.username});
		}
		else
		{
			socket.emit('msg',{name:'Server',msg:'Name already taken. Defaulting name to "Unknown"! Click change to change the username'});
			var num = getRandomInt(0,9000);
			socket.username = "Unknown" + num;
			socket.emit('changeName',{name:socket.username});
		}
	});
};

//Event listener for message function
var onMsg = function(socket){
	//Setting EventListener for msgToServer
	socket.on('msgToServer',function(data){
		io.sockets.in('room1').emit('msg',{name:data.name,msg:data.msg});
	});
};

//Event listener for user list request
var onUserListRequest = function(socket){
	socket.on('getUserList',function(data){

		var usersList = [];

		for(var key in users)
		{
			usersList.push(users[key].username);
		}

		socket.emit('userList',{userList:usersList});
	});
}

//Event listener for private message
var onPrivateMsg = function(socket){
	socket.on('privateMsg',function(data){
		var msg = "[Private Message] " + data.name + ": " + data.msg;
		var senderMsg = "[Private Message] To " + data.sendTo + ": " + data.msg;
		var sendToKey = findSocketIDFromUsername(data.sendTo);
		//console.log(users);
		users[sendToKey].emit('pvtMsg',msg);
		users[socket.id].emit('pvtMsg',senderMsg);
	});
}

//Event listener for onDisconnect
var onDisconnect = function(socket){
	socket.on('disconnect',function(data){

		io.sockets.in('room1').emit('msg',{name:'Server',msg:socket.username + " has left"});

		delete users[socket.id];
	});
};

//When a socket connects, assign it's delegate functions
io.sockets.on("connection",function(socket){
	//Call these functions to hook up listener events
	onJoined(socket);
});

console.log("websocket server started");