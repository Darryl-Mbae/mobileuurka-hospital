# MobileUurka - Healthcare Management System

A comprehensive healthcare management platform built with React and Vite, designed for healthcare providers to manage patient records, track medical data, and streamline clinical workflows.

## 🏥 Features

### Patient Management

- **Comprehensive Patient Profiles**: Complete patient information including demographics, medical history, and contact details
- **Patient Search & Discovery**: Advanced search functionality to quickly locate patient records
- **Visit Tracking**: Monitor patient visits, reasons, and scheduling
- **Medical History**: Track patient medical history, allergies, and lifestyle factors

### Clinical Data Management

- **Vital Signs Monitoring**: Blood pressure, weight, and other vital sign tracking with interactive charts
- **Laboratory Results**: Lab work management and result visualization
- **Medication Management**: Track current medications and prescription history
- **Fetal Monitoring**: Specialized tools for maternal and fetal health tracking

### Documentation & Notes

- **Clinical Notes**: Comprehensive note-taking system for healthcare providers
- **Document Management**: Upload, store, and manage patient documents (PDF support)
- **Risk Assessment**: Built-in risk assessment tools and alerts

### Real-time Features

- **AI Healthcare Chatbot**: Intelligent chatbot powered by external healthcare API for clinical assistance
- **Real-time Data Synchronization**: Socket.io integration for live updates of patients, users, and organizations
- **Online User Tracking**: Monitor which healthcare providers are currently active
- **Connection Management**: Robust WebSocket connection with automatic reconnection

### Analytics & Reporting

- **Interactive Charts**: Visual representation of patient data using Recharts
- **Health Trends**: Track patient health trends over time
- **Risk Indicators**: Visual alerts for high-risk patients

## 🚀 Technology Stack

- **Frontend**: React 19.1.0 with Vite 7.0.0
- **State Management**: Redux Toolkit 2.8.2
- **Routing**: React Router DOM 7.6.3
- **Charts**: Recharts 3.1.0 for data visualization
- **Real-time**: Socket.io-client 4.8.1 for live updates
- **UI Components**: React Icons 5.5.0, React Tooltip 5.29.1
- **Animations**: Lottie animations (@lottiefiles/dotlottie-react 0.14.3)
- **Document Handling**: React PDF 10.0.1 for PDF viewing
- **Markdown**: React Markdown 10.1.0 with GitHub Flavored Markdown support
- **Security**: React Google reCAPTCHA v3 1.11.0
- **Styling**: CSS3 with custom styling

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Backend Server**: A compatible backend server running (see environment configuration)
- **reCAPTCHA Keys**: Google reCAPTCHA v3 site key for security features
- **Network Access**: Internet connection for AI chatbot functionality

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/mobileuurka.git
   cd mobileuurka
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Backend API Configuration
   VITE_SERVER_URL=http://localhost:8080/api/v1
   VITE_SOCKET_URL=http://localhost:8080
   
   # Security Configuration
   VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   
   # Production URLs (when deploying)
   # VITE_SERVER_URL=https://your-production-api.com/api/v1
   # VITE_SOCKET_URL=https://your-production-api.com
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Chat.jsx        # AI healthcare chatbot component
│   ├── LoginForm.jsx   # Authentication forms
│   ├── MainSearch.jsx  # Search functionality
│   ├── SideBar.jsx     # Navigation sidebar
│   ├── SuccessMessage.jsx # Success message component
│   └── RealtimeNotifications.jsx # Real-time notification system
├── pages/              # Main application pages
│   ├── Patient.jsx     # Patient detail view
│   ├── Patients.jsx    # Patient list view
│   ├── DashBoardPage.jsx # Main dashboard
│   ├── Auth.jsx        # Authentication page
│   └── Settings.jsx    # Application settings
├── patient/            # Patient-specific components
│   ├── Overview.jsx    # Patient overview dashboard
│   ├── Documents.jsx   # Document management
│   ├── Notes.jsx       # Clinical notes
│   ├── Medication.jsx  # Medication tracking
│   └── css/           # Patient-specific styles
├── charts/             # Data visualization components
│   ├── BloodPressure.jsx
│   ├── Weight.jsx
│   ├── LabChart.jsx
│   └── FetalGraph.jsx
├── forms/              # Form components with validation
├── hooks/              # Custom React hooks
│   ├── useSocket.js    # Socket integration hook
│   └── useSuccessMessage.js # Success message hook
├── reducers/           # Redux state management
│   └── Slices/        # Redux Toolkit slices
├── utils/              # Utility functions
├── css/                # Styling files
└── config/             # Configuration files
    ├── socket.js       # Socket.io configuration
    ├── store.js        # Redux store setup
    └── api.js          # API configuration
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Key Components

### Patient Dashboard

- Real-time patient data visualization
- Interactive charts for vital signs (blood pressure, weight, lab results)
- Comprehensive patient profile management
- Clinical notes and documentation with PDF support

### Search & Navigation

- Advanced patient search capabilities
- Intuitive sidebar navigation
- Quick access to frequently used features
- Responsive design for all device types

### AI-Powered Features

- **Healthcare Chatbot**: AI assistant for clinical queries and patient analysis
- **Intelligent Responses**: Powered by external healthcare API with clinical knowledge
- **Chat History**: Persistent conversation history with markdown support

### Real-time System

- **Socket Integration**: Real-time data synchronization for patients, users, and organizations
- **Live Notifications**: Instant alerts for important updates
- **Online Status**: Track active healthcare providers
- **Automatic Reconnection**: Robust connection management

## 🔐 Authentication

The application includes a comprehensive authentication system with:

- User login/logout functionality
- Session management
- Role-based access control
- Secure API communication

## 📱 Responsive Design

MobileUurka is designed to work seamlessly across:

- Desktop computers


## 🚀 Deployment

### Production Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Environment Variables for Production

Ensure all environment variables are properly configured in your deployment platform:

- `VITE_SERVER_URL` - Your production backend API URL
- `VITE_SOCKET_URL` - Your production WebSocket server URL  
- `VITE_RECAPTCHA_SITE_KEY` - Google reCAPTCHA v3 site key

For deployment instructions, see the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common solutions

## 📚 Documentation

> **Navigation Tip**: Each guide includes a detailed table of contents and cross-references to related sections. Start with the guide that matches your immediate need, then follow the cross-references for deeper understanding.

### 🎯 Quick Start Navigation

| I want to... | Go to | Time needed |
|---------------|-------|-------------|
| **Set up the project** | [Installation](#-installation) → [Environment Setup](#environment-setup) | 10 minutes |
| **Deploy to production** | [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) | 30 minutes |
| **Add real-time features** | [Socket Integration Guide](docs/SOCKET_INTEGRATION.md) | 45 minutes |
| **Create new forms** | [Form Integration Guide](docs/FORM_INTEGRATION_GUIDE.md) | 30 minutes |
| **Manage application state** | [Redux Integration Guide](docs/REDUX_INTEGRATION.md) | 45 minutes |
| **Integrate AI chatbot** | [AI Chatbot Guide](docs/AI_CHATBOT_GUIDE.md) | 60 minutes |
| **Troubleshoot issues** | See troubleshooting sections in each guide | Variable |

### 📖 Technical Implementation Guides

#### For Frontend Developers
| Guide | Purpose | Key Topics |
|-------|---------|------------|
| **[Socket Integration Guide](docs/SOCKET_INTEGRATION.md)** | Real-time features and WebSocket implementation | Connection management, event handling, Redux integration |
| **[Form Integration Guide](docs/FORM_INTEGRATION_GUIDE.md)** | Form patterns, validation, and SuccessMessage integration | Form setup, validation patterns, error handling |
| **[Redux Integration Guide](docs/REDUX_INTEGRATION.md)** | State management patterns and real-time updates | Redux Toolkit, slices, async actions |
| **[AI Chatbot Guide](docs/AI_CHATBOT_GUIDE.md)** | AI chatbot implementation and troubleshooting | API integration, message processing, chat history |

#### For DevOps & Deployment
| Guide | Purpose | Key Topics |
|-------|---------|------------|
| **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** | Production deployment and environment setup | Platform deployment, environment variables, monitoring |

### 🚀 Quick Reference

#### Common Development Tasks
| Task | Quick Link | Related Guides |
|------|------------|----------------|
| **Adding Real-time Features** | [Implementation Patterns](docs/SOCKET_INTEGRATION.md#implementation-patterns-for-new-socket-features) | Socket Guide, Redux Guide |
| **Creating New Forms** | [Basic Form Setup](docs/FORM_INTEGRATION_GUIDE.md#basic-form-setup) | Form Guide |
| **Managing State** | [Creating Redux Slices](docs/REDUX_INTEGRATION.md#creating-new-redux-slices-and-actions) | Redux Guide |
| **Deploying to Production** | [Deployment Platforms](docs/DEPLOYMENT_GUIDE.md#deployment-platforms) | Deployment Guide |
| **Integrating AI Features** | [Chatbot Implementation](docs/AI_CHATBOT_GUIDE.md#core-implementation) | AI Chatbot Guide |

#### Development Patterns & Examples
| Pattern | Quick Link | Description |
|---------|------------|-------------|
| **Socket Event Handling** | [Event Patterns](docs/SOCKET_INTEGRATION.md#socket-events-and-real-time-data-synchronization) | How to handle real-time data updates |
| **Form Validation** | [Validation Patterns](docs/FORM_INTEGRATION_GUIDE.md#form-validation-patterns) | Consistent form validation approaches |
| **State Management** | [Redux Patterns](docs/REDUX_INTEGRATION.md#state-management-for-real-time-updates) | Managing real-time state updates |
| **Error Handling** | [Error Patterns](docs/FORM_INTEGRATION_GUIDE.md#error-handling) | Consistent error handling across forms |
| **API Integration** | [API Patterns](docs/AI_CHATBOT_GUIDE.md#api-integration-patterns) | External API integration best practices |

#### Troubleshooting Quick Links
| Issue Type | Quick Link | Guide |
|------------|------------|-------|
| **Socket Connection Issues** | [Socket Troubleshooting](docs/SOCKET_INTEGRATION.md#troubleshooting-common-socket-connection-issues) | Socket Guide |
| **Form Submission Problems** | [Form Troubleshooting](docs/FORM_INTEGRATION_GUIDE.md#troubleshooting) | Form Guide |
| **State Management Issues** | [Redux Debugging](docs/REDUX_INTEGRATION.md#debugging-redux) | Redux Guide |
| **Chatbot Integration Problems** | [Chatbot Troubleshooting](docs/AI_CHATBOT_GUIDE.md#troubleshooting-chatbot-integration-issues) | AI Chatbot Guide |
| **Deployment Issues** | [Deployment Troubleshooting](docs/DEPLOYMENT_GUIDE.md#troubleshooting-deployment-issues) | Deployment Guide |

### 🔗 Cross-Reference Map

Understanding how different parts of the system work together:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Socket.IO     │◄──►│   Redux Store    │◄──►│     Forms       │
│   (Real-time)   │    │  (State Mgmt)    │    │  (User Input)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Chatbot    │    │   Components     │    │   Deployment    │
│   (External)    │    │   (UI Layer)     │    │   (Production)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

- **Socket + Redux**: [Socket-Redux Integration](docs/SOCKET_INTEGRATION.md#redux-integration)
- **Forms + Redux**: [Form State Management](docs/FORM_INTEGRATION_GUIDE.md#redux-integration)
- **Chatbot + Redux**: [Chat State Management](docs/AI_CHATBOT_GUIDE.md#redux-integration)
- **All Systems + Deployment**: [Production Configuration](docs/DEPLOYMENT_GUIDE.md#environment-configuration)

## 🚧 Development Status

### ✅ Implemented Features
- Complete patient management system
- AI healthcare chatbot with external API integration
- Real-time data synchronization via Socket.io
- Interactive data visualization with Recharts
- Comprehensive form handling with validation
- Document management with PDF support
- User authentication and session management
- Responsive design for all devices

### 🔄 Planned Features
- Live user-to-user messaging between healthcare providers
- Advanced reporting and analytics dashboard
- Mobile app companion
- Integration with external healthcare systems
- Enhanced security features

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite for the fast build tool
- All contributors who helped make this project possible

---

**MobileUurka** - Empowering healthcare providers with modern technology for better patient care.
