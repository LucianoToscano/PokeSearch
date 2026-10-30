# LT191 — Auditoria e correções do Retry-After até 24 horas (30/10/2026)

**Base efetivamente verificada:** LT190 `v0.01.90-54395`, SOURCE_COMMIT `f03ee07703c88e47b808a9278e1b6a4e1d38af30`. A publicação da LT191 só deve ser declarada se a release `v0.01.91-54396` for confirmada após QA.

## Matriz de correções
| Prioridade | Arquivo | Defeito e ajuste |
| --- | --- | --- |
| Alto | `app/src/main/assets/api_browser_transport.js` | `Retry-After=7200` era tratado como 60 s porque o parser aceitava apenas 1–3600 s. Corrigido para 1–86400 s; datas HTTP e valores maiores são limitados a 24 h. Sem retry durante o bloqueio. |
| Alto | `app/src/main/assets/api_android_session.js` | Propagação rejeitava durações acima de 3600 s; agora aceita até 86400 s. |
| Alto | `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java` | Backoff nativo ignorava prazos superiores a 1h. Compartilhamento P1/P2 agora aceita 24h; status mostra espera aproximada em horas/minutos. |
| Médio | `app/src/main/assets/rare_candy_probe.js`, `RareCandyOverlayService.java` | O mesmo limite de 3600 s estava no Doce Raro; passou a aceitar até 24 h. |
| Médio | `app/src/main/assets/probe.js`, `OverlayService.java` | Indicação de espera de coordenadas reconhece até 24h se o site informar; contador visual permanece oculto. |
| Médio | `OverlayService.java` | Mensagens de HTTP 400/422, 401, 403 e timeout diferenciadas sem exibir resposta crua ou tokens. |

## Regressões e comportamento esperado
- `app/tests/lt191-provider-backoff-24h.test.js`: simulações sem servidor de `Retry-After` 7200, 86400, 99999, data RFC 7231 e inválido; sem consultas adicionais durante a espera; devolução de `retryAfterSeconds` para camada Android e guardas P1/P2.
- Preservar regressões LT190/189/188, CI Android e contrato API. Não tratar testes de rede simulada como aceitação efetiva do PoGoCoordinates.
- Segurança: não modificar JWT, bypass de limite do provedor, políticas de sessão, identidade do aplicativo, signing key, limite de 10 resultados ou prefs independentes. O bloqueio P1/P2 continua somente para a busca e não pode impedir o usuário de abrir menus.
- Após expiração da espera, o servidor pode retornar novo 429. O app NÃO promete liberar acesso por conta própria.

## Melhorias de médio prazo — ações controladas
- `dock.html` é monolítico. Extrair módulos somente com equivalência de comportamento, testes de DOM/WebView e QA Samsung; não refatorar indiscriminadamente antes de teste físico.
- `.github/workflows/` contém workflows históricos. Antes de arquivar, auditar gatilhos, segredos, jobs ativos, dependências, histórico e release/OTA/Firebase; remover em etapas com `git mv`, não por exclusão em massa. Preferir matriz/documento de migração.
- `README.md` e `AGENTS.md` devem usar a versão pública realmente verificada. Prompts LT188/LT189 históricos são mantidos para rastreabilidade, e um novo documento LT191 orienta outras IAs.
- Link legado do Drive ainda não tem substituição de bytes brutos confirmada. Se nova publicação for feita, não afirmar que esse link entrega LT191 sem releitura pelo conector.

## Checklist de QA físico Samsung (NÃO EXECUTADO)
1. Instalar APK final assinado sobre LT190, sem limpar dados; testar Home, Conta 1/2 e seleção de treinador VIP.
2. Abrir simultaneamente P1 100% e P2 0% com API ON; verificar resultados e evitar requisições duplicadas.
3. Simular HTTP 429 com `Retry-After=7200` em ambiente de teste autorizado e conferir duração de 2 horas; não provocar 429 repetidamente na API real.
4. Conferir manual ↻, refresh automático, login, modo DOM, IV 0/13/13, IV%, GL/UL, PC/Nível/PC PvP, Get Coords e Doce Raro.
5. Validar notificações, alertas, sprites, chat, sons, bateria e ciclo de vida em Samsung OneUI.
6. Testar timeout, rede indisponível, HTTP 401/403/400/422 e retorno ao funcionamento sem expor segredos.

**Status:** código corrigido e teste escrito; resultados CI, merge, assinatura, Release e Drive devem ser documentados conforme efetivamente ocorrerem. Não existe homologação física atestada.
