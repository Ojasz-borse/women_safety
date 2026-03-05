import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// For Android Emulator, use 10.0.2.2. For iOS or Physical devices, use your computer's IP address.
const BASE_URL = 'http://10.79.206.236:3000/api';

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
