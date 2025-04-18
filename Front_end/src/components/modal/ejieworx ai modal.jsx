import React, { useState, useRef, useEffect } from "react";
import "./ejieworx-ai-modal.css";
import { sendMessageToLlama, getGenerationProgress } from "./ejieworx_services";

// Helper function to format AI messages with proper styling
const formatMessageText = (text) => {
  if (!text) return "";

  // Replace various line breaks for consistent processing
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // First, identify and group list sections
  let formattedHtml = "";
  let inList = false;
  let listType = null;
  let listBuffer = "";

  // Process text line by line
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Empty line - close any open list and add to output
      if (inList) {
        formattedHtml += `<div class="${listType}-list">${listBuffer}</div>`;
        listBuffer = "";
        inList = false;
      }
      formattedHtml += '<div class="ai-spacing"></div>';
      continue;
    }

    // Check for numbered list items
    const numberedMatch = line.match(/^(\d+\.)(\s+)(.+)$/);
    if (numberedMatch) {
      if (!inList || listType !== "numbered") {
        // Close previous list if any
        if (inList) {
          formattedHtml += `<div class="${listType}-list">${listBuffer}</div>`;
          listBuffer = "";
        }
        inList = true;
        listType = "numbered";
      }

      // Add formatted numbered item
      listBuffer += `<div class="list-item"><span class="list-number">${
        numberedMatch[1]
      }</span><span class="list-content">${formatInlineText(
        numberedMatch[3]
      )}</span></div>`;
      continue;
    }

    // Check for bullet list items
    const bulletMatch = line.match(/^\*{1,2}(\s+)(.+)$/);
    if (bulletMatch) {
      if (!inList || listType !== "bullet") {
        // Close previous list if any
        if (inList) {
          formattedHtml += `<div class="${listType}-list">${listBuffer}</div>`;
          listBuffer = "";
        }
        inList = true;
        listType = "bullet";
      }

      // Add formatted bullet item
      listBuffer += `<div class="list-item"><span class="list-bullet">•</span><span class="list-content">${formatInlineText(
        bulletMatch[2]
      )}</span></div>`;
      continue;
    }

    // Not a list item - close any open list
    if (inList) {
      formattedHtml += `<div class="${listType}-list">${listBuffer}</div>`;
      listBuffer = "";
      inList = false;
    }

    // Regular paragraph
    formattedHtml += `<div class="ai-paragraph">${formatInlineText(
      line
    )}</div>`;
  }

  // Close any remaining open list
  if (inList) {
    formattedHtml += `<div class="${listType}-list">${listBuffer}</div>`;
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
      className="ai-content"
    />
  );
};

// Format inline text elements like bold, italics, etc.
const formatInlineText = (text) => {
  if (!text) return "";

  // Format bold text (**text**) with styled spans
  text = text.replace(/\*\*(.*?)\*\*/g, '<span class="bold-text">$1</span>');

  // Format italic text (*text*) with styled spans (single asterisk)
  text = text.replace(/\*([^*]+)\*/g, '<span class="italic-text">$1</span>');

  // Format key terms/highlighted text
  text = text.replace(/`([^`]+)`/g, '<span class="highlight-text">$1</span>');

  return text;
};

const EjieworxAIModal = ({ isOpen, onClose }) => {
  const initialMessage = {
    text: "Hello! I'm the Scanseta AI assistant powered by Llama 3.1-8B-Instruct. How can I help you with medicine information today?",
    sender: "ai",
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Track animation state
  const [animationClass, setAnimationClass] = useState(""); // Current animation class
  const [progress, setProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const messagesEndRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Auto-scroll to the bottom when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // Start polling for progress when generating a response
  const startProgressPolling = () => {
    setProgress(0);
    // Poll every 500ms for progress updates
    progressIntervalRef.current = setInterval(async () => {
      try {
        const progressData = await getGenerationProgress();
        setProgress(progressData.progress || 0);

        // If complete, stop polling
        if (progressData.progress >= 100) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      } catch (error) {
        console.error("Error polling for progress:", error);
      }
    }, 500);
  };

  // Handle modal animation on open/close
  useEffect(() => {
    if (isOpen) {
      setAnimationClass("modal-bounce-in");
      setIsAnimating(true);
    } else if (isAnimating) {
      setAnimationClass("modal-bounce-out");

      // Wait for animation to complete before fully closing
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setAnimationClass("");
      }, 500); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isAnimating]);

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (inputText.trim() === "" || isLoading) return;

    const userMessage = inputText.trim();
    // Add user message
    const newMessages = [...messages, { text: userMessage, sender: "user" }];
    setMessages(newMessages);
    setInputText("");

    setIsLoading(true);
    startProgressPolling();

    // Add a "thinking" message that will be replaced
    const thinkingId = Date.now();
    setMessages([
      ...newMessages,
      { text: "Thinking...", sender: "ai", id: thinkingId, isThinking: true },
    ]);

    try {
      // Send message to Llama model
      const response = await sendMessageToLlama(userMessage, messages);

      // Replace "thinking" message with actual response
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === thinkingId
            ? {
                text:
                  response.response || "Sorry, I couldn't generate a response.",
                sender: "ai",
              }
            : msg
        )
      );
    } catch (error) {
      // Handle error by replacing the thinking message
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === thinkingId
            ? {
                text: "Sorry, there was an error processing your request. Please try again.",
                sender: "ai",
              }
            : msg
        )
      );
      console.error("Error sending message to Llama:", error);
    } finally {
      setIsLoading(false);
      setProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Show confirmation modal before resetting chat
  const handleNewChatClick = () => {
    if (isLoading) return; // Don't reset while loading
    setShowConfirmModal(true);
  };

  // Reset conversation to initial state after confirmation
  const handleNewChat = () => {
    setMessages([initialMessage]);
    setInputText("");
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setShowConfirmModal(false); // Close the modal
  };

  // Cancel new chat action
  const handleCancelNewChat = () => {
    setShowConfirmModal(false);
  };

  const handleOutsideClick = (e) => {
    if (e.target.className === "modal-overlay") {
      // Use animation for close
      setAnimationClass("modal-bounce-out");
      setTimeout(() => {
        onClose();
      }, 450); // Slightly less than animation duration
    }
  };

  if (!isOpen) return null;
  // Determine if modal should be rendered
  const shouldRenderModal = isOpen || isAnimating;
  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div className={`chat-modal ${animationClass}`}>

        {shouldRenderModal && (
          <div className="chat-header">
            <h3>Scanseta AI Assistant (Llama 3.1-8B)</h3>
            <button
              className="close-button"
              onClick={() => {
                setAnimationClass("modal-bounce-out");
              setTimeout(() => onClose(), 450);
            }}
          >
            ×
          </button>
        </div>
        )}
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                message.sender === "user" ? "user-message" : "ai-message"
              }`}
            >
              {message.sender === "ai" && <div className="ai-avatar">AI</div>}
              <div
                className={`message-bubble ${
                  message.isThinking ? "thinking" : ""
                }`}
              >
                {message.isThinking ? (
                  <>
                    {message.text}
                    {progress < 100 && (
                      <div className="progress-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${progress}%` }}
                        ></div>
                        <span className="progress-text">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="formatted-content">
                    {message.sender === "ai"
                      ? formatMessageText(message.text)
                      : message.text}
                  </div>
                )}
              </div>
              {message.sender === "user" && (
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
          <div className="chat-buttons">
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={inputText.trim() === "" || isLoading}
            >
              {isLoading ? "Generating..." : "Send"}
            </button>
            <div className="button-divider"></div>
            <button
              className="new-chat-button"
              onClick={handleNewChatClick}
              disabled={isLoading}
              title="Start a new conversation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h18" />
                <path d="M12 3v18" />
              </svg>
              New
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h4>Start New Conversation?</h4>
            </div>
            <div className="confirm-modal-content">
              <p>
                Are you sure you want to start a new conversation? This will
                clear your current chat history.
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button className="cancel-button" onClick={handleCancelNewChat}>
                Cancel
              </button>
              <button className="confirm-button" onClick={handleNewChat}>
                Yes, Start New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EjieworxAIModal;
