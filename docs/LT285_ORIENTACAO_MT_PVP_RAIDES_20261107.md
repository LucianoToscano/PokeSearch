# PokeSearch LT285 — Assistente de MT para PvP e Raides
Data: 07/11/2026. Estado inicial: PR de QA, não equivale a APK publicado.

## Referência e fontes
- Base oficial LT284 `v0.02.84-54488`. Solicitação do usuário: continuar as melhorias aprovadas, etapa de golpes/MT/legado no roadmap [#277](https://github.com/LucianoToscano/PokeSearch/issues/277).
- `pvp_rank_moves.js`: PvPoke/pvpoke commit `e02bde78d19be9b9099b5a6629c6a8d0835a53be` (ranking e Game Master) + WatWowMap GO pt-BR commit `31a3bcdc2e412f315c4be2bb593807f45cb9bd9b`. Ranking recomenda conjunto PvP por liga; Game Master contém listas `fastMoves/chargedMoves/eliteMoves/legacyMoves`. São snapshots, não o inventário de MT atual do Pokémon GO.
- `pve_raid_rank.js`: S-Tier-Devs/pogo-db-api referência agosto de 2026. Ranking é por tipo de ataque e **espécie**; sinal `isElite` na linha da combinação **não identifica individualmente** qual ataque exige Elite. Não deriva guia de melhor contra chefe atual.

## Etapa LT285
1. `pvp_rank_moves.js` expõe `tmPlan` como função determinística e somente leitura. Aceita apenas conjunto **recomendado** e com IDs de movimentos verificáveis. Se houver `availableOnly`, `recommended=false` ou IDs inválidos, retorna `null` — nunca transforma catálogo de golpes possíveis em recomendação.
2. Para Ágil, C1 e C2, classifica `normal` (consta na lista comum do Game Master; MT é aleatória), `elite` (Elite marcada nessa fonte), `legacy` (legado, mas a elegibilidade via Elite **não está confirmada**) e `unknown` (informação insuficiente). O status segue a origem; nomenclatura PT-BR somente quando verificada por ID GO. Nenhuma suposição de TM Elite em golpes legados.
3. `detail.html`: na janela já existente **Golpes PvP recomendados**, acrescenta `<details>` opcional **MT: ...**, com orientações por golpe. Fecha por padrão, sem chips, sem fundos coloridos, sem segunda janela, e fecha com os demais painéis. Não altera as cores verificadas dos 18 tipos nem os ícones ⚔️/🗡️/⚔︎ pré-verificados, inclusive cinza desconhecido.
4. Em **Raides**, ajuda opcional explica como ler o selo Elite da fonte PvE: o conjunto pode estar marcado, mas a fonte não identifica qual golpe, e ausência de selo não comprova MT comum. Sem afirmar chefe específico, golpe de PvP ou disponibilidade da MT.
5. A integração não introduz API, credenciais, GPS, requests para PoGoCoordinates, status de eventos em tempo real nem mudanças Java. Sem alterar busca, filtros, IV, favoritos, sprites, OTA ou duas Pokébolas independentes.

## Critérios de QA
- `node app/tests/lt285-tm-guidance-verified-only.test.js` — Greninja com Hidro Canhão Elite, Surfar comum, legado sem prova de Elite, golpe desconhecido cinza e pool de golpes apenas possíveis sem recomendação; fonte PT-BR exata, nenhuma inferência e paleta de golpes intacta. Teste técnico não garante disponibilidade real de Hidro Canhão com MT hoje.
- Regressões obrigatórias: LT258, LT254, LT265, LT280, LT282, LT283, LT284, Node geral, Android Java, OTA e screenshot P/M/G, no SHA de head. Beta privado não é release oficial.
- **Samsung físico pendente**: P1 e P2 separadamente, Sableye, Greninja, Mega Sableye, Burmy Sandy/Trash, painel MT expandido, rolagem inteira e fechamento automático ao alternar para PvP/Raides; simular falha da fonte sem mudar badge cinza.
- Após CI, PR merge e workflow permanente `release/official-request.json` com assinatura/HASH/asset; documentar e nunca afirmar publicação antes da verificação.

## Próximas etapas
Ainda faltam recomendações de golpes adaptadas ao chefe específico, atualização oficial em tempo real de eventos/MT, custo de fortalecimento verificável, presets, modo Eventos, API/429 e OTA; acompanhar [#277](https://github.com/LucianoToscano/PokeSearch/issues/277).
