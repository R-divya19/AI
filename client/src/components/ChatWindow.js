import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

function ChatWindow({ messages, setMessages, chatHistory, setChatHistory }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: newMessages })
    });

    const data = await res.json();

    const updatedMessages = [
      ...newMessages,
      { role: "assistant", content: data.reply }
    ];

    setMessages(updatedMessages);
    setChatHistory([...chatHistory, updatedMessages]);
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}
        {loading && <div className="message assistant">Typing...</div>}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
        <button onClick={clearChat}>Clear</button>
      </div>
    </div>
  );
}

export default ChatWindow;