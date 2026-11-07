# PokeSearch LT287 — Paridade de sprites entre Resultados e Cards (07/11/2026)

## Evidência de uso real
O usuário mostrou screenshots Samsung em que **o detalhe do Pokémon exibe a imagem correta**, mas a lista independente de Resultados exibe o ícone de imagem quebrada ou apenas o número. O problema persiste mesmo quando o card do mesmo encontro exibe a sprite, inclusive Pokémon de espécie base. O pedido explícito é usar a imagem já verificada em `pogocoordinates.com` como no detalhe, sem trocar as formas.

## Causa confirmada por revisão do código
- O `probe.js` extrai `siteImageUrl` apenas dentro do card real do PoGoCoordinates e marca `imageFromSite:true` após verificar número/nome, Shiny e forma. O `sprite_offline.js` marca `providerExact` quando há imagem HTTPS recebida do site.
- Em `detail.html`, `useArt` exibe `art.src` (fonte do site) e usa dados exatos do bridge nativo só quando o `art.src` local base é o principal ou a imagem falha.
- Em `dock.html` LT286, `nativeArt||art.src` sempre preferia o PNG do bridge nativo mesmo quando `art.src` era imagem validada do site. Isso tornava as miniaturas diferentes do detalhe.
- Somente na lista, o atributo `crossorigin="anonymous"` era acrescentado às imagens hospedadas em GitHub/CDN. Esse modo exige acesso CORS mesmo quando um `<img>` comum funciona; o detalhe nunca o utilizou. O medidor de alfa (`sprite_visual_scale.js`) já possui fallback seguro caso o canvas fique "tainted".
- O fallback `tryVerifiedLocal` verificava apenas o prefixo antigo `file:///android_asset/`, mas o carregador protegido `OtaAssets.response` traduz estes caminhos para `https://appassets.androidplatform.net/assets/` quando serve HTML/JS. Um caminho offline válido podia ser rejeitado.

## Alterações
1. Resultados priorizam `art.src` **quando e somente quando** `c.imageFromSite===true && art.providerExact===true` e a URL é HTTPS. Desse modo a lista busca a exata imagem comprovada no card PoGoCoordinates antes de recorrer ao cache local.
2. Quando a imagem do site falha/demora, permanece o fallback do mesmo encontro e identidade via `bundledExactForArt`/bridge nativo, sem nova busca/API e sem permitir variar Shiny, fantasia ou forma.
3. Removido `crossorigin="anonymous"` somente da exibição de miniaturas da lista, preservando a política `sprite_visual_scale.js` para fontes cujo canvas não pode ser lido por CORS. Em vez de bloquear a imagem, a escala fica no CSS seguro.
4. `tryVerifiedLocal` usa a mesma rotina nativa `verifiedBundledData` do detalhe e aceita os dois caminhos internos verificados: `file:///android_asset/pokemon-sprites/base|shiny/N.png` e `https://appassets.androidplatform.net/assets/pokemon-sprites/base|shiny/N.png`. Somente quando `verifiedBase(card)` comprova espécie/forma padrão.
5. P1/P2 continuam isoladas por WebView e seus próprios dados; não há proxy externo, nova permissão, credenciais, login, alteração de rankings, favoritos, coordenadas ou assinatura.

## QA
- Novo `node app/tests/lt287-provider-sprite-results-parity.test.js` valida imagem do site, origem não comprovada, URL HTTP, fallback pelo bridge nativo, dois prefixos internos e nenhuma substituição de costume desconhecido.
- Atualizado teste LT226 para não impor CORS à miniatura: prova que o zoom 85–90% conserva fallback seguro para imagens externas sem permissão de pixels.
- Gate CI: regressão Node total, lógica/compilação Android, OTA, referência PvE, visual P/M/G e APK beta privado, todos **no mesmo SHA**, merge e assinatura oficial antes de release.
- **Samsung físico pendente:** comparar Resultados e Card para Bulbasaur, Squirtle, Raticate, Grimer, Eevee, Charmander, Shellos East/West, Burmy Sandy e Gengar com fantasia; rodar P1/P2 e rede lenta, validar após voltar da tela inicial e bloquear/desbloquear. A aprovação CI não comprova que toda imagem remota foi recebida.

## Status
LT287 publicada e verificada pelo workflow oficial; base anterior estável LT286 `0.02.86` / versionCode `54490`. Homologação física ainda pendente.

## Evidências finais da publicação
- [PR #281](https://github.com/LucianoToscano/PokeSearch/pull/281) mesclada por squash `39844007d8cfd251c6ec0f47428e73ebd7e05627`; head do QA `26656061f54eac372fce703763b1982ef869a462`, sete gates obrigatórios `success` (Node, regressão, Android, Java, OTA, visual e APK beta). Build genérico em PR ignorado por política.
- [Workflow permanente #42344635747](https://github.com/LucianoToscano/PokeSearch/actions/runs/42344635747): `completed/success`, `preflight/success`, `publish/success`, com `Build signed protected release`, `Validate APK and signer` e `Verify public release and hash` aprovados.
- [Release pública estável LT287](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.87-54491): `v0.02.87-54491`, publicada em 07/11/2026 05:57:25 UTC; `PokeSearch-v0.02.87-LT.apk` com 33.822.056 bytes, SHA-256 `f8158ccc58a49fe100b7ffe37daa3fb07acd78d35f0fa347ff47d40128cfa57d`, [download direto](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.87-54491/PokeSearch-v0.02.87-LT.apk). Solicitação no SHA `f9401e8f695e0bfb9cfb27d874428c574ee2661b`.
- **Teste físico ainda não realizado:** a mudança de fonte de imagens visa reproduzir a exibição dos cards, mas não é prova de que a miniatura já carregou no Samsung; validar P1/P2 e eventuais bloqueios de rede/provedor. O Android ainda exige confirmação da instalação.
