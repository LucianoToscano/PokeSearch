# LT347 ARK — Buscar Pokémon: menu correto e indicador sutil de toque

**Base verificada:** LT346 oficial, versão 0.03.44 / 54551, `main` `bc1cd460cef12a7e59d752cb956c8db0f46553fd`.

## Diagnóstico do erro de aparência
Na captura apresentada, o menu correto é uma fileira de tiles independentes, com ícones centralizados, e o errado é a barra escura única de cinco botões do PGS. A origem foi localizada em `PgsAutoMenus`: célula 38dp, altura 46dp, cápsula própria e `menuAlphaPercent` inicial 90%, que ignorava a configuração já salva `prefs.visualPrefsJson` (`menuTransparency=50`, `menuBgMode=dark` e `menuOrientation=horizontal`).

## Implementação
- `PgsAutoMenuStyle.java` compartilha diretamente a fonte de preferência canônica da Pokébola 1 (`prefs.visualPrefsJson`), preservando o JSON original da solicitação em `docs/LT347_MENU_VISUAL_REFERENCE.json`. **Não grava nem apaga as configurações dos outros overlays.**
- A barra Buscar Pokémon agora espelha os tiles concretos do `dock.html`: 30dp de célula, 16dp de arte, espaçamento base 2dp, raio 5dp e `#28292cce` no tema escuro com transparência 50; sem cápsula. A escolha vertical/horizontal, opacidade, offsets, gap, tema e blur são derivados do mesmo Editor Visual. Desfoque nativo depende do suporte Android.
- `OverlayQuickMenus.panelColor` permanece a fonte compartilhada para preenchimento legível dos submenus; Popup Width é usado como limite, não como tamanho obrigatório de todos os popups. Os botões PGS mantêm os mesmos recursos de lupa, relógio, sino com Shiny **dentro** do contorno, personalização engrenagem+lápis e X.
- A seção de aparência do PGS não oferece mais uma opacidade conflitante: mantém ícones P/M/G, contadores e opção **Mostrar local do toque**, ligada por padrão.
- `PgsAutoTapIndicator.java` desenha círculo discreto branco/ciano, transparente e sem interceptar toque (`FLAG_NOT_TOUCHABLE`) por 380ms no local real pedido ao Android, tanto para sprites quanto para ponto específico/PokéStop/Encontro. O desenho é removido ao fechar e no `onDestroy`. **Não certifica que o jogo reagiu, que houve teleporte, ou que um encontro foi iniciado.**
- Teste LT343 de contrato antigo revisado para confirmar que o slider independente foi removido, em vez de bloquear a correção visual; teste novo LT347 verifica JSON, ligação canônica, tiles e segurança do toque.

## Aceitação
Rodar Node QA, LT169, LT211, Java LT62, OTA LT173, PGS Android QA e beta R8 Secure, e só preparar publicação monotônica quando passar. Testes visuais físicos de transparência em fundos claros/escuros, dimensões, menus, clique, ancoragem, rotação, minimização, acesso ao popup e gestos no Samsung seguem **BLOQUEADOS** sem prova real. Google/Discord OAuth externo, teleporte PGSharp, detecção Shiny, cena de Encontro e efeito no jogo não são homologáveis por CI.
