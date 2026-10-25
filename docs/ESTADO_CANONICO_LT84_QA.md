# ESTADO CANÔNICO — LT84 QA de API (25/10/2026)

> **A última versão pública continua LT83 0.00.83 / 54286.** LT84 é apenas um APK de QA, não foi publicado no GitHub Releases e não substitui o manifesto Google Drive LT79. A aprovação para integrar a API não é autorização para publicar a LT84.

## Base e branch

- `main` de origem antes do desenvolvimento: `d864a13f31617d1cc268d7dec0ecef38c97912de`.
- Branch isolada: `fix/lt84-authorized-api-direct-qa-20261025`.
- Workflow de build `lt84-direct-api-signed-qa.yml` — [#40163046534](https://github.com/LucianoToscano/PokeSearch/actions/runs/40163046534) **SUCCESS**.
- Build executado a partir de `9796152446d41712464bc309e8ad3bbaafd56c05` (head do workflow, não da branch após atualizações documentais).
- **APK QA** `PokeSearch-v0.00.84-LT-API-QA.apk`, `versionName 0.00.84`, `versionCode 54287`, dentro do artifact de QA [ID 12586524480](https://github.com/LucianoToscano/PokeSearch/actions/runs/40163046534#artifacts). O ZIP de artifact é diferente dos bytes do APK; consultar `SHA256SUMS.txt` para o SHA-256 do APK antes de instalá-lo.
- **SHA-256 APK extraído do artifact e conferido com SHA256SUMS:** `bdd5fcd32099d2724f528e42e6e0436d70451065751d42048ea735dd6317e351`; **38.604.999 bytes**. Não confundir com SHA do ZIP.
- Gradle `assembleRelease`, Android unit tests, todas as suítes Node, verificação v2 do certificado permanente e release R8: **PASS no workflow**. Relatórios `SIGNING-REPORT.txt`, `PACKAGE-VERSION.txt` e `SOURCE_COMMIT.txt` foram anexados ao artifact.
- **Assinatura de produção esperada, validada pelo workflow:** SHA-256 de certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Checkpoint oficial da LT83: [docs/ESTADO_CANONICO_LT83.md](ESTADO_CANONICO_LT83.md). Não alterar o APK da LT83 nem reinterpretar a lista de Novidades incorporadas depois de sua compilação.

## Integração API direta

- Mantida arquitetura WebView oficial + JS + `AuthorizedApiCollector.java`, com JWT localizado somente na sessão do site. `POST /search` e `GET /reveal/{reveal_code}` já existiam como opt-in LT77+ e permanecem conectados ao Android.
- Corrigido controle de 429 / Retry-After, cancelamento de busca antiga, duplicidade de Reveal, race condition do catálogo, limpeza de raio/coords e a distinção Any versus Genderless.
- Mantidas busca direta e DOM como opções separadas; opt-in `authorizedApiQaOptIn` continua **OFF por padrão**, sem retorno silencioso ao DOM.
- Resultados da API permanecem com alertas desabilitados na fase de homologação, para não gerar notificações falsas.
- Todos os filtros/funções originais do PokeSearch, visual, notificações, favoritos, editor, posição flutuante, atualização remota, assinatura e preferências foram preservados.
- Documentação de mudanças e testes: [docs/LT84_API_DIRECT_QA.md](LT84_API_DIRECT_QA.md).

## Estado de evidências

| Etapa | Estado |
|---|---|
| Código e commits isolados | Feito |
| Testes JS de contrato/regressão | PASS, workflow #40163046534 |
| Gradle e APK assinado protegido | PASS, workflow #40163046534 |
| Append integral do Guia Mestre | PASS, workflow #40163154255 |
| Consulta de API anônima ao vivo | PASS, workflow #40163231365: /health, /forms, catálogo e POST /search 15/15/15 sem JWT |
| Sessão autenticada real / contas vinculadas / reveal real | PENDENTE |
| QA Samsung (LT83 e LT84) | PENDENTE |
| Publicação oficial / merge main | NÃO AUTORIZADOS |

Os erros HTTP 401/403 e limites da conta são respeitados; não atribuir uma falha real à interface sem logs sanitizados. QA visual e funcional deve confirmar coordenadas `24.9407581,121.1889794`, raio 0/215/1000, limpeza, busca IV/GL/UL, Shiny e Get coords de spawn exato. Não registrar PASS físico sem imagem/relatório da LT84 no Samsung.

## Segurança e continuidade

- Application ID `com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`, JDK 17, Gradle 8.11.1, compileSdk 36, targetSdk 33, minSdk 26.
- Não exportar JWT ou reveal_code para Java, logs, Actions ou docs.
- Sem backend próprio, proxy, GPS físico, ou fontes de resultados misturadas. No máximo 10 cards e nunca contornar os limites de 5 anônimos/10 free logados.
- Somente publicar após aprovação específica do proprietário, validação de QA real e verificação do SHA-256 do APK. Não mesclar branch antes da revisão.
