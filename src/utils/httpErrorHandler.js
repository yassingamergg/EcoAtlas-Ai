// HTTP Error Handler Utility for EcoAtlas AI
// Provides consistent error handling for all API calls

export const handleHttpError = (error, context = 'API call') => {
  console.error(`${context} error:`, error);
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      type: 'CONNECTION_ERROR',
      message: 'Cannot connect to server. Please check if backend is running.',
      details: 'Make sure the backend server is running on port 5000'
    };
  }
  
  if (error.name === 'AbortError') {
    return {
      type: 'TIMEOUT_ERROR',
      message: 'Request timed out. Please try again.',
      details: 'The server took too long to respond'
    };
  }
  
  if (error.message.includes('CORS')) {
    return {
      type: 'CORS_ERROR',
      message: 'Cross-origin request blocked.',
      details: 'Check CORS configuration in backend server'
    };
  }
  
  if (error.message.includes('404')) {
    return {
      type: 'NOT_FOUND',
      message: 'API endpoint not found.',
      details: 'Check if the API endpoint exists'
    };
  }
  
  if (error.message.includes('500')) {
    return {
      type: 'SERVER_ERROR',
      message: 'Internal server error.',
      details: 'Check backend server logs for details'
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    details: 'Please try again or contact support'
  };
};

// Enhanced fetch wrapper with error handling
export const apiCall = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), mergedOptions.timeout);
    
    const response = await fetch(url, {
      ...mergedOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
    
  } catch (error) {
    throw handleHttpError(error, `API call to ${url}`);
  }
};

// Check if backend server is running
export const checkBackendHealth = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'GET',
      timeout: 5000,
    });
    
    if (response.ok) {
      return { status: 'healthy', message: 'Backend server is running' };
    } else {
      return { status: 'unhealthy', message: 'Backend server responded with error' };
    }
  } catch (error) {
    return { 
      status: 'offline', 
      message: 'Backend server is not running or not accessible',
      error: error.message
    };
  }
};

// Retry mechanism for failed requests
export const retryApiCall = async (url, options = {}, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall(url, options);
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

