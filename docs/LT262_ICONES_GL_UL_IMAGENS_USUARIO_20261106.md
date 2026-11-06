# LT262 — novos ícones de Grande Liga e Ultra Liga (06/11/2026)

## Pedido e imagens do usuário
Substituir **apenas os ícones dos modos GL e UL** pelas duas imagens fornecidas: GL é círculo azul brilhante com faixa diagonal vermelha; UL é círculo preto/cinza brilhante com duas faixas amarelas. Mesmo tamanho de tela dos outros modos, mesmo alinhamento e sem fundos pretos/quadrados ou novos menus.

## Implementação
- `app/src/main/assets/result-icons/modes/GLBadgeLT262.png`: PNG de 96×96 px com transparência e círculo completo, derivado da primeira imagem enviada. Git blob `1586656729121ad5117d05135a1223a37e7e6e95`; SHA-256 `be6de24bb4f01a6e13456dfb77ed81e878d5d6065393aaca08f87c5547234cbb`.
- `app/src/main/assets/result-icons/modes/ULBadgeLT262.png`: PNG de 96×96 px com transparência e círculo completo, derivado da segunda imagem enviada. Git blob `966d45cdf479b17c5d5861753a05bed85f60fbb8`; SHA-256 `3328b59cc0bc730d3df9e13f2b053c5df248438402d016e13dbab08f15fe4220`.
- `dock.html` muda somente `modePath.gl` e `modePath.ul` para os dois novos PNGs. O CSS existente mantém 17×17 px no menu compacto e dimensões antigas para botão de modo, bolha e cabeçalho de resultados. Não alterado o selo de rank #N, animação, posição, largura, P/M/G, duas Pokébolas, Liga Mestre, ícones de IV, resultado PvP, nem favoritos.
- Imagens originais `StarGL.png` e `StarUL.png` permanecem intactas, inclusive nos selos do chat e como rollback. Fallback do modo continua disponível.
- `scripts/optimize_apk_size_lt185.py` protege os dois arquivos de recompressão. `pokesearch-official-release.yml` bloqueia a publicação se o APK não contiver **ambos** os PNGs aprovados com hashes corretos.
- Teste `app/tests/lt262-user-gl-ul-mode-icons.test.js` valida bytes, hashes, dimensões, alpha real, mapeamento e geometria preservada.

## Gates e publicação
- [PR #242](https://github.com/LucianoToscano/PokeSearch/pull/242) mesclada na `main` em `50472943356fbc8904b5a288bff73bb55e9725f9`; sete checks automatizados verdes no head `5c1ff3e9be0b660d59514d412b06bf4005b45063`.
- **Escopo adicional ratificado pelo usuário:** os novos ícones são apenas de **Modos GL e UL**; não modificar Pokébolas. Os dois PNGs aparecem em `getModeMenuIcon` (botão Modos do painel), mas os três indicadores de Pokébola/resultados permanecem abastecidos por `getResultIcon` e seus PNGs originais.
- [Workflow oficial #42193970707](https://github.com/LucianoToscano/PokeSearch/actions/runs/42193970707) concluído com preflight e publish `success`; compilação, assinatura, pacote, versão, hash e PNGs dos Modos conferidos no APK assinado. [LT262 · 0.02.62 · 54466](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.62-54466) publicada em `2026-11-06T09:21:57Z`, estável e pública. APK **28.612.164 bytes**, SHA-256 `cd84ef82b4eb62cecde15766c5e6bdd0f457b2ab9545bfec175fc9fd35cc38f1`.
- Pendente apenas validação física do visual nos menus e Pokébolas P1/P2 no Samsung após a instalação. Não foi observada a instalação remota. A release LT261 segue disponível para rollback.
