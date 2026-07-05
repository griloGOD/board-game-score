/**
 * Presets visuais para diferenciar jogadores no modo local (Fase 1):
 * avatares prontos (emoji) + uma paleta de cores. Sem upload de foto.
 */

export const AVATAR_PRESETS = [
  '🦊', '🐼', '🐸', '🦁', '🐵', '🐧', '🐙', '🦖',
  '🐝', '🦄', '🐢', '🐨', '🦉', '🐳', '🦋', '🐷',
] as const;

export type AvatarKey = (typeof AVATAR_PRESETS)[number];

/** Paleta de cores (hex) atribuída a cada jogador. */
export const COLOR_PRESETS = [
  '#ef4444', // vermelho
  '#f97316', // laranja
  '#f59e0b', // âmbar
  '#22c55e', // verde
  '#14b8a6', // teal
  '#3b82f6', // azul
  '#6366f1', // índigo
  '#a855f7', // roxo
  '#ec4899', // rosa
  '#64748b', // cinza
] as const;

export type ColorKey = (typeof COLOR_PRESETS)[number];

/** Escolhe um avatar/cor padrão para o n-ésimo jogador adicionado. */
export function defaultAvatar(index: number): string {
  return AVATAR_PRESETS[index % AVATAR_PRESETS.length];
}

export function defaultColor(index: number): string {
  return COLOR_PRESETS[index % COLOR_PRESETS.length];
}

/**
 * Cor sólida (independente do tema) derivada da cor do jogador — um pastel claro.
 * Usa `rgb()` opaco (não alpha) para que o avatar fique idêntico no claro e no
 * escuro, sem se misturar com o fundo.
 */
export function softColor(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.72);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
