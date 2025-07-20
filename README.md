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
- **Document Management**: Upload, store, and manage patient documents
- **Risk Assessment**: Built-in risk assessment tools and alerts

### Real-time Features
- **Live Chat**: Real-time communication between healthcare providers
- **Notifications**: Alert system for important patient updates
- **Socket Integration**: Real-time data synchronization across the platform

### Analytics & Reporting
- **Interactive Charts**: Visual representation of patient data using Recharts
- **Health Trends**: Track patient health trends over time
- **Risk Indicators**: Visual alerts for high-risk patients

## 🚀 Technology Stack

- **Frontend**: React 19.1.0 with Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM
- **Charts**: Recharts for data visualization
- **Real-time**: Socket.io for live updates
- **UI Components**: React Icons, React Tooltip
- **Animations**: Lottie animations for enhanced UX
- **Styling**: CSS3 with custom styling

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (version 16 or higher)
- npm or yarn package manager
- A backend server running (check your `.env` file for `VITE_SERVER_URL`)

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
   Create a `.env` file in the root directory:
   ```env
   VITE_SERVER_URL=your_backend_server_url
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
│   ├── Chat.jsx        # Real-time chat component
│   ├── LoginForm.jsx   # Authentication forms
│   ├── MainSearch.jsx  # Search functionality
│   └── SideBar.jsx     # Navigation sidebar
├── pages/              # Main application pages
│   ├── Patient.jsx     # Patient detail view
│   ├── Patients.jsx    # Patient list view
│   └── DashBoardPage.jsx
├── patient/            # Patient-specific components
│   ├── Overview.jsx    # Patient overview dashboard
│   ├── Documents.jsx   # Document management
│   ├── Notes.jsx       # Clinical notes
│   └── Medication.jsx  # Medication tracking
├── charts/             # Data visualization components
│   ├── BloodPressure.jsx
│   ├── Weight.jsx
│   └── LabChart.jsx
├── forms/              # Form components
├── css/                # Styling files
└── config/             # Configuration files
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Key Components

### Patient Dashboard
- Real-time patient data visualization
- Interactive charts for vital signs
- Comprehensive patient profile management
- Clinical notes and documentation

### Search & Navigation
- Advanced patient search capabilities
- Intuitive sidebar navigation
- Quick access to frequently used features

### Real-time Features
- Live chat system for healthcare teams
- Real-time notifications and alerts
- Socket-based data synchronization

## 🔐 Authentication

The application includes a comprehensive authentication system with:
- User login/logout functionality
- Session management
- Role-based access control
- Secure API communication

## 📱 Responsive Design

MobileUurka is designed to work seamlessly across:
- Desktop computers
- Tablets
- Mobile devices
- Various screen sizes and orientations

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure environment variables in Netlify dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common solutions

## 🔄 Version History

- **v1.0.0** - Initial release with core patient management features
- **v1.1.0** - Added real-time chat and notifications
- **v1.2.0** - Enhanced charts and data visualization

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite for the fast build tool
- All contributors who helped make this project possible

---

**MobileUurka** - Empowering healthcare providers with modern technology for better patient care.