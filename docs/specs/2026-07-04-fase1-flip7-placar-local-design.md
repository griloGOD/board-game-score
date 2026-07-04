# Board Game Score — Fase 1: Placar Local do Flip 7

- **Data:** 2026-07-04
- **Status:** Rascunho para revisão
- **Autor:** brainstorming com o dono do projeto
- **Escopo deste documento:** desenho/especificação da **Fase 1**. As fases seguintes aparecem apenas como contexto de roteiro.

---

## 1. Visão geral

Um web app para **fazer o placar dos jogos de tabuleiro** que jogamos com os amigos — fiel a *como cada jogo realmente pontua*, fazendo as somas por nós, declarando o campeão e guardando histórico e ranking.

Já existem apps parecidos no mercado, mas queremos o nosso: com os jogos que jogamos, do nosso jeito, e que evolua para contas, amigos e salas ao vivo.

Este documento cobre a **primeira fatia entregável**: o placar local do **Flip 7**.

## 2. Objetivo da Fase 1

Entregar um placar digital **fiel e completo do Flip 7**, funcionando em **um único aparelho, offline**, que:

1. Deixa cadastrar os jogadores (nome + avatar + cor);
2. Faz as somas de pontos por rodada, fielmente às regras do Flip 7;
3. Aplica a regra de encerramento aos **200 pontos**;
4. Declara o **campeão** e mostra a classificação final;
5. Guarda o **histórico de partidas** e um **ranking local** do Flip 7.

Serve como a base sobre a qual as próximas fases (mais jogos, contas, nuvem, salas ao vivo) serão construídas sem retrabalho.

## 3. Escopo

### ✅ Dentro da Fase 1

- **Apenas o jogo Flip 7**
- Modo **local** (1 aparelho, quem anota passa o celular / lança por todos)
- Cadastro de **3 a 18 jogadores** — nome + avatar pronto + cor
- Tela de **placar fiel do Flip 7**, com cálculo assistido de pontos
- **Regra de fim aos 200** (detalhada na seção 7)
- **Fim de jogo:** campeão 🏆 + classificação final
- **Histórico de partidas** + **ranking local** do Flip 7 (vitórias, melhor pontuação, partidas jogadas)
- **PWA** instalável, funciona **offline**, **mobile-first**
- Interface em **português (pt-BR)**

### ⛔ Fora da Fase 1 (fases seguintes)

- Outros jogos: Dixit, Catan, Ticket to Ride, Azul, Survive — e depois Bang Dice, Trio
- Login com Google, contas e nome de usuário
- Nuvem / sincronização entre aparelhos
- Salas ao vivo (estilo Gartic, cada um no seu celular)
- Amigos, convites e rankings globais

## 4. Roteiro por fases (contexto)

O produto completo se organiza em quatro camadas que se empilham:

| Fase | Entrega | Complexidade |
|---|---|---|
| **1. Placar local** *(este doc)* | Escolher jogo, cadastrar jogadores, placar fiel, campeão, ranking local | 🟢 Baixa |
| **2. Contas na nuvem** | Login Google, nome de usuário, histórico salvo na nuvem | 🟡 Média |
| **3. Social & rankings** | Amigos, ranking de vitórias por jogo e geral | 🟡 Média |
| **4. Salas ao vivo** | Estilo Gartic, cada um no seu celular, pontos sincronizados | 🔴 Alta |

### Os "motores de placar" (visão de reúso)

Os 8 jogos previstos pontuam de **5 formas diferentes**. Em vez de programar cada jogo do zero, o app usa **motores reaproveitáveis**; cada jogo é uma *configuração* de um motor. A Fase 1 constrói o **Motor 1** para o Flip 7.

| Motor | Como funciona | Jogos |
|---|---|---|
| **1 · Corrida por rodadas até a meta** | Tabela de rodadas, soma corrente, marca a última rodada ao cruzar a meta | **Flip 7** (200), Dixit (30) |
| **2 · Contador de pontos de vitória ao vivo** | Contadores +/− + selos transferíveis | Catan (10) |
| **3 · Pontos ao vivo + fechamento de fim** | Pontos na partida + tela final de bônus/penalidades | Ticket to Ride, Azul |
| **4 · Soma de fichas no fim** | Uma tela no fim: soma valores resgatados | Survive |
| **5 · Vitória/derrota por partida** | Sem pontos: registra quem venceu | Bang Dice, Trio |

> **Princípio de engenharia:** na Fase 1 construímos o Flip 7 **bem-feito**, com uma fronteira limpa de "módulo de jogo", **sem sobre-abstrair** para um jogo só. Quando entrar o 2º jogo, generalizamos o Motor 1 com base em dois exemplos reais.

## 5. Abordagem técnica

### Local-first, pronto para a nuvem

O app funciona 100% offline, com os dados no próprio aparelho. Mas o **modelo de dados é desenhado desde já** (IDs únicos, timestamps, formato sincronizável) para que a Fase 2 apenas **ligue** login + sincronização, sem reescrever a base.

### Stack recomendada

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS + shadcn/ui** para a interface
- **IndexedDB** (via uma camada leve, ex. Dexie) para persistência local
- **PWA** instalável (ícone na tela inicial, abertura offline)
- Deploy na **Vercel**

> Next.js parece "demais" para um app local, mas o roteiro (contas, nuvem, salas ao vivo) justifica: evita migração futura. Alternativa mais enxuta hoje seria Vite + React, ao custo de uma migração maior depois.

## 6. Fluxo do app (telas)

1. **Início** — grade de jogos com capa + nome. Na Fase 1, **Flip 7 jogável** e os demais marcados como **"Em breve"** (preview da visão). *(ver Perguntas em aberto)*
2. **Configurar partida** — definir nº de jogadores; adicionar cada jogador (nome + avatar + cor); ajustar opções do jogo (meta do Flip 7 = **200**, editável).
3. **Placar (Flip 7)** — tabela de rodadas com totais sempre visíveis; entrada de pontos por jogador a cada rodada; botão para fechar a rodada.
4. **Fim de jogo** — 🏆 campeão em destaque + classificação final + "jogar de novo" (mesmos jogadores) / "novo jogo".
5. **Histórico & ranking** — lista de partidas anteriores neste aparelho e ranking local do Flip 7 (mais vitórias, melhor pontuação, nº de partidas).

## 7. Motor de placar do Flip 7 (detalhado)

### 7.1 Como o Flip 7 pontua (regras verificadas)

Para o **placar**, o que importa é a **pontuação de cada jogador por rodada**. O app **não simula o baralho** — ele registra o resultado de cada jogador na rodada e faz a conta.

Composição da pontuação de uma rodada, **nesta ordem**:

1. **Soma das cartas de número únicas** coletadas (valores 0–12);
2. **× 2** se o jogador tiver o modificador **×2** (dobra *apenas* a soma das cartas de número);
3. **+ modificadores fixos** que tiver: **+2, +4, +6, +8, +10** (podem acumular, pois há 1 de cada);
4. **+ 15** se o jogador fez **"Flip 7"** (coletou 7 cartas de número únicas). Esse bônus é adicionado **por último** e **nunca é dobrado**.

**Bust** (o jogador "estourou" ao tirar carta de número repetida) = **0 pontos** naquela rodada.

**Exemplos (para remover ambiguidade):**

| Situação do jogador na rodada | Conta | Pontos |
|---|---|---|
| Cartas 3, 5, 10 (=18), sem modificadores | 18 | **18** |
| Cartas 3, 5, 10 (=18) + modificador ×2 + modificador +4 | (18×2)+4 | **40** |
| Flip 7 com cartas 1..7 (=28), sem modificadores | 28+15 | **43** |
| Flip 7 (28) + ×2 + Flip 7 | (28×2)+15 | **71** |
| Estourou (bust) | — | **0** |

### 7.2 Loop de rodadas e fim aos 200 *(regra confirmada com o dono do projeto)*

> "Sempre que todos os jogadores colocarem suas pontuações, é somado e aberta uma nova rodada. Na rodada em que ao menos 1 fizer 200, todos colocam suas pontuações e, em vez de gerar a nova rodada, o jogo termina."

Formalizando:

1. **Rodada `r`:** cada jogador recebe uma entrada de pontos (pode ser bust = 0).
2. O app **só fecha a rodada quando TODOS os jogadores têm entrada** para `r`.
3. Ao fechar, a pontuação da rodada é **somada ao total acumulado** de cada jogador.
4. **Verificação de fim** (feita *depois* que todos entraram):
   - Se **nenhum** jogador está com total **≥ 200** → **abre a rodada `r+1`**.
   - Se **pelo menos um** jogador está com total **≥ 200** → **o jogo termina** (não abre nova rodada).
5. **Campeão = maior total acumulado.**

**Importante:** todos sempre **terminam a rodada em andamento**; a checagem dos 200 é feita apenas ao final da rodada, com todas as entradas lançadas. Ninguém "vence no meio da rodada".

### 7.3 Fim de jogo, campeão e empate *(regra confirmada com o dono do projeto)*

- O jogo termina **ao final da rodada** em que **ao menos 1 jogador atinge ≥ 200 pontos** — essa é a **última rodada**, e **todos completam** as suas pontuações normalmente.
- **Campeão = maior total acumulado.** Se dois ou mais jogadores passam de 200, ganha **quem fez mais pontos** (ex.: 202 vence 201). **Não há rodadas extras nem morte súbita.**
- **Empate (co-campeões)** ocorre **somente** se os **maiores totais forem exatamente iguais**.

### 7.4 Entrada de pontos (UX proposta)

Para cada jogador, na rodada atual, a entrada oferece **dois caminhos** (o app faz a soma nos dois):

- **🧮 Calcular (padrão):** tocar as cartas de número coletadas (0–12), ligar os modificadores que tiver (+2/+4/+6/+8/+10, ×2), marcar **"Flip 7 (+15)"** *ou* tocar **"Estourou (0)"**. O total aparece ao vivo e é confirmado com um toque.
- **✍️ Digitar total:** quem já sabe o total da rodada digita direto o número.

> Isso atende ao pedido central ("o app faz as somas, fiel ao jogo") sem deixar a anotação lenta.

### 7.5 Casos de borda que o placar precisa tratar

- **Bust zera só a rodada** — o acumulado das rodadas anteriores permanece.
- **Editar rodada anterior** — permitir corrigir uma entrada lançada errado (recalcula os totais e reavalia o fim aos 200).
- **Second Chance / "Flip 7 encerra a rodada na hora"** — são mecânicas resolvidas **fisicamente** pelos jogadores; o app apenas registra o **resultado** de cada um na rodada.
- **Totais sempre visíveis** — a tabela mostra o total corrente de cada jogador e destaca quem está mais perto dos 200.
- **Faixa de jogadores:** 3–18 (oficial). *(ver Perguntas: permitir 2?)*

## 8. Modelo de dados (conceitual, pronto para a nuvem)

Entidades principais (IDs = UUID; todas com `criadoEm` / `atualizadoEm` para futura sincronização):

- **Jogo (catálogo):** `id`, `nome`, `capa`, `minJogadores`, `maxJogadores`, `motor`, `config` (ex.: `metaPontos: 200`). Na Fase 1 só há o Flip 7, mas a estrutura já suporta os demais.
- **Jogador (perfil local):** `id`, `nome`, `avatar` (id do preset), `cor`. Reutilizável entre partidas (não re-digitar os amigos toda vez). Na Fase 2, passa a mapear para uma conta de usuário.
- **Partida:** `id`, `jogoId`, `criadoEm`, `status` (`em_andamento` | `finalizada`), `config` (snapshot, ex.: meta = 200), `participantes` (lista de `jogadorId`), `rodadas[]`, `classificacaoFinal`, `campeaoId`.
- **Rodada:** `indice`, `entradas[]` = `{ jogadorId, pontos, detalhe? (cartas/modificadores/flip7/bust) }`.
- **Ranking local (derivado):** por jogo, agrega das partidas finalizadas — vitórias por jogador, melhor pontuação, nº de partidas.

## 9. Requisitos não-funcionais

- **Offline-first:** abre e funciona sem internet; dados persistem no aparelho (IndexedDB).
- **PWA instalável:** ícone na tela inicial, tela cheia.
- **Mobile-first & responsivo:** desenhado para o celular que roda a mesa; funciona também em tablet/desktop.
- **Idioma:** pt-BR.
- **Acessibilidade básica:** bom contraste, alvos de toque grandes (uso na mesa, muitas vezes com pressa).
- **Desempenho:** interações instantâneas; recalcular totais em tempo real.

## 10. Critérios de aceite (Fase 1)

- [ ] Consigo abrir o app **offline** e ver a tela de Início com o Flip 7.
- [ ] Consigo **criar uma partida** de Flip 7 com de 3 a 18 jogadores, cada um com nome + avatar + cor.
- [ ] A cada rodada, consigo lançar a pontuação de cada jogador (calculando ou digitando), e o app **soma corretamente** (respeitando ×2 → fixos → +15; bust = 0).
- [ ] A rodada **só fecha quando todos** têm pontuação lançada.
- [ ] Quando alguém atinge **≥ 200** ao fim de uma rodada, o jogo **encerra** e mostra o **campeão** + classificação.
- [ ] Consigo **corrigir** a pontuação de uma rodada anterior e os totais se ajustam.
- [ ] A partida finalizada entra no **histórico**, e o **ranking local** do Flip 7 reflete a vitória.
- [ ] Posso instalar o app na tela inicial do celular (PWA).

## 11. Perguntas em aberto

1. ✅ **Empate — decidido:** maior total vence (sem rodadas extras); co-campeões só se os maiores totais forem exatamente iguais. Ver 7.3.
2. **Entrada de pontos:** manter os **dois modos** (calcular + digitar) *(proposto)* ou só um deles?
3. **Mínimo de jogadores:** 3 (oficial) ou permitir 2 para jogo casual?
4. **Avatares:** quais/quantos presets e qual a paleta de cores? (definir o conjunto)
5. **Tela de Início:** mostrar a **grade com os "Em breve"** *(proposto)* ou abrir direto no Flip 7?
6. **Visual/identidade:** estilo (cores, tom, clima) — a definir na etapa de design das telas (mockups).

## 12. Próximos passos

1. Você **revisar esta spec** e ajustar o que quiser (em especial as Perguntas em aberto).
2. Definir o **visual das telas** (posso montar mockups para comparar).
3. Gerar o **plano de implementação** (passo a passo de construção).
