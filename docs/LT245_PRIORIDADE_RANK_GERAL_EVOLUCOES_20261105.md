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
