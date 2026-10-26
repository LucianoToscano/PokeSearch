# PokeSearch LT117 — Aplicação do plano de correções enviado (26/10/2026)

**Origem:** `PokeSearch-LT116-Plano-Correcoes.docx` (P1-01 a P1-04; P2-01 a P2-10).
**Base:** PR #73 Draft, fonte LT116 QA 0.01.16/54320. Main oficial 0.01.11/54315 preservada.
**Nova QA candidata:** 0.01.17, versionCode 54321, sem publicação oficial.

## Fase A — Código alterado
- **P1-01 (alertas gerais):** `OverlayService` registra `successfullyNotifiedGeneralSpawns` separadamente do histórico de descoberta; só deduplica após `NotificationManager.notify` retornar; valida TTL e preserva preferências/cooldown. P1 e P2 herdam o mesmo método com estado individual. Entrega real no Samsung permanece pendente.
- **P1-04 (favoritos):** fila por encontro e espécie, cinco grupos por lote e intervalo de 12s, TTL, retries 60s para bloqueios temporários, desativação do usuário limpa fila. Não perde os itens 6–10 por um corte no loop.
- **P1-02 (privacidade):** cliente `FirebaseStats` passou a ler agregados em `stats/public` e não listas de UIDs. Regras versionadas restringem instalação/presença a leitura pelo próprio UID. Triggers candidatos em `functions/` são apenas código: precisam de idempotência, validação do projeto, migração e DEPLOY EXPRESSAMENTE AUTORIZADO. A Home mostra `—` até existir agregado.
- **P1-03 (mural):** modo de leitura no cliente, sem submissão habilitada por config remota. Regras versionadas negam postagem/resposta direta. Curtidas/leitura existentes mantidas. Regras de produção NÃO foram alteradas; moderação/aprovação backend ainda pendentes.

## P2
- **P2-01:** comentário enganoso sobre default API corrigido.
- **P2-03:** acesso em árvore inteira do Firebase removido no cliente.
- **P2-02:** pin de sprites e lock de 2.050 SHA-256 permanece como revisão complementar; build atual usa hashes manifestados no artefato. NÃO afirmar reprodutibilidade imutável sem lock versionado.
- **P2-04,05,06,07,08,09:** limpeza de workflows, teste LT74, targetSdk, URL allowlists, sprites especiais e prova Shiny exigem implementação/auditoria isolada para evitar regressões, sem mudanças arriscadas nesta fase.
- **P2-10:** execução dos 110 cenários no Samsung continua pendente.

## Limites, verificações e governança
- Regressões de ambas as Pokébolas, Get coords, sons, sprites, API e DOM devem rodar no CI de QA. Teste LT74, que exige debug antigo, permanece documentadamente excluído.
- **Nenhum deploy Firebase, nenhum merge, nenhum release oficial** antes de regras testadas/implantadas com autorização, e validação física Samsung P1 100% / P2 0%.
- Versão oficial, perfis de favoritos, áudio, ids de pacote, assinatura, backups, persistência e Guia Mestre original preservados.
- **Decisão: NO-GO** até concluir pendências de servidor e Samsung.
