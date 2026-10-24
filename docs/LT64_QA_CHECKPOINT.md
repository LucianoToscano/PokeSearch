# PokeSearch LT64 — QA de resultados Samsung

Branch `fix/lt64-result-coords-sprites-expiry-20261024`; base LT63 `0fc75219d0c63d7d740f5a5fd9d19d807f6b643d`.

Build de homologação somente nesta branch, sem merge. Exigir `versionCode=54262`, `versionName=0.00.64`, pacote `com.lucianotoscano.pokesearch`, mesma assinatura SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Não expor segredos.

Verificações: 11 suítes Node, Java PopupTouchGeometry, unit tests e Gradle compile, apksigner, SHA256SUMS, aapt e integridade ZIP. Pendente ainda homologação física Samsung: Get coords, toque longo, reordenação de cards, sprites, expiração com AUTO OFF, GL/UL, Shiny e toque em overlays.

### Tentativa 1
Primeiro workflow falhou na asserção antiga `UX-SPRITE-01` que exigia declaração imediata de falha nas imagens. O comportamento LT64 tenta recuperar duas vezes a mesma URL verificada antes de exibir o fallback; teste atualizado para esse contrato. Nenhum APK publicou na tentativa falha.

### Tentativa 2
As 10 suítes herdadas passaram e os novos 16 contratos LT64 tiveram 15 PASS e 1 erro de caminho de arquivo no próprio teste (`app/src/build.gradle.kts` em vez de `app/build.gradle.kts`). Corrigida a referência; nova compilação assinada solicitada no commit seguinte.
