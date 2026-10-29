# LT170 QA — Menu Mais (⋯): tamanho e fundo unidos — 29/10/2026

## Regressão observada no Samsung
A captura do menu flutuante de PokeSearch apresenta as três ações verticais **Reportar (⚠), Apoiar (♡), Fechar (×)** com aparência de uma coluna preta contínua, destoando dos demais tiles da barra superior. O usuário informa que já havia sido corrigido anteriormente.

## Causa identificada
- O menu é desenhado em `app/src/main/assets/dock.html` na WebView de popup independente, diferente da WebView com o botão ⋯.
- A regra histórica LT88 `body.controls-window #choices:not(.modeCascade):not(.filterCascade)` continuou incluindo `.morePanel` e repintava o painel inteiro com `--visual-menu-readable-bg`, borda, sombra e blur, **depois** das regras anteriores `background:transparent` da LT62. Havia duas ocorrências desta regra histórica.
- A largura da coluna vinha do fallback 30px no popup independente, porque `getBoundingClientRect().width` do botão ⋯ não existe nele. Os botões podiam ficar discretamente menores/maiores que o botão real.

## Correção isolada
1. Excluir especificamente `.morePanel` e `.periodCompact` da regra genérica de painel de legibilidade, mantendo o contraste para os demais menus.
2. Acrescentar ao final do CSS um contrato para popup comum e independente, popups acima ou abaixo e orientação vertical: raiz da coluna **totalmente transparente** (sem border, fundo ou backdrop blur); as três ações continuam como **tiles separados** com fundo, cor, borda, sombra, gap e altura de 30px iguais aos botões do menu original.
3. O clique no ⋯ envia a **largura real** da sua caixa à ponte Android `openPopupMeasuredWidth`, que apenas na opção `more` repassa o valor à WebView de popup. `window.showNativePopup(kind,width)` aplica esse valor a `--more-tile-width`. Os outros popups continuam pelo método original, sem mudanças em posicionamento, filtros, modos, ações, conta ou coordenadas.
4. Teste `lt170-more-tile-unified-transparent.test.js` cobre a ausência da coluna preta, contrato do tile individual, ponte de largura e três ações originais.

## Governança
- Base de código: `main` após a LT169 oficial (`0.01.69 / versionCode 54374`).
- Implementação em branch isolada `fix/lt170-more-cascade-transparent-equal-tiles-20261029`, para não colidir com PRs LT170 #121 e #122.
- Não alterar assinatura, APK publicado, Firebase, API ou limites de PoGoCoordinates.
- CI Node e Java e teste real no Samsung precisam ser verificados antes de merge/publicação. Nenhuma versão foi distribuída nesta etapa.
