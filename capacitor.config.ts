import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dadminete.sistema',
  appName: 'Sistema de Gestión',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow connections to your local backend
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
