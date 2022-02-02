import React, { useState, useEffect, useRef } from "react";
import "./style/App.scss";
import { socket } from "./service/socket";

function App() {
  const [user, setUser] = useState({
    id: "",
    name: "user",
    timeRegistered: "",
  }); // Client data, also stored in server.
  const [userList, setUserList] = useState([]); // Store all users to display a list
  const [inputText, setInputText] = useState(""); // State used for text area
  const [messageArray, setMessageArray] = useState([]); // Messages stored by the server

  // This hook establishes connection to server
  useEffect(() => {
    // We just arrived!
    socket.on("new-user", (data) => {
      // Server is welcoming us
      if (user.id === "") {
        // We don't yet exist, time to change that!
        setUser({ id: data, name: `user-${data.substring(15)}` }); // Define user in client, this triggers another hook further down
      }
    });

    // Server has processed us, time to refresh our memory!
    socket.on("update-user-data", (data) => {
      setUser(data); // We get all sorts of cool information from the server!
    });

    socket.on("server-emit-message", (data) => {
      // Server has sent us a message
      setMessageArray(data); // Replace old array with new one
    });

    socket.on("user-disconnected", (data) => {
      // Someone disconnected from server
      setMessageArray(data); // Replace old array with new one, again.
    });

    socket.on("update-user-list", (data) => {
      setUserList(data);
    });

    return () => socket.disconnect();
  }, []);

  // This hook is used when first connecting to the server
  // And when changing user properties
  useEffect(() => {
    if (user.id !== "" && !(user.dontEmitRegister || user.processedByServer)) {
      if (user.name.includes("user-")) changeUserName(true);
      else socket.emit("register-new-user", user); // Sends request to server, server then saves new user
    } else if (user.dontEmitRegister) {
      socket.emit("user-changed-name", user); // User has changed name, send request to server to confirm it.
    }
  }, [user]);

  // Sends a request to server with all of the text typed into the box.
  function sendMsg() {
    const date = new Date(); // At what time was this message sent
    const time = `[${date.getHours()}.${date.getMinutes()}]`; // Get hours and minutes for neat display
    socket.emit("client-message", {
      txt: inputText,
      user: user.name,
      date: time,
    }); // Send request to server
    setInputText(""); // Empty the textarea
  }

  // This function creates a message with custom color
  function createMessage(data) {
    const spans = data.split("§"); // Create array with text to go through
    return (
      <p className="message">
        {spans.map((span) => {
          // Go through text array
          const styling = span.split("/"); // Separate color tag (eg. GOLD) from actual text
          let color = ""; // Create color variable to store color data
          if (styling.length < 3) color = "no-color";
          // No colour defined, all will be white
          else color = styling[1]; // We know it's here because the first string is empty.
          return (
            // Creates a span with the text and defined color.
            <span style={color !== "no-color" ? { color: color } : {}}>
              {color === "no-color" ? styling[0] : styling[2]}
            </span>
          );
        })}
      </p>
    );
  }

  // Check if username is allowed
  // If not, explain why
  function nameIsNotAllowed(name) {
    switch (true) {
      case name === null:
        return "null";
      case name.length < 3:
        return "tooShort";
      case name.length > 24:
        return "tooLong";
      case name.toUpperCase() === "SERVER":
        return "reserved";
      case name.includes("§"):
        return "specialChar";
      default:
        return "allowed";
    }
  }

  // List of messages the user recieves when trying to input an invalid username
  const usernameConds = {
    tooShort: "Username has to be atleast 3 characters long!",
    tooLong: "Username can't be more than 24 characters long!",
    reserved: "That name is reserved! Pick something else!",
    specialChar: "Username contains special characters not allowed in names!",
  };

  // Simple function to let user change their name
  function changeUserName(emitRegister = false) {
    let newName = prompt("New name?"); // Prompt user for the new name
    // Make sure the name is valid
    while (
      nameIsNotAllowed(newName) !== "allowed" &&
      nameIsNotAllowed(newName) !== "null"
    ) {
      newName = prompt(usernameConds[nameIsNotAllowed(newName)]);
    }
    if (nameIsNotAllowed(newName) === "null") return;
    if (emitRegister) {
      setUser({
        id: user.id,
        name: newName,
        dontEmitRegister: false,
        processedByServer: false,
        timeRegistered: "",
      });
    } else {
      setUser({
        id: user.id,
        name: newName,
        dontEmitRegister: true,
        processedByServer: user.processedByServer,
        timeRegistered: user.timeRegistered,
      });
    }
  }

  const messagesBottom = useRef(null); // Make reference to dummy

  useEffect(() => {
    // This runs when [messageArray] is updated
    messagesBottom.current?.scrollIntoView({ behavior: "smooth" }); // Scrolls smoothly to the bottom of chat.
  }, [messageArray]);

  // This is the chat room itself
  return (
    <div className="main">
      <div className="chat">
        <div className="messages">
          {messageArray.map((txt) => {
            return createMessage(txt);
          })}
          <div ref={messagesBottom} />{" "}
          {/*Dummy div to reference for auto scroll*/}
        </div>
        <p className="registerTime">
          Signed up at: {user.timeRegistered}
          <br></br>
          Username: {user.name}
        </p>
        <div className="userList">
          {Object.values(userList).map((user) => {
            return <p>{user.name}</p>;
          })}
        </div>
        <div className="inputContainer">
          <textarea
            type="text"
            value={inputText}
            className="chatInput"
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                sendMsg();
              }
            }}
          />
          <button className="sendMessage" onClick={() => sendMsg()}>
            Send
          </button>
          <button className="changeUser" onClick={() => changeUserName()}>
            Change username
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
