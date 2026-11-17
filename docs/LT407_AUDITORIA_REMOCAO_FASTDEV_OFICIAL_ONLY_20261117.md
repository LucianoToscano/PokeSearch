# LT407 — Remoção de FastDev e unicidade do PokeSearch oficial (17/11/2026)

O proprietário ordenou a **exclusão de FastDev/DEV e vias paralelas**. O patch elimina da árvore atual os workflows, scripts, Android sourceSet, manifesto DEV, rota OTA, buildType `preview` e as exceções `FASTDEV_PREVIEW` em integridade, Home e atualizações. A identidade pública fica `com.lucianotoscano.pokesearch`; a publicação oficial continua condicionada ao workflow `pokesearch-official-release.yml`, à assinatura permanente e aos testes CI.

**Importante:** excluir código da branch não apaga retroativamente releases/tags, branches, históricos de Actions, segredos no painel GitHub, nem um aplicativo DEV que já esteja instalado em aparelho. A integração disponível não possui exclusão administrativa de releases, refs ou segredos; tratar esses itens como pendentes, jamais declarar remoção total. Referências históricas em auditorias antigas são documentação, não canais ativos.

Os gates de QA continuam necessários para a release oficial e não significam um segundo aplicativo público. Nova suíte `app/tests/official-only-distribution.test.js` impede a reintrodução de FastDev.

## Publicação e verificações finais LT407
- v0.03.92 LT / 54599 / label 51407, release https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.92-54599 e APK https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.92-54599/PokeSearch-v0.03.92-LT.apk, SHA-256 `937e2ded83797ae23df195d3435bea0b5400493652053c88ca015427e09acf06`, tamanho 61.749.810 bytes, workflow https://github.com/LucianoToscano/PokeSearch/actions/runs/44193252703 completed/success, certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` validado pelo workflow, sem homologação física.
- GitHub mostra 42+ releases históricas fastdev na listagem recente e 15 branches fastdev; exclusão administrativa ainda pendente, não afirmar remoção total.
- Workflow antigo LT146 de APK QA foi identificado executando durante push da release e deverá ser excluído da árvore atual sem atingir a release oficial.
