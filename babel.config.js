module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module-resolver', {
      root: ['.'],
      extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.json'],
      alias: {
        '@client': './client',
        '@components': './client/components',
        '@screens': './client/screens',
        '@services': './client/services',
        '@constants': './client/constants',
        '@context': './client/context',
        '@hooks': './client/hooks',
        '@navigation': './client/navigation',
        '@i18n': './client/i18n',
        '@src': './src',
      },
    }],
    'react-native-reanimated/plugin',
  ],
};
