import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const GoogleSignIn = ({ onSuccess, onError }) => {
  const { googleLogin } = useAuth();
  const googleButtonRef = useRef(null);
  const googleLoaded = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (googleLoaded.current) return;
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleLoaded.current = true;
        initializeGoogleSignIn();
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        onError && onError('Failed to load Google services');
      };
      document.head.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (typeof window.google !== 'undefined' && window.google.accounts && window.google.accounts.id) {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        
        if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID' || clientId === 'your_actual_google_client_id_here') {
          console.error('Google Client ID not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file');
          onError && onError('Google authentication not configured. Please contact administrator.');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Render the sign-in button
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        }
      }
    };

    const handleCredentialResponse = async (response) => {
      try {
        setIsLoading(true);
        setError('');
        
        // Decode the JWT token
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        
        const userInfo = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          given_name: payload.given_name,
          family_name: payload.family_name,
          email_verified: payload.email_verified,
          provider: 'google'
        };

        console.log('Google Sign-In successful:', userInfo);
        
        // Send to backend for authentication
        const result = await googleLogin(userInfo);
        
        if (result.success) {
          onSuccess && onSuccess(result.data);
        } else {
          const errorMsg = result.error || 'Google authentication failed';
          setError(errorMsg);
          onError && onError(errorMsg);
        }
      } catch (error) {
        console.error('Error processing Google Sign-In:', error);
        let errorMsg = 'Failed to process Google Sign-In';
        
        // Handle specific error types
        if (error.message.includes('JSON')) {
          errorMsg = 'Server error - please try again in a few minutes';
        } else if (error.message.includes('fetch')) {
          errorMsg = 'Network error - please check your connection';
        }
        
        setError(errorMsg);
        onError && onError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadGoogleScript();

    return () => {
      // Cleanup
      if (typeof window.google !== 'undefined' && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [onSuccess, onError]);

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <div ref={googleButtonRef} className="w-full">
        {isLoading && (
          <div className="w-full bg-gray-100 rounded-lg p-3 text-center text-gray-600">
            Authenticating with Google...
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSignIn;
