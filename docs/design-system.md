# Sistema de design — Board Game Score

**Mood:** *mesa de jogos sob luz de abajur — cartas, dados, amigos se debruçando pra ver o placar.* Aconchegante, quente, tátil. É UI de produto (serve à tarefa de anotar placar), com uma alma de "noite de jogos".

## Cores (OKLCH, tokens em `src/app/globals.css`)

Trocam sozinhas por `prefers-color-scheme` — não use `dark:` espalhado, use os tokens.

| Token | Papel | Claro | Escuro |
|---|---|---|---|
| `bg` | fundo | branco puro | quase-preto quente |
| `surface` / `surface-2` | cards / painéis | branco puxado ao ink | tons acima do bg |
| `ink` | texto principal (≥7:1) | quase-preto quente | quase-branco quente |
| `muted` | texto secundário (≥3.5:1) | — | — |
| `border` | bordas/anéis | — | — |
| `primary` | **coral/terracota** — ações, seleção | oklch(0.63 0.17 36) | oklch(0.68 0.16 37) |
| `accent` | **dourado** — vitória, destaque | oklch(0.8 0.145 78) | oklch(0.82 0.14 80) |
| `danger` | erro / "estourou" | — | — |

Estratégia: *committed-leve* — o coral carrega a identidade (botões, seleção, barra de progresso), o dourado marca as vitórias (campeão, 1º do ranking). Texto branco sobre fills saturados; texto escuro sobre o dourado (pálido).

Como usar nas classes Tailwind: `bg-bg`, `bg-surface`, `text-ink`, `text-muted`, `border-border`, `bg-primary text-primary-fg`, `bg-accent text-accent-fg`, `bg-danger text-danger-fg`.

## Tipografia

- **Display** (`font-display` — Bricolage Grotesque, 600–800): títulos, wordmark, nome do campeão, números grandes de placar. Personalidade.
- **UI/corpo** (`font-sans` — Hanken Grotesk): tudo o mais. Legível e neutro.

## Componentes

- `Avatar` (`src/components/Avatar.tsx`): emoji do jogador num círculo tingido com a cor dele. Reutilizado em todas as telas.
- `EmojiPicker` (`src/components/EmojiPicker.tsx`): emoji-mart vanilla (set nativo, offline, carregado sob demanda) — permite escolher **qualquer** emoji.
- Botões: cantos arredondados (`rounded-xl`/`2xl`), `hover:brightness-105`, `disabled:opacity-40`.
- Modais: bottom-sheet no mobile (`rounded-t-*`), centrado no desktop. z-index: nav/barras 30, diálogo 40, emoji picker 50.

## Movimento

Sutil e com propósito (150–450ms, ease-out). `.animate-pop-in` na entrada do campeão. Tudo respeita `prefers-reduced-motion` (neutralizado no globals).

## Imagens

Capas dos jogos: arte oficial do BoardGameGeek em `public/games/<id>.<ext>` (uso pessoal). Se faltar a capa, o card cai para emoji + cor de destaque (`GameInfo.cover` é opcional).
