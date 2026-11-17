# LT382 — FastDev com ciclo rápido de desenvolvimento (16/11/2026)

## Resultado confirmado

- PR [#473](https://github.com/LucianoToscano/PokeSearch/pull/473) **MERGED** na `main`; merge squash `043b95401f5eb3ddc24497825e9f5bb0d80f5b8f`.
- SHA exato verificado na PR: `74c7d56bb4ff5c10328dec82485815a7b38916b1`.
- A release oficial continua em `0.03.73 / 54580`; **nenhuma release oficial foi gerada** nesta otimização. `release/official-request.json`, pacote e certificado oficiais não foram alterados.
- Nenhum APK FastDev Preview foi solicitado pela LT382: o objetivo foi otimizar o ciclo de desenvolvimento e não modificar a versão do app no celular. A última pré-release visível à auditoria foi `fastdev-1000035` (publicada antes da LT382).
- A assinatura FastDev permanente existente e seu environment `fastdev-signing` foram preservados.

## O que mudou

1. `.github/workflows/pokesearch-fastdev-branch.yml`: pushes de código na `fastdev/**` agora disparam smoke incremental com Node, sem SDK Android, Gradle, assinatura ou APK. Um commit mais recente cancela o run anterior da mesma branch.
2. `.github/workflows/pokesearch-fastdev.yml`: solicitação de APK Preview assinada via alteração do arquivo `fastdev/preview-request.json` passou a aceitar **somente push na main**, sem compilação de APK a partir de branch comum ou PR.
3. Adicionado modo `java-check`: compilação Android Java sob demanda, sem empacotar APK, para verificar fontes nativas antes de PR quando necessário. Continua separado da assinatura.
4. `.github/workflows/secure-release.yml`: cancela a compilação beta/R8 ultrapassada quando uma PR recebe novo commit; mantém compilação beta obrigatória na integração.
5. `scripts/fastdev.cjs`: seleção de testes de perfil/login e Android mais precisa, sem substituir a suíte integral de QA no PR. Testes `fastdev-branch-contract.test.cjs` e atualizações dos contratos existentes cobrem novos gatilhos e gates.
6. `docs/FASTDEV_GUIA.md`: fluxo canônico: **branch FastDev → testes rápidos sem PR → Java opcional → PR final/QA completo → merge → Preview somente por solicitação explícita na main**.

## Evidências de CI

- [FastDev branch #43997266004](https://github.com/LucianoToscano/PokeSearch/actions/runs/43997266004) **SUCCESS**: cerca de **9 s** de execução do job e **2,44 s** de testes selecionados, conforme timestamps/log `FASTDEV_SECONDS`.
- Comparação anterior LT381: smoke ~22 s, teste selecionado ~3,29 s; beta/R8 de QA ~153 s. **Não há benchmark controlado**; não prometer ganho fixo ou redução de tempo no build de APK.
- [FastDev da PR #43997469970](https://github.com/LucianoToscano/PokeSearch/actions/runs/43997469970): SUCCESS.
- [Regressão Node LT169 #43997469897](https://github.com/LucianoToscano/PokeSearch/actions/runs/43997469897): SUCCESS.
- [Secure beta/R8 QA #43997469915](https://github.com/LucianoToscano/PokeSearch/actions/runs/43997469915): SUCCESS.
- `Build PokeSearch Android APK` do PR foi corretamente ignorado por não ser uma publicação oficial.
- Runs iniciais da nova branch marcados `cancelled` decorrem do cancelamento intencional após novos pushes; erros iniciais foram corrigidos antes do commit final.

## Limitações e regras

- O desenvolvimento pode parecer ainda demorado se for aberta PR cedo: os checks completos são deliberadamente executados na PR. **Não abrir PR antes de terminar o lote de correções**.
- Alterações Java continuam exigindo compilação Android antes da integração; a seleção Node não a substitui. O modo opcional `java-check` foi validado por contrato e YAML, mas **não foi executado nesta LT382**, que não altera código Java.
- O modo Preview continua utilizando `com.lucianotoscano.pokesearch.preview`, o mesmo certificado FastDev permanente, código crescente, verificação de SHA-256/assinatura e confirmação Android na instalação.
- A homologação física do aplicativo, OAuth Google/Discord, PGSharp/Pokemod e atualização Android permanece independente.
- O comando ARK continua sujeito à política oficial de merge/publicação protegida; esta entrega **não é um ARK oficial**.
