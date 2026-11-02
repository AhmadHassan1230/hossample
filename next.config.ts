import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Demo build: never let search engines index it until HoS approves publication.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  images: { formats: ["image/avif", "image/webp"] },
  // dev: the studio is also checked on 127.0.0.1 (a separate origin for the browser's WebGL guard)
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
