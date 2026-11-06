# LT274 — Seleção de liga dentro do Rank Classe (pré-release)

Data: 06/11/2026

## Lacuna reproduzida na base LT273
No `pvp_rank_explorer.js`, `leagueChooser` era renderizado apenas quando `s.kind==="overall"`. O usuário solicitou anteriormente escolher GL, UL e ML também no Rank Classe, após clicar em IV.

## Implementação
- Os mesmos botões WebView de escolha de liga que já funcionam em Rank Geral ficam disponíveis no Rank Classe.
- `switchClassLeague` conserva o nome exato da espécie/forma, os IVs capturados e as fontes versionadas; recalcula 4.096 linhas por `getIvRows(gm,name,league)` e atualiza página/posição/PC/Nv/eficiência, sem atribuir Rank Geral a IV.
- Ligas sem dados de IV verificados são desativadas. Projeções de evolução/Mega passam a ser derivadas do contexto da liga selecionada, preservando o comparador.
- Proteções: não alterar os atalhos [Raides][GL][UL][ML][RG], ataques dentro de cada liga, ícones de evolução, fundos, OTA, Modos ou P1/P2.

## Provas exigidas
- Teste `lt274-class-league-selection.test.js` cobre GL→UL→ML, dados de IV e CP, rejeição de troca de tipo errada e Rank Geral intacto.
- Gate Chromium P/M/G abre janela Classe, toca em UL e valida marcador, IV, título e alinhamento dos três botões.
- Node completo, Java, PvE, OTA, QA assinada e publicação oficial. Testes físicos Samsung e Drive não podem ser presumidos.

## Lançamento condicionado
Proposto LT274 · `0.02.74` · versionCode `54478`. Rollback LT273 `v0.02.73-54477`. Não marcar como publicado antes de comprovação independente.
