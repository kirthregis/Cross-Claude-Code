import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse/pdf.js loads its worker from disk at runtime; bundling it breaks
  // that lookup. Keep it external so the package's own files stay resolvable.
  serverExternalPackages: ["pdf-parse"],
  /* config options here */
};

export default nextConfig;
