# LT321 proposta em QA — upscale real de pixels Edu 128→512 (09/11/2026)

## Origem e preservação
Base verificada: LT320 `0.03.20`, versionCode `54526` (última release registrada na main durante esta edição).
As 68 sprites de 128×128 do atlas LT316 continuam sendo a **única fonte**. A #42 permanece referência de rosto/óculos/cabeça/pés, sem alteração de índices, pose, posição ou vestuário. `EduSpriteManualRetouch` continua sendo aplicado em 20,28,30,36,49 antes de ampliar. A transparência especial dos teleportes 52–60 permanece inalterada. Sombria #67, Shiny, armaduras e 22 poses ociosas são preservadas.

## Mudança proposta
- Introduzido `EduPixelArtUpscale.java`: upscale **4× com Scale2x uma vez (128→256) seguido de ampliação exata 2× (256→512)** para melhorar os contornos diagonais de pixel art sem cores novas, reamostragem borrada do original nem movimentar a célula.
- `EduSpriteAtlas.frame()` gera a imagem 512×512 **em memória** após crop, alinhamento e retoque, usando 8 quadros em cache LRU; falha de memória retorna à sprite 128.
- Mantido `drawable.setFilterBitmap(true)` só para reduzir a saída 512 aos tamanhos P100/M150/G200, evitando perder detalhes em escalas não inteiras.
- Não altera o atlas-fonte, não cria masters artísticos 512, não adiciona 68 imagens ao APK, não altera comportamento do Edu, relógio, menus, balões, buscas ou assinatura.

## Validação
`node app/tests/lt321-edu-68-upscale-pixelart.test.js` compila/executa a classe Java quando há JDK, checando 512×512, alfa sem novos valores, fidelidade da paleta, preservação de pixel isolado/posição e ajuste de contorno diagonal. Os testes LT320 foram atualizados para reconhecer a nova estratégia, sem relaxar os demais guardas.

### Pendente antes de publicar
- Verificar todos os 68 quadros num Samsung, especialmente rosto/óculos/cabelo, fantasia Mewtwo/Shiny, cinco poses retocadas e teleporte; comparar P100/M150/G200 em vídeo antes/depois.
- Rodar suite de regressão Node, build Android, comparação visual e 5 gates de CI.
- **Upcale não recupera detalhes inexistentes no arquivo de 128px**. Para verdadeira arte master 512 desenhada com novos detalhes, obter fontes de alta resolução e retocar manualmente.
- Esta branch e PR são **apenas QA**; sem merge, tag, APK ou atualização OTA sem autorização.

## Compatibilidade
Não modificar P1/P2, Doce Raro, API, resultados, ranking, login, Firebase, OTA, P/M/G ou assinatura. Manter fallback para arte original em baixa memória.
