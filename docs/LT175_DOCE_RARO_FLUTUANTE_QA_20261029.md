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
