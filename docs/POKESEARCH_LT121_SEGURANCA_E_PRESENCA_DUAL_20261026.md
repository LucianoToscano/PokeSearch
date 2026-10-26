# PokeSearch LT121 — WebView Native bridge e presença Firebase P1/P2

Data 26/10/2026. Código auditado a partir da `main` LT120 (`b0767811be963c698c0b6e2e7f4a017fa965e2ea`).

## Causas comprovadas
1. **Navegação em cinco WebViews internos:** `OverlayService` usava `addJavascriptInterface(new Bridge(),"Native")` nos WebViews dos controles, menu, detalhe, popup e resultados; os clientes dessas views não implementavam `shouldOverrideUrlLoading`. Isso permitia navegações de documento principal não restringidas pelo código, risco de exposição da ponte. O `onPageFinished` ainda aceitava qualquer prefixo `file:///android_asset/`.
2. **Contagem de presença com duas Pokébolas:** `FirebaseStats.setOverlayVisible(context,boolean)` tinha apenas `overlayVisible` global. Como P1 e P2 chamam a mesma API, parar qualquer serviço podia registrar presença como OFF mesmo enquanto o outro permanecia ligado.

## Corrigido nesta etapa
- `LocalBridgePagePolicy`: valida URI `file:` com ausência de autoridade e caminho exato `/android_asset/dock.html` ou `/android_asset/detail.html`; para `dock.html`, somente as combinações de query já utilizadas `controls=1`, `controls=1&popup=1`, `results=1` ou query ausente. Rejeita `http:`, `https:`, `content:`, `data:`, `javascript:`, outros arquivos, parâmetros desconhecidos e caminhos percent-encoded.
- Os **cinco** WebViews com ponte `Native` recusam navegação não permitida em ambos os callbacks `shouldOverrideUrlLoading`. `onPageFinished` passa a exigir documento exato; preservados callbacks de sprites offline, menus e cards. O WebView autenticado de PoGoCoordinates **não** recebeu um JavaScriptInterface nem restrição nova de OAuth.
- `PresenceWindowState.isActive(home,p1,p2)` centraliza estados; `FirebaseStats` mantém `primaryOverlayVisible` e `secondaryOverlayVisible` distintos. `OverlayService` informa o seu `isSecondaryOverlay()` ao iniciar/parar o serviço. O usuário só fica inativo quando Home, P1 e P2 estiverem inativos.
- Testes Node `lt121-local-bridge-presence.test.js`, Java `LocalBridgePagePolicyTest.java` com URI negativas e matriz de oito combinações, e ajustes de regressão legada `firebase-stats.test.js` e `lt104-dual-overlays.test.js`. Dois pipelines inicialmente rejeitaram testes antigos; atualizado e CI **SUCCESS** no commit final.
- `prefs`/`prefs_secondary`, dois filtros, API/DOM, localização, Get coords, favoritos, 2050 sprites-base e duas sprites regionais Zigzagoon Galar LT119 preservados.

## Evidências do build/merge
- PR [#76](https://github.com/LucianoToscano/PokeSearch/pull/76) MERGED em `main` via `82d6b5b2ae09aaf3b3fa8bed919bbf9c9d02adfc`.
- SOURCE_COMMIT do binário `5d4482d608b3060b704228f454dbe46b42f4f204`.
- [GitHub Actions QA assinado #40418117890](https://github.com/LucianoToscano/PokeSearch/actions/runs/40418117890) **SUCCESS** (Node/Java, sprites, Android release R8, assinatura v2 e relatórios).
- Artefato [#12697580015](https://github.com/LucianoToscano/PokeSearch/actions/runs/40418117890/artifacts/12697580015).
- APK `PokeSearch-v0.01.21-LT-Bridge-Presence-QA.apk`, `versionName 0.01.21`, `versionCode 54325`, `applicationId com.lucianotoscano.pokesearch`, tamanho `41.754.958 bytes`.
- SHA-256 APK `32bf812bff45450a67fa8ddd68b52d0efadc8c29bd8176046aee73f476bd0374`, **igual** a `SHA256SUMS.txt` do ZIP.
- Certificado Android v2 SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` verificado e preservado. ZIP de artefato abaixo de 199 MB.

## Não concluído / sem alegação de homologação
- **Firebase RTDB produção:** nenhuma regra/Functions implantada. Contadores continuam dependendo da produção e triggers atuais de função não têm idempotência por eventId; não anunciar contagem precisa.
- **Mural:** escrita continua bloqueada por design e moderador/rate-limit backend não implantados; não anunciar posts públicos ativos.
- **WebView:** mitigada a navegação principal nos cinco painéis; subframes, CSP, todos os recursos e autenticação remota exigem revisão adicional. Não chamar WebView 'totalmente auditado'.
- **Android/Samsung:** execução instrumental de matriz 110 cenários em dispositivo físico ainda pendente; confirmar que cinco janelas carregam e fecham normalmente, P1 e P2 simultâneas, favoritos, sprites, sons e Get coords, Home fechada/P2 ativa após parar P1.
- **2.050 sprites comuns:** pin imutável/lockfile geral ainda pendente; as duas sprites regionais LT119 têm commit fixo. targetSdk/FGS/Doze, limpeza de workflows antigos e formas especiais restantes ainda abertos.

## Distribuição
QA autorizada para testes. **Não substituir a release pública estável automaticamente.** Preservar `applicationId`, certificado, backups e Guia Mestre integral. A correção é a mesma para P1 e P2 (classe compartilhada).
