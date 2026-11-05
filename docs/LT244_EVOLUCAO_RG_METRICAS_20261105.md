# LT244 — Seta de evolução, RG compacto e métricas interativas (05/11/2026)

## Evidência dos prints
- Greavard 1/14/15: na Grande Liga, Houndstone é IV Classe #1 e Rank Geral #653; o resumo compacto LT243 perdeu o glifo ↳ que identifica a evolução.
- Froakie 1/15/15: GL IV #1 de Frogadier deve ser identificado como evolução, não como atributo do próprio Froakie.
- Charmander 15/15/15: GL IV #1 pertence ao próprio Charmander; mostrar "Atual" em vez de seta para evolução inexistente.
- Rank Geral em linhas expandidas já era um explorador clicável, mas faltava acesso a partir da faixa compacta. IV, PC e Nv. tinham espaço pequeno, sem ação.

## Correções e funções
1. **Faixa compacta:** `GL · IV #1 · ↳ Houndstone` quando a classificação é de evolução; `GL · IV #1 · Atual` quando pertence ao próprio Pokémon. Não misturar Classe (combinação entre 4096 IVs da espécie/forma) e Geral (ranking entre espécies).
2. **RG independente:** quando `overallRank` positivo foi realmente calculado no snapshot PvPoke da espécie/forma/mesma liga, acrescentar botão `RG #N` que abre o explorador geral já existente na mesma espécie e posição. Não expor RG inventado nem promover metadados genéricos ou ranking Mega teórico.
3. **IV tocável:** com A/D/S verificados, tocar a caixa de IV abre o explorador local de 4096 spreads da espécie atual (na liga ativa ou GL por padrão), sem consumo da API.
4. **PC e Nível tocáveis:** tocar qualquer um abre um pequeno painel recolhível com PC/Nível do encontro atual e projeções PvP da espécie/evoluções/Megas já calculadas, agrupadas por GL/UL/ML; não confundir com o nível atual ou custos de power-up. Sem novas buscas, revelações de coordenadas ou transmissão de dados.
5. **Legibilidade:** faixa admite quebra de linha; RG é um alvo independente; card P/M/G conserva altura compacta enquanto as métricas estão recolhidas. Ativação por toque/teclado e fechamento ao trocar de Pokémon.

## Testes, distribuição e pendências
- Base oficial LT243 `0.02.43 / 54447`; candidata LT244 `0.02.44 / 54448`, label `51248`.
- Teste novo `app/tests/lt244-compact-iv-rg-interactive-metrics.test.js`; regressões LT163, LT164 atualizadas para restaurar ↳ e separar "Atual".
- Gates: Node, QA core, Java, OTA e APK beta antes de merge e release assinada. Teste físico Samsung das duas Pokébolas e P/M/G continua necessário.
- Em futuras versões, o toque em Nv. pode evoluir para simulador de aprimoramento com custos Poeira/Doces somente se tabelas verificadas forem incorporadas. Não fabricar custos.
- Este registro inicial de branch **não comprova** merge, APK ou publicação.

## Evidências de QA, merge e publicação oficial (05/11/2026)

- **Código na main:** [PR #220](https://github.com/LucianoToscano/PokeSearch/pull/220) mesclada em `dfc05128b25dda60351ef55294aabed23abaa139`. Commit QA pré-merge: `bd78ef672c0b2289d5eaf09f9aa9ca011aacca86`.
- **CI da revisão final:** Node QA #41988454628, regressão completa Node LT169 #41988454737, QA core LT211 #41988454702, Android Java LT62 #41988454771, OTA LT173 #41988454825 e APK beta privado #41988454764: todos `completed/success`. O novo `lt244-compact-iv-rg-interactive-metrics.test.js` confere separação Classe/Geral, glifo ↳, classe do Pokémon atual, ação RG e interações IV/PC/Nv.
- **Solicitação oficial:** `release/official-request.json`, commit `d1b9f21c1f2f2e2d9aee4324dcb251d061b0b96f`, `0.02.44`, `versionCode 54448`, `label 51248`, `previous_tag v0.02.43-54447`.
- **Compilação oficial:** [GitHub Actions #41988808913](https://github.com/LucianoToscano/PokeSearch/actions/runs/41988808913) `completed/success`; `preflight` e `publish` `success`. Etapas `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` todas `success`.
- **Release estável:** [v0.02.44-54448](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.44-54448), publicada em `2026-11-05T07:43:48Z`, `draft=false`, `prerelease=false`, disponibilizada em `releases/latest`.
- **APK:** [PokeSearch-v0.02.44-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.44-54448/PokeSearch-v0.02.44-LT.apk), **28.148.751 bytes**, SHA-256 `c82c473db8879e985d9b95c63b98718b19e141424abf829ee2dcaad59f3830cd`, asset `uploaded`.
- **CI Signed-Verified:** `PokeSearch-v0.02.44-54448-Signed-Verified`, ID `13396224784`, ZIP 25.972.199 bytes, SHA-256 do ZIP `78a05fb747f54e8ff9860e57996aef4ef0779d99b420dc283a8bc46bc7b75cfd` (não confundir com digest do APK).
- **Atualização:** o atualizador interno que consulta `releases/latest` pode detectar a LT244; Android requer confirmação de instalação. **Não existe prova de instalação nem de testes físicos Samsung P1/P2 e P/M/G.** Custos de Poeira/Doces não foram calculados nem exibidos.
