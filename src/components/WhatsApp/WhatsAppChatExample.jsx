import React from 'react';
import Chat from '../Chat';

/**
 * Example component showing how to use the Chat component with WhatsApp functionality
 * 
 * The Chat component now automatically:
 * - Retrieves patient WhatsApp messages when in WhatsApp mode
 * - Displays message history with status indicators
 * - Allows sending new messages and templates
 * - Auto-refreshes messages every 30 seconds
 * - Shows loading states and error handling
 */

const WhatsAppChatExample = ({ patient, user }) => {
  return (
    <div className="whatsapp-chat-example">
      <h3>WhatsApp Chat with {patient?.name}</h3>
      <p>Phone: {patient?.phone}</p>
      
      {/* The Chat component handles everything automatically */}
      <Chat patient={patient} user={user} />
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Features:</h4>
        <ul>
          <li>✅ Automatic message retrieval from backend</li>
          <li>✅ Real-time message status updates</li>
          <li>✅ Template message sending</li>
          <li>✅ Media message support</li>
          <li>✅ Auto-refresh every 30 seconds</li>
          <li>✅ Manual refresh button</li>
          <li>✅ Loading states and error handling</li>
          <li>✅ Patient association for incoming messages</li>
        </ul>
      </div>
    </div>
  );
};

export default WhatsAppChatExample;