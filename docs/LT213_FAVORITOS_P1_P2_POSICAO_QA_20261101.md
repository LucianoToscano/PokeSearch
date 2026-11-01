# PokeSearch LT213 — Favoritos independentes por Pokébola (QA)

**Base:** LT212 com código na main. **Sem alterações no chat.**
**Objetivo:** corrigir conflito de posição das janelas Favoritos quando as duas Pokébolas estão ativas, sem alterar lista, perfis, buscas nem filtros.

## Problema confirmado no fonte

`PokemonPicker.show()` era chamado por P1 e P2 e salvava as mesmas chaves globais:
`favoritePanelManualV1`, `favoritePanelXV1`, `favoritePanelYV1`,
`favoritePanelScreenWV1`, `favoritePanelScreenHV1`.
Mover o painel em P2 sobrescrevia a posição de P1, e vice-versa.

## Correção

- `OverlayService.showFavoritePicker()` transmite `isSecondaryOverlay()` para o seletor, mantendo âncoras reais da barra de menus.
- Overload `PokemonPicker.show(...,boolean secondaryOverlay)` mantém 100% dos antigos chamadores que usam a versão de sete argumentos como P1.
- `FavoritePanelPositionKeys.key()` permite exclusivamente os cinco atributos de **geometria**. Em P1, retorna o nome existente sem alteração; em P2, acrescenta `P2`.
- Todas as operações de leitura e gravação de posição foram atualizadas (manual, x/y, largura/altura de tela). O arquivo de preferências continua sendo `prefs`; **não** é alterado para `prefs_secondary`, pois a lista de favoritos e os perfis devem continuar compartilhados.
- O painel mantém arraste pela superfície livre, dialog não modal, posicionamento relativo à barra, prevenção de sobreposição salva e botão para fechar. O Chat, Firebase, Doces e Pokémon não foram modificados.

## Testes

- `FavoritePanelPositionKeysTest.java`: P1 legado intacto, P2 com chaves distintas, whitelist, rejeição de alteração de nomes de perfis.
- `lt213-dual-favorites-position.test.js`: verifica em código todos os pontos de leitura/gravação, identidade P2 na chamada nativa e comportamentos anteriores preservados.
- `lt209-favorites-position-drag.test.js`: adaptado para validar o novo uso das chaves sem relaxar arraste, escala e abertura acima/abaixo da barra.
- `qa-core-contracts.yml`: compila o novo helper Java e executa toda a suíte Node e OTA.

## Homologação física pendente

1. Com P1 e P2 abertas, arrastar os Favoritos da P1 até uma posição e fechar. Abrir P2, arrastar para outra posição; fechar.
2. Reabrir ambas individualmente e confirmar **posições diferentes persistidas**.
3. Conferir mesma lista de 50 favoritos/perfis em ambas, sem alteração de Pokémon.
4. Abrir com barra no topo/meio/rodapé, girar a tela e redimensionar fonte; confirmar janela totalmente acessível e sem ocultar barra.
5. Testar botão Favoritos, área livre de arraste, toque fora do painel, fechar/abrir e modo claro/escuro.
6. Testar pesquisa GL/UL/IV de P1 e P2 com sessão real PoGoCoordinates, respeitando 429.

**Gate de release:** depois de Node/Java/Android e teste físico, preparar versão monotônica (> 54419) com assinatura permanente; manter a LT211 no updater até aprovação. Não declarar resultado de aparelho a partir de código.
