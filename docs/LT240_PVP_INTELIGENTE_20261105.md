# LT240 — PvP inteligente, comparação, alertas e fontes atualizadas

Data: 05/11/2026. Base de continuidade: LT239 oficial, 0.02.39, code 54443. Candidata LT240: 0.02.40, code 54444, label 51244.

## Implementação
- Pesquisa **IV A/D/S**, **#posição**, **eficiência %** e **nome no Rank Geral**, com posicionamento direto na página, sem alterar a linha do Pokémon selecionado.
- **Normal × Mega × Evoluções** em um painel sob demanda para os IVs exatos da captura, projetando nível/PC/eficiência. Dados ausentes não geram ranking. Mega não significa elegibilidade na Liga GO.
- **Radar TOP PvP** no detalhe, com liga, posição e ressalva para Mega projetada.
- **Notificações TOP PvP 1, 5, 10**, opt-in e independentes nas Pokébolas P1/P2. Nas opções do sino, novos Pokémon devem estar ligados (Som ou Sem som); Android precisa conceder permissão. Só avalia IV confirmado em resultado válido e com prazo de expiração. Rate limit 20 s, deduplicação por spawn/forma/liga até expiração, máximo de 10 candidatos por atualização. Não há busca extra nem novo token.
- **Rank Geral avançado**: pontuação PvPoke, IDs técnicos dos golpes recomendados, 3 confrontos favoráveis e 3 ameaças. IDs técnicos não são apresentados como nomes oficiais em PT-BR; o botão ⚔️ usa a consulta original com verificação de tradução e MT Elite.
- **Atualização verificável de dados**: revisão pinned `e02bde78d19be9b9099b5a6629c6a8d0835a53be` do PvPoke em 03/11/2026, obtida em 05/11/2026. Game Master 1.752 entradas (+ Mega Chandelure). Rank Geral GL 1.154 entradas (arquivo alterado 31/10), UL 851 (21/10), ML 409 (01/10). Cada liga mostra sua data de fonte real, sem afirmar atualização inexistente da ML.
- **Desempenho P/M/G**: CSS responsivo, tabela de 10 linhas, cache máximo de 24 rankings IV, comparação de formas só por toque, cache fraco das linhas do Rank Geral.
- Compatibilidade: detalhe, cards e bridge Android preservam o motor LT239 e funcionam em duas Pokébolas com preferências separadas.

## Arquivos
- pvp_lt240_tools.js (novo), pvp_rank_explorer.js, pvpoke-overall-ranks.js, pvpoke-iv-gamemaster.js, dock.html, detail.html, OverlayService.java, build_ota_pack.py, release_notes.json.
- Teste automatizado: app/tests/lt240-pvp-advanced.test.js; regressões LT235, LT238, LT239 e suíte geral.

## Critérios de publicação
Executar QA Node/Java, compilação Android, QA OTA e beta. Fazer merge somente após sucesso. Solicitar pelo fluxo permanente release/official-request.json com version 0.02.40, code 54444, label 51244, previous_tag v0.02.39-54443, qa_max_code 54443, preservando assinatura v2. Confirmar GitHub releases/latest, status de Actions, APK e digest antes de informar distribuição. **Teste real físico Samsung P1/P2 permanece pendente** até resultado no aparelho.
