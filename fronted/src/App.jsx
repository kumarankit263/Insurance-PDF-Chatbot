import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatting, setChatting] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!pdfFile) {
      alert("Please select a PDF file first.");
      return;
    }
    setUploading(true);

    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const res = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      alert(text);
    } catch (err) {
      alert("Error uploading PDF.");
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
  
    const userMessage = { sender: "user", text: chatInput };
    setMessages((msgs) => [...msgs, userMessage]);
    setChatting(true);
  
    try {
      const res = await fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: chatInput }), // ✅ CORRECT FIELD NAME
      });
  
      const data = await res.json();
  
      const botMessage = {
        sender: "bot",
        text:
          typeof data.message === "string"
            ? data.message
            : JSON.stringify(data.message),
      };
  
      setMessages((msgs) => [...msgs, botMessage]);
    } catch (err) {
      console.error("Chat error:", err); // ✅ Debugging
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Error getting response from server." },
      ]);
    } finally {
      setChatInput("");
      setChatting(false);
    }
  };
  

  return (
    <div className="chat-container">
      <h2 className="app-title">Insurance PDF Chatbot</h2>

      <div className="upload-section">
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="file-input"
        />
        <button
          onClick={handleUpload}
          className="upload-button"
          disabled={uploading || !pdfFile}
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>

      <div className="chat-window">
        <div className="message-container">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${
                msg.sender === "user" ? "user-message" : "bot-message"
              }`}
            >
              <div className="message-content">{msg.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about your insurance PDF..."
            className="chat-input"
            disabled={chatting}
          />
          <button
            type="submit"
            className="send-button"
            disabled={chatting || !chatInput.trim()}
          >
            {chatting ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
