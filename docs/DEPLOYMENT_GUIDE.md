# Deployment Guide

> **Purpose**: Complete deployment instructions for production environments  
> **Prerequisites**: Basic knowledge of web deployment, environment variables  
> **Estimated Reading Time**: 20 minutes

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Build Process](#build-process)
5. [Netlify Deployment](#netlify-deployment)
6. [Backend Server Requirements](#backend-server-requirements)
7. [SSL/HTTPS Configuration](#sslhttps-configuration)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring and Health Checks](#monitoring-and-health-checks)
10. [Troubleshooting](#troubleshooting)
11. [Rollback Procedures](#rollback-procedures)
12. [Maintenance](#maintenance)
13. [Related Documentation](#related-documentation)

## Overview

This guide provides comprehensive instructions for deploying the MobileUurka healthcare management application to Netlify. The application is a React-based frontend that requires a backend server for full functionality.

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Backend Server**: Compatible MobileUurka backend API server
- **Database**: Backend-dependent (typically PostgreSQL or MongoDB)

### Development Tools

```bash
# Verify Node.js version
node --version

# Verify npm version
npm --version

# Install dependencies
npm install
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Backend API Configuration
VITE_SERVER_URL=http://localhost:8080/api/v1
VITE_SOCKET_URL=http://localhost:8080

# Google reCAPTCHA v3 Configuration
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

### Environment Variable Details

#### `VITE_SERVER_URL`
- **Purpose**: Base URL for REST API endpoints
- **Format**: `https://your-api-domain.com/api/v1`
- **Required**: Yes
- **Example**: `https://api.mobileuurka.com/api/v1`

#### `VITE_SOCKET_URL`
- **Purpose**: WebSocket server URL for real-time features
- **Format**: `https://your-api-domain.com` (no trailing slash)
- **Required**: Yes
- **Example**: `https://api.mobileuurka.com`

#### `VITE_RECAPTCHA_SITE_KEY`
- **Purpose**: Google reCAPTCHA v3 site key for form protection
- **Format**: reCAPTCHA site key string
- **Required**: Yes
- **Setup**: Obtain from [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)

### Environment-Specific Configuration

#### Development Environment
```env
VITE_SERVER_URL=http://localhost:8080/api/v1
VITE_SOCKET_URL=http://localhost:8080
VITE_RECAPTCHA_SITE_KEY=6LfmWX4rAAAAAKEW7utvbFaFNaO5T1Oq-ME7hAbK
```

#### Production Environment
```env
VITE_SERVER_URL=https://your-production-api.com/api/v1
VITE_SOCKET_URL=https://your-production-api.com
VITE_RECAPTCHA_SITE_KEY=your_production_recaptcha_key
```

#### Staging Environment
```env
VITE_SERVER_URL=https://staging-api.your-domain.com/api/v1
VITE_SOCKET_URL=https://staging-api.your-domain.com
VITE_RECAPTCHA_SITE_KEY=your_staging_recaptcha_key
```

## Build Process

### Development Build

```bash
# Start development server
npm run dev

# Application will be available at http://localhost:5173
```

### Production Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

The production build:
1. Optimizes and minifies JavaScript and CSS
2. Generates source maps for debugging
3. Creates a `dist/` directory with all static assets
4. Includes SPA routing configuration (`_redirects`)

### Build Output

```
dist/
├── index.html          # Main HTML file
├── assets/            # Optimized JS, CSS, and images
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
├── _redirects         # Netlify routing configuration
└── [other static files]
```

## Netlify Deployment

### Automatic Deployment (Recommended)

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Select the MobileUurka repository

2. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 18 or higher
   ```

3. **Environment Variables**
   In Netlify dashboard → Site settings → Environment variables:
   ```
   VITE_SERVER_URL=https://your-production-api.com/api/v1
   VITE_SOCKET_URL=https://your-production-api.com
   VITE_RECAPTCHA_SITE_KEY=your_production_recaptcha_key
   ```

4. **Deploy**
   - Push to main branch triggers automatic deployment
   - Monitor deployment in Netlify dashboard




### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit
npm audit fix
```


### Health Check Commands

```bash
# Local development
npm run dev  # Should start on localhost:5173
curl http://localhost:5173  # Should return HTML

# Production verification
curl https://your-domain.com  # Should return HTML
curl https://your-api.com/api/v1/health  # Should return 200
```



## Related Documentation

### Essential Reading
- **[Socket Integration Guide](SOCKET_INTEGRATION.md)** - WebSocket configuration for production (see [Environment Configuration](SOCKET_INTEGRATION.md#environment-configuration))
- **[Redux Integration Guide](REDUX_INTEGRATION.md)** - State management in production builds (see [Best Practices](REDUX_INTEGRATION.md#best-practices))

### Complementary Guides
- **[Form Integration Guide](FORM_INTEGRATION_GUIDE.md)** - Form validation in production environments

### Cross-Reference Quick Links
| Topic | This Guide Section | Related Guide Section |
|-------|-------------------|----------------------|
| **Environment Setup** | [Environment Configuration](#environment-configuration) | [Socket Configuration](SOCKET_INTEGRATION.md#environment-configuration) |
| **Performance** | [Performance Optimization](#performance-optimization) | [Redux Best Practices](REDUX_INTEGRATION.md#performance-optimization) |
| **Error Handling** | [Troubleshooting](#troubleshooting) | [Socket Troubleshooting](SOCKET_INTEGRATION.md#troubleshooting-common-socket-connection-issues) |

### Support and Resources

### Documentation Links
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)

### Getting Help

For deployment issues:
1. Check this troubleshooting guide
2. Review application logs in Netlify dashboard
3. Consult Netlify documentation
4. Contact development team with detailed error information

---

*Last updated: January 2025*
*Version: 1.0.0*