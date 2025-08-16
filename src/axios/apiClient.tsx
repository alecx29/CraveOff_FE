import axios from 'axios';
import { getTokens, saveTokens, getRefreshToken, clearTokens } from '@/src/Storage/tokenStorage';
import { baseURL } from '@/src/config-files/constants/backend-url';

// Create a lock mechanism to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;
let refreshSubscribers: Array<(token: string) => void> = [];

// Function to add callbacks to the queue
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Function to notify all subscribers with a new token
const onRefreshSuccess = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// Create Axios instance
export const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClientImage = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Log all outgoing requests
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      
      // Skip adding Authorization header for authentication endpoints
      if (config.url === '/auth/authenticate' || config.url === '/auth/login' || config.url === '/auth/signup') {
        console.log(`[API Client] Skipping Authorization header for ${config.url}`);
        console.log(`[API Client] Headers for auth endpoint:`, JSON.stringify(config.headers, null, 2));
        return config;
      }
      
      // Check if token is about to expire and refresh if needed
      const { accessToken, expiresAt } = await getTokens();
      
      if (accessToken) {
        // Check if token is expired or about to expire (within 5 minutes)
        const now = Math.floor(Date.now() / 1000);
        const shouldRefresh = expiresAt && expiresAt - now < 300;
        
        if (shouldRefresh && config.url !== '/auth/refresh') {
          console.log('Token about to expire, refreshing before request');
          try {
            const newToken = await refreshTokenManually();
            if (newToken) {
              config.headers.Authorization = `Bearer ${newToken}`;
              return config;
            }
          } catch (error) {
            console.error('Error refreshing token before request:', error);
          }
        }
        
        // Set the token in the header
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    // Log error responses
    if (error.response) {
      console.log(`API Error Response: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    } else {
      console.log(`API Request Failed:`, error.message);
    }
    
    const originalRequest = error.config;
    
    // If the error is not 401 or the request has already been retried, reject
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    originalRequest._retry = true;
    
    // If a refresh is already in progress, wait for it to complete
    if (isRefreshing) {
      try {
        // Wait for the current refresh to complete
        const newToken = await new Promise<string>((resolve) => {
          addRefreshSubscriber((token: string) => {
            resolve(token);
          });
        });
        
        // Update the request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    // Start a new refresh process
    isRefreshing = true;
    
    try {
      // Get the refresh token
      const { refreshToken, refreshExpiresAt } = await getTokens();
      
      // Check if refresh token is expired
      const now = Math.floor(Date.now() / 1000);
      if (refreshExpiresAt && refreshExpiresAt <= now) {
        console.log('Refresh token expired, logging out');
        // Clear tokens instead of clearing all AsyncStorage
        await clearTokens();
        isRefreshing = false;
        return Promise.reject(new Error('Refresh token expired'));
      }
      
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(new Error('No refresh token available'));
      }
      
      // Create the refresh promise
      refreshPromise = apiClient.post('/auth/refresh', { refresh_token: refreshToken });
      
      // Wait for the response
      const response = await refreshPromise;
      const userData = response.data;
      
      // Save the new tokens
      await saveTokens(
        userData.access_token,
        userData.refresh_token || refreshToken,
        userData.expires_at,
        userData.refresh_expires_at
      );
      
      // Update the default headers for future requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
      apiClientImage.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
      
      // Notify all subscribers
      onRefreshSuccess(userData.access_token);
      
      // Update the current request
      originalRequest.headers.Authorization = `Bearer ${userData.access_token}`;
      
      // Reset the refresh state
      isRefreshing = false;
      refreshPromise = null;
      
      // Retry the original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Reset the refresh state
      isRefreshing = false;
      refreshPromise = null;
      
      // Clear tokens on refresh failure instead of clearing all AsyncStorage
      await clearTokens();
      
      return Promise.reject(refreshError);
    }
  }
);

// Check if token is expired (or about to expire)
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const { expiresAt } = await getTokens();
    
    if (!expiresAt) {
      return true; // If we don't have an expiration time, assume it's expired
    }
    
    const now = Math.floor(Date.now() / 1000);
    const isExpired = expiresAt - now < 300; // Consider expired if less than 5 minutes left (standardizat la 5 minute)
    
    return isExpired;
  } catch (error) {
    console.error('[API Client] Error checking token expiration:', error);
    return true; // Assume expired on error
  }
};

// Function to manually refresh token
export const refreshTokenManually = async (): Promise<string | null> => {
  // If a refresh is already in progress, wait for it to complete
  if (isRefreshing && refreshPromise) {
    try {
      const response = await refreshPromise;
      return response.data.access_token;
    } catch (error) {
      return null;
    }
  }
  
  // Start a new refresh process
  isRefreshing = true;
  
  try {
    // Get the refresh token
    const { refreshToken, refreshExpiresAt } = await getTokens();
    
    // Check if refresh token is expired
    const now = Math.floor(Date.now() / 1000);
    if (refreshExpiresAt && refreshExpiresAt <= now) {
      console.log('Refresh token expired during manual refresh');
      // Clear tokens instead of clearing all AsyncStorage
      await clearTokens();
      isRefreshing = false;
      return null;
    }
    
    if (!refreshToken) {
      isRefreshing = false;
      return null;
    }
    
    // Create the refresh promise
    refreshPromise = apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    
    // Wait for the response
    const response = await refreshPromise;
    const userData = response.data;
    
    // Save the new tokens
    await saveTokens(
      userData.access_token,
      userData.refresh_token || refreshToken,
      userData.expires_at,
      userData.refresh_expires_at
    );
    
    // Update the default headers for future requests
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
    apiClientImage.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
    
    // Reset the refresh state
    isRefreshing = false;
    refreshPromise = null;
    
    return userData.access_token;
  } catch (error) {
    console.error('Error refreshing token manually:', error);
    
    // Reset the refresh state
    isRefreshing = false;
    refreshPromise = null;
    
    return null;
  }
};

// Add a request interceptor to inject the access token
apiClientImage.interceptors.request.use(
  async config => {
    // Skip token refresh for refresh token requests to avoid loops
    if (config.url?.includes('/auth/refresh')) {
      return config;
    }
    
    // Check if token is expired and refresh if needed
    const tokenExpired = await isTokenExpired();
    if (tokenExpired) {
      console.log('[Image Request Interceptor] Token expired, attempting refresh before request');
      await refreshTokenManually();
    }
    
    const accessToken = await getTokens().then(tokens => tokens.accessToken);
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
        // Obținem refreshToken din SecureStore sau AsyncStorage
        const refreshToken = await getRefreshToken();
        console.log('[Image Response Interceptor] Refresh Token exists:', !!refreshToken);
        
        if (refreshToken) {
          console.log('[Image Response Interceptor] Attempting to refresh token...');
          
          // Send refresh_token in the format expected by the backend
          const response = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          // Handle the token format from the backend (access_token instead of accessToken)
          const newAccessToken = response.data.access_token;
          const newRefreshToken = response.data.refresh_token;
          const expiresAt = response.data.expires_at;
          const refreshExpiresAt = response.data.refresh_expires_at;
          
          console.log('[Image Response Interceptor] Token refreshed successfully');

          // Save tokens using the tokenStorage function
          await saveTokens(newAccessToken, newRefreshToken, expiresAt, refreshExpiresAt);
          
          // Update default headers for all future requests
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          apiClientImage.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          console.log('[Image Response Interceptor] API client default headers updated with new token');
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log('[Image Response Interceptor] Retrying original request with new token');
          return apiClientImage(originalRequest);
        } else {
          console.log('[Image Response Interceptor] No refresh token available');
        }
      } catch (refreshError: any) {
        console.error('[Image Response Interceptor] Error refreshing token:', refreshError);
        console.error('[Image Response Interceptor] Error details:', refreshError.response?.data);
        // Înlocuim cu clearTokens() în loc de a șterge doar accessToken
        await clearTokens();
      }
    }
    return Promise.reject(error);
  },
);
