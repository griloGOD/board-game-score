/** As 5 cores de azulejo do Azul, com motivos geométricos simplificados. */
export type AzulTileKind = 'blue' | 'yellow' | 'red' | 'black' | 'teal';

export const AZUL_TILE_KINDS: readonly AzulTileKind[] = ['blue', 'yellow', 'red', 'black', 'teal'];

const BASE: Record<AzulTileKind, string> = {
  blue: '#2e6fb5',
  yellow: '#e9b73b',
  red: '#c23a3a',
  black: '#34383f',
  teal: '#4fb0aa',
};

/** Azulejo do Azul: quadradinho de cerâmica com motivo, na cor pedida. */
export function AzulTile({ kind, className }: { kind: AzulTileKind; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect x="0.75" y="0.75" width="22.5" height="22.5" rx="4" fill={BASE[kind]} stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      {/* brilho da cerâmica */}
      <path d="M4 6 Q4 4 6 4 L14 4 Q8 6 6 12 Q4 14 4 10 Z" fill="rgba(255,255,255,.28)" />

      {kind === 'blue' && (
        <rect x="7.5" y="7.5" width="9" height="9" rx="1" transform="rotate(45 12 12)" fill="rgba(255,255,255,.85)" />
      )}
      {kind === 'yellow' && (
        <>
          <rect
            x="7.75"
            y="7.75"
            width="8.5"
            height="8.5"
            rx="0.5"
            transform="rotate(45 12 12)"
            fill="none"
            stroke="rgba(120,72,10,.75)"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="12" r="1.8" fill="rgba(120,72,10,.75)" />
        </>
      )}
      {kind === 'red' && (
        <>
          <circle cx="12" cy="8" r="2.1" fill="rgba(255,255,255,.85)" />
          <circle cx="12" cy="16" r="2.1" fill="rgba(255,255,255,.85)" />
          <circle cx="8" cy="12" r="2.1" fill="rgba(255,255,255,.85)" />
          <circle cx="16" cy="12" r="2.1" fill="rgba(255,255,255,.85)" />
          <circle cx="12" cy="12" r="1.5" fill="rgba(60,10,10,.6)" />
        </>
      )}
      {kind === 'black' && (
        <g stroke="rgba(255,255,255,.7)" strokeWidth="1.6" strokeLinecap="round">
          <line x1="7" y1="7" x2="17" y2="17" />
          <line x1="17" y1="7" x2="7" y2="17" />
          <circle cx="12" cy="12" r="2" fill="#d8b25a" stroke="none" />
        </g>
      )}
      {kind === 'teal' && (
        <>
          <rect x="8.25" y="8.25" width="7.5" height="7.5" rx="1" transform="rotate(45 12 12)" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="1.7" fill="rgba(255,255,255,.9)" />
        </>
      )}
    </svg>
  );
}
