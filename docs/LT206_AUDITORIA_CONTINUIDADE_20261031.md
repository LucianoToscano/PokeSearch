# LT206 — Auditoria incremental do prompt LT190 (31/10/2026)

Base atual: LT205 / 0.02.05 / 54412. LT190/LT191 são históricos: o teto de Retry-After 24h já havia sido aplicado em transporte, sessão e OverlayService.

## Correções de código
- detail.html: a interface ainda ocultava o tempo de espera de coordenadas acima de 3600s. A nova condição aceita 86400s e mostra horas/minutos/segundos.
- rare_candy_probe.js: a espera HTTP 429 agora interpreta Retry-After em segundos ou data HTTP. Antes datas válidas eram reduzidas ao fallback de 60s. Não muda os limites do provedor nem faz novas consultas.
- app/tests/lt206-retry-after-details.test.js: regressão integrada à suíte Node.
- AGENTS.md e LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md: referência canônica atualizada sem alterar arquivos históricos.

## Diagnóstico adicional e planejamento
Há 227 workflows em .github/workflows (36 com official-release no nome). Nenhum foi apagado: uma remoção em massa pode interromper signing/OTA/QA. dock.html é monolítico e será modularizado apenas em etapas menores, após testes de equivalência WebView/P1/P2 e rollback.

## Checklist Samsung pendente
P1 100% e P2 0%; login e visitante; 429 simulado Retry-After 7200/86400s sem reconsultar; Doce Raro com data HTTP; falhas 401/403/422 e timeout; filtros, instalação sobre LT205 sem limpar dados. Testes automatizados e CI não comprovam autenticação ou instalação real.

## Diferença central
detail.html: retrySeconds<=3600 -> retrySeconds<=86400.
rare_candy_probe.js: Number(Retry-After) -> segundos ou Date.parse com limite de 24h.
