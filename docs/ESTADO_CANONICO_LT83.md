# ESTADO CANÔNICO — PokeSearch LT83 (25/10/2026)

> **Única versão oficial mais recente: LT83 `0.00.83` / `versionCode 54286`.** A documentação anterior é histórico e não deve sobrescrever esta informação. Distinguir versão publicada, commit compilado, SHA de integração e QA no Samsung.

## 1. Distribuição pública verificada

- **GitHub latest release:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.83-54286, **stable**, draft=false, prerelease=false.
- **Asset:** `PokeSearch-v0.00.83-LT.apk` — **38.603.587 bytes**.
- **SHA256:** `451e4781581122908f014a893f693c8312b36b2c222a8579c499c6c3e2975c1c`, confirmado no GitHub Releases como `digest` do asset e localmente via SHA256SUMS do artifact.
- **Assinatura:** certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, APK Signature Scheme v2 true, não depurável, R8 e shrinkResources.
- **ApplicationId:** `com.lucianotoscano.pokesearch`. Namespace preservado.
- **Código de produção compilado:** `5cf9adb62efb97a185ec955cab6eb0f49fbb4e88` (NÃO confundir com commits posteriores de Docs/Main).
- **QA completa assinada:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40159949347 — SUCCESS; artifact privado ID 12586486098.
- **Publicação/verificação final GitHub Releases:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40160258112 — SUCCESS.

## 2. Histórico imediato real e pendências

| Marco | Versão/code | Distribuição | Situação |
|---|---|---|---|
| LT79 | 0.00.79 / 54282 | Google Drive ponte legado | Mantida, não é latest |
| LT80 | 0.00.80 / 54283 | GitHub Releases | Histórico estável |
| LT81 | 0.00.81 / 54284 | APK QA privado | Não publicado como latest |
| LT82 | 0.00.82 / 54285 | GitHub Releases | Substituída por LT83 |
| **LT83** | **0.00.83 / 54286** | **GitHub Releases stable latest** | **Publicada e verificada no CI; Samsung pendente** |

**Ponte:** manifesto Drive público arquivo ID `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf`, https://drive.google.com/file/d/15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf/view aponta a LT79 (código 54282). Clientes anteriores instalam LT79 e depois entram no fluxo GitHub. Nunca substituir o manifesto antigo inadvertidamente. O instalador Android não é silencioso: depende de confirmação do usuário.

**Código e PRs:** branch `fix/lt83-location-recovery-geometry-20261025`, PR #57, base LT82; há PR #56 de integração histórica LT82 na main antiga. Após a integração, conferir SHA real da `main` e atualizar este documento para apontá-lo. PRs antigos (#34/#49/etc.) não foram automaticamente fundidos. Somente mesclar após testes e revisão de compatibilidade, preservando histórico.

## 3. LT83: o que mudou, sem empobrecimento

- **Tela Android Samsung:** foto LT82 mostra coords cortadas e botões saindo da janela, menu que encolhe. Localização LT83 estabiliza a janela NATIVA em largura 286 dp (limitada à tela), independentemente de teclado, resize CSS, rótulos ou React; CSS final usa 286 CSS px e grid centralizado com quatro controles completos; input monoespaçado com espaço para longitude. Mantidos título central, entrada, slider e linha [Colar ↑][km][✓][Lixeira].
- **Probe do site:** rótulos Coords e Coordinates; fallback mobile para modo Coords somente quando o par de inputs de placeholder oficial (lat,lng e Radius km) é único e visível e Area não está ativa. Clique no modo Coords é limitado por tempo, evitando re-renderização repetitiva dos controles do React. Confirmação final exige correspondência rigorosa de coordenadas, raio e modo.
- **Preservado:** sistema de filtros IV 0/100/GL/UL, clima, formas, Shiny, favoritos (10×5 até 50), alertas gerais e sons, Get coords ligado ao mesmo spawn, sprites, Editor Visual, atualização SHA256+assinatura, botão limpar e controle do raio 0 a 1000km, modo automático, dados e preferências, sem alterar applicationId ou keystore.
- **Testes:** `app/tests/location-probe.test.js` com fixture mobile, `app/tests/lt83-location-geometry-mobile.test.js` e suíte histórica, Gradle release assinado: PASS.

## 4. Homologação física e risco não resolvido

**NÃO homologado fisicamente** nesta versão; o último print mostra LT82 com falha. Testar LT83 no Samsung, colar `24.9407581,121.1889794`, conferir os dois números por inteiro sem rolagem; raio 0/215/1000; botões dentro da janela; aplicar, confirmar filtro de site; limpar antes e depois; minimizar e reabrir painel sem encolher; toggles Clima/Shiny, GL/UL, favoritos, atualização e Get coords. Se ainda falhar, usar relatório interno sem incluir coordenadas ou credenciais, inspecionar DOM/React real e corrigir em LT84 antes de marcar PASS.

Testes de CI aprovados verificam sintaxe, contratos e integridade, não execução física em dispositivo. Não afirmar sucesso do filtro geográfico só pelo clique; a confirmação deve vir do site.

## 5. Identidade, arquitetura e controle de publicação

- Repositório público `LucianoToscano/PokeSearch`.
- `com.lucianotoscano.pokesearch` (applicationId imutável), namespace `com.lucianotoscano.pokesearchoverlay`.
- JDK 17, Gradle 8.11.1, compileSdk 36, targetSdk 33, minSdk 26.
- Overlay Android + WebView + evaluateJavascript + `probe.js`. Integração API experimental opt-in, sem backend/proxy/GPS físico, máx. 10 resultados. Não misturar com PvPPokeGo.
- Valores antigos de fallback em `app/build.gradle.kts` NÃO indicam versão instalada: GitHub Actions injeta `POKE_TEST_VERSION_CODE=54286` e `POKE_TEST_PUBLIC_VERSION=0.00.83`, confirmado no APK com aapt.
- Historizar este documento, README e **APENDICAR** Guia Mestre integral `docs/GUIA_MESTRE.md` a cada ciclo. Jamais substituir arquivo histórico grande por retorno truncado do conector. Próxima code monotônica >=54287.
