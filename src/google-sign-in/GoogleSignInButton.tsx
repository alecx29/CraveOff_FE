import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import DeviceInfo from 'react-native-device-info';

import AButton from '@/src/components/AButton/AButton';
import { useTheme } from '@/src/context/ThemeProvider';

// Close web browser auth session if started previously
WebBrowser.maybeCompleteAuthSession();

// Get client IDs from app config
const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || '391159890839-orc2jub1onifvuqgtchj0tonpsd5jn61.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId || '391159890839-va2ga57lfrnfugnhn4mvm01jdug850rv.apps.googleusercontent.com';
const IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleIosClientId || '353269821618-n3s13eq5edvpar4nh2j0f0pcjfr9tlpg.apps.googleusercontent.com';

// Configure GoogleSignin for native platforms
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    // The property names below are valid in the library even if TypeScript doesn't recognize them
    // @ts-ignore
    androidClientId: ANDROID_CLIENT_ID,
    // @ts-ignore
    iosClientId: IOS_CLIENT_ID,
    scopes: ['profile', 'email', 'openid'],
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    // @ts-ignore
    hostedDomain: '', // specifies a hosted domain restriction
    // @ts-ignore
    accountName: '', // [Android] specifies an account name on the device that should be used
  });
}

interface SignInButtonProps {
  signInCallback: (idToken: string) => Promise<void>;
}

export default function GoogleSignInButton({ signInCallback }: SignInButtonProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isLoading, setIsLoading] = useState(false);
  const isWeb = Platform.OS === 'web';

  // For web platform only
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'craveoffapp'
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    redirectUri,
    responseType: 'id_token',
    scopes: ['profile', 'email', 'openid'],
    extraParams: {
      prompt: 'select_account',
    },
  });

  // Handle web platform response
  useEffect(() => {
    if (!isWeb) return;

    if (response?.type === 'success' && response.params?.id_token) {
      console.log('✅ Web ID Token received:', response.params.id_token);
      handleSignInCallback(response.params.id_token);
    } else if (response?.type === 'error') {
      console.error('🚨 Web Google Sign-In failed:', response);
      setIsLoading(false);
    }
  }, [response]);

  // Handle the sign-in callback with the ID token
  async function handleSignInCallback(idToken: string) {
    try {
      await signInCallback(idToken);
    } catch (error) {
      console.error('Error in sign-in callback:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle native platform sign-in
  async function handleNativeSignIn() {
    try {
      setIsLoading(true);
      console.log('📱 Verificare Google Play Services...');
      
      // Log device information for debugging
      const appVersion = await DeviceInfo.getVersion();
      const buildNumber = await DeviceInfo.getBuildNumber();
      const deviceType = await DeviceInfo.getDeviceType();
      const isEmulator = await DeviceInfo.isEmulator();
      
      console.log('📱 Device Info:', {
        appVersion,
        buildNumber,
        deviceType,
        isEmulator,
        platform: Platform.OS,
        platformVersion: Platform.Version
      });
      
      await GoogleSignin.hasPlayServices();
      console.log('📱 Google Play Services disponibil, începe autentificarea...');
      console.log('📱 Using client IDs - Web:', WEB_CLIENT_ID.substring(0, 15) + '...');
      console.log('📱 Using client IDs - Android:', ANDROID_CLIENT_ID.substring(0, 15) + '...');
      
      const userInfo = await GoogleSignin.signIn();
      
      console.log('📱 Răspuns Google Sign In:', JSON.stringify(userInfo));
      
      // Verificăm structura obiectului pentru a extrage tokenul corect
      let idToken = null;
      
      // @ts-ignore
      if (userInfo?.idToken) {
        // @ts-ignore
        idToken = userInfo.idToken;
        console.log('📱 Token found in userInfo.idToken');
      // @ts-ignore
      } else if (userInfo?.data?.idToken) {
        // @ts-ignore
        idToken = userInfo.data.idToken;
        console.log('📱 Token found in userInfo.data.idToken');
      }
      
      if (idToken) {
        console.log('✅ Native ID Token received:', idToken.substring(0, 20) + '...');
        await handleSignInCallback(idToken);
      } else {
        console.error('🚨 No ID token received');
        console.error('🚨 User Info Object:', JSON.stringify(userInfo, null, 2));
        setIsLoading(false);
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('🚨 Native Google Sign-In failed:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
      } else {
        console.log('Some other error happened:', error.message);
        console.log('Error object:', JSON.stringify(error, null, 2));
      }
    }
  }

  // Handle web platform sign-in
  async function handleWebSignIn() {
    try {
      setIsLoading(true);
      await promptAsync({ showInRecents: true });
      // Response is handled in the useEffect hook
    } catch (error) {
      console.error('Error starting web sign-in:', error);
      setIsLoading(false);
    }
  }

  // Unified sign-in function that checks platform
  function handleSignInWithGoogle() {
    if (isWeb) {
      handleWebSignIn();
    } else {
      handleNativeSignIn();
    }
  }

  return (
    <AButton
      title="Sign in with Google"
      onPress={handleSignInWithGoogle}
      variant="secondary"
      disabled={isLoading || (isWeb && !request)}
      leftIcon={
        <View style={styles.iconContainer}>
          <Svg width={20} height={20} viewBox="0 0 48 48">
            <Path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
              c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,
              4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <Path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,
              7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <Path
              fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,
              24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            />
            <Path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,
              5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,
              44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </Svg>
        </View>
      }
      customStyles={{
        button: styles.googleButton,
        text: styles.googleButtonText
      }}
    />
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  iconContainer: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    display: 'flex',
  },
  googleButton: {
    backgroundColor: theme.colors.cardBackground,
    borderColor: theme.colors.borderLight,
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    height: 52,
  },
  googleButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    lineHeight: 24,
    textAlignVertical: 'center',
  },
});