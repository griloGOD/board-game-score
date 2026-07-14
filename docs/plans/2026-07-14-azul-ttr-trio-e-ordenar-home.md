# Azul + Ticket to Ride + Trio + ordenar a home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, same session). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ativar três jogos hoje "Em breve" (Azul, Ticket to Ride, Trio) com placar fiel a cada um, e adicionar ordenação da home (Mais jogados / Por nome).

**Architecture:** Cada jogo = motor puro em `src/domain/<jogo>/` (types + scoring + test) + `MatchView` cliente + página `/novo/<gameId>`. Estado por jogador vive num campo opcional novo do `MatchRecord` (molde do `catanState`). Roteador `/partida` mapeia `gameId → MatchView`. Ranking/histórico já são agnósticos; só precisam de um caso de `totals`/`detail` por jogo.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`), React 19, Dexie 4 (+ dexie-react-hooks), Tailwind v4, Vitest 2.

## Global Constraints

- **Next.js 16 é diferente do treino** (AGENTS.md): antes de escrever qualquer componente/página, ler o guia relevante em `node_modules/next/dist/docs/`.
- **Idioma pt-BR** em toda UI, comentários e nomes de commit — seguir o tom dos arquivos existentes.
- **Sem migração Dexie:** campos novos do `MatchRecord` são **opcionais e não indexados** (o schema `version(1)` não muda).
- **Uma partida aberta por vez** entre todos os jogos: usar `deleteOpenMatches()` em cada `create*Match` (já existe).
- **Rota = gameId:** `GameGrid` navega para `/novo/${game.id}`, então as pastas são `/novo/azul`, `/novo/ticket-to-ride`, `/novo/trio`.
- **Testes atuais seguem verdes** (flip7, catan, ranking). Rodar `npm test` no fim.
- **Versão por git tag:** ao final, `git tag v1.6.0` (o `package.json` fica em 0.1.0).
- **Commits frequentes**, um por task; encerrar `Co-Authored-By` conforme padrão do repositório.

---

## File Structure

**Criar:**
- `src/domain/azul/{types.ts,scoring.ts,scoring.test.ts}`
- `src/domain/ttr/{types.ts,scoring.ts,scoring.test.ts}`
- `src/domain/trio/{types.ts,scoring.ts,scoring.test.ts}`
- `src/components/azul/AzulMatchView.tsx`
- `src/components/ttr/TtrMatchView.tsx`
- `src/components/trio/TrioMatchView.tsx`
- `src/app/novo/azul/page.tsx`, `src/app/novo/ticket-to-ride/page.tsx`, `src/app/novo/trio/page.tsx`

**Modificar:**
- `src/lib/games.ts` (EngineKind + ativar 3 jogos)
- `src/lib/db.ts` (`azulState?`, `ttrState?`, `trioState?`)
- `src/lib/repo.ts` (create/apply/finish + `matchCountsByGame`)
- `src/components/MatchSetup.tsx` (meta opcional)
- `src/app/partida/page.tsx` (mapa gameId→view)
- `src/app/historico/page.tsx` (`matchTotals`/`matchDetail`)
- `src/components/GameGrid.tsx` (ordenar)
- `docs/specs/2026-07-14-…-design.md` (status→implementado)
- `MEMORY.md` do usuário + memória do projeto (versão)

---

## Task 1: Motor do Azul

**Files:** Create `src/domain/azul/types.ts`, `src/domain/azul/scoring.ts`, `src/domain/azul/scoring.test.ts`

**Interfaces — Produces:**
```ts
// types.ts
interface AzulPlayerState { rounds: number[]; fullRows: number; fullCols: number; fullColors: number }
type AzulState = Record<string, AzulPlayerState>
type AzulBonus = 'fullRows' | 'fullCols' | 'fullColors'
type AzulAction =
  | { type: 'addRound'; points: number }
  | { type: 'editRound'; index: number; points: number }
  | { type: 'removeRound'; index: number }
  | { type: 'setBonus'; bonus: AzulBonus; value: number }
// scoring.ts
const AZUL_BONUS_MAX = 5
initialAzulPlayer(): AzulPlayerState
initialAzulState(playerIds: string[]): AzulState
computeAzulScore(p: AzulPlayerState): number          // max(0, Σrounds) + 2r + 7c + 10cor
applyAzulAction(state, playerId, action): AzulState    // NOVO estado; inválido → original
computeAzulStandings(playerIds, state, championIds?): Standing[]  // rank por total desc
azulChampions(playerIds, state): string[]              // maior total; desempate fullRows
```

- [ ] **Step 1 — Testes que falham** (`scoring.test.ts`): 
  - `computeAzulScore` de `{rounds:[10,-3], fullRows:1, fullCols:0, fullColors:0}` = `7+2` = 9.
  - piso: `{rounds:[5,-20], ...0}` = `max(0,-15)` = 0 (+bônus 0) = 0.
  - bônus: `{rounds:[], fullRows:5, fullCols:5, fullColors:5}` = `10+35+50` = 95.
  - `applyAzulAction addRound` empurra ponto; `removeRound` fora do range → estado original; `setBonus` fora de 0..5 → clampa.
  - `azulChampions`: dois com total 30, um com fullRows 2 vs 1 → campeão único o de 2; empate total+rows → co-campeões (2 ids).
- [ ] **Step 2 — Rodar e ver falhar:** `npm test -- azul`
- [ ] **Step 3 — Implementar** types.ts + scoring.ts (fórmulas acima; `applyAzulAction` faz `Math.round` nos pontos, clampa bônus a `[0,AZUL_BONUS_MAX]`, ignora índices inválidos).
- [ ] **Step 4 — Rodar e ver passar:** `npm test -- azul`
- [ ] **Step 5 — Commit:** `feat(azul): motor de placar (rodadas + bônus de fim)`

## Task 2: Motor do Ticket to Ride

**Files:** Create `src/domain/ttr/{types.ts,scoring.ts,scoring.test.ts}`

**Interfaces — Produces:**
```ts
interface TtrPlayerState { routes: number[]; ticketPoints: number; hasLongestPath: boolean }
type TtrState = Record<string, TtrPlayerState>
type TtrAction =
  | { type: 'addRoute'; value: number }
  | { type: 'undoRoute' }
  | { type: 'removeRoute'; index: number }
  | { type: 'setTicketPoints'; value: number }
  | { type: 'toggleLongestPath' }
const TTR_ROUTE_VALUES = [1,2,4,7,10,15]  // comprimentos 1..6
const TTR_LONGEST_PATH_BONUS = 10
initialTtrPlayer/State; computeTtrScore(p) = Σroutes + ticketPoints + (longest?10:0)
applyTtrAction(state, playerId, action): TtrState     // toggleLongestPath EXCLUSIVO (molde Catan)
computeTtrStandings(playerIds, state, championIds?): Standing[]
ttrChampions(playerIds, state): string[]              // maior total; desempate = dono do trajeto
```

- [ ] **Step 1 — Testes que falham:**
  - `computeTtrScore` `{routes:[15,4], ticketPoints:-4, hasLongestPath:true}` = `19-4+10` = 25.
  - `addRoute 7` soma; `undoRoute` tira o último; `setTicketPoints -6` grava negativo.
  - `toggleLongestPath` em A liga A e desliga qualquer outro (exclusivo).
  - `ttrChampions`: A=50 sem trajeto, B=50 com trajeto → campeão B; A=50,B=40 → A; empate 50/50 sem dono do trajeto → co-campeões.
- [ ] **Step 2 — Falhar:** `npm test -- ttr`
- [ ] **Step 3 — Implementar** (reaproveitar a lógica de exclusividade do `applyCatanAction`).
- [ ] **Step 4 — Passar:** `npm test -- ttr`
- [ ] **Step 5 — Commit:** `feat(ttr): motor de placar (trajetos + bilhetes + trajeto mais longo)`

## Task 3: Motor do Trio

**Files:** Create `src/domain/trio/{types.ts,scoring.ts,scoring.test.ts}`

**Interfaces — Produces:**
```ts
interface TrioPlayerState { trios: number; hasSeven: boolean }
type TrioState = Record<string, TrioPlayerState>
type TrioAction = { type: 'addTrio'; seven: boolean } | { type: 'undoTrio'; seven: boolean }
const TRIO_DEFAULT_TARGET = 3
initialTrioPlayer/State; computeTrioScore(p) = p.trios
hasTrioWon(p, target): boolean = p.hasSeven || p.trios >= target
applyTrioAction(state, playerId, action): TrioState   // undoTrio: trios max(0,-1); se seven, zera hasSeven
computeTrioStandings(playerIds, state, championIds?): Standing[]  // rank por trios desc
```

- [ ] **Step 1 — Testes que falham:**
  - `addTrio {seven:false}` → trios 1; três vezes → `hasTrioWon(_,3)` true.
  - `addTrio {seven:true}` → `hasSeven` true e `hasTrioWon` true mesmo com trios 1.
  - `undoTrio {seven:false}` não deixa trios < 0; `undoTrio {seven:true}` zera `hasSeven`.
- [ ] **Step 2 — Falhar:** `npm test -- trio`
- [ ] **Step 3 — Implementar.**
- [ ] **Step 4 — Passar:** `npm test -- trio`
- [ ] **Step 5 — Commit:** `feat(trio): motor de placar (trios + vitória automática)`

## Task 4: db + repo (estados, criação, ações, finalização, contagem)

**Files:** Modify `src/lib/db.ts`, `src/lib/repo.ts`

- [ ] **Step 1 — db.ts:** adicionar ao `MatchRecord` (após `catanState?`):
  `azulState?: AzulState; ttrState?: TtrState; trioState?: TrioState;` + imports de tipos. (Schema `version(1)` inalterado.)
- [ ] **Step 2 — repo.ts create:**
  - `createAzulMatch(players, _target = 0)` → `{...newMatchRecord('azul', players, 0), azulState: initialAzulState(ids)}`.
  - `createTtrMatch(players, _target = 0)` → idem com `ttrState`.
  - `createTrioMatch(players, target = TRIO_DEFAULT_TARGET)` → `newMatchRecord('trio', players, target)` + `trioState`.
- [ ] **Step 3 — repo.ts ações** (transação `rw`, guarda `gameId` + `em_andamento`, molde de `applyCatanMatchAction`):
  - `applyAzulMatchAction(matchId, playerId, action)` → `applyAzulAction`.
  - `applyTtrMatchAction(matchId, playerId, action)` → `applyTtrAction`.
  - `applyTrioMatchAction(matchId, playerId, action)`: aplica; `const target = m.targetScore || TRIO_DEFAULT_TARGET; const won = hasTrioWon(state[playerId], target);` grava `status`/`championIds` (`won ? [playerId] : []`).
- [ ] **Step 4 — repo.ts finalização declarada** (Azul/TtR):
  - `finishAzulByHighest(matchId)` → `championIds = azulChampions(...)`, `status:'finalizada'`.
  - `finishTtrByHighest(matchId)` → `ttrChampions(...)`.
- [ ] **Step 5 — repo.ts contagem:**
  `matchCountsByGame(): Promise<Record<string, number>>` — finalizadas agrupadas por `gameId`.
- [ ] **Step 6 — Verificar tipos:** `npx tsc --noEmit` (ou `npm run build` na Task 11). Commit: `feat: estado, criação e ações de Azul/TtR/Trio no repo`

## Task 5: Ativar os jogos no catálogo

**Files:** Modify `src/lib/games.ts`

- [ ] Extender `EngineKind` para `'flip7' | 'catan' | 'azul' | 'ticket-to-ride' | 'trio'`.
- [ ] Nos três itens (`trio`, `ticket-to-ride`, `azul`): `available: true` + `engine` correspondente. Atualizar o comentário do topo (jogáveis agora são 5).
- [ ] Commit: `feat: Azul, Ticket to Ride e Trio jogáveis no catálogo` (junto da Task 6 se preferir um único commit navegável).

## Task 6: MatchSetup com meta opcional + 3 páginas de setup

**Files:** Modify `src/components/MatchSetup.tsx`; Create `src/app/novo/{azul,ticket-to-ride,trio}/page.tsx`

- [ ] **MatchSetup:** tornar `targetLabel?`/`targetHint?`/`defaultTarget?` opcionais; `target` inicia em `defaultTarget ?? 0`; renderizar a seção "Meta" **só** se `targetLabel` existir. `onCreate(participants, target)` inalterado.
- [ ] **/novo/azul:** `MatchSetup game={getGame('azul')!} onCreate={createAzulMatch}` (sem props de meta).
- [ ] **/novo/ticket-to-ride:** idem com `createTtrMatch`.
- [ ] **/novo/trio:** `defaultTarget={3}` `targetLabel="Trios para vencer"` `targetHint="Padrão do Trio: 3 trios (ou pegar o trio de 7)."` `onCreate={createTrioMatch}`.
- [ ] **Antes de editar/ler o padrão de página:** conferir `node_modules/next/dist/docs/` (client components / rotas) — as páginas seguem exatamente `/novo/catan/page.tsx`.
- [ ] Commit: `feat: setup de partida de Azul, Ticket to Ride e Trio`

## Task 7: Roteador de partida

**Files:** Modify `src/app/partida/page.tsx`

- [ ] Substituir `if catan / else flip7` por mapa `Record<string, componente>`: `{ catan: CatanMatchView, azul: AzulMatchView, 'ticket-to-ride': TtrMatchView, trio: TrioMatchView }`, `const View = MAP[match.gameId] ?? Flip7MatchView; return <View match={match} />`.
- [ ] Commit (junto das views, Task 8).

## Task 8: Telas de partida (Azul, TtR, Trio)

**Files:** Create os três `*MatchView.tsx`. Modelar em `CatanMatchView.tsx` (estado vivo, +/−, `Sair`, banner de campeão, `reopenMatch`, barra de progresso) e `Flip7MatchView` (auto-fim do Trio).

- [ ] **AzulMatchView:** cartão/jogador com total corrente (`computeAzulScore`), botão "+ pontos da rodada" (dialog numérico ±, reutilizar `Dialog`/entrada numérica), lista de rodadas editável (`editRound`/`removeRound`), painel "fim de jogo" com steppers de linhas/colunas/cores (`setBonus`). Barra **relativa ao líder**. Rodapé: "Encerrar jogo" → `finishAzulByHighest` (dica quando `fullRows ≥ 1`). Encerrada: banner campeão(s), `reopenMatch`, links Ranking / Nova partida (`/novo/azul`).
- [ ] **TtrMatchView:** cartão/jogador com total (`computeTtrScore`), 6 botões `+1 +2 +4 +7 +10 +15` (`addRoute`), "desfazer último" (`undoRoute`), campo bilhetes ± (`setTicketPoints`, dialog numérico) e toggle "Trajeto Mais Longo +10" (`toggleLongestPath`, exclusivo). Rodapé "Encerrar jogo" → `finishTtrByHighest`. Encerrada como acima (`/novo/ticket-to-ride`).
- [ ] **TrioMatchView:** cartão/jogador com bolinhas até `m.targetScore`, "+ trio" (`applyTrioMatchAction addTrio seven:false`), "+ trio dos 7 (vitória)" (`seven:true`), "−trio" (`undoTrio`). **Fim automático** (o repo já grava campeão); banner + `reopenMatch` + links (`/novo/trio`). Sem botão "Encerrar".
- [ ] **Verificação manual** (Task 11) cobre estas telas no `npm run dev`.
- [ ] Commit: `feat: telas de partida de Azul, Ticket to Ride e Trio + roteador multi-jogo`

## Task 9: Ranking/histórico por jogo

**Files:** Modify `src/app/historico/page.tsx`

- [ ] `matchTotals(m)`: casos `azul` (`computeAzulScore` sobre `azulState`), `ticket-to-ride` (`computeTtrScore`), `trio` (`computeTrioScore`).
- [ ] `matchDetail(m, totals)`: Azul/TtR → `${maior total dos championIds} pts`; Trio → `${maior trios dos championIds} trios`.
- [ ] (Chips por jogo e Geral já pegam os novos automaticamente via `GAMES.filter(available)`.)
- [ ] Commit: `feat: totais e detalhe por jogo no ranking (Azul/TtR/Trio)`

## Task 10: Ordenar a home

**Files:** Modify `src/components/GameGrid.tsx` (usa `matchCountsByGame` da Task 4)

- [ ] Estado `sort: 'plays' | 'name'` iniciado de `localStorage['bgs.homeSort']` (fallback `'plays'`); persistir em `useEffect`.
- [ ] `const counts = useLiveQuery(() => matchCountsByGame(), []) ?? {}`.
- [ ] Ordenar: **jogáveis antes de "Em breve"**; dentro do grupo, `plays` = `counts[b.id]-counts[a.id]` (desempate ordem original), `name` = `localeCompare(pt-BR)`.
- [ ] Controle segmentado `[ Mais jogados | Por nome ]` acima da grade (estilo das abas de ordenação do `historico`).
- [ ] Commit: `feat: ordenar jogos da home por mais jogados / por nome`

## Task 11: Verificação (test + lint + build + manual)

- [ ] `npm test` — todos verdes (novos + antigos).
- [ ] `npm run lint` — sem erros.
- [ ] `npm run build` — export estático compila (páginas novas incluídas).
- [ ] `npm run dev` + skill **run**/Playwright: criar uma partida de cada jogo novo, pontuar, encerrar/vencer, ver no ranking; conferir a ordenação da home. Corrigir o que aparecer.
- [ ] Commit de eventuais correções: `fix: ajustes da verificação`

## Task 12: Fechamento

- [ ] Atualizar o status da spec para `implementado (v1.6.0)`.
- [ ] Atualizar a memória do projeto (jogáveis: +Azul/TtR/Trio, v1.6.0) e o `MEMORY.md`.
- [ ] `git tag v1.6.0`.
- [ ] `git push origin main --follow-tags`.

---

## Self-Review

- **Cobertura da spec:** §1 Azul→T1/T8; §2 TtR→T2/T8; §3 Trio→T3/T8; §4 encanamento→T4/T5/T6/T7/T9; §5 ordenar→T10; §6 qualidade/versão→T11/T12. Sem lacunas.
- **Placeholders:** nenhum "TBD"; testes dos motores têm asserções concretas; telas descritas por arquivo + chamadas de repo exatas (JSX segue os `*MatchView` existentes já lidos).
- **Consistência de tipos:** `AzulState/TtrState/TrioState` iguais em db/repo/scoring; `azulChampions`/`ttrChampions` alimentam `finish*ByHighest`; `hasTrioWon` usado no `applyTrioMatchAction`; `matchCountsByGame` produzido na T4 e consumido na T10.
