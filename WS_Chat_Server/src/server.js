

var http = require('http');
var fs = require('fs');
var socketio = require('socket.io');

var port = process.env.PORT || process.env.NODE_PORT || 3000;

var index = fs.readFileSync(__dirname + '/../client/client.html');

var app = http.createServer(onRequest).listen(port);

console.log("Listening on 127.0.0.1: " + port);

function createServer(callback)
{
	
}

function onRequest(request, response)
{
	response.writeHead(200,{"Content-Type":"text"});
	response.write(index);
	response.end();
}