import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export estático: gera o app como arquivos estáticos em `out/`,
  // servível na web e empacotável no APK (Capacitor).
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
