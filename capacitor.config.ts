import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gamingbaji.app',
  appName: 'JXM Tour Club',
  webDir: 'dist',
  server: {
    url: 'https://jxmtourclub-1747c.web.app',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '194765747449-l22sfgpnv6c9gugdhsuij2nsbpu6trv0.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
