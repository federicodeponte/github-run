import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: resolve(__dirname),
  },
};

export default nextConfig;
