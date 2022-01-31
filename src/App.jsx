import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
//import { use } from "../server/routes";
import './style/App.scss';
import {socket} from "./service/socket";
// const ENDPOINT = "http://127.0.0.1:4001";

function App() {
  const [response, setResponse] = useState("");
  const [user, setUser] = useState({id: "", name: "user"});
  const [inputText, setInputText] = useState("");
  const [messageArray, setMessageArray] = useState([]);
  // const socket = socketIOClient(ENDPOINT);

  useEffect(() => {
    socket.on("new-user", data => {
      if(user.id === "") {
        setUser({id: data, name: `user-${data.substring(15)}`});
        socket.emit("register-new-user", user);
      }
    })
    socket.on("server-emit-message", data => {
      setMessageArray(data);
    });

    socket.on("user-disconnected", data => {
      setMessageArray(data);
    });

    return () => socket.disconnect();
  }, []);

  function sendMsg() {
    const date = new Date();
    const time = `[${date.getHours()}.${date.getMinutes()}]`;
    socket.emit("client-message", {txt: inputText, user: user.name, date: time});
    setInputText("");
  }
  return (
    <div className="main">
      <div className="chat">
        <div className="messages">
          {messageArray.map((txt)=>{
            return <p className="message">{txt}</p>
          })}
        </div>
        <div className="inputContainer">
          <textarea type="text" value={inputText} className="chatInput" onChange={e=>setInputText(e.target.value)} />
          <button className="sendMessage" onClick={()=>sendMsg()}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;