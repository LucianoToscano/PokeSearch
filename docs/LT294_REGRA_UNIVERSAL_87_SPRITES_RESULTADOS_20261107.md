# LT294 — Regra universal de 87% de ocupação nas sprites de Resultados

Data: 07/11/2026. Base oficial anterior: LT293 (0.02.93 / versionCode 54497).

## Evidência no Samsung

O usuário mostrou duas listas simultâneas: a de Pokémon 100% sem moldura e a de Rank #1 com molduras. Charmander, Bulbasaur e alguns sprites de evento continuam aparentemente minúsculos ao lado de Grimer, Treecko, Snorlax, Torchic e outros. A exigência é uma proporção comum, não somente um filtro ou uma espécie.

## Regra única

A maior dimensão do DESENHO VISÍVEL (pixels com alfa real), e não do PNG com transparência, ocupa entre **85% e 90% da caixa**, com **meta de 87%**. A imagem é centralizada proporcionalmente para não cortar pernas, cauda, orelhas ou vestimenta. Margem aproximada de 5–7,5% em cada lado no maior eixo. Caixas com borda e sem borda têm o mesmo tamanho e regra. Preservados P=24dp, M=32dp, G=40dp.

## Causa técnica da persistência na LT293

- A LT293 só aplicava a normalização de uma geometria remota depois de detectar ocupação inferior a 80% da imagem. Como o elemento de imagem ocupa 88% da caixa, uma sprite com 80% de preenchimento interno tinha só 70,4% da caixa, violando o mínimo 85%.
- Para imagens originais legíveis no WebView, a LT293 ainda usava zoom máximo 2,85x, insuficiente para PNGs com margens muito grandes. Para a geometria nativa exata, o máximo era 7x. Esses limites não resultavam do contorno e reduziam indevidamente desenhos pequenos.

## Correção LT294

- O módulo sprite_visual_scale.js define RESULT_VISIBLE_TARGET=.87, RESULT_IMAGE_BOX=.88 e SOURCE_MEASURED_MAX_ZOOM=24.
- Toda medição válida dos pixels opacos da própria imagem exibida recebe zoom calculado para 87%, inclusive as que já ocupam 80% ou mais do PNG. Normalmente o zoom será próximo de 1; para PNGs com muito espaço transparente, poderá ser maior. Não há multiplicador fixo por espécie.
- Fonte de medidas, em ordem de confiança: imagem visível medida diretamente pelo canvas; limites alfa do card verificado no próprio PoGoCoordinates; medição Android nativa restrita à mesma URL exata comprovada; fallback de PNG assinado da mesma forma, com limite conservador quando não é byte a byte idêntico. Se todas as medidas falharem, não se inventa tamanho, nem se substitui a arte.
- Também elegíveis para leitura nativa são URLs oficiais, fixadas em commit, da própria sprite GO exata e verificada pelo catálogo local, se forem elas mesmas a imagem visível. Nunca URLs arbitrárias não verificadas.
- Se a imagem visível já foi medida, não se fazem requisições nativas adicionais desnecessárias. Geometrias relacionadas a outra URL são rejeitadas antes de reusar o cache da linha. Mantida a validação de token e URL nos callbacks assíncronos.
- Mudança concentrada em Resultados 100% e Rank #1 das duas Pokébolas, com ou sem caixas, P/M/G. Não altera espécie, Shiny, forma, vestimenta, dados de IV, Rank Classe/RG, PC/Nível, localização, sprites no card detalhado, tamanho dos toques ou filtros.

## QA

O teste lt294-universal-87-percent-sprite-fill.test.js reproduz: Charmander de evento ocupando 6x8 pixels opacos em canvas 96x96, Torchic médio, Treecko, Snorlax e Psyduck quase inteiro; 2 modos × 2 estilos × 3 tamanhos. Garante 85–90% e ausência de trocas da URL original. Verifica a leitura nativa com CORS bloqueado, medidas fornecidas pelo card, rejeição de URL divergente e fallback sem adivinhação. Contratos LT226/LT290/LT293 atualizados para refletir a regra universal.

## Limites e homologação

A regra 85–90% se aplica quando o contorno é mensurável. Uma URL de imagem bloqueada também ao Android continua com escala conservadora — nunca afirmar 87% medido sem dados reais. Ainda é preciso homologar fisicamente no Samsung ambas as Pokébolas, os tamanhos P/M/G e o modo com/sem caixas, comparando Charmander, Bulbasaur, Snorlax, Treecko e sprites de eventos antes de declarar solução definitiva.
