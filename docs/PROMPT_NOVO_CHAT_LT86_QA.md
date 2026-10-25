# CONTINUAR POKESEARCH — CHECKPOINT LT86 QA (25/10/2026)

Continue o GitHub `LucianoToscano/PokeSearch` do HEAD real da branch `fix/lt86-api-filter-options-qa-20261025`. Consulte PRs #59, #60 e a PR LT86; README, `docs/ESTADO_CANONICO_LT86_QA.md`, `docs/LT86_CHECKLIST_SAMSUNG.md` e Guia Mestre COMPLETO antes de alterar. Autorização API já concedida, **não perguntar novamente**. Não publicar atualização pública nem mesclar sem autorização.

A última versão pública é LT83 0.00.83/54286, GitHub Release `v0.00.83-54286` (Drive legado LT79 intocado). LT84 e LT85 são QA. A LT86 0.00.86/54289 é QA incremental isolada sobre LT85: front aceita nível 50; API /forms devolve até 500 escolhas; lista de Formas tem Mostrar mais em páginas de 60; novo teste LT86 e workflow assinado privado. Confirmar GitHub Actions, artifact, SHA-256 verdadeiro e certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.

Preserve appId `com.lucianotoscano.pokesearch`, namespace, JDK17/Gradle8.11.1, Android compile36/target33/min26, overlay/WebView/probe.js, assinatura, preferências, Google login, Firebase e demais funcionalidades. API autorizada automática em novas instalações, DOM opt-out preservado, sem expor JWT/reveal_code, sem fallback que contorne 401/403/429, 10 resultados no máximo.

Próximos objetivos: homologar filtros e imagens reais; validar passagem dos parâmetros ao POST /search; obter GET /reveal com spawn real; verificar geofiltro 24.9407581,121.1889794 com raios 0/215/1000; pesquisar e corrigir defeitos confirmados; realizar teste físico Samsung. Guia Mestre com >1,4 MB deve ser apenas apendicado no checkout integral. Executar sem solicitar 'continue', sem confundir CI PASS com homologação e sem publicação oficial.


## Complemento LT86 — pedidos de 25/10/2026

O proprietário trouxe screenshots Samsung mostrando sprites ainda não carregados e solicitou Genderless ⚲ em Informações, liberdade de arraste da Pokébola com informações ligadas, correção de janelas, três filtros gerais e três conjuntos de Favoritos salvos. Código de QA implementado na branch LT86: fanout de sprites no Android e CDN PokeAPI alternativo limitado a espécies padrão; estilo de ⚲; arraste independente da largura dos resultados; perfis Filtros 1–3 sob `generalFilterPresetV1_*`, sem Shiny/coords; Favoritos 1–3 sob `favoritePresetV1_*` na aba ▣, tap para usar / segurar para salvar. Teste `lt86-samsung-followup.test.js`. Verificar GitHub CI final, instalar QA e validar fisicamente antes de declarar concluído. Não publicar sem autorização.


## Complemento operacional obrigatório do checkpoint

Além das correções de Formas/Nível e Favoritos, a LT86 implementou Informações completas via ação Mostrar todas as informações, suporte ⚲ Genderless, prioridade Despawn, ranks PvP disponíveis GL/UL/ML com validação, timer absoluto `expiresAtMs` para API e varredura de limpeza de vencidos, sprite de base por CDN alternativo após erro/1,4 s, arraste de Pokébola sem travar na margem e arraste independente do card de detalhes pelo cabeçalho. Executar testes `lt86-all-result-information.test.js`, `lt86-despawn-detail-drag.test.js` e históricos, build assinado QA, análise de versão/certificado/hash/Guia Mestre. Nunca afirmar homologação Samsung sem teste físico. Não publicar LT86 sem autorização.
