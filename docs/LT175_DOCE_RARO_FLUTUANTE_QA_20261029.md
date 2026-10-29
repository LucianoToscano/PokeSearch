# LT175 — Doce Raro flutuante — continuação da LT173 (29/10/2026)

## Estado
Implementação em branch QA, **não distribuída**. Base `main` LT173 pública `0.01.73 / 54378`; PR #133 (LT174 / segurança OTA) mantida separada, sem merge nem conflitos intencionais. Mudança de Java e Manifest: **exige novo APK completo assinado**. Não há OTA compatível com a instalação LT173 para esta funcionalidade.

## Escopo entregue para QA
- Home: botão Doce Raro imediatamente após ícone do Clima/tema, com imagem fornecida pelo proprietário, sem substituir as duas Pokébolas.
- Serviço `RareCandyOverlayService` independente e foreground, com bolha flutuante arrastável do mesmo tamanho base (45dp) e resultados em janela nativa própria.
- Toque na bolha abre/fecha lista. Long press (600 ms) abre `OverlayQuickMenus.showCandy`, compartilhando transparência, cores e blur dos menus nativos; Localização / raio 0–1000 km, refresh imediato, intervalo de 1/3/5 minutos e visibilidade de Localização/Despawn/Distância.
- Site oficial `https://pogocoordinates.com/search` é carregado por WebView do app com o perfil autenticado associado à Pokébola 1, sem extrair JWT, contornar limites, backend próprio ou criar um JavaScript bridge remoto. O script `rare_candy_probe.js` somente lê a aba Rare Candy e submete o formulário oficial. **Não mistura resultados do modo Pokémon com Doce Raro**. Até 10 resultados com coordenadas reais verificadas por formato/faixa geográfica.
- Cards compactos: sprite fornecida, texto local, contagem despawn no padrão vermelho/âmbar/neutro, distância à direita. Toque copia coordenadas exatas para clipboard, troca sprite para cinza e registra marca de copiado local independente de P1/P2.
- Ao chegar a 0 na contagem fornecida pelo site, remove o card localmente e solicita nova pesquisa com proteção de 15 s contra repetição excessiva. Sem TTL verificado, não fabrica horário de despawn. O site pode recusar login, bloquear consulta ou alterar HTML; nesse caso a UI apresenta estado indisponível e não inventa coordenadas.
- Posições, raio, duração, visibilidade e marcação de copiados ficam em `rare_candy_overlay`, sem sobrescrever `prefs`/`prefs_secondary`.

## QA exigido
- Node fixture `app/tests/lt175-rare-candy-overlay.test.js` e `node --check app/src/main/assets/rare_candy_probe.js`.
- Compilação Java Android com Manifest e novos assets, regressões das duas Pokébolas, checagem da assinatura permanente e publicação QA somente após compilar.
- Teste físico Samsung: bolha ao lado das Pokébolas sem interceptar toques indevidos; menus iguais visualmente, teclado do campo de coordenadas, drag, P1 e P2 simultâneas, persistência.
- PoGoCoordinates logado e deslogado: autenticação correta, no máximo 10 resultados, cópia e marca cinza, expiração, aba Rare Candy, localização e raio, site alterando DOM. Testar erro HTTP/offline e limites de consulta.
- Moto G15 Android 15: permissões, vida útil do serviço, consumo, sobreposição de WebViews/menus e arraste.
- Confirmar que a URL do site permanece fonte de verdade; não inferir sucesso da coleta apenas por uma fixture do DOM.
- **Não fazer merge, criar release, atualizar Google Drive ou publicar OTA sem validação e autorização expressa**. A LT173 continua pública.

## Continuidade
A próxima versão candidata é LT175 somente após validação. O pacote OTA LT174 segue em PR #133 independente. Mudanças Java/Manifest requerem APK assinado; não usar pacote OTA de HTML para distribuir este serviço.

---

## LT176 — correção após teste físico no Samsung (29/10/2026)

O proprietário testou o artefato LT175 e comprovou pelo screenshot que o ícone de Doce Raro estava grande demais, com fundo escuro, não respondia a clique e estava travado para arrastar. A consulta real da aba Rare Candy foi conferida separadamente no site, mas **a leitura pelo WebView do aplicativo não foi comprovada** nesse teste.

### Causa e correções aplicadas
- Causa do toque/arraste: WebView de 360×640dp estava inserido dentro da bolha (45dp) e tinha `setOnTouchListener((v,e)->true)`, consumindo o evento antes do listener do FrameLayout. O projeto das Pokébolas tem um `grip` transparente nativo sobre o WebView; a LT176 adota o mesmo princípio: `candyGrip` é inserido por último, captura toque/hold/drag e dispara `performClick()` após toque curto; WebView fica atrás.
- `bubbleWindow` agora é totalmente transparente, sem `GradientDrawable` ou borda. Imagem de Doce Raro reduzida para **27dp dentro de hitbox 45dp**, sem perda de área de toque.
- Ao abrir resultados, a janela flutuante evita cobrir a bolha: tenta direita, esquerda, abaixo ou acima. Isso permite continuar movendo e tocando no doce enquanto os cards estão abertos, inclusive em largura típica de Samsung.
- A leitura continua exclusivamente na aba Rare Candy do PoGoCoordinates, com resultados verificados (não permite fabricar posições). Menus mantêm os mesmos recursos visuais das Pokébolas; P1/P2 e contas permanecem independentes.
- Novo QA separado **LT176 0.01.76 / versionCode 54381**; mantém o certificado Android permanente. O SHA, tamanho e link final só devem ser anunciados após a Action assinada passar.

### Aceite
- Teste automatizado `lt175-rare-candy-overlay.test.js` acrescenta guardas sobre grip transparente, ausência de fundo, ordem de WebView e prevenção de sobreposição dos resultados.
- Testes reais pendentes: toque/segurar/arrastar Samsung, consulta real Rare Candy pela sessão **do aplicativo** (Chrome pode usar outra sessão), cópia da coordenada, cartão cinza, expiração/refresh, tamanho comparado aos resultados da Pokébola.
- **Não houve merge/Release/latest/Drive/OTA público**; a LT173 continua oficial. O build LT176 é QA e **exige APK completo** devido a alterações Java.

### LT176 — evidência da compilação QA assinada (29/10/2026)
- [GitHub Actions #40932888221 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40932888221)
- [Artifact privado QA #12924075960](https://github.com/LucianoToscano/PokeSearch/actions/runs/40932888221/artifacts/12924075960) — `PokeSearch-LT176-54381-RareCandy-QA-Assinado.zip`
- Arquivo interno: `PokeSearch-v0.01.76-LT-QA.apk` — **49.536.381 bytes**; build version `0.01.76 / versionCode 54381`.
- SOURCE_COMMIT exato da Action: `4cb698927b3f5ccef7cd1370c8237338e0bbf3db`.
- Assinatura Android v2 conferida contra identidade permanente, ZIP íntegro, R8, SHA-256 do APK checado por `sha256sum --check`, assets de Doce Raro presentes. ZIP do artifact: SHA-256 `f4977e5fdfe9ae50496312275ec5b0a14a7af986281c13618b2155a866964b83` (não confundir com hash do APK).
- **Publicação:** apenas Actions Artifact QA. LT173 continua release/latest oficial. Não houve merge, Google Drive, OTA, Firebase nem atualização enviada ao público.
- Testes funcionais Samsung após a correção ainda pendentes; sucesso de CI não prova funcionamento real da consulta do provedor.

---
## LT177 — API oficial de Doce Raro e paridade visual dos menus (29/10/2026)

### Evidência de campo
Screenshots do usuário do Samsung compararam P1 com o Doce Raro da LT176. O doce ainda parecia maior que os sprites da coluna da Pokébola, e o menu do Doce Raro usava componentes diferentes dos controles das Pokébolas. O usuário também disponibilizou o documento `pogo.md`, com contrato testado do endpoint Rare Candy (atualizado em 29/10/2026). O contrato é referência fornecida pelo usuário; a consulta efetiva no Android ainda precisa de validação física.

### Contrato da fonte oficial
- `POST https://coordinates-api.pokemongopro.com/rare-candy/search`, autenticação opcional, respeitando tier e rate limit.
- Com centro: `center_lat`, `center_lng` e `radius_km` juntos; sem centro: `{}`.
- Formulário do site usa **metros**: 1000 metros = `radius_km:1` no POST.
- Resposta traz `coords`, `location`, `expires_at` UTC, `distance_km`, `tier`, `cap`. Não usar `/reveal` e não inferir coordenadas.
- Rota de aba oficial: `https://pogocoordinates.com/search?tab=rarecandy`, sem hífen.
- Autorização e sessão permanecem no WebView do PoGoCoordinates e sob o controle do próprio site; o JWT é usado **dentro do contexto da origem oficial** e nunca retorna pela ponte Java, logs ou armazenamento do PokeSearch.
- O novo `rare_candy_probe.js` faz `fetch` à API, com limites de resultado do app (10), filtra lat/lng e `expires_at` inválidos e preserva `429 Retry-After` com backoff; lê a resposta assíncrona por `evaluateJavascript`, sem instalar bridge remota.

### Interface fiel ao modelo das Pokébolas
- `BUBBLE_DP=45` é a área de toque. A arte do doce foi diminuída de 27dp para **20dp**, deixando a sprite visual no patamar das espécies renderizadas na coluna de P1.
- Não há fundo quadrado atrás da bolha; grip transparente nativo continua por cima do WebView oculto.
- Resultados agora são uma **coluna vertical de sprites compactos** sob a bolha, transparente, sem cards grandes: doce, despawn abaixo, localização ao lado e distância pequena à direita; copiados tornam-se cinza. Expirados somem no horário real da API, seguido de consulta controlada.
- `rare_candy_controls.html` incorpora os estilos **exatos de tiles** de `dock.html` da Pokébola: 30dp de altura, largura de 34dp por ícone, gap 2dp, `#151b26e6`, borda `#ffffff23`, raio de 5dp e SVGs equivalentes. Não usa mais os botões nativos de `OverlayQuickMenus.showCandy` como UI ativa.
- Toolbar com Localização (coordenadas, raio em metros e aplicar/limpar/colar), Atualizar (toque imediato; pressionar por 550ms abre 1/3/5 minutos), Infos (toggles independentes Localização/Despawn/Distância) e Fechar. Popups no mesmo estilo escuro do dock.
- O menu HTML usa `file:///android_asset/rare_candy_controls.html` com bridge limitada à página local; a pesquisa remota usa WebView distinto **sem bridge**.
- Preferências próprias em `rare_candy_overlay`; P1/P2, busca Pokémon, contas e filtros anteriores permanecem intactos.

### Distribuição e QA
- Nova build de teste **LT177 `0.01.77`, versionCode `54382`**, certificado de assinatura permanente; arquivo `PokeSearch-v0.01.77-LT-QA.apk` em artefato privado do GitHub Actions (somente após o workflow finalizar com sucesso).
- Testes de integração Node e compilação Java Android na PR; exigir validação física de menus, toque/drag, keyboard, resultados reais, rate limit, cópia e expiração no Samsung/Moto.
- **Não fazer merge ou Release/latest, atualizar Drive, Firebase nem publicar OTA ainda.** Essa evolução mexe em Java, Manifest e assets, portanto precisa de APK completo assinado, não de patch OTA da LT173.

### LT177 — build QA assinado confirmado
- [Actions LT177 #40936145937 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40936145937)
- [Baixar artefato ZIP de teste #12923894267](https://github.com/LucianoToscano/PokeSearch/actions/runs/40936145937/artifacts/12923894267): `PokeSearch-LT177-54382-RareCandy-QA-Assinado.zip`
- Arquivo interno do ZIP: `PokeSearch-v0.01.77-LT-QA.apk`, tamanho **49.539.430 bytes**, `versionName=0.01.77`, `versionCode=54382`.
- O GitHub Actions confirmou compilação, APK assinado v2 com mesmo certificado permanente, R8, integridade dos assets, SHA-256 do APK por `sha256sum --check` e upload de QA. SHA-256 do ZIP do artifact: `8afb9b654b18108798cbb90609ac54b6b07b8df7b8a0b6310ab20ccd3c357091` (distinto do hash do APK).
- O artefato compilou o commit de código `366503ce3501465d761b9555c847477e3835bfb0`. Commits documentais posteriores não alteraram o APK.
- GitHub Releases/latest segue em `v0.01.73-54378`, sem merge ou entrega pública. A leitura real da API e o layout do popup ainda carecem de homologação física no Samsung.

---
## LT178 — Novo ajuste dos menus/infos e publicação solicitada (29/10/2026)

Relato do usuário após instalar LT177 no Samsung: o nome Doce Raro não tinha controle de ocultação, distância excessivamente afastada da sprite, menus ainda poderiam melhorar e refresh ↻ não reagia ao toque curto. Foi solicitada também imagem mais nítida preservando o mesmo doce, merge e distribuição no aplicativo.

### Implementado na branch da PR #134
- Exibição independente de **Nome Doce Raro** (`candyShowName`), Localização, Despawn e Distância. Valores iniciais para novos usuários: `false, false, true, false`. Preferências explicitamente salvas em versões anteriores permanecem preservadas.
- Sprite dos doces e despawn ocupam coluna estreita de 46dp; distância, quando ativada, fica dentro da própria célula transparente `FrameLayout spriteCell`, num rótulo discreto sobreposto na parte inferior. Não há distância em coluna à direita.
- Largura da lista encolhe para 48dp se Nome e Localização estiverem ocultos, ampliando somente quando o usuário escolher essas infos. Resultados ainda copiam coordenadas ao tocar e ficam acinzentados.
- Menus refinados: controles 34×30dp no padrão do dock, Popup Infos com Nome/Localização/Despawn/Distância, opções 1/3/5m na mesma linha, campos de coordenadas mais compactos; `syncCandy` não recria o formulário enquanto usuário digita.
- No refresh, `pointerup` chama `Native.refreshCandy()` imediatamente quando o toque é curto; `pointerdown` por 550ms abre menu de tempo sem disparar refresh. O serviço mantém um único `pendingManualRefresh` ao iniciar/concluir uma busca; mantém rate limit 429.
- Arte da mesma Rare Candy substituída por versão PNG transparente de **96×96** (anterior 32×32), preservando a identidade e área visual de 20dp. Integridade de chunks PNG/CRC verificada.
- Nova release note embutida `minVersionCode:54383` e versão QA `0.01.78/54383` assinada com certificado permanente.

### Integração e publicação
- Workflow de QA: `.github/workflows/lt175-rare-candy-signed-qa.yml` (protegido).
- Workflow novo de release **apenas depois de merge na main**: `.github/workflows/lt178-official-release.yml`. Recusa publicar se `latest` não for `v0.01.73-54378` ou tag já existir; executa regressões, recompila com assinatura permanente e publica `v0.01.78-54383` no GitHub Releases/latest. O atualizador do app detecta o APK novo ao consultar a release oficial; não força instalação.
- A ponte Drive tem de ser tratada separadamente, pois o workflow de GitHub não atualiza arquivos no Drive. **Não afirmar sincronização Drive sem confirmação de ID e upload.**
- Registrar SHA-256, tamanho, sucesso do workflow oficial e URL real da release após a publicação. Testes físicos dos dados da API ainda merecem validação final.
