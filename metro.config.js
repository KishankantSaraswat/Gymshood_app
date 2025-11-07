// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const isWeb = process.env.EXPO_TARGET === 'web';

// Extend supported file types
config.resolver.sourceExts.push('cjs');

// Apply mock aliases only on web
if (isWeb) {
  config.resolver.alias = {
    ...(config.resolver.alias || {}),
    'react-native-maps': path.resolve(__dirname, 'mocks/react-native-maps.js'),
    '@stripe/stripe-react-native': path.resolve(__dirname, 'mocks/empty.js'),
    'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'mocks/empty.js'),
  };
}

module.exports = config;
