# Auditoria EDU LT320 - 68 sprites

Origem: atlas LT316, 1024x1152, 68 células de 128x128.
SHA-256 dos bytes WebP: cb9ffbc0886824b04977140a3c7cfc381f9c9244700a72c8e8011af204050a1c
Quadros totalmente vazios: []
Quadros com alertas técnicos/contextuais: [10, 11, 12, 13, 14, 15, 16, 17, 20, 21, 22, 28, 30, 31, 32, 36, 37, 38, 39, 40, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 67]
Quadros de pixels duplicados: []

## Limitações essenciais
- NÃO EXISTEM mestres originais de 512px por quadro no repositório atual.
- As duas pastas 512px são AMPLIAÇÕES derivadas, nunca fontes novas nem recriação fiel de olhos.
- A auditoria automatizada verifica integridade, geometria, bordas e transparência; NÃO comprova perfeição artística, identidade facial ou nitidez de origem.
- Quadros 52 a 60 de teleporte têm escala/opacidade intencionalmente variáveis.
- Quadros 20, 28, 30, 36 e 49 recebem retoques Android; pasta 05 contém ANTES, DEPOIS aproximado e 512 derivado. A aproximação Pillow NÃO é pixel a pixel igual ao Canvas Android.
- Inspecionar visualmente especialmente olhos/óculos e acessórios nos índices 36,37,38,42,49,50,51,67.

## O que fazer para melhorar de verdade
- Conferir ambas as opções derivadas lado a lado nos tamanhos P100/M150/G200.
- Não trocar fontes em produção sem QA visual real no aparelho.
- Obter arquivos mestres de 512px para refazer a qualidade sem inventar detalhes.
- CSV inclui medidas de todos os 68 índices; status SEM_ALERTA_GEOMETRICO não significa aprovação artística.
