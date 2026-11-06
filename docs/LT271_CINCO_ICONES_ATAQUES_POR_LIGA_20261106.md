# LT271 — Cinco ícones; golpes recomendados por liga (06/11/2026)

## Requisito do usuário e erro da LT270
O atalho `⚔︎` não pertence à faixa inicial porque Grande Liga, Ultra Liga e Liga Mestra possuem conjuntos de ataques recomendados diferentes no snapshot PvPoke. A versão anterior exibia `GL/UL/ML/Rank Geral/Ataques` e duas faixas adicionais expansíveis, `Raides` e `Análise PvP`, consumindo altura desnecessária.

## Implementação
- Faixa **somente com cinco entradas** na ordem **Raides, GL, UL, ML, RG**; valor `#rank` acima do PNG; `—` caso não verificado; `↳` identifica rank de evolução/projeção sem garantir elegibilidade.
- Ícones reaproveitados, todos oficiais LT268, inclusive `ps-raid-lt268.png`. **Nenhum arquivo em `dock.html`, `result-icons/modes` ou recursos de Pokébolas** foi modificado.
- `#raidRow` continua existindo como controle interno e `renderRaidPreview` conserva a fonte/critério PvE; o card permanente é escondido, enquanto o ícone Raides chama `toggleRaidDetails`, mostrando o painel apenas sob demanda.
- GL/UL/ML chamam `psToggleLeagueAssessment(league)`, exibindo somente o bloco correspondente em `#evoBody`; o toque repetido retrai o painel. As outras avaliações, calculadora, Raides e explorador RG não ficam sobrepostos.
- Botão `psMovesAction` é criado em `#psLeagueMoves`, dentro de `#evolutions`, apenas quando uma liga está selecionada. Mantém o mesmo tamanho/arte oficial, fonte PvPoke versionada, conferência de MT Elite/legado, status cinza quando não verificado, consulta por espécie realmente selecionada e liga corrente. O popover não fica no card inicial.
- Rank Geral continua independente. `pvp_rank_explorer.js` passa a oferecer seletor GL/UL/ML a partir de **qualquer** entrada e verifica tabela da liga antes de alterar o badge e o estado, sem declarar posição não confirmada.
- O rank de Raides é assíncrono, atualizado somente quando `psRaidReport.verified`; nunca preencher posição por adivinhação.
- Contratos Node/visual P/M/G adaptados para a nova faixa, sem suprimir validação de ranking por IV, Mega teórica, ataque de origem nem assinatura.

## Preservações
Dois overlays independentes, favoritos, alertas, filtros, rota/localização, sprites originais e variantes, Pesquisa PvP, metas por espécie/IV, Rank Classe, Rank Geral, calculadora A/B com PC/PS, Raides e fontes verificadas, atualização OTA, assinatura permanente e rollback LT270.

## Estado
LT270 `v0.02.70-54474` permanece a última APK pública comprovada até o CI, merge e publicação da LT271 `0.02.71`/`54475`. Testes físicos Samsung, instalação efetiva e Drive APK ainda **não comprovados**. Não alegar lançamento antes de confirmação de GitHub Releases + digest SHA-256.
