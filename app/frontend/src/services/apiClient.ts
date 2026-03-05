import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// For Android Emulator, use 10.0.2.2. For iOS or Physical devices, use your computer's IP address.
// Use Render backend URL for production
const BASE_URL = 'https://women-safety-51m4.onrender.com/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log("Error fetching token from SecureStore", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
