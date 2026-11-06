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
