# PokeSearch — ARQUIVO MESTRE v0.51-beta (estado atualizado em 17/10/2026)

> **Documento oficial para continuidade do desenvolvimento.** Neste projeto, preservar sempre a última base estável, trabalhar por etapas e não misturar mudanças das branches de v0.52–v0.56, que foram descartadas como direção de UX. A regra de design é: **melhorar e organizar, nunca empobrecer**.

## 1. Identificação e estado verificável

- Repositório: **LucianoToscano/PokeSearch** (não confundir nem misturar com o app/repositório **PvPPokeGo**).
- Base original RESTAURADA na branch **`main`**: commit `493a333186eb7b012d883b4766609830cd828eb0`; árvore de código equivalente ao backup `backup/v0.51-beta-before-customization-20261015` (commit `d2eb0262a1d2418aa7cc958bf6a6c47149300767`).
- Branch ativa das melhorias por etapas: **`feature/v0.51-launcher-icon-fill-20261016`**. Ponto de referência anterior dos 18 PNGs: `4e159d9dccc23d7b0d482e49c3973b73e0be16d3`. Em 17/10 foram adicionados filtros configuráveis mediante pedido (commits posteriores); **sempre consultar o HEAD antes de novas gravações**.
- Pull request em **draft**: [PR #21](https://github.com/LucianoToscano/PokeSearch/pull/21), **sem merge na main**.
- `applicationId`: `com.lucianotoscano.pokesearch`; `namespace`: `com.lucianotoscano.pokesearchoverlay`.
- Versão ainda **`versionCode 51` / `versionName "0.51-beta"`**. minSdk 26; targetSdk 33; compileSdk 36; JDK 17; Gradle 8.11.1; AGP 8.10.1.
- CI referente ao commit `4e159d9d...`: **Build PokeSearch Android APK** run `39001104397` e **Secure beta APK (private test)** run `39001104344`, ambos **success**. Isso confirma compilação, **não** valida interação real com Pokémon GO/PoGoCoordinates ou aparência no Android.
- APK de teste gerado em etapa anterior e enviado ao Drive, mas **verificar SHA/commit antes de reenviar**: APKs de commits anteriores podem não incluir os 18 ícones atualizados e tamanho de 21px. Não afirmar que um link antigo contém o HEAD atual sem confirmação.

## 2. Diretrizes fixas de UX

- Estética original: **minimalista, clean, simétrica, compacta, delicada, elegante, transparente e intuitiva**. Não criar painéis grandes, margens vazias, linhas duplas, molduras desnecessárias, menus duplicados ou funções visuais que não operem de verdade.
- **Engrenagem** controla/exibe o **menu original compacto** de 12 funções e pode ser arrastada; **não deve carregar sprites na mesma janela**.
- **Resultados de Pokémon** devem permanecer em **outra janela flutuante nativa**, independente da engrenagem e do menu, com fundo transparente, até **10 Pokémon**, mesmo se só houver uma pesquisa.
- O ícone no topo da janela dos resultados indica a busca ativa. **Toque curto** recolhe/expande somente os resultados; **arrastar** esse ícone move apenas a janela de resultados. Posição `resultsX`/`resultsY` e colapso `resultsCollapsed` são persistidos.
- O cabeçalho do resultado **não deve ser maior que a engrenagem**. **Estado atual no código**: `body.result-window #resultHeader` com área de 35 × 30 px; arte PNG dentro com **21 × 21 px**, para corresponder visualmente ao ícone da engrenagem. Inspecionar no dispositivo antes de declarar aprovado.
- Ao mudar P/M/G, redimensionar apenas a lista/sprites e respeitar a engrenagem; ao abrir login, favoritos, minimizar ou fechar, ocultar/restaurar/destruir a janela independente sem perder seus dados nem posição.
- Preservar clique no sprite para detalhes, toque longo para coordenadas, temporizador de despawn, notificações, favoritos e demais funções originais.

## 3. Os 18 ícones OFICIAIS — mapeamento completo

**Fonte:** pasta do Google Drive `03_Icones_Ligas` (folder ID `1YkY3WQIirk1m9Ko8c2rLBuye6agnTbI7`). Na conferência atual, contém **18 arquivos PNG de busca** (9 famílias × normal/Shiny), além da subpasta `Icones_Bandeira_Liga`. Arquivos de referência e variantes antigas não representam novos modos de busca.

**Tamanho confirmado no código:** o ícone do cabeçalho de resultados é **21 × 21 px**, igual ao SVG da engrenagem; a área clicável é **35 × 30 px**. Os arquivos padronizados em 512 px são os recursos de imagem, não o tamanho exibido na tela.

**Atualização comprovada no GitHub:** commit `4e159d9dccc23d7b0d482e49c3973b73e0be16d3`, mensagem `assets: replace 18 result icons with updated standardized 512px PNGs from Drive`. Arquivos offline em `app/src/main/assets/result-icons/`. **Não substituir por imagens genéricas, referências da web ou reproduções**. Quando o usuário atualizar o Drive, comparar a versão atual e trocar os PNGs reais.

| Categoria da busca | Normal | Shiny Only ativo |
|---|---|---|
| Sem filtro | `none.png` | `none-shiny.png` |
| Raw IV personalizado (preenchimento manual) | `custom.png` | `custom-shiny.png` |
| IV por porcentagem | `percent.png` | `percent-shiny.png` |
| IV100 / Hundo | `hundo.png` | `shundo.png` |
| IV0 / Nundo | `nundo.png` | `shnundo.png` |
| Great League / GL | `great-league.png` | `great-league-shiny.png` |
| Ultra League / UL | `ultra-league.png` | `ultra-league-shiny.png` |
| Master League | `master-league.png` | `master-league-shiny.png` |
| Cup League | `cup-league.png` | `cup-league-shiny.png` |

- Mapeamento implementado em `app/src/main/assets/dock.html`, objetos `RESULT_ICONS`, `RESULT_MODE_ALIASES`, função `getResultIcon(searchMode,shinyActive)`. Escolher pela **busca realmente aplicada**, com a variante Shiny somente quando o site confirmar `Shiny only`.
- **Evolução de 17/10 por pedido explícito:** a v0.51 preserva IV100 e passa a oferecer **Raw IV A/D/S (0–15 cada), Great League Top ranking (1–50), Ultra League Top ranking (1–50) e IV% Min/Max (0–100)**. Os demais ícones **não** habilitam buscas adicionais (Sem filtro, IV0, Mestre ou Cup permanecem não implementados).
- Alterar o tipo de busca deve substituir somente o ícone superior. Recolher/expandir não deve alterar os filtros nem o estado do Shiny.
- A atualização dos ícones **não** autoriza implementar todos os modos na mesma etapa. Um recurso novo só entra com pedido explícito, código real, validação e respeito à UX original.

## 4. Código relevante e funcionalidades originais

- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java`: serviço de overlay Android; `root`/engrenagem; `menuRoot` menu; `resultRoot`/`resultPanel`/`resultParams` resultados; `resultGrip` toque/arraste do ícone; `toggleResultsCollapsed`; `resizeResults`; preferências de posição/tamanho; tratamento de login, favoritos e ciclo de vida.
- `app/src/main/assets/dock.html`: layout transparente/compacto; modo `?results=1` desenha sprites na janela independente; `?controls=1` desenha controles; modo padrão desenha a engrenagem; título/PNG do cabeçalho e resposta ao estado Shiny.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java`: tela inicial e entrada de login; preservar retorno ao app e sessão persistente sem exibir o site além do necessário.
- `app/src/main/assets/probe.js`: consulta real ao PoGoCoordinates; não simular/assumir filtros aplicados; respeitar limites de atualização e login requerido para Shiny.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java`/favoritos; manter lista, alertas e funções existentes.
- `app/scripts/RoundIcon.java`, `app/build.gradle.kts`, `app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`: ícone do aplicativo foi ampliado e configurado como ícone adaptativo, **diferente do pequeno ícone do cabeçalho da lista**. Nunca confundir os dois tamanhos.
- Regras de distribuição seguras da v0.51: minify/shrink no release, preservação `JavascriptInterface`, `FLAG_SECURE` no login, verificações de integridade e proibição de distribuir senhas/keystore, mapping ou fontes aos amigos. Certificado temporário de CI pode diferir entre builds; desinstalar pode apagar dados locais.

## 5. Backups e separação das versões

- Base v0.51 restaurada em `main`, sem código posterior.
- Backups relevantes: `backup/v0.51-beta-before-customization-20261015`; `backup/main-before-v051-restore-20261016`; demais `backup/v0.52...`, `backup/v0.53...`, `backup/v0.54...`, `backup/v0.55...` podem existir para consulta histórica, **não** são base de desenvolvimento atual.
- Branch ativa `feature/v0.51-launcher-icon-fill-20261016`, PR #21 aberto e em rascunho. Evitar merge automático na `main` e evitar gerar APK após toda pequena alteração. Compilar **quando o usuário pedir**; neste histórico ele autorizou um APK para conferir os 18 ícones.

## 6. Pendências reais e próxima etapa

1. **Testar no dispositivo Android** a aparência e o toque do ícone superior de **21px**, a separação real entre engrenagem e lista, arraste, salvar posição, recolher/expandir, P/M/G, sprites, login, favoritos e toque longo de coordenadas. Compilação não prova essas ações.
2. Confirmar que o APK que for apresentado para download contém o **commit `4e159d9d...` ou posterior**, com os 18 ícones atualizados. Não reaproveitar links de APK anterior como se contivessem a nova arte.
3. Verificar a seleção Hundo/Shundo e GL/UL normal/Shiny **a partir do estado confirmado do site**, não apenas do toque no botão de brilho.
4. **Não inventar filtros** apenas porque seus ícones existem. Raw IV e IV% foram autorizados e conectados ao probe na nova etapa; IV0, Sem filtro, Master e Cup continuam apenas com ícones, não implementados na base v0.51.
5. Próximas mudanças de UX somente uma por vez, com aprovação; preservar design compacto original e testar antes de concluir. Recursos planejados e rejeitados das versões v0.52–v0.56 não devem ser mesclados involuntariamente.

## 6.1. Etapa de Modos configuráveis — pedido de 17/10/2026 (somente código-fonte)

**Escopo exato solicitado:** dentro do menu original `Modos`, sem uma nova barra ou janela de resultados, acrescentar seletores de:
- **Raw IV:** Ataque ▾, Defesa ▾ e HP/Stamina ▾, cada um de **0 a 15**.
- **Great League:** campo **Top ranking ▾ de 1 a 50** (limite máximo, não rank exato obrigatório).
- **Ultra League:** mesmo seletor independente de **1 a 50**.
- **IV% Min e IV% Max:** cada um de **0 a 100%**, obrigatoriamente Min ≤ Max.
- **IV100 original** permanece acessível. **Shiny** permanece controle independente e requer confirmação do site.

**Implementado na branch de trabalho e PR #21, sem merge manual:**
1. `app/src/main/assets/dock.html`: submenu de Modos compacto, com seleção numérica e confirmação em **Aplicar**; sem aumentar os 12 botões da barra. Valores em edição não alteram a pesquisa até Aplicar. O ícone dos resultados para Raw IV utiliza `custom.png`/`custom-shiny.png`, e % utiliza `percent.png`/`percent-shiny.png`.
2. `OverlayService.java`: `setSearchConfig` valida limites e modo de maneira atômica; valores separados para GL e UL, parâmetros preservados por preferências e enviados com a busca. Mudanças respeitam o intervalo mínimo de rede original. **Nenhum novo modo simultâneo**.
3. `probe.js`: configura Raw IV, IV percentual e Top ranking no formulário do PoGoCoordinates, verifica valores antes de enviar `Search` e filtra resultados conforme o modo aplicado. Nos PvP Top N, não inventa um rank individual quando o cartão não o exibe; registra limite verificado à parte.
4. `app/tests/overlay-ux.test.js` e `app/tests/probe-smoke.test.js`: código de regressão atualizado para faixas 0–15, 1–50 e 0–100, persistência, verificações e alertas.

**Riscos/pendências honestas:** nenhuma compilação **manual** foi solicitada nesta etapa. Porém os workflows legados iniciaram **automaticamente** após os primeiros pushes ao PR #21; os runs `39002374134` (Build PokeSearch Android APK) e `39002374083` (Secure beta APK), referentes ao commit `8510f341...`, foram concluídos com **success**. Para respeitar a regra daqui em diante, ambos os workflows ganharam uma guarda em nível de job **somente para esta branch**, com execução por `workflow_dispatch` explícito; não remover a guarda sem autorização. Não houve teste físico Android. O formulário do site é dinâmico; quando a aba Raw IV exibir **seis campos** sem rótulos por atributo, o script não deve adivinhar associações para valores A/D/S diferentes: deve falhar com diagnóstico até ser verificado no aparelho/site. Validar também o comportamento de abas, listas longas e rankings acima de 1, as notificações e o Shiny. Os testes de fonte passaram nos runs de CI citados, mas isso **não substitui** testes interativos em Android/PoGoCoordinates. Os artefatos desses builds automáticos **não devem ser distribuídos** sem pedido explícito.

---
## 6.2. Correção do menu Modos — 17/10/2026, após teste em APK

**Sintoma relatado:** "O menu modo tá bugado", sem imagem ou descrição específica do gesto. A inspeção do código identificou uma causa reproduzível na geometria: a janela Android de controles crescia ao abrir o seletor e sua posição Y era limitada pela nova altura, deslocando **também a barra de 12 botões**. Isso podia desalinhar os toques do usuário e colocar o menu longe da engrenagem. A tela numérica de 0–100 também redesenhava o painel perdendo a rolagem.

**Alterações na mesma branch do PR #21:**
- `OverlayService.updateMenuPosition()`: fixa a barra horizontal junto da engrenagem; o popup ocupa espaço acima ou abaixo conforme o espaço disponível. Não move mais a engrenagem ao expandir o popup, não cria folga fictícia entre resultados e menu; calcula a área interativa real e limites da tela. `setMenuPopupPlacement(above,offset,room)` sincroniza a posição do HTML com a janela nativa.
- `dock.html`: altura estável do popup Modos (270px dentro do espaço disponível), rolagem interna, botões Aplicar/Cancelar em rodapé visível; lista numérica mantém o valor selecionado próximo da região visível e, ao voltar, restaura a rolagem do menu; `fit()` usa altura de popup independentemente da orientação acima/abaixo. Guarda `--popup-room` inicial para não bloquear a abertura.
- `app/tests/overlay-ux.test.js`: expectativas antigas que exigiam deslocamento do dock foram substituídas por verificações para o novo posicionamento, dimensões, faixa, valores e persistência.
- **Validação feita:** verificação de sintaxe em `dock.html` (JS embutido), `probe.js` e dois scripts de teste. **Não** é validação de dispositivo nem execução integral dos testes Android.

**Restrições:** não compilar APK novo até solicitação explícita, não executar merge, não substituir os 18 ícones, não adotar UX v0.52–v0.56. Manter a branch `feature/v0.51-launcher-icon-fill-20261016` e o PR #21 em draft. O APK entregue no chat anteriormente **não inclui** esta correção; solicitar uma compilação somente quando o usuário quiser instalar a revisão.

---
## 6.3. APK do menu Modos corrigido — compilação autorizada em 17/10/2026

- **Pedido expresso:** "Gere" após a correção do bug do menu.
- O build seguro da v0.51-beta foi acionado temporariamente na branch de desenvolvimento; workflow **Secure beta APK (private test)** run **39003347655**, resultado **success**.
- **Código exato do APK:** commit `94200831124928c493621993838a5583b7ba037c`, que contém as correções de popup/scroll e testes. Os commits posteriores apenas restauraram a regra de CI, sem alterar o código do APK.
- APK extraído do artefato GitHub **12089714003**, `PokeSearch-0.51-beta.apk`, tamanho **938953 bytes**, SHA-256 **`def8b11c1002f4444c47940f4c3fcc795a2bab3bc082fa1ed33af3b38e331958`**.
- O ZIP contém um APK cuja integridade foi verificada e que inclui os **18 result-icons PNG**.
- **Proteção de CI restaurada** após o build: novos pushes ao PR #21 não devem compilar APK sem novo pedido. `main` não sofreu merge.
- **Pendente:** testar menu no Android. O build de teste usa assinatura temporária de CI: instalar sobre APK anterior pode falhar caso as assinaturas sejam diferentes; desinstalar remove configurações locais.

---
## 6.4. Compactação do menu Modos e IV100 automático — 17/10/2026

**Pedido:** remover a linha "100% · IV perfeito" por ser redundante com Raw IV 15/15/15; reposicionar **% IV imediatamente abaixo de Raw IV**; deixar o menu **bem mais compacto**.

**Implementado no PR #21, somente branch `feature/v0.51-launcher-icon-fill-20261016`:**
- `dock.html`: quatro linhas de modo e ordem fixa: **Raw IV (A/D/S 0–15)** → **% IV (Min/Max 0–100)** → **Great League (ranking 1–50)** → **Ultra League (ranking 1–50)**. Removida a opção separada "100%". Menus com seletores continuam aplicados mediante **Aplicar**, sem alterar barra principal de 12 botões.
- Compactação: painel Modos passou de **286px para 246px** de largura; altura fixa anterior **270px** substituída por altura automática com teto **216px**; linhas, margens, botões e grade numérica menores; eliminada frase explicativa redundante. Botões Aplicar/Cancelar preservados e popup pode ficar acima/abaixo da barra conforme espaço.
- Identificação automática de perfeito: `Raw IV 15/15/15` continua modo **raw**, porém usa o PNG **hundo.png** (ou **shundo.png** se Shiny realmente confirmado), com indicador 100% na barra. Qualquer outro Raw IV mantém ícone **custom**. Sem recriar botão de modo 100%.
- `OverlayService.java`: modo novo padrão **raw**; configurações antigas com modo interno `iv` são migradas de maneira persistente para Raw 15/15/15. Os controles de ligas, preferências, favoritos, localização, Shiny e demais funções foram mantidos.
- `probe.js`: quando Raw IV for exatamente 15/15/15, a busca também aceita fallback verificado por % IV 100–100 se o formulário do site não conseguir aplicar os campos Raw; isso **não** ocorre para IVs mistos.
- Testes: atualizados `overlay-ux.test.js` e `probe-smoke.test.js`. Em revisão sem compilar APK, **32 smoke tests do probe** e **162 testes do contrato UX** passaram em execução JavaScript com arquivos lidos da branch (sem Android físico).
- **Pendência:** APK anterior não inclui estas melhorias. **Não compilar** até pedido expresso; não executar merge na `main`; preservar backups, os 18 PNGs oficiais e demais funções.

---
## 6.5. Seis melhorias de UX aprovadas — 17/10/2026

**Autorização do usuário:** "Sim. Pode aplicar todas as 6 sugestões". Trabalho somente no PR #21 da branch `feature/v0.51-launcher-icon-fill-20261016`; **não gerar APK nem fazer merge sem solicitação**.

1. **Reconhecimento automático de IV especiais:** no único modo Raw IV, `15/15/15` usa `hundo.png`/ `shundo.png` e `0/0/0` usa `nundo.png`/`shnundo.png`; valores intermediários usam `custom.png`/`custom-shiny.png`. No modo % IV, intervalos exatos `100–100%` e `0–0%` reutilizam Hundo/Nundo; outros usam `percent.png`/`percent-shiny.png`. Shiny depende de confirmação da sessão/site, nunca é falsamente atribuído. Nenhum quinto modo foi acrescentado.
2. **Seletor numérico mais ágil:** mantida grade precisa em listas 0–15, 1–50 e 0–100. Para % IV, adicionado **slider de salto rápido** 0–100 com leitura numérica e destaque do valor, mantendo toque exato na grade. `Min <= Max` continua garantido. O usuário só aplica ao tocar **✓ Aplicar**.
3. **Interface compacta:** quatro linhas já estabelecidas em ordem Raw IV → % IV → Great League → Ultra League, painel 246px de largura, altura variável limitada a 216px, botões compactos, sem texto redundante. Toolbar original de **12 botões em uma linha**, popup inteligente acima/abaixo da engrenagem, 18 PNGs preservados.
4. **Modo ativo inequívoco:** linha selecionada agora exibe ✓ com `aria-pressed` e destaque discreto; barra mostra `100%`, `0%` ou `RAW`, `IV%` ou as siglas das ligas com ranking #N. Ícone e tooltip da janela de Pokémon respeitam o **modo que realmente gerou os resultados**.
5. **Preferências independentes e persistentes:** Raw A/D/S, % Min/Max e top ranking de GL/UL continuam salvos separadamente nas `SharedPreferences`, junto do modo ativo. Abrir/fechar menu, trocar modo e reiniciar serviço não apagam esses valores. O antigo modo interno `iv` migra para Raw 15/15/15.
6. **Validação rigorosa sem apagar resultados úteis:** o `probe.js` já verifica os controles do PoGoCoordinates antes de Search. Agora `collect()` também devolve `criteriaConfirmed`; a camada Java rejeita **qualquer** lote não confirmado (inclusive aparente zero resultados) antes de substituir dados. Em falha, conserva as cartas antigas, mostra status curto `⚠ ... · resultados anteriores`, mantém diagnóstico detalhado para ⚠ e apresenta um pequeno ponto de alerta no cabeçalho da janela. O cabeçalho retém **configuração, ícone e Shiny da busca anterior**, evitando atribuir resultados antigos ao filtro novo. Somente respostas confirmadas atualizam cartas, histórico, notificações e o indicador de frescor.

**Arquivos:** `app/src/main/assets/dock.html`, `probe.js`, `OverlayService.java`, `app/tests/overlay-ux.test.js`, `app/tests/probe-smoke.test.js`. Casos acrescentados cobrem auto Hundo/Nundo em Raw e %, Shiny nos ícones, slider e grade, seleção/persistência, cabeçalho de resultados anteriores e confirmação posterior inclusive para respostas vazias.

**Verificações realizadas sem APK:** contratos JS de UX e smoke tests com dados simulados; sintaxe de JS; testes diretos do mapeamento entre seis combinações de modo/IV e pares de ícones. **Pendente:** teste manual em Android/PoGoCoordinates e compilação somente por pedido expresso. O APK da etapa 6.3 **não inclui** estas seis melhorias.

---
## 7. Continuidade em outro chat

Antes de qualquer modificação: abrir este arquivo, conferir estado atual da branch e PR #21, preservar `main` e backups, e continuar exclusivamente em `feature/v0.51-launcher-icon-fill-20261016` (ou nova branch derivada dela). Não recomeçar do zero, não confundir ícone do launcher com ícone do resultado, não confundir PNG importado com filtro funcional. Descrever o que foi realmente implementado e o que aguarda teste físico.
