// Simple test to verify API connection
const testAPI = async () => {
  try {
    console.log('Testing API connection...');
    const response = await fetch('http://localhost:5000/api/sensor-data');
    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.success && data.data) {
      console.log('✅ API is working! Found', data.data.length, 'sensor readings');
      console.log('Latest reading:', data.data[0]);
    } else {
      console.log('❌ API response format issue');
    }
  } catch (error) {
    console.error('❌ API connection failed:', error);
  }
};

// Run the test
testAPI();


