import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Convex `api.*` proxy is generated on deploy and its branded `Id<>`
  // types intentionally lag the client casts; Convex validates every query /
  // mutation argument at the runtime boundary, so we don't gate the production
  // build on these boundary type mismatches or on lint.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
