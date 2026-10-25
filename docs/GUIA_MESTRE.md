
## LT77 — API Android QA R4 (25/10/2026) — integração experimental, ainda sem homologação Samsung

- Continuação do checkpoint `4fd5d9aecf33f69e93d0e0293f5beb38bd21d03c`, na branch isolada `feature/lt77-authorized-api-contract-20261024`. `main`, PR #34 e PR #49 foram preservados.
- Implementado `AuthorizedApiCollector.java`: injeta módulos locais da API **somente na WebView da origem HTTPS oficial**; callbacks via `evaluateJavascript` e polling JSON higienizado, sem `JavascriptInterface` no site.
- Implementado `api_android_session.js`: pesquisa oficial `POST /search` com autenticação opcional da própria sessão do site, catálogos `GET /forms` e `GET /pokemon/catalog?costumes=true` sob demanda, e Get coords via `GET /reveal/{reveal_code}`, vinculado ao resultado e à geração ativos.
- Corrigido transporte com JWT opcional para a pesquisa anônima, conforme especificação `pogo.md` do Drive; códigos de reveal nunca vão ao Android, cookies e credenciais não são exportados nem logados.
- Validação de rank/league PvP por cartão. No modo QA, resultados da API **não geram alertas** antes da homologação. Respeitado teto de 10 resultados. Origem indevida, stale selection, timeout e HTTP 403/429 interrompem sem contorno/bypass.
- Integração no `OverlayService.java` e switch local `authorizedApiQaOptIn=false` nas configurações de `MainActivity.java`; o coletor DOM/`probe.js` continua padrão. `USE_AUTHORIZED_API=false` em `api_integration_router.js` mantido.
- Preferência `showTimers` permanece desativada para novas instalações, preservando escolha antiga; expiração interna independe da exibição do contador.
- `docs/LT77_API_ANDROID_QA_R4.md` detalha homologação física pendente, testes de API, filtros, Get coords, Shiny, privacidade e bloqueio de publicação.
- Workflow `.github/workflows/lt77-samsung-api-qa-r4.yml`: build QA release assinado v0.00.77 / versionCode 54280, R8, verificações de assinatura SHA256, testes Node e Gradle. O resultado do workflow só será declarado após confirmação do GitHub Actions.
- **Não publicar** este QA como atualização remota até teste real no Samsung. O manifesto público Google Drive continua LT76.
