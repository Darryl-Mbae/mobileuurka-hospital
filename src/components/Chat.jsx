import React, { useEffect, useRef, useState } from "react";
import "../css/Chat.css";
import { BsPaperclip } from "react-icons/bs";
import { IoIosSend } from "react-icons/io";
import { MdBubbleChart } from "react-icons/md";

import ReactMarkdown from "react-markdown";
import { useDispatch, useSelector } from "react-redux";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { setChats } from "../reducers/Slices/chatSlice";
import DropdownMenu from "./DropdownMenu";
import Articles from "../assets/images/Articles.png";
import Whatsapp from "../assets/images/whatsapplogo.png";

// Function to clean up text by replacing multiple line breaks with single ones
const cleanText = (text) => {
  if (!text) return text;

  // Replace multiple consecutive line breaks (\n\n\n+) with just two (\n\n)
  // Replace multiple consecutive spaces with single space
  return text
    .replace(/\n{3,}/g, "\n\n") // Replace 3+ line breaks with 2
    .replace(/\r\n{3,}/g, "\r\n\r\n") // Handle Windows line endings
    .replace(/[ \t]{2,}/g, " ") // Replace multiple spaces/tabs with single space
    .trim(); // Remove leading/trailing whitespace
};

const Chat = ({ patient, user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const secret = import.meta.env.VITE_CHATBOT_API
  const chats = useSelector((state) => state.chats.chats);
  const dispatch = useDispatch();
  const endpoint = 'https://healthcare-worker-chatbot-864851114868.europe-west4.run.app'

  // API endpoints for different modes - easy to change
  const API_ENDPOINTS = {
    research: {
      url: `${endpoint}/assistant_chat`, // General Research API
      apiKey: secret
    },
    assistant: {
      url: `${endpoint}/clinical_chat`, // Clinical Assistant API
      apiKey:secret
    }
  };

  const [selectedOption, setSelectedOption] = useState("sabi"); // Default option
  const [sabiMode, setSabiMode] = useState("assistant"); // Default Sabi mode: "research" or "assistant"
  const [showModeSelection, setShowModeSelection] = useState(false);

  // WhatsApp message templates
  const [showWhatsAppTemplates, setShowWhatsAppTemplates] = useState(false);

  const whatsappTemplates = [
    {
      id: 1,
      title: "Appointment Reminder",
      message: "Hello {{1}}, This is a reminder of your appointment with Dr. {{2}} on {{3}} at {{4}}. Please confirm or reschedule below."
    },
    {
      id: 2,
      title: "Weekly Checkup",
      message: "Hello {{1}}, How have you been feeling this week? Have you been having any complaints or aches?"
    },
    {
      id: 3,
      title: "Post Medication Checkup",
      message: "Hello {{1}}, We hope you're recovering well after your visit on {{VisitDate}}. This is a quick check-in to see how you're feeling after starting your new medication. Have you noticed any changes in your symptoms?"
    }
  ];

  // Chat history loading - works for Sabi, show templates for WhatsApp
  useEffect(() => {
    if (selectedOption === "sabi" && user && user.id) {
      getChats();
    } else if (selectedOption === "whatsapp") {
      // Show WhatsApp templates after a brief delay
      setTimeout(() => {
        setShowWhatsAppTemplates(true);
      }, 500);
    }
  }, [user, selectedOption]);

  useEffect(() => {
    if (selectedOption === "sabi" && chats && chats.length > 0) {
      const transformedMessages = transformChatsToMessages(chats);
      setMessages(transformedMessages);

      // Check if we should show mode selection
      checkAndShowModeSelection(transformedMessages);
    } else if (selectedOption === "whatsapp") {
      // For WhatsApp, show templates after messages are loaded or if no messages
      setShowWhatsAppTemplates(true);
    }
  }, [chats, selectedOption]);

  // Filter messages when selectedOption changes - only for Sabi
  useEffect(() => {
    if (selectedOption === "sabi" && user && user.id) {
      getChats();
    } else if (selectedOption === "whatsapp") {
      // Reset messages and show templates for WhatsApp
      setMessages([]);
      setShowWhatsAppTemplates(true);
    }
  }, [selectedOption, patient?.id]); // Refetch when type or patient changes

  async function getChats() {
    try {
      // Build query parameters for filtering
      const params = new URLSearchParams({
        message_type: selectedOption,
      });

      const response = await fetch(`${SERVER}/chatbot/${patient.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      dispatch(setChats(data));
      setMessages(transformChatsToMessages(data));
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  const transformChatsToMessages = (chats) => {
    const result = [];
    console.log(chats);

    chats.forEach((chat) => {
      // Only include messages that match the current selected type
      if (chat.message_type === selectedOption || !chat.message_type) {
        const timestamp = new Date(chat.date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        result.push(
          {
            id: `${chat.chat_id}-user`,
            text: cleanText(chat.inquiry),
            sender: "user",
            timestamp,
            messageType: chat.message_type || "sabi",
          },
          {
            id: `${chat.chat_id}-bot`,
            text: cleanText(chat.response),
            sender: "bot",
            timestamp,
            messageType: chat.message_type || "sabi",
          }
        );
      }
    });

    return result;
  };

  // Check if last message was more than an hour ago
  const checkAndShowModeSelection = (messages) => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === "bot") {
      // Get the last chat from the original data to get the full timestamp
      const lastChat = chats[chats.length - 1];
      if (lastChat) {
        const lastMessageTime = new Date(lastChat.date);
        const currentTime = new Date();
        const hoursDifference = (currentTime - lastMessageTime) / (1000 * 60 * 60);

        if (hoursDifference > 1) {
          setShowModeSelection(true);
        }
      }
    }
  };

  // Handle mode selection
  const handleModeSelection = (mode) => {
    setSabiMode(mode);
    setShowModeSelection(false);

    // Add a bot message confirming the mode selection
    const modeMessage = {
      id: Date.now(),
      text: `Great! I've switched to **${mode.charAt(0).toUpperCase() + mode.slice(1)} mode**. ${mode === "research"
        ? "I'll help you with in-depth research and analysis of medical topics, literature reviews, and evidence-based information."
        : "I'll assist you with clinical decision-making, patient care guidance, and practical healthcare support."
        }`,
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, modeMessage]);
  };

  // Toggle between modes when clicking the badge
  const toggleSabiMode = () => {
    const newMode = sabiMode === "research" ? "assistant" : "research";
    handleModeSelection(newMode);
  };

  // Auto-resize textarea function
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;

      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 150;

      if (scrollHeight > maxHeight) {
        textareaRef.current.style.marginBottom = `0px`;
      } else {
        textareaRef.current.style.marginBottom = `-20px`;
      }

      const container = textareaRef.current.closest(".search-container");
      if (container) {
        container.style.maxHeight = "none";
      }
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end", // Changed from default 'start' to 'end'
      });
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = async () => {
    if (message.trim() === "") return;

    // Add user message to local state
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsBotTyping(true);

    try {
      let botResponseText;

      if (selectedOption === "whatsapp") {
        // Handle WhatsApp message - simulate sending
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

        botResponseText = `✅ WhatsApp message sent successfully to ${patient?.name || 'patient'}!\n\n**Message sent:** "${message}"`;

        // Show templates again after sending
        setTimeout(() => {
          setShowWhatsAppTemplates(true);
        }, 2000);
      } else {
        // Handle Sabi message - use different API based on mode
        const apiConfig = API_ENDPOINTS[sabiMode];
        let requestBody;

        if (sabiMode === "assistant") {
          // Clinical chat API for assistant mode (clinical decision support)
          requestBody = {
            user_id: user.id,
            patient_id: patient?.id,
            schema_name: "org",
            question: message
          };
        } else {
          // Assistant chat API for research mode (general research)
          requestBody = {
            user_id: user.id,
            user_chat: message,
            schema_name: "org"
          };
        }

        const res = await fetch(apiConfig.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiConfig.apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        const data = await res.json();

        if (sabiMode === "assistant") {
          // Clinical chat response format (for assistant mode)
          botResponseText = data.answer || "I couldn't find an answer to your clinical question.";

          // The clinical API already returns well-formatted text with sections
          // No need to reformat since your example shows it's already properly structured
        } else {
          // Assistant chat response format (for research mode)
          botResponseText = data.response || "I couldn't find information on that topic.";
        }
      }

      // Clean the bot response text to remove excessive line breaks
      const cleanedBotText = cleanText(botResponseText);

      // Add bot response immediately to local state
      const botMessage = {
        id: Date.now() + 1,
        text: cleanedBotText,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsBotTyping(false);

      // Save to DB with message type and patient ID
      await sendtoDb(
        user.id,
        message,
        cleanedBotText,
        selectedOption,
        patient?.id
      );
    } catch (err) {
      console.error("Failed to send chat:", err);
      setIsBotTyping(false);
    }
  };

  async function sendtoDb(
    userId,
    userMessage,
    botResponse,
    messageType = "sabi",
    patientId = null
  ) {
    console.log(userId, userMessage, botResponse, messageType, patientId);
    try {
      const response = await fetch(`${SERVER}/chatbot/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          inquery: userMessage,
          response: botResponse,
          message_type: messageType,
          patientId: patientId,
        }),
        credentials: "include",
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setIsBotTyping(false);
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle WhatsApp template selection
  const handleTemplateSelection = (template) => {
    let personalizedMessage = template.message;

    // Replace placeholders with actual values
    if (patient) {
      personalizedMessage = personalizedMessage.replace('{{1}}', patient.name || '[Patient Name]');
    }

    // Replace doctor name with current user
    if (user) {
      personalizedMessage = personalizedMessage.replace('{{2}}', user.name || '[Doctor Name]');
    }

    // For appointment date/time placeholders, use generic placeholders for now
    personalizedMessage = personalizedMessage
      .replace('{{3}}', '[Date]')
      .replace('{{4}}', '[Time]')
      .replace('{{VisitDate}}', '[Visit Date]');

    // Add the template message as a user message
    const userMessage = {
      id: Date.now(),
      text: personalizedMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setShowWhatsAppTemplates(false);

    // Simulate sending WhatsApp message
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        text: `✅ WhatsApp message sent successfully to ${patient?.name || 'patient'}!\n\n**Message sent:** "${personalizedMessage}"`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Show templates again after sending
      setTimeout(() => {
        setShowWhatsAppTemplates(true);
      }, 2000);
    }, 1000);
  };

  const logonOptions = [
    {
      label: "WhatsApp",
      value: "whatsapp",
      image: Whatsapp,
    },
    {
      label: "Sabi",
      value: "sabi",
      image: Articles,
    },
  ];

  return (
    <div className="chat-page">
      <div className="top">
        <div className="chat-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <DropdownMenu
            data={logonOptions}
            selected={selectedOption}
            onChange={(value) => setSelectedOption(value)}
            length="150px"
            fontSize="1em"
            bg="transparent"
          />
          {selectedOption === "sabi" && (
            <div
              onClick={toggleSabiMode}
              style={{
                padding: "4px 8px",
                backgroundColor: sabiMode === "research" ? "#e3f2fd" : "#e8f5e8",
                color: sabiMode === "research" ? "#1976d2" : "#2e7d32",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                transition: "all 0.2s",
                userSelect: "none",
                border: "1px solid",
                borderColor: sabiMode === "research" ? "#bbdefb" : "#c8e6c8"
              }}
              onMouseOver={(e) => {
                e.target.style.opacity = "0.8";
                e.target.style.transform = "scale(0.98)";
              }}
              onMouseOut={(e) => {
                e.target.style.opacity = "1";
                e.target.style.transform = "scale(1)";
              }}
              title={`Click to switch to ${sabiMode === "research" ? "Assistant" : "Research"} mode`}
            >
              {sabiMode === "research" ? "🔬" : "🩺"} {sabiMode.charAt(0).toUpperCase() + sabiMode.slice(1)}
            </div>
          )}
        </div>
      </div>

      <div className="mid">
        {selectedOption === "whatsapp" ? (
          // WhatsApp Mode - Show messages and templates
          <div className="messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
              >
                <div className="message-content">
                  <div className="message-text">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h3: ({ node, ...props }) => (
                          <h3
                            style={{ fontSize: "1.1em", fontWeight: 800 }}
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h3
                            style={{ fontSize: "1.1em", fontWeight: 800 }}
                            {...props}
                          />
                        ),
                        h1: ({ node, ...props }) => (
                          <h3
                            style={{ fontSize: "1.1em", fontWeight: 800 }}
                            {...props}
                          />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong style={{ fontWeight: 600 }} {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em style={{ fontStyle: "italic" }} {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p
                            style={{
                              margin: "0.8em 0",
                              wordWrap: "break-word",
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              lineHeight: "1.5",
                            }}
                            {...props}
                          />
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  <div className="message-time">{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {/* WhatsApp Message Templates */}
            {showWhatsAppTemplates && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="message-text">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {`**WhatsApp Message Templates**

Choose a template to send to ${patient?.name || 'the patient'}`}
                    </ReactMarkdown>

                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      marginTop: "15px",
                      marginBottom:"12px"
                    }}>
                      {whatsappTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelection(template)}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "whitesmoke",
                            color: "black",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            transition: "background-color 0.2s"
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = "#E6E6FA"}
                          onMouseOut={(e) => e.target.style.backgroundColor = "whitesmoke"}
                        >
                          {template.title}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="message-time">
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Regular Chat Mode for Sabi
          messages.length === 0 ? (
            <div className="new">
              {/* Show mode selection for empty state when using Sabi */}
              {selectedOption === "sabi" && (
                <div style={{
                  marginTop: "30px",
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  maxWidth: "400px",
                  margin: "30px auto 0"
                }}>
                  <h5 style={{
                    textAlign: "center",
                    marginBottom: "15px",
                    color: "#333",
                    fontWeight: "600"
                  }}>
                    Choose your assistance mode:
                  </h5>

                  <div style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                    flexWrap: "wrap"
                  }}>
                    <button
                      onClick={() => handleModeSelection("research")}
                      style={{
                        padding: "12px 20px",
                        backgroundColor: sabiMode === "research" ? "#007bff" : "#e9ecef",
                        color: sabiMode === "research" ? "white" : "#495057",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                        minWidth: "140px"
                      }}
                      onMouseOver={(e) => {
                        if (sabiMode !== "research") {
                          e.target.style.backgroundColor = "#dee2e6";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (sabiMode !== "research") {
                          e.target.style.backgroundColor = "#e9ecef";
                        }
                      }}
                    >
                       Research Mode
                    </button>
                    <button
                      onClick={() => handleModeSelection("assistant")}
                      style={{
                        padding: "12px 20px",
                        backgroundColor: sabiMode === "assistant" ? "#28a745" : "#e9ecef",
                        color: sabiMode === "assistant" ? "white" : "#495057",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                        minWidth: "140px"
                      }}
                      onMouseOver={(e) => {
                        if (sabiMode !== "assistant") {
                          e.target.style.backgroundColor = "#dee2e6";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (sabiMode !== "assistant") {
                          e.target.style.backgroundColor = "#e9ecef";
                        }
                      }}
                    >
                       Assistant Mode
                    </button>
                  </div>

                  <div style={{
                    marginTop: "15px",
                    fontSize: "12px",
                    color: "#666",
                    textAlign: "center",
                    lineHeight: "1.4"
                  }}>
                    <div><strong>Research:</strong> In-depth analysis, literature reviews, evidence-based research</div>
                    <div style={{ marginTop: "5px" }}><strong>Assistant:</strong> Clinical decision support, patient care guidance, practical help</div>
                  </div>
                </div>
              )}

              {/* Show WhatsApp templates for empty state when using WhatsApp */}
              {selectedOption === "whatsapp" && showWhatsAppTemplates && (
                <div style={{
                  marginTop: "30px",
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  maxWidth: "500px",
                  margin: "30px auto 0"
                }}>
                  <h5 style={{
                    textAlign: "center",
                    marginBottom: "15px",
                    color: "#333",
                    fontWeight: "600"
                  }}>
                    WhatsApp Message Templates
                  </h5>
                  <p style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    color: "#666",
                    fontSize: "14px"
                  }}>
                    Choose a template to send to {patient?.name || 'the patient'}
                  </p>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    paddingBottom:"12px"
                  }}>
                    {whatsappTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelection(template)}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "whitesmoke",
                          color: "black",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          transition: "background-color 0.2s"
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = "#E6E6FA"}
                        onMouseOut={(e) => e.target.style.backgroundColor = "whitesmoke"}
                      >
                        {template.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
                >
                  <div className="message-content">
                    <div className="message-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          h3: ({ node, ...props }) => (
                            <h3
                              style={{ fontSize: "1.1em", fontWeight: 800 }}
                              {...props}
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <h3
                              style={{ fontSize: "1.1em", fontWeight: 800 }}
                              {...props}
                            />
                          ),
                          h1: ({ node, ...props }) => (
                            <h3
                              style={{ fontSize: "1.1em", fontWeight: 800 }}
                              {...props}
                            />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong style={{ fontWeight: 600 }} {...props} />
                          ),
                          em: ({ node, ...props }) => (
                            <em style={{ fontStyle: "italic" }} {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p
                              style={{
                                margin: "0.8em 0",
                                wordWrap: "break-word",
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                lineHeight: "1.5",
                              }}
                              {...props}
                            />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul
                              style={{
                                margin: "0.7rem",
                                padding: "0",
                                wordWrap: "break-word",
                                wordBreak: "break-word",
                              }}
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li
                              style={{
                                margin: "0",
                                padding: "0",
                                wordWrap: "break-word",
                                wordBreak: "break-word",
                              }}
                              {...props}
                            />
                          ),
                          table: ({ node, ...props }) => (
                            <table
                              style={{
                                margin: "8px 0",
                                borderCollapse: "collapse",
                                width: "100%",
                                fontSize: "0.85em",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                                overflow: "hidden",
                              }}
                              {...props}
                            />
                          ),
                          th: ({ node, ...props }) => (
                            <th
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                backgroundColor: "#f8f9fa",
                                fontWeight: 600,
                                borderBottom: "2px solid #dee2e6",
                                wordWrap: "break-word",
                                wordBreak: "break-word",
                              }}
                              {...props}
                            />
                          ),
                          td: ({ node, ...props }) => (
                            <td
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                borderBottom: "1px solid #eee",
                                wordWrap: "break-word",
                                wordBreak: "break-word",
                                verticalAlign: "top",
                              }}
                              {...props}
                            />
                          ),
                          tr: ({ node, ...props }) => (
                            <tr
                              style={{
                                backgroundColor:
                                  props.children &&
                                    props.children.length % 2 === 0
                                    ? "#f9f9f9"
                                    : "transparent",
                              }}
                              {...props}
                            />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    <div className="message-time">{msg.timestamp}</div>
                  </div>
                </div>
              ))}
              {isBotTyping && (
                <div className="message bot-message">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Show mode selection if last message was more than an hour ago */}
              {selectedOption === "sabi" && showModeSelection && (
                <div className="message bot-message">
                  <div className="message-content">
                    <div className="message-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {`**Welcome back!** It's been a while since our last conversation. 

How would you like me to assist you today?`}
                      </ReactMarkdown>

                      <div style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "15px",
                        flexWrap: "wrap"
                      }}>
                        <button
                          onClick={() => handleModeSelection("research")}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "whitesmoke",
                            color: "black",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            transition: "background-color 0.2s"
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = "#E6E6FA"}
                          onMouseOut={(e) => e.target.style.backgroundColor = "whitesmoke"}
                        >
                          Research Mode
                        </button>
                        <button
                          onClick={() => handleModeSelection("assistant")}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "whitesmoke",
                            color: "black",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            transition: "background-color 0.2s"
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = "#E6E6FA"}
                          onMouseOut={(e) => e.target.style.backgroundColor = "whitesmoke"}
                        >
                          Assistant Mode
                        </button>
                      </div>

                      <div style={{
                        marginTop: "30px",
                        fontSize: "12px",
                        color: "#666",
                        // fontStyle: "italic"
                      }}>
                        <strong>Research:</strong> In-depth analysis, literature reviews, evidence-based research<br />
                        <strong>Assistant:</strong> Clinical decision support, patient care guidance, practical help
                      </div>
                    </div>
                    <div className="message-time">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )
        )}
      </div>

      <div className="bottom">
        <div className="search-container">
          <div className="attach">
            <BsPaperclip />
          </div>
          <div className="search-box">
            <textarea
              ref={textareaRef}
              className="search-input"
              placeholder="Type a message..."
              rows={1}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
        <div className="send" onClick={handleSendMessage}>
          <IoIosSend style={{ color: "white" }} />
        </div>
      </div>
    </div>
  );
};

export default Chat;