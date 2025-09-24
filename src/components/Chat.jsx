import React, { useEffect, useRef, useState } from "react";
import "../css/Chat.css";
import { BsPaperclip } from "react-icons/bs";
import { IoIosSend } from "react-icons/io";

import ReactMarkdown from "react-markdown";
import { useDispatch, useSelector } from "react-redux";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { setChats } from "../reducers/Slices/chatSlice";
import DropdownMenu from "./DropdownMenu";
import Articles from "../assets/images/Articles.png";
import Whatsapp from "../assets/images/whatsapplogo.png";
import { whatsappTemplatesConfig, processTemplateVariables } from "../config/whatsappTemplates.js";
import whatsappService from "../services/whatsappService.js";
import { getTemplateDisplayName } from "../config/templateIdMapping.js";
import { detectMessageType, getMessageHandler, parseFlowData, saveFlowDataToDB } from "../config/messageHandlerConfig.js";
import useWhatsAppMessages from "../hooks/useWhatsAppMessages.js";

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
      apiKey: secret
    }
  };

  // Persist selected option in localStorage
  const [selectedOption, setSelectedOption] = useState(() => {
    return localStorage.getItem('chatSelectedOption') || "sabi";
  });

  // Save selected option to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatSelectedOption', selectedOption);
  }, [selectedOption]);
  const [sabiMode, setSabiMode] = useState("assistant"); // Default Sabi mode: "research" or "assistant"
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const token = localStorage.getItem("access_token");

  // WhatsApp message templates
  const [showWhatsAppTemplates, setShowWhatsAppTemplates] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // WhatsApp 24-hour messaging window
  const [canSendFreeText, setCanSendFreeText] = useState(false);
  const [lastPatientMessageTime, setLastPatientMessageTime] = useState(null);

  // Use templates from configuration
  const whatsappTemplates = whatsappTemplatesConfig;

  // WhatsApp messages hook - only active when in WhatsApp mode
  const {
    messages: whatsappMessages,
    loading: whatsappLoading,
    sendMessage: sendWhatsAppMessage,
    refreshMessages: refreshWhatsAppMessages
  } = useWhatsAppMessages(
    selectedOption === "whatsapp" ? patient?.id : null,
    null,
    selectedOption === "whatsapp" // Enable auto-refresh only in WhatsApp mode
  );

  // Chat history loading - works for Sabi, load WhatsApp messages for WhatsApp
  useEffect(() => {
    if (selectedOption === "sabi" && user && user.id) {
      getChats();
    } else if (selectedOption === "whatsapp") {
      // Transform WhatsApp messages to chat format and show templates
      if (whatsappMessages && whatsappMessages.length > 0) {
        const transformedMessages = transformWhatsAppMessagesToChat(whatsappMessages);
        setMessages(transformedMessages);
        setIsInitialLoad(false);
        setShowWelcome(false);
      } else {
        setMessages([]);
        setIsInitialLoad(false);
        // Keep welcome message for WhatsApp when no messages
        // setShowWelcome(false); - Don't hide welcome immediately
      }

      // Check 24-hour messaging window and show templates only if needed
      if (whatsappMessages && whatsappMessages.length > 0) {
        const canSendFree = checkMessagingWindow(whatsappMessages);
        setShowWhatsAppTemplates(!canSendFree);
      } else {
        // No message history - show templates immediately for first contact
        setCanSendFreeText(false);
        setShowWhatsAppTemplates(true);

        // Hide welcome message after templates are shown
        setTimeout(() => {
          setShowWelcome(false);
        }, 1500);
      }
    }
  }, [user, selectedOption, whatsappMessages]);

  useEffect(() => {
    if (selectedOption === "sabi" && chats && chats.length > 0 && !isLoadingMessages) {
      // Only update messages if not currently loading (to avoid duplicate processing)
      const transformedMessages = transformChatsToMessages(chats);
      setMessages(transformedMessages);

      // Mode selection check is now handled in getChats() after loading completes
    } else if (selectedOption === "whatsapp") {
      // WhatsApp template logic is handled in the main useEffect above
      // Don't automatically show templates here
    }
  }, [chats, selectedOption, isLoadingMessages]);

  // Filter messages when selectedOption changes - only for Sabi
  useEffect(() => {
    if (selectedOption === "sabi" && user && user.id) {
      getChats();
    } else if (selectedOption === "whatsapp") {
      // Transform WhatsApp messages and check messaging window
      if (whatsappMessages && whatsappMessages.length > 0) {
        const transformedMessages = transformWhatsAppMessagesToChat(whatsappMessages);
        setMessages(transformedMessages);

        // Check 24-hour messaging window
        const canSendFree = checkMessagingWindow(whatsappMessages);

        // Show templates only if we can't send free text (>24 hours since last patient message)
        setShowWhatsAppTemplates(!canSendFree);

        // Scroll to bottom when switching to WhatsApp mode with messages
        scrollToBottom();
      } else {
        // No message history - add helpful initial message and show templates
        const welcomeMessage = {
          id: 'whatsapp-welcome',
          text: `**WhatsApp Messaging**\n\nYou can send messages to ${patient?.name || 'this patient'} via WhatsApp.\n\n• Click on a template below to start a conversation\n\n• Need templates anytime? Just type "TEMPLATE" in the message box\n\n`,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages([welcomeMessage]);
        setCanSendFreeText(false); // Show templates for first contact
        // Show templates immediately when no message history
        setShowWhatsAppTemplates(true);
      }
    }
  }, [selectedOption, patient?.id, whatsappMessages]); // Refetch when type, patient, or WhatsApp messages change

  async function getChats() {
    setIsLoadingMessages(true);
    setShowModeSelection(false); // Hide mode selection while loading
    try {
      // Build query parameters for filtering
      const params = new URLSearchParams({
        message_type: selectedOption,
      });

      function authHeaders() {
        const token = localStorage.getItem("access_token");
        return token ? { "Authorization": `Bearer ${token}` } : {};
      }

      const response = await fetch(`${SERVER}/chatbot/${patient.id}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add token header if available
          // ...options.headers,
        },
        credentials: "include",
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      dispatch(setChats(data));

      // Transform messages and check for mode selection after loading
      const transformedMessages = transformChatsToMessages(data);
      setMessages(transformedMessages);

      // Only check for mode selection after messages are loaded
      checkAndShowModeSelection(transformedMessages);

    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoadingMessages(false);
      setIsInitialLoad(false);
      setShowWelcome(false);
    }
  }

  const transformChatsToMessages = (chats) => {
    const result = [];

    chats.forEach((chat, index) => {
      // Only include messages that match the current selected type
      if (chat.message_type === selectedOption || !chat.message_type) {
        const timestamp = new Date(chat.date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Use a unique identifier that combines chat_id with index as fallback
        const uniqueId = chat.chat_id || `fallback-${index}`;

        result.push(
          {
            id: `${uniqueId}-user`,
            text: cleanText(chat.inquiry),
            sender: "user",
            timestamp,
            messageType: chat.message_type || "sabi",
          },
          {
            id: `${uniqueId}-bot`,
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

  // Function to reconstruct template message from parameters
  const reconstructTemplateMessage = (msg) => {
    // Get templateParams directly (it's already an object)
    const templateParams = msg.templateParams || {};

    // Try different ways to identify the template
    let template = null;

    // Method 1: Match by template ID if available
    if (msg.templateId) {
      template = whatsappTemplates.find(t => t.id === msg.templateId);
    }

    // Method 2: Match by template name (convert template name to match title)
    if (!template && msg.templateName) {
      // Try to match by converting template name to readable format
      const readableTemplateName = msg.templateName.replace(/[_-]/g, ' ').toLowerCase();
      template = whatsappTemplates.find(t =>
        t.title.toLowerCase().includes(readableTemplateName) ||
        readableTemplateName.includes(t.title.toLowerCase()) ||
        t.apiEndpoint.includes(msg.templateName.replace(/[_-]/g, '-'))
      );

      // Special case for patient lifestyle
      if (!template && (msg.templateName.includes('lifestyle') || msg.templateName.includes('patient'))) {
        template = whatsappTemplates.find(t => t.title.toLowerCase().includes('lifestyle'));
      }

      // Try matching by API endpoint
      if (!template) {
        template = whatsappTemplates.find(t =>
          t.apiEndpoint.toLowerCase().includes(msg.templateName.toLowerCase()) ||
          msg.templateName.toLowerCase().includes(t.apiEndpoint.replace('/send/', '').replace('-', ''))
        );
      }
    }

    // Method 2.5: Match by template title stored in message (if available)
    if (!template && msg.templateTitle) {
      template = whatsappTemplates.find(t =>
        t.title.toLowerCase() === msg.templateTitle.toLowerCase()
      );
    }

    // Method 3: Since templateName is a hash, and we have numbered params, assume it's appointment reminder
    if (!template && Object.keys(templateParams).some(key => /^\d+$/.test(key))) {
      // Look for appointment reminder template (usually the first one)
      template = whatsappTemplates.find(t =>
        t.title.toLowerCase().includes('appointment') &&
        t.title.toLowerCase().includes('reminder')
      ) || whatsappTemplates[0]; // Fallback to first template
    }

    // Method 4: Match by message body content (if the server returns the actual message)
    if (!template && msg.body) {
      // Check if the message body matches any template message pattern
      template = whatsappTemplates.find(t => {
        // Remove template variables from the template message for comparison
        const templatePattern = t.message.replace(/\{\{[^}]+\}\}/g, '').trim();
        const bodyPattern = msg.body.replace(/\s+/g, ' ').trim();

        // Check if the body contains key phrases from the template
        const templateWords = templatePattern.toLowerCase().split(' ').filter(word => word.length > 3);
        const bodyWords = bodyPattern.toLowerCase().split(' ');

        // If at least 50% of template words are found in the body, it's likely a match
        const matchCount = templateWords.filter(word => bodyWords.some(bodyWord => bodyWord.includes(word))).length;
        return matchCount >= Math.ceil(templateWords.length * 0.5);
      });
    }

    if (!template) {

      // If no template found, create a readable message from templateParams
      if (Object.keys(templateParams).length > 0) {
        // Create a nice message from the parameters
        const values = Object.values(templateParams);
        if (values.length >= 4) {
          // Assume it's appointment reminder format: name, doctor, date, time
          return `Hello ${values[0]}, This is a reminder of your appointment with Dr. ${values[1]} on ${values[2]} at ${values[3]}. Please confirm or reschedule below.`;
        } else {
          // Fallback to showing all parameters
          return Object.values(templateParams).join(', ');
        }
      }

      // Better fallback - use the actual message body if available
      if (msg.body) {
        return msg.body;
      }

      // Fallback based on template name
      if (msg.templateName) {
        const readableName = formatTemplateName(msg.templateName, msg);
        return `${readableName} sent`;
      }

      return 'Template message';
    }

    // Reconstruct the message using template and parameters
    let reconstructedMessage = template.message;

    if (Object.keys(templateParams).length > 0) {
      // Handle numbered parameters (like "1", "2", "3", "4")
      Object.entries(templateParams).forEach(([key, value]) => {
        // Replace {{1}}, {{2}}, etc. with actual values
        const placeholder = `{{${key}}}`;
        reconstructedMessage = reconstructedMessage.replace(
          new RegExp(escapeRegExp(placeholder), 'g'),
          value
        );
      });

      // Also handle named placeholders if template uses them
      if (template.variables) {
        template.variables.forEach((variable, index) => {
          const paramKey = (index + 1).toString(); // Convert to string key
          if (templateParams[paramKey]) {
            reconstructedMessage = reconstructedMessage.replace(
              new RegExp(escapeRegExp(variable.key), 'g'),
              templateParams[paramKey]
            );
          }
        });
      }
    }

    return reconstructedMessage;
  };

  // Helper function to escape regex characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Helper function to format template names nicely
  const formatTemplateName = (templateName, msg = null) => {
    if (!templateName) return 'Template Message';
    return getTemplateDisplayName(templateName);
  };



  // Helper function to save flow data to database
  const saveFlowDataToDatabase = async (flowResponses, patientId, messageData) => {
    try {
      const formData = {
        patient_id: patientId,
        form_type: 'lifestyle_assessment', // Based on the flow data structure
        responses: flowResponses,
        whatsapp_message_id: messageData.MessageSid,
        submitted_at: new Date().toISOString(),
        source: 'whatsapp_flow'
      };

      const response = await fetch(`${SERVER}/forms/lifestyle-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add token header if available
          // ...options.headers,
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error saving flow data:', error);
      return { success: false, error: error.message };
    }
  };

  // Check WhatsApp 24-hour messaging window
  const checkMessagingWindow = (messages) => {
    if (!messages || messages.length === 0) {
      setCanSendFreeText(false);
      setLastPatientMessageTime(null);
      return;
    }

    // Find the most recent inbound (patient) message
    const inboundMessages = messages.filter(msg => msg.direction === 'inbound');

    if (inboundMessages.length === 0) {
      setCanSendFreeText(false);
      setLastPatientMessageTime(null);
      return;
    }

    // Get the most recent patient message
    const lastPatientMessage = inboundMessages[inboundMessages.length - 1];
    const lastMessageTime = new Date(lastPatientMessage.createdAt);
    const currentTime = new Date();
    const hoursDifference = (currentTime - lastMessageTime) / (1000 * 60 * 60);

    setLastPatientMessageTime(lastMessageTime);

    // Can send free text if patient messaged within 24 hours
    const canSendFree = hoursDifference < 24;
    setCanSendFreeText(canSendFree);

    return canSendFree;
  };

  // Transform WhatsApp messages to chat format
  const transformWhatsAppMessagesToChat = (whatsappMessages) => {
    const result = [];

    whatsappMessages.forEach((msg, index) => {
      const timestamp = new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Determine sender based on direction - incoming = patient (bot style), outgoing = you (user style)
      const sender = msg.direction === 'inbound' ? 'bot' : 'user';

      // Format message content - show actual message, not template codes
      let messageText = '';

      if (msg.direction === 'outbound') {
        // Outgoing messages (from you) - show clean message content
        if (msg.body) {
          // If there's a body, use it (this is the most reliable)
          messageText = msg.body;
        } else if (msg.templateName && msg.templateParams) {
          // If it's a template message, try to reconstruct it
          const reconstructed = reconstructTemplateMessage(msg);
          // If reconstruction failed and returned generic message, try alternatives
          if (reconstructed === 'Template message' && msg.templateName) {
            messageText = formatTemplateName(msg.templateName, msg) + ' sent';
          } else {
            messageText = reconstructed;
          }
        } else if (msg.templateName) {
          // Template without params, try to show template name nicely
          messageText = formatTemplateName(msg.templateName, msg) + ' sent';
        } else {
          messageText = 'Media message';
        }

        // Don't add status emojis to message text - they'll be shown as ticks in the timestamp area

      } else {
        // Incoming messages (from patient) - show as patient messages
        if (msg.body) {
          messageText = msg.body;
        } else if (msg.flowData) {
          // Handle WhatsApp Flow responses
          const flowResponses = parseFlowData(msg.flowData);
          if (flowResponses.length > 0) {
            // Create a structured flow response
            messageText = `<div class="flow-response-card">
              <div class="flow-response-header">
                <span class="icon">📋</span>
                Lifestyle Assessment Completed
              </div>`;

            flowResponses.forEach(response => {
              messageText += `
                <div class="flow-response-item">
                  <div class="flow-question">${response.question}</div>
                  <div class="flow-answer">${response.answer}</div>
                </div>`;
            });

            messageText += `
              <div class="flow-timestamp">
                Submitted via WhatsApp Flow
              </div>
            </div>`;

            // Save flow data to database
            saveFlowDataToDatabase(flowResponses, patient?.id, msg).then(result => {
              if (result.success) {
                // Add a success message to chat
                const successMessage = {
                  id: `flow-saved-${Date.now()}`,
                  text: `✅ **Assessment Saved**\n\nLifestyle assessment has been saved to ${patient?.name || 'patient'}'s medical records.`,
                  sender: "bot",
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                };

                setTimeout(() => {
                  setMessages((prev) => [...prev, successMessage]);
                  scrollToBottom();
                }, 1000);
              } else {
                console.error('Failed to save flow data:', result.error);
              }
            });
          } else {
            messageText = 'Flow response received';
          }
        } else if (msg.webhookData) {
          // Handle webhook data using config
          const messageType = detectMessageType(msg.webhookData);
          const handler = getMessageHandler(messageType);
          console.log('Handler found:', handler);

          if (handler && msg.webhookData.FlowData) {
            // Handle flow data with config
            const flowData = msg.webhookData.FlowData;

            const flowResponses = parseFlowData(flowData);
            console.log(flowResponses)

            if (flowResponses.length > 0) {
              // Create a structured flow response using config
              messageText = `<div class="${handler.cardClass}">
                <div class="flow-response-header">
                  <span class="icon">${handler.icon}</span>
                  ${handler.title}
                </div>`;

              flowResponses.forEach(response => {
                messageText += `
                  <div class="flow-response-item">
                    <div class="flow-question">${response.question}</div>
                    <div class="flow-answer">${response.answer}</div>
                  </div>`;
              });

              messageText += `
              
              </div>`;

              // Save flow data to database (only if not already saved)
              const messageId = msg.webhookData.MessageSid || msg.id;
              const savedKey = `flow_saved_${messageId}`;

              if (!localStorage.getItem(savedKey)) {
                localStorage.setItem(savedKey, 'true');
                saveFlowDataToDB(msg.webhookData, patient?.id, SERVER, messageType).then(result => {
                  if (result.success) {
                    // Add a success message to chat
                    const successMessage = {
                      id: `flow-saved-${Date.now()}`,
                      text: `✅ **Assessment Saved**\n\n${result.successMessage}`,
                      sender: "bot",
                      timestamp: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    };

                    setTimeout(() => {
                      setMessages((prev) => [...prev, successMessage]);
                      scrollToBottom();
                    }, 1000);
                  } else {
                    console.error('Failed to save flow data:', result.error);
                  }
                });
              } else {
                console.log('Flow data already saved for this message');
              }
            } else {
              // Show a basic card even if no responses parsed
              messageText = `<div class="${handler.cardClass}">
                <div class="flow-response-header">
                  <span class="icon">${handler.icon}</span>
                  ${handler.title}
                </div>
                <div class="flow-response-item">
                  <div class="flow-question">Status</div>
                  <div class="flow-answer">Response received but no data could be parsed</div>
                </div>
                <div class="flow-timestamp">
                  Submitted via WhatsApp Flow
                </div>
              </div>`;

            }
          } else {
            // Handle other webhook data types
            messageText = 'Form response received';
          }
        } else {
          messageText = 'Media message';
        }
      }

      // Add media attachment info if present
      if (msg.mediaUrl) {
        messageText += `\n\n📎 [Media attachment](${msg.mediaUrl})`;
      }

      result.push({
        id: `whatsapp-${msg.id}`,
        text: cleanText(messageText),
        sender: sender,
        timestamp,
        messageType: "whatsapp",
        whatsappData: msg, // Store original WhatsApp message data
        direction: msg.direction, // Add direction for status indicators
        status: msg.status // Add status for tick colors
      });
    });

    return result.reverse(); // Show newest messages at bottom
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

  // Auto-scroll for both Sabi and WhatsApp messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll when WhatsApp messages are updated (for real-time updates)
  useEffect(() => {
    if (selectedOption === "whatsapp" && whatsappMessages && whatsappMessages.length > 0) {
      // Scroll to bottom when new WhatsApp messages arrive
      scrollToBottom();
    }
  }, [whatsappMessages, selectedOption]);

  // Auto-scroll when welcome message appears
  useEffect(() => {
    if (showWelcome) {
      // Add a small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [showWelcome]);

  // Auto-scroll when WhatsApp templates are shown
  useEffect(() => {
    if (showWhatsAppTemplates && selectedOption === "whatsapp") {
      // Add a small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }, [showWhatsAppTemplates, selectedOption]);

  const scrollToBottom = () => {
    // Immediate scroll to bottom like real WhatsApp - no delay, no smooth animation
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "auto", // Instant scroll, no animation
        block: "end",
      });
    } else {
      // Fallback: scroll the messages container directly
      const messagesContainer = document.querySelector('.chat-page .mid');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = async () => {
    if (message.trim() === "") return;

    // Check if user typed "TEMPLATE" or similar variations to access WhatsApp templates
    const templateTriggers = ["TEMPLATE", "TEMPLATES", "TEMP"];
    if (templateTriggers.includes(message.trim().toUpperCase()) && selectedOption === "whatsapp") {
      // Add user message to show they typed TEMPLATE
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

      // Show templates immediately
      setShowWhatsAppTemplates(true);

      // Add a bot response explaining template access
      // const botMessage = {
      //   id: Date.now() + 1,
      //   text: "📋 **WhatsApp Templates Available**\n\nYou can now select from the available message templates below. These templates are pre-approved and can be sent at any time.",
      //   sender: "bot",
      //   timestamp: new Date().toLocaleTimeString([], {
      //     hour: "2-digit",
      //     minute: "2-digit",
      //   }),
      // };

      // setTimeout(() => {
      //   setMessages((prev) => [...prev, botMessage]);
      //   scrollToBottom();
      // }, 500);

      return; // Don't process as regular message
    }

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

    // Auto-scroll after sending user message
    scrollToBottom();

    try {
      let botResponseText;

      if (selectedOption === "whatsapp") {
        // Check if we can send free text or need to use templates
        if (canSendFreeText) {
          // Within 24-hour window - can send free text
          try {
            const result = await sendWhatsAppMessage(
              {
                id: 'text-message',
                title: 'Text Message',
                apiEndpoint: '/send/text'
              },
              message,
              patient,
              user,
              {}
            );

            if (result.success) {
              botResponseText = `✅ WhatsApp message sent successfully to ${patient?.name || 'patient'}!\n\n**Message sent:** "${message}"`;
            } else {
              botResponseText = `❌ Failed to send WhatsApp message: ${result.error}\n\n**Attempted message:** "${message}"`;
            }
          } catch (error) {
            botResponseText = `❌ Error sending WhatsApp message: ${error.message}`;
          }
        } else {
          // Outside 24-hour window - must use templates
          // Check if we already have a pending template conversation
          const lastMessages = messages.slice(-3); // Check last 3 messages
          const hasRecentTemplateMessage = lastMessages.some(msg =>
            msg.sender === 'user' && msg.text &&
            (msg.text.includes('✅') || whatsappTemplates.some(template =>
              msg.text.includes(template.title) || msg.text.toLowerCase().includes('appointment') ||
              msg.text.toLowerCase().includes('lifestyle') || msg.text.toLowerCase().includes('reminder')
            ))
          );

          const hasUserResponse = lastMessages.some(msg => msg.sender === 'bot' && msg.direction === 'inbound');

          if (hasRecentTemplateMessage && !hasUserResponse) {
            // User sent template but patient hasn't responded yet
            botResponseText = `⏳ **Waiting for Patient Response**\n\nA template message was recently sent to ${patient?.name || 'the patient'}. Please wait for their response to continue the normal conversation.\n\nIf you need to send another template to initiate a new conversation, type "TEMPLATE" or select from the templates below.`;
            setShowWhatsAppTemplates(true);
          } else {
            // Standard 24-hour window message
            botResponseText = `⏰ **24-Hour Window Expired**\n\nFree text messaging is only available within 24 hours of the patient's last message. Please use one of the pre-approved templates below, or type "TEMPLATE" anytime to access them.`;
            setShowWhatsAppTemplates(true);
          }
        }
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

      // Auto-scroll after receiving bot response
      scrollToBottom();

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
    try {
      const response = await fetch(`${SERVER}/chatbot/`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add token header if available
          // ...options.headers,
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

  function formatDate(isoDate) {
    const date = new Date(isoDate);

    // Get day number
    const day = date.getDate();

    // Add suffix (st, nd, rd, th)
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";

    // Month name
    const month = date.toLocaleString("en-US", { month: "long" });

    // Year
    const year = date.getFullYear();

    // Day of week
    const weekday = date.toLocaleString("en-US", { weekday: "long" });

    return `${weekday}, ${day}${suffix} ${month} ${year}`;
  }


  // 👉 "Monday, 8th September 2025"

  // Check if visitDate string contains time information
  const hasTimeInString = (dateString) => {
    if (!dateString) return false;

    // Check if the string contains time patterns like:
    // - "T" followed by time (ISO format: 2024-12-09T14:30:00)
    // - Space followed by time (2024-12-09 14:30:00)
    // - Contains colons indicating time (14:30)
    const timePatterns = [
      /T\d{2}:\d{2}/, // ISO format with T
      /\s\d{1,2}:\d{2}/, // Space followed by time
      /\d{1,2}:\d{2}:\d{2}/, // Full time format
    ];

    return timePatterns.some(pattern => pattern.test(dateString));
  };

  // Handle WhatsApp template selection
  const handleTemplateSelection = (template) => {
    // Check if template requires time input
    if (template.requiresTimeInput) {
      const visitDate = patient?.visits?.[patient?.visits?.length - 1]?.nextVisit;

      if (visitDate) {
        // Check the original string format instead of Date object
        const hasTime = hasTimeInString(visitDate);
        if (!hasTime) {
          // No time specified, show time selector
          setSelectedTemplate(template);
          setShowTimeSelector(true);
          setShowWhatsAppTemplates(false);
          return;
        }
      }
    }

    // Process template normally
    processTemplate(template);
  };

  // Process template with time (if provided)
  const processTemplate = async (template, time = null) => {
    // Validate patient contact info
    const contactValidation = whatsappService.validatePatientContact(patient);
    if (!contactValidation.valid) {
      const errorMessage = {
        id: Date.now(),
        text: `❌ Cannot send WhatsApp message: ${contactValidation.error}`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Prepare additional data for template processing
    const additionalData = {};
    if (time) {
      additionalData.selectedTime = time;
    }

    // Add visit dates to patient data for easier access
    const enhancedPatient = {
      ...patient,
      nextVisit: patient?.visits?.[patient?.visits?.length - 1]?.nextVisit,
      lastVisit: patient?.visits?.[patient?.visits?.length - 1]?.date || patient?.visits?.[0]?.date,
      lastLabDate: patient?.lastLabDate || patient?.visits?.[patient?.visits?.length - 1]?.date,
      currentMedication: patient?.currentMedication || patient?.medications?.[0]?.name
    };



    // Process template variables using the configuration
    const personalizedMessage = processTemplateVariables(template, enhancedPatient, user, additionalData);

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
    setSendingMessage(true);

    // Auto-scroll after sending WhatsApp template message
    scrollToBottom();

    try {
      // Send WhatsApp message using the hook's sendMessage function
      const result = await sendWhatsAppMessage(template, personalizedMessage, enhancedPatient, user, additionalData);

      let botMessage;
      if (result.success) {
        botMessage = {
          id: Date.now() + 1,
          text: `✅ WhatsApp message sent successfully to ${patient?.name || 'patient'}!\n\n**Message ID:** ${result.messageId}\n\n**Message sent:** "${personalizedMessage}"`,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      } else {
        botMessage = {
          id: Date.now() + 1,
          text: `❌ Failed to send WhatsApp message: ${result.error}\n\n**Attempted message:** "${personalizedMessage}"`,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }

      setMessages((prev) => [...prev, botMessage]);
      setSendingMessage(false);

      // Auto-scroll after sending WhatsApp message
      scrollToBottom();

      // Only show templates again if user hasn't responded yet
      // Don't automatically show templates after sending - wait for user response or manual trigger

    } catch (error) {
      console.error('Error processing template:', error);

      const errorMessage = {
        id: Date.now() + 1,
        text: `❌ Error sending WhatsApp message: ${error.message}`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setSendingMessage(false);

      // Auto-scroll after error message
      scrollToBottom();

      // Don't automatically show templates after error - wait for manual trigger
    }
  };

  // Handle time selection
  const handleTimeSelection = () => {
    if (selectedTime && selectedTemplate) {
      processTemplate(selectedTemplate, selectedTime);
      setShowTimeSelector(false);
      setSelectedTemplate(null);
      setSelectedTime("");
    }
  };

  // Cancel time selection
  const cancelTimeSelection = () => {
    setShowTimeSelector(false);
    setSelectedTemplate(null);
    setSelectedTime("");
    setShowWhatsAppTemplates(true);
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
          {selectedOption === "whatsapp" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={refreshWhatsAppMessages}
                disabled={whatsappLoading}
                style={{
                  display: "none",
                  padding: "6px",
                  backgroundColor: "transparent",
                  color: "#333",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: whatsappLoading ? "not-allowed" : "pointer",
                  // display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: whatsappLoading ? 0.6 : 1,
                  transition: "all 0.2s",
                  minWidth: "28px",
                  minHeight: "28px"
                }}
                title="Refresh WhatsApp messages"
                onMouseOver={(e) => {
                  if (!whatsappLoading) {
                    e.target.style.backgroundColor = "#25D366";
                    e.target.style.color = "white";
                  }
                }}
                onMouseOut={(e) => {
                  if (!whatsappLoading) {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#25D366";
                  }
                }}
              >
                {whatsappLoading ? "🔄" : "↻"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mid">
        {selectedOption === "whatsapp" ? (
          // WhatsApp Mode - Show messages and templates
          <div className="messages">
            {/* Welcome message for smooth transition */}
            {showWelcome && messages.length === 0 && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="message-text">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {whatsappMessages && whatsappMessages.length > 0
                        ? `**WhatsApp Chat with ${patient?.name || 'Patient'}**\n\nLoading conversation history...`
                        : `**WhatsApp Messaging**\n\nPreparing message templates for ${patient?.name || 'Patient'}...`
                      }
                    </ReactMarkdown>
                    <div className="typing-indicator" style={{ marginTop: "10px" }}>
                      <span></span>
                      <span></span>
                      <span></span>
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

            {/* Loading skeleton for initial load */}
            {(isInitialLoad && whatsappLoading) && messages.length === 0 && !showWelcome && (
              <>
                <div className="message-skeleton bot-message">
                  <div className="message-content">
                    <div className="skeleton-text">
                      <div className="skeleton-line long"></div>
                      <div className="skeleton-line medium"></div>
                      <div className="skeleton-line short"></div>
                    </div>
                    <div className="skeleton-time"></div>
                  </div>
                </div>
                <div className="message-skeleton user-message">
                  <div className="message-content">
                    <div className="skeleton-text">
                      <div className="skeleton-line medium"></div>
                    </div>
                    <div className="skeleton-time"></div>
                  </div>
                </div>
                <div className="message-skeleton bot-message">
                  <div className="message-content">
                    <div className="skeleton-text">
                      <div className="skeleton-line long"></div>
                      <div className="skeleton-line long"></div>
                      <div className="skeleton-line short"></div>
                    </div>
                    <div className="skeleton-time"></div>
                  </div>
                </div>
              </>
            )}
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
                  <div className="message-time" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}>
                    <span>{msg.timestamp}</span>
                    {/* WhatsApp-style status indicators for outgoing messages */}

                  </div>
                </div>
              </div>
            ))}

            {/* Loading WhatsApp Messages */}
            {whatsappLoading && messages.length === 0 && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="message-text">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {`**Loading WhatsApp Messages...**

Please wait while we load your conversation history with ${patient?.name || 'the patient'}.`}
                    </ReactMarkdown>
                    <div className="typing-indicator" style={{ marginTop: "10px" }}>
                      <span></span>
                      <span></span>
                      <span></span>
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

            {/* Sending Message Loading State */}
            {sendingMessage && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="message-text">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {`**Sending WhatsApp Message...**

Please wait while we send your message to ${patient?.name || 'the patient'}.`}
                    </ReactMarkdown>
                    <div className="typing-indicator" style={{ marginTop: "10px" }}>
                      <span></span>
                      <span></span>
                      <span></span>
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

            {/* WhatsApp Message Templates */}
            {showWhatsAppTemplates && !sendingMessage && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="message-text">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {`**WhatsApp Message Templates**

${!canSendFreeText && whatsappMessages && whatsappMessages.length > 0
                          ? 'You must use a template to continue the conversation.\n\n'
                          : ''}Choose a template to send to ${patient?.name || 'the patient'}`}
                    </ReactMarkdown>

                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      marginTop: "15px",
                      marginBottom: "12px"
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

            {/* Time Selector for Appointment */}
            {showTimeSelector && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="message-text">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {`**Select Appointment Time**

Please select a time for the appointment with ${patient?.name || 'the patient'}:`}
                    </ReactMarkdown>

                    <div style={{
                      marginTop: "15px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "15px"
                    }}>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #ccc",
                          fontSize: "14px",
                          width: "150px"
                        }}
                      />

                      <div style={{
                        display: "flex",
                        gap: "10px"
                      }}>
                        <button
                          onClick={handleTimeSelection}
                          disabled={!selectedTime}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: selectedTime ? "#25D366" : "#ccc",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: selectedTime ? "pointer" : "not-allowed",
                            fontSize: "14px",
                            fontWeight: "500",
                            marginBottom: "20px",
                            transition: "background-color 0.2s"
                          }}
                        >
                          Send
                        </button>

                        <button
                          onClick={cancelTimeSelection}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "whitesmoke",
                            color: "black",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            marginBottom: "20px",

                            transition: "background-color 0.2s"
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = "#E6E6FA"}
                          onMouseOut={(e) => e.target.style.backgroundColor = "whitesmoke"}
                        >
                          Cancel
                        </button>
                      </div>
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
          isLoadingMessages ? (
            // Loading state for Sabi messages
            <div className="message bot-message">
              <div className="message-content">
                <div className="message-text">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {`**Loading Messages...**

Please wait while we load your conversation history with ${patient?.name || 'the patient'}.`}
                  </ReactMarkdown>
                  <div className="typing-indicator" style={{ marginTop: "10px" }}>
                    <span></span>
                    <span></span>
                    <span></span>
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
          ) : messages.length === 0 ? (
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
                  {!canSendFreeText && whatsappMessages && whatsappMessages.length > 0 && (
                    <div style={{
                      textAlign: "center",
                      marginBottom: "15px",
                      padding: "10px",
                      backgroundColor: "#fff3cd",
                      border: "1px solid #ffeaa7",
                      borderRadius: "6px",
                      color: "#856404",
                      fontSize: "13px"
                    }}>
                      ⚠️ <strong>24-hour messaging window has expired.</strong> You must use a template to continue the conversation.
                    </div>
                  )}
                  <p style={{
                    textAlign: "center",
                    marginBottom: "15px",
                    color: "#666",
                    fontSize: "14px"
                  }}>
                    Choose a template to send to {patient?.name || 'the patient'}
                  </p>
                  <div style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    padding: "8px 12px",
                    backgroundColor: "#e3f2fd",
                    border: "1px solid #bbdefb",
                    borderRadius: "6px",
                    color: "#1565c0",
                    fontSize: "12px"
                  }}>
                    💡 <strong>Tip:</strong> You can also type "TEMPLATE" (or "TEMPLATES", "TEMP") in the message box anytime to access these templates
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    paddingBottom: "12px"
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
              {/* Welcome message for smooth transition */}
              {showWelcome && messages.length === 0 && (
                <div className="message bot-message">
                  <div className="message-content">
                    <div className="message-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {`**Sabi AI Assistant**\n\nHello! I'm loading your conversation history with ${patient?.name || 'this patient'}...`}
                      </ReactMarkdown>
                      <div className="typing-indicator" style={{ marginTop: "10px" }}>
                        <span></span>
                        <span></span>
                        <span></span>
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

              {/* Loading skeleton for initial load */}
              {(isInitialLoad || isLoadingMessages) && messages.length === 0 && !showWelcome && (
                <>
                  <div className="message-skeleton bot-message">
                    <div className="message-content">
                      <div className="skeleton-text">
                        <div className="skeleton-line long"></div>
                        <div className="skeleton-line medium"></div>
                        <div className="skeleton-line short"></div>
                      </div>
                      <div className="skeleton-time"></div>
                    </div>
                  </div>
                  <div className="message-skeleton user-message">
                    <div className="message-content">
                      <div className="skeleton-text">
                        <div className="skeleton-line medium"></div>
                      </div>
                      <div className="skeleton-time"></div>
                    </div>
                  </div>
                  <div className="message-skeleton bot-message">
                    <div className="message-content">
                      <div className="skeleton-text">
                        <div className="skeleton-line long"></div>
                        <div className="skeleton-line long"></div>
                        <div className="skeleton-line short"></div>
                      </div>
                      <div className="skeleton-time"></div>
                    </div>
                  </div>
                </>
              )}
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
              placeholder={
                selectedOption === "whatsapp"
                  ? canSendFreeText
                    ? "Type a message ..."
                    : "Type a message.."
                  : "Type a message..."
              }
              rows={1}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={false} // Always allow typing so users can type "TEMPLATE"
              style={{
                opacity: 1, // Always full opacity so users can see the TEMPLATE hint
                cursor: "text"
              }}
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