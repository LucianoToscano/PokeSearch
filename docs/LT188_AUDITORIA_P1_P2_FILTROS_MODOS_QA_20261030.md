# LT188 QA — Auditoria dos filtros e modos das duas Pokébolas (30/10/2026)

Base: **LT187 pública 0.01.87 / 54392**. Esta etapa é apenas branch/PR de QA; não altera a Release/latest nem o APK do Drive.

## Evidências do proprietário
- Captura 1: GL/UL apresenta Ordenar, Clima, Tamanho, Sexo, Forma, PC PvP e Evoluções; **não apresenta PC normal nem Nível**. No modo sem liga estes campos aparecem e mudam de posição.
- Captura 2: ao escolher IV personalizado **0/13/13** ou IV% depois de UL, a interface pode continuar mostrando **Rank UL e resultados anteriores**. Há uma indicação Android **Network Error**, mas a captura isolada não permite atribuir sua causa ao aplicativo ou à API.
- Os dois overlays estão ativos simultaneamente e exibem listas e menus próprios.

## Causa no código e correções propostas
1. **dock.html**: `renderExtraFilters` escondia PC e Nível para `gl/ul`; agora ambos ficam imediatamente após Ordenar, na mesma ordem dos modos Raw/IV%. PC PvP e Evoluções continuam adicionais apenas para ligas. Validação Min/Max e contador também contam os filtros normais em GL/UL.
2. **probe.js**: `extraNumberKeys()` incluía apenas `minPvpCp` em GL/UL, ignorando silenciosamente PC e Nível; agora aplica/valida os quatro campos comuns junto ao mínimo PvP, usando controles reais do site e falhando de modo fechado se o site não os expuser. Não inventar resultado ou afirmar pesquisa confirmada sem resposta.
3. **OverlayService.java**: `setSearchConfig`, `select` e `cycleMode` usavam resultados da seleção anterior quando não havia preview do filtro novo. A nova `restoreMatchingFilterPreview` conserva **somente prévias do mesmo filtro**; sem correspondência, limpa linhas e ícone antigo antes da busca, de modo que a interface não fique identificada como UL quando já foi escolhido Raw/IV%.
4. **API**: contrato já aceita `cp_min/max`, `level_min/max` e `pvp_min_cp` simultaneamente com GL/UL. Foi corrigido também o vazamento de um `minPvpCp` salvo da liga anterior para o payload Raw IV/IV%: fora das ligas o campo é `null`. Sem nova autorização, bypass de login ou alteração de cap.
5. **Paridade**: `SecondaryOverlayService extends OverlayService`; ambos executam os mesmos assets e rotinas de filtros, preservando `prefs` e `prefs_secondary` separadas. Nenhum token, favorito ou preferência da P2 foi copiado para a P1.

## Matriz de auditoria — sem presumir homologação física

| Área | Controle e expectativa | Situação nesta PR |
|---|---|---|
| Modos 100%, 0%, Raw, IV%, GL, UL | Aplicação atômica, indicadores e payload corretos; P1/P2 independentes | Correção de indicadores antigos; testes Node de payload e transição |
| Filtros gerais | Ordenar, PC, Nível, Clima, Tamanho, Sexo, Forma em ordem constante, inclusive GL/UL | Correção de menu e envio/validação DOM/API |
| Filtros exclusivos PvP | PC mínimo PvP, evoluções anteriores, liga e top #1–50 | Preservados, PC PvP não substitui PC normal |
| Pesquisa API e site DOM | Resultado só após confirmação de critérios; erros 401/403/429/redes reportados | Caminhos revisados; interação com servidor **não homologada** |
| Resultados e ícones | Nunca identificar resultados de outra pesquisa como 0/13/13 ou IV% novo | Nova limpeza controlada de resultados/ícone sem preview correspondente |
| Shiny, localização e distância | Guardas de autenticação, coordenadas, raio, sort Distance | Sem alteração; revisão de regressão de código/QA pré-existente |
| Sprites, detalhes, despawn | Cache e TTL devem manter identidade do encontro | Sem alteração; ainda requer QA físico P1/P2 |
| Favoritos/alertas e sons | Compartilhamento previsto de listas, isolamento das filas e avisos | Sem alteração; regressão LT112/LT184 no CI |
| Recarga e duplo overlay | Refresh manual, automático, estados próprios e sem busca duplicada | Debounce e geração preservados; teste Android real pendente |
| Doce Raro, OTA, Home e Discord | Evitar regressões de UI, serviço e autenticação | Não alterados nesta PR; QA físico necessário |

## Testes exigidos

- `app/tests/lt188-dual-mode-filters.test.js` acrescentado à suíte obrigatória de PR Node.
- `app/tests/overlay-ux.test.js` atualizado para verificar a regra correta: não preservar sprites/ícones de outro filtro.
- Manter `lt112-dual-overlay-parity.test.js`, `probe-smoke.test.js`, `lt108-filter-application-audit.test.js`, `lt77-api-contract.test.js` e compilação Android no CI.
- P1 Raw 0/13/13 → UL#5 → IV% 75–95 → GL#1; P2 permanecer 0% durante todo o percurso. Repetir invertendo instâncias.
- Testar P1 GL com PC 400–1400, Nível 4–33 e PC PvP 100; sem UI do provedor para CP/Level no tab PvP, **notificar campo não confirmável** e não retornar resultados incorretos.
- Testar falha de internet, retorno 401/403/429 e recuperação por ↻. Sem rede, não declarar filtro aplicado nem conservar rank de outra seleção.
- Verificar layout dos menus em Android Samsung físico, duas barras abertas, diálogos, scroll, transparência e toques.

**Gate de publicação:** não fazer merge, liberar APK, tocar no Google Drive/Release/latest ou marcar como homologado sem QA satisfatório e autorização expressa do proprietário. LT187 permanece a oficial.
