import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gamingbaji.app',
  appName: 'JXM Tour Club',
  webDir: 'dist',
  server: {
    url: 'https://jxmtourclub-1747c.web.app',
    cleartext: true
  }
};

export default config;
