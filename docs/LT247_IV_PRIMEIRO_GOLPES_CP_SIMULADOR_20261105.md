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

## Evidências oficiais da LT247 — 05/11/2026

- **Correção integrada:** [PR #223](https://github.com/LucianoToscano/PokeSearch/pull/223), merge na `main` com SHA `94f408d4cc57024a00156aa8b94781d26d4a453b`. Último commit da revisão testada `e52896cb8101d62ae439b5b6ba374b9b213e00d5`.
- **Testes verdes da revisão:** Node QA [#42003579014](https://github.com/LucianoToscano/PokeSearch/actions/runs/42003579014), regressão Node LT169 [#42003578980](https://github.com/LucianoToscano/PokeSearch/actions/runs/42003578980), QA core LT211 [#42003578977](https://github.com/LucianoToscano/PokeSearch/actions/runs/42003578977), compilação Java LT62 [#42003578990](https://github.com/LucianoToscano/PokeSearch/actions/runs/42003578990), OTA LT173 [#42003578851](https://github.com/LucianoToscano/PokeSearch/actions/runs/42003578851) e APK beta privado [#42003578830](https://github.com/LucianoToscano/PokeSearch/actions/runs/42003578830): `completed/success`.
- **Teste novo:** `app/tests/lt247-compact-iv-first-move-status-cp-simulator.test.js` confere ordem IV → evolução → RG, ausência de quebra no CSS, seleção de Mega Sableye #1 como projeção sem RG fictício, ícones ⚔️/🗡 condicionados à verificação de status e fórmula de PC/PS com Game Master. Verifica também catálogo de Mega Charizard X e Y e teto GL.
- **Solicitação oficial:** `release/official-request.json` no SHA `ec53d939964cc68ec35f1b17669883b94f427af5`, `version 0.02.47`, `versionCode 54451`, `label 51251`, `previous_tag v0.02.46-54450`.
- **Workflow oficial permanente:** [Actions #42004046633](https://github.com/LucianoToscano/PokeSearch/actions/runs/42004046633) `completed/success`; `preflight` e `publish` `success`, inclusive `Build signed protected release`, `Validate APK and signer`, `Release to all app users`, `Verify public release and hash`.
- **Release estável em `releases/latest`:** [v0.02.47-54451](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.47-54451), publicada em `2026-11-05T09:42:57Z`, `draft=false`, `prerelease=false`.
- **APK oficial assinado:** [PokeSearch-v0.02.47-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.47-54451/PokeSearch-v0.02.47-LT.apk), **28.366.621 bytes**, SHA-256 `593a2dbfcd6b70049e06d7b5e7ee7d0cf0cfd5417c7f139c62a26eab1e3921a9`, asset `uploaded`.
- **Artefato de CI:** `PokeSearch-v0.02.47-54451-Signed-Verified`, ID `13403343382`, **26.181.295 bytes**, SHA-256 do ZIP `b96c0d4538b266776b61e4d72c308341f24f6f95ec573f0878a5ef15aaf58ca3`. O hash do ZIP NÃO substitui o hash do APK publicado.
- **Atualização pelo app:** disponível no canal `releases/latest`, que o atualizador do PokeSearch consulta. A instalação depende da confirmação do Android. **Não há comprovante de instalação nem QA visual físico Samsung nas duas Pokébolas em P/M/G.** Custos de Doces/Poeira não foram implementados, por falta de fonte de custos validada.

A seção inicial de desenvolvimento é histórica; o estado oficial atual é publicado e assinado, com a ressalva de validação física.
