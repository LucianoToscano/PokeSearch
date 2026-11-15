# LT352 ARK — Indicador de toque visível e mira sem painéis cinzas

**Base protegida:** release oficial 0.03.47 / versionCode 54554. A LT350 design system continua na PR #385 em *draft* à espera de aceite físico; não mesclar automaticamente.

## Evidência de problema
Nas capturas do Samsung, o seletor de mira ocupa a tela com faixas cinzas de instruções/coordenadas e dois botões enormes Cancelar/Confirmar mira; a pessoa pede apenas ícones brancos sem fundo. No fluxo PGS, o brilho do ponto tocado não é visível. O antigo `PgsAutoTapIndicator` usava um View com `onDraw` mas sem `setWillNotDraw(false)`, dois anéis de baixa opacidade e duração de 380ms — risco de invisibilidade em certas implementações de Android e sobretudo mapa claro.

## Mudanças efetivas
- `PgsAutoTapIndicator.java`: `setWillNotDraw(false)` e `invalidate()` garantem desenho; disco radial ciano translúcido, anéis de 13/25/37dp, centro branco, 960ms com escala/fade. Janela 86dp, `TYPE_ACCESSIBILITY_OVERLAY`, `FLAG_NOT_TOUCHABLE` e `FLAG_NOT_FOCUSABLE`. Perto das bordas, `FLAG_LAYOUT_NO_LIMITS` mantém o centro visual na coordenada sem deslocamento. Continua opt-out por `showTapIndicator`.
- O marcador sinaliza **pedido de gesto aceito pelo Android**, nunca confirma toque/teleporte reconhecido pelo jogo. Também aparece no começo de gesto swipe aceito (modo Encontro); não surge em toque bloqueado, aviso de passageiro ou erro de verificação.
- `PgsAutoMenus.java` e `PgsAutoClickService.java`: botão pequeno de prévia visual do toque no submenu Personalização; desenha no centro da tela **sem disparar gesto**, com texto de diagnóstico e respeitando ON/OFF salvo.
- `PgsAutoTargetPicker.java`: remove escurecimento geral e fundo dos dois textos; coordenadas e orientação sucinta agora brancas com sombra e sem placa. Na base, apenas ✓ esquerdo e × direito em traço branco com sombra, áreas de toque invisíveis de 60dp, descrições de acessibilidade e callbacks `confirmed/cancelled` preservados. Sem barra inferior ou texto de botões.
- Mira visual e arraste continuam, sem guardar ponto antes do ✓. Nenhuma alteração nas fontes de GPS, segurança dos popups ou modelos de sprite.

## Gates e aceitação
Contrato `app/tests/lt352-pgs-touch-feedback-picker-contract.test.js` + LT347 ajustado à duração de 960ms. Executar Node QA, LT169, LT211, Java LT62, OTA LT173, QA do PGS em Android e beta segura/R8. Depois, merge via PR e publicação monotônica protegida 0.03.48 / 54555, desde que todos os gates aplicáveis passem. Não publicar se o workflow falhar. Verificação física **BLOQUEADA** sem aparelho Samsung: visibilidade em fundo claro/escuro, posição exata do gesto, memória, botões com TalkBack, arraste da mira e tratamento de rotação. CI não homologa teleporte/PGSharp.
