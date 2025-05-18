// src/components/DLMBot.js
import React, { useState, useRef, useEffect } from "react";

const DLMBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const API_BASE =
    process.env.REACT_APP_API_URL || "https://inkquizly.onrender.com";

  // auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleToggle = () => {
    if (!open && messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "👋 Hello! Welcome to InkQuizly! Ask me anything regarding the app, and I’ll do my best to help.",
        },
      ]);
    }
    setOpen((o) => !o);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { sender: "user", text }]);
    setInput("");
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const { reply } = await res.json();
      setMessages((m) => [...m, { sender: "bot", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          sender: "bot",
          text: "⚠️ Could not reach the InkQuizly Bot service. Please try again.",
        },
      ]);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  // circle button
  const circle = {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "rgb(115,165,204)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "transform 0.2s",
    transform: open ? "scale(1.1)" : "scale(1)",
    zIndex: 1000,
  };

  // chat window base
  const windowStyle = {
    position: "fixed",
    bottom: "4rem",
    right: "1rem",
    width: "320px",
    maxHeight: "450px",
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "Roboto, sans-serif",
    transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
    zIndex: 1000,
  };

  const headerBar = {
    background: "rgb(46,49,146)",
    color: "#ffffff",
    padding: "0.5rem 1rem",
    fontWeight: 600,
    fontSize: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const closeBtn = {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "1.2rem",
    cursor: "pointer",
  };

  const msgs = {
    flex: 1,
    padding: "0.75rem 1rem",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  };

  const inputStyle = {
    border: "none",
    borderTop: "1px solid #eee",
    padding: "0.75rem 1rem",
    fontSize: "0.95rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const bubble = (sender) => ({
    maxWidth: "75%",
    alignSelf: sender === "user" ? "flex-end" : "flex-start",
    background: sender === "user" ? "rgb(115,165,204)" : "#f1f3f5",
    color: sender === "user" ? "#ffffff" : "#333333",
    borderRadius: sender === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
    padding: "0.6rem 0.9rem",
    fontSize: "0.9rem",
    lineHeight: 1.4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  });

  const infoIconStyle = {
    marginLeft: "0.5rem",
    cursor: "default",
    fontSize: "1rem",
    lineHeight: 1,
    position: "relative",
    userSelect: "none",
  };

  const tooltipTextStyle = {
    visibility: "hidden",
    width: "200px",
    backgroundColor: "#333",
    color: "#fff",
    textAlign: "center",
    borderRadius: "4px",
    padding: "8px",
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1001,
    opacity: 0,
    transition: "opacity 0.2s",
    fontSize: "0.85rem",
  };

  return (
    <>
      {/* Chat bubble toggle */}
      <div style={circle} onClick={handleToggle}>
        <img
          src="/chatbot_icon.png"
          alt="Chat"
          style={{ width: "24px", height: "24px" }}
        />
      </div>

      {/* Chat window */}
      <div
        style={{
          ...windowStyle,
          opacity: open ? 1 : 0,
          transform: open ? "scale(1)" : "scale(0.8)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Header with info icon */}
        <div style={headerBar}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span>InkQuizly Bot</span>
            <div
              style={infoIconStyle}
              onMouseEnter={(e) => {
                const tip = e.currentTarget.querySelector(".tooltip-text");
                tip.style.visibility = "visible";
                tip.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                const tip = e.currentTarget.querySelector(".tooltip-text");
                tip.style.visibility = "hidden";
                tip.style.opacity = "0";
              }}
            >
              ℹ️
              <div className="tooltip-text" style={tooltipTextStyle}>
                {/* ← Edit this text */}
                Please note that the InkQuizly Bot may occasionally provide
                incorrect responses or misinterpret your inquiries. If you
                require clarification or additional support, please contact our
                team using the email address at the bottom of this page
              </div>
            </div>
          </div>
          <button style={closeBtn} onClick={handleToggle}>
            &times;
          </button>
        </div>

        {/* Messages */}
        <div style={msgs}>
          {messages.map((m, i) => (
            <div key={i} style={bubble(m.sender)}>
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <textarea
          style={inputStyle}
          rows={1}
          placeholder="Type your question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={onKey}
        />
      </div>
    </>
  );
};

export default DLMBot;
