# LT273 — Auditoria de interface baseada em capturas de Samsung

Data: 06/11/2026 · Branch: `feature/lt273-rank-panel-alignment-league-buttons-20261106` · base comprovada `90d27b1` (LT272).

## Problemas reproduzidos visualmente
1. O seletor de liga do Rank Geral era `<select>` nativo; na sobreposição Android não abria em certos contextos. Controle substituído por três botões com evento delegado `click`, estado ativo e fonte verificada.
2. Os controles `#1 Topo`, `Meu IV/Minha posição`, `Top` e `Todos` quebravam em linhas desalinhadas. Agora usam grid de 3 colunas (P/M/G), label + seleção no último grupo.
3. O rodapé `Copiar, Compartilhar, CSV` repetia ações pouco úteis. A linha visível foi retirada de Rank Classe e Rank Geral; implementação nativa permanece para compatibilidade.
4. Bloco `Fonte e critérios` de Raides e legenda `Fonte PvPoke ...` no cartão de golpes criavam comprimento desnecessário. Exibição removida; fontes continuam identificáveis nos metadados e `title` acessível.
5. `#info` mostrava Golpes capturados/Local **acima** dos painéis abertos. O nó foi movido para depois de `#evolutions`, `#psRankExplorer` (inserido após `#evolutions`) e `#raidPanel`, antes de `#coordRow`.
6. Nome da liga se repetia no título do painel e no conteúdo PvP. Novo cabeçalho único: bandeira LT268 + nome colorido + botão de golpes + fechar, sempre na mesma linha; `.evoLeague` duplicada fica oculta sem perder dados.
7. Marca MT Elite pod ia cair no fim de C2: linhas dos golpes agora usam grid com 3 colunas, símbolo junto ao nome e atributos abaixo.
8. O PNG de evolução LT272 encostava na bandeira. Reduzido a 11×11 (9×9 no layout estreito) e posicionado a 3px do limite inferior e direito. A geometria P/M/G deve confirmar ausência de interseção com bandeiras, e nenhum elemento externo é alterado.

## Fontes, segurança e não regressões
`pvp_rank_explorer.js` mantém cálculos PvP/IV e exportação como API, mas não exibe botões de exportação no pequeno overlay. `detail.html` preserva `psRankContext`, `psRaidReport`, status MT Elite e IDs de golpes. Sem alterações `dock.html`, sprites Pokébola ou Modos. O Rank Geral só mostra posição por tabela versionada; sem números fabricados. A fonte PvE mantém a restrição de apenas um Ágil + um Carregado.

## Estado de publicação
Solicitação de release LT273 `0.02.73`, `versionCode 54477`. **Não afirmar publicação, assinatura ou teste físico antes dos respectivos resultados.**
