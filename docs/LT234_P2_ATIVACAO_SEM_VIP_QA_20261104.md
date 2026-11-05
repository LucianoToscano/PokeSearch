# LT234 QA — Pokébola 2 livre de VIP e ativação independente (04/11/2026)

## Estado
- **Natureza:** alteração em branch de QA, ainda sem merge, sem novo APK público e sem atualização do aplicativo.
- **Base:** `main` em `eac2e15706e7d64712912905faefb3bca248d54d` (documentação pós-LT233).
- **Versão pública de referência:** LT233 / `0.02.33` / `54437` / tag `v0.02.33-54437`.
- **Branch:** `fix/lt234-p2-free-no-vip-20261104`.
- **Próximo versionCode:** NÃO ATRIBUÍDO; conferir maior código estável/QA instalado antes de qualquer APK.

## Solicitação
A segunda Pokébola não deve mais exigir licença VIP/Premium ou login Google para ser ativada. Seu botão e comportamento devem ser equivalentes aos da primeira, mantendo estados e preferências independentes.

## Diagnóstico confirmado no código LT233
1. `MainActivity.toggleSecondaryOverlay()` apresentava login/compra Premium em builds controlados e recusava P2 sem direito.
2. `MainActivity.startSecondaryOverlayAuthorized()` repetia a exigência da licença.
3. `OverlayService.onCreate()` recusava P2 sem direito; dois timers posteriores paravam P2 com licença inválida, expirada ou rede indisponível.
4. `MainActivity.onResume()` e o logout do Premium desligavam a P2 quando o status da licença mudava.
5. A solicitação inicial da permissão Android de overlay pela P2 usava o request code `101`, cujo retorno chamava `startOverlay()` (P1).

## Alterações implementadas na branch
- `MainActivity.java`: botão **Ativar Pokébola 2**; `toggleSecondaryOverlay()` liga/desliga diretamente sem gate VIP; método de início sem verificação de licença, preservando `AppAvailability`, `initializeSecondaryFilterDefaults`, sessão de conta selecionada e `SecondaryOverlayService`.
- Pedido de permissão Android de sobreposição de P2 por `103`; `onActivityResult(103)` retoma P2 e `101` continua iniciando P1.
- Logout da conta Google Premium e `onResume()` não param mais P2 por licença; manutenção geral do aplicativo permanece no `AppAvailability`.
- `OverlayService.java`: removidas as verificações específicas de assinatura Premium da P2, mantendo verificação geral do app, integridade do APK e separação dos serviços/estado.
- `PremiumAccess.java`: `permitted(secondary)` devolve verdadeiro para ambos os overlays, mantendo as funcionalidades opcionais de conta Premium, transferência e administração isoladas.
- Testes legados `lt134-premium-google-preserve-lt133.test.js` e `lt139-google-logout-visibility.test.js` adaptados à nova regra, preservando contratos de login Premium que não envolvem habilitar Pokébolas.
- Novo teste `lt234-secondary-free-activation.test.js` para impedir regressão de gate VIP, monitoramento, logout, isolamento P1/P2 e request codes.

## O que NÃO foi alterado
- API PoGoCoordinates, regras do provedor, quotas, HTTP 429/Retry-After, Shiny, sprites, PvP, cache de coordenadas, Doce Raro, Favoritos, Firebase, sessão de cada conta, assinatura e update center.
- O bloqueio de login da **Conta 2** quando essa conta for explicitamente selecionada mas não autenticada continua sendo um mecanismo de isolamento de sessão, NÃO uma exigência VIP. A pesquisa normal sem login na conta disponível segue preservada.
- O bloqueio **global** de versão ou manutenção via `AppAvailability` aplica-se a P1/P2 como antes.
- Esta alteração não concede recursos VIP de serviços terceiros nem ignora limites da PoGoCoordinates.

## Testes e pendências
- **Automatizados:** adicionar execução dos testes LT134/LT139/LT170/LT234, Node integral, Java/Android, Gradle e integridade/OTA pelo CI da PR. Registrar SHA exato e conclusão real, sem declarar PASS antecipado.
- **Samsung:** iniciar P2 sem Google Premium; desligar/ligar P2; conceder permissão de overlay em instalação limpa (iniciar apenas P2); usar P1 e P2 simultaneamente; confirmar filtros e favoritos, perfis 100%/0%, conta/treinador, notificações e estabilidade; efetuar logout Premium com P2 ativa e manter P2; simular mudança no status Premium sem encerrá-la; conferir manutenção global quando aplicável.
- **Publicação:** pendente. Requer aprovação, PR com checks satisfatórios, merge autorizado e workflow **novo** de APK assinado com certificado permanente. Não reusar o workflow de publicação única LT233 nem publicar APK de debug.
