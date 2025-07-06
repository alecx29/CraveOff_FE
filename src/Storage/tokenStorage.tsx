import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const EXPIRES_AT_KEY = 'expiresAt';
const REFRESH_EXPIRES_AT_KEY = 'refreshExpiresAt';

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
    
    // Opțiuni pentru SecureStore pentru a asigura persistența
    const secureStoreOptions = {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      keychainService: 'com.craveoff.app.tokens'
    };
    
    // Save tokens in SecureStore
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken, secureStoreOptions);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, secureStoreOptions);
    
    // Save expiration times if provided
    if (expiresAt) {
      await SecureStore.setItemAsync(EXPIRES_AT_KEY, expiresAt.toString(), secureStoreOptions);
      console.log('[TokenStorage] Expiration time saved:', new Date(expiresAt * 1000).toISOString());
    }
    
    if (refreshExpiresAt) {
      await SecureStore.setItemAsync(REFRESH_EXPIRES_AT_KEY, refreshExpiresAt.toString(), secureStoreOptions);
      console.log('[TokenStorage] Refresh expiration time saved:', new Date(refreshExpiresAt * 1000).toISOString());
    }
    
    // Always save backup in AsyncStorage
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      
      if (expiresAt) {
        await AsyncStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString());
      }
      
      if (refreshExpiresAt) {
        await AsyncStorage.setItem(REFRESH_EXPIRES_AT_KEY, refreshExpiresAt.toString());
      }
      
      console.log('[TokenStorage] Tokens also saved to AsyncStorage as backup');
      
      // Verifică imediat că tokenii au fost salvați
      const savedAccessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const savedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      console.log('[TokenStorage] Verification of AsyncStorage save:', {
        accessTokenSaved: savedAccessToken === accessToken,
        refreshTokenSaved: savedRefreshToken === refreshToken
      });
      
    } catch (asyncError) {
      console.warn('[TokenStorage] Could not save backup to AsyncStorage:', asyncError);
    }
    
    // Verifică imediat că tokenii au fost salvați în SecureStore
    const secureAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const secureRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    
    console.log('[TokenStorage] Verification of SecureStore save:', {
      accessTokenSaved: secureAccessToken === accessToken,
      refreshTokenSaved: secureRefreshToken === refreshToken
    });
    
  } catch (error) {
    console.error('[TokenStorage] Error saving tokens to SecureStore:', error);
    
    // If SecureStore fails, try to save to AsyncStorage as fallback
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      
      if (expiresAt) {
        await AsyncStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString());
      }
      
      if (refreshExpiresAt) {
        await AsyncStorage.setItem(REFRESH_EXPIRES_AT_KEY, refreshExpiresAt.toString());
      }
      
      console.log('[TokenStorage] Tokens saved to AsyncStorage as fallback');
      
      // Verifică imediat că tokenii au fost salvați
      const savedAccessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const savedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      console.log('[TokenStorage] Verification of AsyncStorage fallback save:', {
        accessTokenSaved: savedAccessToken === accessToken,
        refreshTokenSaved: savedRefreshToken === refreshToken
      });
      
    } catch (asyncError) {
      console.error('[TokenStorage] Critical error: Could not save tokens anywhere:', asyncError);
    }
  }
};

// Get tokens
export const getTokens = async (): Promise<TokenData> => {
  try {
    console.log('[TokenStorage] Attempting to retrieve tokens...');
    // Try to get tokens from SecureStore first with explicit keychainService
    const secureStoreOptions = {
      keychainService: 'com.craveoff.app.tokens'
    };
    
    let accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY, secureStoreOptions);
    let refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions);
    let expiresAtString = await SecureStore.getItemAsync(EXPIRES_AT_KEY, secureStoreOptions);
    let refreshExpiresAtString = await SecureStore.getItemAsync(REFRESH_EXPIRES_AT_KEY, secureStoreOptions);
    
    console.log('[TokenStorage] SecureStore check result:', {
      accessTokenExists: !!accessToken,
      refreshTokenExists: !!refreshToken
    });
    
    if (accessToken && refreshToken) {
      console.log('[TokenStorage] Tokens retrieved from SecureStore');
    } else {
      // If not found in SecureStore, try AsyncStorage
      console.log('[TokenStorage] Tokens not found in SecureStore, trying AsyncStorage');
      accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      expiresAtString = await AsyncStorage.getItem(EXPIRES_AT_KEY);
      refreshExpiresAtString = await AsyncStorage.getItem(REFRESH_EXPIRES_AT_KEY);
      
      console.log('[TokenStorage] AsyncStorage check result:', {
        accessTokenExists: !!accessToken,
        refreshTokenExists: !!refreshToken
      });
      
      if (accessToken && refreshToken) {
        console.log('[TokenStorage] Tokens retrieved from AsyncStorage');
        
        // If found in AsyncStorage, save them back to SecureStore for next time
        try {
          const secureStoreOptions = {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            keychainService: 'com.craveoff.app.tokens'
          };
          
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken, secureStoreOptions);
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, secureStoreOptions);
          
          if (expiresAtString) {
            await SecureStore.setItemAsync(EXPIRES_AT_KEY, expiresAtString, secureStoreOptions);
          }
          
          if (refreshExpiresAtString) {
            await SecureStore.setItemAsync(REFRESH_EXPIRES_AT_KEY, refreshExpiresAtString, secureStoreOptions);
          }
          
          console.log('[TokenStorage] Migrated tokens from AsyncStorage to SecureStore');
        } catch (secureStoreError) {
          console.warn('[TokenStorage] Could not migrate tokens to SecureStore:', secureStoreError);
        }
      } else {
        console.log('[TokenStorage] No tokens found in either storage location');
      }
    }
    
    const expiresAt = expiresAtString ? parseInt(expiresAtString, 10) : undefined;
    const refreshExpiresAt = refreshExpiresAtString ? parseInt(refreshExpiresAtString, 10) : undefined;
    
    console.log('[TokenStorage] Final token retrieval result:', {
      accessTokenExists: !!accessToken,
      refreshTokenExists: !!refreshToken,
      expiresAtExists: !!expiresAt,
      refreshExpiresAtExists: !!refreshExpiresAt
    });
    
    return { accessToken, refreshToken, expiresAt, refreshExpiresAt };
  } catch (error) {
    console.error('[TokenStorage] Error retrieving tokens:', error);
    
    // Last resort: try AsyncStorage directly
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      const expiresAtString = await AsyncStorage.getItem(EXPIRES_AT_KEY);
      const refreshExpiresAtString = await AsyncStorage.getItem(REFRESH_EXPIRES_AT_KEY);
      
      const expiresAt = expiresAtString ? parseInt(expiresAtString, 10) : undefined;
      const refreshExpiresAt = refreshExpiresAtString ? parseInt(refreshExpiresAtString, 10) : undefined;
      
      return { accessToken, refreshToken, expiresAt, refreshExpiresAt };
    } catch (asyncError) {
      console.error('[TokenStorage] Critical error: Could not retrieve tokens from anywhere:', asyncError);
      return { accessToken: null, refreshToken: null };
    }
  }
};

// Get only refresh token
export const getRefreshToken = async () => {
  try {
    // Try SecureStore first with explicit keychainService
    const secureStoreOptions = {
      keychainService: 'com.craveoff.app.tokens'
    };
    
    let refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions);
    
    if (refreshToken) {
      console.log('[TokenStorage] Refresh Token retrieved from SecureStore');
      return refreshToken;
    }
    
    // If not found in SecureStore, try AsyncStorage
    refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (refreshToken) {
      console.log('[TokenStorage] Refresh Token retrieved from AsyncStorage');
      
      // Migrate to SecureStore for next time
      try {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, secureStoreOptions);
        console.log('[TokenStorage] Migrated Refresh Token from AsyncStorage to SecureStore');
      } catch (secureStoreError) {
        console.warn('[TokenStorage] Could not migrate Refresh Token to SecureStore:', secureStoreError);
      }
    } else {
      console.log('[TokenStorage] Refresh Token not found in any storage');
    }
    
    return refreshToken;
  } catch (error) {
    console.error('[TokenStorage] Error retrieving refresh token:', error);
    return null;
  }
};

// Remove tokens
export const clearTokens = async () => {
  try {
    // Clear from SecureStore with explicit keychainService
    const secureStoreOptions = {
      keychainService: 'com.craveoff.app.tokens'
    };
    
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, secureStoreOptions);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions);
    await SecureStore.deleteItemAsync(EXPIRES_AT_KEY, secureStoreOptions);
    await SecureStore.deleteItemAsync(REFRESH_EXPIRES_AT_KEY, secureStoreOptions);
    
    // Also try without keychainService (for backward compatibility)
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(EXPIRES_AT_KEY);
    await SecureStore.deleteItemAsync(REFRESH_EXPIRES_AT_KEY);
    
    // Also clear from AsyncStorage
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(EXPIRES_AT_KEY);
    await AsyncStorage.removeItem(REFRESH_EXPIRES_AT_KEY);
    
    console.log('[TokenStorage] Tokens cleared from SecureStore and AsyncStorage');
  } catch (error) {
    console.error('[TokenStorage] Error clearing tokens:', error);
  }
};
