# Catan + ranking por jogo/geral

**Data:** 2026-07-06 · **Status:** implementado (v1.5.0)

Segundo jogo do catálogo, seguindo a visão da Fase 1 (placar local, fiel a cada
jogo). Complementa a [especificação da Fase 1](2026-07-04-fase1-flip7-placar-local-design.md).

## 1. Placar do Catan (jogo base)

O Catan não tem rodadas de pontuação como o Flip 7: cada jogador tem um **estado
vivo** que sobe e desce. O app registra o estado e calcula os pontos de vitória (PV):

| Fonte | PV | Limite | Regra aplicada |
| --- | --- | --- | --- |
| 🏠 Povoado | 1 | 0–5 | preparação começa com **2** |
| 🏰 Cidade | 2 | 0–4 | construir **consome um povoado**; desfazer devolve |
| 📜 Carta de PV | 1 | 0–5 | cartas de desenvolvimento de ponto de vitória |
| 🛤️ Estrada Mais Longa | +2 | 1 dono | marcar em alguém **tira de quem tinha** |
| ⚔️ Maior Exército | +2 | 1 dono | idem |

- **Meta:** padrão 10 PV (configurável na criação, ex.: 12 para variantes).
- **Vitória declarada:** no jogo real quem atinge a meta declara no próprio turno.
  Quando um jogador chega à meta, aparece o botão dourado "Declarar vitória" com
  confirmação — nada encerra sozinho. Sem co-campeões no Catan.
- **Reabrir:** partida encerrada tem "Reabrir partida para corrigir".
- **Jogadores:** 3–6 (base 3–4; expansão até 6).
- Cartões na **ordem da mesa** (não reordenam sob o dedo); a posição (1º, 2º…)
  atualiza no próprio cartão. Cada toque grava direto no IndexedDB (transação),
  então recarregar a página não perde nada.

Motor puro e testado em `src/domain/catan/` (16 testes): pontuação, limites de
peças, upgrade/desfazer cidade, exclusividade e roubo das cartas especiais,
ranking de competição.

## 2. Ranking por jogo e geral

A tela **Ranking** ganhou um filtro acima da ordenação:

- **Geral** (padrão): agrega as partidas de todos os jogos — vitórias e
  aproveitamento comparam bem; em "Pontos" há um aviso de que escalas diferentes
  se somam (~200/partida no Flip 7, ~10 no Catan).
- **Por jogo:** um chip para cada jogo jogável (Flip 7, Catan).

O agregador virou agnóstico de jogo (`src/domain/ranking.ts`); o do Flip 7 é um
alias para compatibilidade. A lista de partidas mostra o jogo (no Geral) e um
detalhe por jogo (rodadas no Flip 7, PV do campeão no Catan).

## 3. Estrutura multi-jogo

- `/partida?id=…` é única: carrega o registro e delega para `Flip7MatchView`
  ou `CatanMatchView` conforme `gameId`.
- Setup de partida compartilhado (`MatchSetup`): jogadores + meta, com rótulos
  por jogo (`/novo/flip7`, `/novo/catan`).
- `MatchRecord` ganhou `catanState` opcional (campo não indexado ⇒ sem migração
  no Dexie).
- **Uma partida aberta por vez, entre todos os jogos:** criar uma nova apaga a
  aberta (o aviso na home nomeia o jogo aberto); "Continuar" leva à ativa de
  qualquer jogo.
