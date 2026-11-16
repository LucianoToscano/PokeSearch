# PokeSearch FastDev — desenvolvimento sem publicar APK a cada ajuste

> **Nova implementação (16/11/2026):** assinatura permanente, atualização OTA dedicada, código crescente, sandbox Live HTML e ADB: [FASTDEV_OTA_LIVE_ADB_20261116.md](FASTDEV_OTA_LIVE_ADB_20261116.md). As instruções anteriores para APK com chave debug efêmera abaixo descrevem o estágio histórico inicial e não são o procedimento atual recomendado. O novo modo assinado só será operacional após cadastrar os secrets privados `fastdev-signing`.

Status: infraestrutura de desenvolvimento, SEM atualização pública do aplicativo. Nunca declarar CI ou homologação física PASS sem execução e evidência. O comando ARK do proprietário mantém as obrigações de merge, QA e publicação protegida, conforme AGENTS.md.

## Execução automática pelo assistente, sem cliques no Actions

Para solicitar um teste Preview do SHA atual de uma branch, o assistente altera somente fastdev/preview-request.json nessa branch: schema 1, modo apk-preview (ou visual/fast), e request_id novo a cada solicitação. O push dessa única solicitação aciona o workflow FastDev naquele commit, sem segredos de assinatura, sem GitHub Release e sem incrementar a versão pública. Este é o caminho recomendado quando o proprietário pede para gerar um Preview, sem depender do botão Run workflow. A branch pode ser de desenvolvimento ou main; conferir SOURCE_COMMIT.txt antes de usar. O mesmo arquivo pode ser alterado novamente para repetir o Preview. Não editar release/official-request.json para testes.

O arquivo de solicitação é validado por scripts/fastdev-request.cjs; mudanças inválidas falham. Este gatilho só age dentro do repositório, e não concede a forks acesso a secrets. A assinatura do Preview permanece a debug isolada, inapropriada para atualizar a instalação pública. Uma solicitação de Preview não constitui autorização de ARK oficial.

## Três modos independentes

1. **fast (padrão):** o workflow PokeSearch FastDev roda em PRs que alteram app/ ou a própria infraestrutura. Usa scripts/fastdev.cjs para mapear arquivos alterados a testes Node apropriados. Se não reconhece um arquivo, executa smoke conservador e sinaliza que os gates completos continuam necessários. NÃO gera APK, não faz merge, não assina.
2. **visual (manual):** em GitHub Actions > PokeSearch FastDev > Run workflow, escolher a branch e o modo visual. Reutiliza os testes visuais Playwright LT253 sobre o HTML REAL da tela de detalhes P/M/G. Faz upload de PNGs. Não substitui o Samsung nem cobre todas as telas, inclusive Home/overlay.
3. **apk-preview (manual):** na mesma ação escolher apk-preview. Gera app-preview.apk usando a variante Gradle preview, com applicationId com.lucianotoscano.pokesearch.preview, sufixo de versão -preview e assinatura padrão de debug, NUNCA a assinatura permanente de produção. O artifact contém APK, checksum SHA-256, relatório de assinatura e SOURCE_COMMIT. Não cria GitHub Release e não interfere no OTA. A versão oficial instalada pode coexistir. A chave de debug do runner pode mudar entre builds; pode ser necessário desinstalar um preview anterior, perdendo apenas os dados do preview. Login OAuth, permissões, atualização e recursos integrados com o ID/certificado oficial devem ser validados no APK oficial, não no preview.

**Primeiro uso:** após mesclar a infraestrutura na branch main, abrir a aba Actions, selecionar PokeSearch FastDev, clicar Run workflow, escolher modo e branch. A opção workflow_dispatch pode não aparecer antes de existir na branch padrão. Não baixar APK de uma PR não confiável; o preview usa apenas código que o mantenedor revisou.

## Build rápido e segurança

- gradle.properties habilita org.gradle.caching=true. O setup-gradle já gerencia cache; ganhos dependem de tarefas cacheáveis e acerto do cache. NÃO ativar configuration cache sem inspeção, pois o build possui scripts/tarefas próprias e material de assinatura no fluxo protegido.
- Variant preview é separado da debug existente e da release R8 existente. Nenhum versionCode público, release/official-request.json, GitHub Secrets, keystore, Firebase ou assinatura oficial foi alterado.
- Nunca usar apk-preview como OTA ou encaminhar aos usuários finais; debug pode ter código não minificado. Não inferir que build Preview aprovado comprova funcionamento Android físico.
- A versão oficial continua restrita ao workflow protegido .github/workflows/pokesearch-official-release.yml com environment official-updates, validação de certificado permanente, pacote, versionCode, R8, SHA-256, release pública e checagem pelo SHA exato.
- Antes de fazer ARK, aguardar o conjunto de checks completos exigidos na PR. Um smoke FastDev PASS NÃO substitui nenhuma suíte Node, Java, OTA, Android, segurança ou QA físico.
- Evitar múltiplos APKs para mudanças pequenas de CSS/HTML: primeiro executar testes direcionados, opcionalmente screenshots, agrupar alterações, só então gerar um preview e concluir o ARK quando pedido.

## Medição e consolidação progressiva

- Registrar os tempos da execução GitHub Actions por job/step, especialmente setup Android SDK, Gradle, assets, R8, SHA/verificação e publicação, comparando runs anteriores e posteriores no MESMO tipo de job/runner/commit comparável.
- Inspecionar taxa de cache-hit, número de testes e tempo total antes de declarar ganhos percentuais.
- Há workflows históricos por LT; NÃO apagar ou consolidar em massa: inventariar triggers, proteção de release, testes, secrets, artefatos, PRs abertas e dependências antes de substituir qualquer workflow. A PR #349 possui sobreposição na proposta de Gradle cache e deve ser revisada antes de integração simultânea.
- O Guia Mestre continua sendo o histórico imutável por append. O resumo prático de cada trabalho deve apontar SHA, PR, versão oficial comprovada, testes e pendências sem reabrir o histórico inteiro. Não editar Guia Mestre via fetch truncado.
- Manter QA físico Samsung/Android 11–14, OAuth, P1/P2, PGSharp/Pokemod e efeitos nativos como pendência até validação real.

## Comandos locais

Para simular o seletor: node --test scripts/fastdev.test.cjs
Para executar smoke de mudanças na branch: node scripts/fastdev.cjs --base origin/main
Para revisar sem executar: node scripts/fastdev.cjs --files app/src/main/assets/dock.html --dry-run
Para compilação local isolada com Android SDK: gradle --build-cache :app:assemblePreview

## Rollback

Reverter apenas os arquivos FastDev, o novo build type preview e a propriedade org.gradle.caching caso apareça regressão. Nenhuma release oficial existente é modificada por este fluxo.
