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
