const { CapacitorConfig } = require('@capacitor/cli');

/** @type {CapacitorConfig} */
const config = {
  appId: 'com.shinken.app',
  appName: 'SHINKEN',
  webDir: 'web-build',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    backgroundColor: '#0A0A0F',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0A0A0F',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

module.exports = config;
