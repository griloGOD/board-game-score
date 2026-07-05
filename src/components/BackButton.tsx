'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Trata o botão físico "voltar" (e o gesto de deslizar) do Android via
 * @capacitor/app: de qualquer tela vai para o Início; no Início, sai do app.
 * Em navegador puro (sem Capacitor) o import falha silenciosamente e nada muda.
 */
export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('backButton', () => {
          if (pathRef.current === '/') {
            void App.exitApp();
          } else {
            router.push('/');
          }
        });
        cleanup = () => void handle.remove();
      } catch {
        // @capacitor/app indisponível (web) — usa o comportamento padrão do navegador.
      }
    })();
    return () => cleanup?.();
  }, [router]);

  return null;
}
