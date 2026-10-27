# PokeSearch LT134 — Google Premium integrado à LT133 (27/10/2026)

## Baseline obrigatório
- Fonte real LT133: `feature/lt133-halloween-sprites-compact-chat-20261027` / PR #92.
- **Nunca usar LT125 como base**: LT125 Premium foi desenvolvido em ramificação antiga e não contém as mudanças LT126–LT133.
- LT134: `feature/lt134-google-premium-preserve-lt133-20261027`; versão QA `0.01.34`, `versionCode 54339`. Branch separada, sem merge em `main`, sem publicação oficial.
- Mantenha todo o desenvolvimento do chat/Google admin, capturas, reações e imagens/costumes Halloween 2021 da LT133; sprites e catálogos permanecem aqueles da LT133.

## Integração seletiva de Premium
- Java: `PremiumAccess`, `PremiumGoogleLogin`, `PremiumPurchaseDialog`, `PremiumAdminDialog` trazidos da QA Premium anterior e adaptados para `FirebaseStats.ensureApp()` da LT133.
- `PremiumGoogleLogin` tem `FirebaseApp` próprio (`PokeSearchPremiumIdentity`) e Credential Manager Android. Não substitui `PokeSearchStats` (anônimo) nem `PokeSearchChatAdmin` existente nem o login PoGoCoordinates.
- `app/build.gradle.kts`: Credential Manager, Web OAuth client público `POKE_GOOGLE_WEB_CLIENT_ID` com fallback validado da configuração OAuth LT133; `CONTROLLED_DISTRIBUTION=false` por padrão e habilitado somente por CI de QA assinado.
- Endpoint remoto no APK QA controlado: `https://pokesearch-premium-ivern.netlify.app/api/premium`, que já passou no teste anterior Firebase e licenças. Backend hospedado na branch `feature/premium-pix-remote-control-qa-20261027` do Netlify; não foi redeployado pela LT134.
- `MainActivity`: só a Pokébola 2 pede conta Google e licença em build controlada; longa pressão na marca permite admin, verificado pelo servidor; P1 verifica política global/versão. Nas versões normais, P1 e P2 mantêm comportamento LT133.
- `OverlayService`: comum às duas Pokébolas, valida lease efêmero e revalida, sem alterar busca, filtros, histórico, sprites, chat ou WebView.
- `app/tests/lt134-premium-google-preserve-lt133.test.js` protege integração Google e preservação LT133.
- NÃO ativar cobrança, Pix, políticas globais ou por versão sem autorização expressa.

## QA de assinatura e entrega
- Workflow `.github/workflows/lt134-halloween-chat-gmail-premium-signed-qa.yml`, GitHub Actions, versionName 0.01.34, versionCode 54339, assinatura permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, SHA-1 `dd7bf665e1d47a257fc557b51cb5a57dfd13cb96` registrado no Firebase.
- O workflow herda toda a validação LT133: scripts de catálogo, 716 formas, 16 trajes, Halloween 2021, sprites P1/P2, Node, R8, assinatura v2, zip e APK completo.
- Entregar primeiro por GitHub artifact e URL do run, conforme `AGENTS.md` e protocolo contra **Library file not found**. ZIP abaixo de 199 MB.
- Fonte LT134 deve manter os assets anteriores (LT133), NÃO substituir `google-services.json`.
- **Controle remoto ainda não habilitado**: enquanto `distribution/globalEnabled=false` ou `distribution/versions/54339=false`, a QA controlada não abre as Pokébolas; login Google pode ser testado na Home, mas não tratar bloqueio como falha de assinatura.
- Não instalar por cima do PokeSearch principal sem backup e sem verificar caminho seguro de retorno. APKs de QA podem impedir downgrade normal por versionCode.

## Verificações Samsung pendentes
1. Login Google Premium com a conta usada no painel Deus Ivern; mesmo UID Firebase e licença de 15 dias.
2. Reinstalação / seleção da mesma conta; expiração e revogação sem prolongamento local.
3. Conta diferente não pode usar licença; saída derruba lease e fecha P2.
4. Testar P1 e P2, filtros/menus independentes, sprites normais/Shiny e Halloween 2021 nas duas, login PoGoCoordinates e OAuth Google administrador do chat separados.
5. Chat: mensagens de captura compactas (máximo 2 linhas), IV no local correto, sexo por último, rolagem até a parte inferior, reações mantidas.
6. Comparar `SOURCE_COMMIT`, SHA-256 do APK, assinatura SHA-1/SHA-256, versionCode 54339 e versionName 0.01.34 antes da instalação.
