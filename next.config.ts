import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const tauriHost = process.env.TAURI_DEV_HOST;

const allowedDevOrigins = [
  "localhost",
  "127.0.0.1",
  ...(tauriHost ? [tauriHost] : []),
  ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((origin) => origin.trim()) ??
    []),
];

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  ...(!isProd && {
    allowedDevOrigins,
    ...(tauriHost ? { assetPrefix: `http://${tauriHost}:3000` } : {}),
  }),
};

export default nextConfig;
