# WhatsApp Integration - Complete Implementation

This document describes the complete WhatsApp integration that has been implemented in the hospital management system.

## Overview

The WhatsApp integration allows healthcare providers to:
- Send template messages to patients (appointment reminders, medication reminders, etc.)
- Send custom text messages to patients
- Receive and view incoming messages from patients
- View message history and status updates
- Handle media messages (images, documents)

## Architecture

### Frontend Components

#### 1. Chat.jsx (Main Component)
- **Location**: `src/components/Chat.jsx`
- **Purpose**: Main chat interface that handles both Sabi AI and WhatsApp messaging
- **Features**:
  - Automatic message retrieval when in WhatsApp mode
  - Template message sending
  - Real-time message status updates
  - Auto-refresh every 30 seconds
  - Manual refresh button
  - Loading states and error handling

#### 2. WhatsApp Service
- **Location**: `src/services/whatsappService.js`
- **Purpose**: Handles all WhatsApp API communications
- **Methods**:
  - `getPatientMessages(patientId, limit)` - Retrieve messages for a specific patient
  - `getMessageHistory(phoneNumber, limit)` - Get messages by phone number
  - `getAllMessages(page, limit, filters)` - Get all messages with pagination
  - `sendMessage(template, message, patient, user, additionalData)` - Send messages
  - `validatePatientContact(patient)` - Validate patient phone numbers

#### 3. WhatsApp Messages Hook
- **Location**: `src/hooks/useWhatsAppMessages.js`
- **Purpose**: React hook for managing WhatsApp messages state
- **Features**:
  - Automatic message loading
  - Auto-refresh capability
  - Message sending with state management
  - Error handling and loading states

### Backend Components

#### 1. WhatsApp Controller
- **Location**: `controllers/whatsapp.controller.js`
- **Endpoints**:
  - `POST /api/v1/whatsapp/send/text` - Send text messages
  - `POST /api/v1/whatsapp/send/appointment-reminder` - Send appointment reminders
  - `POST /api/v1/whatsapp/send/medication-reminder` - Send medication reminders
  - `POST /api/v1/whatsapp/send/media` - Send media messages
  - `GET /api/v1/whatsapp/messages/patient/:patientId` - Get patient messages
  - `GET /api/v1/whatsapp/messages/phone/:phoneNumber` - Get messages by phone
  - `GET /api/v1/whatsapp/messages` - Get all messages with pagination
  - `POST /api/v1/whatsapp/webhook` - Production webhook endpoint
  - `POST /api/v1/whatsapp/webhook/local` - Local testing webhook endpoint
  - `GET /api/v1/whatsapp/webhook/verify` - Webhook verification endpoint

#### 2. WhatsApp Service
- **Location**: `services/whatsapp.service.js`
- **Purpose**: Handles Twilio API integration and database operations
- **Features**:
  - Message sending via Twilio
  - Webhook processing
  - Patient association for incoming messages
  - Message status updates
  - Database storage and retrieval

#### 3. Webhook Endpoints
- **Production**: `/api/v1/whatsapp/webhook` - Standard webhook for production
- **Local Testing**: `/api/v1/whatsapp/webhook/local` - Enhanced logging for development
- **Verification**: `/api/v1/whatsapp/webhook/verify` - Webhook verification for Twilio

## Usage

### Frontend Usage

#### Using the Chat Component
```jsx
import Chat from './components/Chat';

function PatientPage({ patient, user }) {
  return (
    <div>
      <h1>Patient: {patient.name}</h1>
      {/* Chat component automatically handles WhatsApp when mode is selected */}
      <Chat patient={patient} user={user} />
    </div>
  );
}
```

#### Using the WhatsApp Hook Directly
```jsx
import useWhatsAppMessages from './hooks/useWhatsAppMessages';

function CustomWhatsAppComponent({ patientId }) {
  const { 
    messages, 
    loading, 
    sendMessage, 
    refreshMessages 
  } = useWhatsAppMessages(patientId, null, true); // Enable auto-refresh

  const handleSendMessage = async () => {
    const result = await sendMessage(
      { id: 'text', apiEndpoint: '/send/text' },
      'Hello patient!',
      patient,
      user,
      {}
    );
    
    if (result.success) {
      console.log('Message sent:', result.messageId);
    }
  };

  return (
    <div>
      {loading && <p>Loading messages...</p>}
      {messages.map(msg => (
        <div key={msg.id}>{msg.body}</div>
      ))}
      <button onClick={handleSendMessage}>Send Message</button>
      <button onClick={refreshMessages}>Refresh</button>
    </div>
  );
}
```

### Backend Usage

#### Sending Messages
```javascript
// Send text message
const result = await whatsappService.sendTextMessage(
  '+254712345678',
  'Hello patient!',
  { patientId: '123', userId: '456', organizationId: '789' }
);

// Send template message
const result = await whatsappService.sendTemplateMessage(
  '+254712345678',
  'appointment_reminder_template',
  { '1': 'John Doe', '2': 'Dr. Smith', '3': 'Tomorrow', '4': '2:00 PM' },
  { patientId: '123', userId: '456' }
);
```

#### Retrieving Messages
```javascript
// Get patient messages
const messages = await whatsappService.getPatientMessages('patient-id', 50);

// Get message history by phone
const history = await whatsappService.getMessageHistory('+254712345678', 50);
```

## Testing

### Local Webhook Testing

#### 1. Setup ngrok
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000
```

#### 2. Configure Twilio Webhook
Set webhook URL in Twilio Console to: `https://your-ngrok-url.ngrok.io/api/v1/whatsapp/webhook/local`

#### 3. Test Webhooks
```bash
# Test incoming message
npm run test:webhook:incoming

# Test message status update
npm run test:webhook:status

# Test webhook verification
npm run test:webhook:verify

# Custom test with parameters
node test-webhook-local.js incoming --message "Test message" --from "+254712345678"
```

### Production Setup

#### 1. Environment Variables
```env
# Required for production
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=+14155238886
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token
```

#### 2. Webhook Configuration
Set production webhook URL in Twilio Console to: `https://yourdomain.com/api/v1/whatsapp/webhook`

## Features

### Message Types Supported
- ✅ Text messages
- ✅ Template messages (appointment reminders, medication reminders)
- ✅ Media messages (images, documents)
- ✅ Status updates (sent, delivered, read, failed)

### Frontend Features
- ✅ Real-time message display
- ✅ Auto-refresh every 30 seconds
- ✅ Manual refresh button
- ✅ Loading states and error handling
- ✅ Message status indicators
- ✅ Template message selection
- ✅ Time picker for appointments
- ✅ Patient phone number validation

### Backend Features
- ✅ Webhook processing for incoming messages
- ✅ Automatic patient association
- ✅ Message status tracking
- ✅ Database storage and retrieval
- ✅ Error handling and logging
- ✅ Pagination support
- ✅ Organization-level filtering

### Security Features
- ✅ Phone number validation (international format required)
- ✅ Authentication required for all endpoints
- ✅ Webhook signature validation (configurable)
- ✅ Input sanitization and validation

## Database Schema

The WhatsApp messages are stored in the `whatsAppMessage` table with the following structure:

```sql
CREATE TABLE whatsAppMessage (
  id TEXT PRIMARY KEY,
  messageId TEXT UNIQUE,
  from TEXT NOT NULL,
  to TEXT NOT NULL,
  body TEXT,
  mediaUrl TEXT,
  messageType TEXT NOT NULL,
  templateName TEXT,
  templateParams JSON,
  status TEXT NOT NULL,
  direction TEXT NOT NULL,
  errorMessage TEXT,
  errorCode TEXT,
  webhookData JSON,
  patientId TEXT,
  userId TEXT,
  organizationId TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

### Common Issues and Solutions

#### 1. Phone Number Format Issues
**Problem**: Messages fail to send due to invalid phone format
**Solution**: Ensure phone numbers are in international format (+country code + number)

#### 2. Webhook Not Receiving Data
**Problem**: Webhooks not being called
**Solutions**:
- Verify webhook URL is accessible
- Check ngrok is running for local development
- Verify Twilio webhook configuration

#### 3. Patient Association Fails
**Problem**: Incoming messages not associated with patients
**Solutions**:
- Ensure patient phone numbers match exactly
- Check phone number format consistency
- Verify patient exists in database

## Monitoring and Logging

### Frontend Logging
- Console logs for debugging
- Toast notifications for user feedback
- Error boundaries for crash prevention

### Backend Logging
- Structured logging with Winston
- Webhook event logging
- Error tracking and reporting
- Performance monitoring

### Database Monitoring
- Message delivery status tracking
- Failed message analysis
- Usage statistics and reporting

## Future Enhancements

### Planned Features
- [ ] Message encryption
- [ ] Bulk message sending
- [ ] Message scheduling
- [ ] Rich media support (videos, audio)
- [ ] Message templates management UI
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Chatbot integration
- [ ] Message search and filtering
- [ ] Export functionality

### Performance Optimizations
- [ ] Message caching
- [ ] Pagination optimization
- [ ] Real-time updates via WebSocket
- [ ] Background job processing
- [ ] Rate limiting implementation

## Support and Troubleshooting

For issues with the WhatsApp integration:

1. **Check the logs** - Both frontend console and backend logs
2. **Verify configuration** - Environment variables and Twilio settings
3. **Test webhooks** - Use the provided testing scripts
4. **Check phone number formats** - Must be international format
5. **Monitor Twilio Console** - For delivery status and errors

## API Documentation

Complete API documentation is available in the `WEBHOOK_SETUP_GUIDE.md` file, which includes:
- Detailed endpoint descriptions
- Request/response examples
- Error codes and handling
- Webhook payload formats
- Testing procedures