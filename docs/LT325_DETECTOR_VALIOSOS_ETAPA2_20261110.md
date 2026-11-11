# PokeSearch LT325 — Detector de Pokémon valiosos (etapa 2)

**Estado:** implementado em branch de QA, PR #327. Não integrado à main e não publicado como APK.

## Objetivo e origem dos dados

As avaliações usam **somente** fatos já validados pelo app e os cálculos PvP existentes em `dock.html`:
- `verifiedSpawnRawIv` e `verifiedSpawnIvPercent`: IV original A/D/S e % internamente consistentes;
- `verifiedSpeciesIvRank`: Rank Classe, calculado para espécie/forma + liga com o PvPoke fixado;
- `verifiedOverallRank`: Rank Geral exato de espécie/forma/liga no snapshot; nunca se confunde com Rank Classe;
- `bestEvolutionRank`: projeção de IV/PC na linha evolutiva somente quando já comprovada pelo catálogo do app;
- `PokeSearchResultEvidence.assess`: confirmação da pesquisa e situação atual, parcial, antiga ou expirada.

O novo `result_value_detector.js` **não recalcula ranks** e não acessa servidor, GPS, cookies, coordenadas, contas ou treinadores. Apenas seleciona uma oportunidade e seu rótulo, sem inferir elegibilidade a partir de Top-N de filtro.

## Regras do destaque, em ordem

1. **◆ IV 100%**: A/D/S **exatamente** 15/15/15 e % 100 validada. Um número de filtro “100%” ou IV somente percentual não é prova.
2. **◆ PvP forte**: Rank IV atual até **#10** e RG da **mesma espécie/forma e liga** até **#100**, obtidos pelos mecanismos antigos; mostra `GL/UL/ML IV #N · RG #M`. Limiares de destaque editorial, não corte oficial de jogabilidade.
3. **◆ IV #1 da classe**: um Rank IV **#1** confirmado, mesmo que o RG não esteja disponível. Informa claramente `RG indisponível`, jamais afirma “melhor Pokémon da liga”.
4. **◇ Evolução promissora (projeção)**: apenas modo de busca GL ou UL e somente quando cálculo existente determinou PC dentro do limite da liga (`eligible===true`), Rank IV projetado até #10 e RG exato até #100. Mostra `Projeção ... (evolução não garantida)`. NÃO confirma item especial, custo, condições, fantasia ou legalidade de evoluir.
5. Sem evidência suficiente, **não mostra marcador nenhum**. Resultados parciais, antigos, expirados, sem IV comprovado e fontes sem validação jamais são destacados.

No máximo **um marcador discreto por sprite**, sem novas linhas, menus ou janelas. Favoritos ★ e IV% permanecem independentes. Acessibilidade e título do card incluem o motivo, além do estado de origem. O toque no sprite mantém o detalhe atual com análises GL/UL/ML e Reides.

### Reides e Shiny

O Rank Reides da janela `detail.html` é específico de espécie/ataques e envolve dados assíncronos. **Não** foi reconsultado nem importado para os 10 resultados, evitando classificações misturadas/duplicadas. A promoção visual de Reides fica para uma fase posterior com evidência local confiável. Shiny continua não afirmando disponibilidade por treinador e não recebe um “valor” inventado.

## Alertas existentes — nenhuma notificação nova

`PvpAlertPriority` conserva a política de Top PvP confirmada. Na escolha do **único aviso geral existente**, o Hundo 15/15/15 com fonte confirmada e IV consistente tem prioridade sobre Pokémon comum. Um Top PvP confirmado mantém prioridade sobre Hundo e Top #1 prevalece sobre Top #5. Permissões Android, opt-in, bloqueios, `lastAlertAt`, fila de Favoritos, cooldown e chaves de deduplicação não mudam. Não há novo canal, som ou regra de envio.

## Performance e riscos de QA

- Recalcular destaques somente quando muda o conjunto/estado da lista; o `listKey` agora inclui `resultsStale` e `searchActive` para retirar sinal “verificado” imediatamente ao começar uma nova pesquisa.
- Rank IV usa cache de espécie/liga já presente no `dock.html`. A evolução só é consultada caso nenhum destaque atual tenha sido encontrado, **e apenas no modo GL/UL**, para limitar trabalho no Android.
- Até 10 resultados por Pokébola. P1 e P2 compartilham as implementações, sem compartilhar estado de sessão/localização/alertas.
- Requer validação visual em Samsung nos três tamanhos P/M/G, além de efeitos da mudança de estado da pesquisa.

## Testes

- `app/tests/lt325-result-value-detector.test.js`: 17 cenários de Rank Classe/RG, Hundo, projeção, ausência de fonte, frescor, P/M/G, form/mega e alertas.
- `app/tests/PvpAlertPriorityTest.java`: 26 cenários totais incluindo novos casos de IV100, Rank Top e prioridade de alerta.
- `app/tests/lt325-result-evidence.test.js`: 17 cenários, atualizados para a acessibilidade do marcador.
- Node QA, Node regressão integral, Android Java, OTA, visual e APK beta privado devem estar **todos verdes no SHA final** antes do merge.

**Não fazer release pública ou merge enquanto QA estiver vermelho.** Não declarar instalação ou teste físico que não tenha ocorrido.
