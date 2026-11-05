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

## Evidências oficiais de testes, merge e distribuição (05/11/2026)

- **Implementação e merge:** [PR #219](https://github.com/LucianoToscano/PokeSearch/pull/219) mesclada na main, commit `9bee1074a6acd359ed4e4bee6186f3428a0c27f3`. SHA final de testes pré-merge: `e990d11149a6817e93ef9ba63acc87364dfd6b14`.
- **QA da branch:** Node QA #41985142288, regressão completa LT169 #41985142217, QA core LT211 #41985142248, Java Android LT62 #41985142222, OTA LT173 #41985142272 e APK beta privado #41985142245 concluíram `success`. O teste `lt243-compact-ranks-single-menu-sprite-retry.test.js` e asserções legadas de Rank Classe foram executados no commit final.
- **Pedido de release:** `release/official-request.json` alterado no commit `86342c52bc8acd95800aa1f265993f749d2fe1ae` com `version=0.02.43`, `versionCode=54447`, `label=51247`, `previous_tag=v0.02.42-54446`, `qa_max_code=54446`.
- **Workflow permanente oficial:** [Actions #41985537198](https://github.com/LucianoToscano/PokeSearch/actions/runs/41985537198), `completed/success`, com `preflight` e `publish` concluídos. `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` todos `success`.
- **Release estável em releases/latest:** [v0.02.43-54447](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.43-54447), publicada em `2026-11-05T07:14:38Z`, `draft=false`, `prerelease=false`, source commit `86342c52bc8acd95800aa1f265993f749d2fe1ae`.
- **APK publicado:** [PokeSearch-v0.02.43-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.43-54447/PokeSearch-v0.02.43-LT.apk), **28.146.551 bytes**, SHA-256 `69fc942def5efec1d7cab134a99b961b74f64ba1894c3ca07aaeb27cf8ea98a6`, asset `uploaded`.
- **Artefato assinado de CI:** `PokeSearch-v0.02.43-54447-Signed-Verified`, ID `13395509155`, ZIP 25.969.916 bytes, SHA-256 `70739fb23a8c38b622c062ccbfca893b62a5496283f5105adfcd85f262411a5a` (diferente do SHA do APK).
- **Distribuição:** disponível no canal GitHub Releases/latest, consultado pelo atualizador do PokeSearch. A instalação física no Samsung ainda precisa de confirmação Android; não há prova de QA visual P/M/G e P1/P2 instalado. Sprites ainda sem variante oficial verificada exibem o número Dex, não se promete cobertura de 100%.
