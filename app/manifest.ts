import type { MetadataRoute } from 'next'

// iPhone/Androidの「ホーム画面に追加」でアプリのように開くための設定
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'マイカレンダー',
    short_name: 'カレンダー',
    start_url: '/',
    display: 'standalone',
    background_color: '#DCEFFB',
    theme_color: '#00BFFF',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
