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
