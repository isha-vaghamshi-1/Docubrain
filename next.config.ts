import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) loads a worker file at runtime that breaks
  // when bundled. Loading these packages straight from node_modules avoids it.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
