# LT247 — IV antes de RG, status dos golpes e simulador PC/Nível (05/11/2026)

## Motivação e evidências Samsung
- Rookidee: o botão ⚔️ estava pulando para uma segunda linha vazia, afastado do Rank Classe e do RG.
- Litwick/Shuppet: prefere `[🔵 GL IV #1][↳ evolução][RG #N] ⚔️`, preservando o **melhor RG como critério de seleção** da LT245, mas **IV antes de RG na apresentação**.
- Sableye 0/15/12: Mega Sableye GL IV #1 aparece na análise expandida, mas o resumo fica ausente em outros modos de busca e o botão de golpes some.
- Exemplo externo Gastly/Haunter/Gengar: simular PC, PS, nível e evoluções com controle compacto; não inventar valores de custos de aprimoramento.

## Implementações
1. **Faixa única sem quebra**: um chip de liga, IV #N clicável, nome da espécie/evolução com ↳ (ou Atual), RG #N clicável quando houver posição real da forma, +N para alternativas e golpes. Todos os controles num único `flex-wrap:nowrap`; somente o nome é redimensionável em largura estreita, com título acessível completo. P/M/G compartilham o CSS e o mesmo WebView das duas Pokébolas.
2. **Rank Geral versus IV**: a regra de prioridade por menor RG da LT245 permanece na seleção entre formas reais com IV competitivo, mas a apresentação visual exibe IV primeiro. RG não é inventado quando não existe.
3. **Mega**: um IV #1 Mega projetado pode ser exibido na barra GL (ou UL) quando a busca não é PvP e o snapshot fornece a projeção. O chip `MEGA` e tooltip explicam projeção matemática, sem afirmar participação permitida na GBL nem RG real da Mega. Em busca Top 1, Mega IV #1 pode ser destacada se nenhuma forma real for Top 1.
4. **Golpes**: ⚔️ permanece neutro até consulta autorizada; após consultar os golpes recomendados PvPoke, ⚔️ identifica conjunto com ao menos um legado/Elite confirmado, 🗡 identifica conjunto recomendado sem legado confirmado. Se as informações não forem verificáveis, não declarar que a combinação é livre de legados. Ataques reais capturados são fallback, explicitamente distintos de recomendação. Em Mega, consultar a espécie-base e declarar que não é uma recomendação para Mega na GBL. Nenhuma consulta de golpes ocorre automaticamente.
5. **Simulador CP/Nível**: tocar em PC ou Nv. expande uma seção com formas reais presentes no Game Master offline `pvpoke-iv-gamemaster.js`, dados-base ATK/DEF/STA e CPM indexado de nível 1 até 50 em passos de 0,5. Fórmula Pokémon GO: `floor((A+IVa)*sqrt(D+IVd)*sqrt(S+IVs)*CPM²/10)`, mínimo PC 10; PS = `floor((S+IVs)*CPM)`, mínimo PS 10. Resultados para IV atual, 0/0/0, 15/15/15; nível máximo dentro de PC 1500/2500. Dados não incluem nível 51 por companheiro, condições de Mega no PvP, nem custos de Poeira/Doces. Sem rede e sem consultas à PoGoCoordinates.
6. **Estados/fallbacks**: os controles só aparecem após toque; a seleção de formas é limitada e baseada em IDs exatos do Game Master. O simulador começa no nível capturado se comprovado. Nenhum cálculo é exibido com IV A/D/S ausente ou inválido.

## QA e publicação
- Base oficial LT246 `0.02.46 / versionCode 54450`; próxima candidata LT247 `0.02.47 / versionCode 54451 / label 51251`.
- Teste novo `app/tests/lt247-compact-iv-first-move-status-cp-simulator.test.js`, mais regressões LT231/LT235/LT243/LT244/LT245/LT164 ajustadas. CI exige Node, QA core, Android Java, OTA e beta assinado antes do merge.
- A publicação permanente deve ser solicitada por `release/official-request.json` somente após aprovação CI e merge. Confirmar artefato APK, assinatura e hash SHA-256 e registrar no Arquivo Mestre.
- A verificação visual física no Samsung/P1/P2 ainda precisa ocorrer após instalar; testes automatizados não substituem essa etapa.
- **Este registro inicial não afirma release publicada.**
