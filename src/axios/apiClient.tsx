import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getRefreshToken } from '@/src/Storage/tokenStorage';

const API_BASE_URL = 'http://localhost:8000/api';
// const API_BASE_URL = 'https://craveoff-production.up.railway.app/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the access token
apiClient.interceptors.request.use(
  async config => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    console.log('[Request Interceptor] Access Token:', accessToken ? 'Token exists' : 'No token');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('[Request Interceptor] Authorization header set');
    } else {
      console.log('[Request Interceptor] No Authorization header set - missing token');
    }
    
    console.log('[Request Interceptor] URL:', config.url);
    return config;
  },
  error => {
    console.log('[Request Interceptor] Error:', error);
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle token refresh
apiClient.interceptors.response.use(
  response => {
    console.log('[Response Interceptor] Success for URL:', response.config.url);
    return response;
  },
  async error => {
    console.log('[Response Interceptor] Error status:', error.response?.status);
    console.log('[Response Interceptor] Error URL:', error.config?.url);
    
    const originalRequest = error.config;

    // If access token expired, try to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loops
      try {
        // Obținem refreshToken din Keychain în loc de AsyncStorage
        const refreshToken = await getRefreshToken();
        console.log('[Response Interceptor] Refresh Token exists:', !!refreshToken);
        
        if (refreshToken) {
          console.log('[Response Interceptor] Attempting to refresh token...');
          
          // Verificăm structura așteptată pentru refresh token
          console.log('[Response Interceptor] Payload pentru refresh:', JSON.stringify({ refreshToken }));
          
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          console.log('[Response Interceptor] Refresh response:', response.data);
          const newAccessToken = response.data.accessToken || response.data.access_token;
          console.log('[Response Interceptor] Token refreshed successfully');

          // Save new access token and retry the original request
          await AsyncStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log('[Response Interceptor] Retrying original request with new token');
          return apiClient(originalRequest);
        } else {
          console.log('[Response Interceptor] No refresh token available');
        }
      } catch (refreshError: any) {
        console.error('[Response Interceptor] Error refreshing token:', refreshError);
        console.error('[Response Interceptor] Error details:', refreshError.response?.data);
        await AsyncStorage.removeItem('accessToken');
      }
    }
    return Promise.reject(error);
  },
);

const apiClientImage = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

// Add a request interceptor to inject the access token
apiClientImage.interceptors.request.use(
  async config => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    console.log('[Image Request Interceptor] Access Token:', accessToken ? 'Token exists' : 'No token');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('[Image Request Interceptor] Authorization header set');
    } else {
      console.log('[Image Request Interceptor] No Authorization header set - missing token');
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle token refresh
apiClientImage.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // If access token expired, try to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loops
      try {
        // Obținem refreshToken din Keychain în loc de AsyncStorage
        const refreshToken = await getRefreshToken();
        console.log('[Image Response Interceptor] Refresh Token exists:', !!refreshToken);
        
        if (refreshToken) {
          console.log('[Image Response Interceptor] Attempting to refresh token...');
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const newAccessToken = response.data.accessToken || response.data.access_token;
          console.log('[Image Response Interceptor] Token refreshed successfully');

          // Save new access token and retry the original request
          await AsyncStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log('[Image Response Interceptor] Retrying original request with new token');
          return apiClientImage(originalRequest);
        } else {
          console.log('[Image Response Interceptor] No refresh token available');
        }
      } catch (refreshError: any) {
        console.error('[Image Response Interceptor] Error refreshing token:', refreshError);
        console.error('[Image Response Interceptor] Error details:', refreshError.response?.data);
        await AsyncStorage.removeItem('accessToken');
      }
    }
    return Promise.reject(error);
  },
);

export { apiClient, apiClientImage };
