# PokeSearch LT85 — Toque repetido nos menus (QA, 25/10/2026)

> **O APK público não foi alterado.** Última versão oficial: LT83 `0.00.83` / `54286`. LT84 é QA de integração API e LT85 corrige comportamento de menus sobre a base LT84. A publicação da LT85 não foi autorizada.

## Sintoma relatado no Samsung
O proprietário informou: **"Os menus. Quando clico neles novamente.. eles nao estao minimizando"**. A lista de menus usa um WebView de toolbar e outro WebView de popup (WindowManager), enquanto Favoritos é um Dialog nativo não modal.

## Diagnóstico do código
- `dock.html`: `toggleChoices()` antes escolhia abrir/fechar usando `activeNativePopupKind` mantido no JavaScript do toolbar e modificado de modo otimista, enquanto o estado verdadeiro é `popupKind` em `OverlayService.java`. Um callback atrasado de outro WebView pode desincronizar a escolha do segundo clique. Não afirmar que esse foi o único motivo físico sem nova evidência.
- `OverlayService.java` já tinha `if(kind.equals(popupKind)){closeIndependentPopup();return;}`; mas a lógica antiga do toolbar podia não invocar o método nativo correto no segundo toque.
- O tratamento de `MotionEvent.ACTION_OUTSIDE` em janelas separadas pode fechar o popup ao iniciar um toque no ícone, e o `click` daquele mesmo gesto pode abri-lo de novo. Foi adicionada uma proteção limitada a 450 ms para consumir esse clique somente quando o submenu recém-fechado e o ícone acionado são o mesmo, sem bloquear a troca para outro submenu.
- Favoritos (`PokemonPicker`) é um Dialog separado; `showFavoritePicker()` simplesmente retornava quando `pickerOpen=true` e não tinha referência para fechar no toque repetido.

## Implementação na branch
- `dock.html`: todos os toques dos menus independentes (Modos, Filtros, Localização, Pokémon, Alertas, Aparência, Mais) vão ao mesmo toggle nativo, sem decisão por estado local possivelmente defasado. Apenas o callback nativo atualiza a indicação de popup ativo e os atributos de acessibilidade `aria-expanded`. O menu anterior permanece fechado na troca para outro.
- `PokemonPicker.java`: método existente de cinco argumentos passa a retornar `Dialog` sem mudar as chamadas anteriores; `null` sinaliza catálogo vazio, preservando aviso existente.
- `OverlayService.java`: guardar referência ao dialog de Favoritos para fechá-lo ao tocar novamente ⭐; limpar ponteiro em `onDismiss`, no catálogo vazio e ao destruir o serviço.
- Sem mudanças nas coordenadas, filtros, interface desenhada, dimensões dos ícones, preferências, API, aplicação, assinatura ou funções preexistentes.

## Testes
- Novo teste `app/tests/lt85-menu-repeat-tap.test.js` verifica 7 menus com abrir → fechar → reabrir → fechar e estado JavaScript atrasado, além de invariantes do toggle nativo, fechamento do Dialog Favoritos e sintaxe de todos os scripts `dock.html`.
- Workflow `.github/workflows/lt85-menu-repeat-tap-signed-qa.yml`: JavaScript histórico LT77–LT85, testes Java, `assembleRelease` com R8, aapt package `com.lucianotoscano.pokesearch`, `versionName 0.00.85` e `versionCode 54288`; SHA-256/certificado permanente/v2 e artifact privado de QA. **Verificar resultado e logs antes de declarar PASS.**
- Último estado oficial LT83; QA no Samsung de LT84/LT85 ainda pendente. Em particular testar mudança e repetição com menus perto das bordas, teclado aberto, popup horizontal e vertical, Favoritos e toque no fundo fora do menu.

## Entrega e autorização
- Branch: `fix/lt85-menu-repeat-tap-20261025`, criada do HEAD `ba67c59fa9337f4145469f6599ee626eceff990c` da LT84 QA.
- Build LT85 / 54288 **somente QA**. Não alterar GitHub Release latest, manifesto Drive legado, PR #59, `main` ou certificado de assinatura.
- Homologação física continua pendente até usuário testar APK no Samsung. Todo registro no Guia Mestre deve ser **append** do arquivo completo de mais de 1,4 MB; não usar retorno vazio/truncado do conector como conteúdo original.
