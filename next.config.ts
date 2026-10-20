import type { NextConfig } from "next";

// Cache Components stays off: every page here reads the session cookie, so nothing
// benefits from prerendering, and the classic dynamic rendering is simpler to reason about.
const nextConfig: NextConfig = {
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
