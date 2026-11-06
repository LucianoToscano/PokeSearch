# LT264 — Cartão vazio sem Rank PvP e Rank Classe confundido com Rank Geral

**Evidência recebida (06/11/2026):** screenshots do Samsung em LT263 com Squawkabilly azul 15/15/15 (cartão exibe faixa vazia entre IV e Raides), e Mareep/Sandshrew 15/15/15 mostrando "GL IV #1" e explorador classe #1. A solicitação é não mostrar espaços vazios nem induzir que IV Classe #1 significa melhor Pokémon da liga.

## Causa real do espaço
- Em `detail.html`, a faixa `#rankLine` recebia `hidden=true`, mas também `data-league=""` nos cartões sem IV Rank verificado.
- A última regra CSS `#rankLine,#rankLine[data-league]{display:flex!important;min-height:32px!important;height:32px!important}` prevalecia sobre o `#rankLine[hidden]{display:none!important}` antigo (especificidade equivalente com atributo e ordem posterior).
- Portanto, um cartão como Squawkabilly, sem Rank Classe exibido no compacto, reservava uma faixa vazia de 32px, além das margens.

## Correção
1. Última regra CSS de `detail.html`: `#rankLine[hidden],#rankLine[data-league][hidden]{display:none!important;min-height:0!important;height:0!important;margin:0!important;padding:0!important}`, colocada depois de todos os overrides.
2. Quando não houver IV Rank de fonte verificável, remover inteiramente o atributo `data-league` em vez de usar string vazia. Preservar ranking, cliques, fontes, modo GL/UL, Raides e ambas Pokébolas.
3. O explorador de IV agora informa explicitamente: **"Posição entre 4.096 IVs de [espécie] — não é o Rank Geral da Grande Liga"**; subtítulo diferencia "Classe IV #N" da posição global de espécies.
4. Tooltip do chip de Rank Classe explicita o mesmo, sem alterar seu tamanho/ícone. Não confundir o Rank Geral da espécie com o rank da combinação de IVs.

## Dados reproduzidos (Game Master local, snapshot retido)
- **Mareep** 15/15/15: GL Classe IV #1/4096, nível 50, PC 1120 (não alcança limite 1500).
- **Sandshrew** 15/15/15: GL Classe IV #1/4096, nível 50, PC 1426 (não alcança limite 1500). No screenshot, **Rank Geral #610** é outra métrica.
- **Squawkabilly** 15/15/15: GL Classe IV #927/4096, PC 1494, nível 26,5. Não afirmar IV #1.

## Proteções e testes
- `app/tests/lt264-hidden-iv-class-scope.test.js`: cálculo com a mesma fonte Game Master do APK para as 3 espécies; CSS posterior e remoção de atributo; avisos de escopo; sintaxe dos scripts e preservação do ícone de Raides.
- **Testes concluídos:** Node completo, Node QA, Core, compilação Java, visual P/M/G, OTA e referência de Raides passaram (7 gates CI) na PR #244. [Merge oficial #244](https://github.com/LucianoToscano/PokeSearch/pull/244) realizado em `e29db1863afdb27a3691039cae2ffd6d94c1f1c0`.
- **APK oficialmente publicado:** [GitHub Actions #42208975901](https://github.com/LucianoToscano/PokeSearch/actions/runs/42208975901), `preflight=success` / `publish=success`, build e assinatura permanente v2 verificados. [Release LT264 · v0.02.64-54468](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.64-54468) publicada em `2026-11-06T11:19:28Z`; instalador [PokeSearch-v0.02.64-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.64-54468/PokeSearch-v0.02.64-LT.apk), 28.623.915 bytes, SHA-256 `5da28a383071dab0857aece1dd8dada21b19b16b1de24c344812a621c7d4fd62`.
- **Limitação:** a publicação e o conteúdo do APK foram verificados por CI, mas nenhum teste físico Samsung de P1/P2 em LT264 foi observado. O usuário precisa confirmar instalação pelo Android e verificar que o espaço vazio desapareceu. LT263 preservada como rollback.
