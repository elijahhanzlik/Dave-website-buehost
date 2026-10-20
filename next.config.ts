import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploads get a random UUID path (app/api/upload), so an optimized file
    // never goes stale — keep it cached long instead of re-transforming.
    minimumCacheTTL: 2678400, // 31 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
      {
        // Placeholder artwork/blog images used when Supabase is empty or
        // unconfigured (see PLACEHOLDER_* in the public pages). Without this,
        // next/image would reject these hosts on the demo/fallback path.
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
