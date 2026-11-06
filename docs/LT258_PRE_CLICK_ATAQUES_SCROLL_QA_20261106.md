# LT258 — ícones de ataques antes do clique e rolagem única (06/11/2026)

## Evidência do Samsung
Captura do Scorbunny GL IV #1 exibia símbolo **⚡** no quarto controle (ao lado de IV/forma/RG). Ao tocar surgia o catálogo `Sem conjunto PvP recomendado` e `Ver 4 golpes possíveis`, mas o cartão não permitia alcançar o final da lista. O usuário esclareceu: ícones devem indicar **antes do clique** se a recomendação exige legado, sem mudança provocada pelo toque.

## Raiz do defeito
- `detail.html`: `renderRankOneMoves` começava com `⚡` e só consultava PvPoke no clique; após `lookup`, alterava o ícone para `⚔️` se houvesse legado, ou para `⚡` nos demais casos.
- CSS: `#movesPopover:not([hidden])` tinha `max-height:178px` e rolagem interna; a lista dentro de `<details>` tinha outra `max-height:130px` e outra rolagem, enquanto `#panel` também gerenciava a rolagem com `.needsScroll`. O Android podia capturar o gesto no elemento errado.
- A abertura/fechamento nativa de `<details>` não chamava `resizeEvolutionPanel` após o layout mudar.

## Solução na branch `fix/lt258-moves-icons-scroll-20261106`
1. `pvp_rank_moves.js` oferece `getStatus(league,name,mega)`, com consulta pública automática **ao abrir o detalhe** das identificações de golpes recomendados e listas `eliteMoves`/`legacyMoves` do PvPoke/Game Master fixados. Os IDs são verificados antes de oferecer um veredito; não exige traduções PT-BR, token, login ou chamada ao PoGoCoordinates. As requisições e Promises seguem o cache existente do asset.
2. Ícones pré-verificados:
   - **⚔️**: a recomendação PvP possui ao menos um ataque legado ou de MT de Elite.
   - **🗡️**: a recomendação PvP está identificada, sem ataque legado.
   - **⚔︎ cinza**: estado **não verificado**, incluindo Pokémon sem conjunto PvP recomendado, falha de rede ou classificação de golpes desconhecida. Não afirmar ausência de legado com base em lista apenas possível.
   - A resposta assíncrona preenche o ícone antes do clique quando disponível; **o toque não altera o ícone**. Se o usuário tocar durante a verificação, o resultado é guardado para o próximo redesenho, sem mutar o botão já tocado.
3. CSS do painel de golpes e lista possível sem alturas/scrolls internos; o **painel exterior #panel** é a única rolagem do cartão, com `pan-y`. O evento `toggle` de `<details>` solicita novo `Native.resizeDetail`. O título `Ver N golpes possíveis` permanece recolhido inicialmente.
4. Mantidos cartões compactos P/M/G, botões independentes IV / espécie / RG / ataques, glifos das ligas, os dados PvP normais e a Megaedição (sem confundir Mega com ataque carregado), duas Pokébolas independentes, classificação geral, favoritos e coordenadas.

## Verificações feitas
- JavaScript de `detail.html` e `pvp_rank_moves.js`: sintaxe verificada.
- `app/tests/lt258-preverified-swords-scroll.test.js`: executado em harness JavaScript isolado usando fontes simuladas com golpes normais, legados, Mega e espécie sem rank. Resultado **PASS**: `🗡️`/ `⚔️` corretos, neutro para não verificado, sem mudança por clique, gesto centralizado no cartão.
- `app/tests/lt248-move-icon-persistence-compact-fallback.test.js`: executado com mocks de WebView e status antecipado. Resultado **PASS**.
- Contratos antigos de testes que exigiam o raio `⚡` foram adequados à nova regra, incluindo a inspeção visual automatizada P/M/G; **execução integral de CI e captura real Android ainda pendentes**.

## Condição para a atualização oficial
Branch/PR de desenvolvimento ainda não é APK distribuído. Antes de merge/OTA, executar a suíte completa, inspeção visual real com lista de 4 ou mais golpes e rolagem até o fim no Samsung, tanto na P1 quanto na P2, compilar e assinar com certificado permanente, publicar evidências e registrar versão monotônica conforme Arquivo Mestre. Não anunciar envio ao aplicativo antes dessas evidências.
