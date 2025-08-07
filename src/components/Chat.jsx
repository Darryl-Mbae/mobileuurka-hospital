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
import Whatsapp from "../assets/images/WhatsApp logo.png";
import Articles from "../assets/images/Articles.png";

// Function to clean up text by replacing multiple line breaks with single ones
const cleanText = (text) => {
  if (!text) return text;
  
  // Replace multiple consecutive line breaks (\n\n\n+) with just two (\n\n)
  // Replace multiple consecutive spaces with single space
  return text
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ line breaks with 2
    .replace(/\r\n{3,}/g, '\r\n\r\n')  // Handle Windows line endings
    .replace(/[ \t]{2,}/g, ' ')  // Replace multiple spaces/tabs with single space
    .trim();  // Remove leading/trailing whitespace
};

const Chat = ({ patient, user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const chats = useSelector((state) => state.chats.chats);
  const dispatch = useDispatch();

  const [selectedOption, setSelectedOption] = useState("sabi"); // Default option
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      getChats();
    }
  }, [user]);

  useEffect(() => {
    if (chats && chats.length > 0) {
      const transformedMessages = transformChatsToMessages(chats);
      setMessages(transformedMessages);
    }
  }, [chats]);

  // Filter messages when selectedOption changes
  useEffect(() => {
    if (user && user.id) {
      getChats();
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
        // Handle WhatsApp message - dummy response for testing
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

        const whatsappResponses = [
          "✅ WhatsApp message sent successfully to patient!",
          "📱 Message delivered via WhatsApp",
          "✉️ WhatsApp notification sent to patient's phone",
          "🔔 Patient will receive this message on WhatsApp shortly",
          "📲 WhatsApp message queued for delivery",
        ];

        // Get random response
        botResponseText =
          whatsappResponses[
            Math.floor(Math.random() * whatsappResponses.length)
          ];
      } else {
        // Handle Sabi message - existing chatbot logic
        const res = await fetch(
          "https://healthcare-worker-chatbot-864851114868.europe-west4.run.app",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": "EKg84btQ8ySs3bbbUIm8Ut5y9uznO4Ookmsd-PGxwdg",
            },
            body: JSON.stringify({
              user_id: user.id,
              user_chat: message,
              schema_name: "org",
            }),
          }
        );

        const data = await res.json();
        botResponseText = data.response || "Okay, I've noted that!";
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

  const handleExampleClick = (exampleText) => {
    setMessage(exampleText);
    setShowSuggestions(false); // Hide suggestions after clicking
    // Optionally auto-send the message
    // handleSendMessage();
  };

  const renderSuggestions = () => (
    <div className="examples">
      {selectedOption === "sabi" ? (
        <>
          <div
            className="example"
            onClick={() =>
              handleExampleClick("Generate a clinical summary for this patient")
            }
          >
            <div className="smlogo">
              <MdBubbleChart />
            </div>
            <div className="title">Generate a clinical summary</div>
            <div className="subtitle">
              Analyzing symptoms, meds, allergies and labwork
            </div>
          </div>
          <div
            className="example"
            onClick={() =>
              handleExampleClick(
                "What are the latest vital signs for this patient?"
              )
            }
          >
            <div className="smlogo">
              <MdBubbleChart />
            </div>
            <div className="title">Check vital signs</div>
            <div className="subtitle">
              Review recent measurements and trends
            </div>
          </div>
          
        </>
      ) : (
        <>
          <div
            className="example"
            onClick={() =>
              handleExampleClick("Send appointment reminder to patient")
            }
          >
            <div className="smlogo">
              <MdBubbleChart />
            </div>
            <div className="title">Appointment reminder</div>
            <div className="subtitle">Send via WhatsApp to patient</div>
          </div>
          <div
            className="example"
            onClick={() =>
              handleExampleClick("Send medication reminder to patient")
            }
          >
            <div className="smlogo">
              <MdBubbleChart />
            </div>
            <div className="title">Medication reminder</div>
            <div className="subtitle">Remind patient to take medications</div>
          </div>
         
        </>
      )}
    </div>
  );

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
        <div className="chat-header">
          <DropdownMenu
            data={logonOptions}
            selected={selectedOption}
            onChange={(value) => setSelectedOption(value)}
            length="150px"
            fontSize="1em"
            bg="transparent"
          />
        </div>
        <div className="header-actions">
          <button
            className="suggestions-toggle"
            onClick={() => setShowSuggestions(!showSuggestions)}
            title="Toggle suggestions"
          >
            <MdBubbleChart />
          </button>
          {/* <HiDotsHorizontal style={{ fontSize: "20px" }} /> */}
        </div>
      </div>
      <div className="mid">
        {/* Suggestions section - always available when toggled */}
        {showSuggestions && (
          <div className="suggestions-overlay">
           
            {renderSuggestions()}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="new">
            <div className="b-logo">
              <img src="/logo.png" alt="logo" />
            </div>
            <h3 className="gradient-text">Hi, {user?.name?.split(" ")[0]}</h3>
            <h4>Can I help you with anything?</h4>
            <div className="bouncing-loader">
              <div className="bouncing-dot"></div>
              <div className="bouncing-dot"></div>
              <div className="bouncing-dot"></div>
            </div>

            {/* Show suggestions by default when no messages */}
            {renderSuggestions()}
          </div>
        ) : (
          <div className="messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${
                  msg.sender === "user" ? "user-message" : "bot-message"
                }`}
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
                        // Customize how certain elements are rendered
                        strong: ({ node, ...props }) => (
                          <strong style={{ fontWeight: 600 }} {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em style={{ fontStyle: "italic" }} {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p style={{ 
                            margin: "0.8em 0", 
                            wordWrap: "break-word",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            lineHeight: "1.5"
                          }} {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            style={{ 
                              margin: "0.7rem", 
                              padding: "0",
                              wordWrap: "break-word",
                              wordBreak: "break-word"
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
                              wordBreak: "break-word"
                            }}
                            {...props}
                          />
                        ),
                        // Table components with proper spacing
                        table: ({ node, ...props }) => (
                          <table
                            style={{
                              margin: "8px 0",
                              borderCollapse: "collapse",
                              width: "100%",
                              fontSize: "0.85em",
                              border: "1px solid #ddd",
                              borderRadius: "6px",
                              overflow: "hidden"
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
                              wordBreak: "break-word"
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
                              verticalAlign: "top"
                            }}
                            {...props}
                          />
                        ),
                        tr: ({ node, ...props }) => (
                          <tr
                            style={{
                              backgroundColor: props.children && props.children.length % 2 === 0 ? "#f9f9f9" : "transparent"
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
            <div ref={messagesEndRef} />
          </div>
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
