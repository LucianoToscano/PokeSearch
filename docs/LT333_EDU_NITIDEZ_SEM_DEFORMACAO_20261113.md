# LT333 — Correção de nitidez do Edu sem deformar o master 512

Data: 13/11/2026. **Publicação oficial comprovada:** [`v0.03.32-54538`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.32-54538); [APK `PokeSearch-v0.03.32-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.32-54538/PokeSearch-v0.03.32-LT.apk) de **46.622.532 bytes**, SHA-256 `fc1fbadbbbae9511253432b687a18f122bee07093132068cacab02fc6195d7fb`. [Workflow #43422048343](https://github.com/LucianoToscano/PokeSearch/actions/runs/43422048343) `completed/success`: verificações Node/OTA, build, certificado, 68 fontes e hash público. Fonte `0bff545f7756a875959be1f29d1601f6599b9d61`; merge PR #341 `b28aa1d7559788a59253086b1552c4dfd77bb6f1`.

## Defeito reproduzido na LT332

A LT332 passou nos testes automáticos, porém usuários observaram desenhos de olhos e óculos com perda de legibilidade, além de alterações visuais entre poses. A revisão do código identificou dois fatores:

1. `EduSpriteGeometry512.normalize(original512,i)` fazia ampliação horizontal independente (até 1,68×) e vertical independente (até 1,35×), alterando as proporções de sprites sem revisão artística dos pixels. A #42, teleporte e fantasias eram exceções; o conjunto ficava heterogêneo.
2. `BitmapDrawable.setFilterBitmap(true)` ativava suavização bilinear no caminho do master 512 e no fallback de upscale do atlas 128. A redução para 100/150/200 pixels podia suavizar detalhes finos de pixel art.

Além disso, o último pacote de revisão fora do aplicativo deteriorou algumas imagens; **não deve ser importado sem aprovação visual por quadro**.

## Solução LT333

- `EduSpriteAtlas.frame()` devolve diretamente os 68 masters originais de 512×512, sem normalização anisotrópica. O ZIP fonte permanece com hash SHA-256 `f1957b7f6446d82ed9fdb9ace8b0b5d950dfc10f0709aa1618054a366791ac25`, conforme `EduSpriteMasters.java`.
- Removido `EduSpriteGeometry512.java`, deixando de haver caminho alternativo que modifica pixel/rosto e poderia ser reativado involuntariamente.
- `drawable.setFilterBitmap(false)` para a sprite nativa e para o fallback 128→512. `setAntiAlias(false)` continua. Não são inventados detalhes ausentes na arte.
- Preservados o quadro #42 SHA-256 `700968753c52d196145c3b9758ec426db744f91625576dad84d18d7f2b476b24`, a ordem dos 68 índices, oito sequências idle, costumes, Sombria, animações de teleporte, fallback P/M/G e demais funcionalidades do app.
- Teste de regressão `app/tests/lt332-edu-geometria-runtime-restauracao.test.js` adaptado para **proibir** escala destrutiva e filtro bilinear no Edu. Teste de integridade `lt330-edu-masters-highres.test.js` permanece exigindo os 68 PNGs em 512×512 e o hash da referência.

## Limites de aprovação

Este lançamento corrige a regressão de nitidez/escala da LT332, **não** corrige diferenças de desenho que já existiam entre as 68 fontes. Cabeça, fantasias e gestos ainda precisam de revisão artística e QA físico Samsung na issue [#334](https://github.com/LucianoToscano/PokeSearch/issues/334).

Antes de declarar versão pública, validar PR, compilar Android e APK assinado, conferir ZIP dos 68 masters dentro do APK, certificado permanente, nova tag, nome/tamanho/SHA-256 do asset e OTA. Não afirmar instalação no dispositivo.
