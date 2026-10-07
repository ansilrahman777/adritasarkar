/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Clips are requested as /hero/<name>.mp4?v=CLIP_VERSION, so a long cache is safe:
        // bump CLIP_VERSION in components/hero/constants.js after replacing a file.
        source: '/hero/:file*.mp4',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
}

export default nextConfig
