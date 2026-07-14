# Azul, Ticket to Ride e Trio + ordenar a home

**Data:** 2026-07-14 · **Status:** implementado (v1.6.0)

Três jogos novos do catálogo, seguindo a visão da Fase 1 (placar local, **fiel a
cada jogo**, sem simular o tabuleiro). Complementa a spec do
[Catan + ranking](2026-07-06-catan-e-ranking-geral.md). Os três já existiam como
"Em breve" em `games.ts` (capas prontas em `public/games/`) — aqui eles ganham
motor, tela, setup e o encanamento multi-jogo.

## 1. 🔷 Azul — total corrente por rodada + bônus de fim

Azul soma pontos a cada rodada (leitura do próprio tabuleiro do jogador, já
líquida da *floor line*) e fecha com bônus de fim de jogo. O app guarda o log de
rodadas por jogador e os contadores de fim.

**Estado/jogador** (`AzulPlayerState`): `rounds: number[]` (pontos líquidos de
cada rodada, editáveis), `fullRows`, `fullCols`, `fullColors` (0–5 cada).

| Fonte | Pontos | Regra |
| --- | --- | --- |
| Rodadas | Σ `rounds` | cada "+ pontos da rodada" aceita valor **negativo** (penalidade da *floor line*) |
| 🟦 Linha completa | +2 | 0–5 |
| 🟥 Coluna completa | +7 | 0–5 |
| 🎨 Cor completa (5 peças) | +10 | 0–5 |

- **Pontuação:** `max(0, Σ rounds) + 2·fullRows + 7·fullCols + 10·fullColors`.
  O total **nunca fica abaixo de 0**.
- **Fim declarado (sem meta numérica):** botão "Encerrar jogo" — dica aparece
  quando algum jogador completa uma linha (`fullRows ≥ 1`), que é o gatilho real.
- **Campeão = maior pontuação;** desempate por **mais linhas completas**; empate
  exato ainda ⇒ **co-campeões**.
- **Tela:** um cartão por jogador (ordem da mesa) com total corrente, botão
  "+ pontos da rodada" (entrada numérica ±) e lista de rodadas editável/removível;
  painel "fim de jogo" com steppers de linhas/colunas/cores. Barra de progresso
  **relativa ao líder** (não há meta fixa).

## 2. 🚂 Ticket to Ride — trajetos no jogo + bilhetes no fim

Durante a partida o placar sobe pelos trajetos capturados (público). Bilhetes de
destino (secretos) e o trajeto mais longo entram só no fim.

**Estado/jogador** (`TtrPlayerState`): `routes: number[]` (log dos valores
capturados), `ticketPoints: number` (líquido, pode ser negativo), `hasLongestPath`.

| Fonte | Pontos |
| --- | --- |
| Trajeto por comprimento 1·2·3·4·5·6 | **1 · 2 · 4 · 7 · 10 · 15** |
| 🎫 Bilhetes de destino (fim) | soma dos cumpridos − soma dos falhados (líquido) |
| 🛤️ Trajeto Mais Longo (fim) | +10 (**1 dono**, exclusivo) |

- **Pontuação:** `Σ routes + ticketPoints + (hasLongestPath ? 10 : 0)`.
- **Tela:** botões rápidos `+1 +2 +4 +7 +10 +15` que somam ao trajeto e "desfazer
  último"; painel de fim com campo **bilhetes ±** e alternância **Trajeto Mais
  Longo +10** (exclusiva — marcar em alguém tira de quem tinha, igual à Estrada
  Mais Longa do Catan).
- **Fim declarado** (o gatilho real é alguém ficar com ≤2 vagões): "Encerrar jogo".
- **Campeão = maior pontuação;** desempate pelo **dono do trajeto mais longo**;
  empate exato ainda ⇒ co-campeões. (Simplificação: uso o líquido de pontos dos
  bilhetes, não a contagem de bilhetes cumpridos.)

## 3. 🔢 Trio — coletar trios, vitória automática

**Estado/jogador** (`TrioPlayerState`): `trios: number`, `hasSeven: boolean`.

- **Vitória (automática, como o Flip 7):** vence quem chegar a **3 trios**
  (`targetScore`, ajustável no setup) **OU** pegar o **trio de 7** (`hasSeven`).
  Quem dispara a condição é declarado campeão na hora e a partida encerra.
- **Tela:** cartão por jogador com bolinhas ●●○ até a meta, botões "+ trio",
  "+ trio dos 7 (vitória)" e "−trio" para corrigir.
- **Pontos no ranking = nº de trios** (escala pequena; no Geral "Pontos" já fica
  oculto pelas escalas diferentes).

## 4. Encanamento multi-jogo

- `EngineKind` passa a incluir `'azul' | 'ticket-to-ride' | 'trio'`; em `games.ts`
  os três ficam `available: true` com o `engine` correspondente.
- `MatchRecord` ganha `azulState?`, `ttrState?`, `trioState?` — campos opcionais
  **não indexados** (sem migração no Dexie), no molde do `catanState?`.
- **Roteador** `/partida`: o `if/else` vira um mapa `gameId → MatchView`
  (fallback Flip 7).
- **Setup** (`MatchSetup`): campo de meta vira **opcional** — omitindo
  `targetLabel`, a seção some e `onCreate` recebe `0`. Azul e TtR não têm meta;
  Trio usa "Trios para vencer" (padrão 3). Rotas `/novo/azul`,
  `/novo/ticket-to-ride`, `/novo/trio`.
- **Repo:** `createAzulMatch` / `createTtrMatch` / `createTrioMatch`; ações
  transacionais `applyAzul/Ttr/TrioMatchAction` (leem+gravam numa transação, como
  o Catan); `finishAzulByHighest` / `finishTtrByHighest` gravam `championIds` =
  maior pontuação (com desempate). Trio finaliza dentro da própria ação ao bater
  a condição. `reopenMatch` (genérico) atende os três.
- **Ranking/histórico:** `matchTotals` e `matchDetail` ganham um caso por jogo
  (Azul/TtR: `N pts` do campeão; Trio: `N trios`). O agregador
  (`domain/ranking.ts`) e os filtros por jogo/Geral já são agnósticos — os três
  entram automaticamente nos chips e no ranking.
- **Uma partida aberta por vez** entre todos os jogos: já garantido por
  `deleteOpenMatches`.

## 5. 🏠 Ordenar os jogos na home

`GameGrid` ganha um controle segmentado **[ Mais jogados | Por nome ]** acima da
grade:

- **Padrão "Mais jogados"**, escolha salva no `localStorage` (`bgs.homeSort`).
- "Mais jogados" conta **partidas finalizadas por jogo** — nova consulta no repo
  (`matchCountsByGame`) via `useLiveQuery`.
- Jogos **jogáveis primeiro, "Em breve" por último**; dentro de cada grupo aplica
  o modo (contagem desc, ou nome A–Z em pt-BR). Assim os "Em breve" não empurram
  os jogáveis para baixo.

## 6. Qualidade e versão

- Motor puro e testado por jogo (`scoring.test.ts` no estilo catan/flip7):
  - **Azul:** piso 0, soma de bônus, desempate por linhas.
  - **TtR:** valores de trajeto, exclusividade do trajeto mais longo, desempate.
  - **Trio:** vitória por 3 trios e pelo trio de 7, `−trio` não passa de 0.
  - Campeão por maior total + co-campeões em empate (Azul/TtR).
- Testes atuais (Flip 7, Catan, ranking) seguem verdes.
- **Versão:** tag `v1.6.0` no fim (o app versiona por git tag, não pelo
  `package.json`). Índice de memória atualizado.

## Fora de escopo

- Não simular tabuleiro/cartas de nenhum jogo — o app registra o placar, o
  jogador lê do próprio jogo.
- Sem sincronização na nuvem (segue Fase 2, como nas specs anteriores).
