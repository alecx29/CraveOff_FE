const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

if (process.env.EXPO_PLATFORM === 'web' || process.env.WEB === 'true') {
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'lottie-react-native': path.resolve(__dirname, 'src/components/LottieNativeShim.tsx'),
  };
}

module.exports = config; 