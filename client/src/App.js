import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_URL = "https://divya-ai-chatbot.onrender.com/api/chat"; 
// If your backend route is /chat instead of /api/chat,
// change above line to:
// https://divya-ai-chatbot.onrender.com/chat

function App() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, loading]);

  /* ================= LOAD STORAGE ================= */
  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem("chats"));
    const savedDark = JSON.parse(localStorage.getItem("darkMode"));

    if (savedChats?.length) {
      setChats(savedChats);
      setActiveChat(savedChats[0].id);
    }

    if (savedDark !== null) {
      setDarkMode(savedDark);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const currentChat = chats.find((c) => c.id === activeChat);

  /* ================= CREATE CHAT ================= */
  const createChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat.id);
    return newChat.id;
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    let chatId = activeChat;
    let updatedChats = [...chats];

    if (!chatId) {
      chatId = createChat();
      updatedChats = [
        { id: chatId, title: input.slice(0, 20), messages: [] },
        ...chats,
      ];
    }

    updatedChats = updatedChats.map((chat) =>
      chat.id === chatId
        ? {
            ...chat,
            title:
              chat.messages.length === 0
                ? input.slice(0, 20)
                : chat.title,
            messages: [...chat.messages, { role: "user", content: input }],
          }
        : chat
    );

    setChats(updatedChats);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      const botReply = {
        role: "assistant",
        content: data.reply,
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, botReply] }
            : chat
        )
      );
    } catch (error) {
      console.error(error);
      alert("Server error. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className={darkMode ? "container dark" : "container"}>
      <div className="sidebar">
        <button onClick={createChat}>+ New Chat</button>
        <button onClick={() => setDarkMode(!darkMode)}>
          Toggle Dark Mode
        </button>

        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chatItem ${chat.id === activeChat ? "active" : ""}`}
            onClick={() => setActiveChat(chat.id)}
          >
            {chat.title}
          </div>
        ))}
      </div>

      <div className="chatArea">
        <div className="messages">
          {currentChat?.messages.map((msg, i) => (
            <div key={i} className={msg.role}>
              <span>{msg.content}</span>
            </div>
          ))}

          {loading && (
            <div className="assistant">
              <span>Typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="inputArea">
          <input
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type message..."
          />

          <button onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;