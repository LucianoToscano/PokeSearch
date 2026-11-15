# Continuidade PokeSearch após LT355 — prompt para novo chat

**Estado OFICIAL verificado em 15/11/2026:** 0.03.51 / 54558 / 51355, [release v0.03.51-54558](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.51-54558), [APK assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.51-54558/PokeSearch-v0.03.51-LT.apk) de 61.135.091 bytes, SHA-256 `236b65d4cd5132f75a368150b17f6bad02156cc3b6eb66b029a029690731110a`, [workflow oficial #43672361588](https://github.com/LucianoToscano/PokeSearch/actions/runs/43672361588) SUCCESS. PR #397 implementação, PR #398 publicação integradas. Nunca inferir que o usuário instalou o APK.

Assuma ARK para o repositório `LucianoToscano/PokeSearch`. Verifique
o HEAD atual da main e a última GitHub Release, não suponha que o estado
deste arquivo continua vigente. Consulte `AGENTS.md`,
`docs/GUIA_MESTRE.md`, `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`,
`docs/LT354_ARK_AUDITORIA_E_ACEITE_20261114.md` e
`docs/LT355_ARK_AUDITORIA_E_ACEITE_20261115.md`.

LT355 PR #397: preparou `PgsAutoNativeModels` e manifesto
`assets/pgs-native/manifest.json` **vazio**, corrigiu restore das
amostras sem achatamento, status "minha/nativa/capturar" no filtro,
geometria fail-closed de capture/display, diagnóstico de preview e ROI
de paisagem. **Não alegar que Metagross já tem modelo nativo ou que o
PGSharp recebeu toque real.** O APK externo fornecido contém conteúdos
Unity parcialmente remotos e não forneceu miniaturas licenciadas/validadas
que possam ser distribuídas automaticamente. O modelo de Pokédex
não equivale à miniatura lateral do feed PGSharp.

Próximo passo: coletar e homologar captura de feed real de Metagross,
preferencialmente a partir de arquivos autorais/autorizados fornecidos
pelo proprietário, incluindo dimensões, build, licenças, SHA256, formas,
versões e variações. Registrar um modelo no manifesto só depois de
aprovação e testagem visual; adicionar casos de falsos positivos e
benchmark de uso de CPU. Testar preview ◎ (sem gesto), confirmar duas
capturas, diferença de posição/corte e reação real do jogo; nunca
automatizar "Sou passageiro". Não integrar PR draft LT350 #385.
Qualquer alteração passa por 7 gates, merge seguro, release oficial
protegida monotônica, SHA256, atualização do Guia Mestre e prompt ARK.
Sem confundir QA CI com aceite físico. Não instalar APK sem consentimento.
