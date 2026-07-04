# Gerar o APK (Android) e publicar na web

O app é uma **PWA** (instalável pelo navegador) e também pode ser empacotado como
um **APK Android** via **Capacitor**, reaproveitando o mesmo código.

## Pré-requisitos (já presentes nesta máquina)

- **Node 20**, **Android SDK** (`ANDROID_HOME` = `...\Android\Sdk`).
- **JDK 21** do Android Studio (`C:\Program Files\Android\Android Studio\jbr`).
  - O `JAVA_HOME` global aqui é o JDK 26 (novo demais para o Android Gradle Plugin),
    então o build aponta para o JDK 21 via `android/gradle.properties`:
    `org.gradle.java.home=C:/Program Files/Android/Android Studio/jbr`.

## Como o projeto está montado

- `next.config.ts` usa `output: 'export'` → o app vira arquivos estáticos em `out/`.
- A rota da partida é `/partida?id=<uuid>` (estática) — não há rota dinâmica de servidor.
- `capacitor.config.ts` aponta `webDir: 'out'`.
- A pasta `android/` é o projeto nativo gerado pelo Capacitor.

## Rebuild do APK (depois de mudar o app)

```powershell
npm run build          # gera o out/ (export estático)
npx cap copy android   # copia o out/ para dentro do projeto Android
npx cap sync android   # (se adicionar/atualizar plugins nativos)

# compila o APK de debug
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location
```

APK gerado em:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Instalar no celular

- Via cabo com depuração USB ativada: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
- Ou copie o `.apk` para o celular e instale (permitir "fontes desconhecidas").

## Versão de release (assinada, para distribuir/Play Store)

1. Gerar um keystore: `keytool -genkey -v -keystore release.keystore -alias bgs -keyalg RSA -keysize 2048 -validity 10000`
2. Configurar o `signingConfig` em `android/app/build.gradle`.
3. `.\gradlew.bat assembleRelease` (APK) ou `bundleRelease` (AAB para a Play Store).

## Publicar como web app

Como é export estático, qualquer host estático serve o `out/`. Na **Vercel**,
basta importar o repositório (o framework Next.js é detectado); o build roda
`next build` e publica o `out/`. A PWA (manifest + service worker) já vai junto.

> Observação: o service worker (`public/sw.js`) só é registrado em produção.
> Para testar offline localmente, sirva o `out/` (ex.: `npx serve out`).
