# 🔐 EcoAtlas AI Authentication System Setup Guide

## Overview
This guide will help you set up a complete authentication system for EcoAtlas AI with the following features:

- ✅ **User Registration** with email verification
- ✅ **Secure Login** with password hashing
- ✅ **Email Verification** system
- ✅ **JWT Token Authentication**
- ✅ **Rate Limiting** and security features
- ✅ **User Dashboard** with profile management
- ✅ **SQLite Database** for user storage
- ✅ **React Frontend** with modern UI

## 🚀 Quick Start

### 1. Install Dependencies

**Backend Dependencies:**
```bash
cd backend
npm install
```

**Frontend Dependencies:**
```bash
npm install
```

### 2. Configure Environment Variables

**Backend Configuration (`backend/.env`):**
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

**Frontend Configuration (`.env`):**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

### 3. Start the System

**Option 1: Use the startup script (Windows):**
```bash
start_auth_system.bat
```

**Option 2: Manual startup:**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm start
```

## 📧 Email Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update backend/.env:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### Other Email Providers

Update the transporter configuration in `backend/auth-server.js`:

```javascript
const transporter = nodemailer.createTransporter({
  service: 'outlook', // or 'yahoo', 'hotmail', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 🗄️ Database

The system uses SQLite for simplicity. The database file (`auth.db`) will be created automatically.

**Tables Created:**
- `users` - User accounts and authentication data
- `verification_codes` - Email verification tracking
- `login_attempts` - Security monitoring

## 🔒 Security Features

### Password Security
- **bcrypt hashing** with 12 rounds
- **Password strength validation**
- **Account lockout** after 5 failed attempts

### Rate Limiting
- **5 requests per 15 minutes** for auth endpoints
- **100 requests per 15 minutes** for general endpoints
- **IP-based tracking** for security monitoring

### JWT Tokens
- **24-hour expiration**
- **Secure secret key** (change in production)
- **Automatic refresh** on successful requests

### Input Validation
- **Email format validation**
- **Username format validation** (alphanumeric + underscore)
- **SQL injection protection**
- **XSS protection** with helmet.js

## 🎨 Frontend Features

### Authentication Flow
1. **Landing Page** - Clean welcome screen
2. **Sign Up** - User registration with validation
3. **Email Verification** - 6-digit code verification
4. **Login** - Secure authentication
5. **User Dashboard** - Profile and account management

### UI Components
- **Responsive design** for all screen sizes
- **Form validation** with real-time feedback
- **Loading states** and error handling
- **Modern icons** with Lucide React
- **Tailwind CSS** for styling

## 🔧 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/verify` | Email verification |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile |
| POST | `/api/auth/logout` | User logout |

### Request/Response Examples

**Sign Up:**
```json
POST /api/auth/signup
{
  "username": "johndoe",
  "email": "john@example.com",
  "realName": "John Doe",
  "password": "SecurePass123"
}
```

**Login:**
```json
POST /api/auth/login
{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "realName": "John Doe"
  }
}
```

## 🚀 Deployment

### Backend Deployment
1. **Set environment variables** in production
2. **Use a production database** (PostgreSQL recommended)
3. **Configure HTTPS** and secure headers
4. **Set up monitoring** and logging

### Frontend Deployment
1. **Build the application:**
   ```bash
   npm run build
   ```
2. **Deploy to Netlify/Vercel:**
   ```bash
   netlify deploy --prod
   ```

## 🐛 Troubleshooting

### Common Issues

**1. Email not sending:**
- Check Gmail app password
- Verify SMTP settings
- Check firewall/antivirus blocking

**2. Database errors:**
- Ensure SQLite is installed
- Check file permissions
- Verify database path

**3. CORS errors:**
- Update FRONTEND_URL in backend/.env
- Check API endpoint URLs

**4. JWT token errors:**
- Verify JWT_SECRET is set
- Check token expiration
- Ensure proper headers

### Debug Mode

**Backend debugging:**
```bash
cd backend
DEBUG=* npm start
```

**Frontend debugging:**
```bash
REACT_APP_DEBUG=true npm start
```

## 📱 Mobile Support

The authentication system is fully responsive and works on:
- ✅ **Desktop browsers**
- ✅ **Mobile browsers**
- ✅ **Tablet devices**
- ✅ **Progressive Web App** (PWA ready)

## 🔄 Updates and Maintenance

### Regular Tasks
1. **Update dependencies** monthly
2. **Monitor security logs**
3. **Backup user data**
4. **Review rate limiting**

### Security Updates
1. **Rotate JWT secrets** quarterly
2. **Update password policies** as needed
3. **Monitor failed login attempts**
4. **Review access logs**

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the browser console for errors
4. Verify environment configuration

## 🎯 Next Steps

After setting up authentication, consider:
1. **Adding password reset** functionality
2. **Implementing 2FA** (Two-Factor Authentication)
3. **Adding social login** (Google, Facebook)
4. **Creating admin panel** for user management
5. **Adding user roles** and permissions

---

**Happy coding! 🚀**





