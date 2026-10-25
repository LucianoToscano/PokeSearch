# CONTINUAR POKESEARCH — CHECKPOINT LT86 QA (25/10/2026)

Continue o GitHub `LucianoToscano/PokeSearch` do HEAD real da branch `fix/lt86-api-filter-options-qa-20261025`. Consulte PRs #59, #60 e a PR LT86; README, `docs/ESTADO_CANONICO_LT86_QA.md`, `docs/LT86_CHECKLIST_SAMSUNG.md` e Guia Mestre COMPLETO antes de alterar. Autorização API já concedida, **não perguntar novamente**. Não publicar atualização pública nem mesclar sem autorização.

A última versão pública é LT83 0.00.83/54286, GitHub Release `v0.00.83-54286` (Drive legado LT79 intocado). LT84 e LT85 são QA. A LT86 0.00.86/54289 é QA incremental isolada sobre LT85: front aceita nível 50; API /forms devolve até 500 escolhas; lista de Formas tem Mostrar mais em páginas de 60; novo teste LT86 e workflow assinado privado. Confirmar GitHub Actions, artifact, SHA-256 verdadeiro e certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.

Preserve appId `com.lucianotoscano.pokesearch`, namespace, JDK17/Gradle8.11.1, Android compile36/target33/min26, overlay/WebView/probe.js, assinatura, preferências, Google login, Firebase e demais funcionalidades. API autorizada automática em novas instalações, DOM opt-out preservado, sem expor JWT/reveal_code, sem fallback que contorne 401/403/429, 10 resultados no máximo.

Próximos objetivos: homologar filtros e imagens reais; validar passagem dos parâmetros ao POST /search; obter GET /reveal com spawn real; verificar geofiltro 24.9407581,121.1889794 com raios 0/215/1000; pesquisar e corrigir defeitos confirmados; realizar teste físico Samsung. Guia Mestre com >1,4 MB deve ser apenas apendicado no checkout integral. Executar sem solicitar 'continue', sem confundir CI PASS com homologação e sem publicação oficial.
