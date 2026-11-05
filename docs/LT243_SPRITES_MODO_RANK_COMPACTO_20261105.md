# LT243 — Sprites, menus e rank PvP compacto (05/11/2026)

## Evidências do usuário
- Screenshots Samsung com sprites faltantes na coluna vertical, representados por losango genérico.
- Ao abrir Modos, duas barras horizontais de comandos de Pokébolas distintas aparecem simultaneamente.
- Ranking compacto mostra `GL · Rank Classe: #1 · ↳ Gast...` e oculta o nome completo; textos de projeção aparecem em popovers extensos.

## Correções implementadas
1. **Card PvP:** exibir `GL · IV #1 · Gastrodon` (ou UL), mantendo informação da classe e o nome completo da evolução. Não alterar a classificação. Permitir quebra de linha e impedir `ellipsis` no rótulo de classificação. A ação de toque para abrir as combinações de IVs, os ícones de liga e o botão de golpes seguem ativos.
2. **Popovers de projeção:** esconder botões e painel explicativo extensos do card compacto; rótulo Mega e as classificações continuam distinguindo forma teórica de espécie real. O código explicativo é preservado internamente para não alterar fontes ou regras PvP.
3. **Modo e barra duplicada:** serviços das duas Pokébolas continuam independentes em resultados/filtros, mas abrir o menu de uma fecha apenas a barra/popup da outra; sem limpar configurações. Um proprietário estático por instância (P1/P2) é liberado no onDestroy.
4. **Sprites:** nas linhas sem imagem exata, reprocurar os bytes nativos verificados em passagens limitadas (1,8s/4,8s/14,5s), com um único listener por imagem. Sem novas buscas na PoGoCoordinates, sem imagens inventadas ou trocas de espécie, forma, fantasia ou shiny. Se a fonte realmente não tiver uma variante verificada, exibir o número do Pokémon no lugar do losango, não fingir que existe sprite.
5. **QA:** `app/tests/lt243-compact-ranks-single-menu-sprite-retry.test.js` + testes legados LT148/LT163/LT164/LT231 atualizados para a nomenclatura visível. Node QA/Java/OTA/beta são gates de publicação; validação física Samsung P1/P2 segue pendente.

## Versão e publicação
- Partida oficial LT242 · 0.02.42 · 54446; candidata LT243 · 0.02.43 · 54447 / label 51247.
- Publicar somente após QA e merge usando workflow oficial permanente `release/official-request.json`, validar assinatura e SHA-256 do APK.
- Status inicial: trabalho em branch; **sem alegar merge/publicação até comprovado**.
