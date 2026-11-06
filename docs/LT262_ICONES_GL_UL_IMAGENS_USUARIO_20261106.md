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
Os assets e o código foram enviados para a branch `feature/lt262-gl-ul-icons-20261106`. A suíte CI completa, as capturas visuais P/M/G e o APK assinado devem passar antes de merge/OTA. Nenhuma instalação física em Samsung foi observada. LT261 · 0.02.61 continua a última versão oficial enquanto LT262 não for assinada e publicada.
