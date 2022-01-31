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
  socket.on("register-new-user", (data)=> {
    console.log("got");
    const date = new Date();
    users[socket.id] = new User(data);
    const time = `${date.getHours()}.${date.getMinutes()}`;
    messageArray.push(`[${time}][SERVER]: ${users[socket.id].name} has connected, say hello!`);
    io.emit("new-user", [...messageArray]);
  });

  socket.on("client-message", (data)=>{
    let message = `${data.date}[${data.user}]: ${data.txt}`;
    messageArray.push(message);
    io.emit("server-emit-message", [...messageArray]);
  });

  socket.on("disconnect", ()=> {
    //console.log(`${socket.id} disconnected`);
    messageArray.push(`[SERVER]: ${socket.id} has disconnected.`);
    io.emit("user-disconnected", [...messageArray]);
  });
}); 

server.listen(port, ()=> console.log(`Listening on port ${port}`));