# PokeSearch LT115 — API, DOM, sprites e animação (25/10/2026)

## Sintoma e diagnóstico
API ligada: imagens ausentes ou incorretamente substituídas; efeito de captura/pulso na Pokébola não aparece. API desligada (DOM): efeito aparece.

## Causas reproduzíveis por inspeção
1. `performAuthorizedApiSearch` não avança para o estado visual `searching`, utilizado pelo CSS do pulso. O bloqueio `shinyPending` reforçava a ausência do efeito com busca ativa.
2. `normalizeResponse` aceita o campo `pokemon_id` numérico ou string, mas `spriteData` só processava inteiro do tipo number; por isso muitas linhas válidas vinham sem URL de sprite.
3. Resultado e detalhe são WebViews independentes: detalhe não tinha `shouldInterceptRequest` apontando para o pacote offline verificado; código da lista realizava troca para CDN após 1,4 s, mesmo se a imagem offline legítima ainda estivesse carregando; `img.complete` com dimensões 0 podia induzir falha precoce.
4. O fluxo de API era exclusivo; quando a consulta falhava transitoriamente, não buscava no DOM do próprio site.

## Correções
- Pulso visível quando `searchActive` && (`filling` ou `searching`), na Pokébola do dock e na janela de resultados, inclusive Shiny. `searchPhase="searching"` e status API antes de requisição.
- Gerador de imagem usa o dex já validado como número, sem vincular sprite de forma regional/traje a uma espécie base. Normal, Furfrou Natural e Shiny usam os 2.050 PNGs offline verificados.
- Retorno imediato de img.complete só se naturalWidth/Height>=8; proteção de 4,5 s antes do espelho CDN; interceptador `VerifiedSpriteCache.fromDisk` no detalhe (mesmo usado na lista), sem alterar permissões ou assinatura.
- API primeira; fallback DOM sequencial exclusivamente para erros transitórios `timeout`, `network-or-cors-error`, `service-unavailable`, `invalid-results`, `api-unavailable`, `catalog-unavailable`, `pvp-unverified`. **Nunca** bypass de `401`, `403`, `429`, login, VIP, filtro inválido. Fluxo DOM passa pelo gate de sessão/autenticação e pelas verificações existentes de IV, shiny, filtro e expiração. Sem mesclar resultados incertos e sem copiar coordenadas entre pesquisas.
- Código compartilhado via `OverlayService` para P1 e P2, mantendo `prefs` e `prefs_secondary`, resultados e busca independentes.

## Testes
- `app/tests/lt115-api-dom-sprites-loading.test.js` valida sprites API ID numérico/textual, 100% e 0%, forma especial, pulse CSS, fallback autorizado, ambas instâncias.
- `lt113-get-coords-canonical-dual.test.js`, `lt112-dual-overlay-parity.test.js`, regressões Node/Java/Gradle/assinatura através de GitHub Actions.
- QA físico Samsung obrigatório: conferir carregamento das imagens na lista e nos detalhes em P1 e P2; Shiny; animação durante API, durante fallback e durante DOM; cada filtro; alertas; login, posições, 3 perfis; ausência de coords alheias e false alerts.

## Governança
LT115 QA 0.01.15/versionCode 54319, sem lançamento oficial até aprovação do proprietário. PR #73 Draft; não mexer em main nem backups. Corrigir conflitos de merge apenas em etapa explícita após QA, sem rollback.

## Revisão de integração LT116
- Durante o review foi identificado que `detailPanel.setWebViewClient` já estava configurado mais adiante no ciclo da Activity, contendo `onPageFinished`; a primeira alteração colocava outro interceptor antes, que seria sobrescrito. Foi consolidado **um único cliente**, mantendo simultaneamente `shouldInterceptRequest` e `onPageFinished`.
- O APK preliminar `0.01.15/54319` não é candidato de instalação. Use somente a QA corrigida `0.01.16/54320`, se todos os testes de CI e assinatura passarem. Ambos continuam NÃO oficiais.
- A suíte LT115 foi reforçada para falhar se houver dois `setWebViewClient` no painel de detalhes.

## QA LT116 final, sem publicação oficial — 25/10/2026
- **GitHub Actions #40243697039 SUCCESS:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40243697039. SOURCE_COMMIT do binário: `dd4c7dcde6404bd5f15a0dc897f873e7ca802d90`.
- **APK assinado:** `PokeSearch-v0.01.16-LT-Coords-Parity-QA.apk`, `versionName=0.01.16`, `versionCode=54320`, applicationId `com.lucianotoscano.pokesearch`.
- **SHA-256 binário:** `38bf598b5c267f2ad8493de69fae79b836d2e3388a0ac3fd314fcebf39c6b762`; **certificado v2:** `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- ZIP APK íntegro; 2.050 sprites com SHA-256 conferidos contra manifesto de cada arquivo (1.025 normais, 1.025 shiny). Node QA, Java, Gradle/R8 e assinatura concluídos com sucesso no workflow. Semelhante a builds anteriores, `testDebugUnitTest NO-SOURCE` não é execução de testes instrumentados no aparelho.
- **Não instalar os candidatos 0.01.15/54319:** builds de desenvolvimento abortaram antes da criação de APK. Somente 0.01.16/54320 possui binário assinado aprovado nesta etapa.
- **Samsung pendente:** P1 100%/P2 0% no mesmo momento, sprite lista + detalhe normal/shiny, pulso durante API e DOM, fallback transitório (sem burlar 401/403/429), preferências/sons/alertas/Favoritos, instalação preservando dados e Get coords. PR #73 segue Draft e main estável não pode ser modificada sem autorização.
