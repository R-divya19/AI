function Sidebar({ chatHistory, setMessages }) {
  return (
    <div className="sidebar">
      <h3>Recent Chats</h3>
      {chatHistory.map((chat, index) => (
        <div
          key={index}
          className="chat-item"
          onClick={() => setMessages(chat)}
        >
          Chat {index + 1}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;