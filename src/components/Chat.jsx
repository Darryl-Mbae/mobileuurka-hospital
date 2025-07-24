import React, { useEffect, useRef, useState } from "react";
import "../css/Chat.css";
import { BsPaperclip } from "react-icons/bs";
import { IoIosSend } from "react-icons/io";
import { MdBubbleChart } from "react-icons/md";
import { HiDotsHorizontal } from "react-icons/hi";
// import { addChat, setChats } from "../store/slices/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { setChats } from "../reducers/Slices/chatSlice";

const Chat = ({ patient, user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const chats = useSelector((state) => state.chats.chats);
  const dispatch = useDispatch();

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
  }, [chats]); // Remove dispatch from dependencies

  async function getChats() {
    try {
      const response = await fetch(`${SERVER}/chatbot/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      dispatch(setChats(data)); // Fix: Use dispatch instead of setChats
      setMessages(transformChatsToMessages(data));
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  const transformChatsToMessages = (chats) => {
    const result = [];
    console.log(chats)

    chats.forEach((chat) => {
      const timestamp = new Date(chat.date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      result.push(
        {
          id: `${chat.chat_id}-user`,
          text: chat.inquiry,
          sender: "user",
          timestamp,
        },
        {
          id: `${chat.chat_id}-bot`,
          text: chat.response,
          sender: "bot",
          timestamp,
        }
      );
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
      const botResponseText = data.response || "Okay, I've noted that!";
      sendtoDb(user.id, message, botResponseText);

      // Rest of your bot typing logic...
    } catch (err) {
      console.error("Failed to send chat:", err);
      setIsBotTyping(false);
    }
  };

  async function sendtoDb(userId, userMessage, botResponse) {
    console.log(userId, userMessage, botResponse);
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return (
    <div className="chat-page">
      <div className="top">
        <div className="logon">
          <img src="/logo.png" alt="" />
        </div>
        <HiDotsHorizontal style={{ fontSize: "20px" }} />
      </div>
      <div className="mid">
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

            <div className="example">
              <div className="smlogo">
                <MdBubbleChart />
              </div>
              <div className="title">
                Generate a clinical summary Analyzing symptoms, meds, allergies
                and labwork
              </div>
              <div className="asksabi">Ask Sabi about Patient ...</div>
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map(
              (msg) => (
                (
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
                              <p style={{ margin: "0.5em 0" }} {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul
                                style={{ margin: "0.7rem", padding: "0" }}
                                {...props}
                              />
                            ),
                            li: ({ node, ...props }) => (
                              <li
                                style={{ margin: "0", padding: "0" }}
                                {...props}
                              />
                            ),
                            // Add more custom components as needed
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                      <div className="message-time">{msg.timestamp}</div>
                    </div>
                  </div>
                )
              )
            )}
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
              onKeyPress={handleKeyPress}
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
