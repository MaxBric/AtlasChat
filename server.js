var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
const lastMessages = [];
const MAX_HISTORY_SIZE = 10;

function getClientsUsernames() {
  const onlineList = [];
  const clients = io.sockets.sockets;

  // Parse connected users
  Object.entries(clients).map(socket => {
    if (socket[1].username) onlineList.push(socket[1].username);
  });

  return onlineList;
}

function addToHistoric(newMsg) {
  if (lastMessages.length < MAX_HISTORY_SIZE) {
    lastMessages.push(newMsg)
  } else {
    lastMessages.shift();
    lastMessages.push(newMsg)
  }
}

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.color = "#000000";
  socket.emit('historic', lastMessages);

  socket.on('disconnect', function () {
    console.log('user disconnected');
    io.emit('new user', socket.username + " disconnected");
    io.emit('onlineList', getClientsUsernames());
  });

  socket.on('message', function (msg) {
    let msgDate = new Date();
    const newMsg = {
      username: socket.username,
      text: msg.text,
      date: msgDate.getHours() + ':' + msgDate.getMinutes(),
      color: socket.color
    };

    io.emit('message', newMsg);
    addToHistoric(newMsg);
  });

  socket.on('username', function (username) {
    socket.username = username;
    socket.broadcast.emit('new user', username + " is now connected");
    io.emit('onlineList', getClientsUsernames());
  });

  socket.on('color', function (color) {
    socket.color = color;
  });
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});
