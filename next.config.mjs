// Suppress noisy invalid source map warnings in dev (Windows path issues)
if (typeof process.setSourceMapsEnabled === "function") {
  try { process.setSourceMapsEnabled(false); } catch {}
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
  webpack: (config, { dev }) => {
    // Disable source maps in dev to avoid Node invalid source map warnings
    if (dev) {
      config.devtool = false;
    }
    return config;
  },
  productionBrowserSourceMaps: false,
  turbopack: {}, // Silence Turbopack/webpack config warning
};

export default nextConfig;
