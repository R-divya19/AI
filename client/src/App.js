import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [renamingId, setRenamingId] = useState(null);

  const abortRef = useRef(null);
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

  /* ================= TOAST ================= */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 1500);
  };

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

  /* ================= DELETE CHAT ================= */
  const deleteChat = (id) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);
    if (activeChat === id) {
      setActiveChat(updated[0]?.id || null);
    }
    showToast("Chat deleted", "success");
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

    abortRef.current = new AbortController();

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedChats.find((c) => c.id === chatId).messages,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.body) throw new Error("No response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let botMessage = { role: "assistant", content: "" };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, botMessage] }
            : chat
        )
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        botMessage.content += decoder.decode(value);

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages.slice(0, -1),
                    { ...botMessage },
                  ],
                }
              : chat
          )
        );
      }
    } catch (error) {
      if (error.name === "AbortError") {
        showToast("Response stopped", "error");
      } else {
        showToast("Server error", "error");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  /* ================= STOP ================= */
  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  };

  /* ================= CLEAR ALL ================= */
  const clearAll = () => {
    setChats([]);
    setActiveChat(null);
    localStorage.removeItem("chats");
    showToast("All chats cleared", "success");
  };

  /* ================= EXPORT ================= */
  const exportChat = () => {
    if (!currentChat) return;

    const text = currentChat.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "chat.txt";
    a.click();

    showToast("Chat exported", "success");
  };

  /* ================= COPY ================= */
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied", "success");
  };

  /* ================= UI ================= */
  return (
    <div className={darkMode ? "container dark" : "container"}>
      {/* Sidebar */}
      <div className="sidebar">
        <button onClick={createChat}>+ New Chat</button>
        <button onClick={() => setSettingsOpen(true)}>⚙ Settings</button>

        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chatItem ${chat.id === activeChat ? "active" : ""}`}
          >
            {renamingId === chat.id ? (
              <input
                value={chat.title}
                autoFocus
                onChange={(e) =>
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === chat.id
                        ? { ...c, title: e.target.value }
                        : c
                    )
                  )
                }
                onBlur={() => setRenamingId(null)}
              />
            ) : (
              <span
                onClick={() => setActiveChat(chat.id)}
                onDoubleClick={() => setRenamingId(chat.id)}
              >
                {chat.title}
              </span>
            )}

            <button
              className="copyBtn"
              onClick={() => deleteChat(chat.id)}
            >
              cancel
            </button>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="chatArea">
        <div className="messages">
          {currentChat?.messages.map((msg, i) => (
            <div key={i} className={msg.role}>
              <span>{msg.content}</span>
              <button
                className="copyBtn"
                onClick={() => copyText(msg.content)}
              >
                copy
              </button>
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

          {loading && (
            <button onClick={stop} className="stopBtn">
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      {settingsOpen && (
        <div className="settingsPanel">
          <h3>Settings</h3>
          <button onClick={() => setDarkMode(!darkMode)}>
            Toggle Dark Mode
          </button>
          <button onClick={exportChat}>Export Chat</button>
          <button onClick={clearAll}>Clear All Chats</button>
          <button onClick={() => setSettingsOpen(false)}>Close</button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;