import React, { useState } from 'react';
import { X, User, Mail, CheckCircle } from 'lucide-react';
import SignupForm from './SignupForm';
import LoginForm from './LoginForm';
import VerificationForm from './VerificationForm';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'verification'
  const [verificationEmail, setVerificationEmail] = useState('');

  // Handle successful signup
  const handleSignupSuccess = (email) => {
    setVerificationEmail(email);
    setCurrentView('verification');
  };

  // Handle successful verification
  const handleVerificationSuccess = () => {
    setCurrentView('login');
    // Show success message or auto-login
  };

  // Handle successful login
  const handleLoginSuccess = (userData) => {
    if (onSuccess) {
      onSuccess(userData);
    }
    onClose();
  };

  // Handle modal close
  const handleClose = () => {
    setCurrentView('login');
    setVerificationEmail('');
    onClose();
  };

  // Switch between views
  const switchToLogin = () => setCurrentView('login');
  const switchToSignup = () => setCurrentView('signup');
  const switchToVerification = () => setCurrentView('verification');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose}></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute -top-4 -right-4 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Modal Content */}
          <div className="bg-white rounded-lg shadow-xl">
            {/* Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {currentView === 'verification' ? (
                    <Mail className="w-8 h-8 text-green-600" />
                  ) : (
                    <User className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentView === 'login' && 'Welcome Back'}
                  {currentView === 'signup' && 'Join EcoAtlas AI'}
                  {currentView === 'verification' && 'Verify Your Email'}
                </h2>
                <p className="text-gray-600">
                  {currentView === 'login' && 'Sign in to your account'}
                  {currentView === 'signup' && 'Create your account to get started'}
                  {currentView === 'verification' && 'Enter the code we sent to your email'}
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-8 pb-8">
              {currentView === 'login' && (
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onSwitchToSignup={switchToSignup}
                />
              )}
              
              {currentView === 'signup' && (
                <SignupForm
                  onSuccess={handleSignupSuccess}
                  onSwitchToLogin={switchToLogin}
                />
              )}
              
              {currentView === 'verification' && (
                <VerificationForm
                  email={verificationEmail}
                  onSuccess={handleVerificationSuccess}
                  onBack={switchToSignup}
                />
              )}
            </div>

            {/* Progress Indicator */}
            <div className="px-8 pb-6">
              <div className="flex justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  currentView === 'login' ? 'bg-green-600' : 'bg-gray-300'
                }`}></div>
                <div className={`w-2 h-2 rounded-full ${
                  currentView === 'signup' ? 'bg-green-600' : 'bg-gray-300'
                }`}></div>
                <div className={`w-2 h-2 rounded-full ${
                  currentView === 'verification' ? 'bg-green-600' : 'bg-gray-300'
                }`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;





