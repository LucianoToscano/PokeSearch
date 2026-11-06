# Correção de empates reais de IV — Ursaluna GL (06/11/2026)

## Ocorrência
No PokeSearch, o explorador de Rank Classe mostra Ursaluna da Grande Liga 0/14/14 como posição ordinal #1 e 0/14/15 como ordinal #2. Ambos são nível 14,5, PC 1497/1500, eficiência formatada 100,00%. O usuário solicitou indicar o empate real como #1, sem confundir a classificação geral (RG) da espécie.

## Evidência técnica do snapshot integrado
- Fonte: `app/src/main/assets/pvpoke-iv-gamemaster.js`, consultada pelo mesmo `pvp_rank_explorer.js`.
- 0/14/14: rank ordinal 1, ATK 123.61452693739005, DEF 99.19684260407844, HP efetivo 148, produto 1814801.2742835125, nível 14,5, PC 1497.
- 0/14/15: rank ordinal 2, ATK 123.61452693739005, DEF 99.19684260407844, HP efetivo 148, produto 1814801.2742835125, nível 14,5, PC 1500.
- A igualdade é do produto **sem arredondar**, não da porcentagem exibida. Dois valores 100,00% arredondados não bastam para declarar empate.

## Implementação na branch `fix/iv-ranking-ties-20261106`
- `pvp_rank_explorer.js`: adiciona `sharedRank` e `tieCount` para grupos de produtos numéricos iguais, preservando `rank` ordinal único para `pageForRank`, navegação, comparação, deep links e compatibilidade com filtros/API. Tabela usa `#1=` nos dois spreads; cabeçalhos, cópia e comparação indicam `#1 (empate)`. CSV preserva coluna `Rank` ordinal e acrescenta `Empate real`.
- `detail.html`: cartão de análise e chip compacto mostram `#1 (empate)`/`IV #1=` quando o `ordinal` e o IV do usuário são confirmados localmente no mesmo snapshot. O atributo `data-ps-rank` permanece com a posição ordinal (para abrir a linha correta). O chip compacto mantém suas três divisões e botão de golpes.
- O cálculo complementar no cartão é limitado a rankings ordinais #1 e #2 para reduzir processamento inicial em Android com 4 GB de RAM. As demais posições são exibidas como ordinais no cartão; o explorador identifica outros empates na tabela completa.
- Sem alteração das duas Pokébolas, autenticação, quotas, filtros remotos, ranking RG, Game Master, assets Mega, versionCode, assinatura ou mecanismo OTA.

## Verificações
- A igualdade dos dois produtos foi executada diretamente com o Game Master e o módulo reais extraídos da branch: `=== true`, `sharedRank=1`, `tieCount=2`, mantendo ordinal 1 e 2.
- Os scripts de `detail.html` e `pvp_rank_explorer.js` foram verificados como JavaScript sintaticamente válido; o helper de apresentação retornou `#1 (empate)` e `#1=` para o IV 0/14/15.
- Teste de regressão acrescentado: `app/tests/pvp-iv-exact-ties.test.js` (execução da suíte Node/Android em CI ainda a confirmar).

## Condições de publicação
Esta branch/PR **não equivale a APK oficial, merge, assinatura, OTA enviada ou validação física**. Exigir testes automáticos e inspeção visual das duas Pokébolas antes de liberar novo APK/OTA assinado, seguindo `docs/GUIA_MESTRE.md`.
