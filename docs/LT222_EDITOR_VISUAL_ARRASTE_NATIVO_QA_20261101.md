# LT222 — Editor Visual arrastável como os cards de resultados

**Data:** 01/11/2026. Base: LT221 QA 0.02.21 / 54428. Evidência: print Samsung do PokeSearch e relato explícito de que o Editor Visual ainda não se move com o dedo.

## Diagnóstico

- O código antigo da LT218 tentava capturar eventos `pointerdown/pointermove` **dentro do WebView** do Editor Visual e movia a janela nativa Android por um callback JavaScript.
- Ao movimentar um WebView via `WindowManager.updateViewLayout`, a captura de ponteiro HTML pode ser interrompida/cancelada no Android. A interface aparenta aceitar o gesto mas não sustenta o arraste como os cards.
- Os cards do PokeSearch já usam uma **View transparente nativa** sobre uma pequena região de arraste, acompanhando `MotionEvent.getRawX/Y()` e mudando `WindowManager.LayoutParams` diretamente.

## Correção LT222

- Adicionar `visualEditorDragGrip` como View transparente nativa **por cima do WebView** do popup do Editor, com altura 27dp e largura ajustada ao painel, deixando pelo menos 64dp livres à direita para o botão Fechar.
- Detectar ACTION_DOWN/MOVE/UP/CANCEL em Android. Tolerância de 4dp antes de arrastar, posição inicial capturada em pixels de tela (raw), atualizações limitadas a 16ms como nos resultados, conclusão no UP e persistência por Pokébola nas preferências `visualEditorX/Y`.
- Limitar toda a janela ao display: margem 4dp, largura/altura físicas preservadas; **não** mover botões individualmente.
- A View de arraste só aparece em `popupKind="visual"`. Em Modo, Localização, Filtros e Personalização continua GONE. Ao fechar, remover o estado do gesto; ao reposicionar por callbacks JS durante o drag, o posicionador não altera a View tocada.
- Manter o código HTML anterior apenas como fallback: o gesto nativo passa a ser o comportamento principal.
- Não alterar menu, sprites, consulta de espécies, filtros, logins, chat, cooldown, transferência, publicação automática ou ativação.

## Testes

- Novo `app/tests/lt222-native-visual-editor-drag.test.js`: presença da View nativa, ciclo completo raw-touch, posição original, limite de 4dp, cadência de 16ms, persistência por P1/P2, espaço do botão X e isolamento dos demais popups.
- Rodar regressões LT218/LT219/LT220/LT221, testes Node/Java/OTA/Android e verificar assinatura permanente.
- **QA física obrigatória Samsung:** abrir Personalização > Editor Visual, pressionar o cabeçalho `EDITOR VISUAL` (não o X), arrastar para cima/baixo/esquerda/direita como o card Pokémon, soltar, fechar e reabrir. Conferir posição salva, sliders e X clicáveis, nenhuma janela cortada. Repetir em P2 e com os dois menus visíveis.

Versão proposta: LT222 QA `0.02.22` / versionCode `54429`. A LT215 permanece estável pública até homologação.
