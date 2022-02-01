const express = require("express");
const http = require("http");
require("dotenv").config();

const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(index);
const messageArray = [];
const users = {};

class User {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
  }
}

const server = http.createServer(app);

const io = require("socket.io")(server, {cors: {origin: "*"}});

io.on("connection", (socket) => {
  // messageArray.push(`[SERVER]: User ${socket.id} has connected!`);
  socket.emit("new-user", socket.id);

  socket.on("register-new-user", (data)=>{
    console.log(data);
    const date = new Date();
    users[socket.id] = new User(data);
    const time = `${date.getHours()}.${date.getMinutes()}`;
    messageArray.push(`[${time}][§/CYAN/SERVER§]: §/GOLD/${users[socket.id].name}§ has connected, say hello!`);
    io.emit("server-emit-message", [...messageArray]);
  });

  socket.on("user-changed-name", (data)=>{
    console.log(data);
    const date = new Date();
    const time = `${date.getHours()}.${date.getMinutes()}`;
    let message = `[${time}][§/CYAN/SERVER§]: User '§/GOLD/${users[socket.id].name}§' has changed their username to '§/GOLD/${data.name}§'`;
    users[socket.id].name = data.name;
    messageArray.push(message);
    io.emit("server-emit-message", [...messageArray]);
  });

  socket.on("client-message", (data)=>{
    let message = `${data.date}[§/GOLD/${data.user}§]: ${data.txt}`;
    messageArray.push(message);
    io.emit("server-emit-message", [...messageArray]);
  });

  socket.on("disconnect", ()=> {
    const date = new Date();
    const time = `${date.getHours()}.${date.getMinutes()}`;
    messageArray.push(`[${time}][§/CYAN/SERVER§]: §/GOLD/${users[socket.id].name}§ has disconnected.`);
    io.emit("user-disconnected", [...messageArray]);
  });
}); 

server.listen(port, ()=> console.log(`Listening on port ${port}`));