# LT170 — Duas contas reais PoGoCoordinates, por Pokébola
Base: LT169 oficial 0.01.69/54374. Branch QA: `feature/lt170-dual-pogo-session-slots-20261029`.

## Implementação
- WebKit AndroidX 1.17.1 com `MULTI_PROFILE`; slot1 usa perfil Default anterior (sem sair da conta), slot2 `pokesearch_pogo_slot2` com cookies/WebStorage independentes.
- Home: cartão Conta 2 com Google, Discord, Gerenciar, Sair, além dos controles de conta e treinador independentes em P1/P2. Conta 1 conserva seu cartão original; login/logout da Conta 2 não limpa Conta 1.
- Captura de prova de login, perfil e treinador somente em `/profile` oficial autenticado na WebView do slot correspondente. Metadados da Conta 2 em `pogo_account_slot2` (nenhum token exportado), Conta 1 permanece em `prefs`. Treinador por Pokébola se limita a códigos verificados no perfil da conta selecionada.
- `OverlayService` cria seu WebView já vinculado ao perfil da conta escolhida **antes** de qualquer uso de WebView. API, DOM, Shiny e coordenadas usam sempre a mesma WebView. Filtros e preferências seguem independentes em `prefs`/ `prefs_secondary`.
- Alteração de conta reinicia somente o overlay escolhido, invalidando seus requests anteriores. Logout limpa somente perfil e armazenamento do slot selecionado; o outro login permanece.
- Se WebView do celular não suportar MULTI_PROFILE, Conta 2 não é usada nem associada automaticamente ao login da Conta 1. As contas não são combinadas ou copiadas para contornar limites do provedor.
- Mesma conta pode ser usada nas duas Pokébolas, sem duplicar sessão nem limites; conta separada por Pokébola usa sua autorização real. O botão Shiny requer prova de treinador vinculada àquela conta.

## QA
- Estático: `app/tests/lt170-dual-pogo-sessions.test.js`.
- Regressão completa Node e compilação Java no CI após PR.
- Teste físico obrigatório no Samsung: login Google Conta 1, segundo Google/Discord Conta 2, per-user OAuth; P1=1/P2=2 e vice-versa; P1=P2=1 e P1=P2=2; treinador associado por Pokébola; logout de Conta 1 não afeta 2; perfil ausente/Premium; Shiny verdadeiro por sessão; troca de conta durante request; segunda conta indisponível em WebView antigo.
- Não afirmar homologação física apenas por compilação. Assinar APK QA com certificado permanente, sem atualizar release pública até sucesso verificado.

## APK QA assinado gerado — 29/10/2026

- **Build SOURCE_COMMIT**: `91a700c55250ef51e210d30830c55f06c297ba0b` (o registro de documentação posteriormente atualizado não muda esse APK).
- **Versão de teste**: 0.01.70, `versionCode 54375`. Nome: `PokeSearch-v0.01.70-LT170-DuasContas-QA.apk`.
- **Pré-release pública QA, NÃO latest**: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.70-54375-qa-dual-accounts
- **Download APK direto**: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.70-54375-qa-dual-accounts/PokeSearch-v0.01.70-LT170-DuasContas-QA.apk
- **49.510.219 bytes**, SHA-256 `896f56998973501f3093478107a2091aec478fe618be1497ba150168a8613612`. Hash declarado pelo asset no GitHub Release.
- **Assinatura Android v2 permanente** conferida por GitHub Actions, certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; mesmo `applicationId com.lucianotoscano.pokesearch` e build com R8 ativo.
- **Compilação assinada e pacote auditado**: https://github.com/LucianoToscano/PokeSearch/actions/runs/40895056237 — SUCCESS.
- **Verificação SHA/cert e publicação somente pré-release**: https://github.com/LucianoToscano/PokeSearch/actions/runs/40895413483 — SUCCESS.
- Teste da suíte completa Node: https://github.com/LucianoToscano/PokeSearch/actions/runs/40895066129 — SUCCESS; compile Java: https://github.com/LucianoToscano/PokeSearch/actions/runs/40895065949 — SUCCESS.
- **A versão estável latest continua LT169** `v0.01.69-54374`; nenhum update público foi alterado. PR #125 permanece draft até QA físico no Samsung com dois logins reais e ambos overlays.
