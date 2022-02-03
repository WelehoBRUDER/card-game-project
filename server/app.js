const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(index);
app.use(cors());
app.use(express());
const messageArray = [];
const users = {};

class User {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.timeRegistered = user.timeRegistered;
    this.dontEmitRegister = user.dontEmitRegister;
    this.processedByServer = user.processedByServer;
  }
}

const server = http.createServer(app);

const io = require("socket.io")(server, { 
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  // messageArray.push(`[SERVER]: User ${socket.id} has connected!`);
  socket.emit("new-user", {id: socket.id, users: users});

  socket.on("register-new-user", (data)=>{
    const date = new Date();
    const time = `${
      ("0" + date.getHours()).slice(-2).toString() +
      "." +
      ("0" + date.getMinutes()).slice(-2).toString()
    }`;
    users[socket.id] = new User({...data, timeRegistered: time, processedByServer: true});
    messageArray.push({text: `[${time}][§/CYAN/SERVER§]: §/GOLD/${users[socket.id].name}§ has connected, say hello!`});
    io.emit("server-emit-message", [...messageArray]);
    socket.emit("update-user-data", users[socket.id]);
    io.emit("update-user-list", users);
  });

  socket.on("user-changed-name", (data)=>{
    const date = new Date();
    const time = `${
      ("0" + date.getHours()).slice(-2).toString() +
      "." +
      ("0" + date.getMinutes()).slice(-2).toString()
    }`;
    let message = `[${time}][§/CYAN/SERVER§]: §/GOLD/${users[socket.id].name}§ has changed their username to §/GOLD/${data.name}§`;
    users[socket.id].name = data.name;
    messageArray.push({text: message});
    io.emit("server-emit-message", [...messageArray]);
    io.emit("update-user-list", users);
  });

  socket.on("client-message", (data)=>{
    if(data.txt.startsWith("/")) command(data, socket);
    else {
      let message = `${data.date}[§/GOLD/${data.user}§]: ${data.txt}`;
      messageArray.push({text: message});
      io.emit("server-emit-message", [...messageArray]);
    }
  });

  socket.on("disconnect", ()=> {
    const date = new Date();
    const time = `${
      ("0" + date.getHours()).slice(-2).toString() +
      "." +
      ("0" + date.getMinutes()).slice(-2).toString()
    }`;
    let name = users[socket.id];
    if(name) name = name.name;
    else if(!name) name = "Guest";
    messageArray.push({text: `[${time}][§/CYAN/SERVER§]: §/GOLD/${name}§ has disconnected.`});
    delete users[socket.id];
    io.emit("user-disconnected", [...messageArray]);
    io.emit("update-user-list", users);
  });
}); 

function command(data, socket) {
  let data_text = data.txt;
  data_text = data_text.replace("/", "");
  const commandType = data_text.split(" ")[0];
  const commandTarget = data_text.split(" ")[1];
  console.log(commandType);
  console.log(commandTarget);
  if(commandType.toUpperCase() === "WHISPER") {
    let target = Object.values(users).find(user=>user.name === commandTarget);
    if(!target) return socket.emit("wrong-user-name-in-whisper", commandTarget);
    else if(target) {
      data_text = data_text.replace(commandType, "").replace(commandTarget, "");
      const date = new Date();
      const time = `${
        ("0" + date.getHours()).slice(-2).toString() +
        "." +
        ("0" + date.getMinutes()).slice(-2).toString()
      }`;
      let msg = `[${time}]§/#49CDEE/[whisper to ${target.name}][${users[socket.id].name}]: ${data_text}§`;
      messageArray.push({text: msg, whisper: {from: socket.id, to: target.id}});
      io.emit("server-emit-message", [...messageArray]);
    }
  }
}

server.listen(port, ()=> console.log(`Listening on port ${port}`));