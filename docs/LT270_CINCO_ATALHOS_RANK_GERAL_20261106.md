# LT270 — Cinco atalhos GL/UL/ML/RG/Ataques no cartão (06/11/2026)

## Motivação e escopo
O usuário forneceu capturas do cartão congestionado e pediu cinco atalhos com os ícones fornecidos: GL, UL, ML, Rank Geral e Ataques, além de seletor de liga no Rank Geral, cabeçalho organizado e marcador quando a avaliação pertence à evolução.

## Alterações fundamentadas
- O cálculo `psRailChoices` lê as três ligas do contexto existente e escolhe **Rank Classe IV por liga**, mantendo o nome verdadeiro da forma. Não converte Rank Geral em rank de IV.
- Rejeita Mega projetada, referências de traje e `eligible=false` como ranking jogável. `↳` marca quando o número da liga pertence a evolução, não ao Pokémon atual; a seta não garante que um traje possa evoluir.
- `psRenderFiveRankRail`: cinco botões equidistantes, os quatro PNGs LT268 e a ação existente de ataques; sem mudar Pokébolas ou menu Modos.
- `pvp_rank_explorer.js`: seletor GL/UL/ML para Rank Geral, mudança de ranking real, nome, posição e cabeçalho contextual. Mesma janela sem abrir painéis simultâneos.
- Mantidos dados PvPoke, cálculo de IV A/B, PC/PS, Raid PvE, Elite/legado por fonte, sprites, integração OTA, assinatura, favoritos, alertas e duas Pokébolas independentes.

## Validação e publicação
Base de partida: LT269 `v0.02.69-54473`, release pública SHA-256 `799d3e52b729be6ce62228bb0d1cd775278dbc344eaec477a1100d7851a24942`. LT270 solicitada `0.02.70` / `54474` somente após Node, QA, Java, visual P/M/G, PvE, OTA e preflight aprovados. A assinatura e a publicação devem ser verificadas separadamente. Não declarar teste físico Samsung ou instalação automática sem prova.

## CI revisão após PR #258
Os gates Node completo e core identificaram somente dois testes históricos (LT231 e LT247) esperando um literal `const hasRank=` sem o prefixo da nova faixa. Os novos contratos exigem explicitamente o regex anterior **e** que a nova faixa seja renderizada apenas quando há um Rank Classe ou Geral real. A lógica de combate, os status de golpes e o fallback antigo foram preservados; verificações não foram removidas.

## Auditoria pós-merge e publicação comprovada (06/11/2026)
- A PR [#258](https://github.com/LucianoToscano/PokeSearch/pull/258) foi mesclada no commit `ba2ab97eff6e7ffbc6e56ed003df07a7be454ce7`, mantendo as duas Pokébolas e o menu Modos sem alterações.
- Gate visual de WebView real P/M/G [#42271364184](https://github.com/LucianoToscano/PokeSearch/actions/runs/42271364184) `success`, incluindo 5 botões lado a lado, marcador ↳, ausência de recorte e seletor RG trocando a liga, o nome da forma e a posição. O visual anterior [#42271091387](https://github.com/LucianoToscano/PokeSearch/actions/runs/42271091387) também passou. A revisão intermediária de duas asserções legadas preservou o mesmo código visual (comparação entre commits prova mudança apenas nos testes LT231/LT247 e auditoria).
- Node completo [#42271364173](https://github.com/LucianoToscano/PokeSearch/actions/runs/42271364173), Node QA [#42271364067](https://github.com/LucianoToscano/PokeSearch/actions/runs/42271364067), QA core [#42271364128](https://github.com/LucianoToscano/PokeSearch/actions/runs/42271364128), Java [#42271364064](https://github.com/LucianoToscano/PokeSearch/actions/runs/42271364064), OTA [#42271364217](https://github.com/LucianoToscano/PokeSearch/actions/runs/42271364217), PvE [#42271364197](https://github.com/LucianoToscano/PokeSearch/actions/runs/42271364197) e APK privada [#42271364137](https://github.com/LucianoToscano/PokeSearch/actions/runs/42271364137) `success`.
- Workflow oficial [#42272288403](https://github.com/LucianoToscano/PokeSearch/actions/runs/42272288403) `preflight=success`, `publish=success`; QA assinada pós-merge [#42272288415](https://github.com/LucianoToscano/PokeSearch/actions/runs/42272288415) `signed-dual-parity=success`. A API GitHub confirmou `v0.02.70-54474`, `draft=false`, `prerelease=false`, APK `PokeSearch-v0.02.70-LT.apk`, tamanho **33.606.774 bytes**, digest **`3e883e605061a82e87418952978babf87418b1e5a8355016dfee6f4afa366bab`**, publicada `2026-11-06T18:40:49Z`.
- A inspeção física Samsung, instalação, uso real do atualizador e sincronização da APK com o Drive não foram executados nesta auditoria.
