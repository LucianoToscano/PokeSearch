# LT226 QA — sprites ocupam 85–90% VISÍVEIS do cartão

Data: 01/11/2026. Referência: captura Samsung LT225 com 10 cartões grandes, menu horizontal e Editor Visual aberto. Os quadrados G aparecem na largura/tamanho correto, mas a **silhueta real** dos Pokémon ainda é muito pequena dentro de cada cartão, apesar de a tag `img` possuir dimensão de 88% do quadrado.

## Causa
- A LT224/LT225 corrigiu a geometria da **caixa** e definiu `transform:none!important` para que as imagens não ultrapassassem o cartão. Essa regra desativou a normalização da área opaca de `sprite_visual_scale.js`.
- PNG/WebP de vários Pokémon têm margens transparentes que não aparecem, mas contam no dimensionamento do elemento HTML. O usuário precisa que a silhueta visível, não apenas a tag da imagem, seja centralizada e grande.

## Mudança LT226
1. `sprite_visual_scale.js` preserva as rotinas QA19 `measure/factor/apply` do detalhe, acrescentando `visibleBounds`, `tileFit`, `applyResultTile` **somente** para resultados. Um canvas 96×96 mede o menor retângulo com alfa ≥ 38, sem reescrever a imagem. O zoom busca aproximadamente 87% visíveis do quadrado (dentro 85–90% pedido), respeita proporção, corrige deslocamento X/Y e limita fator a 2,85.
2. `dock.html`: a sprite continua em P 26,4/M 35,2/G 44dp dentro dos cartões P 30/M 40/G 50dp; o CSS dos resultados recebe `--tile-alpha-zoom`, `--tile-alpha-x/y` e aplica `translate(...) scale(...)` medidos no evento de carga. Moldura, botão do menu, hitboxes e dados não mudam.
3. Para imagens de CDNs públicos com CORS permitido (`raw.githubusercontent.com`, `cdn.jsdelivr.net`), `crossorigin="anonymous"` habilita a leitura de alfa; nenhuma URL de outro provedor é modificada.
4. Se a imagem vier de um servidor que bloqueia leitura, mantém o original sem recorte nem requisição nova insegura; não inventar uma espécie/forma diferente ou apagar efeitos. Cache máximo de 200 medições por URL, limitado a 10 resultados no plano comum. O PNG real permanece intacto.
5. `app/tests/lt226-visible-sprite-alpha-fill.test.js`: retângulos de alfa centralizados, deslocados, sem margens e muito pequenos, sem imagem reescrita, CORS bloqueado, preservar P/M/G e estilos.

## QA em Samsung
- Conferir P/M/G, horizontal e vertical, com e sem fundo, Pokémon com áreas transparentes diferentes.
- Verificar proporção, caudas/orelhas, efeitos de formas e fantasias; nenhum corte, sobreposição de itens nem falha de sprite.
- Comparar captura LT225 com LT226: a silhueta deve ocupar a maior parte do cartão (não somente a caixa transparente).
- Repetir com duas Pokébolas, botão de coordenadas, timer, detalhes, filtros e Editor Visual arrastável.
- Se o sprite remoto bloquear leitura CORS, registrar esse caso como limitação de origem e não alegar 87% medidos para ele.

Versão QA proposta: LT226 `0.02.26` / versionCode `54433`. Estável pública segue LT215 até homologação física.
