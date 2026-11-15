# LT349b — complementação antes da release 0.03.47

Registro de correções adicionais solicitadas em 14/11/2026, posterior ao merge da implementação LT349 PR #382 e **anterior à publicação protegida da 0.03.47**.

## Busca Pokémon — menu da bolha Auto Click
O menu principal de cinco tiles é **lateral** à bolha, seguindo a regra de encaixe da Pokébola 1/2: preferência pelo lado livre conforme metade da tela, inversão automática à direita/esquerda quando uma borda impede abertura, e fallback acima/abaixo **somente** quando nenhum lado comporta o menu completo. Preserva os valores `visualPrefsJson` de offsets/tema/transparência e geometria de 30dp dos ícones. A janela do submenu permanece ligada à barra após rotação e arraste; a posição é recalculada de forma absoluta, inclusive ao trocar de lado, sem reaproveitar deslocamento antigo. A barra não desaparece quando abre submenu, toques fora do popup permanecem livres; estado dos filtros e busca não é afetado.

## Scanner — alça do recorte
O `drawMoveHandle()` em `PgsAutoCropSelection` desenha **apenas** quatro setas finas e brancas, **sem** círculo preenchido, anel, fundo ou halo. Não altera a área de toque invisível de 22dp nem a lógica de arrastar, lupa, barra lateral, recorte Vertical 3:4 e confirmação manual.

## Gate
Novo teste `app/tests/lt349b-pgs-side-menu-white-crop-handle.test.js`. Exigir Node/Java/Android/OTA/QA PGS/R8 e integração antes de mesclar PR de release `0.03.47 / 54554`. Nenhuma homologação física Samsung/PGSharp foi executada; menu lateral, tocar fora, Shiny e recorte permanecem **BLOQUEADOS** para aceite físico.
