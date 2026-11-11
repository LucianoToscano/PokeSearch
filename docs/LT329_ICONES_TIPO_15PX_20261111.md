# LT329 — Ícones de tipo 15×15 no card (11/11/2026)

- **Pedido:** reduzir de 16×16 px para 15×15 px somente os ícones de tipo do card de detalhes do Pokémon.
- **Implementação:** `detail.html`, seletor `#major .psTypeIconSet .pkTypeImg` e a variante `:only-child`, agora com largura/altura/largura máxima/base flexível de 15 px. Espaçamento 2 px e centralização preservados.
- **Escopo:** mesma WebView de detalhe usada pela Pokébola principal e pela secundária. Não modificar tipos em painéis de golpes, ranks, eficácia, filtros nem outros ícones.
- **Teste:** `node app/tests/lt329-card-type-icons-size.test.js`, além da suíte Node/Android do fluxo de CI. Verificar que ambos os seletores mantêm 15×15, e o espaço 2px.
- **Roteiro Samsung P1/P2:** abrir card de Pokémon com um tipo e outro com dois tipos em cada Pokébola; inspecionar P/M/G, centralização, nitidez e interação na caixa dos tipos.
- **Pendente:** validação visual em dispositivo físico; CI não substitui teste de instalação e não prova a nitidez na tela Android.

## Evidência de integração e publicação (11/11/2026)

- PR [#330](https://github.com/LucianoToscano/PokeSearch/pull/330) merge squash `b153be3101a41e3f2baea662f5542b9f1f4e09ab`. Node QA, regressão completa, Playwright P/M/G, Android Java/OTA e build beta privado **SUCCESS** após corrigir expectativas de testes anteriores.
- Build/publicação oficial: [Actions #43084876133](https://github.com/LucianoToscano/PokeSearch/actions/runs/43084876133), commit de fonte `ae5e060ae5178ad19a0153c2f45dd28f47849113`, completed/success.
- Tag `v0.03.28-54534`, `PokeSearch-v0.03.28-LT.apk`, **35.363.647 bytes**, SHA-256 `e132a2cad26de221b9508efa80b0382e8fe3f800e420a6f8d8b350d7c7df29fc`, assinatura Android v2 permanente verificada (certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`).
- [APK oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.28-54534/PokeSearch-v0.03.28-LT.apk). Artefato de QA oficial GitHub #13885972338; ZIP SHA-256 `b76ec63942432df683e459b95cf7b1b71184525745d1108fb4b64055e1e1ec75`.
- **Pendente:** confirmação de instalação e inspeção de legibilidade no Samsung real.
