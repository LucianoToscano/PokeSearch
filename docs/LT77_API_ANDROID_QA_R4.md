# LT77 — Android API QA R4 — plano de homologação Samsung

**Estado:** código de integração preparado em branch experimental; execução real no Samsung PENDENTE.
**Branch:** `feature/lt77-authorized-api-contract-20261024`
**QA:** `0.00.77`, versionCode `54280` (APK protegido, assinado após aprovação CI).
**Publicação:** proibida antes de homologação física. LT76 continua no manifesto público.

## Arquitetura implementada (opt-in)
- `AuthorizedApiCollector.java` injeta apenas scripts locais na WebView de
  `https://pogocoordinates.com` e recebe JSON higienizado por `evaluateJavascript`.
- `api_android_session.js` coordena `POST /search`, catálogos `GET /forms`
  e `GET /pokemon/catalog?costumes=true`, e `GET /reveal/{reveal_code}`.
- Os valores JWT e reveal_code permanecem **exclusivamente no contexto JS da
  origem oficial**; nunca transitam como resultado para Java, logs, arquivo ou
  `JavascriptInterface`. Não há `JavascriptInterface` na WebView remota.
- Resultados limitados a 10; geração, identidade do cartão, tempo de expiração,
  status HTTP e rank PvP com liga correspondente são conferidos.
- A configuração `authorizedApiQaOptIn` é **false** por padrão e deve ser
  acionada voluntariamente na tela de configurações. Alteração exige ↻.
- O `USE_AUTHORIZED_API=false` do router experimental permanece inalterado;
  o fluxo normal de produção continua DOM/probe.js.
- Alertas de novos Pokémon/favoritos são suspensos durante a busca API QA,
  evitando notificação baseada em dados ainda não homologados.
- `showTimers` é OFF no primeiro uso; a opção individual ON salva continua
  respeitada. O timer interno de remoção de spawns expirados segue funcionando.
- O sprite pode aparecer com placeholder ◉ durante a QA da API: a resposta
  JSON documentada não possui URL oficial de sprite e nenhuma URL foi inventada.

## Checklist físico — não marcar sem evidência

### 1) Instalação e regressões
- [ ] No Samsung, instalar o APK v0.00.77/54280 sobre a versão assinada anterior
      sem perder preferências nem histórico.
- [ ] Iniciar overlay; conferir uma única barra de botões sempre visível.
- [ ] Confirmar modo DOM tradicional com API QA **desligada**.
- [ ] Despawn individual começa OFF em instalação limpa; ON salvo permanece ON.
- [ ] Modos, Filtros, Localização, Pokémon, Favoritos, Editor Visual, Alertas,
      Reportar, Apoiar e Fechar não saem da tela nem bloqueiam fundo indevidamente.

### 2) API (ativação manual, sem distribuição pública)
- [ ] Nas configurações do app, ativar **QA LT77: testar API autorizada**;
      retornar ao overlay e pressionar ↻.
- [ ] Sem login: Search autorizado aceita plano anon quando o site/API permitir;
      o cap esperado documentado é 5.
- [ ] Com login oficial: Search usa o JWT **apenas no contexto WebView**,
      sem token em mensagens nativas; no plano free, até 10 cartões.
- [ ] Raw A/D/S 0–15 e IV% 0–100; nenhum cartão com IV divergente.
- [ ] Grande/Ultra Liga com Top 1–50, liga e rank real em cada item.
- [ ] Pokémon por espécie (todas as formas) e forma oficial exata funcionam,
      sem misturar IDs nem retornar cardinalidade falsa.
- [ ] Sexo Male/Female/Genderless/Any, tamanhos XXS…XXL, clima 1–7 e Boosted.
- [ ] Faixas PC, nível, sort e raio 0–1000 km com coordenadas exatas, sem
      limpar outros filtros.
- [ ] Shiny com treinador vinculado dá somente resultados Shiny verdadeiros;
      403 sem vínculo não muda a preferência nem expõe dados.
- [ ] Get coords obtém `lat,lng` do resultado atual, copia para área de
      transferência e recusa cartão expirado/troca de pesquisa.
- [ ] HTTP 401/403/429/503 e falta de rede não apagam cartões anteriores,
      não executam retries sem controle nem burlar rate limit.
- [ ] Durante QA API, nenhum alerta de favorito/novo spawn é enviado.
- [ ] Desmarcar API QA, ↻, e confirmar retorno ao DOM sem mistura de cartões.

### 3) Evidência de aceite
- [ ] Prints/vídeos do menu, de filtros aplicados e de resultados para ambos os modos.
- [ ] Logs de erros **somente com estado/resumo**, jamais JWT, trainer_code,
      reveal_code, URL de reveal ou respostas HTTP cruas.
- [ ] Teste de navegação/login/reload e arraste da Pokébola no Galaxy Samsung.
- [ ] Conferir package `com.lucianotoscano.pokesearch`, assinatura antiga,
      R8, release não depurável, SHA-256 do APK e build CI `success`.
- [ ] Aceite explícito no Samsung antes de mudar `USE_AUTHORIZED_API`,
      emitir nova versão de produção ou editar `atualizacao.json`.

## Limites e bloqueios
A compilação e testes unitários automatizados não substituem teste real de
`POST /search` autenticado no aparelho. Não foi executado login de usuário,
simulação física de toque, medição de performance real nem atualização pública
nesta etapa. Nunca afirmar homologação Samsung antes de receber evidências.
