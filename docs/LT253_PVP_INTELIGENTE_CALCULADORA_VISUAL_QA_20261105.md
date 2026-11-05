# PokeSearch LT253 — continuidade, QA e critérios de publicação
Data: 05/11/2026 · idioma: pt-BR
Fonte: https://github.com/LucianoToscano/PokeSearch
Branch QA: `feature/lt253-smart-pvp-responsive-qa-20261105`
PR: https://github.com/LucianoToscano/PokeSearch/pull/231

## Base e escopo preservados

- Base pública **LT252, 0.02.52, versionCode 54456**, release `v0.02.52-54456`; **não modificar a release pública até CI e validação**.
- Manter P1 e P2 com a mesma implementação herdada de `OverlayService`/`SecondaryOverlayService`, preferências próprias e sem VIP exclusivo na P2.
- Sem novo menu flutuante, backend, acesso de credenciais, revelação de coordenadas sem solicitação, permissões Android, mudança nos filtros ou alteração unilateral de favoritos.
- Resultados e ranking são de **fontes diferentes**: IV Classe mede eficiência dos IVs; RG mede desempenho geral da espécie no snapshot PvPoke; Mega é projeção matemática (não implica elegibilidade GBL).

## Implementações na candidata

1. **Comparador inteligente**: `pvp_rank_insights.js` expõe `recommendFamily`, que compara formas por IV Classe, recomenda a melhor entre formas elegíveis usando RG verificado e separa Mega projetada. `pvp_rank_advanced_ui.js` apresenta resultado dentro do explorador já existente.
2. **Cartão adaptativo**: `OverlayService.resizeDetail` remove o teto rígido de 520 dp, limitado à altura da tela com rolagem pelo cartão. `moveDetail` usa geometria nativa `OverlayPlacementPolicy.avoid` contra lista, menu, Pokébola e outro menu (sem alterar posicionamento manual).
3. **Ataques verificados**: `pvp_rank_moves.js` extrai poder/energia somente dos campos numéricos do Game Master fixado e `detail.html` diferencia capturado, recomendado e legado/Elite com origem explicitada; não atribui energia ausente.
4. **Calculadora PvP 2.0**: dois conjuntos editáveis A/B (0–15), comparação PC/PS no mesmo nível, variação de PC, atalhos 500/1500/2500 e restauração do IV capturado. Não altera a captura; fórmula e gamemaster anteriores mantidos.
5. **Alertas Top PvP**: classe Java pura `PvpAlertPriority`; respeita apenas critério GL/UL confirmado e rank de 1 a 50 dentro do limite configurado. Reutiliza canais opt-in e deduplicação por spawn já existentes.
6. **Cache de resultados e coordenadas**: cache temporário de payloads PvP até despawn, vinculado à identidade exata da captura e modo/filtro; reaproveita caches **pré-existentes** `VerifiedEncounterCoordinates` Android e `verifiedRevealCache` do cartão para coordenadas autorizadas. Nenhum código de revelação, conta ou token novo.
7. **Sprites**: ao retornar à WebView, até duas novas tentativas locais/URL original por sprite exata, com intervalo mínimo; mantém fallback neutro para fantasias ou formas não comprovadas.
8. **Janelas**: colisões avaliadas pela política existente; tamanho e posição respeitam limites da tela sem interferir no arraste.
9. **QA visual**: `.github/workflows/lt253-visual-gate.yml` instala Chromium/Playwright pinado, abre o **HTML real do cartão**, usa o gamemaster empacotado, tira capturas P/M/G com calculadora aberta e símbolo Mega, verifica que seletor, slider, inputs A/B, botão 500/1500/2500 e rodapé não ficam inacessíveis. Inclui teste puro Java de 13 casos e Node dos nove itens.

## Matriz de liberação (somente evidência real)

| Verificação | Prova necessária |
|---|---|
| Node QA e LT169 regressão completa | GitHub Actions SUCCESS no mesmo head do PR |
| QA core Java/Android | GitHub Actions SUCCESS e teste `PvpAlertPriorityTest` |
| Android Java e APK beta | Jobs SUCCESS, assinatura beta somente QA |
| OTA e assinatura | Workflow de contrato OTA SUCCESS |
| Capturas P/M/G reais do HTML | Workflow visual SUCCESS com artifact e controles visíveis |
| P1/P2 | Testes de herança/isolamento, mais inspeção física pendente |
| Merge | Só após todas as verificações automatizadas obrigatórias |
| APK público assinado | Fluxo oficial de GitHub Release após merge, `0.02.53/versionCode 54457` **somente se aprovado** |
| Samsung físico | Não é substituído pelas capturas de Chromium nem por CI; registrar como pendente até existir evidência |

## Limites e riscos

- Snapshot de RG muda com PvPoke; não fabricar rank indisponível.
- Dados de poder/energia ausentes não podem ser inferidos por apelidos dos ataques.
- Não presumir que Mega pode participar da Liga GO.
- Se CI falhar, não integrar nem publicar. Testes anteriores devem ser atualizados apenas para refletir comportamento comprovado, sem apagar contratos de segurança.
- Não declarar instalação/atualização automática no aparelho sem confirmação do Android.

## Evidência de entrega

Registro inicial de desenvolvimento no PR #231. Anexar aqui commits, IDs de runs, hash do APK, resultado da release e pendências **somente quando comprovados no GitHub**.
