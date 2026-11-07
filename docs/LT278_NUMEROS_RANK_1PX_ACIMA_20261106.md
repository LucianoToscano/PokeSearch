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

## Resultado da publicação
- PR #271 mesclada: `bdcba48ce758d62e4febee9c4000f10a724483bf`.
- QA P/M/G, Node, Java/Android, OTA e PvE: `success` no head `99ea79a2a38bc9b456184437e029bbd678138d87`.
- GitHub oficial: [LT278 0.02.78 code 54482](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.78-54482), publicada em 07/11/2026 01:57:03 UTC.
- APK `PokeSearch-v0.02.78-LT.apk` 33.615.230 bytes, SHA-256 `8946101f6d525bd8022b7052e1e617700abf1b1f752d6d23198d6ddd23362e9c`. Build protegido e assinatura verificados [na CI #42326470427](https://github.com/LucianoToscano/PokeSearch/actions/runs/42326470427).
- **Validação física ainda pendente:** confirmar que números ficaram 1px acima no Samsung com dimensões efetivas do aparelho, P1/P2.
