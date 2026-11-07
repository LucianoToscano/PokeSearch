# PokeSearch LT284 — Comparador A/B de IVs na calculadora
Data: 07/11/2026. Estado inicial: PR de QA, publicação depende de CI e merge.

## Premissas verificadas
- Base oficial LT283 `0.02.83`, versionCode `54487`. Guia Mestre e issue #277 definem a etapa de comparador de IVs.
- A calculadora `detail.html` já permitia editar IV A/B e comparar PC/PS, mas **não** exibia Rank Classe e eficiência dos dois conjuntos.
- O explorador `pvp_rank_explorer.js` já tem fonte PvPoke offline, as 4096 classificações por forma e liga, ranks, eficiência, PC e nível calculados, com cache limitado. Reutilizar exatamente essa fonte; **não** refazer ranking com fórmula paralela.

## Implementação
1. Novo método somente-leitura `PokeSearchRankExplorer.compareIv(gm, form, IVa, IVb, overall)`: verifica A/D/S entre 0 e 15; calcula GL, UL e ML pelo `getIvRows` já existente; recupera rank, eficiência IV, PC e nível para os dois IVs de uma **mesma** espécie/forma. Identidade ambígua ou sem entrada Game Master retorna não confirmado.
2. `better` apenas indica o produto de atributos matematicamente superior dentro da mesma classe, sem dizer que um exemplar vence outros Pokémon. Empates reais por produto matemático recebem `empate`; Rank Geral da espécie é consultado apenas com nome exato/único, nunca inferido de IV.
3. Na calculadora atual, em **Comparar IVs (opcional)**, abaixo das entradas A/B, três linhas compactas e sem fundo colorido: GL, UL, ML, #Rank Classe, eficiência %, PC e nível. Texto verde somente para IV com maior produto, fonte em título/descrição. Custo de Doces/Poeira, disponibilidade de Mega e vitória em PvP não são estimados.
4. A comparação só é calculada quando a seção está expandida, e aproveita o cache limitado do explorador. Ao editar qualquer IV ou selecionar outra forma, reutiliza a mesma lista para atualizar; ao fechar, não recalcula.
5. Nenhuma nova API, GPS, conta, login ou janela de overlay. P1/P2 usam os mesmos assets HTML/JS e mantêm estados próprios, snapshots e filtros. Não remover calculadora anterior nem Projeções PvP.

## QA / aceitação
- `node app/tests/lt284-verified-iv-comparison.test.js` usa dados de referência determinísticos e compara diretamente os rankings do novo método com `getIvRows`: GL/UL/ML, IV igual/empate, IV inválido, forma ausente, formas duplicadas e RG ausente/duplicado. Verifica que abrir a seção não consulta a API e que fechado não computa.
- Preservar suites LT249 (calculadora de PC, evolução Teddiursa), LT265 (menus exclusivos), LT280 (identidade de Burmy/Wormadam), LT283 (scroll/smart panes), LT282 (Raides e cores), screenshots P/M/G, Java Android, OTA e beta APK privado. CI no **SHA de PR**.
- Teste físico ainda pendente: Samsung P1/P2 separados com Burmy 412 Sandy, Wormadam 413 Trash, formas regionais/sombrosas sem fallback, 0/15/15 × 15/15/15, troca GL/UL/ML, estado de scroll ao expandir/recolher, estabilidade ao variar sliders. Nenhuma homologação física implícita em CI.
- Publicação pela solicitação `release/official-request.json` **somente depois** dos gates e da integração.

## Roadmap
Esta etapa atende apenas ao comparador A/B por liga e confirmação do dado, não os custos de evolução nem assistente completo de golpes, presets, eventos ou diagnóstico (issue #277).
