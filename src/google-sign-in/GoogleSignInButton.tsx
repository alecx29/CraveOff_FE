import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useContext, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import AButton from '@/src/components/AButton/AButton';
import { AuthContext } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeProvider';


// ✅ Închide sesiunea de autentificare dacă a fost începută anterior
WebBrowser.maybeCompleteAuthSession({
  skipRedirectCheck: true
});

interface SignInButtonProps {
  signInCallback: (idToken: string) => Promise<void>; // Function type
}

export default function GoogleSignInButton({signInCallback}: SignInButtonProps) {
  const { theme } = useTheme();
  const { user, signIn } = useContext(AuthContext);
  const styles = createStyles(theme);

  // ✅ Definim `redirectUri` corect în funcție de mediu
  const redirectUri2 = AuthSession.makeRedirectUri(
    // scheme: 'com.usualsuspect29.macrobuddyfe', // Trebuie să fie același ca `package` din `app.json`
    // preferLocalhost: true, // ✅ Folosește `localhost` în simulatoare
    // path: 'oauthredirect', // ✅ Asigură-te că îl ai aicis
  );

  // const redirectUri = "http://localhost:8081";
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'com.usualsuspect29.macrobuddyfe' });
  // const redirectUri = "https://auth.expo.io/@usualsuspect29/macrobuddyfe";

  console.log('🔍 Redirect URI utilizat în cod:', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({ 
    webClientId: '353269821618-po6jqf5dd68ifae2ogqaorp9ic7foebl.apps.googleusercontent.com',
    androidClientId: '353269821618-ini63479ot2ohbq07ke0b2sqa0c5vik6.apps.googleusercontent.com',
    iosClientId: '353269821618-n3s13eq5edvpar4nh2j0f0pcjfr9tlpg.apps.googleusercontent.com',
    redirectUri,
    responseType: 'id_token', 
    scopes: ['profile', 'email', 'openid'],
    extraParams: {
      prompt: 'select_account',
    },
  });
  useEffect(() => {
    console.log('📡 Google OAuth Response:', response); // ✅ Debugging
  
    if (response?.type === 'success' && response.params?.id_token) {
      console.log('✅ ID Token primit:', response.params.id_token);
      handleSignInWithGoogle(response.params.id_token);
    } else if (response?.type === 'error') {
      console.error('🚨 Google Sign-In failed:', response);
    }
  }, [response]);
  

  async function handleSignInWithGoogle(idToken: string) {
    signInCallback(idToken);
  }

  return (
    <AButton
      disabled={!request}
      title="Sign in with Google"
      onPress={() => promptAsync({ showInRecents: true })}
      variant="secondary"
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
  },
});