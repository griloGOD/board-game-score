# 🎲 Board Game Score

Placar digital para os seus jogos de tabuleiro — **fiel a como cada jogo pontua**. Funciona no navegador (PWA instalável) e como app **Android**.

[![Baixar APK](https://img.shields.io/badge/⬇️_Baixar_APK-Android-dd6a45?style=for-the-badge&logo=android&logoColor=white)](https://github.com/griloGOD/board-game-score/releases/latest/download/app-debug.apk)

> **Fase 1:** foco no **Flip 7**. Os demais jogos (Catan, Dixit, Ticket to Ride, Azul, Survive, Bang! Dice, Trio) entram em breve.

## ✨ O que faz

- 🎯 **Placar fiel do Flip 7** — soma das cartas, ×2, modificadores, **+15 automático ao virar 7 cartas**, fim aos 200, campeão / co-campeões.
- 🧮 **Calculadora ou digitação** — o app faz as contas, ou você digita o total direto; e marca "estourou".
- 👥 **Jogadores com avatar (qualquer emoji) + cor**, reaproveitáveis entre partidas.
- 🏆 **Histórico e ranking local** — vitórias, melhor pontuação, nº de partidas.
- 📱 **Offline** — tudo no próprio aparelho (IndexedDB); PWA instalável + APK Android.

## 📲 Instalar

- **Android (APK):** baixe o [`app-debug.apk` mais recente](https://github.com/griloGOD/board-game-score/releases/latest/download/app-debug.apk), abra no celular e instale (pode ser preciso permitir "fontes desconhecidas").
- **Navegador (PWA):** abra o site publicado e use "Instalar app" / "Adicionar à tela inicial".

## 🛠️ Rodar localmente

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # testes do motor de pontuação
```

Stack: **Next.js 16 + TypeScript + Tailwind v4**, dados locais em **Dexie/IndexedDB**, export estático e **Capacitor** para o APK.

## 🔨 Gerar o APK

Passo a passo em **[docs/apk-build.md](docs/apk-build.md)**. Resumo:

```bash
npm run build
npx cap copy android
# Windows: android\gradlew.bat assembleDebug
```

## 📄 Documentação

- [Especificação da Fase 1](docs/specs/2026-07-04-fase1-flip7-placar-local-design.md)
- [Sistema de design](docs/design-system.md)
- [Build do APK e deploy](docs/apk-build.md)

---

As imagens dos jogos (capas e as cartas do Flip 7) são arte oficial (via [BoardGameGeek](https://boardgamegeek.com) / The Op), usadas aqui para fins pessoais.
