/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // localhost is only needed for local development against the image
      // service; keeping it out of production removes an SSRF-adjacent
      // target from the image optimizer's allowlist.
      ...(isDev
        ? [
            {
              protocol: "http",
              hostname: "localhost",
              pathname: "/**",
              port: "3001",
            },
            {
              protocol: "http",
              hostname: "localhost",
              pathname: "/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "uat.vectorafriqproperties.co.ke",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "vectorafriqproperties.co.ke",
        pathname: "/**",
      },
    ],
    formats: ['image/webp'],
    qualities: [60, 75, 85],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "1000mb",
    },
    proxyClientMaxBodySize: "100mb",
  },
  staticPageGenerationTimeout: 120,
  // Static file tracing configuration
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/**": ["./public/**/*"],
  },
  // Ensure static assets are copied and served correctly
  assetPrefix: process.env.NODE_ENV === "production" ? "/" : "",
  // Removed basic-ftp dependency as we now use image service
};

module.exports = nextConfig;
