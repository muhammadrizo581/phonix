import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.phonix.app',
  appName: 'Phonix',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  }
  // server: { url: ... } qismini o'chiring
};

export default config;