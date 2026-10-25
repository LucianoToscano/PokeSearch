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
- Nesta compilação **QA R4**, `authorizedApiQaOptIn` é **true** por padrão após solicitação expressa do usuário. Uma escolha salva anteriormente é respeitada; para comparar com o DOM, desmarque a opção nas configurações e pressione ↻. Nenhuma versão pública foi alterada.
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
- [ ] Comparar o modo DOM com API QA desmarcada (o padrão deste APK de teste é API ligada).
- [ ] Despawn individual começa OFF em instalação limpa; ON salvo permanece ON.
- [ ] Modos, Filtros, Localização, Pokémon, Favoritos, Editor Visual, Alertas,
      Reportar, Apoiar e Fechar não saem da tela nem bloqueiam fundo indevidamente.

### 2) API (ligada por padrão apenas no APK de QA, sem distribuição pública)
- [ ] Confirmar em Configurações **QA LT77: API autorizada ativa**; se uma preferência antiga estiver OFF, habilitar e pressionar ↻.
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


### Atualização de configuração e CI R4
- Requisito novo: API selecionada **por padrão apenas nesta build QA**. `main`/LT76 não alteradas; fallback DOM preservado na caixa de seleção.
- Execução de CI: https://github.com/LucianoToscano/PokeSearch/actions/runs/40150000064 — **SUCCESS**; código fonte `ab79cd8f8560fea8d80c3fb0bfccdf5fe8341ee3`.
- Não liberar manifesto público antes da evidência Samsung; em erros CORS/HTTP manter os dados anteriores e o status como não homologado.

### Resultado efetivamente validado: build QA R4
- GitHub Actions #40150000064: **completed / SUCCESS**, testes JavaScript/Java, build release, validação do pacote e assinatura passaram.
- APK `PokeSearch-v0.00.77-LT-Samsung-QA-r4.apk`: 38.477.088 bytes; SHA256 `66bb242c9f0254184d03aaf38ca63091320c4c495a9d79b5bd6109e7c694ef7e`; versionCode `54280`; versionName `0.00.77`; `com.lucianotoscano.pokesearch`.
- Assinatura v2 verificada, mesmo certificado release já usado: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; R8 release não depurável.
- Artefato Actions id 12581712496; ZIP com comprovantes de assinatura e hash.
- Drive QA privado (sem permissão pública): [APK R4](https://drive.google.com/file/d/1TYWzwYmaL8L2nT2Y-SRhxGtO5YL8Z3m_/view) e [ZIP R4](https://drive.google.com/file/d/11cMFUwdRCpxQGpUS-TyAIFyL2jZLPP_0/view), ambos em `QA_LT77_NAO_PUBLICADO`.
- A publicação oficial `atualizacao.json` continua LT76 `0.00.76` / `54276`. Sem alteração na `main`, PR #34 ou #49.
- Não homologado fisicamente: Get coords, autenticação/CORS, filtros, tempo e interface dependem de teste real no Samsung.


### LT79 QA — 24/10/2026 — Correções de sprites, Pikachu e atualização GitHub
- A branch `fix/lt79-sprites-catalog-updates-qa-20261024` foi criada a partir de `ded06c4ab04cee2502af78e6ca6f43c9e092f02e`; main, LT76 público e PRs antigos preservados.
- A causa dos sprites API sem imagem foi confirmada em `spriteData()` que sempre retornava `""`. Agora espécie base sem traje usa fonte comunitária existente; variantes sem verificação mostram placeholder seguro.
- A causa do timeout do Pikachu foi o fluxo de sugestões ainda amarrado ao listbox React/DOM mesmo com API QA ativada. Ao selecionar API QA, o menu consulta catálogo oficial via `api_android_session.js`/`AuthorizedApiCollector.java` e sincroniza o filtro na busca.
- Os gestos da Pokébola e botão ↻ (toque curto; segurar 600ms) recebem orientação por Toast na primeira inicialização de OverlayService.
- Novo `GitHubUpdateCenter.java` foi adicionado sem remover `UpdateCenter.java`. Busca Releases estáveis aprovadas, instala via FileProvider com validação de SHA-256, pacote e certificado, solicita confirmação Android, usa WorkManager (30min sujeito a Doze). Google Drive continua caminho legado e ainda não possui fallback nativo equivalente.
- Workflow QA `.github/workflows/lt79-samsung-qa-protected.yml`: versão 0.00.78, versionCode 54281; compilação release com assinatura persistente se secrets CI válidos. Versão não publicada oficialmente.
- Workflow `.github/workflows/pokesearch-official-release-manual.yml`: SOMENTE acionamento manual e ambiente `official-updates`; exige proteção real desse ambiente nas configurações do GitHub e homologação Samsung antes de uso.
- O APK com este mecanismo precisa ser instalado pelo menos uma vez por meio da distribuição QA/atualização antiga; a versão LT76 não ganha código novo remotamente.
- Testes reais no Samsung, autorização final de publicação e disponibilidade do GitHub Release continuam PENDENTES. A última prova CI deve ser consultada em GitHub Actions. QA automatizada não equivale a homologação física.
- Documento detalhado: `docs/LT79_SPRITES_CATALOGO_ATUALIZACOES_QA.md`.
