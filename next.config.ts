import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Label photos are resized in the browser to about 1600 px JPEG before upload, well under this.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
