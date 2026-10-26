# PokeSearch LT118 — Correções, autorização e plano pendente

**Data:** 26/10/2026. **Documentos de origem:** Plano Mestre LT116, Auditoria Técnica Integral v2, Auditoria Integral e Plano de Correções LT116 (DOCX anexos do usuário).

## Autorização e alterações efetivas
- Autorização expressa do usuário para correções/melhorias, merge e APK; reversão da LT111: voltar a exibir a opção de ativar/desativar a segunda Pokébola na Home.
- A segunda Pokébola continua em `SecondaryOverlayService`, herdando a implementação da primeira com preferências/posições/resultados independentes (`prefs_secondary`). A lista de favoritos, sons e sessão são compartilhadas conforme desenho anterior.
- Revisão dos testes LT111 e LT112, e inclusão de regressões LT118.
- API: `requestedShiny` (filtro pedido) separado de `apiReturnedShiny` (evidência nos cards) e `apiFilterAccepted` (requisição HTTP válida). O pedido não é mais marcado como confirmação de spawn shiny.
- Transporte: status HTTP 401 limpa JWT no domínio oficial, 429 usa Retry-After numérico ou HTTP-date. Negativas de acesso e limitação nunca são contornadas com DOM.
- `response.cap` exposto como `serverCap` para diagnóstico, mantendo dez cards de interface por compatibilidade com o limite fixo PokeSearch.
- `networkSecurityConfig` nega cleartext.
- Preservadas as correções pré-existentes LT117 de deduplicação pós-notificação, fila de favoritos, controles de leitura Firebase e mural de somente leitura. Branch reconciliada sem apagar a linha da versão estável LT111.
- Build QA alvo: **0.01.18 / versionCode 54322**, assinado pelo certificado permanente após CI.

## Riscos que seguem abertos (NÃO chamar tudo de corrigido)
- **Firebase produção:** regras `stats` e `scrapbook` precisam implantação verificada; agregados demandam backend idempotente e migração/backfill. Sem isso números podem aparecer `—` e segurança real dependerá das regras atualmente publicadas.
- **Mural:** moderação do servidor, transações de rate-limit e processo de aprovação não implementados; modo de leitura é medida preventiva.
- **Recursos UX e segurança:** WebViews com allowlist completa; pin imutável para 2050 sprites; catálogo forms/costumes/shiny; limpeza de canais órfãos; bateria/Doze; FGS/targetSdk; refatoração; testes instrumentados; revisão sistemática de logs.
- **Samsung:** os 110 cenários exigem teste no aparelho físico, inclusive duas Pokébolas simultâneas, notificações, Get coords, sprites e carregamento API/DOM, atualização incremental sem perda de dados.
- **Distribuição:** merge autorizado, mas não promover APK QA a release oficial estável enquanto dependências críticas e QA física não estiverem resolvidas.

## Regra permanente
Toda correção que afete filtros, pesquisas, API/DOM, sprites, coords, temporizadores, notificações, menus, resultados e favoritos deve valer para P1 e P2. Preservar `applicationId`, assinatura v2, favoritos, áudio e `GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md`.
