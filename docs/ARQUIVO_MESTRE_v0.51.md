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

## 7. Continuidade em outro chat

Antes de qualquer modificação: abrir este arquivo, conferir estado atual da branch e PR #21, preservar `main` e backups, e continuar exclusivamente em `feature/v0.51-launcher-icon-fill-20261016` (ou nova branch derivada dela). Não recomeçar do zero, não confundir ícone do launcher com ícone do resultado, não confundir PNG importado com filtro funcional. Descrever o que foi realmente implementado e o que aguarda teste físico.
