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

### Manual Deployment

```bash
# Build the project
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## Backend Server Requirements

### API Server Specifications

The frontend requires a compatible backend server with the following capabilities:

#### Authentication Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `GET /auth/verify` - Token verification
- `GET /users` - Current user data

#### Core API Endpoints
- **Users Management**: CRUD operations for user accounts
- **Patients Management**: Patient data and medical records
- **Organizations**: Healthcare organization management
- **Real-time Features**: Socket.IO support for live updates
- **Feedback System**: User feedback and support

#### WebSocket Events

The backend must support the following Socket.IO events:

**User Events:**
- `users_updated` - User list updates
- `user_added` - New user registration
- `user_updated` - User profile changes
- `user_deleted` - User account removal

**Patient Events:**
- `patients_updated` - Patient list updates
- `patient_added` - New patient registration
- `patient_updated` - Patient data changes
- `patient_deleted` - Patient record removal

**Organization Events:**
- `organizations_updated` - Organization list updates
- `organization_added` - New organization
- `organization_updated` - Organization changes
- `organization_deleted` - Organization removal

### Backend Configuration Requirements

#### CORS Configuration
```javascript
// Backend CORS settings should allow:
{
  origin: [
    "https://your-netlify-domain.netlify.app",
    "https://your-custom-domain.com"
  ],
  credentials: true
}
```

#### Socket.IO Configuration
```javascript
// Backend Socket.IO settings
{
  cors: {
    origin: "https://your-netlify-domain.netlify.app",
    credentials: true
  }
}
```

## SSL/HTTPS Configuration

### Certificate Requirements

For production deployments, ensure:

1. **Valid SSL Certificate**: Netlify provides automatic SSL certificates
2. **HTTPS Enforcement**: Netlify automatically redirects HTTP to HTTPS
3. **HSTS Headers**: Implement HTTP Strict Transport Security

### Backend HTTPS Requirements

The backend API must also use HTTPS in production:

```env
# Production backend URLs must use HTTPS
VITE_SERVER_URL=https://your-api-domain.com/api/v1
VITE_SOCKET_URL=https://your-api-domain.com
```

## Performance Optimization

### Build Optimization

```javascript
// vite.config.js optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          charts: ['recharts'],
          icons: ['react-icons'],
          socket: ['socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### CDN Configuration

Netlify automatically provides CDN caching. For optimal performance:

```
# Netlify _headers file (optional)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
```

## Monitoring and Health Checks

### Application Health

Monitor these endpoints for application health:

```bash
# Frontend health (should return HTML)
curl https://your-domain.com

# Backend API health
curl https://your-api-domain.com/api/v1/health

# WebSocket connection test
# Use browser dev tools to test socket connection
```

### Key Metrics to Monitor

- **Page Load Times**: Monitor initial page load performance
- **API Response Times**: Monitor backend API performance
- **Error Rates**: Track JavaScript errors and API failures
- **User Authentication**: Track login success/failure rates

## Troubleshooting

### Common Deployment Issues

#### 1. Build Failures

**Symptoms:**
- Netlify build fails
- "Module not found" errors
- TypeScript compilation errors

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for missing dependencies
npm audit
npm audit fix

# Verify build locally
npm run build
```

#### 2. Environment Variables Not Working

**Symptoms:**
- API calls fail in production
- Features work locally but not in production

**Solutions:**
- Verify all environment variables are set in Netlify dashboard
- Check variable names start with `VITE_`
- Redeploy after adding environment variables

#### 3. Routing Issues

**Symptoms:**
- 404 errors on page refresh
- Direct URL access fails

**Solutions:**
- Ensure `_redirects` file is in `public/` directory
- Verify `_redirects` content: `/* /index.html 200`

#### 4. API Connection Issues

**Symptoms:**
- CORS errors
- API requests fail
- Socket connection drops

**Solutions:**
- Verify backend CORS configuration
- Check HTTPS/HTTP protocol matching
- Ensure backend is accessible from Netlify

### Performance Issues

#### 1. Slow Initial Load

**Solutions:**
- Implement code splitting
- Optimize bundle size
- Use CDN for static assets

#### 2. Socket Connection Drops

**Solutions:**
- Implement connection retry logic
- Monitor network connectivity
- Configure proper timeout values

### Security Considerations

#### 1. Environment Variable Security

- Never commit `.env` files to version control
- Use Netlify environment variable management
- Rotate API keys and secrets regularly

#### 2. Content Security Policy

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://www.google.com; 
               style-src 'self' 'unsafe-inline'; 
               connect-src 'self' wss: https:;">
```

## Rollback Procedures

### Quick Rollback Steps

1. **Identify Last Working Version**
   ```bash
   git log --oneline -10
   ```

2. **Revert to Previous Version**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Emergency Rollback**
   ```bash
   # Netlify rollback
   netlify rollback
   ```

### Rollback Checklist

- [ ] Identify the issue and impact
- [ ] Determine last known good version
- [ ] Execute rollback procedure
- [ ] Verify application functionality
- [ ] Monitor for any issues
- [ ] Communicate status to stakeholders

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- Monitor application performance metrics
- Check error logs and resolve issues
- Verify SSL certificate status

#### Monthly
- Update dependencies (security patches)
- Review and rotate API keys
- Performance optimization review

#### Quarterly
- Full security audit
- Dependency vulnerability scan
- Backup and disaster recovery testing

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

## Quick Reference

### Essential Deployment Commands

| Command | Purpose |
|---------|---------|
| **`npm run build`** | Create production build |
| **`netlify deploy --prod`** | Deploy to production |
| **`netlify rollback`** | Rollback to previous version |

### Netlify Deployment Quick Setup

| Step | Action | Guide Section |
|------|--------|---------------|
| **1. Connect Repository** | Link GitHub repo to Netlify | [Netlify Deployment](#netlify-deployment) |
| **2. Configure Environment** | Set environment variables in Netlify dashboard | [Environment Configuration](#environment-configuration) |
| **3. Deploy** | Automatic deployment on push to main branch | [Netlify Deployment](#netlify-deployment) |

### Common Deployment Issues & Quick Fixes

| Issue | Quick Fix | Detailed Section |
|-------|-----------|------------------|
| **Build Fails** | Check `npm run build` locally first | [Build Process](#build-process) |
| **Env Vars Missing** | Verify all required vars are set in Netlify | [Environment Configuration](#environment-configuration) |
| **API Not Connecting** | Check CORS settings and HTTPS | [Backend Server Requirements](#backend-server-requirements) |
| **Socket Connection Fails** | Verify WebSocket URL and protocol | [SSL/HTTPS Configuration](#sslhttps-configuration) |

### Health Check Commands

```bash
# Local development
npm run dev  # Should start on localhost:5173
curl http://localhost:5173  # Should return HTML

# Production verification
curl https://your-domain.com  # Should return HTML
curl https://your-api.com/api/v1/health  # Should return 200
```

### Emergency Rollback

```bash
# Quick rollback commands
git log --oneline -5  # Find last good commit
git revert <commit-hash>  # Revert changes
git push origin main  # Deploy rollback

# Netlify rollback
netlify rollback
```

## Related Documentation

### Essential Reading
- **[Socket Integration Guide](SOCKET_INTEGRATION.md)** - WebSocket configuration for production (see [Environment Configuration](SOCKET_INTEGRATION.md#environment-configuration))
- **[Redux Integration Guide](REDUX_INTEGRATION.md)** - State management in production builds (see [Best Practices](REDUX_INTEGRATION.md#best-practices))

### Complementary Guides
- **[Form Integration Guide](FORM_INTEGRATION_GUIDE.md)** - Form validation in production environments
- **[AI Chatbot Guide](AI_CHATBOT_GUIDE.md)** - AI API configuration for production (see [API Integration](AI_CHATBOT_GUIDE.md#api-integration-patterns))

### Cross-Reference Quick Links
| Topic | This Guide Section | Related Guide Section |
|-------|-------------------|----------------------|
| **Environment Setup** | [Environment Configuration](#environment-configuration) | [Socket Configuration](SOCKET_INTEGRATION.md#environment-configuration) |
| **Performance** | [Performance Optimization](#performance-optimization) | [Redux Best Practices](REDUX_INTEGRATION.md#performance-optimization) |
| **API Configuration** | [Backend Server Requirements](#backend-server-requirements) | [AI API Setup](AI_CHATBOT_GUIDE.md#api-integration-patterns) |
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