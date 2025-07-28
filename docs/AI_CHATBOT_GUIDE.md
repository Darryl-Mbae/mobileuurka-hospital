# AI Chatbot Implementation Guide

> **Purpose**: Complete guide to implementing and troubleshooting the AI healthcare chatbot  
> **Prerequisites**: React, Redux, API integration experience  
> **Estimated Reading Time**: 60 minutes

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Implementation](#core-implementation)
4. [API Integration Patterns](#api-integration-patterns)
5. [Redux Integration](#redux-integration)
6. [Message Processing](#message-processing)
7. [Chat History Management](#chat-history-management)
8. [UI Components and Styling](#ui-components-and-styling)
9. [Error Handling](#error-handling)
10. [Performance Optimization](#performance-optimization)
11. [Troubleshooting Chatbot Integration Issues](#troubleshooting-chatbot-integration-issues)
12. [Testing Strategies](#testing-strategies)
13. [Security Considerations](#security-considerations)
14. [Related Documentation](#related-documentation)

## Overview

The MobileUurka application features an AI-powered healthcare chatbot named "Sabi" that provides clinical assistance to healthcare workers. This guide covers the implementation details, integration patterns, and troubleshooting for the AI chatbot functionality.

**Important Note**: This is an AI chatbot that communicates with an external healthcare API, not a live user-to-user chat system.

## Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chat.jsx      │    │   chatSlice.js   │    │  External API   │
│   (Frontend)    │◄──►│   (Redux State)  │    │  (Healthcare)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Local DB      │    │   Message UI     │    │   Backend API   │
│   (Chat History)│    │   (React Comp)   │    │   (Storage)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **User Input** → Chat component captures message
2. **Local State** → Message added to local state immediately
3. **External API** → Message sent to healthcare AI service
4. **Response Processing** → AI response received and processed
5. **Database Storage** → Chat saved to backend database
6. **Redux Update** → Global state updated with new chat
7. **UI Update** → Interface reflects new messages

## Core Implementation

### Chat Component Structure

The main chat functionality is implemented in `src/components/Chat.jsx`:

```jsx
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { setChats } from "../reducers/Slices/chatSlice";

const Chat = ({ patient, user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const chats = useSelector((state) => state.chats.chats);
  const dispatch = useDispatch();

  // Component implementation...
};
```

### Key Features

#### 1. Message State Management

```jsx
// Local message state for immediate UI updates
const [messages, setMessages] = useState([]);

// Transform database chats to UI message format
const transformChatsToMessages = (chats) => {
  const result = [];
  
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
```

#### 2. External Healthcare API Integration

```jsx
const handleSendMessage = async () => {
  if (message.trim() === "") return;

  // Add user message to local state immediately
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
    // Call external healthcare AI API
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
    
    // Save to database
    sendtoDb(user.id, message, botResponseText);
    
  } catch (err) {
    console.error("Failed to send chat:", err);
    setIsBotTyping(false);
  }
};
```

#### 3. Database Storage Integration

```jsx
async function sendtoDb(userId, userMessage, botResponse) {
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
```

#### 4. Chat History Retrieval

```jsx
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
    dispatch(setChats(data));
    setMessages(transformChatsToMessages(data));
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}
```

## Redux Integration

### Chat Slice Implementation

The chat state is managed using Redux Toolkit in `src/reducers/Slices/chatSlice.js`:

```jsx
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  chats: [],
  selectedChat: null,
};

const chatSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    addChat: (state, action) => {
      const exists = state.chats.some(
        (chat) => chat.chat_id === action.payload.chat_id
      );
      if (!exists) state.chats.push(action.payload);
    },
  },
});

export const { setChats, addChat } = chatSlice.actions;
export default chatSlice.reducer;
```

### State Management Pattern

```jsx
// In Chat component
const chats = useSelector((state) => state.chats.chats);
const dispatch = useDispatch();

// Update global state when chats are fetched
useEffect(() => {
  if (chats && chats.length > 0) {
    const transformedMessages = transformChatsToMessages(chats);
    setMessages(transformedMessages);
  }
}, [chats]);

// Dispatch action to update global state
dispatch(setChats(data));
```

## Message Processing

### Markdown Support

The chatbot supports rich text responses using ReactMarkdown:

```jsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// In message rendering
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeRaw]}
  components={{
    h3: ({ node, ...props }) => (
      <h3 style={{ fontSize: "1.1em", fontWeight: 800 }} {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h3 style={{ fontSize: "1.1em", fontWeight: 800 }} {...props} />
    ),
    h1: ({ node, ...props }) => (
      <h3 style={{ fontSize: "1.1em", fontWeight: 800 }} {...props} />
    ),
    strong: ({ node, ...props }) => (
      <strong style={{ fontWeight: 600 }} {...props} />
    ),
    p: ({ node, ...props }) => (
      <p style={{ margin: "0.5em 0" }} {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul style={{ margin: "0.7rem", padding: "0" }} {...props} />
    ),
  }}
>
  {msg.text}
</ReactMarkdown>
```

### Typing Indicator

```jsx
// Typing state management
const [isBotTyping, setIsBotTyping] = useState(false);

// Show typing indicator while waiting for response
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
```

## UI Components

### Auto-Resizing Textarea

```jsx
const textareaRef = useRef(null);

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
  }
};

useEffect(() => {
  adjustTextareaHeight();
}, [message]);
```

### Keyboard Handling

```jsx
const handleKeyPress = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
};

// In textarea component
<textarea
  ref={textareaRef}
  className="search-input"
  placeholder="Type a message..."
  rows={1}
  value={message}
  onChange={handleChange}
  onKeyPress={handleKeyPress}
/>
```

### Auto-Scroll to Bottom

```jsx
const messagesEndRef = useRef(null);

const scrollToBottom = () => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }
};

useEffect(() => {
  scrollToBottom();
}, [messages]);

// In messages container
<div ref={messagesEndRef} />
```

## Configuration

### Environment Variables

Required environment variables in `.env`:

```bash
# Backend API URL
VITE_SERVER_URL=http://localhost:8080/api/v1

# Socket URL (if using real-time features)
VITE_SOCKET_URL=http://localhost:8080
```

### API Endpoints

The chatbot integrates with these endpoints:

1. **External Healthcare AI API**:
   - URL: `https://healthcare-worker-chatbot-864851114868.europe-west4.run.app`
   - Method: POST
   - Headers: `X-API-Key`, `Content-Type: application/json`

2. **Internal Chat Storage API**:
   - GET `/chatbot/` - Retrieve chat history
   - POST `/chatbot/` - Save new chat interaction

## Styling

### CSS Classes

Key CSS classes for chatbot styling:

```css
.chat-page {
  /* Main container */
  width: 88%;
  height: 95%;
  display: flex;
  flex-direction: column;
  background: var(--section);
}

.user-message {
  /* User message styling */
  align-self: flex-end;
  background-color: rgb(121, 180, 154);
  color: white;
  border-bottom-right-radius: 5px;
}

.bot-message {
  /* Bot message styling */
  align-self: flex-start;
  background-color: white;
  color: #050505;
  border-bottom-left-radius: 5px;
}

.typing-indicator {
  /* Typing animation */
  display: flex;
  padding: 10px 0;
}
```

## Integration Patterns

### Adding Chatbot to New Pages

1. **Import the Chat component**:
```jsx
import Chat from '../components/Chat';
```

2. **Pass required props**:
```jsx
<Chat patient={currentPatient} user={currentUser} />
```

3. **Ensure Redux store includes chatSlice**:
```jsx
// In store configuration
import chatReducer from './reducers/Slices/chatSlice';

const store = configureStore({
  reducer: {
    chats: chatReducer,
    // other reducers...
  },
});
```

### Custom Message Handling

To extend message processing:

```jsx
// Custom message transformer
const customTransformMessage = (message, type) => {
  return {
    id: Date.now(),
    text: message,
    sender: type,
    timestamp: new Date().toLocaleTimeString(),
    // Add custom fields
    metadata: {
      processed: true,
      category: 'clinical'
    }
  };
};
```

### Error Handling Integration

```jsx
// Enhanced error handling
const handleSendMessage = async () => {
  try {
    // ... existing code
  } catch (error) {
    console.error("Chat error:", error);
    
    // Add error message to chat
    const errorMessage = {
      id: Date.now(),
      text: "Sorry, I'm having trouble connecting. Please try again.",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString(),
      isError: true
    };
    
    setMessages(prev => [...prev, errorMessage]);
    setIsBotTyping(false);
  }
};
```

## Troubleshooting

### Common Issues

#### 1. Messages Not Displaying

**Problem**: Chat messages don't appear in the UI
**Causes**:
- Redux state not properly connected
- Message transformation failing
- Component not re-rendering

**Solutions**:
```jsx
// Check Redux connection
const chats = useSelector((state) => state.chats.chats);
console.log("Redux chats:", chats);

// Verify message transformation
const transformedMessages = transformChatsToMessages(chats);
console.log("Transformed messages:", transformedMessages);

// Force re-render
useEffect(() => {
  if (chats && chats.length > 0) {
    setMessages(transformChatsToMessages(chats));
  }
}, [chats]);
```

#### 2. API Connection Failures

**Problem**: External healthcare API not responding
**Causes**:
- Network connectivity issues
- Invalid API key
- CORS configuration problems

**Solutions**:
```jsx
// Add comprehensive error handling
try {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.HEALTHCARE_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data;
} catch (error) {
  console.error("API Error:", error);
  // Fallback response
  return { response: "I'm having trouble connecting. Please try again." };
}
```

#### 3. Chat History Not Loading

**Problem**: Previous conversations don't appear
**Causes**:
- Database connection issues
- Authentication problems
- Incorrect user ID

**Solutions**:
```jsx
// Debug chat loading
async function getChats() {
  console.log("Fetching chats for user:", user?.id);
  
  try {
    const response = await fetch(`${SERVER}/chatbot/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched chats:", data);
    
    dispatch(setChats(data));
  } catch (error) {
    console.error("Error fetching chats:", error);
  }
}
```

#### 4. Typing Indicator Stuck

**Problem**: Typing indicator doesn't disappear
**Causes**:
- API call never completes
- Error in response handling
- State not properly updated

**Solutions**:
```jsx
// Add timeout for typing indicator
const handleSendMessage = async () => {
  setIsBotTyping(true);
  
  // Set timeout as fallback
  const typingTimeout = setTimeout(() => {
    setIsBotTyping(false);
  }, 30000); // 30 second timeout

  try {
    // ... API call
    clearTimeout(typingTimeout);
    setIsBotTyping(false);
  } catch (error) {
    clearTimeout(typingTimeout);
    setIsBotTyping(false);
    console.error("Chat error:", error);
  }
};
```

#### 5. Markdown Not Rendering

**Problem**: Bot responses show raw markdown instead of formatted text
**Causes**:
- ReactMarkdown not properly imported
- Missing plugins
- Component configuration issues

**Solutions**:
```jsx
// Verify ReactMarkdown setup
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Check component usage
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeRaw]}
  components={{
    // Custom component overrides
  }}
>
  {msg.text}
</ReactMarkdown>
```

### Performance Optimization

#### 1. Message List Virtualization

For large chat histories:

```jsx
import { FixedSizeList as List } from 'react-window';

const MessageList = ({ messages }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <Message message={messages[index]} />
    </div>
  );

  return (
    <List
      height={400}
      itemCount={messages.length}
      itemSize={80}
    >
      {Row}
    </List>
  );
};
```

#### 2. Debounced Auto-Resize

```jsx
import { debounce } from 'lodash';

const debouncedResize = useCallback(
  debounce(() => {
    adjustTextareaHeight();
  }, 100),
  []
);

useEffect(() => {
  debouncedResize();
}, [message, debouncedResize]);
```

### Testing

#### Unit Tests

```jsx
// Chat.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import Chat from '../Chat';
import { store } from '../../config/store';

const mockUser = { id: 1, name: 'Test User' };

test('sends message when send button clicked', async () => {
  render(
    <Provider store={store}>
      <Chat user={mockUser} />
    </Provider>
  );

  const input = screen.getByPlaceholderText('Type a message...');
  const sendButton = screen.getByRole('button');

  fireEvent.change(input, { target: { value: 'Test message' } });
  fireEvent.click(sendButton);

  await waitFor(() => {
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
```

#### Integration Tests

```jsx
// Test API integration
test('handles API response correctly', async () => {
  // Mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ response: 'Bot response' }),
    })
  );

  // Test component behavior
  // ...
});
```

## Quick Reference

### Essential Chatbot Setup

| Step | Code | Guide Section |
|------|------|---------------|
| **1. Import Component** | `import Chat from "../components/Chat";` | [Core Implementation](#core-implementation) |
| **2. Add to JSX** | `<Chat patient={patient} user={user} />` | [Integration Patterns](#integration-patterns) |
| **3. Configure Redux** | Import and use `chatSlice` | [Redux Integration](#redux-integration) |
| **4. Style Component** | Import `"../css/Chat.css"` | [Styling](#styling) |

### Common Chatbot Patterns

```javascript
// Basic chatbot integration
const PatientPage = ({ patient }) => {
  const currentUser = useSelector(state => state.user.currentUser);
  
  return (
    <div className="patient-page">
      <div className="chat-section">
        <Chat patient={patient} user={currentUser} />
      </div>
    </div>
  );
};

// Message handling
const handleSendMessage = async (message) => {
  setIsBotTyping(true);
  try {
    const response = await fetch(`${SERVER}/chatbot/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        inquiry: message,
        patientId: patient.patient_id,
        userId: user.user_id
      })
    });
    const data = await response.json();
    // Handle response...
  } catch (error) {
    console.error("Chat error:", error);
  } finally {
    setIsBotTyping(false);
  }
};
```

### API Integration Quick Reference

| Endpoint | Method | Purpose | Guide Section |
|----------|--------|---------|---------------|
| `/chatbot/` | POST | Send new message | [API Integration](#api-integration-patterns) |
| `/chats/:patientId` | GET | Load chat history | [Message Processing](#message-processing) |

### Troubleshooting Quick Fixes

| Issue | Quick Fix | Detailed Section |
|-------|-----------|------------------|
| **Messages Not Sending** | Check API endpoint and credentials | [Troubleshooting](#troubleshooting) |
| **Chat History Not Loading** | Verify patient ID and API response | [Troubleshooting](#troubleshooting) |
| **Markdown Not Rendering** | Check ReactMarkdown imports and plugins | [Message Processing](#message-processing) |
| **Typing Indicator Stuck** | Ensure `setIsBotTyping(false)` in finally block | [Troubleshooting](#troubleshooting) |

### AI Chatbot State Management

```javascript
// Redux state structure for AI chatbot conversations
const chatState = {
  chats: [], // Array of AI chatbot conversation objects
  selectedChat: null
};

// Common selectors for AI chatbot
const chats = useSelector(state => state.chats.chats);
const selectedChat = useSelector(state => state.chats.selectedChat);

// Common actions for AI chatbot conversations
dispatch(setChats(newChats)); // Set all AI chat history
dispatch(addChat(newChat));   // Add new AI conversation
```

**Note**: This chat slice is specifically for AI healthcare chatbot conversations with the external API, not for user-to-user messaging (which would be a separate feature).

## Best Practices

### 1. Error Boundaries

Wrap the Chat component in an error boundary:

```jsx
class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chat error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with the chat.</div>;
    }

    return this.props.children;
  }
}
```

### 2. Message Sanitization

Always sanitize user input:

```jsx
import DOMPurify from 'dompurify';

const sanitizeMessage = (message) => {
  return DOMPurify.sanitize(message, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};
```

### 3. Accessibility

Ensure the chat is accessible:

```jsx
<div 
  className="messages" 
  role="log" 
  aria-live="polite" 
  aria-label="Chat messages"
>
  {messages.map((msg) => (
    <div 
      key={msg.id}
      role="article"
      aria-label={`${msg.sender} message`}
    >
      {msg.text}
    </div>
  ))}
</div>
```

### 4. Rate Limiting

Implement client-side rate limiting:

```jsx
const useRateLimit = (limit = 5, window = 60000) => {
  const [requests, setRequests] = useState([]);

  const canMakeRequest = () => {
    const now = Date.now();
    const recentRequests = requests.filter(time => now - time < window);
    return recentRequests.length < limit;
  };

  const makeRequest = () => {
    if (canMakeRequest()) {
      setRequests(prev => [...prev, Date.now()]);
      return true;
    }
    return false;
  };

  return { canMakeRequest, makeRequest };
};
```

This comprehensive guide covers all aspects of the AI chatbot implementation, from basic setup to advanced troubleshooting and optimization techniques.
## Rel
ated Documentation

### Essential Reading
- **[Redux Integration Guide](REDUX_INTEGRATION.md)** - Managing chat state with Redux (see [Chat State Management](REDUX_INTEGRATION.md#chat-slice-example))
- **[Form Integration Guide](FORM_INTEGRATION_GUIDE.md)** - Form-like input patterns for chat interface (see [Input Handling](FORM_INTEGRATION_GUIDE.md#basic-form-setup))

### Complementary Guides
- **[Socket Integration Guide](SOCKET_INTEGRATION.md)** - Real-time chat functionality (see [Real-time Features](SOCKET_INTEGRATION.md#socket-events-and-real-time-data-synchronization))
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - AI API configuration in production (see [Environment Configuration](DEPLOYMENT_GUIDE.md#environment-configuration))

### Cross-Reference Quick Links
| Topic | This Guide Section | Related Guide Section |
|-------|-------------------|----------------------|
| **State Management** | [Redux Integration](#redux-integration) | [Redux Integration Guide](REDUX_INTEGRATION.md#chat-slice-example) |
| **API Integration** | [API Integration Patterns](#api-integration-patterns) | [Deployment Guide](DEPLOYMENT_GUIDE.md#api-configuration) |
| **Error Handling** | [Error Handling](#error-handling) | [Form Error Handling](FORM_INTEGRATION_GUIDE.md#error-handling) |
| **Real-time Features** | [Message Processing](#message-processing) | [Socket Integration Guide](SOCKET_INTEGRATION.md#real-time-data-synchronization) |

---

This comprehensive guide covers all aspects of the AI chatbot implementation in MobileUurka. For additional support or questions, please refer to the troubleshooting section or create an issue in the project repository.