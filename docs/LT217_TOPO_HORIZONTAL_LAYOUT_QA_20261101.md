# PokeSearch LT217 — Preset Topo Horizontal e orientações independentes

Data 01/11/2026. Base: LT216 integrada (QA 0.02.16, versionCode 54423). LT215 continua a última versão estável pública.

## Referências visuais fornecidas pelo usuário
- **Antes:** Pokébola com menu **vertical** à esquerda e Pokémon em linha **horizontal** no alto.
- **Depois:** Pokébola no alto à esquerda, menu de ícones em **faixa horizontal ao lado** e resultados Pokémon em **coluna vertical abaixo**.
- Preservar os outros três arranjos disponíveis, sem impor troca do antigo layout à primeira abertura.

## Implementação
- `visual_editor.js`: novo preset **Topo Horizontal**, disponível no Editor Visual em ambas as abas, que aplica `menuOrientation=horizontal` + `resultsOrientation=vertical`, reduz espaços desnecessários e remove offsets anteriores que poderiam deixar as janelas fora de alinhamento.
- Os controles existentes **Menu: Vertical/Horizontal** e **Resultados: Vertical/Horizontal** continuam independentes e editáveis em suas abas; assim são possíveis as quatro combinações.
- Só o toque explícito no preset chama `Native.applyTopHorizontalLayout()`; mudanças individuais de orientação ou presets antigos **não movimentam a Pokébola**.
- `OverlayService`: posiciona Pokébola no alto à esquerda (8dp X, 12dp Y), salva seu novo lugar e ancora resultados logo abaixo, preservando arraste manual depois. O menu horizontal adapta **a largura nativa de toque** à área real que sobra à direita, em vez de saltar para uma linha abaixo nas telas estreitas. O componente de popup/filtros não sofre mudanças.
- P1/P2 continuam isoladas por `overlayPrefs()` (`prefs` e `prefs_secondary`). As configurações visuais já são salvas por instância; nenhuma conta, filtro, Shiny, ordem/visibilidade de menu, alertas, coleta ou cooldown muda.
- Em aparelhos estreitos, a faixa usa o agrupamento `Mais` já existente para não reduzir ícones a alvos de toque inseguros. A imagem horizontal integral é referência de disposição, não promessa de 13 botões lado a lado em todas as larguras.

## QA
- Novo teste Node `lt217-top-horizontal-layout.test.js` protege orientações independentes, 4 combinações, chamada nativa somente ao clicar no preset, posição/salvamento P1/P2 e cálculo da largura útil.
- Reexecutar `lt208-menu-drag-visibility.test.js`, `lt209-favorites-position-drag.test.js`, `overlay-ux.test.js`, Node geral, Java, OTA e Gradle Android.
- **Samsung:** na Pokébola 1, Personalização > Editor Visual > Topo Horizontal; confirmar ícone em cima à esquerda, menus ao lado e Pokémon abaixo. Mover a Pokébola manualmente e fechar/reabrir. Na Pokébola 2 selecionar outra combinação, verificar que P1 não muda. Testar os quatro sentidos, barra superior em telas pequenas, popup, Favorite e resultado 10 spawns.
- Resultado aprovado no CI não substitui homologação física Samsung. Não publicar aos usuários sem validação na tela.

## Distribuição
Preparar APK QA privado LT217 `0.02.17`, versionCode `54424`, assinado com chave permanente, **sem trocar** a release pública LT215.
