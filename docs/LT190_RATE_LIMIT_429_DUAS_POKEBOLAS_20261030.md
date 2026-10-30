# LT190 — HTTP 429 da API: proteção compartilhada entre Pokébolas (30/10/2026)

## Evidência / interpretação
- Na captura Android, a Home informa `PokeSearch v0.01.89 LT` e o toast `API: rate-limited`. Também informa `Treinador não confirmado` na Conta 2, situação independente que deve ser confirmada no PoGoCoordinates.
- A release pública vigente ao iniciar a correção era `v0.01.89-54394`. A captura **não** comprova ausência de publicação: mostra a versão oficial instalada.
- O transporte traduz HTTP 429 em `rate-limited`, respeita Retry-After e não reenvia imediatamente. Entretanto, o agendador nativo reiniciava o fluxo de pesquisa mesmo quando a sessão WebView estava limitada.

## Ajuste incremental
1. `api_browser_transport.js`: disponibiliza apenas duração de espera, limitada a 0–3600 segundos. Não retorna JWT, headers brutos nem dados privados.
2. `api_android_session.js`: propaga `retryAfterSeconds` sanitizado na resposta de busca que retorna 429, sem expor tokens ou códigos.
3. `OverlayService.java`: ambas Pokébolas compartilham uma janela conservadora de espera no processo/dispositivo por meio de `prefs.pogoApiSearchBackoffUntilMs`. Nenhuma nova pesquisa API sai pelo Java antes do prazo. Retomada automática escalonada em 3 segundos entre P1/P2; mantém os resultados anteriormente verificados e o estado dos filtros. Respeita no mínimo 60s quando o servidor não dá prazo, não apresenta esse valor como saldo ou limite oficial.
4. Nenhuma tentativa de contornar o rate-limit alternando contas, endpoints ou modo DOM durante 429; mantém o limite do servidor como autoridade.

## Regressões
- `app/tests/lt190-provider-429-backoff-dual.test.js`: simulação 429 com `Retry-After:120`, sem chamadas extras antes do prazo, duração sanitizada à sessão e verificação das proteções Android/P1/P2.
- Suítes históricas incluindo LT189, LT188, login, API/DOM, reprodução de áudio, notificações e OTA permanecem obrigatórias.
- Teste físico Samsung **NÃO EXECUTADO**: confirmar temporizador e HTTP real do PoGoCoordinates, Conta 2/treinador, duas Pokébolas, filtros e atualizador.
- Correção não garante desbloqueio do servidor, pois depende da política e da quota do serviço.

## Publicação
- Candidato `LT190 / 0.01.90 / 54395`; assinatura v2 permanente conforme workflow oficial.
- O GitHub Releases/latest é o canal de distribuição público; confirmar resultado, SHA e tamanho antes de declarar publicado.
- Google Drive: link legado de APK ainda corresponde a LT187; manter nota explícita até substituição real dos bytes no ID original. Nunca substituir um APK por ZIP nesse endereço.
