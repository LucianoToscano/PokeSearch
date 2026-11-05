# LT245 — Prioridade para Rank Geral e evoluções alternativas (05/11/2026)

## Pedido e evidência
O screenshot Litwick `0/15/14` demonstrou duas evoluções com GL IV #1: Chandelure `RG #808` e Lampent `RG #519`. A LT244 escolhia a primeira evolução pelo Rank Classe, desconsiderando a classificação de espécie que era melhor no Lampent. O usuário confirmou a prioridade por RG, com IV e RG clicáveis e indicação `+N` para outras evoluções.

## Comportamento implementado
1. **Rank Geral primeiro, mas apenas após IV competitivo:** selecionar candidatos reais, confirmados e elegíveis, com IV Classe Top 50 ou dentro do filtro Top N (1–50) solicitado pelo usuário. Entre eles, se houver um `overallRank` confiável, destacar o **menor RG**. Não promover IV #4096 só por RG alto no meta. Quando nenhum candidato competitivo tiver RG, preservar a seleção por melhor IV Classe.
2. **Litwick exemplo:** `🔵 GL · ↳ Lampent · RG #519 · IV #1 · +1`; o `+1` mostra `↳ Chandelure · RG #808 · IV #1`. Os números clicáveis abrem, respectivamente, os exploradores de Rank Geral e de 4.096 combinações de IVs, na mesma liga e forma. A faixa recolhida mantém espaço mínimo.
3. **Alternativas somente sob demanda:** painel curto, com rolagem e acessibilidade, recolhido por padrão, atualizado quando troca Pokémon ou análise e sem chamadas à PoGoCoordinates. Rejeita espécies não elegíveis e referências teóricas para escolher o RG principal; não inventa RG de Mega. Exibe até 24 opções matematicamente verificadas.
4. **Análise expandida e destaques TOP:** as evoluções com IV Top 50 e RG real são ordenadas do menor RG para o maior; as referências/mega permanecem separadas e rotuladas. Sem RG, mantém desempate por Rank Classe.
5. **Segurança:** manter opção `↳` de evolução, `Atual` para o próprio Pokémon; não confundir Rank Classe com Rank Geral; manter busca Top N rigorosa (ex.: busca IV Top 1 nunca promove uma forma IV #2); não alterar filtros, favoritos, contas, assinatura, sprite ou sistema de coordenadas.
6. **Desempenho/UX:** mesmo componente HTML/JS usado pelas Pokébolas P1/P2; CSS compacto e adaptativo P/M/G. `+N` e painel só são construídos a partir de dados PvP já calculados, sem backend novo.

## Testes e publicação
- Base LT244 `0.02.44 / 54448`; candidata LT245 `0.02.45 / 54449 / label 51249`.
- Teste novo `app/tests/lt245-general-rank-priority-alternates.test.js` verifica seleção pelo RG, ausência de RG, limite IV Top N, exclusão de referências Mega/teóricas, botões IV/RG independentes, +N, contraexemplo IV ruim com RG ótimo e P1/P2 compartilhado.
- Regressões anteriores LT244 e LT243 preservam que o IV é clicável e a seta ↳ e nome completo são visíveis.
- Necessário CI Node/Java/OTA/beta verde, merge, release oficial assinada, hash público e registro no Arquivo Mestre. Teste manual no Samsung (tamanhos P/M/G, overlays P1/P2) ainda pendente.
- Os dados de ranking geral offline são snapshots locais; não afirmar classificação mundial instantânea nem atualização integral sem verificar a fonte.

**Status desta seção:** em desenvolvimento; adicionar evidências reais depois de CI, merge e publicação.

## Evidências oficiais de integração e publicação — 05/11/2026

- **PR #221:** [LT245 RG prioritário](https://github.com/LucianoToscano/PokeSearch/pull/221) mesclada na `main`, SHA `450f7bea20a9b912e43e22e74d7a5ebcf4821044`. Último commit do branch validado: `dd86850b3f2a0436195c663d0ac900f4c4399d9f`.
- **QA da revisão:** `PokeSearch Node QA` #41992018110, `LT169 regressão completa` #41992017973, `QA core LT211` #41992017910, `LT62 Android Java compile` #41992018417, `LT173 OTA assinado` #41992017946 e `Secure beta APK private test` #41992017995 terminaram `completed/success`. Novo teste `lt245-general-rank-priority-alternates.test.js` cobre os casos Litwick/Lampent/Chandelure, RG ausente, IV fraco/RG forte, Top N, referências Mega e alternativos clicáveis.
- **Pedido assinado oficial:** `release/official-request.json`, commit `eccac19a06816acc7e74c6437cf8815fb2b3132e`, `version 0.02.45`, `versionCode 54449`, `label 51249`, `previous_tag v0.02.44-54448`.
- **GitHub Actions permanente:** [workflow #41992371701](https://github.com/LucianoToscano/PokeSearch/actions/runs/41992371701), `completed/success`. Jobs `preflight` e `publish` aprovados; etapas `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` todas `success`.
- **Release estável pública:** [v0.02.45-54449](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.45-54449), publicada em `2026-11-05T08:13:26Z`, `draft=false`, `prerelease=false`, source commit `eccac19a06816acc7e74c6437cf8815fb2b3132e`. Versão verificada como `releases/latest`.
- **APK:** [PokeSearch-v0.02.45-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.45-54449/PokeSearch-v0.02.45-LT.apk), **28.151.231 bytes**, SHA-256 `179624b08b0bb867c09f4fbfa9e7b3260387364f6710c9e27bfa8b2db9ccbdf7`, asset `uploaded`. A verificação pública foi concluída no workflow.
- **Artefato CI:** `PokeSearch-v0.02.45-54449-Signed-Verified`, ID `13397994032`, ZIP **25.974.038 bytes**, SHA-256 `3a004bb58b38d5f0cb20b49c65550c73e9530929e90701bc566372f9053c6afc`. Digest do ZIP difere do digest do APK publicado.
- **Canal de atualização:** o aplicativo LT237+ consulta `releases/latest`, portanto pode detectar e baixar a LT245; o Android exige confirmação humana para instalação. **Sem evidência de instalação física no Samsung ou testes manuais P1/P2/P/M/G.**
- **Limite dos dados:** a priorização RG usa ranking offline já instalado, não uma medição ao vivo; não afirmar atualização integral do snapshot PvPoke. Fórmulas IV/CP e notificações mantidas.

A seção de desenvolvimento acima é histórica e está superada por estas evidências de release concluída.
