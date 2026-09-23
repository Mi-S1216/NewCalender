/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',            // iOS/Android(Capacitor)用に静的出力
  images: { unoptimized: true },
  trailingSlash: true,
}
module.exports = nextConfig
