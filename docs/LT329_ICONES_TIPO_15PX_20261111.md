# LT329 — Ícones de tipo 15×15 no card (11/11/2026)

- **Pedido:** reduzir de 16×16 px para 15×15 px somente os ícones de tipo do card de detalhes do Pokémon.
- **Implementação:** `detail.html`, seletor `#major .psTypeIconSet .pkTypeImg` e a variante `:only-child`, agora com largura/altura/largura máxima/base flexível de 15 px. Espaçamento 2 px e centralização preservados.
- **Escopo:** mesma WebView de detalhe usada pela Pokébola principal e pela secundária. Não modificar tipos em painéis de golpes, ranks, eficácia, filtros nem outros ícones.
- **Teste:** `node app/tests/lt329-card-type-icons-size.test.js`, além da suíte Node/Android do fluxo de CI. Verificar que ambos os seletores mantêm 15×15, e o espaço 2px.
- **Roteiro Samsung P1/P2:** abrir card de Pokémon com um tipo e outro com dois tipos em cada Pokébola; inspecionar P/M/G, centralização, nitidez e interação na caixa dos tipos.
- **Pendente:** validação visual em dispositivo físico; CI não substitui teste de instalação e não prova a nitidez na tela Android.
