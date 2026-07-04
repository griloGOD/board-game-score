'use client';

import { useEffect, useRef } from 'react';

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Picker de emoji "qualquer um" — monta o emoji-mart vanilla (set nativo, sem
 * imagens de CDN → funciona offline). Carregado sob demanda (import dinâmico)
 * para não pesar o bundle inicial.
 */
export function EmojiPicker({ onSelect, onClose }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    let node: HTMLElement | null = null;
    let cancelled = false;

    (async () => {
      const [{ Picker }, data] = await Promise.all([
        import('emoji-mart'),
        import('@emoji-mart/data').then((m) => m.default),
      ]);
      if (cancelled || !hostRef.current) return;
      node = new Picker({
        data,
        onEmojiSelect: (emoji: { native: string }) => selectRef.current(emoji.native),
        set: 'native',
        theme: 'auto',
        previewPosition: 'none',
        skinTonePosition: 'search',
        dynamicWidth: true,
        autoFocus: true,
      });
      hostRef.current.appendChild(node as unknown as Node);
    })();

    return () => {
      cancelled = true;
      node?.remove();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-t-2xl shadow-xl sm:rounded-2xl [&>em-emoji-picker]:w-full"
        onClick={(e) => e.stopPropagation()}
        ref={hostRef}
      />
    </div>
  );
}
