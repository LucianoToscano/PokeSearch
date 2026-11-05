# LT238 — Exploradores de Rank Classe e Rank Geral (05/11/2026)

## Escopo
- Toque em **Rank Classe #** na Análise PvP abre a lista local e paginada de **4.096 combinações A/D/S**, com posição, IVs, nível, PC e eficiência IV. Toque no número de uma linha expande Ataque, Defesa e HP.
- Toque em **Rank Geral #** abre a lista de espécies/formas classificadas no snapshot PvPoke da mesma liga (GL, UL ou ML). A lista mostra apenas posições realmente presentes na fonte, sem inventar scores ou moves.
- Suporta espécie atual, evoluções e projeções **Mega** (inclusive Mega X/Y), mantendo cada forma separada. O clique em uma Mega normaliza apenas o identificador para consultar a sua entrada exata no Game Master; não altera a elegibilidade de GBL.
- O rótulo compacto de rank da busca também pode abrir a classificação calculada. As ações originais do botão de ataques Elite/legado não são interceptadas.
- A lista abre **dentro do card de detalhe, que já é reposicionável**, com área de leitura limitada e rolagem própria; não foi criado um segundo overlay nativo/WindowManager. Preserva P1/P2 e não acrescenta menus.
- Fonte local: pvpoke-iv-gamemaster.js e pvpoke-overall-ranks.js, snapshots de 19/10/2026, com nível máximo 50 e sem bônus de melhor amigo. Nenhum pedido adicional a PoGoCoordinates, login, coordenada ou permissão.
- Rankings faltantes ou espécies ambíguas são omitidos, evitando associações falsas de forma/IV.
- Implementação encapsulada em pvp_rank_explorer.js e detail.html, sem alterar o motor de filtros/pesquisa.

## QA
- node app/tests/lt238-clickable-rank-explorers.test.js valida 4096 combinações, Sableye 0/15/12 normal GL rank #14, Mega GL rank #1 (PC 1499/Nv. 30), variantes Mega X/Y, posições gerais da GL, navegação e marcação de controles.
- Executar a suíte Node geral, checar inserção dos scripts no WebView Android e testar o card nas duas Pokébolas sobre a versão anterior.
- Pendente: aceitação física Samsung (tamanho do card, rolagem sem corte, funcionamento dos botões, idioma e acessibilidade).

## Versão e publicação
Este documento descreve o código da branch/PR. **Não comprova APK oficial, assinatura, merge ou distribuição por OTA**. Publicar apenas em uma nova versão monotônica após CI, revisão, assinatura permanente e validação do GitHub Release/latest. A LT237 publicada anteriormente não deve ser sobrescrita nem reutilizada.
