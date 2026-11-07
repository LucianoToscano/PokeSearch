# PokeSearch LT290 — dimensões visuais das sprites novas de evento
Data: 07/11/2026. Base oficial: LT289 `v0.02.89-54493`.

## Evidência física
Duas imagens enviadas pelo usuário com os mesmos dez Resultados, com e sem caixas-guia: sprites novas como Charmander com chapéu e uma fantasia pequena ocupam área muito menor do que Torchic, Mudkip ou Ralts dentro de caixas equivalentes. A identificação e o carregamento dos sprites já funcionam. Corrigir apenas o preenchimento visual, sem alterar espécie, arte ou P/M/G.

## Causa
LT289 dependia de assets GO já empacotados como referência para grandes margens transparentes; a coleção de variantes novas é maior do que o acervo incluído. A imagem HTTPS funciona no card e no resultado, mas o canvas da WebView do aplicativo pode ficar CORS-tainted e retornar `null` para os pixels alfa, deixando zoom 1 ou limitação conservadora.

## LT290 implementada
1. `probe.js` tenta medir a silhueta do elemento <img> **já escolhido e verificado no card original do PoGoCoordinates**. Antes de coletar, exige mesma URL HTTPS do card, imagem decodificada e pixels legíveis; retorna apenas um pequeno retângulo {url,left,right,top,bottom} em uma grade 96×96. Qualquer falha de leitura/CORS retorna `null` silenciosamente. Sem nova requisição, sem coleta de conta ou coordenadas adicionais.
2. `dock.html` só considera esse retângulo para a mesma URL de imagem exata do encontro, sob `imageFromSite` e `providerExact`. Não muda o HTML da sprite nem seu arquivo.
3. `sprite_visual_scale.js` centraliza e amplia somente imagens realmente pequenas (silhueta ocupando menos de 80% do quadrado), usando geometria da arte original. Máximo 7× exclusivamente com medição real do asset; sem ampliar indiscriminadamente sprites comuns. Tamanhos P/M/G e limites do toque continuam como estão.
4. Se a página do site não puder ler pixels e o encontro for uma fantasia/forma/evento de origem verificada, pode carregar UMA imagem auxiliar `Image` com `crossOrigin=anonymous` da **mesma URL** para tentar medir os pixels, sem trocar a imagem exibida ou fazer nova busca na API. Se CORS bloquear novamente, mantém escala conservadora.
5. Callback de medição é ignorado se a linha foi removida, recebeu outra URL ou se uma medição real mais recente superou o fallback aproximado da referência local.
6. Preservar dados dos 2 overlays, sprites regionais, Shiny, vestimentas, card de detalhes, IVs, PvP/Raides, OTA, favoritos e filtros.

## QA
- `node app/tests/lt290-exact-event-sprite-silhouette.test.js`: simula canvas do card original, CORS bloqueado, escala original pequena, sprite normal, rejeição de URL diferente, retry de evento no máximo uma vez, troca de resultado e callback tardio.
- Roda junto ao Node QA, LT169 full, LT211 core Android, LT173 OTA, LT253 visual P/M/G, LT62 Java e beta privado. Somente após aprovação de todos os gates seguir com merge, build/assinatura oficial e conferência do SHA-256.
- **Físico Samsung pendente:** alternar P1/P2 com Pokémon novos daquele evento em Singapura, incluindo Charmander de chapéu, Pikachu Anniversary Singapore 01, Chikorita, Ralts, Mudkip, Torchic; testar bordas ligadas/desligadas, P/M/G, retorno de app e rede lenta. Pixel alpha externo pode permanecer indisponível por CORS: nesse caso não declarar correção física comprovada.

## Limitação
Se a página original e a medição auxiliar não puderem ler a transparência da imagem, LT290 mantém o fallback seguro; não inventa um zoom usando o nome de um Pokémon que poderia cortar uma fantasia diferente.

## Integração e publicação oficial verificadas
- [PR #284](https://github.com/LucianoToscano/PokeSearch/pull/284) mesclada por squash `caf072b4484c369aa0a89f1e3f0f52dc39e881c3`. Commit testado `ec0dac917646a8a74890c0fb3ef3d7d3403d7705` com sete gates `success` (Node, LT169, Android, Java, OTA, visual, beta privado); build genérico da PR `skipped` por política.
- [Workflow permanente #42350034300](https://github.com/LucianoToscano/PokeSearch/actions/runs/42350034300): `completed/success`, `preflight=success`, `publish=success`; build protegido, assinatura do APK e digest público validados.
- [Release estável LT290](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.90-54494): `v0.02.90-54494`, publicada em 07/11/2026 07:12:58 UTC; `draft=false`, `prerelease=false`; APK `PokeSearch-v0.02.90-LT.apk`, 33.935.994 bytes, SHA-256 `71b9c498bd786bc718739f7179ae1dc432490aa6cc2290e12a6232aff8c86770`, [download direto](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.90-54494/PokeSearch-v0.02.90-LT.apk). Solicitação SHA `badf71b95b2b2193cce3aaa9aff1afaae265c7b8`.
- **PENDENTE:** confirmar fisicamente no Samsung P1/P2 se o card do PoGoCoordinates e a nova lista têm silhuetas proporcionais sem ultrapassar a caixa de P/M/G. Falhas de CORS continuam com fallback conservador, sem inventar uma escala.
