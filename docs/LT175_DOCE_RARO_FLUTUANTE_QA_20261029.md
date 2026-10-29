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
