import React, { useState } from 'react';
import axios from 'axios';

const backendUrl = process.env.BACK_END_URL || 'http://localhost:5000';

function ChatUI() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    
    const sendMessage = async () => {
        const res = await axios.post(`${backendUrl}/ask`, {message});
        setResponse(res.data.response);
    }

    return (
        <div>
            <h1>AI Assistant</h1>
            <input type="text" value={message} onChange={(e) => setMessagee(e.target.value)}/>
            <button onClick={sendMessage}>Send</button>
            <p>Response: {response}</p>
        </div>
    )
}

export default ChatUI;