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

## Complemento LT85 — Pokémon, imagens, filtros e API automática

Solicitação subsequente do proprietário (25/10/2026): faltam sprites/ícones em Pokémon, voltou a aparecer "Usar opções observadas no site", as opções de filtros não estão surgindo para marcar como no site, e API deve funcionar nativamente sem ativação manual.

Mudanças de código reais na mesma branch:
- `api_android_session.js`: `startSuggestions` exibe espécies oficiais do catálogo antes da digitação, busca por nome/número, gera URL do sprite base PokeAPI já usada pelo projeto exclusivamente para espécies padrão sem costume confirmadas no catálogo. Para variantes/costumes não atribui sprite de base indevidamente; `startForms` lista valores de `GET /forms` com cache via cliente original.
- `AuthorizedApiCollector.java`: `forms(query,callback)` utiliza a sessão WebView oficial e entrega somente nomes de formas (não JWT nem reveal_code) ao Android.
- `OverlayService.java`: `requestFilterOptions` no modo API entrega a lista de valores canonizados por contrato para Sort, Clima, Tamanho e Sexo, sem clicar React; pré-carrega formas oficiais no mesmo catálogo. `requestFormOptions` invoca a API via coletor; no modo DOM permanece rotina antiga. Padrão da preferência `authorizedApiQaOptIn` alterado para `true` **somente quando não houver escolha salva**.
- `MainActivity.java`: apresenta a opção "Pesquisa direta pela API (padrão ON; desmarque para usar DOM)", com default habilitado e preservação de escolha anterior.
- `dock.html`: removeu o botão/mensagem recorrente de importar opções do site, mantendo campos e confirmação explícita. As opções de Pokémon passam a ser exibidas mesmo antes de digitação, com imagem padrão validada quando disponível e placeholder para sprites sem correspondência ou indisponíveis.
- `app/tests/lt85-api-native-selectors.test.js`: verifica default/API, ausência da mensagem, imagens padrão, ausência de imagem falsa para Form, escolhas antes de digitação e catálogo de Formas.

O trabalho é **QA e não a versão pública**. Verificar GitHub Actions da branch para evidência de compilação. Mesmo após PASS automatizado, ainda exige demonstração física Samsung e sessões reais autenticadas (Shiny/reveal). Não contornar autenticação, permissões nem rate limits. Não publicar sem autorização distinta.
