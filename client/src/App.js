import React, { useState } from "react";
import axios from "axios";
import logo from "./logo.svg";
import "./App.css";

const backendUrl = process.env.BACK_END_URL || 'http://localhost:5000';

function App() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const sendMessage = async () => {
    setResponse("Thinking... 🤔"); // Show a loading message
    
    try {
      const res = await axios.post(`${backendUrl}/api/chat`, { message });
      setResponse(res.data.response);
    } catch (error) {
      console.error("Error: ", error);
      setResponse("Error: No response from the server!")
    }
  };

  return (
    <div>
      <h1>AI Assistant</h1>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
      <p>Response: {response}</p>
    </div>
  );
}

export default App;
