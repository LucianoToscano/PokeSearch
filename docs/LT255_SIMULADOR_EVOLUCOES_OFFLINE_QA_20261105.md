# PokeSearch LT255 — seletor de família independente da análise PvP (05/11/2026)

## Defeito observado no Samsung LT254
Na tela da calculadora do Teddiursa `0/14/15`, PC `478`, nível `14`, o seletor exibiu Teddiursa e não ofereceu Ursaring/Ursaluna, embora ambas constassem na Análise PvP abaixo. As setas eram visíveis, mas, quando a lista possuía apenas a forma atual, não havia outra entrada para selecionar.

## Causa/mitigação
O `psCpVariants()` do `detail.html` dependia do conteúdo de `window.psRankContext`, entregue de forma assíncrona pela WebView de resultados, e de opções recebidas da análise. Isso tornava a lista de formas sensível a uma resposta de rank incompleta ou ainda não disponível. O app já possuía o catálogo oficial local `PVP_EVO_LINKS` em `dock.html`, mas o painel de detalhe não tinha esse catálogo acessível.

A correção não requer requisições adicionais à API: `pvp_family_catalog.js` contém cópia congelada das **463 ligações exatas** de `PVP_EVO_LINKS` e percorre a família bidirecionalmente, incluindo Megas quando estão no Game Master existente, **somente com espécies verificadas**. O teste confere igualdade integral das ligações, evitando divergência silenciosa nas próximas revisões. O fallback é permitido apenas para espécie base normal; costume, sombra, variante regional e formas desconhecidas não recebem evolução presumida.

`detail.html` soma as formas verificadas do payload com esse catálogo offline. O seletor anterior é preservado, mas para famílias de até quatro formas apresenta botões pequenos diretos (ex.: Teddiursa, Ursaring, Ursaluna) no próprio painel de vidro; listas maiores usam seleção inline recolhível. Setas, escolha direta e seletor Android convergem na mesma função `psCpPickForm`. IV A/B, nível, PC-alvo e preferências das duas Pokébolas permanecem preservados. Nenhum novo menu flutuante ou permissão foi criado.

## Verificações automatizadas

Código verificado no commit `7915716105c910577dacb6efbfe3023c35f00225` do [PR #234](https://github.com/LucianoToscano/PokeSearch/pull/234).

- [Regressão Node completa #42152786322](https://github.com/LucianoToscano/PokeSearch/actions/runs/42152786322): **success**, inclui `lt255-evolution-family-selector-offline.test.js` — gráfico 463 arestas, família Teddiursa/Ursaring/Ursaluna em ordem e com CP calculado de exemplo, preservação de IV A/B, rejeição de forma inexistente e isolamento de fantasia.
- [Node QA #42152786286](https://github.com/LucianoToscano/PokeSearch/actions/runs/42152786286): **success**.
- [QA core #42152786285](https://github.com/LucianoToscano/PokeSearch/actions/runs/42152786285): **success**.
- [Compilação Android Java #42152786291](https://github.com/LucianoToscano/PokeSearch/actions/runs/42152786291): **success**.
- [Contrato OTA e compilação Android #42152786287](https://github.com/LucianoToscano/PokeSearch/actions/runs/42152786287): **success**. `pvp_family_catalog.js` incluído na allowlist de recursos assinados.
- [Testes visuais Playwright P/M/G #42152786335](https://github.com/LucianoToscano/PokeSearch/actions/runs/42152786335): **success**. Clique efetivo no botão Ursaring, depois seta para Ursaluna, recalculando PC e destacando forma sem overflow; a lista foi montada com `window.psRankContext=null`. [Capturas #13473521100](https://github.com/LucianoToscano/PokeSearch/actions/runs/42152786335/artifacts/13473521100), inclusive `P/M/G-teddiursa-ursaluna-switch.png`.

## Segurança de publicação
A LT254 `0.02.54/54458` permanece como versão oficial até nova publicação explicitamente solicitada ou integrada no ciclo autorizado. Se houver LT255 oficial, usar `0.02.55/54459` e o mesmo certificado permanente, nunca reutilizar `54458`; verificar o último `releases/latest` e os testes antes de assinar. Capturas Chromium provam comportamento automatizado, não comprovam instalação ou toque no Samsung real nas duas Pokébolas.

Pendência física: instalar sobre LT254 sem desinstalar; selecionar Teddiursa/Ursaring/Ursaluna em P/M/G e P1/P2, conferir retorno às setas e à lista, manter IV A/B e controles de PC/nivel.
