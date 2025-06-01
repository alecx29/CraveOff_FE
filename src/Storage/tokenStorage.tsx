import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// Save tokens
export const saveTokens = async (accessToken: string, refreshToken: string) => {
  try {
    console.log('[TokenStorage] Saving tokens');
    
    // Salvăm accessToken în AsyncStorage (va fi gestionat de AuthContext)
    await AsyncStorage.setItem('accessToken', accessToken);
    console.log('[TokenStorage] Access Token saved to AsyncStorage');
    
    // Salvăm refreshToken în AsyncStorage ca backup (pentru cazul în care Keychain eșuează)
    await AsyncStorage.setItem('refreshToken', refreshToken);
    console.log('[TokenStorage] Refresh Token saved to AsyncStorage as backup');
    
    // Încercăm să salvăm și în Keychain pentru securitate sporită
    try {
      await Keychain.setGenericPassword('refreshToken', refreshToken);
      console.log('[TokenStorage] Refresh Token also saved to Keychain');
    } catch (keychainError) {
      // Eroarea este ignorată întrucât avem deja un backup în AsyncStorage
      console.warn('[TokenStorage] Could not save to Keychain, using AsyncStorage fallback');
    }
  } catch (error) {
    console.error('[TokenStorage] Error saving tokens:', error);
  }
};

// Get tokens
export const getTokens = async () => {
  try {
    // Obținem accessToken din AsyncStorage
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    // Încercăm să obținem refreshToken din Keychain
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
    
    // Dacă nu am putut obține din Keychain, încercăm din AsyncStorage
    if (!refreshToken) {
      refreshToken = await AsyncStorage.getItem('refreshToken');
      console.log('[TokenStorage] Refresh Token retrieved from AsyncStorage');
    }
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('[TokenStorage] Error retrieving tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

// Get only refresh token
export const getRefreshToken = async () => {
  try {
    // Încercăm mai întâi Keychain
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        console.log('[TokenStorage] Refresh Token retrieved from Keychain');
        return credentials.password;
      }
    } catch (keychainError) {
      console.warn('[TokenStorage] Error accessing Keychain in getRefreshToken:', keychainError);
    }
    
    // Dacă nu am găsit în Keychain, încercăm AsyncStorage
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
    // Ștergem accessToken din AsyncStorage
    await AsyncStorage.removeItem('accessToken');
    
    // Ștergem refreshToken din AsyncStorage
    await AsyncStorage.removeItem('refreshToken');
    
    // Încercăm să ștergem și din Keychain
    try {
      await Keychain.resetGenericPassword();
      console.log('[TokenStorage] Tokens cleared from AsyncStorage and Keychain');
    } catch (keychainError) {
      // Ignorăm eroarea deoarece am șters deja din AsyncStorage
      console.warn('[TokenStorage] Could not clear from Keychain, but cleared from AsyncStorage');
    }
  } catch (error) {
    console.error('[TokenStorage] Error clearing tokens:', error);
  }
};
