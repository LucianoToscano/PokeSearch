# LT334 — Edu não encolhe ao jogar Pokébola (13/11/2026)

## Defeito confirmado
Na LT333 o carregador passou a usar diretamente os masters PNG 512, mas os quadros 0–3 da Pokébola foram desenhados menores do que a pose #42. As medidas indicativas das fontes enviadas são: #42 (142,33,370,478), #00 (160,115,354,459), #01 (153,112,359,459), #02 (149,47,358,459) com Pokébola no alto, #03 (158,118,362,459). A cabeça e o corpo encurtam na transição.

## Correção no APK
- Arquivo novo: EduPokeballStable.java.
- EduSpriteAtlas.frame carrega a #42 como base para os quatro quadros, preservando pixel a pixel a cabeça, olhos, óculos, tronco, calça e tênis.
- O braço e a Pokébola vêm dos quadros originais, em camada independente, com escala UNIFORME apenas do gesto; o corpo não sofre nenhum redimensionamento.
- O objeto acima da cabeça do quadro #02 é mantido na posição original.
- Sem filtro bilinear/antialias e sem o antigo warp anisotrópico LT332.
- A correção ocorre apenas nos quatro índices 0–3, uma vez no cache LRU. Os outros 64 quadros, inclusive #42, teleporte, armaduras e poses de evento, permanecem intactos. Todos os 68 arquivos originais de 512px continuam inalterados.

## Validação
- Regressão LT334 dedicada, Node, Android Core/Java, OTA e APK assinado.
- Manter oito sequências ociosas, os tamanhos P/M/G e o tempo 220ms da Pokébola.
- Teste visual físico Samsung e fluidez da junção braço/ombro ainda dependem de inspeção pós-instalação; testes automatizados não comprovam o resultado físico.
- Versão pretendida para publicação após CI: LT334 / 0.03.33 / versionCode 54539 / label 51337; versão anterior estável LT333 v0.03.32-54538.
