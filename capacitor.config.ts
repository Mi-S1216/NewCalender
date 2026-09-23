import type { CapacitorConfig } from '@capacitor/cli'

// アプリの中で本番サイト(Vercel)を表示する方式。
// サイトを更新すれば、アプリを作り直さなくても中身が自動で最新になる。
const config: CapacitorConfig = {
  appId: 'app.vercel.newcalender',
  appName: 'マイカレンダー',
  webDir: 'www',
  server: {
    url: 'https://new-calender-eta.vercel.app',
    cleartext: false,
  },
  android: {
    backgroundColor: '#87CEFA',
  },
}

export default config
