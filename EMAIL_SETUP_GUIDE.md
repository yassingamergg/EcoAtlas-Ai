# Email Configuration Setup Guide

## Overview
Your EcoAtlas AI application now includes a complete email confirmation system! When users sign up, they will automatically receive a confirmation email with a verification code.

## What's Already Implemented

### Backend (auth-server.js)
✅ **Email Service**: Configured with nodemailer  
✅ **Signup Endpoint**: Sends verification emails automatically  
✅ **Email Templates**: Professional HTML email with verification code  
✅ **Verification System**: Users must verify their email before logging in  

### Frontend (App.js)
✅ **Signup Form**: Complete form with validation  
✅ **Email Verification**: Modal for entering verification code  
✅ **Login System**: Real authentication (not just demo)  
✅ **Error Handling**: User-friendly error messages  

## Email Configuration

### Step 1: Set up Email Service
1. Copy the environment file:
   ```bash
   cd backend
   cp env.example .env
   ```

2. Edit `backend/.env` with your email credentials:
   ```env
   # Email Configuration (Gmail example)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Other settings...
   PORT=3001
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   FRONTEND_URL=http://localhost:3000
   ```

### Step 2: Gmail Setup (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

### Step 3: Alternative Email Services
You can use other email services by modifying the transporter in `auth-server.js`:

```javascript
// For Outlook/Hotmail
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// For custom SMTP
const transporter = nodemailer.createTransporter({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## How It Works

### User Signup Flow
1. **User fills out signup form** with:
   - Full Name
   - Email Address
   - Username
   - Password
   - Confirm Password

2. **Backend creates account** and sends verification email

3. **Email sent automatically** with:
   - Professional EcoAtlas AI branding
   - 6-digit verification code
   - 24-hour expiration
   - Clear instructions

4. **User enters verification code** in the frontend modal

5. **Account verified** and user can log in

### Email Template Features
- **Professional Design**: EcoAtlas AI branding and colors
- **Clear Instructions**: Step-by-step verification process
- **Security**: 24-hour code expiration
- **Responsive**: Works on all email clients

## Testing the System

### Start the Backend
```bash
cd backend
npm install
npm start
```

### Start the Frontend
```bash
npm install
npm start
```

### Test Signup
1. Go to `http://localhost:3000`
2. Click "Don't have an account? Sign up"
3. Fill out the signup form
4. Check your email for the verification code
5. Enter the code in the verification modal
6. Success! You can now log in

## Troubleshooting

### Email Not Sending
- Check your email credentials in `.env`
- Verify app password is correct (for Gmail)
- Check console logs for error messages
- Ensure email service is properly configured

### Verification Code Issues
- Codes expire after 24 hours
- Check spam folder for emails
- Ensure you're using the correct email address
- Try requesting a new verification code

### Backend Connection Issues
- Ensure backend is running on port 3001
- Check CORS settings in `auth-server.js`
- Verify database is created (`auth.db`)

## Security Features

✅ **Password Hashing**: bcrypt with 12 rounds  
✅ **Rate Limiting**: Prevents spam and brute force  
✅ **Input Validation**: Email format, password strength  
✅ **Account Locking**: After 5 failed login attempts  
✅ **JWT Tokens**: Secure authentication  
✅ **Email Verification**: Prevents fake accounts  

## Next Steps

Your email confirmation system is now fully functional! Users will receive professional confirmation emails when they sign up, and the system includes all necessary security features.

To customize the email template, edit the HTML in the `mailOptions` object in `auth-server.js` around line 203.

