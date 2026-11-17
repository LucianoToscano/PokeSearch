# LT407 — Remoção de FastDev e unicidade do PokeSearch oficial (17/11/2026)

O proprietário ordenou a **exclusão de FastDev/DEV e vias paralelas**. O patch elimina da árvore atual os workflows, scripts, Android sourceSet, manifesto DEV, rota OTA, buildType `preview` e as exceções `FASTDEV_PREVIEW` em integridade, Home e atualizações. A identidade pública fica `com.lucianotoscano.pokesearch`; a publicação oficial continua condicionada ao workflow `pokesearch-official-release.yml`, à assinatura permanente e aos testes CI.

**Importante:** excluir código da branch não apaga retroativamente releases/tags, branches, históricos de Actions, segredos no painel GitHub, nem um aplicativo DEV que já esteja instalado em aparelho. A integração disponível não possui exclusão administrativa de releases, refs ou segredos; tratar esses itens como pendentes, jamais declarar remoção total. Referências históricas em auditorias antigas são documentação, não canais ativos.

Os gates de QA continuam necessários para a release oficial e não significam um segundo aplicativo público. Nova suíte `app/tests/official-only-distribution.test.js` impede a reintrodução de FastDev.
