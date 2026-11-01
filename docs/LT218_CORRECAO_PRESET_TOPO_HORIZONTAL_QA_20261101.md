# PokeSearch LT218 — correção da orientação horizontal após QA real no Samsung

## Evidência do problema
Capturas enviadas após instalar LT217 demonstram: Pokébola e Pokémon em coluna à esquerda, **menus empilhados verticalmente em cartões largos** no centro da tela, e o Editor Visual ajustando/movendo esse conjunto sem aplicar a referência de uma única faixa de botões ao lado da Pokébola.

## Causa no código LT217
`visual_editor.js` executava `applyVisual(); saveSoon(); renderVisualEditor()`, com persistência adiada 100ms, e imediatamente chamava `Native.applyTopHorizontalLayout()`. No Android, `updateMenuPosition()` ainda via `visualMenuVertical=true` das preferências **anteriores**, usando a altura de 232dp do menu vertical; a classe `visual-menu-vertical` define `display:flex; flex-direction:column; width:100%` e botões esticados, exatamente como nas capturas. O reposicionamento acontecia antes da mudança de orientação estar salva.

## Correções LT218
- Nova ponte `applyTopHorizontalPreset(String json)`: na **mesma tarefa do handler da interface**, valida que o preset tem Menu horizontal + Resultados vertical, grava com `saveVisualPrefs()` e **só depois** chama `applyTopHorizontalLayout()`.
- Preset cancela o salvamento com temporizador e fornece o JSON normalizado imediatamente, evitando a corrida de 100ms. Os presets antigos e ajustes individuais mantêm comportamento prévio.
- Classe explícita `visual-menu-horizontal`; regras CSS finais de alta especificidade mantêm faixa horizontal de 34px, 12 espaços compactos em linha, botões de 30px de altura e nomes ocultos. Nenhuma barra larga vertical no preset horizontal.
- Resultados `vertical` recebem `flex-direction:column` sem mudar a lista horizontal quando selecionada. P1/P2 continuam usando preferências independentes.
- O limite físico de largura é respeitado: em telas estreitas os ícones ficam menores e/ou a organização `Mais` permanece válida. O Editor Visual não deve bloquear o jogo quando fechado.

## Regressão e verificação
- `app/tests/lt218-horizontal-native-layout.test.js` confirma ordem obrigatória salvar-antes-de-posicionar, dimensões do ribbon, ausência de rolagem vertical no menu horizontal, resultados verticais, e separação P1/P2.
- `lt217-top-horizontal-layout.test.js` adaptado à execução atômica sem retirar os controles de orientação independentes.
- Executar Node/Java/OTA/Gradle e gerar APK QA `0.02.18` (versionCode `54425`) com assinatura permanente, SEM publicar a todos.
- Teste físico Samsung: selecionar Topo Horizontal com dock em posição original e depois reposicionar; o menu deve ficar **ao lado**, em **uma única linha**, e os resultados em coluna **abaixo**. Fechar e reabrir; executar em P1 e P2 com orientações diferentes; testar largura da tela, menu Mais, editor aberto/fechado.
- Se ainda ocorrer divergência, capturar screenshot **com e sem Editor Visual** e registrar as posições dos overlays para a próxima correção. Não declarar a homologação visual apenas com CI.
