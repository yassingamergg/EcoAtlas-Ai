const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test email
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER, // Send to yourself for testing
  subject: 'EcoAtlas AI - Email Test',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d5a27;">EcoAtlas AI Email Test</h2>
      <p>Hello!</p>
      <p>This is a test email to verify your email configuration is working correctly.</p>
      <p>If you receive this email, your setup is successful! 🎉</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 14px;">EcoAtlas AI - Environmental Monitoring Platform</p>
    </div>
  `
};

console.log('Testing email configuration...');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass:', process.env.EMAIL_PASS ? 'Set (hidden)' : 'Not set');

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your EMAIL_USER and EMAIL_PASS in .env file');
    console.log('2. Make sure you\'re using an App Password (not your regular password)');
    console.log('3. Ensure 2-Factor Authentication is enabled on your Gmail account');
  } else {
    console.log('✅ Email test successful!');
    console.log('Message sent:', info.messageId);
    console.log('Check your inbox for the test email.');
  }
});

