# CI/Gradle — aceleração conservadora, sem remover trabalhos pendentes (14/11/2026)

## Objetivo
Reduzir trabalho repetido no GitHub Actions sem mexer no aplicativo, APKs, assinatura, versões, OTA, Firebase ou no canal oficial.

## Diagnóstico verificado
- Em `main`, `gradle.properties` não habilitava o cache de outputs do Gradle; `gradle/actions/setup-gradle@v4` já era usado para cache do Gradle User Home.
- O workflow `pokesearch-android-compile-qa.yml` agrupava a concorrência pelo SHA do commit, de modo que novos commits na mesma PR recebiam grupos diferentes e não cancelavam o trabalho anterior.
- Foram observados 263 YAMLs em `.github/workflows/` e 72 PRs abertas na consulta da auditoria. **Nenhum deve ser removido automaticamente**: há branches em QA, drafts empilhados e integrações ainda não publicadas.
- Exemplos de PRs abertas em andamento: #348 (PGS Buscas Auto, empilhada em #347), #347 (Home LT337), #303 (Edu LT304), #163/#164 (PGSharp experimental), #85 (Premium Pix).
- O fluxo oficial permanente `pokesearch-official-release.yml` contém assinatura protegida, geração de sprites, regressões, validação de hashes e distribuição. **Não alterar nem encurtar estes gates por ganho de velocidade sem auditoria separada.**

## Modificações propostas
1. `gradle.properties`: `org.gradle.caching=true`. O cache permite reutilizar **apenas tarefas consideradas cacheáveis** pelo Gradle. Não habilitar automaticamente `org.gradle.configuration-cache`, devido à configuração de assinatura que consulta variáveis de ambiente e credenciais.
2. `pokesearch-android-compile-qa.yml`: usar o **número da PR** para `concurrency` (em vez do SHA), com `cancel-in-progress: true` somente neste workflow de compilação sem APK. Mantém o SHA exato no checkout e evita cancelar workflows de release.
3. O QA Android passa a ser disparado quando mudarem `gradle.properties`, `settings.gradle.kts`, `build.gradle.kts` ou recursos em `app/src/main/res/`, que podem afetar o build.

## Preservações e riscos
- Nenhum workflow histórico, branch, PR, teste, asset, documento ou código de produção removido.
- Nenhum arquivo de assinatura, segredo, versão, certificado, `applicationId`, `versionCode`, `release/official-request.json` ou workflow de publicação alterado.
- Não habilitar `--offline`, `--continue`, `--configuration-cache` ou ignorar falhas de QA por desempenho.
- `org.gradle.caching=true` não garante aceleração uniforme; ganhos dependem de cache hit, dos inputs e do custo de geração de assets. A primeira execução pode continuar fria.
- **Pendente**: comparar tempos/caches de jobs no GitHub Actions após a PR ser integrada e validar build Android/assinatura antes de uma nova distribuição oficial. Esta PR não gera ou publica APK.
- **Não excluir por engano**: PRs abertas históricas podem conter mudanças que nunca entraram na `main`, mesmo quando a versão da etapa seja antiga. Revisar cada caso e dependências de branches antes de qualquer limpeza futura.

## Reversão simples
Em caso de incompatibilidade, retirar `org.gradle.caching=true` de `gradle.properties` e/ou restaurar a chave `concurrency` anterior no workflow de QA. O canal oficial não é alterado por esta etapa.
