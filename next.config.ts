import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export estático: gera o app como arquivos estáticos em `out/`,
  // servível na web e empacotável no APK (Capacitor).
  output: 'export',
  // Cada rota vira pasta com index.html (ex.: historico/index.html). Sem isso,
  // uma navegação de página inteira para /historico não acha arquivo e o
  // servidor local do Capacitor devolve o index.html raiz — a tela de INÍCIO.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
