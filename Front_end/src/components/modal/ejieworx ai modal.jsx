import React, { useState, useRef, useEffect } from 'react';
import './ejieworx-ai-modal.css'; // We'll create this stylesheet

const EjieworxAIModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { 
      text: "Hello! I'm Ejieworx AI assistant. How can I help you with medicine information today?", 
      sender: 'ai' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Close modal when clicking outside
  const handleOutsideClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    // Add user message
    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages(newMessages);
    setInputText('');

    // Simulate AI response (in a real app, this would be an API call)
    setTimeout(() => {
      setMessages([
        ...newMessages,
        { 
          text: "I'm just a demo AI assistant. In a full implementation, I would provide helpful information about medicines!", 
          sender: 'ai' 
        }
      ]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div className="chat-modal">
        <div className="chat-header">
          <h3>Ejieworx AI Assistant</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              {message.sender === 'ai' && (
                <div className="ai-avatar">AI</div>
              )}
              <div className="message-bubble">
                {message.text}
              </div>
              {message.sender === 'user' && (
                <div className="user-avatar">You</div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
          />
          <button 
            className="send-button"
            onClick={handleSendMessage}
            disabled={inputText.trim() === ''}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default EjieworxAIModal;