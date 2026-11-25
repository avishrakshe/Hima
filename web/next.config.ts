import type { NextConfig } from "next";

/**
 * Static export: `pnpm build` emits a plain HTML/CSS/JS site into `out/`
 * that can be hosted anywhere (Vercel, GitHub Pages, IPFS, a USB stick at
 * a campus event).
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
