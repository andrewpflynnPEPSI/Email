/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for Electron (no image CDN available)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
