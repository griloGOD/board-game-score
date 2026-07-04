import type { MetadataRoute } from 'next';

// Necessário com `output: 'export'` (gera o manifest como arquivo estático).
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Board Game Score',
    short_name: 'BG Score',
    description: 'Placar dos seus jogos de tabuleiro — fiel a cada jogo.',
    start_url: '/',
    display: 'standalone',
    background_color: '#161311',
    theme_color: '#dd6a45',
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
