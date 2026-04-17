import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import './AIChatBot.css';

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', content: "Hi! I'm SafarAI. How can I help you plan your perfect travel today?" }
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const newHistory = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newHistory);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: "I'm your AI travel assistant. I can help you build itineraries, find cheap destinations, and pack smart!"
      }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button className="chat-bot-trigger glass" onClick={() => setIsOpen(true)}>
          <span className="chat-tooltip">Ask SafarAI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-bot-window glass-panel">
          <div className="chat-bot-header">
            <div className="chat-bot-title">
              <Sparkles size={18} className="chatbot-icon" />
              <span>SafarAI Assistant</span>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-bot-messages">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="message-bubble">{msg.content}</div>
              </div>
            ))}
          </div>
          
          <form className="chat-bot-input" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask me anything about travel..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="send-btn" disabled={!message.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
