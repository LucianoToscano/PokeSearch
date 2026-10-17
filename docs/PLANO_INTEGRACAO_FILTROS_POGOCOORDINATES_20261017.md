# PokeSearch — plano de integração dos filtros do PoGoCoordinates

**Data:** 17/10/2026  
**Estado:** especificação técnica e verificação parcial da interface pública; **sem mudanças de comportamento no aplicativo, sem APK**.  
**Base exata:** `feature/v0.51-launcher-icon-fill-20261016`, commit `3cb02362dbb2bdf76879e44bc221008f831dc4c8`, PR #21 em draft.  
**Regra:** manter o PokeSearch original, 18 imagens normal/Shiny, toolbar horizontal de 12 ações, engrenagem, janela independente de até 10 resultados, cabeçalho de 21×21 px, sessão, favoritos, alertas, coordenadas, despawn, desempenho e limites de consultas. Não misturar com PvPPokeGo; não alterar `main`.

## 1. Evidência e limites da verificação

Fontes usadas: tela pública `https://pogocoordinates.com/search` (conteúdo indexado da página) e duas capturas da interface do usuário, uma em Stats e outra em PvP. O site é dinâmico; **não houve inspeção autenticada do DOM nem validação dos valores internos dos dropdowns**, parâmetros de transporte ou limites VIP. Não marcar como implementado o que só existe visualmente.

| Controle observado | Confiança na existência | Opções/semântica confirmadas | Decisão |
| --- | --- | --- | --- |
| Pokémon / Any Pokemon | Alta | Seleção de espécie; opções completas não verificadas | Preparar seleção opcional; validar opções reais |
| **Sort by (ordenação)** | Alta | Nas capturas: **Despawn (longest)**; autor do site menciona ordenar por despawn, CP e distância, sem comprovar o dropdown completo | **Adicionar seção Ordenação no menu Modos; aplicar e confirmar no site antes de ler os primeiros 10** |
| Shiny only | Alta | Chave ativa/inativa; depende de login/vínculo | PRESERVAR fluxo atual |
| Stats: CP Min/Max | Alta | Campos mínimo/máximo | Avançado Stats |
| Stats: Level Min/Max | Alta | Campos mínimo/máximo | Avançado Stats |
| Stats: % IV Min/Max | Alta | Campos mínimo/máximo | Já existe no app; manter 46 valores atingíveis |
| Stats: Raw IV | Alta | Alternância de % IV para Raw IV | Já existe no app; preservar 0–15 A/D/HP |
| Stats: Weather | Alta | Dropdown Weather/Any; **itens não inspecionados** | Avançado; inicialmente indisponível até confirmar opções |
| Size | Alta | Dropdown / Any; **valores internos não inspecionados** | Filtro geral opcional após leitura dinâmica |
| Form | Alta | Dropdown / Any; **formas dependentes do Pokémon não inspecionadas** | Filtro geral condicional após leitura dinâmica |
| Gender | Alta | Dropdown / Any; **valores internos não inspecionados** | Avançado após leitura dinâmica |
| PvP: League | Alta | Great League e Ultra League aparecem nas telas/app; catálogo completo não verificado | Preservar GL/UL; não inventar Master/Cup |
| PvP: Top ranking | Alta | 1–50 observado no placeholder | Preservar 1–50 inclusivo |
| PvP: Include previous evolutions | Alta | Yes observado | Expor Yes/No só após verificar controle No |
| PvP: Min CP | Alta | Campo Any | Avançado PvP |
| Location | Alta | Area/Coords, latitude/longitude, raio máx. 1000 km | PRESERVAR; não criar ícone novo |
| **Use my location** | Alta | Atalho visível nas capturas; comportamento/consentimento não validado | Aproveitar painel 📍 com permissão explícita; nunca usar em silêncio |
| **Reset** | Alta | Botão visível nas capturas | Considerar opção de limpar apenas filtros de busca, sem apagar Shiny, 📍, favoritos ou preferências sem confirmação |
| **Map** | Alta | Botão visível nas capturas | Tratar como ação de navegação, não filtro; não substituir janela independente nem criar botão extra |
| **Notify Me** | Alta | Botão visível nas capturas | Comparar com sino/favoritos locais; ação remota não presumida ou duplicada |
| **Search** | Alta | Botão de envio visível; já pressionado por `probe.js` depois de validar IV/GL/UL/Shiny/📍 | Preservar envio e cooldown; adicionar confirmação de Sort by e filtros novos |
| **Filter by Stats/PvP** | Alta | Alternância visível nas capturas | Preservar modo original, sem filtro misturado entre abas |
| Advanced VIP | Alta | Seção Advanced VIP | Não copiar funções pagas nem contornar permissões |

**Nota de correção:** a simples existência de Weather **não prova** opções `Com bônus`/`Sem bônus`. Weather pode filtrar condição meteorológica (ex.: Rainy) e não necessariamente o estado de bônus de cada Pokémon. Não oferecer essas duas opções até testar como o site as representa e verificar sua semântica. Um bônus climático depende também do tipo do Pokémon.

### Auditoria complementar: itens antes, depois e fora do bloco de filtros

- **Acima do bloco:** Pokémon e **Sort by** ficaram ausentes/incompletos na primeira matriz. Sort by não é um filtro que elimina Pokémon; altera a prioridade e possivelmente **quais Pokémon entram nos dez primeiros**.
- **Ao lado da localização:** **Use my location** é um atalho da interface, não uma justificativa para obter localização do aparelho sem permissão.
- **Abaixo do formulário:** **Reset**, **Map**, **Notify Me** e **Search** são ações, não filtros. `Search` está implementado; as demais exigem decisão de UX para não duplicar funções nativas.
- **Interface periférica:** link de vincular até 100 contas VIP mostrado no painel Shiny; não implementar gerenciamento de várias contas nem fluxo VIP sem confirmação explícita dos direitos e contrato do site.
- **Recursos anunciados em outras páginas** (feeds salvos, raids, Rocket, mapa mundial, tarefas etc.) não foram verificados como campos da tela `/search`; ficam fora deste plano para não ampliar o escopo sem pedido.
- **Fonte adicional direta do autor**, julho/2026: https://www.reddit.com/r/PoGoSpooferOpenCorner/comments/1v0uuh9/ (afirma busca por espécie/forma, clima, CP, nível, tamanho, gênero, raio; ordenação por tempo de despawn, CP, distância). Confirma famílias de ordenação, **não** enumeração exata nem nomes internos dos valores disponíveis hoje.

## 2. Inventário da base real

- `app/src/main/assets/dock.html`: menu retrátil `renderModeChoices()` tem **4 linhas**: Raw IV, % IV, GL e UL. `renderNumberPicker()` já restringe IV% aos **46** inteiros atingíveis e ranking GL/UL a 1–50. `searchSettings` preserva preferências independentes; `getResultIcon()` seleciona entre os **18 PNGs**, conforme busca confirmada.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java`: `filterConfigJson()`, bridge `setSearchConfig()` e `SharedPreferences` aceitam apenas os filtros atuais. `execute()` injeta configuração no navegador embutido, e o resultado antigo é mantido quando falha a validação.
- `app/src/main/assets/probe.js`: localiza controles por rótulo, aplica Stats/PvP, Raw/%, GL/UL, Shiny e localização; chama `verifyFilters` antes de `submitSearch`. Não há implementação comprovada para Size/Form/Gender/Weather/CP/Level novos **nem configuração/verificação de Sort by no formulário remoto**.
- **Achado crítico na ordenação atual:** `OverlayService.java` declara `private String sort="despawn"`, mas `sortItems()` usa `Long.compare(expiration(a1),expiration(a2))` (menor despawn primeiro, ou seja, **mais cedo**). Isso diverge do `Despawn (longest)` visto na tela do usuário. Existem branches locais `rank`, `iv`, `shiny`, mas não há seletor correspondente na toolbar; é incorreto presumir que esses valores sejam opções do site. `probe.js` extrai somente os **primeiros 10** cartões visíveis via `btns.slice(0,10)`. Portanto, reordenar os 10 no Android **não substitui** configurar Sort by no site antes de coletá-los.
- `app/tests/overlay-ux.test.js` e `app/tests/probe-smoke.test.js`: contratos existentes a preservar, particularmente janela separada, modo e Shiny confirmados, validação e persistência, cooldown.

**Não reconstruir o app e não trocar os 18 ícones.** Os pares de imagens para Sem Filtro, Mestre e Copinha **não** autorizam habilitar modos ainda inexistentes.

## 3. Design compacto (sem ícones extras)

Na janela atual `#choices` do botão de modos:
1. Manter visíveis as quatro linhas Raw IV / % IV / Great League / Ultra League e seus valores compactos. Não criar duplicata IV100/IV0: os valores Raw 15/15/15 e 0/0/0 ou % exatas continuam determinando os ícones existentes.
1a. Sob as quatro linhas, **Ordenar por ▾** como seletor compacto, compartilhado entre Stats/PvP (não botão adicional). Mostrar o rótulo da opção vigente do site após confirmação. Pelo menos `Despawn (longest)` é observado; outras opções precisam da descoberta do dropdown em tempo real. Não pressupor que `CP`, `Distância` etc. tenham exatamente esses nomes na UI atual.
2. Sob as linhas, um bloco compacto opcional com **Pokémon**, **Forma** e **Tamanho**. Mostrar Forma apenas se houver variantes para a espécie selecionada e for possível determinar as opções reais.
3. Um cabeçalho expansível **Filtros avançados ▾** com `Stats: CP Min/Max, Level Min/Max, Weather, Gender` e `PvP: Min CP, Include previous evolutions, Gender` (conforme aba/mode). Não mostrar controles inaplicáveis.
4. `✨` permanece no botão original; localização permanece no próprio `📍`. Os campos neutros usam `Qualquer`/vazio **somente se esse valor for validado no site**.
5. Permitir rolagem interna do painel expandido dentro dos limites de tela, abrir acima/abaixo da engrenagem e não cobrir sprites, não bloquear toques fora do painel, preservar posicionamento e teclado.
6. Botões **✓ Aplicar** e **Cancelar** do menu atual permanecem; Cancelar não persiste alterações.

## 4. Modelo de dados proposto (não aplicado ainda)

```json
{
  "schemaVersion": 2,
  "mode": "raw",
  "shiny": false,
  "sortBy": null,
  "shared": {
    "pokemon": null,
    "form": null,
    "size": null,
    "gender": null,
    "weather": null
  },
  "stats": {
    "cpMin": null, "cpMax": null,
    "levelMin": null, "levelMax": null,
    "attack": 15, "defense": 15, "stamina": 15,
    "percentMin": 0, "percentMax": 100
  },
  "pvp": {
    "gl": {"rank": 1, "minCp": null, "includePreviousEvolutions": true},
    "ul": {"rank": 1, "minCp": null, "includePreviousEvolutions": true}
  }
}
```

- `null` = nenhum filtro adicional requisitado (ou ordenação ainda não escolhida), não é a string literal `Any`. Os valores exatos dos dropdowns vêm de uma detecção controlada em tempo de execução, nunca de valores assumidos.
- `sortBy` deve persistir o **valor semântico validado e o rótulo real do site**; persistir por versão/schema quando necessário. Como o site mostra `Despawn (longest)` na captura, essa opção pode ser usada como preferência inicial **somente após confirmar que ainda existe e que foi aplicada**. A ordenação é compartilhada entre Stats/PvP e não altera a validade dos IVs nem o Top PvP.
- Migrar as preferências legadas sem perdas; ao alternar Raw/%/GL/UL, não apagar o que foi salvo para outro modo.
- Tamanho/forma/sexo/clima são filtros **opcionais e independentes** de Shiny e do ícone; ao mudar espécie, revalidar `form` antes de aplicar.
- Não permitir limites invertidos; validação conforme tipo, sem supor limites máximos de CP, level e tamanhos que não foram confirmados.
- Preservar persistência e estado comprovado da **última busca bem-sucedida**, separado do rascunho pendente.

## 5. Integração técnica — ordem segura

**Etapa A — descoberta sem efeitos colaterais:**
- Adicionar ao `probe.js` ação **somente leitura**, como `describeSearchCapabilities`, para ler presença, visibilidade, controle, itens rotulados e valor atual de `Pokemon / Sort by / Size / Form / Gender / Weather / CP / Level / PvP Min CP / Include previous evolutions`.
- Retornar apenas tipos, nomes e valores de opções de **filtros**. Não coletar ID de treinador, cookies, senha, tokens, coordenadas ou conteúdo de resultados.
- Se houver `select` HTML ou `role=combobox`/lista acessível, ler opções **no estado atual**; nunca inferir de classes CSS frágeis nem apertar `Search` no diagnóstico. Se abrir dropdown modificar página, fechar e restaurar estado antes de terminar.
- Repetir descoberta por modo e por Pokémon, já que opções de Form podem depender do contexto. Registrar matriz das opções reais, incluindo as opções VIP bloqueadas.

**Etapa B — aplicação/validação:**
- Para **Sort by**, localizar dropdown pelo rótulo exato, selecionar somente opção realmente detectada e **confirmar seu valor antes de `submitSearch`**. A leitura do site após a busca também deve conferir a ordenação e a versão do resultado. Em falha: preservar resultados anteriores e avisar, sem fingir que a classificação foi aplicada.
- **Ordem correta:** configurar Sort by no site → executar Search → ler os primeiros 10 já priorizados pelo site → renderizar sem reordenação contraditória. O comparator local deve respeitar exatamente o modo escolhido ou **manter a ordem retornada**. Corrigir separadamente o default local atual (`expiration` ascendente, incompatível com `Despawn (longest)`); comparação por timestamp deve ser estável quando tempo for desconhecido.
- A troca de Sort by que impacte a pesquisa remota deve respeitar `MIN_SEARCH_GAP_MS`; só reordenar resultados locais é aceitável como prévia identificada, nunca como substituto da ordenação remota antes do limite de 10.

- Implementar `configureExtraFilters` e `verifyExtraFilters` em `probe.js`; cada seleção deve ser confirmada por leitura do DOM depois que o site atualizar seu estado.
- Configurar **campos neutros também** ao trocar modos/espécies para impedir vazamento de filtros antigos do site (ex.: Weather antigo afetando IV100). Não usar `Reset` global se isso apagar Shiny/Coords ou outros valores; limpar seletivamente, verificar e depois re-aplicar o modo ativo, Shiny e localização.
- Injetar a validação nova no fluxo `configureSearch → configureLocationAndVerify → verifyShiny → verifyFilters → submitSearch`, com rejeição **fail-closed**: se filtro requisitado não existe, é VIP, está desabilitado, não admite o valor ou não foi confirmado, **não enviar busca** e não apresentar Pokémon incorretos como novos.
- Quando um filtro não suportado estiver inativo, não bloquear os quatro modos existentes. Em falhas, manter resultados anteriores, cabeçalho/ícone/Shiny originais e aviso curto ⚠, sem novas notificações para resultados não validados.

**Etapa C — estado/UI nativa:**
- Estender `filterConfigJson`, validação Java/Bridge e persistência para novos campos **somente após** etapa A comprovar as opções.
- Integrar editores no `dock.html` sem modificar `#controls`, `resultRoot`, `resultGrip`, `resultModeIcon`, gestos ou tamanho de ícones.
- Suportar dados ausentes de forma conservadora. `Weather` é simplesmente a opção real do site, não uma dedução de bônus; uma futura opção de bônus requer suporte verificado específico.
- Manter `MIN_SEARCH_GAP_MS = 60000`, AUTO 5/10/15/20, máximo de 10 sprites e sessão real do PoGoCoordinates. Não automatizar contorno de VIP.

## 6. Testes de aceitação antes de liberar APK

- Abrir/fechar menu avançado nos 4 cantos da tela, com teclado, Android 15/16, alto/baixo DPI; barra original 12 ações sem segunda linha, ícones 21×21 px no cabeçalho, sprites em janela separada arrastável/recolhível.
- Consultas Raw 15/15/15, Raw 0/0/0, Raw IV misto, % 91–100, % 0–0, GL Top 1/50, UL Top 1/50; nenhuma opção inválida de IV% (ex. 3, 90, 95) na grade. GL/UL independentes de %.
- Testar **Sort by** `Despawn (longest)`: primeiros Pokémon devem ter maior tempo restante, não menor; verificar de onde vieram os primeiros 10, não somente a ordem local. Testar outras opções **apenas após enumerá-las na página**. Alternar Stats↔PvP preserva ordenação, opções ausentes não enviam busca, mudanças remotas respeitam cooldown.
- Verificar comportamento e relevância de **Reset, Map, Notify Me, Use my location**, sem duplicar ⚠/📍/🔔/⭐ nem acionar funções remotas inesperadas; conferir login, permissão e retorno ao overlay.
- Seleção de espécie + Form válida, espécie sem Form, alteração de espécie invalidando forma antiga; Size/XXL/XXS apenas se surgirem nas opções reais; Gender e Weather com valor escolhido e confirmado no site.
- Limpar ou desmarcar filtros após consultas anteriores e alternar Stats↔PvP sem reter critérios ocultos. Testar combinações Shiny ON/OFF com login/vínculo e localização ON/OFF.
- Falha de dropdown, campo VIP bloqueado, mudança do DOM, campo desconhecido, filtro incompatível: mostrar aviso e manter último conjunto confirmado, sem notificações falsas.
- Filtros salvos após reinício; Cancelar mantém antigos; histórico, alertas, long press para copiar coords, timer, favoritos, Pix, ⚠, autoatualização e redução da janela continuam funcionando.
- Ampliar `probe-smoke.test.js` com fixtures DOM realistas da seleção e falhas, `overlay-ux.test.js` com regressão visual/contratual. Rodar testes JS, Android lint, `assembleDebug`, teste físico do login/consulta **antes** de declarar implementação concluída.
- **Sem credenciais, códigos de amizade, cookies ou coordenadas completas em logs/relatórios.**

## 7. Resultado desta preparação e pendências

**Confirmado:** grupos de filtros visíveis, **Sort by**, ações Reset/Map/Notify Me/Search/Use my location e arquitetura real do PokeSearch PR #21; IV%, Raw IV e GL/UL já existem no app.  
**Não confirmado:** conteúdo completo do dropdown **Sort by**, valores de controles internos, comportamento exato do filtro Weather, semântica de Form/Size/Gender nos requests, opções VIP e automação real dos novos filtros.  
**Não implementado:** novos filtros no app. Este documento prepara a integração sem alterações em fonte, UI ou APK.  
**Próximo passo técnico obrigatório:** executar descoberta de opções do site em sessão de teste autorizada, sem expor dados pessoais, antes de conectar novos seletores ao fluxo de busca.

Fonte pública: https://pogocoordinates.com/search  
Base GitHub: https://github.com/LucianoToscano/PokeSearch/pull/21
