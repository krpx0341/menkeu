import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Never cache the service worker file itself — browsers should
        // always re-check it so an updated version (e.g. a bumped
        // CACHE_NAME after a static-asset change) rolls out promptly
        // instead of getting stuck behind a stale cached sw.js.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
