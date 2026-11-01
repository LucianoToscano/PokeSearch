# LT221 — Editor Visual sem botão Voltar cortado

Data: 01/11/2026. Referências: duas imagens de layout horizontal/vertical do usuário e vídeo Samsung de 76 segundos mostrando ajustes de orientação pelo Editor Visual.

## Estado do vídeo
- O menu horizontal e os Pokémon verticais já podem coexistir. A troca de orientação funciona sem redimensionar os ícones originais.
- As imagens de referência representam as duas combinações opostas: menu vertical + Pokémon horizontais, e menu horizontal + Pokémon verticais.
- No final do vídeo, em **04:17**, a janela Editor Visual aparece com botão **Voltar cortado pela borda inferior**, embora haja bastante espaço livre para baixo da janela. Não é necessário aumentar os ícones do dock nem alterar sprites para corrigir.
- Causa no código: `fit()` do `dock.html` enviava `resizePopup(... Math.min(450, naturalHeight))`; `OverlayService.resizeIndependentPopup()` também limitava **todos** os popups a 450dp. O Editor Visual contém mais controles que essa altura.

## Correção focal LT221
- Apenas quando `choiceOpen="visual"`, o WebView solicita até 740dp de altura natural. Outros popups seguem limitados a 450dp.
- A camada Android usa `visualMax=min(740,screenHeightDp()-16)`; não ultrapassa os limites da tela e mantém a proteção de `positionIndependentPopup`.
- `window.setNativePopupRoom` aceita espaço ampliado somente para o Editor Visual. `overflow-y:auto` continua disponível **apenas quando o display realmente não comporta o editor inteiro**.
- Botão de fechar, cabeçalho arrastável, posição independente por Pokébola e controles dos sliders são preservados.
- Não alterar posições/tamanhos originais de sprites/menus nem os quatro pares possíveis de orientação.

## Testes
- Teste Node `app/tests/lt221-visual-editor-full-height.test.js` verifica limite dinâmico por tipo de popup, teto físico, navegação e arraste.
- Executar demais gates Node, Java, Android/OTA e build assinado LT221 QA `0.02.21`/`54428`.
- QA Samsung: abrir Editor Visual com aba **Menu**, expandir Posição do menu, verificar que **Voltar** é totalmente visível sem rolagem quando houver altura livre, arrastar pelo cabeçalho, repetir na aba Pokémon e com os menus em ambas as orientações. Em paisagem / teclado aberto, o conteúdo pode rolar internamente, sem escapar da tela.
- Testar também a Personalização principal, Localização, Modo e Favoritos (nenhum deles muda tamanho por este patch).

Versão pública permanece LT215 enquanto a LT221 passa por homologação física.
