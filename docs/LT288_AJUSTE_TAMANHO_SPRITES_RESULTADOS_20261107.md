# PokeSearch LT288 — Sprites uniformes nos Resultados P1/P2

Data: 07/11/2026. Estado inicial: PR de QA, não é publicação.

## Evidência física
Captura recente após LT287: as sprites agora estão presentes nas duas listas, porém Snorlax, Totodile, Meowth, Torchic, Chikorita, Pikachu e outras ocupam tamanhos visuais diferentes. Preservar o padrão compacto P/M/G e a imagem do PoGoCoordinates.

## Diagnóstico
O LT287 tornou preferencial a URL HTTPS exata validada no card do provedor. Em LT226, o normalizador de miniaturas calcula a silhueta com pixels alfa para ocupar cerca de 87% da caixa. Imagens remotas sem CORS são exibíveis, mas leitura dos seus pixels no canvas pode falhar, deixando o zoom 1 enquanto outros arquivos são medidos e ajustados. Mesmo com caixas físicas idênticas, há diferença perceptual.

## Correção
1. Se a imagem permitir medição de transparência, manter cálculo original.
2. Se a imagem remota bloquear o canvas, usar apenas um PNG de identidade exata, verificado pelo resolver local e disponível via ponte nativa, como referência auxiliar de geometria. O URL e os pixels exibidos continuam os do PoGoCoordinates.
3. Limites do ajuste auxiliar: zoom de 0,8 a 1,8; deslocamento máximo de 12% da caixa P/M/G. Sem referência comprovada, manter dimensão conservadora, sem substituir espécie, forma, Shiny ou fantasia.
4. Cancelar callbacks quando o card for substituído ou removido. Sem novos domínios, requisições, permissões ou alteração na busca. Duas Pokébolas independentes.

## QA
O teste lt288-uniform-sprite-visual-size.test.js cobre imagem externa com canvas bloqueado, imagem legível, referência PNG, URI externa rejeitada, proteção contra retorno tardio, limites e tamanhos 24/32/40 dp. LT226 permanece como teste de 85–90% em imagens acessíveis. Node regressão completa, Java Android, OTA, visual P/M/G e APK beta privado são obrigatórios no commit final.

**Homologação física pendente:** testar com Snorlax, Totodile, Meowth, Torchic, Pikachu e Cyndaquil em P1/P2, incluindo após trocar de aplicativo e bloquear a tela. A referência local pode ter contorno diferente da arte externa; os limites evitam ampliações excessivas, mas não comprovam uniformidade perfeita de toda fantasia sem arquivo equivalente.

## Publicação
Somente após aprovação de CI, merge, workflow permanente e SHA verificado. Base anterior LT287 (0.02.87, 54491).
