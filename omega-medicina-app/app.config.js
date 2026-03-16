const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

export default {
  expo: {
    name: IS_PREVIEW ? 'OM (Preview)' : 'Omega Medicina',
    slug: 'omega-medicina',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: IS_PREVIEW ? 'omega-medicina-preview' : 'omega-medicina',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0891b2',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_PREVIEW
        ? 'com.omegamedicina.app.preview'
        : 'com.omegamedicina.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0891b2',
      },
      package: IS_PREVIEW
        ? 'com.omegamedicina.app.preview'
        : 'com.omegamedicina.app',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#0891b2',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      // Preview builds point to PythonAnywhere; production to the real domain
      apiUrl: IS_PREVIEW
        ? 'https://omegamedicina.pythonanywhere.com/api/v3'
        : 'https://api.omegamedicina.com/api/v3',
      eas: {
        projectId: 'YOUR_EAS_PROJECT_ID',
      },
    },
  },
};
