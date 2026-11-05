# LT240 — Busca e classificação PvP inteligente, data refresh e alertas (05/11/2026)

## Fonte preservada
- Versão pública anterior: LT239 0.02.39, versionCode 54443, SHA do APK oficial registrado no Guia Mestre.
- Repositório: LucianoToscano/PokeSearch. P1 e P2 usam o mesmo OverlayService/dock/detail/explorer, mas prefs e encontros independentes.
- Jamais reverter a LT239 nem modificar autorização, filtros de API, coordenadas, identidade de jogador ou chaves protegidas.

## Funcionalidades implementadas
1. Pesquisa direta dentro do explorador: "0/15/14", "#125", "99,5%" (eficiência IV mínima) e nome/forma em Rank Geral. Busca local e paginação; botão Meu IV retorna ao IV original.
2. Comparação Normal/Mega/Evoluções: usa APENAS os itens com rank IV calculado e os mesmos IVs no Game Master. Desconsidera formas ambíguas e divergências de classe. As formas Mega são explicitamente projeções; rank não determina elegibilidade na Liga GO nem possibilidade de evolução.
3. Rank Geral avançado: score, Lead/Closer/Switch/Charger por GL/UL/ML (se presente) usando dados oficiais públicos do PvPoke; golpes/MT Elite sob demanda do módulo de fontes verificadas já existente. Sem supor PT-BR ou Elite se não houver fonte.
4. Alertas TOP PvP: opções OFF, #1, #5, #10 no menu de notificações de cada Pokébola. Requer permissão Android, alertas Novos ativos, consulta GL ou UL confirmada, rank exato de spawn, critérios nativos válidos e Pokémon não expirado. Mesma cadência de 60 segundos e deduplicação do alerta geral. Não aplica a Mega hipotética nem ao Rank Geral das espécies.
5. Dados PvP: Game Master atualizado (1.752 entradas), listas gerais GL/UL/ML e rankings Leads, Closers, Switches e Chargers retirados da revisão pública identificada do PvPoke `e02bde78d19be9b9099b5a6629c6a8d0835a53be` (commit de 03/11/2026, consultado em 05/11). Fontes locais versionadas, verificáveis; MIT do projeto preservado. Nenhuma atualização de ranking remota sem build/revisão assinado.
6. Experiência P/M/G: CSS responsivo à largura do WebView, cabeçalhos, texto e controles compactos, memória de comparação de formas por sessão para evitar cálculo repetido; histórico de filtros e exportação LT239 preservados.
7. CI: testes Node LT240, teste de política puro Java, compilação Java Android, regressão P1/P2, Node geral, OTA e build protegido oficial.

## Arquivos
- app/src/main/assets/pvp_rank_explorer.js; app/src/main/assets/detail.html; app/src/main/assets/dock.html.
- app/src/main/assets/pvpoke-iv-gamemaster.js; app/src/main/assets/pvpoke-overall-ranks.js; app/src/main/assets/pvpoke-advanced-gl.js, -ul.js, -ml.js.
- app/src/main/java/com/lucianotoscano/pokesearchoverlay/TopPvpAlertPolicy.java; OverlayService.java; OtaAssets.java.
- scripts/build_ota_pack.py; app/tests/lt240-pvp-smart-data-alerts.test.js; app/tests/TopPvpAlertPolicyTest.java; workflows Node QA e oficial; release_notes.json.

## Riscos e política
- Snapshot público: classificação referente à revisão indicada, não à simulação ao vivo de temporada. Score por espécie distinto do Rank Classe dos IVs.
- Recomendações de golpes em PT-BR continuam sujeitas à consulta sob demanda do PvPoke/índice de nomes; se indisponível, mostram status indisponível.
- Alertas Top aceitam apenas rank GL/UL do encontro confirmado; não infere automaticamente ranks de IV para outras ligas/Megas nem gera alertas de Pokémon nunca encontrados.
- Filtro e ranking são locais e não produzem novas buscas de PoGoCoordinates. A segunda Pokébola mantém seus estados próprios.
- A instalação física, compartilhamento e permissões Android devem ser verificados no Samsung. Compilar/publicar no GitHub não prova instalação remota.

## Critérios de publicação
- Aprovar todos os testes automatizados e correções de regressão na PR.
- Fazer merge com SHA informado. Somente depois solicitar a versão LT240 0.02.40 / versionCode 54444 / label 51244 no fluxo permanente de publicação.
- Conferir o GitHub Actions oficial `official-updates` completo (build, assinatura v2 original, hashes, GitHub Release/latest), e registrar as evidências aqui e no Guia Mestre. Não inventar publicação.
