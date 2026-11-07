# PokeSearch LT278 — números de rank 1 px acima (06/11/2026)

## Pedido e evidência
Captura real em Samsung do Growlithe com cinco avaliações: o `#50`, `#1`, `#12`, `#694` e `#747` estão excessivamente próximos das respectivas bandeiras. Ajuste solicitado: **subir exatamente 1 pixel apenas os números**.

## Alteração restrita
- `app/src/main/assets/detail.html`: em `#rankLine[data-rank-rail="five"] .psRailButton .psRailNumber`, adicionar `transform:translateY(-1px)!important`.
- Preservar o deslocamento anterior das bandeiras `psRailIcon` `translateY(-4px)`, tamanho de 23px, centralização horizontal e marcadores de evolução LT275.
- Preservar cinco cards de 45px, trilho de 47px, botões/áreas de toque e suas ações (Raides, GL, UL, ML, RG). CSS compartilhado pelas Pokébolas P1/P2.
- **Não** alterar cálculos PvP, iv-rank, sort, API, login, dados, sprites, posicionamento do cartão completo, ou escala dos componentes.

## Critérios de QA
- `lt274-evolution-rail-layout.test.js` fixa a regra exatamente em `-1px` apenas para número e `-4px` para bandeira, sem crescimento.
- Gate real `lt253-visual-screenshots.cjs` inspeciona os cinco cartões em dimensões P/M/G e confere `m42===-1` nos números e `m42===-4` nas bandeiras, mantendo testes de separação do marcador de evolução, centralização e ausência de corte.
- Rodar Node, Android/Java, OTA, PvE e testes visuais. Somente após aprovação e merge realizar release estável assinada LT278 `0.02.78 / 54482`.
- **Ainda pendente:** homologação de aparência no Samsung físico após instalação; screenshots Chromium não garantem renderização idêntica no aparelho.
