// frontend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Dev: proxy /api -> backend
    if (process.env.NODE_ENV !== "production") {
      const target = process.env.DEV_API_TARGET || "http://backend:8000";
      return [{ source: "/api/:path*", destination: `${target}/:path*` }];
    }
    // Prod: Nginx handles /api proxying
    return [];
  },
};

export default nextConfig;
