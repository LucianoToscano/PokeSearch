# LT219 — revisão das cinco capturas do Samsung: menus e Personalização

**Data:** 01/11/2026. **Base:** LT218 QA `0.02.18`, `54425`. **Release pública:** permanece LT215.

## Evidências recebidas
1. Menu vertical com nove ações à esquerda e três ações (aviso, coração e fechar) em coluna **extra** à direita.
2. Duas instâncias P1/P2 exibem barras independentes simultâneas. Isso pode ser intencional: preservar as contas e os filtros independentes e não forçar que uma Pokébola feche a outra.
3. Painel Modo abrindo ao lado de um menu vertical. Não sobrepor a barra clicável; posicionar popups nativos de acordo com a área livre da tela.
4. Barra horizontal com ícones preservados; Pokémon em disposição por linhas quando dez sprites não cabem de uma vez, sem reduzir os desenhos.
5. Painel de entrada **PERSONALIZAÇÃO** muito próximo do rodapé: cabeçalho visível, conteúdo cortado. Arrastar o Editor Visual também deve continuar possível.

## Origem confirmada no código
- A regra CSS LT218 do menu vertical ainda definia `display:grid` com `grid-template-rows:repeat(12,30px)` e `grid-auto-flow:row`. A colocação automática podia gerar **segunda coluna implícita**, contrariando a hitbox de largura 34dp do Android.
- A função `fit()` do WebView continuava reportando **232px** de altura mesmo após o nativo e a regra CSS LT218 passarem a usar **384dp**. Em alguns estados o menu recebia uma janela menor que seu conteúdo.
- `positionIndependentPopup()` só aplicava o ajuste de tela ao Editor Visual (`visual`), não ao painel que o abre (`appearance`). Assim a janela de Personalização podia permanecer parcialmente fora da tela.

## Implementação LT219
- `dock.html`: em vez de grade com colunas implícitas, menu vertical em **flex column nowrap**, uma única coluna de 12 tiles de **30×30** com gap 2 e janela **34×384dp**, sem alterar cores, arte, botões ou posições salvas. Horizontal mantém o desenho vigente.
- `fit()`: reporta **384px** para orientação vertical, tanto no painel quanto no cálculo do offset da janela. Sem alteração nos limites das buscas, nas espécies ou nas funções de toque.
- `OverlayService.java`: limita a janela nativa de **Personalização** e do **Editor Visual** à área real do display; quando a âncora fica perto do rodapé, usa altura completa no espaço disponível e centraliza a janela. Preserva o arraste e as posições próprias P1/P2 do Editor Visual; não altera posição persistida do menu de entrada.
- Mantidas as quatro combinações independentes de Menu e Resultados, sem redimensionar sprites e sem fechar automaticamente a outra Pokébola.

## Gates
- Novo `app/tests/lt219-single-column-popup-bounds.test.js`.
- Revisados `lt218-orientation-editor-drag.test.js` e `lt218-horizontal-native-layout.test.js` para as dimensões novas e o lançamento completo de Personalização.
- Executar Node LT169, Node QA, QA core LT211, Java LT62, Android/OTA LT173 e APK protegido assinado.
- No Samsung: confirmar **12 ações em 1 coluna**, nenhuma barra extra à direita; popup Modo clicável e Personalização inteira, inclusive ao abrir perto do rodapé. Testar menus P1/P2, edição das duas orientações e arraste do Editor pelo cabeçalho.

**QA prevista:** LT219, `0.02.19`, versionCode `54426`. Sem distribuição no atualizador até teste físico.
