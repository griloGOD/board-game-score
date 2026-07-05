import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { BackButton } from '@/components/BackButton';

const display = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const sans = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Board Game Score',
  description: 'Placar dos seus jogos de tabuleiro — fiel a cada jogo.',
  applicationName: 'Board Game Score',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Board Game Score' },
};

export const viewport: Viewport = {
  themeColor: '#dd6a45',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24">{children}</main>
        <BottomNav />
        <ServiceWorkerRegister />
        <BackButton />
      </body>
    </html>
  );
}
