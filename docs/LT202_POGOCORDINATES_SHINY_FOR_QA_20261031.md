# LT202 — Contrato PoGoCoordinates (revalidação 31/10/2026)

## Fontes e escopo
Atualização baseada no spec e no diff fornecidos pelo usuário em 31/10/2026, comparados com os módulos API e Rare Candy da LT201. **Os exemplos completos do spec original contêm identificadores de conta, e-mail e material de autenticação de demonstração, portanto não foram publicados no repositório nem transmitidos no Drive.**

O conteúdo público indica rota `POST /search` no host `coordinates-api.pokemongopro.com`; `GET /feeds/{slug}` devolve o mesmo esquema de itens; `POST /rare-candy/search` retorna `coords` sem `/reveal`. As respostas públicas podem trazer `tier: "non_logged_in"` e `cap: 5`, enquanto o free logado tem `cap: 10`. O aplicativo mantém a limitação visual independente em até 10 resultados e não tenta obter mais itens por paginação ou contornar o limite do plano.

## Contrato de Shiny / Background
- `shiny_for: string[] | null` é metadado de contas vinculadas às quais o spawn pode corresponder. É **diferente** de `shiny: boolean` e `background: boolean`, calculados para o `shiny_account` selecionado.
- A função JS observada pelo usuário exibe ícones `✨`/`🏞️` para os dois booleanos e concatena nomes apenas quando `shiny_for?.length` é verdadeiro. Uma lista com nomes **não deve alterar** os booleanos do card, nem provar sucesso de busca Shiny.
- O parser aceita `null`, arrays válidos com itens `string`, remove repetição e impede que valores arbitrários como e-mails, códigos de autenticação ou mensagens entrem na UI. Apresentação limitada a três nomes por linha com contador compacto de extras.
- A indicação de contas só atravessa a ponte API→Android→WebView se o filtro for Shiny ou Background e a busca tiver explicitamente uma conta de treinador vinculada/selecionada e tier não anônimo. Sem essa evidência, `shinyFor` é `null`.
- A opção de filtragem de background passa a utilizar a mesma seleção de treinador verificada por slot que o filtro Shiny. **P1 e P2 permanecem independentes.**
- Ligação de treinador continua permanente e exige autenticação, nível/eligibilidade definido pelo fornecedor, confirmação explícita e limites do plano. Não tentar `trainer/confirm` automaticamente.

## Rare Candy / localização / limites
- Rare Candy no site: `/search?tab=rarecandy`; API: `POST /rare-candy/search`. `coords` e `expires_at` vêm diretamente, `distance_km` pode ser `null`, e não existe `reveal_code`.
- A interface de Rare Candy usa raio em **metros**; o contrato da API exige `radius_km`. Fluxo atual já faz `radiusMeters / 1000` e respeita 429/Retry-After. Nenhuma modificação desnecessária nesse módulo.
- Planos no site público: Free 10 resultados por busca (autenticado), VIP 25, VIP+ 50, Super+/Ultra+ 100; feed anônimo 5. Nomes comerciais não devem ser usados como autorização local: o campo de resposta `cap` continua sendo a fonte da quota da busca.
- O `POST /search` mantém `pokemon_ids`, `species_forms`, `center_lat/center_lng/radius_km` e `pvp_league` válidos; não foram inventados campos, bypass de 403, ou políticas de retry para 429/422.

## Testes obrigatórios
`node app/tests/lt202-shiny-for-provider-spec.test.js`, `lt77-api-contract.test.js`, `lt118-api-dual-contract.test.js`, `lt189-api-default-schema.test.js`, `lt200-api-dom-failures.test.js`, regressão completa, Java/Android e OTA.

Casos: null anônimo, arrays preenchidos, sem trainer selecionado, String inválida, e-mail, número, duplicatas, múltiplos nomes, Shiny falso com `shiny_for` não vazio, background verdadeiro, tiers com caps 5/10/100, P1/P2, sem vazar nome de treinador em logs.

## Limitação / homologação
A documentação foi produzida com dados fornecidos pelo usuário; a presença de nomes reais em `shiny_for` no ambiente autenticado ainda requer teste com contas autorizadas e treinador efetivamente vinculado. Os testes automatizados não substituem a verificação visual no Samsung. O spec anexado não autoriza ações destrutivas nem mudanças nos planos VIP.

## Publicação oficial verificada (31/10/2026)
- Merge [PR #169](https://github.com/LucianoToscano/PokeSearch/pull/169), fonte `912ff2c78d2526532a75b42ee4c9a6e0cb39ebb1`.
- [Workflow #41228184179](https://github.com/LucianoToscano/PokeSearch/actions/runs/41228184179) **SUCCESS**, incluindo testes de regressão, build Android protegido, assinatura v2 permanente e hash do APK publicado.
- [Release LT202 oficial / latest](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.02-54409): 29.262.143 bytes, SHA-256 `d375602f4857ad031906b581ae9795798bdcc0fba4d1821aa5dc62e65ea5a4f1`.
- [Google Drive — ZIP com APK e relatórios](https://drive.google.com/file/d/1XWrMubOZlFN9ax5LZ1kC7Z0jvgTSvn30/view?usp=drivesdk): 26.922.827 bytes, SHA-256 `de60f71651b9e689ec561994042b924baf43ae92f5f0864eb5fc77a181430d84`. O ZIP e o hash do APK interno foram verificados.
- **Ainda pendente:** validar com sessão de treinador real vinculada em aparelho Samsung que `shiny_for` preenchido corresponde à conta; não afirmar Shiny de contas alheias, alteração do servidor ou homologação física sem teste.
