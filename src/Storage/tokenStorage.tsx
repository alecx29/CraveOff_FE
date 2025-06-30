import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// Interface for token data
interface TokenData {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt?: number;
  refreshExpiresAt?: number;
}

// Save tokens
export const saveTokens = async (
  accessToken: string, 
  refreshToken: string, 
  expiresAt?: number, 
  refreshExpiresAt?: number
) => {
  try {
    console.log('[TokenStorage] Saving tokens');
    console.log('[TokenStorage] Access Token:', accessToken?.substring(0, 10) + '...');
    console.log('[TokenStorage] Refresh Token:', refreshToken?.substring(0, 10) + '...');
    
    // Save accessToken in AsyncStorage (will be managed by AuthContext)
    await AsyncStorage.setItem('accessToken', accessToken);
    
    // Verify if token was saved correctly
    const storedAccessToken = await AsyncStorage.getItem('accessToken');
    console.log('[TokenStorage] Access Token saved to AsyncStorage:', storedAccessToken ? 'Success' : 'Failed');
    if (storedAccessToken !== accessToken) {
      console.error('[TokenStorage] Stored token does not match original token!');
    }
    
    // Save refreshToken in AsyncStorage as backup (in case Keychain fails)
    await AsyncStorage.setItem('refreshToken', refreshToken);
    console.log('[TokenStorage] Refresh Token saved to AsyncStorage as backup');
    
    // Save expiration times if provided
    if (expiresAt) {
      await AsyncStorage.setItem('expiresAt', expiresAt.toString());
      console.log('[TokenStorage] Expiration time saved:', new Date(expiresAt * 1000).toISOString());
    }
    
    if (refreshExpiresAt) {
      await AsyncStorage.setItem('refreshExpiresAt', refreshExpiresAt.toString());
      console.log('[TokenStorage] Refresh expiration time saved:', new Date(refreshExpiresAt * 1000).toISOString());
    }
    
    // Try to save in Keychain for enhanced security
    try {
      await Keychain.setGenericPassword('refreshToken', refreshToken);
      console.log('[TokenStorage] Refresh Token also saved to Keychain');
    } catch (keychainError) {
      // Error is ignored since we already have a backup in AsyncStorage
      console.warn('[TokenStorage] Could not save to Keychain, using AsyncStorage fallback');
    }
  } catch (error) {
    console.error('[TokenStorage] Error saving tokens:', error);
  }
};

// Get tokens
export const getTokens = async (): Promise<TokenData> => {
  try {
    // Get accessToken from AsyncStorage
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    // Try to get refreshToken from Keychain
    let refreshToken = null;
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        refreshToken = credentials.password;
        console.log('[TokenStorage] Refresh Token retrieved from Keychain');
      }
    } catch (keychainError) {
      console.warn('[TokenStorage] Error accessing Keychain:', keychainError);
    }
    
    // If we couldn't get from Keychain, try AsyncStorage
    if (!refreshToken) {
      refreshToken = await AsyncStorage.getItem('refreshToken');
      console.log('[TokenStorage] Refresh Token retrieved from AsyncStorage');
    }
    
    // Get expiration times
    const expiresAtString = await AsyncStorage.getItem('expiresAt');
    const refreshExpiresAtString = await AsyncStorage.getItem('refreshExpiresAt');
    
    const expiresAt = expiresAtString ? parseInt(expiresAtString, 10) : undefined;
    const refreshExpiresAt = refreshExpiresAtString ? parseInt(refreshExpiresAtString, 10) : undefined;
    
    return { accessToken, refreshToken, expiresAt, refreshExpiresAt };
  } catch (error) {
    console.error('[TokenStorage] Error retrieving tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

// Get only refresh token
export const getRefreshToken = async () => {
  try {
    // Try Keychain first
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        console.log('[TokenStorage] Refresh Token retrieved from Keychain');
        return credentials.password;
      }
    } catch (keychainError) {
      console.warn('[TokenStorage] Error accessing Keychain in getRefreshToken:', keychainError);
    }
    
    // If not found in Keychain, try AsyncStorage
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    console.log('[TokenStorage] Refresh Token retrieved from AsyncStorage');
    return refreshToken;
  } catch (error) {
    console.error('[TokenStorage] Error retrieving refresh token:', error);
    return null;
  }
};

// Remove tokens
export const clearTokens = async () => {
  try {
    // Delete accessToken from AsyncStorage
    await AsyncStorage.removeItem('accessToken');
    
    // Delete refreshToken from AsyncStorage
    await AsyncStorage.removeItem('refreshToken');
    
    // Delete expiration times
    await AsyncStorage.removeItem('expiresAt');
    await AsyncStorage.removeItem('refreshExpiresAt');
    
    // Try to delete from Keychain
    try {
      await Keychain.resetGenericPassword();
      console.log('[TokenStorage] Tokens cleared from AsyncStorage and Keychain');
    } catch (keychainError) {
      // Ignore error since we already deleted from AsyncStorage
      console.warn('[TokenStorage] Could not clear from Keychain, but cleared from AsyncStorage');
    }
  } catch (error) {
    console.error('[TokenStorage] Error clearing tokens:', error);
  }
};
