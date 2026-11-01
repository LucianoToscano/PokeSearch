# PokeSearch LT218 — Correção visual da orientação e Editor Visual arrastável

**Base:** LT217 QA com os prints Samsung de 01/11/2026. Sem alterações no chat, contas, API, coleta ou filtros.

## Diagnóstico confirmado no código e nas capturas

- O preset LT217 invocava `Native.applyTopHorizontalLayout()` antes de `saveSoon()` (salvamento assíncrono). O serviço Android ainda calculava `visualMenuVertical=true`, gerando a janela nativa vertical quando o usuário havia escolhido horizontal.
- Regras CSS antigas de `body.controls-window.visual-menu-vertical` impunham `width:100%`, `height:232px` e `flex-direction:column` a uma lista de botões, tornando cada botão um retângulo de largura exagerada.
- O Editor Visual é um popup nativo separado, não simplesmente um elemento HTML. A janela podia ficar parcialmente fora da tela e não possuía arraste do usuário.

## Correções

1. O preset `Topo Horizontal` agora chama `applyTopHorizontalPreset(json)`. O Android valida `menuOrientation=horizontal` e `resultsOrientation=vertical`, salva as preferências **antes** de mover as janelas, tudo na mesma tarefa da thread de UI. Outros presets não movem o dock.
2. Menu vertical: usa `34dp` de largura para botões de `30×30dp` e disposição em uma coluna. Menu horizontal mantém botões de altura `30dp` organizados em fila. Não alterar ícones, sombras, cores, sprites ou dimensões de cada item.
3. Resultados e menus têm orientações independentes e as quatro combinações possíveis são preservadas. Não alterar as dimensões dos sprites por causa da orientação.
4. Editor Visual: o cabeçalho vira alça de arraste (`pointerdown/move/up`), sem bloquear sliders, textos e o botão Fechar. Ponte Android `moveVisualEditorBy` move a **janela nativa** e salva posição por Pokébola, com limites reais do display.
5. O posicionador de popup aplica `Math.min/​Math.max` à largura, altura e coordenadas nativas em telas pequenas e em rotação. A área de conteúdo continua rolável **dentro do editor**, mas o cabeçalho deve sempre permanecer acessível.
6. A arquitetura P1/P2 continua usando `prefs` e `prefs_secondary`; não há aumento dos privilégios de sistema, coleta de clipboard, GPS ou alterações na versão pública.

## Gates e QA físico

- Novo teste `app/tests/lt218-orientation-editor-drag.test.js` protege a ordem de salvamento, orientações, regras CSS, posição persistente e limite da janela.
- Executar também `lt217-top-horizontal-layout.test.js`, `lt208-menu-drag-visibility.test.js`, testes de Favorites, Node geral, Java, QA core, OTA e compilação Android/R8.
- Testar no Samsung: preset horizontal, **sem barras largas**, primeira linha ao lado da Pokébola, Pokémon verticalizados e alinhados. Alternar orientações uma por vez e confirmar **mesmo tamanho dos botões e sprites**.
- Abrir o Editor Visual perto da borda direita e do rodapé; arrastar pelo cabeçalho para qualquer área livre, fechar/reabrir e testar em P1/P2 independentemente. O editor não deve ficar cortado.
- Versão de teste proposta: **LT218 QA** `0.02.18` com `versionCode 54425`. Não publicar no atualizador até homologação física.

A release estável conhecida permanece **LT215 v0.02.15-54422**. As versões LT216, LT217 e LT218 são etapas QA.
