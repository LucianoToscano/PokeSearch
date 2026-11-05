# PokeSearch — Manual operacional de continuidade para outra conta ou IA

**Atualização operacional 05/11/2026:** usar o [fluxo permanente de publicação pelo assistente](PUBLICACAO_OFICIAL_PERMANENTE.md), integrado na PR #211. Para próximas versões autorizadas, editar `release/official-request.json`; não é mais necessário criar/enviar um YAML por LT nem solicitar que o usuário dispare o build. As referências a workflows por versão abaixo são históricas. Todas as exigências de QA, assinatura permanente, ambiente protegido, autorização do pedido, verificação e registro continuam válidas. A confirmação de instalação exigida pelo Android permanece.

**Revisão inicial:** 02/11/2026. **Idioma:** português brasileiro.
**Proprietário do projeto:** conta GitHub LucianoToscano; repositório público: https://github.com/LucianoToscano/PokeSearch.
**Objetivo:** permitir que outra IA ou pessoa autorizada verifique a situação REAL, continue o código, faça QA, solicite/aplique merge, gere e assine APK, publique atualização pelo canal oficial, espelhe no Drive e atualize o Guia Mestre, sem inventar nada e sem acessar segredos no chat.

## 0. Regras de verdade e de autorização

1. **Nunca começar do zero, restaurar ZIP antigo sobre a main ou presumir a versão a partir da conversa.** Consultar em tempo real as APIs e o código GitHub. O arquivo mestre é orientação, não substitui a evidência GitHub.
2. **Nunca publicar, mesclar PR, alterar o canal público, modificar Drive, mudar assinatura ou ativar/desativar versão sem autorização explícita do proprietário para essa operação.** QA e análise podem ser realizados sem publicação. O proprietário pode autorizar várias dessas operações numa mesma solicitação.
3. **Nunca afirmar compilação, assinatura, merge, release, envio Drive ou instalação sem resultado verificável da respectiva operação.** Um CI de Node verde não equivale a APK testado em Samsung; um APK no Release não significa que usuários instalaram.
4. **Segurança:** não pedir, imprimir ou copiar para a conversa keystore privada, passwords, tokens, JWT, cookies, OAuth secrets ou arquivos .env. A IA usa somente permissões autorizadas do GitHub/Drive e secrets protegidos dos runners. Se a nova conta não tiver acesso, solicitar ao proprietário que conceda as permissões pelo próprio provedor.
5. **Não inventar IDs, tags, commits, hashes, URLs do Drive, resultados de testes ou caminhos sandbox.** Cada valor operacional deve ser lido do GitHub, Google Drive ou artefato construído.
6. **Não misturar PokeSearch e PvPPokeGo ou qualquer outro repositório.** Não modificar PoGoCoordinates nem contornar seus limites sem autorização e contrato técnico.
7. **VersionCode monotônico:** qualquer APK destinado a atualizar uma instalação anterior precisa ter versionCode superior ao maior code já distribuído, inclusive QA instalado. Uma versão de QA com code maior não deve ser substituída por release com code menor. Tags oficiais são imutáveis.
8. O backend e os serviços terceiros podem mudar. Se a execução depender de credenciais ou aparelho Samsung, registrar PENDENTE, sem simular sucesso.

## 1. Estado inicial verificado (referência temporal, NÃO perpetuar como atual)

- Em 02/11/2026, o endpoint releases/latest retornava **LT227 / 0.02.27 / versionCode 54434**, tag v0.02.27-54434, release estável com draft=false e prerelease=false.
- APK: PokeSearch-v0.02.27-LT.apk, 28.080.679 bytes, SHA-256 1b6733a3caa43384a40510590c2340de9870172803878c62f13b3055983766b6.
- Certificado permanente de assinatura Android v2 (fingerprint público, NÃO é uma chave privada): 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e.
- Workflow oficial: https://github.com/LucianoToscano/PokeSearch/actions/runs/41433915635, SUCCESS.
- Commit exato da fonte usada para gerar o APK: 9ddefe74d7cdf9fb0c67f636385cdcdbbd5f403f. O HEAD posterior pode conter somente documentação ou novas correções: nunca confundir HEAD atual com SOURCE_COMMIT do APK anterior.
- Release oficial: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.27-54434.
- Pacote ZIP de APK e relatórios no Drive: https://drive.google.com/file/d/125GyTbrh7_-8kJSC4BZFxhIiopxz-Afg/view?usp=drivesdk (não é fonte editável).
- Versões LT215 e anteriores são históricas; LT226 (0.02.26/code54433) era QA e foi incorporada à LT227 pública. Conferir sempre se versões mais recentes apareceram depois desta data.

## 2. Primeiros passos ao trocar de conta ou de IA

A nova conta do ChatGPT NÃO herda automaticamente conexão com GitHub, Google Drive, estado de ferramentas, credenciais, histórico da conversa ou permissões. O proprietário precisa conectar/autorizar GitHub e Google Drive nessa conta ou disponibilizar checkout/ZIP atualizado. Não solicitar senhas, chaves ou tokens na conversa. Acesso público de leitura ao GitHub não equivale a permissão de escrever, mesclar ou publicar.

1. Abrir o repositório GitHub e confirmar o nome exato: LucianoToscano/PokeSearch, branch padrão main.
2. Ler, nessa ordem, AGENTS.md, esta página, docs/GUIA_MESTRE.md, LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md, README.md e documentos da versão atual.
3. Inspecionar as PRs abertas, branches, últimas Actions, último Release, último commit da main e versionCode dos APKs QA que o proprietário pode ter instalado.
4. Confirmar que há acesso de escrita à main/branches e autorização de merge; para publicação, verificar ambiente protegido official-updates, permissão de Actions e a existência dos secrets exigidos SEM ler seus valores.
5. Confirmar acesso à pasta Google Drive PokeSearch_App (ID 1fVw93qUDE0YWp6tlJZaNjRmymyhEAUbR) e permissão de upload. Uma IA sem conexão ao Drive NÃO pode afirmar upload.
6. Quando não houver acesso de escrita, produzir patch/PR em fork autorizado, relatório e instruções objetivas. Não inventar que a alteração foi aplicada.
7. Se houver apenas ZIP: verificar SOURCE_COMMIT e checksum/manifesto; o ZIP pode ser mais antigo que main. Para editar, preferir o checkout da main atual em vez de sobrescrever código novo.

Consultas iniciais, via GitHub REST ou ferramentas conectadas equivalentes:

    GET https://api.github.com/repos/LucianoToscano/PokeSearch
    GET https://api.github.com/repos/LucianoToscano/PokeSearch/commits/main
    GET https://api.github.com/repos/LucianoToscano/PokeSearch/releases/latest
    GET https://api.github.com/repos/LucianoToscano/PokeSearch/releases?per_page=10
    GET https://api.github.com/repos/LucianoToscano/PokeSearch/actions/runs?per_page=15
    GET https://api.github.com/repos/LucianoToscano/PokeSearch/pulls?state=open

Não usar exclusivamente releases/latest para inferir o conteúdo da main: elas são linhas temporais diferentes.

## 3. Identidade, ferramentas e componentes

- Android applicationId: com.lucianotoscano.pokesearch; namespace: com.lucianotoscano.pokesearchoverlay.
- JDK 17, Gradle 8.11.1, Android compileSdk 36, targetSdk 33, minSdk 26; Android SDK platform 36 e build-tools 36.0.0 no CI.
- Node 22 para testes JavaScript, Python 3 para builders/QA/manifestos.
- app/build.gradle.kts é o contrato real de versões, chaves de environment e assinatura. settings.gradle.kts inclui o módulo app.
- Código principal: app/src/main/java/com/lucianotoscano/pokesearchoverlay. UI/transportes: app/src/main/assets (dock.html, detail.html, probe.js, scripts de sprite e editor visual). Recursos: app/src/main/res, assets de imagens/sons.
- Resultados Pokémon: OverlayService e SecondaryOverlayService; prefs e prefs_secondary isoladas; conta 1 e 2 usam WebView profiles isolados conforme PogoAccountSlots.java. Doce Raro é subsistema separado. Não combinar cookies nem enviar JWT ao Android.
- Login PoGoCoordinates é opcional; busca normal não exige treinador. Shiny permanece pausado enquanto upstream indisponível, sem apagar integração. Respeitar HTTP 429/Retry-After até 24h e limites reais da API.
- Manter no máximo 10 resultados da aplicação, filtros GL/UL/IV, localização, favoritos, notificações, alerta, Editor Visual e acesso aos modos P/M/G.
- Fonte de verdade das atualizações APK: GitHubUpdateCenter.java; recuperação dos arquivos no HTTPS api.github.com/releases/latest; só Release estável com tag no formato esperado, versão superior, asset nomeado, tamanho e digest SHA-256. O app confere o APK baixado e certificado Android antes de abrir o instalador. WorkManager verifica periodicamente (configuração corrente 30 min) e a Home permite busca manual.
- Existência de scripts em ota/ não significa que uma nova atualização de APK seja um patch OTA. O **canal padrão atual é release de APK completo**. scripts/build_ota_pack.py e scripts/test_ota_builder.py tratam de atualizações assinadas de assets com escopo e assinatura próprios; nunca usar para entregar mudanças Java sem APK.

## 4. Procedimento para qualquer correção (sem publicação)

1. Reproduzir o problema com evidências (foto Samsung, log sanitizado, teste, contrato da API). Documentar o que é confirmado, hipótese e o que não foi testado.
2. Ler a função real e todos os chamadores; procurar regressões anteriores no Guia Mestre e nos testes.
3. Criar branch de QA a partir do HEAD mais recente, com nome descritivo. Não editar diretamente a versão antiga ou reutilizar branch que divergiu.
4. Aplicar correções mínimas; preservar P1/P2, UI atual, preferências, autenticação, URLs e assinatura. Corrigir apenas a causa.
5. Criar teste específico que falhe antes e passe após a correção quando possível; confirmar sintaxe e contratos. Atualizar testes antigos que expressem comportamento legitimamente substituído, registrando por quê.
6. Acrescentar documento de QA da etapa, com mudanças, evidências, riscos, compatibilidade e roteiro Samsung.
7. Abrir PR com base main, branch, propósito, arquivos, resultados de testes e limitações. Não confundir PR criada com merge.
8. Rodar Actions para o SHA da PR. Não aceitar SUCCESS de outro SHA ou apenas de uma execução de documentação.
9. Apenas após QA e autorização: merge para main; registrar SHA do merge, URL da PR e conferir que o HEAD contém o commit.
10. Reexecutar ou verificar gates da main quando necessário antes de distribuir. A PR não distribui APK.

Exemplo local (substituir BASE/BRANCH pelos valores reais):

    git clone https://github.com/LucianoToscano/PokeSearch.git
    cd PokeSearch
    git fetch --all --tags
    git checkout main
    git pull --ff-only origin main
    git switch -c fix/ltNNN-descricao
    git status --short
    git add <arquivos-exatos>
    git commit -m "fix(LTNNN): descricao objetiva"
    git push -u origin fix/ltNNN-descricao

A criação de PR/merge exige autenticação GitHub e permissão real; em conectores, usar endpoints/ações de PR e arquivos com SHAs exatos, não simular comandos que não foram executados.

## 5. Testes obrigatórios antes de um APK

CI de referência: .github/workflows/pokesearch-node-qa.yml (Node sem APK), workflows de QA Android por versão e, como exemplo comprovado, .github/workflows/lt226-signed-qa.yml. As verificações e dependências variam por etapa; ler sempre os YML atualizados.

Com Node 22:

    node --check app/src/main/assets/probe.js
    node app/tests/lt226-visible-sprite-alpha-fill.test.js
    node app/tests/lt227-frameless-results.test.js
    python3 scripts/test_ota_builder.py

Para varrer os testes JS (ajustar exceções à lista do workflow da versão):

    for t in app/tests/*.test.js; do
      [ "$t" = "app/tests/lt74-local-update-preview.test.js" ] && continue
      node "$t" || exit 1
    done

O workflow oficial LT227 também compila testDebugUnitTest, valida Java nativo, assets e APK. O Gradle local sem keystore pode gerar apenas debug não substituível. São necessárias as ferramentas Android apropriadas. Não afirmar teste de UI em Samsung quando só executou Node, JVM ou Gradle.

## 6. Gerar APK localmente e produzir APK público assinado

**Preferir o GitHub Actions assinado oficial**, porque as chaves permanentes estão protegidas lá. A IA nova não recebe a keystore e não precisa recebê-la.

Build local de desenvolvimento, a partir da raiz do repo e com JDK 17/SDK configurados:

    gradle --no-daemon :app:testDebugUnitTest :app:assembleDebug

O gradle do ambiente precisa ser 8.11.1. Se não houver comando global, usar o wrapper somente se ele existir no checkout; não inventar gradlew. APK de debug NÃO pode atualizar a instalação de produção assinada.

Para release, o workflow oficial define POKE_CONTROLLED_DISTRIBUTION=true, POKE_TEST_VERSION_CODE, POKE_TEST_VERSION_LABEL, POKE_TEST_PUBLIC_VERSION e POKE_RELEASE_CERT_SHA256. A keystore de assinatura é injetada de secrets do GitHub Actions no diretório temporário e removida ao final. Não expor base64, passwords ou alias.

Compilação oficial de referência:

    gradle --no-daemon :app:testDebugUnitTest :app:assembleRelease --stacktrace

Antes do build, o workflow executa:

    python3 app/scripts/build_pokemon_card_metadata.py
    python3 app/scripts/update_wwm_catalog.py app/src/main/assets
    python3 app/scripts/build_sprite_bundle.py --workers 12 --minimum-normal 950

Se a restauração dos sprites ou downloads de assets falharem, não prosseguir para release. Não usar APK gerado com conjunto incompleto sem identificar o impacto. Arquivo comum de saída do CI: app/build/outputs/apk/release/app-release.apk.

Critérios do build oficial: package original, versão exatamente aprovada, arquivo íntegro, R8 mapping gerado, debug desativado, assinatura v2 verificada, certificado pinado e SHA-256 salvo. Se o CI não concluir success, NÃO publicar.

## 7. Controle de versão e publicação de uma nova LT

Exemplo real de processo: .github/workflows/lt227-official-release.yml. **É histórico e de uso único para LT227; NÃO reexecutar para uma versão nova.** Esse YAML é disparado por push na main ao próprio caminho do workflow, tem environment official-updates, contents:write, impedimento de tag já existente, checagem de última versão pública anterior e validação SHA do APK remoto.

Para a próxima versão após LT227:
1. Ler releases/latest e conferir maior versionCode estável + maior code QA instalado pelos testadores. Escolher code **estritamente maior que ambos**; definir versionName LT correspondente; NÃO assumir que NNN ou soma +1 é sempre livre.
2. Confirmar que as correções e testes desejados foram integrados na main. Criar notas para a nova versão em app/src/main/assets/release_notes.json e documento QA específico. Não usar notes históricas ou códigos trocados.
3. Preparar NOVO workflow dedicado à nova versão, a partir do workflow oficial aprovado, e revisar CADA variável e precondição: name, paths e trigger, concurrency group, versionCode, version label, versionName, tag, APK filename, previous latest tag, release notes, tests, DOC, artefato QA, nome do p12 temporário e relatórios.
4. Verificar syntax YAML, todos os arquivos referenciados e o GitHub environment official-updates. Não imprimir secrets nem alterar o certificado original. O YAML não deve ser usado para inserir chaves no repositório.
5. Publicar o workflow novo **somente após autorização explícita**, sabendo que o push no caminho específico na main dispara automaticamente a publicação se as verificações passarem. Preparar PR e QA antes disso sempre que possível.
6. Monitorar a execução que corresponde ao SHA exato: requisitos → testes Node/OTA → SDK e assinatura → metadata/sprites → Gradle/R8 → aapt → apksigner → upload artifact → gh release create → verificação releases/latest/digest.
7. Confirmar que o workflow terminou **completed/success**, que releases/latest aponta para a tag nova, draft=false e prerelease=false e que existe asset APK com status uploaded, nome esperado, tamanho e digest SHA.
8. Registrar a URL REAL da release e do asset. Nunca construir uma URL fictícia nem declarar release antes do sucesso. A tag antiga deve permanecer disponível.
9. Não considerar uma execução QA privada ou falha de workflow legado como prova de publicação pública. Uma falha de um CI não necessariamente invalida uma release já aprovada: isolar o processo e documentar.
10. A publicação em Releases/latest é a distribuição via app. Não existe instalação silenciosa nos aparelhos.

Existe também .github/workflows/pokesearch-official-release-manual.yml, acionado por workflow_dispatch com entradas qa_run_id, qa_artifact_name, version_name e version_code, ambiente official-updates e restrição github.actor=LucianoToscano. **Não presumir que seu filtro de nome de artifact é compatível com qualquer QA novo**: o regex existente exige o sufixo -protected-release. Validar o workflow real e o artifact antes de usá-lo, e jamais burlar a exigência de autorização.

## 8. Conferência do APK, assinatura e download

Exemplos no Linux/CI Android SDK com build-tools 36.0.0:

    unzip -t app-release.apk
    sha256sum app-release.apk
    "$ANDROID_HOME/build-tools/36.0.0/aapt" dump badging app-release.apk
    "$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --verbose --print-certs app-release.apk

Verificar:
- package: com.lucianotoscano.pokesearch.
- versionCode e versionName previstos, superiores ao instalado.
- assinatura v2 true; certificado signer SHA-256 exatamente igual a 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e.
- arquivo não debuggable e integridade APK aprovada.
- SOURCE_COMMIT.txt com SHA 40 hex; SHA256SUMS.txt corresponde ao APK.
- asset publicado no Releases/latest possui mesmo size e digest que o APK usado no workflow.
- preservar PACKAGE-VERSION.txt, SIGNING-REPORT.txt, SOURCE_COMMIT.txt e SHA256SUMS.txt (sem senhas/chaves).

Se a assinatura não coincidir, a instalação de atualização é incompatível. Nunca recomendar desinstalar/limpar dados como remédio padrão: isso pode apagar preferências do usuário. Investigar permissão de instalar APKs desconhecidos, FileProvider, ACTION_INSTALL_PACKAGE, Samsung PackageInstaller e logs sanitizados. Consultar GitHubUpdateCenter.java e docs/PROTOCOLO_ENTREGA_APK_SEM_LIBRARY_NOT_FOUND.md.

## 9. Como funciona o atualizador dentro do aplicativo (OTA de APK completo)

A classe real GitHubUpdateCenter.java usa HTTPS para api.github.com/repos/LucianoToscano/PokeSearch/releases/latest. Aceita somente publicação estável, tag com formato previsto, asset correspondente ao nome oficial, tamanho razoável, digest sha256 e certificado pinado. Rejeita versões de code menor/igual à instalada. A Home pode verificar manualmente; WorkManager agenda verificações periódicas, mas a cadência é aproximada por economia de bateria/Android.

O aparelho baixa, confere hash e assinatura e encaminha à interface padrão do instalador Android. O usuário precisa autorizar a instalação; pode adiar/ignorar aviso ou estar offline. Logo, frases corretas são: **release publicada / disponível para o atualizador**. Não escrever "atualização instalada em todos", "enviada instantaneamente para todos" ou "homologada Samsung" sem prova.

Se a atualização não aparecer: verificar releases/latest, code instalado, notificações, ignore/later, conexão, cache da Home, formato da tag, digest, estado uploaded, versão do pacote e eventual bloqueio do instalador. Comparar com as regras da classe atual; não alterar a API para forçar release inválida.

ATENÇÃO: script scripts/build_ota_pack.py é canal separado de assets com manifesto e assinatura, limitado a arquivos permitidos, até 64 itens/8MB no código examinado. Não substitui release APK com alterações Java. Para full APK usar o fluxo GitHub Release.

## 10. Publicação no Google Drive (espelho, não canal OTA principal)

Pasta existente: PokeSearch_App, ID 1fVw93qUDE0YWp6tlJZaNjRmymyhEAUbR. O Drive é secundário para compartilhar APK, relatórios e fontes; o app consulta GitHub Releases/latest, não a pasta.

Após workflow SUCCESS:
1. Consultar os artifacts da execução oficial e selecionar o artifact pelo ID/nome exatos, de preferência *PokeSearch-LTNNN-Signed-Verified*. Confirmar que não expirou.
2. Baixar o ZIP de artifact via ferramentas GitHub; conferir ZIP e bytes, manifesto, SHA256SUMS, assinatura e SOURCE_COMMIT. O ZIP não é o APK sozinho e não é o código-fonte.
3. Conectar Drive na conta autorizada. Fazer upload do file_uri/arquivo real para PokeSearch_App, mantendo nome descritivo *PokeSearch-LTNNN-Signed-Verified.zip*.
4. Conferir a resposta do upload (id e url), depois obter metadados por ID e verificar nome, bytes, pasta e permissão de compartilhamento. Somente então divulgar URL real.
5. Registrar em Guia Mestre link/ID real, tamanho, checksum real do ZIP, SHA do APK interno e o status de compartilhamento. Não reaproveitar link de outra versão.
6. Para pacote **editável** destinado a outras IAs, gerar outro ZIP de fonte do HEAD/commit, com manifests, tests e docs sem .git/cache/segredos. Não chamar pacote de APK de "código-fonte completo". Conferir versões hardcoded dos scripts legados antes de executá-los.
7. Se faltar permissão do Drive na nova conta, explicar impedimento e usar GitHub Release/Actions como fonte confiável. Não declarar upload bem-sucedido antes da verificação.

Link confirmado de exemplo LT227: https://drive.google.com/file/d/125GyTbrh7_-8kJSC4BZFxhIiopxz-Afg/view?usp=drivesdk . A conta e a pasta podem ser alteradas pelo proprietário: consultar metadados atuais.

## 11. Registro obrigatório no Arquivo Mestre e orientações

Arquivo canônico: docs/GUIA_MESTRE.md (resumo histórico progressivo; não truncar). Documento de procedimento: **este arquivo**. Complementos: AGENTS.md, LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md, README.md, relatório QA específico, arquivos de testes e release_notes.json.

Após cada etapa, registrar uma seção compacta, com:
- Data com fuso, versão LT, versão Android/code, natureza QA ou estável e versão anterior.
- Problema, causa comprovada ou hipótese, comportamento esperado e evidência.
- Arquivos/funções alterados e mudanças nos testes.
- PR URL e SHA do merge; branch e SOURCE_COMMIT do APK (distinguir de HEAD documental).
- IDs de runs e conclusão para Node/Android/OTA, observando execução de SHA correto.
- APK: nome, bytes, SHA-256, certificado SHA-256, versão/package e link estável real (quando publicado).
- Drive: URL/ID reais, tamanho/checksum, tipo do ZIP, confirmação de upload; se pendente, escrever PENDENTE.
- Riscos residuais, resultado QA Samsung (com evidência) ou NÃO EXECUTADO, passos de rollback e próximos testes.
- Separar "código mesclado", "APK compilado", "publicação estável" e "instalado no aparelho" como estados independentes.

Não substituir docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md (backup histórico grande). Atualizar AGENTS.md / LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md com link a este manual e base oficial após release; evitar duplicar um manual enorme em vários lugares.

Modelo conciso de registro:

    ## LTNNN — assunto (AAAA-MM-DD)
    - Base anterior: LTXXX/code; nova: QA ou stable.
    - Mudanças/arquivos: ...
    - QA: run ID, status, SHA exato, lacunas físicas.
    - PR/merge: URL, commit.
    - Release: publicada ou pendente, tag, APK, size, SHA-256, certificado, SOURCE_COMMIT.
    - Drive: URL/ID, bytes, SHA ZIP e status.
    - Segurança/rollback: ...
    - Próxima ação: ...

## 12. Diagnóstico de falhas e sinais de alerta

- **404 em arquivo/ZIP do ChatGPT (Library file not found):** não repetir links temporários; preferir GitHub Release/Actions/Drive verificados, como orienta o protocolo oficial.
- **PR aberta mas não mesclada:** não anunciar merge; conferir estado no GitHub.
- **Build SUCCESS mas sem release:** ainda não enviado ao app; conferir estágio Release to all app users e latest.
- **Release com draft ou prerelease:** o atualizador não oferece.
- **APK com code igual/menor:** Android e atualizador não tratam como update; ajustar somente por novo build autorizado de code maior.
- **Assinatura divergente:** proibido instalar por cima; preservar certificado original. Não expor segredo ou sugerir limpeza de dados.
- **GitHub workflow em fila/in_progress:** aguardar evidência conclusiva em sessão atual; não prometer trabalho assíncrono sem automação explícita.
- **CI falha por script legado:** examinar logs e escopo; não declarar que todo o build está quebrado sem correlação.
- **Conta 2/Doce Raro sem login:** verificar perfis WebView isolados; site no Chrome não prova sessão da WebView interna. Não tratar cooldown de coleta como HTTP 429.
- **Sprite ausente ou pequena:** inspecionar fontes/CORS/cache/área alfa e fallback; conferir P1/P2, fundo ON/OFF e P/M/G no aparelho.
- **Mudança de conta ChatGPT/IA:** a nova IA só pode ler repos públicos; não herda Drive/Push, segredos CI, histórico ou capacidades. Pedir permissões específicas ao proprietário, não credenciais no chat.
- **Rollback:** não sobrescrever tag ou APK já publicado. Preparar hotfix com novo code mais alto e origem/QA identificados; referência e APK antigo ficam disponíveis para auditoria. Não recomendar downgrade sem estudo de compatibilidade.

## 13. Checklist final antes de responder ao proprietário

- [ ] Confirmei main SHA, latest e último code; usei somente o repo correto.
- [ ] Expliquei quais arquivos mudei e mostrei evidência (PR/diff/commit).
- [ ] Testes Node, OTA, Java/Android referenciam o SHA atual.
- [ ] Diferenciei resultado automatizado de Samsung físico e API real.
- [ ] Publiquei somente após autorização e com assinatura certificada.
- [ ] Conferi Releases/latest, asset, size, SHA-256, versionName/code e SOURCE_COMMIT.
- [ ] Se houve upload Drive, verifiquei URL real, arquivo e permissões.
- [ ] Registrei em Guia Mestre, acrescentei QA e atualizei handoff.
- [ ] Não vazei secrets, JWT, cookies ou dados pessoais.
- [ ] Não informei "instalado por todos" sem comprovação.

## 14. Mensagem de continuidade para uma IA em outra conta

"Continue **LucianoToscano/PokeSearch** exatamente do estado atual, sem recriar projeto nem presumir versão. Leia AGENTS.md, docs/GUIA_MESTRE.md e docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md. Verifique main SHA, Releases/latest, branches/PRs e workflows agora. Preserve duas Pokébolas, assinatura permanente, preferências, login opcional, segurança WebView e rate limits. Primeiro apresente o inventário real e pendências; corrija em branch com QA. Só faça merge, publique APK/OTA, compartilhe no Drive ou altere distribuição após minha autorização explícita. Ao executar, registre resultados verificáveis com PR, SHA, CI, hash APK, link Release, Drive e QA Samsung. Se faltar acesso ou evidência, declare pendente, sem inventar."

**Índice:** [Guia Mestre](GUIA_MESTRE.md) · [Protocolo de entrega](PROTOCOLO_ENTREGA_APK_SEM_LIBRARY_NOT_FOUND.md) · [GitHubUpdateCenter.java](../app/src/main/java/com/lucianotoscano/pokesearchoverlay/GitHubUpdateCenter.java) · [Workflow oficial LT227](../.github/workflows/lt227-official-release.yml) · [Workflow manual aprovado](../.github/workflows/pokesearch-official-release-manual.yml) · [app/build.gradle.kts](../app/build.gradle.kts).
