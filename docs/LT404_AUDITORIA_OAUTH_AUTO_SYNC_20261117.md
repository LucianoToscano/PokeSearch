# LT404 — OAuth autenticado não sincroniza até tocar no avatar

**17/11/2026** · Base oficial LT403 v0.03.88 (54595) · Branch de QA, ainda sem publicação.

## Evidência do usuário
Vídeo `Screen_Recording_20261117_161445.mp4` (46 s): fluxo Google com verificação em duas etapas, retorno ao PoGoCoordinates /search, depois abertura manual do painel de contas. O painel passa a mostrar nome/foto da Conta 1 após a navegação; o vídeo não demonstra o erro de rede do provedor, nem comprova que o login foi bloqueado. **Não registrar e-mail, token, códigos 2FA ou dados de sessão em logs.**

## Diagnóstico técnico
O fluxo `checkLoginSession` dependia de um `onPageFinished` e, quando a sessão ainda aparecia `não confirmado`, só navegava automaticamente a `/profile` se `observedLoginProvider` estivesse vazio. Isso excluía justamente o retorno OAuth Google/Discord, quando o SPA /search pode hidratar antes do estado autenticado. A ação manual no avatar leva à página oficial de perfil e pode completar a verificação.

## Correção
- Depois de OAuth observado, permitir uma única navegação de verificação à página oficial `/profile`, caso a sessão ainda esteja ambígua; não clicar em login ou criar endpoints privados.
- Observar a conclusão da navegação React tanto por `onProgressChanged` quanto por `doUpdateVisitedHistory`, agendando uma checagem limitada por geração de página.
- Só marcar `autenticada` quando o probe de sessão do domínio oficial retornar explicitamente esse estado. Nome, foto e treinador continuam dependentes do perfil oficial.
- Não misturar Conta 1 e Conta 2, não alterar cookies, não ativar Shiny, não mexer em filtros, sprites, inventários, overlays ou proteção de captura.
- Teste de contrato `app/tests/lt404-oauth-session-hydration.test.js`.

## QA / ARK
- CI: Node QA, regressão completa, Java Android, OTA e R8 devem passar antes do merge.
- Teste físico obrigatório para confirmação funcional: Google 2FA, Discord, sessão expirada, P1/P2 e retorno de background. Confirmar que a identidade surge sem tocar no avatar; não inferir isso apenas da compilação.
- ARK solicitado: após gates, merge `main`, incrementar versão, publicar APK oficial com certificado permanente e verificar asset, hash, release e Guia Mestre. **Não anunciar como publicado até o workflow protegido terminar.**
