// services/JsApiService.js
import axios from 'axios';

// Create axios instance with default config
const apiService = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('📤 Request Data:', config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    console.log('📥 Response Data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error);
    
    if (error.response) {
      // Server responded with error status
      console.error('📊 Error Status:', error.response.status);
      console.error('📄 Error Data:', error.response.data);
      console.error('🔧 Error Headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.error('🌐 No Response Received:', error.request);
      console.error('🔗 Possible CORS issue or server down');
    } else {
      // Something else happened
      console.error('⚡ Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiService;