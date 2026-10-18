# PokeSearch — GUIA MESTRE

> **RETOMADA MAIS RECENTE:** leia primeiro a **seção 12** (CENTRAL-002, comparação PokeSearch / PoGoCoordinates / PokéLocation, caminhos e banco de dados, PSC e próximo passo PL-01); depois a governança da seção 11 e o histórico 1–10. **Somente documentação foi autorizada; não alterar código nem APK sem aprovação expressa.**

> **DOCUMENTO CENTRAL PERMANENTE:** Guia Mestre de todo o projeto PokeSearch, independente da versão atual do aplicativo. Cada versão, decisão, teste e meta é registrada dentro deste documento. Registro central iniciado em 18/10/2026. A seção 11 reúne estado verificado, documentação, histórico, diário, metas, bugs e PL/UX. As seções 1–10 foram preservadas como cronologia; algumas afirmações antigas são superadas pelos registros posteriores. **Não alterar código, APK ou fazer merge sem confirmação expressa.**

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
## 6.6. IV% restrito às 46 porcentagens possíveis — pedido de 17/10/2026

**Pedido do usuário:** os seletores **IV% Min** e **IV% Max** devem oferecer somente as 46 porcentagens matematicamente atingíveis pelos IVs inteiros de Pokémon GO, mantendo ranking **Great League/Ultra League de 1 a 50 independente** do filtro IV% geral.

**Porcentagens válidas, exatamente como fornecidas:** 0%, 2%, 4%, 7%, 9%, 11%, 13%, 16%, 18%, 20%, 22%, 24%, 27%, 29%, 31%, 33%, 36%, 38%, 40%, 42%, 44%, 47%, 49%, 51%, 53%, 56%, 58%, 60%, 62%, 64%, 67%, 69%, 71%, 73%, 76%, 78%, 80%, 82%, 84%, 87%, 89%, 91%, 93%, 96%, 98%, 100%.

**Implementação no PR #21 — branch `feature/v0.51-launcher-icon-fill-20261016`, sem merge:**
1. `app/src/main/assets/dock.html`: `IV_PERCENT_VALUES` com os 46 valores; somente esses são mostrados na grade de seleção. O slider de % usa **índices de 0 a 45** e a cada passo mostra o valor correspondente, sem parar em números impossíveis. Botões exibem o sufixo **%**. Selecionar por exemplo **Min 91% / Max 100%** é permitido; Min ≤ Max é preservado. Raw IV 0–15 e GL/UL top 1–50 permanecem contínuos e separados.
2. `OverlayService.java`: `isAllowedIvPercent()` valida ambos os extremos antes de salvar qualquer `setSearchConfig`; valor fora da lista é rejeitado. O conjunto é derivado do cálculo `Math.round(total * 100 / 45)` para os 46 totais inteiros de 0 a 45, sem erro de percentuais intermediários. Instalações com antigos extremos inválidos sofrem migração conservadora: **Min arredondado para baixo** e **Max arredondado para cima** para valores próximos válidos (exemplo `90–95%` vira `89–96%`), preservando a faixa inclusiva. Preferências migradas são persistidas.
3. `app/src/main/assets/probe.js`: reforço de validação no navegador antes de aplicar/confirmar o filtro % IV; não aceitar intervalos inválidos, mesmo se o formulário remoto permitir números impossíveis. Rotina de `applyLeague()` e `configuredRank()` **não alteradas**; GL e UL continuam avaliando seus rankings próprios, sem aplicar o intervalo geral IV%.
4. `app/tests/overlay-ux.test.js` e `app/tests/probe-smoke.test.js`: regressões de lista exata (46 opções), controles Min/Max e slider, valor 91–100 aceito, 90 e 95 rejeitados, persistência/migração e GL/UL independentes. **Validação simulada de código nesta etapa:** 199 verificações de interface e 41 smoke tests de busca aprovados; verificação de sintaxe JavaScript e paridade entre a lista e os arredondamentos matemáticos.

**Não foi compilado APK** nem executado teste físico em Android. Conservar 18 PNGs, UI compacta, filtros de ranking independentes, códigos de segurança e fluxos existentes. Continuar com build somente após solicitação expressa do usuário.

---
## 6.7. Planejamento dos filtros adicionais do PoGoCoordinates — 17/10/2026

**Documento técnico registrado:** [PLANO_INTEGRACAO_FILTROS_POGOCOORDINATES_20261017.md](PLANO_INTEGRACAO_FILTROS_POGOCOORDINATES_20261017.md) em branch independente `plan/v051-pogocoordinates-filtros-20261017`, derivada da branch do PR #21, sem modificação do APK ou fontes.

**Verificado:** site apresenta Stats (CP, nível, IV% e Raw IV), PvP (liga, Top ranking, evoluções anteriores, CP mínimo), filtros gerais (espécie, tamanho, forma, sexo), Weather, Shiny, localização e seção Advanced VIP. **Não verificados:** valores internos de dropdowns, significado exato de Weather, opções VIP e mudanças dinâmicas por espécie. Nunca presumir que Weather equivale a Com/Sem bônus.

**Próxima implementação:** descobrir opções reais do formulário sem dados de conta; expor Form/Size e campos avançados no popup do menu existente, sem adicionar ícones; confirmar cada filtro antes de Search; limpar filtros ocultos sem apagar Shiny/📍; manter 18 imagens, 12 ações, janela de resultados, limite de consultas, validação IV% 46 valores, GL/UL 1–50 e histórico confirmado. Modos Sem Filtro/Mestre/Copinha ainda não habilitados.

**Situação:** planejamento concluído; filtros adicionais ainda **não implementados** nem testados em Android. Preservar PR #21, main e backups.

---

## 6.8. Auditoria complementar — Sort by e ações esquecidas (17/10/2026)

O usuário identificou corretamente a ausência de **Sort by**. A interface do PoGoCoordinates exibe **Sort by → Despawn (longest)**; o autor do serviço menciona ordenar por despawn, CP e distância, mas a lista real do dropdown precisa ser descoberta na sessão do site.

**Bug/diferença identificado no código:** `OverlayService.java` tem `sort="despawn"`, porém o comparator padrão `Long.compare(expiration(a1),expiration(a2))` ordena por desaparecimento **mais cedo**; diverge da opção `Despawn (longest)` mostrada no site. O app ainda não oferece controle de Sort by nem configura o dropdown na `probe.js`; esta só lê até **10** cartões. **Correção planejada:** selecionar e confirmar Sort by no site **antes** de consultar e recortar os dez resultados; manter a mesma ordem no app, sem reordenação conflitante, respeitando cooldown. Não inventar valores de opções ainda não inspecionadas.

**Itens faltantes no primeiro inventário:** `Use my location` (ação geográfica com consentimento), `Reset`, `Map`, `Notify Me` e `Search`, além da alternância `Filter by Stats/PvP` explicitamente registrada. Esses itens são ações/controles de navegação (não todos filtros); não duplicar os controles já existentes de localização 📍, sino/favoritos, atualização e busca. Link de até 100 contas VIP é recurso pago, não adicionar sem suporte.

**Documento revisado no PR #22:** [PLANO_INTEGRACAO_FILTROS_POGOCOORDINATES_20261017.md](PLANO_INTEGRACAO_FILTROS_POGOCOORDINATES_20261017.md). A auditoria é **documental**: não houve código executável alterado, compilação, testes reais ou merge.

---

## 6.9. Implementação beta do menu de filtros + Shiny no topo (17/10/2026)

**Autorização:** usuário pediu aplicar a proposta e posicionar **✨ Shiny ao lado de MODO DE BUSCA**. **A branch `plan/v051-pogocoordinates-filtros-20261017` evoluiu de plano documental para implementação experimental**, com PR #22 em draft contra `feature/v0.51-launcher-icon-fill-20261016`. A seção 6.7/6.8 descreve a fase anterior: o código *já foi alterado* após a autorização.

- `dock.html`: título `MODO DE BUSCA` + botão `✨ ON/OFF` imediatamente ao lado (mesma ação `Native.shiny()` já disponível na barra); preservação dos 12 botões existentes; linhas Raw IV / IV% / Great League / Ultra League; seção `Sort by`, `Filtros gerais` (espécie/Form/Size) e `Filtros avançados` (CP/Level/Weather/Gender ou PvP Min CP/evoluções anteriores/Gender), recolhíveis, rolagem e campo de texto com teclado. As opções das listas são lidas do formulário remoto; só `Despawn (longest)` possui fallback baseado na captura original.
- `OverlayService.java`: preferências extras em `extraFiltersJson`, validação dos campos/faixas, descoberta dinâmica via `requestFilterOptions()`, preservação **da ordem do site nos primeiros 10 resultados** em vez de classificação local contraditória. Sem alteração de login, limites de frequência, gestos ou ícones.
- `probe.js`: `describeFilters` para descobrir opções reais, aplicação opcional e confirmação extra por `check()` antes de enviar `Search` e antes de aceitar resultados. Filtro escolhido sem controle acessível -> erro curto e **preservação de resultados anteriores**; não presumir valores não documentados. Shiny no cabeçalho é ação imediata independente do rascunho Aplicar/Cancelar.
- `app/tests/overlay-ux.test.js` / `probe-smoke.test.js`: incrementos de regressão. Execução in-memory em V8 dos testes Node com mocks, usando arquivos da branch: **208 UX e 47 probe aprovados**; sintaxe JS aprovada. **Não equivale a build Android nem teste real no site**.

**Pendente:** APK, Gradle, verificação em aparelho e seleção real de menus do PoGoCoordinates na WebView. As opções só aparecem se o site efetivamente as expuser; interface VIP não é contornada. Guardar compatibilidade original e não mudar `main` sem testes e autorização. Detalhes: [Plano/implementação filtros 17-10](PLANO_INTEGRACAO_FILTROS_POGOCOORDINATES_20261017.md).

---

## 6.10. APK de teste dos filtros gerado no GitHub Actions — 17/10/2026

**Autorização expressa do usuário para compilar.** Build de teste no workflow específico da branch `plan/v051-pogocoordinates-filtros-20261017`, commit `a68d43b0213b4421a9dae3fdf52819fefadf814b`.

- **Workflow:** [PokeSearch v0.51 filter preview APK — run #39011424737](https://github.com/LucianoToscano/PokeSearch/actions/runs/39011424737) — `success` em testes de JS, `:app:assembleDebug`, testes unitários Gradle, verificação `unzip -t` e assinatura pelo Android SDK.
- **Artefato:** `PokeSearch-v0.51-Filtros-Teste-APK`, GitHub Actions artifact ID `12092468443`, ZIP de 1.113.015 bytes com APK e `SHA256SUMS.txt`. APK extraído `PokeSearch-v0.51-Filtros-Teste.apk` com **1.132.150 bytes** e SHA256 `1ea1a035f04091f6fe807e3baab625c7548c28284700464ddb39fd80664da65f`. ZIP e checksum conferidos localmente.
- **Conteúdo APK conferido:** `dock.html`, `probe.js`, `classes.dex/classes2.dex`, AndroidManifest e **18 PNGs** de resultados existentes.
- **Aviso:** debug APK de teste; assinatura de debug CI pode mudar entre builds e impedir atualização por cima de instalação anterior. Não é validação física dos controles de filtro no PoGoCoordinates. Testar no Android antes de liberar como final.
- **Não houve merge para main; PR #22 permanece draft.**

---

## 6.11. Correção do bug dos filtros da v0.51 — 17/10/2026

**Relato do usuário:** após instalar o APK de teste gerado no run #39011424737, "Os filtros não estão funcionando". O build anterior só confirmou compilação e mocks básicos, **não o comportamento real das listas dinâmicas do PoGoCoordinates**.

**Causas identificadas no código:**
1. Em `probe.js`, a descoberta tentava abrir e ler os dropdowns **na mesma chamada síncrona**, antes de o React renderizar as opções; por isso `Form/Size/Gender/Weather` podiam ficar desativados.
2. `extras("apply"/"verify")` tratava rótulos neutros além de "Any" como falhas; quando um site mostrava "Any Form"/"Any Size", uma consulta normal podia falhar sem o usuário ter ativado filtros.
3. O botão de modos podia ser aberto **enquanto a busca automática estava em progresso**: `requestFilterOptions()` retornava sem consultar e nunca tentava novamente.
4. Uma opção selecionada em dropdown React era tratada como aplicada antes de a página atualizar o estado. Em Form dependente do Pokémon isso podia produzir uma condição inconsistente.
5. A falha apresentada ao usuário era genérica, e havia teste UX preso à implementação antiga de atualização do catálogo.

**Correções aplicadas no mesmo PR #22 / branch de desenvolvimento:**
- `probe.js`: ações separadas `openFilterOptions:key`, `readFilterOptions:key`, `closeFilterOptions:key`; leitura depois de 210 ms por campo, inspeção de itens reais de Radix/React com `role=option`; reconhecimento de valores neutros (`Any Form`, `Any Size`, etc.); configuração serializada, com `pending` e confirmação em busca subsequente antes de Search. Não afirmar sucesso quando opção não foi confirmada.
- `OverlayService.java`: varredura sequencial assíncrona dos menus e **retries se a consulta automática ainda está em andamento**; tentativa de configuração reexecutada (até 22 vezes em operações pendentes) e mensagens que identificam o filtro problemático; manutenção da busca anterior em falhas.
- `dock.html`: atualização **incremental** de opções descobertas, sem substituir opções de outros campos; não redirecionar submenus numéricos quando chegarem atualizações tardias.
- `app/tests/probe-smoke.test.js`: reproduz valores "Any Form/Any Size" e simula dropdown React que só expõe as opções após abrir e concluir o render, exigindo nova verificação antes de sucesso. `overlay-ux.test.js`: contrato atualizado para a descoberta incremental.

**Limitação importante:** as alterações tratam os defeitos identificados no código; **não equivalem a uma confirmação em sessão real do PoGoCoordinates**, que pode mudar seu DOM ou oferecer recursos VIP. Os controles que não puderem ser inspecionados **continuam bloqueados em vez de fingir que a busca funcionou**. Login, Shiny, 18 PNGs, os 12 ícones originais, filtros Raw/%/GL/UL, histórico e coordenadas preservados. A versão anterior (commit `a68d43b`) não deve ser usada para validar os novos filtros.

**Entrega:** gerar novo artefato do workflow `.github/workflows/build-v051-filters-preview.yml` a partir de commit **posterior** às correções; registrar SHA e teste físico quando disponíveis.

---

## 6.12. APK corrigido dos filtros — build aprovado (17/10/2026)

- **Build GitHub Actions:** [run 39012668303](https://github.com/LucianoToscano/PokeSearch/actions/runs/39012668303), commit Android `a695984008fb69498650c0a61a0a49d8f3ed26d5`, resultado `success`.
- **Testes:** validação sintática JS, smoke tests de busca (inclusive React dropdown tardio e opções Any), regressões UX, `:app:assembleDebug`, `:app:testDebugUnitTest`, integridade ZIP e assinatura Android verificadas pelo CI.
- **Artefato GitHub Actions:** `PokeSearch-v0.51-Filtros-Teste-APK`, id `12093019941`, arquivo baixado `PokeSearch-v0.51-Filtros-Corrigidos.zip`.
- **APK extraído e validado localmente:** `PokeSearch-v0.51-Filtros-Corrigidos.apk`, **1.134.918 bytes**, SHA-256 `c32be9aab7161424d82e409a57a90d2a7fa7a422146f3bb10b6530a8a5a663d2`; contém `assets/dock.html`, `assets/probe.js` e 18 PNGs do resultado.
- **Estado:** novo APK pronto para **teste no aparelho**, ainda **sem comprovação em site real autenticado**, sem merge em main. Em caso de erro após instalação pedir captura ou TXT do botão ⚠, sem códigos pessoais. Build debug pode precisar desinstalar o APK anterior caso assinaturas não coincidam.

---

## 6.12. Resultados não apareciam depois de aplicar opções — correção do ciclo Search/Collect (17/10/2026)

**Relato:** depois da v0.51 com menus novos, ao escolher filtros de busca os Pokémon não apareciam na janela independente.

**Investigação do código (causa diretamente reproduzível em teste):** `probe.js` confirmava os critérios antes de enviar `Search`, mas `collect()` reexecutava `check()` sobre o formulário **após a busca** e jogava fora todos os cartões se o site escondesse/recriasse o formulário durante a apresentação dos resultados. `OverlayService.java` também exigia que o controle Shiny permanecesse visível depois da navegação, rejeitando Pokémon embora o Shiny já tivesse sido confirmado antes.

**Correções aplicadas:** 
- `OverlayService.java`: guarda `confirmedSubmittedFiltersGeneration` **somente para a geração de busca verificada imediatamente antes de Search**; reseta a prova no início de outra busca e em falha de envio. Passa `_preSubmitVerified` ao coletor apenas nessa geração. Informações do formulário nunca são aceitas de outra pesquisa. Identifica a causa específica nos erros, registra somente contagens + tipo de confirmação (sem coordenadas ou identificadores de conta).
- `probe.js`: `resultCriteria()` mantém resultados se o formulário ficou oculto mas **a mesma geração** já teve Raw/%/GL/UL e adicionais confirmados antes de Search; controles **visíveis com valores divergentes** continuam invalidando; ausência de confirmação inicial continua rejeitando. `confirmationSource` distingue verificação ao vivo de prova anterior. A validação individual dos IVs/ranks disponíveis nos cartões continua ativa.
- `OverlayService.java`: quando a chave Shiny some ao abrir resultados, pode usar somente a prova Shiny já confirmada nessa geração; Shiny explicitamente **OFF** continua inválido para busca Shiny ON.
- `app/tests/probe-smoke.test.js`: acrescenta regressão para formulário oculto com resultados e confirmação anterior, ausência de prova, Size contraditório e Liga contraditória. `app/tests/overlay-ux.test.js`: atualizado para a nova injeção de configuração + prova da geração e o Shiny oculto.

**Limites:** sem acesso ao DOM real da sessão logada do usuário, essa é uma correção de erros encontrados no código e reproduzidos em testes automatizados; não é confirmação de que todos os filtros são aceitos pelo site em Android real. Os controles em desacordo visível continuam produzindo ⚠ em vez de inventar resultados. **Preservar** PR #21 e branch original, 12 botões, 18 ícones, login, favoritos, coordenadas e PvPPokeGo separado.

---

## 6.13. APK de testes com resultados corrigidos (17/10/2026)

**Build bem-sucedido:** [workflow #39013998424](https://github.com/LucianoToscano/PokeSearch/actions/runs/39013998424), commit de código `40cdf0ccd0e013f432d2f9c803ab03f4d5b59d42`, PR #22, branch `plan/v051-pogocoordinates-filtros-20261017`.

- **GitHub Actions:** testes JavaScript de sonda e UI passaram, `gradle :app:assembleDebug :app:testDebugUnitTest` passou, APK assinado pela chave de debug do workflow e verificações ZIP + assinatura bem-sucedidas.
- **Artefato GitHub:** `PokeSearch-v0.51-Filtros-Teste-APK` ID `12094306734`.
- **APK extraído entregue ao usuário:** `PokeSearch-v0.51-Resultados-Corrigidos.apk`, **1.135.982 bytes**, SHA256 `d3d28251484a70115812f3e9f8f7a2ee9dae3801488390e225fcff39f776326c`.
- **Conteúdo conferido:** `probe.js` contém `resultCriteria()` com fonte de confirmação `pre-submit-confirmed`; `dock.html` e todos os **18 ícones PNG** preservados.
- **Correção:** validação atrelada à geração de Search; se o formulário do site ficar oculto depois do envio, o coletor pode usar a confirmação prévia daquela mesma busca. Controles visíveis divergentes ou prova anterior inexistente continuam bloqueados. Filtro Shiny oculto no resultado também pode reutilizar **somente** a prova Shiny verificada naquela geração, sem ignorar OFF explícito.
- **Testes acrescentados:** confirmação com formulário oculto, rejeição sem prova, rejeição de Size/Liga em desacordo, regressão do Shiny oculto.
- **Atenção:** debug APK de testes; os resultados do site **ainda não foram testados no aparelho do usuário**. Instalar e validar Raw IV, IV%, GL/UL, Size/Form e Shiny. Se persistir erro, pedir relatório TXT via ⚠ sem divulgar dados da conta. O `main` permanece intacto.

---

## 6.13. Bug real nas capturas — «⚠ Filtro: pokemon» bloqueia resultados (17/10/2026)

**Relato/capturas no Android:** home screen às 04:35/04:36, interface original e 18 PNGs presentes, modo Raw IV 100% e modo GL #1. **Ambos não exibiam Pokémon**; toast indicava literalmente `⚠ Filtro: pokemon`, mostrando bloqueio **antes de enviar a busca** por validação de um filtro de espécie que **não foi solicitado** (padrão Qualquer Pokémon).

**Causa no código:** `probe.js → extras("apply")` iterava obrigatoriamente sobre todos os campos extras (pokemon, form, size, gender, weather), mesmo quando `filters[key]` era vazio, interpretando o texto/controle não padronizado do site como divergência de `Any` e abortando o modo Raw/GL/UL. `visibleExtrasMismatch()` reaplicava esse erro ao coletar resultados. O diagnóstico anterior de formulário oculto e prova da mesma geração **não resolvia o bloqueio pré-envio**.

**Correção na branch `plan/v051-pogocoordinates-filtros-20261017` / PR #22:**
- `probe.js`: filtro extra vazio **não impõe restrição** nem requer localizar o dropdown, independentemente de como o site rotula `Any Pokémon`; `extras()` e `visibleExtrasMismatch()` validam apenas seleções **explícitas**. Atributos IV, PvP, Shiny e localização continuam sendo confirmados. Caso usuário escolha realmente `Pikachu`, o campo deve ser aplicado/confirmado antes de enviar Search.
- Para preservar a remoção de filtro previamente ativo, `OverlayService.java` mantém `clearExtraKeys` para campos que passam de valor explícito para vazio; eles continuam exigindo restauração real ao estado neutro no site. Assim o conserto não transforma `Limpar Pokémon` em uma falsa limpeza.
- `probe-smoke.test.js`: regressão com valores de seleção customizados/decorativos `Pokémon · Any Pokémon ▾`, Raw IV e GL Top 1, confirmação na leitura de resultados, e validação de filtro ativo/remoção explícita.
- Nenhuma alteração aos PNGs, barra de ícones, classe de janelas, tempos, controle Shiny, gestos, notificações ou `main`.

**Evidência:** erro `⚠ Filtro: pokemon` nas capturas 1792222585354.jpeg e 1792222583404.jpeg. **Limite de verificação:** testes automatizados e GitHub Actions não substituem teste no aparelho com sessão real do PoGoCoordinates. Compilar novo APK do commit posterior às correções, não reutilizar as versões beta anteriores.

---

## 6.14. Troca rápida de filtros sem violar cooldown — 18/10/2026

**Relato do usuário:** ao alternar entre filtros IV100/Raw, IV%, GL e UL, os resultados demoram a atualizar.

**Causa real identificada:** `OverlayService.refresh()` possui `MIN_SEARCH_GAP_MS=60_000L`, aplicado também após a seleção de um novo filtro. Esse intervalo protege o serviço remoto contra consultas frequentes. Além dele, os estágios de sincronização e verificação do formulário exigem tempo de WebView/React. O modo e seus parâmetros já mudavam imediatamente, mas os cartões precisavam aguardar a consulta, sem contagem visível.

**Melhoria de UX implementada no PR #22, em desenvolvimento isolado:**
- Mantido o limite de **60 s** e o agendamento de **apenas a última seleção**. Não fingir que a nova busca foi executada imediatamente.
- `OverlayService.java`: cache **somente em memória** dos últimos 8 conjuntos de resultados confirmados (até **120 s** de idade), com chave incluindo **modo, Shiny, localização/coordenadas/raio, parâmetros completos**. Ao retornar a um filtro já consultado, restaurar de imediato apenas Pokémon cujo `expiresAtMs` ainda não venceu. Prévia é **explicitamente marcada como anterior/stale**; não aciona novos alertas, não inventa novos resultados nem concede confirmação ao filtro recém-selecionado. Uma consulta real subsequente substitui a prévia.
- `OverlayService.java`: controlar `nextScheduledSearchAtMs`; no cooldown, status `Filtro ... selecionado · próxima consulta em Ns`. Ao iniciar a chamada de rede zerar o indicador.
- `dock.html`: exibir contagem regressiva em segundos no pequeno cabeçalho dos resultados e no estado vazio (usando o `setInterval(updateTimers,1000)` já existente). **Nenhum ícone/botão extra**; preservar 18 PNGs e barra de 12 botões, menu e janelas separadas.
- `app/tests/overlay-ux.test.js`: contratos verificando cache por filtro/contexto, expiração e indicador sem quebra de interface; sem atalho indevido para o limite de consulta.

**Limitações:** quando o filtro não possui cache válido (primeira vez selecionado ou consulta antiga/expirada), a listagem terá de esperar a próxima busca permitida; a UI responde e avisa o tempo. Preview não significa resultado atual. O limite de 60 s e eventual lentidão do site remoto continuam existindo. Testar em aparelho, especialmente transições rápidas, dados vencidos e alternância Shiny/localização.

---

## 6.15. Sessão persistente e retorno automático após login — 18/10/2026

**Relato real:** às vezes o usuário precisava relogar e, após autenticar, o PoGoCoordinates continuava aberto em vez de devolver o controle ao PokeSearch.

**Causa confirmada no código:** `MainActivity.checkLoginSession()` injetava `probe.js` substituindo somente `__ACTION__`, `__MODE__` e `__SHINY__`, mas **esquecia `__FILTERS__`**, variável obrigatória no início do script. Isso causava exceção JavaScript e impossibilitava confirmar o login automaticamente; o site ficava aberto.

**Correções implementadas** na branch `plan/v051-pogocoordinates-filtros-20261017` / PR #22:
- `MainActivity.java`: substituir todos os **quatro** parâmetros no script de verificação (`__FILTERS__ = {}` no diagnóstico de sessão). Em sucesso, confirmar estado, sincronizar cookies com `CookieManager.flush()`, fechar login, retornar para o app. Login iniciado do overlay devolve foco ao aplicativo anterior com overlay visível; iniciado pela Home permanece na Home. Cancelar/sair sem sessão confirmada NÃO reinicia toda a busca nem declara sucesso.
- `probe.js`: reconhecer `Shiny for your account` no texto do `document.body` mesmo que as estruturas do DOM móvel não exponham elementos `p/span/div` correspondentes, sem coletar código ou nome da conta.
- `MainActivity.java` → `LOGIN_END` contém flag `authConfirmed`; `OverlayService.java` só agenda a consulta pós-login quando autenticação realmente terminou, preserva últimos resultados verificados em uma atualização de sessão e evita sobrescrever sessão conhecida como autenticada com estado transitório `não confirmado` durante a hidratação do site.
- `app/tests/overlay-ux.test.js`: regressões específicas para script corretamente interpolado, retorno automático, cancelamento sem reload e preservação de dados; **sem alterações aos PNGs, 12 botões, filtros IV/PvP, cooldown ou login oficial**.

**Limites e segurança:** cookies do site são persistidos pela WebView compartilhada do aplicativo enquanto forem válidos; o aplicativo não pode impedir expiração/revogação pelo servidor, política de login do Google/Discord ou limpeza de dados no Android. Nunca armazenar senhas, tokens ou cookies em preferências nem contornar bloqueio do provedor. O logout explícito continua sendo a única rotina que remove cookies e dados web. Testes de GitHub Actions não substituem confirmação real no dispositivo.

---

## 7. Continuidade em outro chat

Antes de qualquer modificação: abrir este arquivo, conferir estado atual da branch e PR #21, preservar `main` e backups, e continuar exclusivamente em `feature/v0.51-launcher-icon-fill-20261016` (ou nova branch derivada dela). Não recomeçar do zero, não confundir ícone do launcher com ícone do resultado, não confundir PNG importado com filtro funcional. Descrever o que foi realmente implementado e o que aguarda teste físico.

---

## 8. Continuidade consolidada — 18/10/2026: auditoria PokéLocation e propostas de menus

**Natureza:** registro DOCUMENTAL a pedido do proprietário. NÃO autoriza editar código, APK, ícones, assinatura, permissões, backend, UI em produção ou fazer merge. As seções 1–7 acima ficam preservadas como histórico. Declarações antigas como "pendente" precisam ser confrontadas com as atualizações 6.9–6.15 e o HEAD atual.

### 8.1 Fontes e versão de trabalho

- **Arquivo Mestre mais detalhado da v0.51:** este arquivo na branch 'plan/v051-pogocoordinates-filtros-20261017'; PR [#22](https://github.com/LucianoToscano/PokeSearch/pull/22) contra 'feature/v0.51-launcher-icon-fill-20261016' (PR #21). Ambos devem continuar em draft e SEM merge até ordem explícita.
- **Auditoria externa PokeLocation de 18/10/2026:** [REFERENCIA_POKELOCATION_2026-10-18.md](REFERENCIA_POKELOCATION_2026-10-18.md), cópia documental nesta branch. Original preservado em [main](https://github.com/LucianoToscano/PokeSearch/blob/main/docs/REFERENCIA_POKELOCATION_2026-10-18.md).
- **Complemento no Drive:** [PokeSearch — Complemento ao Arquivo Mestre v0.51 — Auditoria PokéLocation](https://docs.google.com/document/d/1p6gK1HueyN5DTdKQk2LsSCZvlKc1pphvzVroGpUr9nQ/edit). O APK PokéLocation está referenciado nesses documentos e é referência externa, NÃO o APK PokeSearch.
- **Plano dos filtros PoGoCoordinates:** [PLANO_INTEGRACAO_FILTROS_POGOCOORDINATES_20261017.md](PLANO_INTEGRACAO_FILTROS_POGOCOORDINATES_20261017.md). Conferir as decisões posteriores do Arquivo Mestre para evitar duplicação.
- **HEAD de código da branch antes desta atualização documental:** fe68af33615c74649bd2b0fd265af50148aab2ad. Os commits documentais posteriores mudam o HEAD da branch, não as fontes Android. Em cada novo chat reconsultar o HEAD, PRs e arquivos reais.
- O mestre localizado na 'main' é um resumo antigo da v0.51; não substituir este mestre expandido por ele. Manter a base restaurada e os backups de outras versões intocados.

### 8.2 Estado da auditoria PL-01 a PL-12

O escopo completo de cada PL consta da **auditoria**. Os IDs não serão renumerados, nem consideradas aprovadas etapas apenas porque houve código anterior relacionado. **Todas continuam AGUARDANDO APROVAÇÃO INDIVIDUAL** para a próxima alteração.

| Etapa | Tema | Código/registro preexistente e checagem pendente |
|---|---|---|
| PL-01 P0 | Diagnóstico do contrato de busca/lookup, IV%/PvP, filtros e erros de zero | Existem 'probe.js', 'presets.js', 'OverlayService.java' e correções em 6.11–6.13. Confirmar os contratos reais, sem assumir os parâmetros do proxy PokeLocation, e cobrir cada modo com teste; esta é a **primeira etapa a apresentar para aprovação**. |
| PL-02 P0 | Troca reativa, cancelamento de geração e resultados antigos | Já existem requestGeneration, confirmação por geração, prévia de cache até 120 s e limite global de 60 s (6.14); auditar condições de corrida e transições reais antes de editar. |
| PL-03 P0 | Login, retorno, sessão e segurança OAuth | A variável '__FILTERS__' no diagnóstico de login, cookies e retorno automático foram corrigidos (6.15). Falta validar em aparelho, expiração e Google/Discord; nunca contornar OAuth. **Nova dependência PS-009/PL-11:** a sessão só atravessa atualização do APK quando os dados locais são preservados; planejar assinatura fixa para atualizações sem desinstalação (12.21). |
| PL-04 P1 | Distinguir zero resultados, 401, 403, 429, timeout e rede | Mensagens curtas e relatório já existem; validar tipagem, retry seguro e ausência de mensagens enganosas. |
| PL-05 P1 | Cache por filtro/sessão/local, sprites, catálogo/ETag | Cache temporário de resultados já existe; avaliar catálogo, sprites, vazamentos entre contas e TTL real. |
| PL-06 P1 | Sort by e presets | Sort by integrado de forma experimental em 6.9, com opções descobertas no site; perfis salvos por nome continuam PROPOSTA. Não misturar ordenação local contraditória com a remota. |
| PL-07 P1 | Favoritos e alertas sem repetição | Picker, WatchAlerts, sino e modos de som existem. Ainda exigir deduplicação confirmada por encontro e testes de permissões. |
| PL-08 P2 | Histórico local opcional dos alertas | Relatório técnico não equivale a histórico de notificações navegável. Definir retenção/limpeza e pedir aprovação. |
| PL-09 P2 | Renderização incremental, temporizador e uso de recursos | Timer e janelas independentes já existem; medir CPU/RAM e não refazer desnecessariamente os sprites a cada segundo. |
| PL-10 P2 | Diagnóstico privado | ⚠, relatório TXT e envio voluntário já existem; examinar sanitização para dados sensíveis em todos os caminhos. |
| PL-11 P2 | Android 15/16, permissões/App Links e release | Não alterar SDK/assinaturas sem análise; testar instalação, serviços exportados, overlay e certificado persistente. **Priorizar PS-009**: atualização por cima com chave estável, versionCode incremental, preservação de sessão e teste Android real (12.21). |
| PL-12 P3 | Avaliação eventual de backend próprio | Somente estudo após confirmação de necessidade; não introduzir servidor externo, credenciais compartilhadas ou tokens de terceiros. |

**Regras da auditoria:** app externo Android AGPL-3.0-only, servidor MIT; não copiar código sem revisar licença. Não trazer GPS falso, joystick, clonador, chat, permissões especiais, credenciais/tokens, endpoints do proxy de terceiros ou frequência agressiva. A política atual do PokeSearch é consulta global mínima de 60 segundos. O contrato do proxy PokéLocation NÃO comprova o contrato público PoGoCoordinates.

## 9. Backlog UX separado: ideias das capturas de 18/10/2026

**Status de TODOS os itens abaixo: PROPOSTO / AGUARDANDO APROVAÇÃO.** Capturas de outro menu ou versão são referências, não evidência de que a branch atual já tenha esses recursos. Implementar uma melhoria por vez, somente após confirmação.

**Preservação obrigatória:** barra de 12 ações original, engrenagem arrastável, estética compacta/transparente, 18 PNGs oficiais (9 famílias normal/shiny, e NÃO 18 modos funcionais), janelas de menu e resultados independentes, busca única com máximo 10 sprites, P/M/G, timers, arraste/colapso, detalhes por toque, copiar coordenadas por toque longo, login, auto refresh, favoritos, alertas, Pix, report, localização 0–1000 km. Shiny continua verificado pelo site; IV% só nas 46 porcentagens válidas; GL/UL mantêm seus rankings 1–50 independentemente de IV%.

| ID | Prioridade | Proposta e escopo | Dependência / critérios de aceitação | Situação |
|---|---|---|---|---|
| UX-01 | P1 | Melhorar a organização de **Modos** (Raw IV, IV%, GL, UL, botão ✨ próximo do título), **Sort by**, **Filtros gerais** e **Filtros avançados** recolhíveis, sem acrescentar botão permanente. | Já parcialmente implementado em dock.html (6.9). Garantir menus compactos, teclado, foco, Aplicar/Cancelar, rolagem e opção real verificada no site. PL-01/PL-06. | Parcial existente; melhoria proposta |
| UX-02 | P1 | **Aparência**: controle de transparência/fundo, espaçamento, altura do menu, P/M/G; estudar orientação horizontal/vertical para menu e sprites, e legendas só ícones / ícone+texto. | P/M/G já existe nas preferências. Padrão permanece o layout original; configurações persistidas, nenhuma área de toque bloqueada ou painel grande imposto. | Novo/parte existente |
| UX-03 | P1 | **Visibilidade dos Pokémon**: toggles de contagem, despawn, nível, PC, IV A/D/S e rank GL/UL; modo compacto vs completo. | Timer já existe. Mostrar apenas dados reais confirmados; não inventar rank individual quando só Top N foi confirmado. Manter lista de até 10, sem afastar sprites. | Novo/parte existente |
| UX-04 | P2 | **Duas pesquisas separadas opcionais**: Pesquisa 1 obrigatória, Pesquisa 2 OFF por padrão; modos/filtros/shiny/ícone/posição/colapso/resultados confirmados próprios. | Consultas sequenciais e limite **global** de 60 s, isolamento por geração/contexto; não misturar IV100 com IVs divergentes, resultados velhos e alertas. Não aumentar automaticamente o limite de 10 por pesquisa sem autorização adicional. Somente após PL-01/PL-02/PL-05 e aprovação própria. | Novo, não implementado |
| UX-05 | P2 | **Favoritos e alertas mais intuitivos**: preservar picker por nome/Pokédex, estrela, testes e canais Som/Silencioso/OFF. **Novo: tornar explícita a política de favoritos** — (A) favorito que atende aos filtros atuais ou (B) somente favorito IV100/rank individual #1 comprovado; opção alternativa de oferecer ambos em ajuste independente, **a decidir com o proprietário antes de programar**. Exibir o critério correto no nome/descrição da categoria Android, preferências, conteúdo do alerta e resultado do teste; evitar promessas de 100%/#1 para mero Top N ou Raw genérico. | Teste externo observou aviso comum + som configurável para favoritos, mas sem identificação de versão e sem prova do IV. Testar favoritos em Raw 15/15/15, Raw misto, IV% 91–100, GL/UL Top 1 e Top 10, sessão/resultado stale, Som/Silencioso/OFF, personalização de toque no Android 13–16 e permissão. **Não forçar volume nem sobrescrever toque do usuário**. Deduplicação por ocorrência em PL-07; evidência na seção 12.18 e plano 12.19. | **Pendente de decisão da política A/B e de autorização de código**; canais atuais preservados |
| UX-06 | P2 | **Info/diagnóstico compacto** sob demanda: sessão confirmada, filtros realmente aplicados, última consulta, cooldown, contagem de resultados, erros e indicador de prévia antiga. | Aproveitar status existente e PL-04/PL-10; privacidade: sem tokens, contas, cookies ou coordenadas pessoais. Não criar painel permanente no jogo. | Novo/parte existente |
| UX-07 | P2 | Polimento de **Atualização e Localização**: preservar AUTO OFF/5/10/15/20 + manual; avaliar opção 3 min das imagens, apenas após aprovação; ON/OFF e raio 0–1000 km, separar ações **ocultar/desligar/limpar** coordenadas. | Controles já existem; piso de 60 s não muda, não criar botões duplicados, evitar perder dados ao fechar um popup. | Controles existentes; polimento proposto |
| UX-08 | P2 | **Perfis rápidos/presets** de busca como IV100, GL Top 1 e Shiny IV100, persistentes e nomeáveis. | Extensão da PL-06, não um novo modo/endpoint. Ao alternar perfis, aguardar prova da nova geração e não atribuir cache de outra pesquisa ao filtro atual. | Novo, dependente de PL-06 |

### 9.1 Atenção a regressões sugeridas pelas imagens

- Uma captura mostra cabeçalho **IV100** com Pokémon contendo IVs 4/4/11, 2/14/2 e 0/13/13. Isso é **risco a investigar** quanto à associação de busca, cabeçalho e resultados, não prova isolada de defeito no HEAD atual. Registrar casos de teste PL-01/PL-02: IV100 confirmado não pode rotular esses Pokémon como 100%; prévia antiga deve trazer seu modo original e indicação de desatualizado.
- Na branch examinada, há **quatro linhas de busca reais** (Raw IV, IV%, GL, UL); 18 imagens correspondem a nove famílias visuais com e sem shiny. Não habilitar modos Mestre/Copa/Sem filtro apenas porque seus PNGs existem.
- O menu maior e vertical das imagens não substitui a barra original: pode inspirar uma visualização alternativa nas preferências, somente se aprovada e com tamanho/posição seguros.

## 10. Protocolo de aprovação e início de outro chat

1. **Reler** este mestre, a auditoria PL e o plano de filtros; conferir branch, HEAD atual, PR #21/#22, arquivos e estado real. Não misturar PvPPokeGo nem branches v0.52–v0.56 descartadas.
2. **Apresentar apenas a PL-01**, com diagnóstico proposto do contrato real de filtros, código existente, arquivos precisos ('probe.js', 'presets.js', 'OverlayService.java' e testes), riscos, preservações e critérios de sucesso. **Aguardar autorização explícita antes da primeira alteração de código.**
3. Executar cada etapa aprovada em branch isolada; jamais modificar 'main', ícones oficiais, UX original, backend, autenticação, fluxos e assinaturas fora do escopo aprovado.
4. Antes de marcar progresso, validar testes estáticos/unitários e, onde aplicável, APK no Android e sessão real; CI/mocks não equivalem a teste físico. Gerar APK somente mediante pedido/autorização expressa. Registrar hashes, branch, arquivos e resultados.
5. Estados separados: **PROPOSTO → APROVADO → IMPLEMENTADO EM BRANCH → TESTADO EM APARELHO → ACEITO → MERGE AUTORIZADO**. Nenhum item PL/UX passa de estado sem evidência/confirmacão correspondente.
6. Após cada etapa, registrar o resultado aqui, pedir aceitação e solicitar confirmação separada antes de avançar. A PL-02 não começa automaticamente ao finalizar PL-01.

**Saída de 18/10/2026:** apenas documentação consolidada. **PL-01 ainda AGUARDANDO APROVAÇÃO**, PL-02 a PL-12 e UX-01 a UX-08 também. Nenhuma mudança de código, UX efetiva, PNG, AndroidManifest, APK, workflow de build ou 'main' autorizada neste registro.

---

## 11. PAINEL CENTRAL DE GOVERNANÇA — consolidação de 18/10/2026

**ESTE É O REGISTRO ÚNICO DE CONTINUIDADE:** inventário, histórico, diário, decisões, metas, pendências, aprovações, testes, backlogs técnicos (PL-01 a PL-12) e de interface (UX-01 a UX-08). Os demais documentos permanecem preservados como arquivos de evidências e versões antigas, mas não precisam ser usados para descobrir a etapa atual. **Leia esta seção primeiro em outro chat.**

**Regra temporal:** as seções 1–7 foram redigidas em etapas anteriores. Onde o início diz que a branch ativa é a do PR #21, prevalece o estado de 18/10 descrito nesta seção. Onde uma etapa diz "não implementado", conferir se as seções 6.9–6.15 registraram depois implementação beta. Conservar tais registros, sem adulterar a cronologia. O README ainda menciona v0.50 e não define a versão de build. Os subtítulos 6.12 e 6.13 foram repetidos na cronologia; são eventos diferentes, não duplicações de código.

### 11.1 Estado e identidade verificados

| Dado | Estado antes desta consolidação documental |
|---|---|
| Produto | **PokeSearch** Android overlay — independente de PvPPokeGo e de PokéLocation |
| Repositório | https://github.com/LucianoToscano/PokeSearch |
| Fonte única para histórico e decisões | **docs/GUIA_MESTRE.md**, sem versão no nome, nesta branch |
| Branch de trabalho | **plan/v051-pogocoordinates-filtros-20261017** |
| HEAD verificado | **47540cbdce5d539001244c7c861930a835e615f0**, commit de documentação de PL/UX (18/10), antes desta edição |
| Último HEAD anterior às atualizações documentais | **fe68af33615c74649bd2b0fd265af50148aab2ad** |
| PR #22 | https://github.com/LucianoToscano/PokeSearch/pull/22 — **aberto / draft / não mesclado**, base feature/v0.51-launcher-icon-fill-20261016 |
| PR #21 | https://github.com/LucianoToscano/PokeSearch/pull/21 — **aberto / draft / não mesclado**, base main |
| Main/backups | main é base restaurada; preservar backup/v0.51-beta-before-customization-20261015, backup/main-before-v051-restore-20261016 e arquivos das versões v0.52–v0.56 para referência, sem misturar suas direções descartadas |
| Android | applicationId com.lucianotoscano.pokesearch; namespace com.lucianotoscano.pokesearchoverlay; versionCode 51 / versionName 0.51-beta; minSdk 26; targetSdk 33; compileSdk 36; JDK 17; Gradle 8.11.1 |
| Manifest consultado | Permissões INTERNET, SYSTEM_ALERT_WINDOW, FOREGROUND_SERVICE, POST_NOTIFICATIONS; MainActivity exportada como launcher; OverlayService não exportado |
| Validação | Existem testes JS/CI e APKs beta anteriores; **não existe homologação comprovada de todos os filtros/login/UX em Android real** |
| Aprovação presente | **Somente documentação. NÃO autorizado modificar Java, JS, layout, ícones, permissões, APK, assinatura, workflow, backend ou fazer merge.** |

**Hierarquia em caso de conflito:** (1) HEAD e código real para comportamento implementado; (2) decisões e estado mais recentes desta seção 11; (3) backlogs das seções 8–10; (4) diário cronológico 1–7; (5) planos/auditorias/arquivos anteriores como histórico. Não alegar que testes simulados equivalem a testes físicos.

### 11.2 Produto e preservações inegociáveis

- Regra de UX: **melhorar e organizar, nunca empobrecer**. Overlay compactíssimo, simétrico, elegante, transparente, sem bordas/margens desnecessárias; preservar **barra original de 12 controles em uma linha**, engrenagem arrastável, minimizar, fechar e recolher.
- **Janela de resultados independente da janela dos controles**: cabeçalho PNG de 21×21 em alvo de 35×30, arrastar/recolher individualmente, posições persistidas, máximo **dez Pokémon** por consulta; sprites P/M/G próximos, toque curto abre detalhes, toque longo copia coordenadas reais, despawn de segundos em tempo real.
- **18 PNGs oficiais e imutáveis sem pedido**: nove famílias com pares normal/Shiny, conforme tabela completa da seção 3, no diretório app/src/main/assets/result-icons/. As **quatro linhas de busca reais** são Raw IV A/D/S (0–15), IV% Min/Max (46 valores válidos), GL Top 1–50 e UL Top 1–50. Hundo/Nundo correspondem a configurações especiais. Os PNGs Sem filtro, Master e Cup **não** significam que tais modos estejam implementados.
- Shiny ✨ ao lado de **MODO DE BUSCA**, além da ação original da barra, e somente confirmado quando o site efetivamente habilitar; Google/Discord pela via oficial. Login deve usar mínimo de site possível e devolver o controle ao PokeSearch com sessão preservada enquanto válida.
- Filtros experimentais do PR #22: Sort by e grupos gerais/avançados (Pokémon, Form, Size, CP, Level, Gender, Weather, PvP Min CP, pré-evoluções). Mostrar somente opções comprovadamente existentes no PoGoCoordinates; não inventar VIP, mestre/copa, opções climáticas ou contratos do proxy privado de outro projeto.
- Busca AUTO OFF/5/10/15/20 minutos, botão manual, **limite mínimo global de 60 segundos** entre buscas submetidas; resultado antigo de cache até 120s somente como prévia stale, nunca como novo e nunca gerando alerta falso. Atualizar despawn localmente sem nova consulta indevida.
- Favoritos até 50, sino/notificações gerais e especiais, opções som/silencioso/OFF, teste de notificação, localização/raio opcional 0–1000 km com controles ON/OFF e ocultar separados, relatório ⚠ exportável e sanitizado, Pix de apoio voluntário, tutorial, teclado, popup posicionável e toque passando ao jogo fora das janelas.
- Não copiar GPS falso, joystick, clone de APK, chat, rastreamento, token compartilhado, servidor privado, endpoints, permissões ou chaves de PokéLocation. Referência Android externa AGPL-3.0-only, servidor MIT: observar licenças. Nunca misturar PvPPokeGo.
- APK debug pode mudar de certificado entre execuções do CI; não prometer atualização in-place. Keystore release persistente, privacidade e testes de Android 15/16 são **metas ainda pendentes**.

### 11.3 Inventário completo de documentos no GitHub

Na árvore consultada havia **95 arquivos versionados**, **36 documentos em docs/**, dos quais **13 mestres históricos v0.38–v0.50**, **este Guia Mestre sem versão** e **14 auditorias v0.38–v0.51**. O antigo arquivo central v0.51 foi renomeado para o nome neutro; seu histórico permanece recuperável no Git. Os arquivos históricos não foram alterados. **Não criar outro Guia Mestre concorrente**, apenas acrescentar entradas neste documento.

- docs/ARQUIVO_MESTRE_v0.38.md (6443 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.39.md (3849 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.40.md (5476 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.41.md (6164 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.42.md (8102 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.43.md (7338 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.44.md (3091 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.45.md (3928 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.46.md (4305 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.47.md (3172 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.48.md (3306 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.49.md (4398 bytes) — histórico/referência preservada
- docs/ARQUIVO_MESTRE_v0.50.md (11972 bytes) — histórico/referência preservada
- docs/GUIA_MESTRE.md — **Guia Mestre canônico, sem número de versão, atualizado continuamente**
- docs/AUDITORIA_v0.38.md (4563 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.39.md (2075 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.40.md (2809 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.41.md (3201 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.42.md (4360 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.43.md (5154 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.44.md (2184 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.45.md (2491 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.46.md (2859 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.47.md (2585 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.48.md (2648 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.49.md (2921 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.50.md (10534 bytes) — histórico/referência preservada
- docs/AUDITORIA_v0.51.md (1187 bytes) — histórico/referência preservada
- docs/ETAPA_02_RESULTADOS_INDEPENDENTES_SEM_COMPILAR.md (4027 bytes) — histórico/referência preservada
- docs/GUIA_COMPATIBILIDADE_ANDROID_v0.50.md (8520 bytes) — histórico/referência preservada
- docs/GUIA_TESTE_SAMSUNG_v0.48.md (3076 bytes) — histórico/referência preservada
- docs/GUIA_TESTE_SAMSUNG_v0.49.md (2882 bytes) — histórico/referência preservada
- docs/GUIA_TESTE_SAMSUNG_v0.50.md (3320 bytes) — histórico/referência preservada
- docs/GUIA_TESTE_SAMSUNG_v0.51.md (1043 bytes) — histórico/referência preservada
- docs/PLANO_INTEGRACAO_FILTROS_POGOCOORDINATES_20261017.md (22127 bytes) — histórico/referência preservada
- docs/REFERENCIA_POKELOCATION_2026-10-18.md (16760 bytes) — histórico/referência preservada

**Outros arquivos essenciais inventariados:** README.md (descrição antiga); .github/workflows/build-overlay.yml, build-v051-filters-preview.yml e secure-release.yml (CI); app/build.gradle.kts, app/proguard-rules.pro, AndroidManifest.xml; assets dock.html, overlay.html, detail.html, tutorial.html, probe.js, presets.js, shiny_login.js, login_entry.js, pokemon_catalog.json; 18 ícones da pasta result-icons; Java OverlayService, MainActivity, PokemonPicker, WatchAlerts, BugReport, DiagnosticSanitizer, IntegrityGuard, PixSupport; app/tests/probe-smoke.test.js, overlay-ux.test.js, login-entry.test.js, DiagnosticSanitizerTest.java. Arquivos de build/assets permanecem fora da consolidação e não foram editados.

**Complementos externos verificados:**
- [Drive — Complemento ao Arquivo Mestre v0.51 e auditoria PokéLocation](https://docs.google.com/document/d/1p6gK1HueyN5DTdKQk2LsSCZvlKc1pphvzVroGpUr9nQ/edit) — é referência, não fonte de decisões mais nova que este Mestre.
- [Planilha histórica PS-001…PS-080](https://docs.google.com/spreadsheets/d/1aam5N7DNnzMqJj5giZTdsAmzWkHTWPj-uKcUUVwreiI/edit) — transcrita integralmente como snapshot na seção 11.7 abaixo.
- [APK externo PokéLocation v1.2 no Drive](https://drive.google.com/file/d/1uSuww0uFIqQRyGnpYXRwJqnDsqdm76Kx/view) — 2.555.264 bytes, SHA-256 d4aba3d0a813c114a0f45a9718fdaf506198d9156655c970d18cbd2e036ac5a3, **não é APK PokeSearch**.
- Fonte oficial dos 18 PNGs: Google Drive folder ID 1YkY3WQIirk1m9Ko8c2rLBuye6agnTbI7, pasta 03_Icones_Ligas.
- Repositórios da auditoria: https://github.com/ayranoliveira1/pokelocation (AGPL-3.0-only) e https://github.com/ayranoliveira1/pokelocation-server (MIT); termos, segurança, OAuth e contrato próprios precisam de análise independente.
- Demais mestres e auditorias no Google Drive e documentos antigos são arquivo de evidência, não devem ser apagados nem tratados como branch ativa.

### 11.4 Linha do tempo única: histórico e diário

| Data/fase | Fatos e situação |
|---|---|
| 14/10, v0.38–v0.40 | Primeiras correções de IV100, Shiny, login/teclado, favoritos, relatório; PS-001…PS-022; CI não equivalente a teste Android. |
| 14/10, v0.41–v0.44 | Janelas separadas, sprites e recolhimento, UI/popup/cantos, coordenadas+raio 0–1000km, transparência; várias validações físicas pendentes. |
| 14/10, v0.45–v0.49 | Ajustes AUTO/despawn sem buscas extras, autenticação/race/cookies, diagnósticos privados, ícones de notificação, testes Samsung, fluxo de atualização/relatório. |
| 14–16/10, v0.50–v0.51 | UI limpa, autenticação com retorno, base restaurada em main, PR #21 em draft, 18 PNGs reais em resultado independente e status do launcher. |
| 17/10, PR #22 | Modos Raw/IV%/GL/UL e 46 porcentagens; Shiny no topo; Sort by/filtros gerais e avançados. Correções nos dropdowns dinâmicos e coletores. |
| 17/10, builds aprovados | GitHub Actions runs 39011424737, 39012668303 e 39013998424. **Compilação/JS success não garante filtros funcionando no dispositivo.** |
| 17/10, relato físico | Resultado vazio com ⚠ Filtro: pokemon, embora Pokémon não tenha sido escolhido; extras neutros deixaram de bloquear, limpeza explícita manteve confirmação. Regressão ainda exige reteste. |
| 18/10, PL prévia | Troca de filtros e limite de 60s: cache por contexto até 120s e contador do próximo Search, sem declarar preview atual nem emitir novos alertas; seção 6.14. |
| 18/10, login | Placeholder __FILTERS__ faltava no probe de sessão; correção e retorno automático/cookies registrados; seção 6.15, OAuth real pendente. |
| 18/10, referência | Auditoria documental PokéLocation Android/servidor, backlogs PL-01–PL-12 e UX-01–UX-08, sem autorização de implementação dessas novas etapas. |
| 18/10, **CENTRAL-001** | Proprietário ordenou **centralização de toda documentação/histórico/diário/metas/planos neste Mestre**. Operação exclusivamente editorial; arquivos históricos intocados, código/APK/merge não autorizados. |

### 11.5 Backlogs, dependências, metas e estados

**Backlog PL — ver definições técnicas integrais na seção 8.2 deste mesmo Mestre e no documento de auditoria indexado em 11.3.** Todos estão **AGUARDANDO APROVAÇÃO INDIVIDUAL** para nova alteração, mesmo que contenham código antigo relacionado.

| Ordem | ID | Prioridade | Próxima decisão |
|---|---|---|---|
| 1 | PL-01 | P0 | Contrato real de pesquisa, filtros e zero resultados; **apresentar diagnóstico, riscos, plano e testes, aguardar confirmação** |
| 2 | PL-02 | P0 | Troca reativa e geração/cancelamento/cooldown |
| 3 | PL-03 | P0 | Login/retorno/sessão e OAuth seguros |
| 4 | PL-04 | P1 | Diferenciar 0 Pokémon de 401/403/429/rede/timeout/5xx |
| 5 | PL-05 | P1 | Cache por contexto, sprites, catálogo, TTL |
| 6 | PL-06 | P1 | Sort by real e presets persistentes |
| 7 | PL-07 | P1 | Deduplicar por ocorrência confirmada (não apenas nome/PC) e conferir geral × favorito, troca de filtros, cache/stale, relogin e expiração, sem suprimir alertas legítimos; testar sons e permissões dos canais existentes. Dependência UX-05 (política de favoritos A/B ainda pendente; seção 12.19). |
| 8 | PL-08 | P2 | Histórico **local** opcional de alertas |
| 9 | PL-09 | P2 | Renderização incremental, despawn, CPU/bateria/RAM |
| 10 | PL-10 | P2 | Diagnóstico sanitizado local |
| 11 | PL-11 | P2 | Android 15/16, permissões, App Links, assinatura |
| 12 | PL-12 | P3 | Somente estudo de backend independente |

**Backlog UX — definições e dependências integrais na seção 9 deste Mestre:** UX-01 organização de Modos/Sort/gerais/avançados (parcial existente); UX-02 transparência e aparência (parte existente); UX-03 visibilidade dos dados nos sprites; UX-04 duas pesquisas opcionais (NÃO implementadas, OFF padrão e dependentes de PL-01/02/05); **UX-05 favoritos e alertas (canais e som já existentes; divergência de descrição IV100/rank #1 versus critérios ativos registrada em 12.18; melhorias/decisão A/B adicionadas em 12.19)**; UX-06 info/diagnóstico sob demanda; UX-07 AUTO e localização (parcial); UX-08 presets rápidos (dependente da PL-06). **TODOS PENDENTES DE AUTORIZAÇÃO INDIVIDUAL PARA NOVAS MUDANÇAS.**

**Metas de aceite:** (M1) filtros sempre batem com resultados realmente confirmados; (M2) zero resultados legítimos não se confundem com erro de rede/site/login; (M3) login retorna ao app e sessão persiste enquanto válida; (M4) 12 botões e 18 PNGs continuam íntegros sem regressão; (M5) consulta global mínima 60s respeitada; (M6) alertas, sprites, despawn, favoritos e toque longo preservados; (M7) validação Android 15 e 16 com relatórios sanitizados; (M8) build/assinatura verificados só quando autorizados; (M9) teste real aceito e merge apenas por confirmação.

**Máquina de estados obrigatória:** PROPOSTO → DIAGNOSTICADO → APROVADO PELO PROPRIETÁRIO → IMPLEMENTADO EM BRANCH ISOLADA → TESTADO EM CI → TESTADO NO APARELHO (quando cabível) → ACEITO → MERGE AUTORIZADO. Estado nunca avança automaticamente; PL-02 não começa por concluir PL-01.

### 11.6 Diagnóstico preliminar PL-01, sem modificar código

**Problema prioritário:** depois de escolher modos/filtros, alguns testes físicos mostraram lista vazia e o aviso ⚠ Filtro: pokemon. Outros casos, descritos nas seções 6.11–6.15, incluem Form/Size não carregados em React, formulário desaparecido após Search, espera por cooldown, cabeçalho aparentemente IV100 com dados não perfeitos e login sem retorno. Algumas correções já foram registradas na branch, mas **não foi comprovado fim a fim** que o site aceita todas as combinações de filtros no aparelho real.

**Arquivos a inspecionar primeiro:** app/src/main/assets/probe.js (apply/check/collect, filtro extra neutro, geração, Shiny, resposta); presets.js (hidratação React); dock.html (seleção e apresentação de status); OverlayService.java (requestGeneration, refresh, cache, throttle 60s, extraFiltersJson); MainActivity.java apenas quando necessário para entender sessão. Testes app/tests/probe-smoke.test.js e overlay-ux.test.js; bug report sanitizado.

**Hipóteses / riscos:** valores do formulário remoto e do Java podem divergir; alguns dropdowns só aparecem após render React; formulário pode sumir ao abrir resultados; filtros ocultos não devem impor seleção fantasma; resposta antiga pode passar por atual; campos de sort têm semântica própria; site pode retornar 401/403/429/timeout. Não assumir que endpoints privados do PokéLocation equivalem ao PoGoCoordinates público. Não reduzir a trava de 60s. Não alterar estado Shiny sem confirmação. Teste que apenas passou em mock não significa filtro funcionando no site.

**Plano proposto — AINDA NÃO APROVADO:** mapear ações reais do site e critérios verificados; reproduzir com testes isolados (Raw 15/15/15, Raw 0/0/0, IV% 91–100, GL#1, UL#1, Shiny ON/OFF), opcionais Pokémon/Form/Size, limpeza de campo, Sort by, distância e trocas durante consulta; distinguir vazio, falha, consulta pendente e prévia stale; confrontar cabeçalho/ícone com Pokémon mostrados; simular 401/403/429/5xx/timeout DOM alterado e cache. Após aprovação, mudanças mínimas em branch própria, testes e retorno para nova confirmação. **Nenhuma implementação de PL-01 autorizada neste registro.**

### 11.7 Catálogo histórico de bugs importado do Google Drive

**Snapshot de 18/10/2026, não homologação:** transcrição do catálogo original. O status "corrigido no código" se refere ao momento da planilha; evidências Android ainda devem ser executadas. IDs não contíguos NÃO devem ser reaproveitados.

| ID | Área | Prioridade | Problema relatado | Ação / correção registrada | Estado da planilha | Validação pendente |
|---|---|---|---|---|---|---|
| PS-001 | IV100 | P0 | ! no overlay sem Shiny; nenhum resultado | Raw IV 3/6 campos; alternativa % IV 100–100 com confirmação | Corrigido no código | Testar busca real sem shiny |
| PS-002 | Login | P0 | Teclado não aparece para código do treinador | WebView focável; ADJUST_RESIZE; overlay invisível durante login | Corrigido no código | Testar teclado e login Google/Discord no Samsung |
| PS-003 | Sessão | P1 | Precisava fechar/reabrir overlay após login | Restaurar overlay e recarregar sessão autenticada ao fechar login | Corrigido no código | Confirmar após vínculo do treinador |
| PS-004 | Shiny | P0 | Botão ✨ ligado mas filtro do site desligado | Exigir confirmação no site e estado pendente | Corrigido no código | Testar shiny real com código vinculado |
| PS-005 | Frequência | P1 | Consultas excessivas em atualizações manuais/automáticas | Intervalos auto >=5min; 60s entre buscas efetivamente enviadas | Corrigido no código | Testar bloqueio de repetição |
| PS-006 | Bug report | P1 | Falta suporte à exportação de erros e sugestões | Botão ⚠, log rotativo de 80 eventos, exportação TXT e WhatsApp | Corrigido no código | Testar salvar TXT/abrir WhatsApp |
| PS-007 | Diagnóstico | P2 | ! não explica o motivo | Toque em ! exibe mensagem detalhada do status | Corrigido no código | Testar toast no aparelho |
| PS-008 | Favoritos | P2 | Estrela abre Activity e interrompe Pokémon GO | Planejar seletor sobreposto dentro do overlay | Pendente | Implementação futura |
| PS-009 | Assinatura / sessão após atualização | P0 | APK DEBUG é assinado no CI temporário e pode mudar certificado; reinstalação após desinstalação elimina cookies/sessão do PoGoCoordinates (allowBackup=false) | Planejar assinatura fixa privada para **APKs de teste** usando keystore protegida e GitHub Actions Secrets; manter applicationId e incrementar versionCode. Proposta 12.21; não exportar cookies, tokens ou senhas. | Diagnóstico de código confirmado; implementação **aguardando autorização** | Validar instalação por cima em duas versões consecutivas e persistência da sessão. |
| PS-010 | Permissões | P1 | Notificações não autorizadas em Android 13+ | Solicitação runtime uma vez antes de iniciar overlay | Corrigido no código | Testar autorização e som |
| PS-011 | Ligação GL/UL | P1 | Ranks anunciados sem confirmar todos os filtros | Verificação de liga e pré-evoluções antes da busca | Corrigido no código | Testar DOM real do site |
| PS-012 | UI | P2 | Alinhamento do menu precisa teste em telas pequenas | Menu ajustado para novo ícone ⚠ | Corrigido no código | Testar à esquerda/direita e em landscape |
| PS-013 | Busca sem Shiny | P0 | Website oferece 100% IV e GL#1 com ✨ OFF; overlay exibe ! | Selecionar % IV min/max=100 no grupo correto; não exigir vínculo Shiny OFF | Corrigido v0.39 no código | Testar no Samsung e exportar ⚠ caso ! persista |
| PS-014 | Rank GL/UL | P0 | Cartões exibidos não repetem Rank 1 apesar do filtro da pesquisa | Inferir rank1 apenas se formulário comprovar liga/rank/evoluções | Corrigido v0.39 no código | Verificar resultados reais da liga |
| PS-015 | Coletor | P1 | Site mostra Showing N spawns; overlay não reconhece cartões | Comparar total do site e leitor; reportar motivo do erro | Corrigido v0.39 no código | Testar com DOM real |
| PS-016 | Shiny opcional | P1 | Dialog de vínculo Shiny bloqueava busca com Shiny OFF | Checar vínculo só se usuário pediu ✨ ON | Corrigido v0.39 no código | Validar primeira abertura sem login |
| PS-017 | Login | P0 | Rodapé nativo CANCELAR/VOLTAR AO OVERLAY bloqueava a página e a digitação | Dialog fullscreen com ✓ Voltar discreto no topo e WebView redimensionável | Corrigido v0.40 no código | Testar login Google/Discord e código de amizade |
| PS-018 | Favoritos | P0 | Ao tocar ★ retornava à tela inicial do app e saía do jogo | Picker no próprio TYPE_APPLICATION_OVERLAY com busca e sprites | Corrigido v0.40 no código | Testar teclado, pesquisa e retorno ao Pokémon GO |
| PS-019 | Menu de modos | P1 | Toque mudava modo e AUTO sem oferecer opções visíveis | Popovers sob 100%/GL#1/UL#1 e AUTO 5/10/15/20m | Corrigido v0.40 no código | Testar escolha em bordas direita/esquerda |
| PS-020 | Shiny OFF | P1 | Desligar brilhante não devia alterar modo e refresh podia ficar bloqueado | Preserva modo; agenda pesquisa assim que terminar intervalo mínimo 60s | Corrigido v0.40 no código | Testar filtro e restrição de consultas |
| PS-021 | Tutorial | P2 | Falta legenda inicial para os botões | Guia na primeira abertura com atalho permanente ⓘ | Corrigido v0.40 no código | Testar aparecimento uma vez |
| PS-022 | Sprites | P1 | Linhas de 40dp continham imagens de 45dp gerando sobreposição | Linha tamanho do sprite + 10dp; scroll sem barra para muitos resultados | Corrigido v0.40 no código | Testar espaçamento real e rolagem |
| PS-031 | Localização | P1 | Filtro de coordenadas e raio opcional | Ícone 📍 único; input + chave ON/OFF e slider 0–1000km | Corrigido no código v0.42 | Testar no Android |
| PS-032 | Filtro OFF | P1 | Desligar filtro deve retirar valores | Limpa inputs do site e prefs antes de pesquisar | Corrigido no código v0.42 | Validar no site |
| PS-033 | Expressões | P1 | Regex incorreta no leitor de resultados e coord. | Escape corrigido; CI passou | Corrigido no código v0.42 | Teste físico pendente |
| PS-034 | Painel | P2 | Ocultar não deve desativar o filtro | Ação Ocultar independente da chave ON/OFF | Corrigido no código v0.42 | Verificar interação |
| PS-035 | 📍 Raio ativo | P2 | Raio aplicado não era visível com menu de opções fechado | Botão 📍 com pequeno valor em km + etiqueta no dock quando ON, sem um segundo botão | Corrigido no código v0.43 | Testar 0, 50 e 1000km e estado OFF |
| PS-036 | Barra de opções | P1 | 12 controles distribuídos em 11 colunas; X podia cair para outra linha | Grade de 12 colunas; X continua ao lado do coração | Corrigido no código v0.43 | Conferir alinhamento em telas pequenas |
| PS-037 | Editor de localização | P1 | Trocar de painel 📍 para AUTO/ligas mantinha foco de teclado | Liberar foco e remover largura especial ao alternar opções | Corrigido no código v0.43 | Testar digitação e alternância em Android |
| PS-038 | Menu overlay | P0 | Menu fica por cima da engrenagem perto das bordas | Reposicionamento adaptativo horizontal/vertical para deixar engrenagem acessível | Corrigido no código v0.44 | Testar nos quatro cantos do Android |
| PS-039 | Barra UI | P1 | 12 ícones ficam invertidos ou desalinhados | Grid proporcional de 12 colunas e ordem LTR preservada | Corrigido no código v0.44 | Conferir em diferentes larguras |
| PS-040 | Recolher | P1 | Seta para recolher não apresenta fundo visível | Fundo escuro opaco, borda e área de toque ampliada | Corrigido no código v0.44 | Verificar visual e toque no telefone |
| PS-041 | AUTO | P1 | Botão de intervalo parece não funcionar | Menu reposicionado e confirmação Toast ao alterar frequência | Corrigido no código v0.44 | Testar escolha 5/10/15/20m |
| PS-042 | Atualização | P1 | Botão ↻ aparentemente sem resposta | Feedback imediato de toque e status de busca em andamento, mantendo limite de 60s | Corrigido no código v0.44 | Testar consulta real e limite mínimo |
| PS-043 | Favoritos UX | P2 | Painel de favoritos muito opaco | Fundo translúcido alpha 188/255, borda sutil e dim reduzido | Corrigido no código v0.44 | Validar transparência e teclado Android |
| PS-044 | Localização | P1 | Raio vazio pode ser interpretado como 0 km | Exigir texto de raio presente e modo Coords confirmado antes de buscar | Corrigido no código v0.44 | Testar 0, 50 e 1000km no site |
| PS-045 | Coordenadas | P1 | Validação de coordenadas Java aceitava substring | Validação do campo inteiro com intervalo permitido | Corrigido no código v0.44 | Testar entradas malformadas |
| PS-046 | Coordenadas Pokémon | P1 | Mesmo nome pode ter coordenadas de outro spawn | Comparação adicional de CP ao extrair coordenadas | Corrigido no código v0.44 | Validar com DOM e spawns duplicados |
| PS-047 | Desempenho | P2 | Redimensionamento pode ser chamado várias vezes no mesmo frame | Coalescência do fit em requestAnimationFrame | Corrigido no código v0.44 | Medir resposta em Android físico |
| PS-048 | AUTO/Expiração | P1 | Vencimento de Pokémon provocava consultas extras a cada ~60 segundos | Remover refresh da limpeza local e rearmar apenas deadlines; manter AUTO a cada 5/10/15/20 min | Corrigido no código v0.45 | Verificar temporização no Android e no site |
| PS-049 | Login | P1 | Busca antiga podia terminar/submeter durante autenticação | Invalidar geração, cancelar atualização atrasada e retomar com verificação após login | Corrigido no código v0.45 | Testar login Google/Discord e volta segura |
| PS-050 | Shiny | P1 | Relatórios 0.42/0.43 mostram Shiny não confirmado após abrir login | Distinguir vínculo pendente de Shiny não comprovado e manter Shiny OFF disponível | Corrigido no código v0.45 | Validar sessão e vínculo do treinador no site |
| PS-051 | Relatórios | P2 | Faltava estado categórico de sessão nos logs | Registrar somente autenticação: autenticada/login necessário/não confirmado e Shiny solicitado | Corrigido no código v0.45 | Verificar exportação sem dados pessoais |
| PS-052 | Atualizar manual | P2 | Mensagem dizia aguardar quando a busca não estava agendada | Informar tocar novamente após pesquisa atual; manter feedback Toast | Corrigido no código v0.45 | Testar toque e resposta no Android |
| PS-053 | Shiny | P2 | Diálogo de vínculo pode aparecer em inglês | Reconhecer link/connect account sem extrair conteúdo sensível | Corrigido no código v0.45 | Validar DOM do site em inglês |
| PS-054 | Popup menus | P0 | 100%/GL/UL, AUTO e 📍 visíveis, mas painel recortado e sem toque | Permitir overflow visível no WebView separado e redimensionamento da janela nativa | Código corrigido · CI verde v0.46 · Android pendente | Abrir todos os popovers em tela real |
| PS-055 | Engrenagem | P1 | Engrenagem encoberta ou com toque pequeno perto das bordas | Fundo escuro e alvo 35×30dp, posicionamento não sobreposto | Código corrigido · CI verde v0.46 · Android pendente | Teste de drag e clique nos cantos |
| PS-056 | Recolhimento | P1 | Seta pequena e fundo invisível | Seta 40×32dp, fundo escuro sólido, contorno | Código corrigido · CI verde v0.46 · Android pendente | Testar recolher/restaurar com sprites |
| PS-057 | Menu invertido | P1 | Botões não invertem quando menu muda de lado | CSS RTL à esquerda + syncMenu nas duas WebViews e fallback por lado da tela | Código corrigido · CI verde v0.46 · Android pendente | Testar em ambos os lados e extremidades |
| PS-058 | Resposta | P1 | Mode/AUTO/refresh sem confirmação perceptível | Feedback visual imediato e toast/contador de cooldown | Código corrigido · CI verde v0.46 · Android pendente | Testar IV100 GL UL AUTO e atualizar |
| PS-059 | Favoritos | P2 | Janela de favoritos parece sólida | Gradiente translúcido alpha 187→159, borda, sem escurecimento do jogo | Código corrigido · CI verde v0.46 · Android pendente | Testar Android com Pokémon GO atrás |
| PS-060 | Autenticação | P0 | Ao logar aparece página do site no fundo | Não iniciar OverlayService a partir de login da Home; verificar isRunning | Código corrigido · CI verde v0.46 · Android pendente | Login sem overlay e com overlay ativo |
| PS-061 | Volta após login | P1 | Após autenticar continua em PoGoCoordinates em vez de Home | Fechar tela de login quando sessão detectada; Shiny somente após confirmação do filtro; manter ✓ PokeSearch | Código corrigido · CI verde v0.46 · Android pendente | OAuth real Google/Discord e vínculo |
| PS-062 | Home | P1 | Sem controles login e logoff na tela inicial | Adicionar Entrar/vincular, Sair e status da sessão | Código corrigido · CI verde v0.46 · Android pendente | Validar toque e acessibilidade |
| PS-063 | Logout | P1 | Sem opção de desconectar sessão local | Parar overlay, remover cookies e WebStorage, manter favoritos | Código corrigido · CI verde v0.46 · Android pendente | Testar logout e novo login real |
| PS-064 | Latência UI | P2 | Redimensionamentos redundantes deixam interface lenta | Cache de geometria native, fit limitado a requestAnimationFrame | Código corrigido · CI verde v0.46 · Android pendente | Medir performance Android real |
| PS-070 | Notificações | P1 | Ícone genérico nas notificações do serviço e favoritos | Criar vetor monocromático e substituir os três setSmallIcon | Corrigido no código v0.48; Android pendente | Conferir visibilidade e contraste no Samsung |
| PS-071 | Privacidade relatório | P1 | Exportador não filtrava password/token e outros formatos comuns | DiagnosticSanitizer, limpeza antes de armazenar e ao exportar, 29 asserções | Corrigido no código v0.48; Android pendente | Revisão manual do TXT continua necessária |
| PS-072 | Exportação TXT | P1 | Substituição global de barra+n podia criar linhas artificiais | Gerar delimitadores reais diretamente no StringBuilder | Corrigido no código v0.48; Android pendente | Testar descrição com barra+n literal |
| PS-073 | Diagnóstico | P2 | Exceções de notificações e remoção de janelas eram ignoradas | Registrar somente etapa e nome da classe da falha | Corrigido nos caminhos listados; demais em revisão | Exportar relatório após falha de notificação |
| PS-074 | Testes Samsung | P2 | Faltava roteiro reproduzível de testes físicos | Criar GUIA_TESTE_SAMSUNG_v0.48.md | Roteiro criado; execução física pendente | Testar corners, OAuth, Shiny e 30 minutos |
| PS-075 | Notificações | P1 | Botão WatchAlerts.test inexistente na UI | Botões Favoritos e Preferências; toggles alerts/som e feedback de permissão | Corrigido em v0.49 / CI verde | Testar no Samsung, permissões habilitadas e negadas |
| PS-076 | Login / OAuth | P1 | Voltar Android fechava diálogo mesmo com histórico | Dialog OnKeyListener com KEYCODE_BACK e website.goBack | Corrigido em v0.49 / CI verde | Validar Google/Discord/PoGoCoordinates real |
| PS-077 / B06 | Login / refresh | P1 | Refresh LOGIN_END e onPageFinished competiam com cookies | Runnables nomeados canceláveis, geração, reload 350ms e limpeza onDestroy | Corrigido em v0.49 / CI verde | Validar login/logout em busca pendente e rede lenta |
| PS-078 | Coordenadas | P1 | Sinal + rejeitado ou não sanitizado | Regex [-+]? no Sanitizer, OverlayService e dock; teste Java | Corrigido em v0.49 / CI verde | Validar coordenadas com sinal + no Android |
| PS-079 | Menu | P2 | Flicker LTR/RTL ao abrir menu à esquerda | Calcular posição antes de syncMenu; uma sincronização de abertura por WebView | Corrigido em v0.49 / CI verde | Abrir menu em ambos lados/cantos Samsung |
| PS-080 | Código e privacidade | P2 | Retorno IV100 morto e texto relatório prometia proteção total | Retorno inalcançável removido, aviso orienta revisão | Corrigido em v0.49 / CI verde | Verificar UI e relatório TXT no Samsung |

**Complementos de bugs posteriores à planilha (17–18/10):**
- PS-V051-01: dropdown React/valores neutros não reconhecidos, tentativa antes de render; correções de open/read/close e retry (6.11), teste real pendente.
- PS-V051-02: Search/Collect descartava Pokémon porque formulário sumia após Search; confirmação anterior estritamente na mesma geração (6.12 e 6.13), reteste pendente.
- PS-V051-03: ⚠ Filtro: pokemon com opção padrão neutra; somente seleções explícitas devem restringir, mantendo limpeza explícita segura (6.13), reteste pendente.
- PS-V051-04: mudança de modo parece lenta; cache stale e contador de 60s já registrados (6.14), validar troca rápida e expiração.
- PS-V051-05: login não voltava; __FILTERS__ faltante na verificação e fluxos de retorno/cookies registrados (6.15), teste real OAuth pendente.
- PS-V051-06: captura mostra cabeçalho IV100 com IVs 4/4/11, 2/14/2 e 0/13/13; é hipótese de associação incorreta, não defeito comprovado no HEAD. Investigar em PL-01/02.

### 11.8 Diário e protocolo para novos chats


**ENTRADA CENTRAL-002 — 18/10/2026 — PADRONIZAÇÃO DO GUIA (DOCUMENTAÇÃO):** por decisão expressa do proprietário, este arquivo deixa de levar `v0.51` no nome ou no título: agora chama-se exclusivamente `docs/GUIA_MESTRE.md`, cobrindo todas as versões passadas e futuras do PokeSearch. O antigo caminho da v0.51 foi renomeado no Git (recuperável pelo histórico), referências atuais atualizadas em README e documentos de apoio. Versões antigas continuam como arquivos históricos, não como guias ativos. Nenhum código, PNG, build, APK, workflow, backup, branch principal ou merge do aplicativo foi alterado. PL-01 e demais etapas continuam aguardando autorização.

**ENTRADA CENTRAL-001 — 18/10/2026 — DOCUMENTAÇÃO:** Reunidos fatos das versões v0.38–v0.51, auditorias, guias Samsung/compatibilidade, plano de filtros, referência PokéLocation, PR #21/#22, Manifest/Gradle, árvore completa e planilha histórica de bugs; atualizado **somente este arquivo**. PL-01 aguarda apresentação e autorização; nenhuma alteração executável nem APK por esta entrada.

**Template para registrar cada próxima decisão, obrigatoriamente aqui:**
1. Data/hora, número do diário, pedido e etapa PL/UX/PS; objetivo e motivo.
2. Estado ANTES, proposta, arquivos, riscos, preservações e testes planejados.
3. **Citação da aprovação expressa** ou SEM AUTORIZAÇÃO; não converter intenção em autorização.
4. Branch e SHA antes; diff/arquivos alterados e SHA após; backups/PR preservados.
5. Resultado real de testes JS/CI (com run), de APK e de Android/site (dispositivo/evidência ou NÃO TESTADO).
6. Bugs abertos/reabertos, decisões, rollback, aceitação, próxima etapa **AGUARDANDO CONFIRMAÇÃO**.

**Prompt único para começar outro chat:**

> Continue PokeSearch v0.51 na branch plan/v051-pogocoordinates-filtros-20261017. Leia o único docs/GUIA_MESTRE.md (principalmente seção 11, histórico, metas, diário e PL/UX); confira HEAD e PR #21/#22. Preserve interface original, 18 PNGs, 12 controles, backups, main e PvPPokeGo separado. Comece pelo diagnóstico/proposta da PL-01; não altere código, não gere APK e não faça merge sem minha confirmação expressa. Registre cada decisão, teste e resultado nesse mesmo Mestre.

**REGRA DE RETENÇÃO:** centralizar a consulta e as decisões em um só Mestre **não autoriza excluir documentos antigos**. O histórico completo do Git e os arquivos de referência continuam disponíveis para verificação e recuperação.

---

## 12. CONSOLIDAÇÃO INTEGRADA — PoGoCoordinates + exportações JSON + PokéLocation + banco de dados (18/10/2026)

**CENTRAL-002 / REGISTRO DOCUMENTAL APROVADO NESTE CHAT.** O proprietário solicitou ler e confrontar o Guia Mestre completo, a implementação atual do PokeSearch, as capturas do PoGoCoordinates, duas exportações JSON e o APK original PokéLocation; planejar melhorias, correções, caminhos e banco de dados; e **registrar TUDO aqui para continuidade em novo chat**. Esta autorização abrange exclusivamente este registro no **mesmo** `docs/GUIA_MESTRE.md`. **Não autoriza** alterar app, assets, banco de dados físico, filtros executáveis, sessão, permissões, GitHub Actions, release/APK, branches de produção ou merge. As seções 1–11 preservam cronologia e governança; a presente seção 12 é o **checkpoint mais recente** e prevalece sobre dados antigos quando houver divergência temporal. Não criar um segundo mestre nem renomear este com número de versão; preservar documentos antigos como referências, sem duplicar autoridade.

### 12.1 Fontes, evidências, integridade e fronteiras da verificação

| Fonte | Evidência verificada nesta rodada | Limite |
|---|---|---|
| PokeSearch em `plan/v051-pogocoordinates-filtros-20261017` | HEAD de leitura `96e365a53c278f4a42b05751c7e6e109796f070e`, PR #22 aberto/draft (base `feature/v0.51-launcher-icon-fill-20261016`), árvore de 113 entradas; `docs/GUIA_MESTRE.md` lido integralmente (643 linhas antes deste anexo) | HEAD muda com o commit exclusivamente documental; reconsultar antes de editar |
| Código e configuração Android | `app/build.gradle.kts`, Manifest, `probe.js`, `dock.html`, `presets.js`, `pokemon_catalog.json`, `OverlayService.java` e `MainActivity.java` identificados; fluxo e riscos confrontados com seções 6 e 11 | Não houve build ou teste físico nesta rodada; detalhes dinâmicos de `OverlayService` conforme auditoria prévia |
| Capturas PoGoCoordinates 18/10 | Formulários Search/Stats/PvP, seletores múltiplos, Sort by, Weather, VIP, Search results/Get coords, Global Pokemap e seus filtros, perfil/sessão/exportação | Captura comprova opções de tela, **não** protocolo de rede, direitos da conta nem sucesso da busca ao selecionar todas as combinações |
| Exportação original `saved-filters-2026-10-18.json` | 7.814 bytes, SHA-256 `eb8aaf872794ef56a50f7fa70a284b59fad18ac8c99709f185c21f900af0468d`, 5 registros | Formato de exportação, **não** contrato garantido de POST /search nem autorização para API |
| Segunda exportação `saved-filters-2026-10-18 (1).json` | 9.073 bytes, SHA-256 `d3fafa26321063f85c93c87e931e22afcb7e459fb9855234b63c4e6820cf4a7b`, 5 registros | Trata-se de um snapshot diferente; preservar ambos |
| APK PokéLocation recuperado do Drive | `pokelocation-v1.2-release.apk` 2.555.264 bytes; SHA-256 `d4aba3d0a813c114a0f45a9718fdaf506198d9156655c970d18cbd2e036ac5a3`; ZIP válido, 924 entradas, 2 DEX, 170 PNG, 683 XML, classes de PoGo e strings de /lookup e /search | Conferência estática, não execução, homologação, autorização de uso de imagens nem auditoria completa de segurança |
| Código-fonte externo | `ayranoliveira1/pokelocation`: `Pogo.java`, `PogoFilter.java`; `pokelocation-server`: `internal/pogo/upstream.go`; confrontados com `docs/REFERENCIA_POKELOCATION_2026-10-18.md` | APK original fornecido e binário público do GitHub podem divergir em SHA; não considerá-los idênticos sem comparar |
| Banco de imagens Google Drive | Pastas reais verificadas abaixo; `catalogo_imagens.json` tem esquema 1.0, data 18/10, `total_unique_files=3065`, `unique_sha256=2843`, `duplicates_dropped=0` | Os nomes dos contadores exigem reconciliação: **3065 arquivos catalogados != 2843 hashes diferentes**. Não apagar ou deduplicar sem inventário/decisão |

**Privacidade:** os arquivos e capturas contêm dados identificadores de conta/treinador e possíveis coordenadas. Não replicar e-mail, código de treinador, cookies, senhas, tokens, ou dados pessoais no mestre, nos relatórios ou exemplos de código. Guardar no mestre apenas nome dos arquivos, hashes, paths de referências e fatos técnicos. Os exemplos de busca nunca devem transportar códigos secretos nos logs.

### 12.2 Baseline do NOSSO aplicativo — preservar integralmente

- Identidade: PokeSearch, repositório `LucianoToscano/PokeSearch` (NUNCA misturar com `LucianoToscano/PvPPokeGo`, PokéLocation ou projetos PokeLOT/PGSharp). `applicationId=com.lucianotoscano.pokesearch`, `namespace=com.lucianotoscano.pokesearchoverlay`; Gradle identifica `versionCode=51`, `versionName=0.51-beta`, JDK17, `compileSdk=36`, `targetSdk=33`, `minSdk=26`.
- Manifest Android conferido: INTERNET, SYSTEM_ALERT_WINDOW, FOREGROUND_SERVICE, POST_NOTIFICATIONS; launcher MainActivity exportado, OverlayService não exportado; `android:allowBackup=false`; não introduzir localização GPS simulada ou permissões extras pelo fato de outro APK usá-las.
- **Interface NÃO substituível:** 12 controles originais, engrenagem arrastável, overlay translúcido/compacto, janelas controles/resultados separadas, P/M/G, menu lateral/recolhimento, sprites lado a lado, 10 Pokémon, imagem de modo 21×21, 18 PNGs oficiais (9 famílias normal/Shiny), toque em sprite abre detalhes, toque longo copia coordenadas **confirmadas**, temporizador dinâmico, AUTO OFF/5/10/15/20, toque ↻, alerta sino, favoritos/estrela, Pix, relatório ⚠, tutorial, localização 0–1000 km, posições e preferências persistentes.
- **Modos reais da branch:** Raw IV A/D/S 0–15; IV% Min/Max limitado às 46 porcentagens possíveis; GL Top 1–50; UL Top 1–50. Raw 15/15/15 e 0/0/0 e percentuais exatos escolhem ícones Hundo/Nundo; Shiny é dimensão independente, efetiva só após confirmação. `none/master/cup` existem como ícones **não significando três buscas implementadas**.
- O PR #22 tem filtros experimentais em `dock.html`/`probe.js` e correções históricas: interação assíncrona dos dropdowns React; campos extras neutros; confirmação imediatamente antes do Search/mesma geração; cache de no máximo 8 contextos até 120 segundos como **prévia stale**; contador da consulta agendada; correção de substituição `__FILTERS__` no diagnóstico de login. Nada disso foi homologado em Android real nesta rodada.
- Política de consulta: **piso global de 60 segundos entre buscas efetivamente submetidas**; fila coalescida pela última escolha, sem tocar em endpoints clandestinos, redistribuir tokens de terceiros, aumentar quota ou contornar limite VIP. Mudança visual imediata não garante busca remota imediata.

### 12.3 Inventário fiel do PoGoCoordinates: Search versus Global Pokemap

| Recurso | Busca tradicional /search, observado nas capturas | Mapa Global, observado nas capturas | Implicação |
|---|---|---|---|
| Pokémon | Vários Pokémon/formas com etiquetas, busca por nome/form/dex, seleção/remover individual e contador | Whitelist/Blacklist com vários Pokémon e etiquetas | **Arrays/identidades canônicas**, não texto único |
| Ordenação | 5 valores: `Despawn (longest)`, `CP (highest)`, `IV % (highest)`, `Level (highest)`, `Distance (nearest)` | 4: `Highest IV`, `Most time left`, `Highest CP`, `Highest level` | Ordenação ANTES de cortar os resultados; dropdowns são contratos de UI diferentes |
| IV | % Min/Max ou Raw A/D/S; CP e Level Min/Max | IV%, CP, Level com controles Min/Max | Não presumir Raw IV no mapa |
| PvP | Great League, Ultra League, Top ranking 1–50, incluir pré-evoluções Yes/No, Min CP | Não confirmado como filtro do mapa | GL/UL ficam isolados do percentual IV tradicional |
| Weather | Any, Boosted, Sunny, Rainy, Partly Cloudy, Cloudy, Windy, Snow, Fog | Any ou Boosted only | Não copiar a lista climática completa de Search para o mapa |
| Size | Multiseleção comprovada; capturas exibem XXS, XS, S, M, L, XL (fim da lista não mostrado) | Multiseleção XXS, XS, M, L, XXL observada | XXL confirmado no **mapa**; validar opções em Search separadamente |
| Form | Multiseleção incluindo 01, 02, Apex, Normal, 00, 03, 04 (catálogo possivelmente maior) | Form não mostrado como dropdown separado | Opções e IDs dependem da espécie/catálogo; não assumir equivalência universal entre 01 e outra forma |
| Gender | Any, Male, Female, Genderless | Mesma família vista | Um valor, não multiseleção |
| Location | Area textual `Location contains` OU Coords + raio máx. 1000 km; `Use my location`, `Clear` | Navegação por mapa, busca cidade/lat,lng, mapa se atualiza depois de mover | Dois métodos geográficos não equivalem à permissão Android de localização |
| Advanced | VIP: Min TTL, Exclude Pokémon, Exclude Forms | Advanced recolhível (opções ainda não capturadas) | **Não contornar VIP**, não presumir mesmas opções |
| Results | Conta Free logada: `Showing 10 spawns`; cartões com sprite, #dex, sexo, tamanho, CP, LVL, IV% e A/D/S, golpes, local, distância, despawn | 99 marcadores com seletor Results 100 na captura | **100 no mapa ≠ direito a 100 resultados /search** |
| Coordinates | Cartão pode exibir coordenadas + `Open in Maps`, ou botão `Get coords` sem coordenadas visíveis | Marcadores/tile não são necessariamente coordenadas exatas | Estados obrigatórios `unavailable`, `reveal_required`, `confirmed`, `error` |
| Login/profile | Google vinculado, Discord não; conta Pokémon GO vinculada 1/1 no plano Free; associar provedores pode mesclar identidades; desvinculação conta GO limitada | Shiny vinculado à conta também no mapa | Não automatizar vínculo/desvínculo nem salvar códigos de treinador |
| Backup do serviço | Saved filters e exportação JSON; outros exports próprios (Custom feeds/Notification rules, alguns VIP) | Filtros salvos no popup do mapa | Modelo de backup LOCAL do PokeSearch deve ser seu próprio schema e validar conversão |

**Limite de certeza:** as capturas permitem afirmar opções VISÍVEIS; a exportação permite afirmar nomes de CAMPOS exportados; apenas um teste real autorizado da página e seus resultados confirma efetividade da busca e semântica de rede. A tela do mapa mostra aviso de cobertura condicionada aos scanners do próprio serviço; baixa densidade não é prova de inexistência de spawns.

### 12.4 Exportações reais dos filtros salvos — diff e schema

**As duas exportações possuem 5 registros; 4 registros mantêm mesmo ID e conteúdo e 1 foi substituído no conjunto exportado.** Não afirmar que o registro anterior foi necessariamente excluído do servidor. Cada `spec` possui **34 campos**, mantendo chaves inativas com `null`, `[]` ou booleanos. Especificação de dados **não é protocolo de request**.

| Nome | Snapshot original | Snapshot novo | Núcleo |
|---|---|---|---|
| LOT | sim | sim | 46 IDs de espécies, 5 `species_forms`, `pvp_mode=true`, GL#1, `sort=DSP` |
| LOT1 | sim | sim | 27 IDs, 3 formas, `sort=LEVEL`, GL#1 |
| PvpGL | sim | sim | 15 IDs, 2 formas, GL#1, `sort=DSP` |
| shi | sim | sim | 12 IDs, Shiny=true, Raw IV 15/15/15, **também `pvp_mode=true`**; validar qual modo ativo prevalece no carregamento |
| shi2 | sim | não | 7 IDs, Shiny=true, Raw 15/15/15, `pvp_mode=false` |
| testeee22222 | não | sim | 46 IDs, 5 formas, Shiny=true, `iv_mode=percent`, `iv_percent_min=max=100`, `pvp_mode=false`, gênero Genderless, 6 tamanhos e 6 nomes de forma |

No novo `testeee22222`, `sizes=["XXS","XS","M","S","L","XL"]`; `forms=["00","Artisan","Archipelago","Aria","Dragon","Alola"]`. Não inferir que XXL é proibido; apenas **não aparece no filtro salvo**. Os 46 IDs e 5 `species_forms` de `testeee22222` coincidem com LOT. `pvp_mode=false` embora `pvp_league="great"`, `pvp_top_rank=1` persistam: **campos inativos não devem disparar o modo PvP**. No filtro `shi`, Raw IV e `pvp_mode=true` coexistem: investigar precedência SEM alterá-la por palpite. `shiny_account=null` nos filtros Shiny não significa comprovadamente conta desvinculada; o vínculo pode estar na sessão/perfil.

**Mapa de campos exportados (não nomes garantidos do endpoint):**

- Identidade de espécies: `pokemon_ids: number[]`; `species_forms: {pokemon_id,form_id,costume_id|null}[]`.
- Exclusões: `blacklist_pokemon_ids: number[]`, `blacklist_species_forms: []`, `blacklist_forms: string[]`.
- Modos e IVs: `iv_mode`, `iv_percent_min/max`, `raw_iv_atk/def/sta`, `pvp_mode`, `pvp_league`, `pvp_top_rank`, `pvp_include_pre_evolutions`, `pvp_min_cp`.
- Stats: `cp_min/max`, `level_min/max`, `sizes: string[]`, `forms: string[]`, `gender`, `boosted`, `weather_id`, `min_ttl`.
- Contexto: `location`, `center_lat/lng`, `radius_km`, `sort` (`DSP` e `LEVEL` **confirmados no export**, demais códigos desconhecidos), `shiny_only`, `shiny_account`, `background_only`.

**Conseqüência arquitetural:** distinguir o estado `draft` (ainda editando), o `requested` (submetido), o `verified` (site confirmou), o `resultOrigin` (geração/conta/filtro/local/ordenação) e o `displayed` (novo ou prévia antiga). `null`, lista vazia e `false` não devem ser confundidos, e filtros de Stats/PvP não podem vazar uns para os outros.

### 12.5 Matriz de integração: risco atual → correção proposta → teste de aceitação

| ID (sem reutilizar PL/UX/PS históricos) | Evidência/código atual | Correção **A PROPOR E APROVAR** | Teste obrigatório |
|---|---|---|---|
| PSC-01 P0 | `dock.html` tem `searchSettings.pokemon/form/size` como `string`, e `probe.js:EXTRA_LABELS/extras/extraSelect/extraMatches` compara campo como **uma string**; site e JSON aceitam múltiplas espécies, formas e tamanhos | Converter para arrays tipados com IDs, migração de preferências antigas, editor multiseleção compacto, seleção/aplicação atômicas, confirmação de cada chip; não limpar filtro não solicitado | 2+ Pokémon inclusive variantes, 2+ Size, 3+ Forms, remover um item, limpar último, reiniciar app e conferir ambos os lados |
| PSC-02 P0 | `probe.js:collect().matches` permite **`!x.iv`** no Raw e **`x.ivPercent===""`** no % como compatíveis; é possibilidade de resultado sem IV comprovado | Distinguir `IV desconhecido` de `IV correspondente`; bloquear atribuição enganosa de Hundo/Nundo ou % e separar cartão inconclusivo; nenhuma classificação IV100 se informação real divergir | Raw 15/15/15 com cartão sem IV ou 4/4/11; IV% 100–100 e 91–100 com campos ausentes; rollback seguro |
| PSC-03 P0 | Seleção opcional de Pokémon genérica gerou historicamente `⚠ Filtro: pokemon`; portal React requer abrir e aguardar menu | Nunca exigir `Any` não selecionado; limpar valores anteriores quando solicitado; descobrir portal DOM depois de render, sem capturar popup errado | Sem espécie funciona; alternar Pikachu→Any; Forma depende de espécie; sem truncar listas |
| PSC-04 P0 | `siteOptions()` limita opções descobertas a 80 textos sem identidade; seletor site tem múltiplas espécies/formas pesquisáveis | Paginar/pesquisar catálogo de modo incremental, guardar `dex/form/costume`, evitar colidir IDs ou nomes; preferir catálogo verificável, não colher todo DOM indiscriminadamente | Entrada por #dex/nome/form; Pokémon homônimos e variantes; resultado após scroll em lista longa |
| PSC-05 P0 | Cartão da pesquisa mostra `Get coords` ou coordenadas + `Open in Maps`; `parseCard` separa dados visuais e coordenadas podem não vir no primeiro resultado | Estados por encontro: `no_coord/reveal_needed/reveal_pending/confirmed/reveal_failed`; revelar por ação autorizada, sem duplicar ou gastar limite desnecessário; long press só copia dado confirmado | Dois cartões mesmo nome/CP; revelar, reabrir, 403/429/rede, evitar atribuição de coord. a ocorrência diferente |
| PSC-06 P0 | Troca de Raw/%/GL/UL e cache até 120s por filtros da branch; Shiny associado a uma conta do site | Chave de geração com espécie/forma/tamanho **listas canônicas**, modo, sort, coords, raio, Shiny e sessão; prévia antiga rotulada; nunca notificar a partir dela | Alternar 5 vezes antes de 60s, voltar ao cache, mudar login, excluir expired, mostrar contagem até próximo Search |
| PSC-07 P1 | Ordem do site determina seleção dos 10; Search tem 5 sorts, mapa 4; export `DSP/LEVEL` só documenta armazenamento | Selecionar + ler opção real do formulário ANTES do Search; preservar ordenação remota dos primeiros 10; fallback/erro sem fingir sort aplicado | Despawn longest, IV%, CP, nível, distância; empate estável; troca com resultados antigos |
| PSC-08 P1 | Weather Search tem 9 opções, Map só Any/Boosted; `sizes` e `forms` exportados arrays | Detectar capacidade **por página/conta/plano**, validação tipada (seleção única vs múltipla), não inventar `Not Boosted`; VIP indisponível fica bloqueado e explicado | Boosted, clima individual; XXS/XXL, não confundir map/search; Advanced VIP bloqueado no Free |
| PSC-09 P1 | `pvp_mode` e modo Raw coexistem nos snapshots; GL/UL apenas; ranque individual nem sempre consta nos cartões | Resolver precedência **somente com prova da UI/site**, não inferir IV/Rank como certeza a partir do título do ícone; distinguir `rank observado` de `Top N verificado` | GL#1 e UL#1, pré-evoluções Yes/No, Min CP, filtro Shiny, combinação Raw inativa |
| PSC-10 P1 | Login Google/Discord, conta GO vinculada, Shiny por identidade; correção `__FILTERS__` já existente | Testar retorno após OAuth, CookieManager/flush seguro, expiração; sem armazenar tokens/códigos; não vincular nem excluir conta automaticamente | Login/logout, volta com overlay, app fechado/reaberto, 401/403, troca conta/sem Shiny |
| PSC-11 P1 | Respostas do serviço podem vir como sucesso, 0 resultados, campo ausente, 401/403/429, 504, timeout; audit PokéLocation tipa erro e respeita Retry-After | Máquina de estados clara `idle/configuring/searching/results/empty/queued/stale/auth_required/rate_limited/error`; nunca usar lista vazia em substituição silenciosa | Todos os códigos e rede lenta, retry sem violar 60s, relatório sanitizado |
| PSC-12 P2 | O catálogo/imagens Drive existem e `pokemon_catalog.json` do APK contém nomes por dex; sprites podem ficar sem imagem/custo de rede | Catálogo versionado, mapeamento sprite por número+forma+traje, fallback e cache de imagens com licença/proveniência e hash, sem bundle desnecessariamente enorme | Visual do overlay P/M/G sem flicker; sprite ausente; forma errada; performance/memória e offline |
| PSC-13 P2 | Filtros exportáveis têm IDs, nomes, `created_at`, `spec` de 34 campos | Perfis locais importáveis/exportáveis **com schema próprio e migração**, nunca importar credenciais/trainerCode; não sobrescrever filtros atuais silenciosamente | Cópia/backup, preview/diff, rejeitar duplicados e JSON inválido, restauração pós-reinstalação |
| PSC-14 P3 | Mapa tem 99 shown/Results 100 na captura, com whitelist/blacklist; páginas de Search/Map diferem | Estudar módulo de mapa só como produto separado/opcional, sem refazer overlay e sem assumir quotas de Search nem endpoints públicos | Somente pesquisa/documentação; não implementar backend/mapa sem aprovação individual |

**Ordem rígida de dependências:** primeiro **PL-01 + PSC-01/02/03/05/09** para integridade dos resultados; depois PL-02/04/03 e PSC-06/10/11; depois PL-06/05 e PSC-07/08/12/13. Features de mapa e backend (PL-12/PSC-14) ficam por último e desligadas. Não propor 14 novas PL independentes nem renumerar PL-01…12/UX-01…08; PSC são **subitens de evidência e aceitação vinculados às PL existentes**.

### 12.6 O que aproveitar do PokéLocation — somente ideias compatíveis

**APK binário inspecionado:** 924 entradas, 2 DEX, 170 arquivos PNG e código PoGo detectável; nenhum motivo para substituir o APK, os PNGs ou a identidade do PokeSearch. Referência de código via `ayranoliveira1/pokelocation` é **AGPL-3.0-only** (conferir LICENSE antes de qualquer cópia literal); backend `pokelocation-server` é MIT com obrigações próprias de licença/créditos. A arquitetura do proxy privado de terceiros **NÃO** é contrato oficial da origem.

| Conceito observado na referência | Aplicação desejada no PokeSearch (proposta) | O que fica proibido/fora do escopo |
|---|---|---|
| `Pogo.java`: erros tipados, catalog cache/ETag, corpo com limites, status 429/retry, parser, enriquecimento da ocorrência | Validar parser, cache de catálogo, feedback e estado de `Get coords` sem inventar coordenada | Reutilizar token/JWT de outro serviço, descobrir endpoint secreto ou usar proxy não contratado |
| `PogoFilter.java`: lista de tamanhos e filtros, valores neutros, perfis locais | Datastructures tipadas, validação, perfis locais, migração | Copiar implementação AGPL sem revisão de licença |
| `PogoBubbles/PogoPanel`: atualização de bolhas, timer separado, placeholders/UX durante rede | UI incremental, timer local, sprites/fallback/cooldown claro | Importar overlay inteiro, aumentar permissões ou retirar 12 controles |
| Servidor Go: `upstream.go` protege redirect autenticado e limita tamanho de resposta; `rules/worker` têm deduplicação/lease | Traduzir **ideias** em deduplicação local por encounter e backoff, logs mínimos | Banco PostgreSQL/Redis/FCM/cloud, contas no servidor, pool de tokens, cargas agressivas, notificações remotas sem propósito |
| Referência Android tem GPS fake, joystick, GPX, chat, clone e permissões privilegiadas | **Não aproveitável** para escopo atual | Não integrar mesmo se funcionar em Android |
| Segurança | Manter credenciais da origem fora dos relatórios, preservar sessão oficial e isolamento do app | OAuth `state` fixo, bibliotecas baixadas sem necessidade, assinatura/copiar dados do PokéLocation |

**Distinção crítica:** a referência faz `/lookup` com `filters` aninhado e `/search` com `iv_percent_min/max` no corpo do **seu proxy**; **não** enviar esses formatos automaticamente ao PoGoCoordinates pela WebView do PokeSearch. A rota de descoberta de capacidades deve usar a UI oficial com autorização e sem ultrapassar taxas.

### 12.7 Caminhos REAIS: única biblioteca de dados/imagens + caminhos previstos

**Drive existente — hierarquia verificada e reutilizada (não criar banco paralelo):**

```text
Google Drive / Projetos/
├── PokemonGo/   [id 180wu9mqDYttMwYFP3XxXEUmOShLyvTJv]
│   └── Banco de Dados Pokémon/ [id 1vzp-YNwvMpa7MCRvjeKR45sbDbnC7T1W]
│       └── Banco de Imagens Pokémon/ [id 1Bb18NZQUSY2ID06yBkWeW144mR4tIaex]
│           ├── 00_Catalogo_e_Fonte/ (catalogo_imagens.json; _diretorios_extracao.json; _lote_upload_00..15.json)
│           ├── 01_Sprites_Pokemon/2D_PNG_A_Z/{A..Z}/
│           ├── 01_Sprites_Pokemon/3D_WebP_Numero_Pokedex/
│           ├── 02_Icones_Ligas_e_Filtros/PokeSearch/{Originais,Padronizados,Bandeiras}/
│           ├── 03_Interfaces_Logos_e_Recursos/{PokeSearch,PokeLOT,PvPPokeGo}/
│           ├── 04_Extraidos_de_APKs/{PokeSearch_0.56,PGSharp_1.272.0,PvPPokeGo_0.5.37}/
│           └── 05_Pacotes_Originais/{Pacotes_Consolidados,ZIPs existentes}/
└── PokeSearch/ [id 1pHnwNFYlDxxt9g5PtdYWWFAylBkvVyRU]
    ├── 00_Documentacao_Atual/
    ├── 01_APKs_Teste/
    ├── 02_Relatorios_Bugs/
    ├── 03_Icones_Ligas/ [id 1YkY3WQIirk1m9Ko8c2rLBuye6agnTbI7]
    ├── 03_Icones_Ligas_Padronizados/
    ├── 05_Referencias_Externas/PokeLocation/
    └── PokeSearch - Backup 2026-10-14 - 602757a/
```

**URLs canônicas:** banco raiz `https://drive.google.com/drive/folders/1vzp-YNwvMpa7MCRvjeKR45sbDbnC7T1W`; imagens `https://drive.google.com/drive/folders/1Bb18NZQUSY2ID06yBkWeW144mR4tIaex`; PokeSearch `https://drive.google.com/drive/folders/1pHnwNFYlDxxt9g5PtdYWWFAylBkvVyRU`; PokeLocation APK `https://drive.google.com/file/d/1uSuww0uFIqQRyGnpYXRwJqnDsqdm76Kx/view`. **Os nomes de diretórios vistos acima existem; não foram criados nem reorganizados nesta etapa.**

**Catálogo já existente:** `00_Catalogo_e_Fonte/catalogo_imagens.json` declara 3.065 entradas e 2.843 hashes distintos. **Não** confundir esses números nem deletar supostas duplicatas: conferir chaves `relative`, `sha256`, `source`, `bytes`, `omitted_duplicate_files` em auditoria própria. Campos `local=/mnt/data/pokemon_import/...` nesse índice são caminhos temporários da máquina que montou o catálogo; **NÃO** são URLs permanentes ou caminhos Android. Identidade estável = `relative` dentro do banco + hash + ID Drive e origem. Não publicar arquivos de outros projetos/ZIPs como se fossem sprites licenciados do PokeSearch.

**Fonte de verdade do executável PokeSearch no GitHub (já existente):**

```text
LucianoToscano/PokeSearch/
├── docs/GUIA_MESTRE.md                  ← ÚNICO DOCUMENTO MESTRE, SEM VERSÃO
├── docs/REFERENCIA_POKELOCATION_2026-10-18.md    ← evidência histórica preservada
├── docs/PLANO_INTEGRACAO_FILTROS_POGOCOORDINATES_20261017.md ← referência histórica
├── app/src/main/assets/
│   ├── pokemon_catalog.json             ← catálogo básico existente [dex,nome]
│   ├── result-icons/                     ← 18 PNGs oficiais em uso, NÃO sobrescrever
│   ├── dock.html                         ← barra e menu flutuantes
│   ├── probe.js                          ← interação/verificação da página de busca
│   ├── presets.js                        ← acionamento de opções da UI
│   ├── detail.html, login_entry.js, shiny_login.js, tutorial.html, overlay.html
├── app/src/main/java/com/lucianotoscano/pokesearchoverlay/
│   ├── OverlayService.java, MainActivity.java, PokemonPicker.java
│   ├── WatchAlerts.java, BugReport.java, DiagnosticSanitizer.java
│   └── IntegrityGuard.java, PixSupport.java
└── app/tests/{probe-smoke.test.js,overlay-ux.test.js,login-entry.test.js}
```

**Destinos PROPOSTOS, NÃO CRIADOS (evitam múltiplos mestres ou migração prematura):**

```text
Drive / Projetos/PokemonGo/Banco de Dados Pokémon/
  Dados_Estruturados/          → especies.json, variantes.json, formas.json, catalogo_fontes.json (planejar)
  Manifestos_e_Checksums/     → sha256, origem/licença, relatório de duplicatas (planejar)
  Importacoes_e_Snapshots/    → exportações JSON anonimizada/por data, sem tokens (planejar)
  Validacao_e_Testes/         → fixtures sintéticas de modos/presets/resultados (planejar)
GitHub / PokeSearch/
  app/src/main/assets/data/  → snapshots estáticos VERSIONADOS mínimos quando necessários (planejar)
  app/src/main/java/.../data/→ camada de persistência tipada quando aprovada (planejar)
Android runtime privado do app:
  Context.getDatabasePath("pokesearch.db") → SQLite/Room opcional para perfis, cache e alertas, apenas quando aprovado
  SharedPreferences atual → preservar/migrar atomicamente; cookies de autenticação ficam com mecanismo WebView oficial
```

**Não criar agora servidor, PostgreSQL, Redis, HTTP próprio, banco em nuvem ou repositório de fontes cruzadas.** Começar com catálogo JSON estático + preferências Android existentes; adotar SQLite/Room apenas se escalabilidade, múltiplos presets, filtros/snapshots ou histórico local o justificarem. Não embutir 3.065 imagens no APK: escolher e otimizar assets, indexar metadados, cachear sprites autorizados com fallback leve e medir armazenamento/RAM. Não copiar imagens sem verificar licença, procedência, deduplicação e termos; 18 PNGs oficiais vêm da fonte vigente e não podem ser trocados por variantes de banco sem aprovação.

### 12.8 Modelo de dados lógico PROPOSTO, com responsabilidades e proteção

**Camadas (sem backend):** (1) `SourceCatalog` metadados de espécies e variantes; (2) `FilterProfile` versões de filtros com arrays separados, schemas e preferências; (3) `SearchSession` geração, modo, sort, contexto e confirmação do site; (4) `Encounter` ocorrência com `encounter_id` quando disponível, espécie/forma, IV/rank quando observado, CP, LVL, gênero, tamanho, coordenada aproximada/confirmada e expiração; (5) `ImageIndex` (dex, forma, traje, source, hash, licença, caminho relativo, fallback); (6) `AlertWatch` e `SeenEncounter` para favoritos e deduplicação; (7) `LocalEventLog` opcional sanitizado.

**Chaves e regras:**
- `speciesKey = pokemon_id`; `variantKey = pokemon_id + form_id? + costume_id?`; etiqueta humana é atributo de apresentação e pode mudar; `form_label` geral sem espécie NÃO substitui `species_forms`.
- `filterKey` deriva de JSON canonizado (arrays ordenados/deduplicados por identidade, modo efetivo, Shiny/conta por identificador local **não sensível**, ordenação, localização, raio, Stats/PvP ativos). Não persistir e-mail/código de treinador no índice; mudança de identidade invalida cache.
- `searchGeneration` monotônica; resultado só aceita `generation` e configurações verificadas; `verified` separado de `requested`; `no_results` somente quando confirmação de busca válida tiver retornado explicitamente vazio. Distância/tempo não devem inventar GPS ou timestamp.
- `encounterKey` usa ID estável quando oferecido pela origem; fallback de chave composta só se fundamentada. Dedupe sem mostrar dados de outro spawn.
- `coordStatus` e `coordinatePrecision` separados: `unknown/approximate/reveal_pending/exact/failed`. Não copiar lat/lng ausente ou posição de ícone de mapa como coordenada exata.
- Retenção a definir antes de implementação: resultados nunca após expiração, cache de prévia máximo 120s conforme versão atual, tamanho e prazo de alertas/histórico explícitos; limpeza de dados sob controle do usuário, preservando backup local/exportado.
- **Proteção:** não armazenar OAuth/JWT/refresh token/cookies em JSON, SQLite de perfis, GitHub, backup, logs ou Drive. Dados de sessão apenas no mecanismo autorizado do navegador; sanitização antes de exportar; sem compartilhamento automático de coordenadas.

**Evolução de schema (proposta):** `schemaVersion=1` para modelo próprio do PokeSearch, com `mode:{raw,percent,gl,ul}`, `pokemon_ids:number[]`, `species_forms:object[]`, `sizes:string[]`, `forms:string[]`, `excluded_pokemon_ids:number[]`, `gender`, `weather`, `stats`, `pvp`, `sortBy`, `shiny`, `location`, `profileName`, `createdAt`; preservação de campos desconhecidos em cópia de importação, sem aplicá-los ao serviço. Evitar alias falso entre `DSP` exportado e texto do dropdown sem teste de aplicação.

### 12.9 Critérios de aceite, resultados pendentes e governança

**Plano por confirmação individual:**
1. **PL-01 P0, diagnóstico primeiro (sem implementação automática):** confrontar cinco filtros reais (LOT, LOT1, PvpGL, shi, testeee22222) e também o snapshot shi2 como regressão; mapear DOM real e campos exportados; aplicar filtros simples, observar resultados Search/Coords/PvP; separar IV desconhecido de IV inválido, menu multiseleção e empty/erro. Produzir matriz `solicitado → confirmado → resultado`, com capturas sanitizadas.
2. **Após aprovação separada:** PSC-01/02/03/05/09 e testes específicos; não alterar layout/perfis/ícones sem prévia de alteração proposta. CI/mocks mais teste físico Android 15/16, rede lenta, login e popup.
3. **PL-02 + PL-03 + PL-04:** geração, cooldown, login/identidade e erros; medir sem contornar políticas.
4. **PL-06 + PL-05:** Sort by, presets, cache/catálogo e, somente se demonstrar necessidade, banco local; planejar migração com rollback e backups.
5. **PL-07…11/UX:** alertas, UX compacta, desempenho e release por etapas aprovadas; mapa/backend opcionais só estudo futuro.

**Não aprovados para código nesta entrada:** todos os PSC como implementação, banco físico/SQLite, novas pastas, migração de imagens, troca de ícones, aumento de consultas/resultados, mapa, VIP, servidor, GPS simulado, APK/assinatura ou merges. Um teste automatizado sem aparelho NÃO homologa filtros. Registrar toda futura decisão neste mesmo mestre segundo protocolo da seção 11.8: data, ID, antes/depois, aprovação explícita, SHA, testes reais, regressões, status e próxima decisão. **Histórico e antigos backups continuam intactos.**

**Próximo passo exato ao retornar:** conferir HEAD do PR #22; reler seção 12 e seções 11/6; **apresentar o escopo testável de PL-01 e pedir confirmação** antes de qualquer modificação executável. Não começar do zero.

**PROMPT CURTO DO PRÓXIMO CHAT (substitui operacionalmente o prompt histórico de 11.8 sem apagar a história):**

> Continue o PokeSearch de onde paramos. Acesse `LucianoToscano/PokeSearch`, branch `plan/v051-pogocoordinates-filtros-20261017`, e leia **integralmente** o único `docs/GUIA_MESTRE.md`, sobretudo as seções 12 e 11, os backlogs PL/UX/PSC e o diário; confira PR #21/#22 e HEAD. Compare com os JSONs PoGoCoordinates e a auditoria APK PokéLocation já catalogados. Preserve código, 18 PNGs, 12 controles, interface, bancos de imagens, backups e PvPPokeGo separado. **Comece pela PL-01, proponha a próxima correção e aguarde minha confirmação antes de alterar código, APK ou fazer merge. Registre toda decisão no MESMO Guia Mestre.**


### 12.10 Checkpoint de retomada — PL-01 (18/10/2026)

**Natureza: diagnóstico documental/estático, SEM AUTORIZAÇÃO de implementação.** Retomada efetuada conforme instrução do proprietário de ler integralmente o Guia Mestre e inspecionar GitHub, PRs, PoGoCoordinates, exportações, auditoria PokéLocation e caminhos de dados. Documento único mantido em `docs/GUIA_MESTRE.md`; nenhum arquivo mestre concorrente criado. Status da PL-01: **diagnóstico estático apresentado; proposta AINDA AGUARDANDO APROVAÇÃO EXPRESSA**. Os demais PL/UX/PSC mantêm estados anteriores.

**Verificações desta retomada:** branch `plan/v051-pogocoordinates-filtros-20261017`, Guia Mestre em blob `ab9e19d525c2af047e8829f6e8dfb6670c48fddc` antes deste registro. PRs #21 e #22 encontrados em consulta aos PRs abertos; informação de *draft* deriva do histórico do Guia e requer rechecagem ao implementar. Comparação `main...plan` mostrou `ahead=129`, `behind=2`, sem fazer merge (números deste instante, não referência imutável). `main` não continha o caminho canônico do Guia nesta consulta; portanto continuar exclusivamente na branch de planejamento. Código analisado por leitura de `probe.js`, `presets.js`, `dock.html`, `OverlayService.java`, `MainActivity.java` e testes JS, sem compilar nem executar.

**Achados comprovados na leitura do código atual:**
1. PSC-02 / prioridade imediata: `probe.js:collect().matches` aceita `!x.iv` em Raw e `x.ivPercent===""` em percentual; `OverlayService.verifiedTargetCriteria()` também aceita os dados IV vazios. A confirmação do formulário não prova cada cartão. Risco de mostrar e/ou alertar um Pokémon sob Hundo/Nundo/% sem IV individual comprovado. Isto é risco técnico verificável no código, ainda não regressão física reproduzida no HEAD.
2. PSC-01/03: `dock.html` e `OverlayService.setSearchConfig()` persistem `pokemon/form/size` como strings simples; `probe.js:extraSelect/extraMatches` confirma seleção única. As exportações reais contêm `pokemon_ids[]`, `species_forms[]`, `sizes[]` e `forms[]` multiseleção. A correção histórica de `⚠ Filtro: pokemon` evita exigir opções neutras, mas não homologa menus React ou multiseleção.
3. PSC-05/09: `parseCard/collect` diferenciam ranking observado de `rankSource=verified-site-filter` em parte dos casos; `readCoords` procura cartão por nome/CP e pode precisar de identidade estável de ocorrência. Testar sem assumir que o proxy de PokéLocation representa a UI oficial.
4. `presets.js` inicializa alguns campos Raw em 15 durante a hidratação React; verificar conflito temporal com os filtros aplicados. `probe.js:resultCriteria` admite confirmação pré-envio quando formulário some após Search; cruzar geração, critério solicitado/confirmado e resultados coletados.
5. A política Java de `MIN_SEARCH_GAP_MS=60_000`, `requestGeneration`, cache temporário marcado como `stale`, os 18 PNGs e os 12 controles não devem ser alterados nesta primeira intervenção. O portal `/search` não expôs formulário autenticado completo à leitura pública; nenhuma verificação de DOM real com conta foi executada.

**Fontes comparadas:** dois JSONs locais de 7.814/9.073 bytes (LOT, LOT1, PvpGL, shi, shi2 e testeee22222); inspeção da auditoria `docs/REFERENCIA_POKELOCATION_2026-10-18.md`; Drive confirma a pasta existente Banco de Dados Pokémon, filha de PokemonGo, e a pasta Banco de Imagens Pokémon, filha do banco. Diretórios atuais permanecem intocados. O esquema de exportação do PoGoCoordinates NÃO equivale ao contrato HTTP de busca nem ao proxy externo.

**Proposta PL-01 para aprovação — primeiro lote mínimo:** corrigir a passagem de `IV desconhecido` como `IV válido` nas checagens JS e Java; distinguir `resultado confirmado`, `cartão inconclusivo`, `zero real` e `erro`; garantir que nenhum cartão inconclusivo gere alerta de IV100/0/%/PvP; manter resultados confirmados e prévias stale claramente separados. Casos de teste: Raw 15/15/15, Raw 0/0/0, Raw misto, % 91–100 e 100–100, GL#1, UL#1, cartão sem IV, cartão IV divergente, rank ausente, Shiny ON/OFF, zero/timeout, mudança de filtros e formulário que desaparece depois do Search. Subetapas seguintes dentro da PL-01 (PSC-01/03/05/09) devem receber confirmação e provas próprias, especialmente multiseleção real, `Get coords` e precedência PvP/Raw, sem trocar UX ou importar endpoints.

**Arquivos candidatos após aprovação:** `app/src/main/assets/probe.js`, `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java`, `app/tests/probe-smoke.test.js`, `app/tests/overlay-ux.test.js`; `presets.js` somente se um bug de hidratação for comprovado. Executar primeiro testes estáticos isolados; validação autenticada do PoGoCoordinates e Android 15/16 continuam pendentes. Sem alteração em `main`, ícones, menus, Gradle, Manifest, permissões, APK, banco físico ou backend.

**Estado de aprovação:** NÃO AUTORIZADO executar correção. **Próxima ação: apresentar a proposta acima ao proprietário e aguardar “Aprovo a PL-01” (ou escopo mais restrito) antes de qualquer edição executável.** Documentar futuras decisões, commits e evidências exclusivamente NESTE Guia Mestre.


### 12.11 Requisito aprovado para planejamento — filtro Background (18/10/2026)

**Pedido expresso do proprietário:** “Esta opção de Background. Tmb tem que ter. Porem acredito que ela so fica ativa quando tem eventos que dao este Background.. porem ja e interessante deixar a opcao. Ela tem no PoGoCoordinates e no PokeLocation.” Quatro capturas enviadas nesta conversa mostram (a) PoGoCoordinates com dois switches separados “✨ Shiny only” e “Background · Zorua” e (b) PokéLocation com switches separados “Só shiny” e “Só com background”. **Decisão: adicionar Background ao escopo funcional obrigatório futuro do PokeSearch**, mantendo a política de implementação incremental e confirmação das mudanças de código antes de executá-las. **Status: REQUISITO REGISTRADO / IMPLEMENTAÇÃO NÃO INICIADA; PL-01/PSC-02 ainda aguardam aprovação.**

**Proposta de UX preservadora:** na interface compacta do menu existente de filtros, inserir **“🌄 Background (somente com plano de fundo)”** imediatamente abaixo/perto da configuração ✨ Shiny, sem adicionar ícone permanente nem alterar 18 PNGs, 12 controles, cabeçalho de resultados ou quatro modos Raw/%/GL/UL. Shiny e Background devem ser filtros booleanos independentes, inicialmente OFF: ambos OFF, Shiny ON, Background ON, ambos ON. Se o site suportar apenas background específico/contextual, mostrar essa limitação factual (“Background · Zorua”, por exemplo), nunca alegar que “todos os backgrounds” foram pesquisados ou criar catálogo não visto.

**Evidência e limites:** o JSON de filtro salvo do PoGoCoordinates contém a chave `background_only` (nos snapshots inspecionados, `false`); as capturas mostram um controle visual, mas isso **não valida o valor exato da chamada HTTP, a disponibilidade permanente nem o resultado real com filtro ON**. Nem todo Background é necessariamente restrito à janela de evento; disponibilidade depende do evento, da espécie, do suporte/cobertura do serviço, da sessão e dos controles exibidos. Diferenciar **sem ocorrências** de **filtro indisponível**, e não assumir que o PoGoCoordinates pode pesquisar background genérico só pela existência de “Background · Zorua” na tela. Não copiar rotas/credenciais do PokéLocation, que é referência técnica e possui contrato próprio.

**Plano de implementação futuro, a aprovar individualmente:** (1) detectar em `probe.js` a presença, rótulo, estado ON/OFF, disponibilidade e restrições reais do switch Background, separado do Shiny; (2) adicionar `backgroundOnly:boolean` independente ao rascunho, preferências e `filterConfigJson()`, sem mudar padrões antigos, gerando identidade/caching distinta; (3) aplicar/confirmar junto dos demais filtros antes de `Search` e respeitar a geração, sessão e piso global de 60 segundos; (4) se selecionado e impossível confirmar no site, **não submeter pesquisa com critério ignorado nem anunciar resultados falsamente filtrados**, preservar última lista confirmada como prévia stale identificada; (5) evitar notificações/identificação de Background não comprovado em cartões individuais; (6) testar 4 combinações Shiny × Background, conta sem vínculo, evento ativo/inativo, controle ausente/desabilitado, mudança React, resultados vazios, reabrir/reiniciar, limpar seleção e alertas. Critérios de Background devem entrar na chave de contexto da consulta e em exportação local somente após schema aprovado.

**Vinculação sem renumerar backlog:** complemento de capacidade a **PSC-08** (opções reais da Search por página/conta, incluindo Weather/Size e agora Background), de validação de resultados a **PL-01**, e de organização do menu a **UX-01**; sua implementação deve ser agendada depois da correção inicial PSC-02 e sujeita à aprovação de execução apropriada. Não inserir novo PL ou UX concorrente. Ícones, interface, `main`, backups, APK, arquivos de banco e PvPPokeGo permanecem intocados. **Só este Guia Mestre foi autorizado a registrar a decisão nesta retomada**.


### 12.12 Proposta visual — seis bases e indicadores independentes (18/10/2026)

**Situação: PROPOSTA DE DESIGN documentada, NÃO APROVADA PARA IMPLEMENTAÇÃO.** Em mensagem posterior à seção 12.11, o proprietário apresentou cinco imagens de Pokébolas-base e sugeriu substituir as artes compostas dos **18 PNGs oficiais atuais** por bases gráficas sem indicadores embutidos, acrescentando camadas independentes (imagem ou texto) para ✨ Shiny, 🌄 Background, %, 0 e 100. Em seguida corrigiu expressamente a omissão do estado **Sem Filtro**, que precisa de uma base própria, distinta da pesquisa Personalizada. Esta seção registra a versão corrigida da proposta, sem aplicar qualquer alteração ao aplicativo ou aos PNGs.

**Seis ícones-base propostos:** (1) **Sem Filtro / Neutro**, (2) **Personalizado / Raw IV e IV%**, (3) **Grande Liga / GL**, (4) **Ultra Liga / UL**, (5) **Liga Mestre / ML**, (6) **Liga Cup / Copa**. As cinco imagens enviadas **não cobrem obrigatoriamente todas as seis bases**; a associação exata arte → categoria e o eventual sexto PNG precisam de prévia e aprovação antes da mudança. Não inferir que os cinco desenhos equivalem automaticamente às cinco ligas/modos.

**Camadas independentes propostas:** marcador **✨ Shiny** (imagem transparente padronizada), **🌄 Background** (imagem transparente), e rótulos compactos **%**, **0**, **100** (texto ou overlay gráfico) apenas quando correspondam à busca efetiva. A base mostra a família do modo; os indicadores mostram critérios independentes, podendo coexistir sem alterar a arte-base. Ex.: base Sem Filtro sem marcas = nenhuma restrição principal de IV/PvP; base Sem Filtro + ✨ = só Shiny sem restringir IV/liga; base Sem Filtro + ✨ + 🌄 = somente Shiny com Background, **se o site confirmar os dois filtros**. “Sem Filtro” não significa desligar critérios independentes ativados pelo usuário. **Manter contraste, legibilidade e alvo/tamanho atual 21×21 px do cabeçalho**; ensaiar composições sem encobrir a base. Não presumir que a palavra “100%” caberá perfeitamente; revisar e aprovar a disposição antes de implementar.

**Compatibilidade e limites:** preservar a correspondência histórica dos 18 recursos existentes como backup e referência, sem remoção antes de aceite. **18 PNGs representam 9 pares normal/Shiny, não 18 modos de busca realmente ativos.** No código atual são efetivos apenas Raw IV, IV%, GL e UL. **Sem Filtro, Liga Mestre e Liga Cup não estão comprovados como modos implementados**, apesar dos PNGs correspondentes. A proposta visual não concede suporte real a pesquisas adicionais, não autoriza criar controles permanentes ou quebrar a barra de 12 ações. A UI deve refletir apenas filtros realmente confirmados pelo PoGoCoordinates, com status pendente/indisponível tratado sem ícones enganosos.

**Governança:** associar a UX-01 e à preservação dos ícones; prioridade **posterior à PL-01**. Primeiro aprovar visualmente o mapeamento definitivo, a sexta base, posição dos badges ✨/🌄/%/0/100 e o fallback para estado não confirmado. Só depois alterar `dock.html`, recursos separados e testes com autorização expressa. Não modificar `main`, branch do PR #21, código Java/JS, APK, 18 artes oficiais, pastas Drive ou backups nesta entrada. Próximo passo permanece **PL-01 PSC-02 aguardando aprovação**.


### 12.13 UX-ICON-01 — composição visual compacta autorizada (18/10/2026)

**Aprovação expressa:** “Certo vsmos fazer isto. Pode aplicar. Lembre se de nao aumentar o tamanho. Nem ficar poluido e de se ajustar quando alterar tamanho dos icones.” Executar apenas a troca VISUAL do cabeçalho por bases + indicadores, não acrescentar buscas/serviço. Branch isolada `ux/compact-base-icons-20261018`, derivada da branch de planejamento no SHA `a1f49d3ae978b045bca93b793e3755b979a25544`. Nem `main`, PR #21/#22 nem APK foram modificados por esta etapa.

**Design aplicado na branch:** seis famílias `Sem Filtro / Personalizado / GL / UL / Mestre / Cup` montadas com seis recursos PNG 64x64 transparentes em `app/src/main/assets/result-icons/base/`: os cinco desenhos enviados (branco neutro, vermelho/branco, azul/vermelho, vermelho/azul claro, preto/amarelo) e um recurso Cup que reutiliza TEMPORARIAMENTE a base neutra com identificador textual “CUP”, porque não foi fornecida sexta imagem. Os **18 PNGs originais continuam integralmente preservados**, inclusive para fallback e rollback. Efeitos `100%`, `0`, `%`, `✦ Shiny` e `🌄 Background` são camadas HTML/CSS independentes; um único rótulo numérico inferior e, quando confirmados, até dois microindicadores nos cantos superiores. Nunca expandir a imagem acima dos 21×21px nem o controle de 35×30px; P/M/G ajusta proporcionalmente o conjunto entre 17 e 21px, incluindo os indicadores.

**Limites de funcionalidade:** só Raw IV, IV% e GL/UL são consultas realmente existentes. Sem Filtro, Master e Cup continuam como famílias gráficas PREPARADAS, mas suas buscas não foram habilitadas. O símbolo Background fica oculto até que o critério `backgroundOnly` seja efetivamente confirmado pelo site (`backgroundVerified`), cuja integração de rede segue pendente; o overlay visual não altera o estado Shiny. Sem alterações em endpoints, frequência global 60s, dados pessoais, persistência, serviços Android, 12 controles, sprites, toque longo, despawn, login, favoritos, posicionamento das janelas nem banco de dados.

**Arquivos da intervenção:** `dock.html`, testes `overlay-ux.test.js`, seis recursos `result-icons/base/base-*.png`, ESTE ÚNICO `docs/GUIA_MESTRE.md`. Novos testes estáticos verificam assinatura/tamanho PNG, 18 PNGs legados, camadas/condições e limite 21px. **Status: código editado para avaliação; CI, APK e Android físico NÃO TESTADOS neste registro.** Não confundir revisão de código com validação real. PL-01/PSC-02 continua aguardando aprovação distinta. Esperar aceite da composição no aparelho antes de qualquer merge.


**Checkpoint após a gravação da branch e criação do PR #23:** o commit de implementação `cc9ad0afc17bd385368ab9a1174a23e1e9f46a75` alterou `dock.html`, `overlay-ux.test.js`, ESTE Guia e seis novos PNGs `base-*.png`. PR [#23](https://github.com/LucianoToscano/PokeSearch/pull/23) aberto **em draft**, base `plan/v051-pogocoordinates-filtros-20261017`, head `ux/compact-base-icons-20261018`; não mesclado. Comparação GitHub confirma que **nenhum** dos 18 arquivos PNG oficiais anteriores foi modificado. Verificação textual pós-commit: 12 contratos estruturais confirmados em leitura do código (12 controles, teto 21px, alvo 35x30, escala P/M/G, seis mapeamentos, camadas separadas, condições IV e Background, fallback e único script). **Esses checks de leitura não executaram a suíte JS/Gradle e não são homologação Android.** Nenhum workflow ou APK disparado pela intervenção. Aguardar aceite visual e pedido separado de build, sem avançar PL-01 automaticamente.



### 12.14 PL-01 / PSC-02 — correção aprovada de IV não comprovados (18/10/2026)

**Autorização expressa do proprietário:** “Ok vamos continuar.. qual a próxima coisa da lista? essa primeira correção da PL-01 (PSC-02), para impedir resultados e alertas de IV não comprovados, preservando todas as funcionalidades atuais? Corrija.” Apenas primeira intervenção **PSC-02**, sem autorizar os demais PL/PSC/UX nem merge.

**Estratégia de continuidade:** branch isolada `fix/pl01-psc02-verified-iv-20261018` derivada do último SHA do PR #23 (`43af49da1ca20814b7fdf018a489b84f313cf89f`), mantendo as seis bases gráficas e camadas do ícone já aprovadas para implementação. PR #23, PR #22 e `main` não foram editados; futuro PR de PSC-02 direcionado à branch UX #23 enquanto não houver merge autorizado (dependência explícita). Histórico e arquivos originais preservados.

**Defeito real confirmado no código pré-correção:** `probe.js:collect().matches` retornava verdadeiro para `!x.iv` em Raw e `x.ivPercent===""` na busca percentual; a verificação Java `verifiedTargetCriteria` repetia `return iv.isEmpty()||...` e `if(pct.isEmpty())return true;`. Portanto cartão sem IV individual legível podia virar Hundo/Nundo/faixa percentual e ativar avisos; configurar o formulário no site não basta para validar cada Pokémon.

**Mudanças implementadas (PR em revisão, sem APK):**
- `app/src/main/assets/probe.js`: `verifiedCardIv(card)` confirma IV raw rigoroso (três estatísticas 0–15) e/ou percentual explícito entre 46 percentuais possíveis; recusa IVs desconhecidos, inválidos e contradição entre a porcentagem e soma de ataque/defesa/stamina. Percentual isolado só é extraído quando a etiqueta do cartão diz IV; valores inferidos de textos alheios não são tomados como prova. `collect()` rejeita falta de prova individual em Raw/IV%, mantém a lógica separada de GL/UL, retorna `unverifiedIv` apenas como contagem agregada.
- `OverlayService.java`: `verifiedTargetCriteria` reforça validação nativa de dado individual antes de qualquer alerta. `applyCollectedResults` reaplica verificação Raw/IV% para cartões vindos do JavaScript ANTES da apresentação, histórico, cache e notificações. Todos rejeitados = erro claro com preservação da última listagem confirmada (prévia stale); alguns inválidos = só os válidos seguem, sem alarmes para descartados. Não classificar filtros não comprovados como “0 Pokémon”.
- `app/tests/probe-smoke.test.js`: casos positivos/negativos Hundo, Nundo, 91–100, IV desconhecido, percent-only explicitamente rotulado IV, porcentagem impossível, IV incoerente, IV fora de 0–15; manter regressões de GL/UL e formulário oculto.
- `app/tests/overlay-ux.test.js`: contratos da defesa JS/Java e ordem da validação antes de cache/histórico/notificações.

**Invariantes:** 18 PNGs originais, seis novas bases visualmente compactas, barra 12 controles, tamanhos P/M/G, controles de 21×21/35×30px, Shiny, Background planejado, login oficial, localização, long press, despawn, cache stale, 60s de intervalo, Raw/IV%/GL/UL, favoritos, alertas confirmados. Sem novas APIs, cookies, permissões, APK, refatoração da interface ou ativação de modos não implementados. **Não misturar com PvPPokeGo.**

**Estado:** implementação de código em branch isolada; verificar resultados de regressão V8/CI e atualizar este mesmo Guia. PL-01 PSC-02 só fica “testado em Android” depois de prova física; outros itens PL/PSC continuam pendentes de aprovação. Não fazer merge automaticamente.


**Checkpoint de testes e PR #24 — PL-01/PSC-02:** o PR [#24](https://github.com/LucianoToscano/PokeSearch/pull/24) foi criado **DRAFT**, com head `fix/pl01-psc02-verified-iv-20261018` e base `ux/compact-base-icons-20261018` (dependente do PR #23, sem alterar o PR #23). Commit inicial `e69ee4b5e20898a05fd00e36bd3bee50a128393b`; ajustes posteriores de fixture e contagem `c7dd9382fb2ce31f5a0ff76962c1427077bc9b91`, `e8b200e3c9cb5b389365e83ba731031f5b9250ee` e otimização da contagem individual `b0c60c1836f3528bfbe172908be341f52fd52456`. Comparação GitHub contra a base: cinco arquivos alterados **e somente** `probe.js`, `OverlayService.java`, `probe-smoke.test.js`, `overlay-ux.test.js` e ESTE Guia; nenhum dos 18 PNGs, seis ícones-base ou 12 controles alterado por PSC-02.

**Testes executados com evidência na retomada:** coletor **72 testes aprovados**, executando o arquivo real `probe-smoke.test.js` contra o `probe.js` do branch em V8 com emulação de `node:fs`, `node:vm`, `assert` e `path`; inclui as dez novas regressões Raw/IV%, casos positivos/negativos, percent-only marcado IV, Hundo/Nundo e contradições. O primeiro ensaio revelou fixture recém-criado com sequências de barra-n literais, corrigido antes da aprovação final; execução seguinte 72/72 passou. Contratos UX **216 testes aprovados**, executando o `overlay-ux.test.js` e 19 fontes textuais obtidas do GitHub, também por V8 com `fs/path/assert` simulados; **as leituras de bytes PNG foram simuladas nesta execução, não há validação de conteúdo binário nem renderização física**. Os novos checks de ordem confirmaram defesa nativa ANTES de histórico/cache/avisos. A execução isolada NÃO é equivalente a `node` no GitHub Actions, Gradle, `assembleDebug`, `testDebugUnitTest`, APK ou Android WebView real. **CI e teste físico pendentes**, não declarar PL-01 completamente concluída nem aprovada para merge antes de revisão do usuário.

**Estado da lista:** PL-01/PSC-02 = **IMPLEMENTADA EM BRANCH / TESTADA EM V8 ISOLADO / PR #24 DRAFT / AGUARDANDO CI E ACEITE NO APARELHO**. PL-01/PSC-01/03/05/09 e PL-02–12 seguem como pendências sem aprovação automática. Próxima ação: usuário revisar patch; se solicitar, rodar workflow de build/testes e fornecer APK para homologação; sem merge automático, sem alterar os controles/ícones, sem misturar PvPPokeGo.


### 12.15 UX-IV-COLOR-01 — cores dos IVs verificadas e Shiny separado (18/10/2026)

**Autorização expressa:** proprietário aprovou a proposta de diferenciar visualmente o IV% por cores e esclareceu: “O shiny nao precisa ficar amarelo porque o brilho vai aparecer junto”; depois solicitou “Certo. Faça isto”. Esta autorização limita-se ao visual dos valores IV e à independência de Shiny — não aprova outros filtros, backend, PL/PSC adicionais, merge ou entrega de APK.

**Paleta de design própria do PokeSearch, não oficial do Pokémon GO nem cópia exata de app de terceiro:**
- **0%:** ciano `#00CFE8`, Nundo;
- **2–49%:** cinza `#B8BEC8`, IV baixo;
- **51–78%:** verde `#28C76F`, IV intermediário;
- **80–89%:** azul `#388BFF`, IV alto;
- **91–98%:** roxo `#C084FC`, IV muito alto;
- **100%:** rosa/vermelho `#F04B70`, Hundo.
São faixas expressas apenas pelos 46 percentuais matematicamente possíveis para três stats de 0–15, sem criar percentuais inexistentes. Critérios de GL/UL continuam independentes de IV geral; ranking PvP baixo/alto não determina a cor.

**Implementação isolada:** branch `ux/iv-color-shiny-separate-20261018`, derivada do HEAD do PR #24 `d309a94945cb72797a0ed95d09e527913ee9de17`, com PR [#25](https://github.com/LucianoToscano/PokeSearch/pull/25) **DRAFT**, base `fix/pl01-psc02-verified-iv-20261018`. Cadeia de revisão: PR #22 → #23 → #24 → **#25**; nenhuma das branches anteriores ou `main` foi mesclada por esta etapa.

**Alterações concretas:**
1. `app/src/main/assets/dock.html`: helper visual `verifiedSpawnIvPercent(card)` exige tripla A/D/S válida (0–15), percentual válido em `IV_PERCENT_VALUES` e coerência entre os dois quando ambos existem. O rótulo `IV% ` é emitido apenas quando há prova individual; se ausente, malformada, contraditória ou matemática impossível, **não renderizar porcentagem nem cor**, com descrição acessível “IV não comprovado”. Isso se aplica inclusive em GL/UL, sem alterar o filtro/rank de pesquisa.
2. `ivPaletteClass(percent)`: mapeia exclusivamente as faixas acima para classes CSS estáticas (sem cores derivadas de dados livres ou do estado Shiny). Etiqueta sobreposta dentro de cada botão do sprite (`max-width:25px`, `font-size:8px`, `line-height:10px`, `left:0;bottom:0`), sem modificar `--row`, `--sprite`, o número máximo de 10 sprites ou o timer de despawn (mantido `right:0`). Evita poluição e respeita os tamanhos P/M/G.
3. Cabeçalho existente: 0 e 100% recebem respectivamente ciano e rosa/vermelho; o símbolo `%` genérico não recebe cor de porcentagem desconhecida. Ícone-base segue limitado a 21×21 dentro da área 35×30. O ✦ de Shiny é branco/neutro com base discreta, adicionado somente quando confirmada a condição Shiny — **não torna IV, imagem-base ou porcentagem amarela**. Background permanece separado e só identificado com comprovação.
4. `app/tests/overlay-ux.test.js`: seis testes de contrato/regressão para a paleta e extremos, validação de IV zero, 100 e valor Raw derivado, rejeição de dados desconhecidos/contraditórios, dimensões compactas e brilho independente.

**Escopo preservado:** nenhuma edição aos 18 PNGs oficiais históricos, seis PNGs-base, 12 botões, arquivos `probe.js` / `OverlayService.java`, login, filtros, busca, intervalos, favoritos, notificações, coordenadas, cache, gestos, posição, tamanhos ou histórico. A validação adicional desta etapa é **apenas de apresentação** e reforça (não substitui) a defesa de dados da PL-01/PSC-02.

**Verificação realizada:** validação sintática do conteúdo JS de `dock.html` em V8 via compilação de função = sem erro; dez cenários isolados contra as funções reais de IV/paleta no código atualizado = 10/10, incluindo Hundo, Nundo, classes intermediárias, ausentes, divergentes e percentual impossível. Os **seis novos testes** do bloco UX-IV-COLOR-01 foram executados diretamente em V8 com fonte real do branch e passaram (6/6); a suíte `overlay-ux.test.js` **NÃO foi executada integralmente**, tampouco houve Gradle, APK, screenshot nem teste com a WebView autenticada no Android nesta etapa. **Revisão física de legibilidade em P/M/G e sobreposição IV/timer ainda necessária.** Não fazer merge de PR #25 sem aprovação posterior.



### 12.16 Ajuste solicitado — somente cinco artes-base, indicadores por filtro e efeito central de busca (18/10/2026)

**Nova manifestação do proprietário:** “O amarelo não precisa porque o Shiny aparece o brilho”; quer identificar qual cor adotar para IVs, retomar trabalho iniciado e interrompido, compreender 18 modos e Background, limitar os recursos gráficos ativos **às cinco imagens enviadas**, adicionar indicadores independentes de busca personalizada, sem filtro, IV0/IV100/%, Grande/Ultra Liga e ranking configurado (`#1`, `#10` etc.), e propõe pequeno efeito de carregamento no **círculo central da Pokébola**, semelhante ao piscar de uma captura. **Interpretação desta entrada: revisão e requisitos a validar, NÃO autorização inequívoca para editar o aplicativo, mudar paleta ou criar merge/APK neste turno.**

**Conferência factual do GitHub:** PR [#25](https://github.com/LucianoToscano/PokeSearch/pull/25) em draft, sobre PR #24 (que depende de #23 e #22), branch `ux/iv-color-shiny-separate-20261018`. Nele estão realmente implementados: paleta 0% ciano, 2–49% cinza, 51–78% verde, 80–89% azul, 91–98% roxo, 100% rosa/coral; indicador ✦ Shiny neutro/branco, independentemente de IV; visual de Pokémon com % comprovada; ícones-base limitados a 21px. NÃO implementados nessa branch: controle funcional Background no backend/PoGoCoordinates, badge visual `#1/#10/#50` diretamente na Pokébola para filtro PvP (o valor selecionado existe apenas no controle/tooltip), animação pulsante no círculo central. A branch ainda declara seis PNGs em `result-icons/base/`, mas `base-cup.png` é cópia da arte neutra, portanto existem **cinco artes efetivamente distintas**. O caminho `fallbackPath` ainda pode carregar PNG original dentre os 18 em falha de carregamento, o que contraria o alvo futuro de somente cinco artes no runtime. Os 18 PNGs são legado/backup: **não são 18 modos funcionais nem devem virar matriz de combinações de filtros**.

**Regra definitiva de organização visual a submeter à aceitação do proprietário:** somente cinco fontes gráficos distintos **none, custom, GL, UL, ML**; `Cup` compartilharia uma dessas cinco (proposta: neutro) com rótulo discreto “CUP”, sem sexta arte física ativa. Seis categorias conceituais (Sem Filtro, Personalizado, GL, UL, ML e Cup) não exigem seis PNGs nem que todas estejam habilitadas no PoGoCoordinates. `percent`, `0`, `100` e configurações de Raw são **parâmetros/estados** do modo apropriado; `✨ Shiny` e `🌄 Background` são **dois filtros booleanos independentes**, logo existem até quatro combinações de cada modo (normal, Shiny, BG, Shiny+BG), e não um número fixo de 18. Acrescentar `#1`, `#10`, `#50` quando o filtro de liga TOP N estiver **confirmado**; no cabeçalho, `#10` representa TOP 10 selecionado, não o rank exato do Pokémon. Não inferir rank individual sem prova. Para % custom usar `%`, para 0 e 100 usar os marcadores exatos, e nos demais Raw a base Personalizado já identifica a modalidade; valores A/D/S ficam em controles/descrição para evitar texto ilegível a 21px.

**Paleta atual que faz sentido preservar como proposta (sem amarelo):** 0% `#00CFE8` (ciano, contrasta com vermelho), 2–49 `#B8BEC8`, 51–78 `#28C76F`, 80–89 `#388BFF`, 91–98 `#C084FC`, 100% `#F04B70` (coral). Shiny usa brilho gráfico branco e **nunca altera a cor dos números**. Rótulos dos rankings PvP sugeridos em branco neutro (distintos da escala de IV); `%` genérico também neutro, pois não prova um valor individual. Aplicar contraste por sombra escura discreta em cima das cinco artes, sem fundos coloridos extras nem molduras invasivas.

**Nova UX sugerida: animação mínima de busca na esfera central:** pseudo-elemento/círculo minúsculo de pulsação suave no **centro da arte, sem crescer o cabeçalho**; efeito apenas enquanto `searchInProgress=true` da geração de busca realmente submetida/ativa. NÃO animar durante cooldown de 60s, login pendente, estado stale, resultado estável ou overlay recolhido; não simular uma captura, percentagem de progresso ou resultado confirmado. Para sincronizar com a WebView do cabeçalho, passar uma flag nativa explícita `isSearching` no callback `onNativeData`, preservando argumento legado e sincronização entre janelas. Parar imediatamente no sucesso/erro/timeout/troca de geração, minimizar custo de GPU/bateria e observar `prefers-reduced-motion`. Testar nas três dimensões P/M/G e combinações de badges, sem obstruir leitura, timers ou gesto de colapsar/arrastar.

**Pendências antes da implementação:** confirmar com proprietário se paleta do PR #25 permanece, como indicar TOP N (#1/#10) e qual das cinco bases a Copa reaproveita (recomendação: neutra). Após aceite explícito, efetuar mudanças isoladas em branch derivada do PR #25, atualizar apenas este Guia Mestre para registros, testar por Node/CI/Android, sem merge automático. **Não confundir implementação visual dos filtros Background com disponibilidade real de busca Background**; cadastro dessa funcionalidade permanece PSC-08/UX-01 pendente. Nenhum outro arquivo foi modificado na anotação documental, e o trabalho do PokeSearch permanece separado de PvPPokeGo.


### 12.17 Implementação aprovada UX-ICON-02 — cinco artes, TOP N e pulso central (18/10/2026)

**Autorização:** “Sim. Depois disto revise e gere o apk para testar.” O escopo contempla a paleta de cores mantida no PR #25, cinco (não seis) imagens-base ativas, selo inferior de liga TOP #N escolhido, e efeito de carregamento no círculo central da Pokébola **somente durante a consulta ativa**. É autorizado compilar APK debug para teste; **não** fazer merge automático.

**Mudanças da branch `ux/iv-color-shiny-separate-20261018`, PR #25:** PNG duplicado de Copa `result-icons/base/base-cup.png` retirado; `Cup` reutiliza `base-none.png` com texto CUP; permanecem os cinco PNGs-base fornecidos e os 18 originais **somente como backup histórico, sem fallback runtime**. `getResultIcon` produz `#1...#50` em GL/UL com base no limite do filtro realmente configurado; TOP #10 não constitui prova de que Pokémon individual é rank 10. A base Personalizado marca 0/100/% conforme busca; Shiny neutro independente da cor IV; Background continua indicador condicional a site comprovado (a busca BG real NÃO foi implementada).

**Pulso central:** elemento CSS `capturePulse` com pulsação suave e pequena (23% do ícone), preservando área de toque 35x30px e ícone máximo 21px, respeitando P/M/G, `prefers-reduced-motion` e janelas recolhidas. Flag booleana real `searchInProgress` do Android é encaminhada como último argumento opcional do `onNativeData`; nenhuma animação em cooldown de 60 s, Shiny pendente ou consulta encerrada. Nada de alterar intervalo, pesquisar mais rápido, ampliar imagem, ocupar fundo, alterar as notificações ou adicionar modos.

**Workflow de teste autorizado:** incluir esta branch no gatilho de `.github/workflows/build-v051-filters-preview.yml` para executar Node, Gradle, build debug, apksigner e publicar artefato de APK apenas após push; **ainda exigir confirmação de run, validação e download**, não declarar compilação antes do término. Testes de UI atualizados para cinco PNGs ativos e quatro novas regressões UX-ICON-02. Não criar outro guia mestre, não misturar PvPPokeGo, sem mudança em main, PRs #21–24, ou planos de Background.


**Checkpoint de build concluído (UX-ICON-02 / 18-10-2026):** GitHub Actions [run #39159190817](https://github.com/LucianoToscano/PokeSearch/actions/runs/39159190817) executou o commit de código `201e2071e9ac35979c6574f1239594a4b2e4b499`, workflow `PokeSearch v0.51 filter preview APK` com **conclusão SUCCESS** (checkout/JDK17/Gradle/SDK36; `node --check probe.js`, `probe-smoke.test.js`, `overlay-ux.test.js`, JS extraído de `dock.html`; `:app:assembleDebug` e `:app:testDebugUnitTest`; ZIP verificado com `unzip -t`; `apksigner verify --verbose`; upload). **Não foi gerada assinatura de produção:** este é APK Android **DEBUG de teste**, e a assinatura de debug pode ser diferente da versão instalada; Android poderá bloquear instalação por conflito de assinatura e convém fazer backup antes de substituir app existente. Não houve teste físico de overlay, login, animação nem acesso autenticado ao PoGoCoordinates; CI sucesso não homologa UX em aparelho.

**Artefato entregue** pelo workflow: `PokeSearch-v0.51-Filtros-Teste-APK` (GitHub artifact ID `12148157623`), que contém `PokeSearch-v0.51-Filtros-Teste.apk` + `SHA256SUMS.txt`. Artefato ZIP conferido localmente; teste `sha256sum -c SHA256SUMS.txt` = OK; APK renomeado para distribuição conversacional `PokeSearch-v0.51-Icones-Dinamicos-TESTE.apk`, mantendo bytes idênticos. **SHA256 APK:** `73617c94581f35f707307fcd7860c671104e3d4c13011f3c73e1101674c4ce5f`, tamanho `1.148.686` bytes. Estrutura interna ZIP do APK íntegra e enumeração confirmou exatamente cinco PNGs-base `base-custom/gl/ml/none/ul.png` sob `assets/result-icons/base/`; nenhum `base-cup.png`. Preservar o histórico dos 18 ícones antigos no repositório, mas não usá-los em runtime.

**Estado ao final:** cinco bases, selo TOP N e pulso central implementados, CI Android DEBUG sucesso, APK disponível para teste; PR #25 permanece **DRAFT**, sem merge. Aguardar feedback do usuário em P/M/G, badges Shiny/Background/rank e início/fim da animação, sem iniciar alterações funcionais de Background não aprovadas.


### 12.18 Evidência externa de notificações e divergência semântica em favoritos (18/10/2026)

**Origem:** sete capturas de conversa e da tela de notificações Android compartilhadas pelo proprietário. Registrar somente achados técnicos anonimizados: **não salvar nomes de grupos/contatos, fotos, números de telefone, credenciais, prints privados ou transcrição integral** no repositório. O testador mostrou alertas de Pokémon novos (espécies ilustrativas Electrike e Blitzle) em pesquisa RAW, confirmou em conversa que o aviso sonoro funcionou e demonstrou configuração de som mais alto no canal de Favoritos **no próprio Android**. O print das configurações apresenta três categorias visíveis: `PokeSearch` (serviço), `Novos Pokémon encontrados` (geral) e `PokeSearch · Favoritos` (especial). Isto comprova observação humana dos dois canais de aviso e possibilidade de personalização pelo sistema; **não** comprova a origem exata da versão instalada, nem valida IV individual, GL/UL, deduplicação, tempo de despawn, corretude das espécies ou o APK DEBUG gerado em run `39159190817`. O relato no grupo de “outro radar” errando um 100% não deve ser atribuído automaticamente ao PokeSearch.

**Auditoria de fonte realizada nesta retomada:** `OverlayService.java:recordNewResults` seleciona `firstNew` após `verifiedTargetCriteria(c)` e envia notificação geral no canal `pokesearch_alerts`, e `WatchAlerts.match` no canal `pokesearch_watch_sound_v1` (IMPORTANCE_HIGH) para nomes de favoritos quando a pesquisa estiver comprovada. `WatchAlerts.ensureChannel` dá descrição “Aviso sonoro ao encontrar um favorito com IV100 ou ranking #1”, mas a condição para alerta favorito usa `verifiedTargetCriteria(c)` do **modo/filtro em execução**, que pode ser Raw não perfeito, faixa percentual diferente de 100, GL/UL TOP N maior que 1. **Divergência semântica concreta e risco de expectativa enganosa**: configuração Android promete exclusivamente 100%/#1 onde implementação permite outros matches válidos para a pesquisa. A categoria de favoritos tem som padrão configurado no Android com `RingtoneManager.TYPE_NOTIFICATION` e pode receber personalização pelo usuário no canal do próprio aparelho; o app não força volume específico nem deve substituir configurações pessoais. Se modo de avisos estiver `silent`, o favorito usa o canal silencioso próprio `pokesearch_watch_silent_v1`.

**Recomendação técnica ainda NÃO aprovada para código:** definir separadamente (A) “alerta de favorito encontrado nos filtros atuais” ou (B) “alerta premium estrito IV100/rank #1”, exibindo a política verdadeira nas configurações, detalhe da notificação e teste. Se a intenção for o caso B, adicionar uma regra de evidência específica de IV 15/15/15 ou rank individual 1, e **não** tratar GL/UL Top 10 como rank 1; manter canais configuráveis, não remover alertas gerais nem invalidar som personalizado, respeitar Android 13+ e deduplicação PL-07. Associar a **UX-05** e **PSC-02/PL-07** sem considerar implementado. Não criar novos arquivos mestres; nenhuma mudança de código, APK, manifesto, ícones, canal ou permissão foi feita nesta anotação.

**Status de QA:** notificações normais + canal de favoritos e customização de toque **evidenciados em aparelho de terceiro / versão exata não identificada**; correção da descrição e regra de elegibilidade **aguardando decisão do proprietário**. PR #25 continua draft, sem merge automático. Reproduzir cenário com APK atual, favoritado + Raw 15/15/15, Raw misto, IV% 91–100, GL/UL Top 1 e Top 10, confirmando por que cada alerta dispara e distinguindo canal normal versus favorito.


### 12.19 Lista de execução futura — notificações gerais, favoritos e critérios reais (18/10/2026)

**Comando do proprietário:** “Certo registre tudo isto no arquivo e adicione na lista do que vamos fazer.” Autorização **documental exclusivamente**: atualizar listas UX-05 e PL-07 e incorporar a evidência da seção 12.18 como tarefas futuras, **sem modificar APK, código, AndroidManifest, canais Android, versão ou PRs anteriores**. Todos os contatos, grupos, telefones, fotos e capturas pessoais ficam fora do repositório.

**Situação comprovada:** um testador externo mostrou dois tipos de avisos (novos Pokémon na busca RAW e favoritos), distinguiu as categorias Android `PokeSearch`, `Novos Pokémon encontrados` e `PokeSearch · Favoritos` e relatou ajuste bem-sucedido do som de Favoritos no sistema do próprio aparelho. Isso **não** confirma a versão exata instalada, não mede volume nem prova o IV/Rank individual; tampouco certifica o último APK `PokeSearch-v0.51-Icones-Dinamicos-TESTE.apk`. Preservar tudo que já funcionou.

**Lista de tarefas a executar, vinculada a UX-05 / PL-07 / PSC-02 (sem criar PL/UX novos):**
- [ ] **UX-05 / decisão 1:** o proprietário escolher a semântica do alerta especial: **A)** favorito cadastrado que corresponda ao filtro de busca configurado; **B)** favorito cadastrado **somente** quando **IV100 ou rank individual #1 for comprovado**; ou **C)** as duas políticas configuráveis e nomeadas separadamente. **Não decidir automaticamente.** Atualmente o app comporta-se como A, mas a descrição do canal promete B.
- [ ] **UX-05 / descrição e UI:** após decisão A/B/C, corrigir rótulos em `WatchAlerts.ensureChannel`, preferências e textos dos alertas/teste para refletir a verdade; distinguir explícita e consistentemente notificação geral, favorito correspondente aos filtros e (caso adotado) favorito premium estrito. Não apresentar filtro **Top 10** como rank individual **#1**, nem Raw não perfeito como IV100. Considerar que **canais Android já criados preservam configurações/descrições e som**; uma migração de ID deve ser planejada com cuidado para não perder preferências; nenhuma migração automática autorizada.
- [ ] **PSC-02 / prova antes do aviso:** exigir IV individual confiável (tripla A/D/S ou percentual comprovado conforme modalidade e regra aprovada), ranking **observado** ou classificação segura de `Top N` apenas para critério A; separar dados inconclusivos, status stale e resultados anteriores. Não emitir alarme com IV100/rank #1 inventado.
- [ ] **UX-05 / sons configuráveis:** manter separados som normal e favorito, respeitar o toque/volume que a pessoa escolheu no Android, preservar canal silencioso, permissões do Android 13+ e modos Som/Silencioso/OFF. Verificar se alertas especiais utilizam prioridade adequada **sem substituir preferências do usuário**.
- [ ] **PL-07 / deduplicação:** evitar repetição dos mesmos avisos em refresh, troca de filtro, login, reaparecimento de resultado de cache, várias janelas e notificação geral × favorita; não suprimir novas ocorrências legítimas nem perder alertas favoritos.
- [ ] **Testes Android reais:** comparar modo Raw 15/15/15, Raw misto, faixa IV% 91–100, GL/UL Top 1 e Top 10, Pokémon favorito/não favorito, 0 resultados, IV/rank não comprovado, site offline, resultados stale, sessão reiniciada e canais com som original ou personalizado. Confirmar título/corpo do alerta, momento do disparo, vibração/toque/silêncio e histórico/duplicação; incluir Android 15 e 16 quando disponíveis.
- [ ] **Homologação:** demonstrar comportamento ao proprietário, registrar evidências **anonimizadas neste mesmo Guia Mestre** e somente depois solicitar autorização de merge. Não gerar APK novo até pedido específico ou autorização explícita em etapa posterior.

**Ordem sugerida:** (1) decisão semântica UX-05 A/B/C → (2) correção de texto/regra com provas PSC-02 → (3) regressão sonora/canais/permissões → (4) deduplicação PL-07 → (5) testes Android/aceite. Prioridade funcional **P1 para evitar notificações enganosas**, sem renumerar o item UX-05 P2 de organização da interface. Evidência documental registrada e backlog atualizado; **NADA implementado nesta entrada**.

**Governança:** preservar cinco artes-base ativas e PNGs históricos como backup, 12 controles, máximo 21px no cabeçalho, pulso central, janela independente, limites de busca, todos os dados e o estado atual dos PRs #21–#25. PokeSearch é separado de PvPPokeGo; não criar documentos mestres adicionais nem modificar `main` sem confirmação.


### 12.20 UX-FIX-01 — correção visual após teste de usuário (18/10/2026)

**Autorização:** após capturas de funcionamento real do APK de ícones, o usuário relatou Pokébolas achatadas/cortadas, %/rank em cápsulas escuras mal posicionadas, brilho ✦ branco com fundo, informação IV% junto aos sprites que deseja **oculta por padrão**, Toast de “Nova busca em Xs” intrusivo ao trocar filtros e efeito central de carregamento pouco visível. Pediu desativar temporariamente a proteção de tempo e confirmou: “Sim começar aplicar.” **Sem autorização específica para outro APK neste turno; trabalhar apenas em branch e testes, sem merge.**

**Escopo aplicado em branch `fix/ux-icon-layout-overlay-20261018`, derivada do PR #25:** preservar cinco artes-base PNG e 18 originais em backup; exibir imagem em 1:1 `aspect-ratio:1/1`, `object-fit:contain`, sem recorte nem sobreposição de fundo; cabeçalho máximo de 21×21 px no toque original 35×30px, adaptação P/M/G preservada. Rótulos de modo 0/100%/%/#N agora são texto com sombra, **sem fundo/borda/padding**, na posição inferior do ícone sem achatá-lo; Shiny usa **✨** sem caixa, Background (somente após site confirmar) fica sem fundo. Os números IV% por sprite ficam OFF por padrão (`showResultText=false`), mas atributos persistem em `aria-label` e detalhes para acessibilidade; preparar futura preferência Show/Hide sem habilitá-la agora. Temporizadores de **despawn** permanecem independentes, quando o usuário ativa.

**Carga/pulso:** clarear o pulso e halo em ciano no círculo central durante `searchInProgress` comprovado; duração 0,85s, sem ampliar os 21px ou bloquear toque, sem movimento quando a preferência do Android exige animação reduzida.

**Cooldown:** remover **somente da UI** o Toast nativo “Nova busca em Xs”, `data-wait` e segundos flutuantes abaixo do ícone. Informação de espera permanece no status/título acessível. **Exceção temporária de TESTE:** bypass da espera local mínima de 60s ocorre APENAS se `ApplicationInfo.FLAG_DEBUGGABLE` estiver ativo (APK DEBUG), mantendo a proteção em RELEASE, serialização de busca `searchInProgress`, resposta a 429 e eventuais limites do servidor. Necessário restaurar a espera de DEBUG antes de distribuição a terceiros; não automatizar consulta excessiva.

**Verificações a executar:** análise CSS/layout e 12 botões, JS `dock.html` sem erro, testes de contrato `overlay-ux.test.js`, `probe-smoke.test.js`; comparar P/M/G e a Legibilidade dos pequenos marcadores no Android real, buscar/terminar para avaliar halo, simular restrição de rede, confirmar que som de favoritos e PSC-02 continuam iguais. **Não declarado como CI/Android homologado até teste físico ou workflow com sucesso.** Não modificar outros arquivos mestres, PRs anteriores ou `main`; PvPPokeGo separado.


**Checkpoint de revisão UX-FIX-01 — PR #26:** novo PR [#26](https://github.com/LucianoToscano/PokeSearch/pull/26) **draft**, base `ux/iv-color-shiny-separate-20261018` (PR #25) e head `fix/ux-icon-layout-overlay-20261018`. Commit inicial `ded651557d7ebdfb18a65d8850da8266cefde19d`; correções dos testes de acessibilidade, contador visual e tamanho CSS foram registradas em commits subsequentes nesta mesma branch. Nenhum merge ou edição direta de `main`, #21–#25. Foram alterados apenas `app/src/main/assets/dock.html`, `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java`, `app/tests/overlay-ux.test.js` e **este** `docs/GUIA_MESTRE.md`, sem imagens extras ou ajustes em sessão/alertas.

**Evidência de teste isolado:** `overlay-ux.test.js` foi executado integralmente em motor V8 com 19 fontes reais obtidas da branch, substituindo APIs Node de leitura por mocks e verificação binária PNG por stubs: **238 contratos passaram**, incluindo 6 novos casos UX-FIX-01. `probe-smoke.test.js` executado em V8 sobre `probe.js` real da branch com mocks de fs/path/vm/assert: **72 testes passaram** (PSC-02 preservada). `dock.html` JavaScript inline passou checagem de sintaxe por `new Function`. Os testes são regressões de **código/contrato**, não substituem Node real, Gradle, CI, renderização WebView, assinaturas do APK nem validação física do círculo de captura. **Nenhum APK foi criado nesta rodada**.

**Observação importante para QA:** a dispensa do piso local de 60 s **é limitada a DEBUG**, não deve ser usada em versão distribuída publicamente; mantém o processamento de limites impostos pelo PoGoCoordinates. Se o servidor negar consultas rápidas, respeitar erro 429/rate limit e restaurar o valor normal. Para o próximo teste no Android conferir a proporcionalidade real da arte enviada (P/M/G), indicador sem fundo no centro inferior, brilho ✨ sem fundo e sem cortar, ocultação do IV% dos sprites por padrão, halo central enquanto consulta ativa, ausência do toast flutuante “Nova busca em Xs”, e favoritados/alertas/PSC-02 intactos.

**Estado:** implementação em branch e testes isolados aprovados; **aguardando compilação solicitada e teste Android**, sem merge. Futuro ajuste Mostrar/Ocultar texto por preferências ainda em backlog, não implementado neste passo.


### 12.21 PS-009 / PL-03 / PL-11 — resolver relogin após atualizações de APK (18/10/2026)

**Relato:** a cada reinstalação de uma nova versão de teste do PokeSearch o usuário precisa autenticar novamente no PoGoCoordinates com Gmail. Solicitou investigação e proposta, NÃO autorizou mudança de assinatura/código neste turno. Registrar apenas no Guia Mestre do PokeSearch.

**Evidências do repositório no PR #26:**
- app/build.gradle.kts define applicationId com.lucianotoscano.pokesearch, versionCode 51 e versionName 0.51-beta. Configuração privada via POKE_RELEASE_KEYSTORE existe somente em release e apenas quando disponibilizada externamente; debug não está ligado a uma chave fixa.
- .github/workflows/build-v051-filters-preview.yml usa runner efêmero ubuntu-24.04 e comando assembleDebug, sem configurar keystore persistente. O certificado DEBUG pode variar de build para build; o Android impede atualizar um pacote com certificado incompatível. Desinstalar o APK anterior para instalar outro apaga os dados privados e a sessão do WebView.
- AndroidManifest.xml declara android:allowBackup=false, ou seja, dados de sessão não têm restauração automática. Manter essa escolha até uma revisão de segurança específica.
- MainActivity e OverlayService permitem cookies, cookies de terceiros para a WebView e DOM storage. Após autenticação, MainActivity usa CookieManager.flush(); só o logout explícito remove cookies e WebStorage. A persistência do site já foi programada: problema prioritário parece ser a desinstalação, não a falta de CookieManager.
- O usuário ainda não forneceu mensagem exata do instalador nem teste de atualização sobreposta. Diagnóstico da causa é PROVÁVEL, não confirmação em aparelho. A sessão oficial também pode expirar ou ser revogada pelo servidor independentemente do APK.

**Plano proposto, AINDA NÃO autorizado:**
1. Gerar ou reutilizar uma **keystore de teste estável** controlada pelo proprietário, armazenada em cofre seguro/segredos do CI e com backup offline protegido. Nunca colocar arquivos de chave, senhas, JWT, cookies ou sua codificação base64 no repositório, Guia Mestre, anexos públicos ou conversa.
2. Ajustar Gradle + workflow de artefatos para assinar toda atualização de teste do mesmo applicationId com a mesma chave; distinguir chave de teste da futura release pública, mantendo canais de distribuição separados quando necessário.
3. Incrementar versionCode em novas versões testáveis; orientar instalação por cima (Atualizar), jamais desinstalar se quiser preservar dados. Se a chave antiga for incompatível e irrecuperável, pode ser inevitável UMA ÚLTIMA reinstalação ao migrar para a nova chave fixa. Depois manter atualização in-place.
4. Não copiar/importar cookies do Google/PoGoCoordinates manualmente e não contornar autenticação/expiração do site. Se o relogin ocorrer mesmo após upgrade assinado corretamente, investigar TTL e site OAuth, página carregada, perfil de WebView e status de sessão em Android real.
5. Homologar: build A → login oficial → builds B e C por cima mantendo package name, assinatura, favoritos, preferências e sessão enquanto válida; conferir ainda login/logout, Android 15/16, mudanças de versão, falha de assinatura, Shiny, 12 controles e alertas.

**Governança:** dependências PS-009 (P0), PL-03 (P0), PL-11 (P2); sem nova numeração PL/UX/PSC. Nenhum arquivo de código/CI foi modificado neste registro; PR #26 draft e main intocados. Solicitar autorização para implementação específica antes de criar/alterar chave ou produzir APK. Não prometer login eterno, apenas persistência durante upgrades compatíveis. Não misturar PvPPokeGo.


### 12.22 PS-009 — implementação aprovada de assinatura persistente nos APKs de teste (18/10/2026)

**Autorização explícita:** “Vamos fazer isto”. O usuário aprovou implementar a assinatura fixa de APKs de teste para não perder login/sessão ao atualizar sobre a instalação anterior. A autorização **não implica compilar APK agora, criar credenciais em mensagens, alterar main, mexer no Google OAuth nem fazer merge automático**.

**Implementação técnica isolada:** branch `fix/ps009-stable-test-signing-20261018`, derivada do PR #26, com alterações previstas apenas em `app/build.gradle.kts`, `.github/workflows/build-v051-filters-preview.yml`, `.gitignore`, `app/tests/signing-contract.test.js` e neste mesmo `docs/GUIA_MESTRE.md`. O Gradle passa a reconhecer `POKE_TEST_KEYSTORE`, `POKE_TEST_STORE_PASSWORD`, `POKE_TEST_KEY_ALIAS`, `POKE_TEST_KEY_PASSWORD` e `POKE_TEST_VERSION_CODE`. A configuração `persistentTestDebug` assina a variante DEBUG somente com parâmetros válidos. O release existente `privateTestRelease` permanece intacto. A flag `POKE_TEST_SIGNING_REQUIRED=true` obriga campos e versionCode presentes; não publica APK usando chave de runner efêmero. A compilação local sem esta flag mantém debug do Android Studio, mas **não deve ser distribuída como atualização**.

**Workflow preparado (não executado nesta etapa):** recupera base64 da keystore PKCS12 somente via segredo protegido `POKE_TEST_KEYSTORE_B64`, exige os três segredos de senha/alias, valida a chave por `keytool`, guarda-a temporariamente sob `RUNNER_TEMP` com permissão 0600, usa o mesmo `applicationId=com.lucianotoscano.pokesearch` e define `POKE_TEST_VERSION_CODE = 51000 + GITHUB_RUN_NUMBER` por execução deste workflow para permitir atualização com `versionCode` crescente. Depois do build, `apksigner verify --print-certs` e conferência ZIP precedem a publicação. Artefato somente `PokeSearch-v0.51-Teste-Atualizavel.apk`, `SHA256SUMS.txt` e o **fingerprint público** `SIGNING_CERT_SHA256.txt`; chaves, senhas e relatório interno ficam fora do artefato. Variável opcional `POKE_TEST_CERT_SHA256` (GitHub Actions Variables, não secreta) permite fixar o certificado e impedir publicações com chave acidentalmente trocada. A chave temporária é excluída ao final inclusive em falha.

**Impedimento real:** o conector GitHub disponível nesta conversa não possui método para criar ou editar GitHub Actions Secrets; seu mecanismo de leitura de GitHub também não acessa endpoints sensíveis. **O usuário precisa criar/guardar a keystore e cadastrar quatro segredos PRIVADAMENTE na interface do GitHub ou em sua própria máquina/CI**. Não pedir colar senhas, cookies, tokens ou base64 no chat. A chave privada NÃO foi gerada, armazenada ou transmitida nesta execução. Sem esses segredos, o novo workflow interrompe o build **antes de produzir um APK de distribuição**, mantendo a segurança. Após configuração, pedir explicitamente a compilação/teste.

**Procedimento operacional privado sugerido:** usando JDK/keytool no computador privado, gerar um keystore PKCS12 forte com alias estável; armazenar backup offline cifrado. Em GitHub repositório -> Settings -> Secrets and variables -> Actions, cadastrar `POKE_TEST_KEYSTORE_B64`, `POKE_TEST_STORE_PASSWORD`, `POKE_TEST_KEY_ALIAS`, `POKE_TEST_KEY_PASSWORD` sem expor os valores na conversa. Registrar o fingerprint PÚBLICO no campo variável opcional `POKE_TEST_CERT_SHA256` após a primeira compilação para bloquear rotação involuntária. A primeira migração a partir de APK antigo com outro certificado pode exigir última reinstalação; novas versões com esse mesmo certificado, pacote e `versionCode` maior devem instalar por cima mantendo dados e cookies do WebView enquanto a sessão for válida.

**Testes ainda pendentes:** validar Kotlin/Gradle e build completo após segredos; comparar SHA256 do certificado público entre builds A/B/C; confirmar `versionCode` estritamente crescente, instalação sobreposta no Android 15/16, preservação de sessão oficial válida, login/logout, favoritos/IV/12 controles e mensagem de conflito se chave errada. Não prometer autenticação vitalícia; servidor pode expirar sessão. Todos os outros PL/UX/PSC e o visual PR #26 continuam sem alterações nesta tarefa. Não misturar PvPPokeGo.

**Status:** Gradle, workflow, `.gitignore`, teste estático e documentação **preparados para PR draft**; validação de CI e chave protegida pendentes de configuração do proprietário, sem build/merge automático.
