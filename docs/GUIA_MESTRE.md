# PokeSearch — GUIA MESTRE ATUAL (RESUMIDO)

## LT190 — Aguardar HTTP 429 do servidor nas duas Pokébolas (30/10/2026)

- **Correção em QA / publicação solicitada:** LT190 `0.01.90 / 54395`; [relatório e matriz](LT190_RATE_LIMIT_429_DUAS_POKEBOLAS_20261030.md). Não confundir a LT189 já pública com a falha `API: rate-limited` (HTTP 429) mostrada na Home. Rate-limit pertence ao PoGoCoordinates, não pode ser removido pelo PokeSearch.
- **Tratamento de 429:** `api_browser_transport.js` disponibiliza espera segura baseada em Retry-After, `api_android_session.js` comunica apenas segundos sanitizados, `OverlayService.java` mantém intervalo de segurança compartilhado pelas duas Pokébolas e retoma buscas de forma escalonada. Sem contornar o limite via DOM, outras contas ou repetição acelerada.
- **Testes:** `app/tests/lt190-provider-429-backoff-dual.test.js`; suites históricas GL/UL, 100%/0%, Raw/IV%, coordenadas, alertas, OTA e Android; QA autenticado Samsung pendente. O perfil da Conta 2 aparece como **Treinador não confirmado**, o que requer conferência de vínculo com o provedor, independentemente do HTTP 429.
- **Distribuição:** fluxo de release assinado `.github/workflows/lt190-provider-backoff-official-release.yml`; somente anunciar publicação quando o workflow concluir, a tag/latest e os hashes forem confirmados. APK no Drive antigo permanece LT187 até substituição de bytes validada.

---

## LT189 OFICIAL — Contador Get coords oculto e correção de contrato API (30/10/2026)

- **Distribuída:** [Release/latest `v0.01.89-54394`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.89-54394), APK **29.014.789 bytes** SHA-256 `2d39132b58ae205774ad7ba2068bf14d9b95972cabe5a9e2f750da1c349fb07c`, assinatura v2 permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- PR [#147](https://github.com/LucianoToscano/PokeSearch/pull/147) integrada (`d25d55b2ba4c3cc9b281ec34f8bb9851bf3668b0`); PR [#148](https://github.com/LucianoToscano/PokeSearch/pull/148) corrigiu pré-condição do workflow; **SOURCE_COMMIT do APK `6c529940761e3c2e748d8a43c4208674864c0856`**. [Actions #41011591267 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/41011591267) Node, OTA, Android/R8, assinatura e APK.
- **Interface em P1/P2:** `#coordsQuota` oculto no botão **Pegar Coordenadas**; mantém contagem interna, rate limit/cooldown e cópia. `detail.html` comum aos dois overlays; ajustes de padding sem cortar coordenadas.
- **API em P1/P2:** `pvp_league` e `pvp_include_pre_evolutions` voltaram a tipos esperados com `pvp_mode=false`, preservando filtros específicos do PvP. Regressão provável de `invalid-request` da LT188; aceitação HTTP real no Samsung ainda pendente.
- **Google Drive:** [NOVO ZIP LT189 com APK e relatórios](https://drive.google.com/file/d/1yfASG2L4aZgOLPZIMf0oMlUY-rD4zGU2/view) **26.731.088 bytes**. Link legado **`1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` CONTINUA LT187**, pois o conector não aceitou substituir o binário cru pelo arquivo local. Não anunciar link antigo como LT189; APK direto disponível na Release.
- Relatório detalhado [ESTADO_CANONICO_LT189_OFICIAL_20261030.md](ESTADO_CANONICO_LT189_OFICIAL_20261030.md); **QA físico Samsung e provedor autenticado pendentes**.

---

## LT189 — Get Coords sem contador visível e correção da API (30/10/2026)

- **Atualização autorizada, publicação em validação:** LT189 `0.01.89 / 54394`. Código em PR [#147](https://github.com/LucianoToscano/PokeSearch/pull/147), saída oficial condicionada ao CI de assinatura permanente e checagem Release/latest. Não confundir suíte Node aprovada com aceitação da API autenticada no Samsung.
- **UI P1/P2:** contador numérico/círculo `coordsQuota` do botão Pegar Coordenadas fica `hidden`, com CSS final `display:none!important`; botão centralizado e coordenadas completas. **Proteções de cota, cooldown, reveal, cópia e aviso de bloqueio continuam intactas.**
- **API P1/P2:** retorno de `pvp_league` e `pvp_include_pre_evolutions` para tipos do contrato LT187, com `pvp_mode=false` e `pvp_min_cp=null` nos modos não PvP. Corrige regressão provável do `API: invalid-request` da LT188, cuja causa HTTP real ainda depende de teste no aparelho.
- **Evidências:** `app/tests/lt189-get-coords-badge-hidden.test.js`, `app/tests/lt189-api-default-schema.test.js`, matriz detalhada em [LT189_COORDS_CONTADOR_OCULTO_API_RELEASE_20261030.md](LT189_COORDS_CONTADOR_OCULTO_API_RELEASE_20261030.md). **Sem modificar a segunda Pokébola independentemente:** os serviços compartilham o mesmo HTML.
- **Drive:** conservar o link original do APK `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` ao substituir binário bruto, caso a operação seja confirmada. Não trocar APK por ZIP. Evidências de distribuição serão registradas após leitura de volta.

---

## LT188 OFICIAL — Auditoria geral, GL/UL, IV e fonte para outras IAs (30/10/2026)

- **Release/latest pública:** [v0.01.88-54393](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.88-54393), `PokeSearch-v0.01.88-LT.apk` **29.014.309 bytes**, SHA-256 `b30c0cc389cd8a4b5de065ab637485e1d5dab3bcd955428198d5880e49992f34`; assinatura v2 permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **PR [#146](https://github.com/LucianoToscano/PokeSearch/pull/146) integrada**, SOURCE_COMMIT `cd86684c032b4966a84f7013c29243d164b2ae9d`. [Workflow oficial #41006064367 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/41006064367); Node/Android/R8/OTA, P1/P2 e checksums passaram. **QA físico Samsung ainda não realizado**.
- **Correções:** GL/UL têm PC normal e Nível como todos os modos, além de PC PvP específico; aplicação DOM não omite esses campos. Ao sair de UL/GL para IV `0/13/13`/IV%, a pesquisa não herda dados PvP e não exibe a Pokébola/resultados antigos como se fossem novos. Os serviços P1/P2 preservam estado independente.
- **Pacote completo editável de outras IAs:** [fonte na Release](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.88-54393/PokeSearch-Auditoria-Completa-Fonte-LT188.zip) **28.652.739 bytes**, abaixo de 199 MB, SHA `b9a6ec97cac36f83bbac674dbefcd4f17923285aa9cdcee73485f60c212f0347`; [cópia no Drive](https://drive.google.com/file/d/1kDTfYTSd96LNM8aU0JbUZ0N0Q7z8YYKR/view) **28.714.148 bytes**, e [prompt separado](https://drive.google.com/file/d/1r41ZR8eAE-f8hLe9VeRkrHqdFKRXfYVS/view).
- **Drive de instalação:** [novo ZIP oficial LT188](https://drive.google.com/file/d/1NsX1XtIvtEpt1WKHZMS3mZzH5Ca_Hu3Q/view) contém APK assinado e evidências; **o link compartilhado antigo** `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` **continua LT187**, pois não foi possível substituir os bytes do APK cru por meio do conector (e não é seguro substituir por ZIP). Para APK direto e OTA usar Release/latest.
- **Registro detalhado** [LT188 OFICIAL](ESTADO_CANONICO_LT188_OFICIAL_20261030.md). Não sobrescrever `GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md`.

---

## LT188 QA — GL/UL PC e Nível + troca de IV/IV% sem badge antigo (30/10/2026)

- **Em branch de QA, ainda NÃO publicado:** correção em `dock.html` mantém filtros gerais **Ordenar → PC → Nível → Clima → Tamanho → Sexo → Forma** também em GL/UL; extras **PC mínimo PvP** e **Evoluções** permanecem apenas nas ligas. `probe.js` não ignora mais CP/Nível no PvP; a API já suporta campos simultâneos.
- **Transição de modos:** `OverlayService` mantém prévia somente quando o filtro completo coincide; sem ela descarta linhas de outra seleção e o ícone antigo UL/GL em vez de apresentar rank anterior como se fosse Raw `0/13/13` ou IV%. P1 e P2 herdam a mesma correção com preferências isoladas.
- **QA em PR:** nova suíte `lt188-dual-mode-filters.test.js`, regressão de `overlay-ux.test.js` e CI Node/Android em validação. A mensagem **Network Error** nas capturas não comprova a causa; exigir teste de rede/site/API e Samsung físico antes de publicar. **LT187 segue oficial**, sem alterar Release/latest/Drive. [Auditoria/matriz](LT188_AUDITORIA_P1_P2_FILTROS_MODOS_QA_20261030.md).

---

## LT187 OFICIAL — APK otimizado publicado, app atualizado e Drive no mesmo link (30/10/2026)

- **Distribuição geral concluída:** [GitHub Releases/latest v0.01.87-54392](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.87-54392), APK **29.013.825 bytes** (antes LT184 49.547.006; **redução 20.533.181 bytes, 41,44%**), SHA-256 `e462b213343253de0b1f84d318ec9ea5a1e29bb7adeb239c76a8878212a7285e`, Android v2 certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Merge na main concluído em ordem:** [#143 LT185](https://github.com/LucianoToscano/PokeSearch/pull/143) `49c5ea264e8d4f0d68a49c1ae300a81a2800d1c6`; [#144 LT186](https://github.com/LucianoToscano/PokeSearch/pull/144) `8c9d982be70e7380daf14f58fa7ebd99ab4d9aa7`; [#145 LT187](https://github.com/LucianoToscano/PokeSearch/pull/145) `4d7920d49359ebec446a4d38af6463a122bb94a9`.
- **Publicação oficial validada:** [GitHub Actions #40994712359 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40994712359), SOURCE_COMMIT `82b9f67cd43a61663627f368563ba366f50bfba6`, artefato `PokeSearch-LT187-54392-Oficial-Assinado` ID `12950698551`. Node/Gradle/R8, P1/P2, Doce Raro, OTA, sprites offline, assinatura, hash e latest conferidos. Notas LT187 presentes na Home (`minVersionCode=54392`).
- **Google Drive atualizado preservando ID e URL públicos:** [APK LT187 oficial](https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view), arquivo substituído no mesmo ID, **29.013.825 bytes**, renomeado `PokeSearch-v0.01.87-LT.apk`, permissão `anyone/commenter` preservada. **Download posterior e `cmp` byte a byte** com GitHub oficial, SHA idêntico; staging temporário excluído. Pasta PokeSearch_App preservada.
- **Atualização no aplicativo:** `GitHubUpdateCenter` já consulta `Releases/latest` LT187; será oferecida quando o app verificar por nova versão, com aceite do Android. Não houve instalação silenciosa/push imediato em aparelhos. Manifesto legado `atualizacao.json` permaneceu sem alterações.
- **Testes:** upgrade LT184→LT187 via `adb install -r` no Android 16 aprovado ([Action #40993150452](https://github.com/LucianoToscano/PokeSearch/actions/runs/40993150452)); **QA físico Samsung de login, sons reais, imagens/overlays e alertas P1/P2 ainda recomendado**. [Registro técnico completo](ESTADO_CANONICO_LT187_OFICIAL_20261030.md).

---

## LT187 — Upgrade in-place Android 16 validado no emulador (29/10/2026)

- **[GitHub Actions #40993150452 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40993150452)**. Testado em emulador **Android 16 / API 36**, usando os APKs reais LT184 pública (SHA confirmado) e LT187 QA (SHA confirmado), com mesmo certificado Android v2. `adb install -r` instalou a LT187 sem desinstalar LT184; **UID 10216** e `firstInstallTime` preservados, versionCode **54389 -> 54392**, Home inicializou nas duas versões e o processo continuou ativo sem falha fatal detectada. Artefato de screenshots/logs [12950247083](https://github.com/LucianoToscano/PokeSearch/actions/runs/40993150452/artifacts/12950247083).
- **QA físico Samsung permanece pendente**: emulador não comprova persistência da conta/treinador, funcionamento dos dois overlays simultâneos, áudio perceptual, notificações reais, menu/cliques ou OAuth Discord/Google. PRs #143/#144/#145 continuam draft, sem merge. A LT184 pública e o link público do Drive não foram modificados. [Registro específico](LT187_ANDROID16_UPGRADE_PREPUBLICACAO_QA_20261029.md).

---

## LT187 QA — Compactação de áudios e auditoria interna (29/10/2026)

- **APK 0.01.87 / 54392:** **29.013.661 bytes**, [Action LT187 #40990477785 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40990477785). Redução de 2.080.880 bytes ante LT186 QA (31.094.541) e 20.533.345 bytes (41,44%) ante a LT184 pública (49.547.006).
- **Áudios:** 9 dos 37 MP3 otimizados com validação de duração, canais e decodificação; 36/36 sons do seletor preservados, economia fonte 2.080.888 bytes. **Auditoria do APK:** 3.468 entradas; nenhum grupo de arquivos grandes exatamente duplicados encontrado (limite 50 KB), sem exclusão de libs/recursos essenciais. R8, shrinkResources, SHA, certificado permanente, sprites, P1/P2, Doce Raro e OTA aprovados.
- **PR draft [#145](https://github.com/LucianoToscano/PokeSearch/pull/145)** baseada em [#144 LT186](https://github.com/LucianoToscano/PokeSearch/pull/144), por sua vez em [#143 LT185](https://github.com/LucianoToscano/PokeSearch/pull/143). Artefato `PokeSearch-LT187-54392-Size-QA-Assinado` ID `12949211220`; SOURCE_COMMIT `9a9b301666c1f24ee747a9966684690e7fc31152`.
- **Sem merge, sem publicação para todos, sem Drive e sem OTA pública:** continua LT184 em Releases/latest. Precisa instalar e validar som, qualidade visual, login, duas Pokébolas, Doce Raro, notificações e atualização no Samsung antes da release. [Registro LT187](LT187_AUDIO_APK_AUDIT_QA_20261029.md).

---

## LT186 QA — Meta de tamanho superada, sem publicação (29/10/2026)

- **APK 0.01.86 / 54391 de 31.094.541 bytes**, redução de 18.452.465 bytes (37,24%) ante a LT184 pública de 49.547.006 bytes e 12.676.073 bytes ante a LT185 QA. [GitHub Actions #40989269637 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40989269637), artefato QA assinado `PokeSearch-LT186-54391-Size-QA-Assinado` (ID 12948133735), código fonte `f277b6ae6d457ecc2b1655f8dc2fa1182c7c1885`.
- **Mudanças:** WebP de qualidade controlada em seis imagens usadas pela Home/recursos Android, quatro PNG mestres da marca preservados fora do diretório empacotado, testes Node/Android/Doce Raro/P1-P2/OTA, sprites offline, R8, Android v2 permanente e SHA-256 conferidos. [PR #144](https://github.com/LucianoToscano/PokeSearch/pull/144) construída sobre [PR #143 LT185](https://github.com/LucianoToscano/PokeSearch/pull/143).
- **Sem release pública nem substituição do Drive/OTA:** LT184 permanece latest. Teste visual e de notificações reais no Samsung ainda pendente. [Registro técnico LT186](LT186_WEBP_BRAND_ASSETS_QA_20261029.md).

---

## LT185 QA — APK menor, sem publicação (29/10/2026)

- **Aplicado em branch QA:** [PR #143](https://github.com/LucianoToscano/PokeSearch/pull/143) — otimização de 50 PNGs com nomes, caminhos e transparência preservados. Recursos de hash oficial mantidos íntegros; sprites Pokémon e áudios preservados. Fonte assinada `9f5206be1852b54fe65463b17eccb1b86bb652c7`.
- **Resultado comprovado:** [GitHub Actions #40986743734 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40986743734), ZIP QA `PokeSearch-LT185-54390-Size-QA-Assinado`, artifact ID `12947133511`. APK `0.01.85 / 54390` **43.770.614 bytes** vs LT184 **49.547.006 bytes**: queda de **5.776.392 bytes (11,66%)**. Economia fonte PNG **7.123.660 bytes**. Verificadas regressões Node/duas Pokébolas/Doce Raro/OTA, R8, assinatura v2 e SHA pelo CI.
- **Governança:** PR draft sem merge, sem atualização pública/Drive/OTA. LT184 permanece pública. Necessário QA visual no Samsung; 35 MB continua apenas como meta. [Registro LT185](LT185_APK_SIZE_OPTIMIZATION_QA_20261029.md).

---


## LT184 OFICIAL — Favoritos sincronizados nas Pokébolas, APK público e Drive (29/10/2026)

- **PUBLICAÇÃO CONCLUÍDA:** [GitHub Releases/latest LT184 v0.01.84-54389](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.84-54389), APK `PokeSearch-v0.01.84-LT.apk`, **49.547.006 bytes**, SHA-256 `e7679eafd1b43ca4f770a0939195603846e0cd6ed07881a217c078a2f09ac183`; Android v2 e certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` conferidos.
- **Google Drive — mesmo link e mesmo ID:** [PokeSearch LT184 público](https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view), tamanho 49.547.006 bytes, `anyone/commenter` preservado. Novo APK verificado por download posterior, SHA-256 e comparação byte a byte com artefato CI; staging apagado.
- **Merge:** [PR #142](https://github.com/LucianoToscano/PokeSearch/pull/142) integrada à `main` por squash `b3dd24839322029c4d6c4ce2e030ddb987625f0b`, mesmo SOURCE_COMMIT do APK. [Action oficial #40984409972 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40984409972), artefato assinado ID `12947025068`, regressões/Gradle/R8/versionCode 54389/verificação do asset/latest aprovados.
- **Correções:** lista global e modo dos Favoritos sincronizados nas duas Pokébolas, rechecagem apenas de resultados próprios da geração confirmada com filtro válido/TTL, fila antiga descartada e deduplicação independente. Testes de aviso diferenciam P1 e P2. P1 100% e P2 0% continuam com critérios independentes; notas LT184 no app.
- **Distribuição:** o atualizador consulta `GitHub Releases/latest` e oferece a versão 0.01.84 a usuários elegíveis quando verificarem atualizações, com aceite Android; sem instalar silenciosamente. Manifesto `atualizacao.json` legado não alterado. **QA físico de alertas no Samsung ainda pendente** (não confundir publicação com prova de entrega em encontros reais).
- **Registro canônico detalhado:** [ESTADO_CANONICO_LT184_OFICIAL_20261029.md](ESTADO_CANONICO_LT184_OFICIAL_20261029.md). LT183 e releases anteriores preservadas.

---

## LT183 OFICIAL — Discord OAuth, release pública e Drive (29/10/2026)

- **PUBLICAÇÃO CONCLUÍDA:** [GitHub Releases/latest v0.01.83-54388](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.83-54388). APK `PokeSearch-v0.01.83-LT.apk` 49.546.774 bytes, SHA-256 `2d336d6b7a3da61fb0c0553bb9762cce009189b324c3508fe9d735d4401ce5c4`. Assinatura Android v2 permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Google Drive confirmado:** mesmo [arquivo público e mesmo ID](https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view), atualizado para LT183. Arquivo lido de volta e comparado byte a byte com o artefato assinado do GitHub; hash idêntico. Permissão `anyone` mantida e staging apagado.
- **Merge:** PR [#140](https://github.com/LucianoToscano/PokeSearch/pull/140) `a59b44567503eb9f1f6993c434354fbf693fde39`; PR [#141](https://github.com/LucianoToscano/PokeSearch/pull/141) `bb00878c572efc490f338d14eb61dea4f6dd9156` (SOURCE_COMMIT do APK). [Action oficial #40968750617 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40968750617), R8, v2, Node/Gradle e SHA verificados.
- **Mudança:** após autorizar Discord, WebView não mascara o callback do PoGoCoordinates com `Preparando acesso...`; `/profile` não é aberto prematuramente enquanto OAuth está inconclusivo, `Gerenciar/Vincular` verifica a sessão e falhas da página principal não ficam ocultas. Mantidas duas contas isoladas e treinadores VIP.
- **Importante:** QA real Discord no aparelho Samsung **ainda não realizado**; CI e assinatura não comprovam que o callback do provedor realmente conclui. O app não inventa sessão caso o OAuth oficial rejeite a autorização. Atualização oferecida pelo GitHubUpdateCenter ao consultar a latest, com instalação sujeita ao aceite Android.
- **Registro completo:** [ESTADO_CANONICO_LT183_OFICIAL_20261029.md](ESTADO_CANONICO_LT183_OFICIAL_20261029.md); LT182 permanece histórico anterior e APK disponível.

---

## LT182 OFICIAL — Discord autenticado, treinador confirmado (29/10/2026)

- **PUBLICAÇÃO E GOOGLE DRIVE CONCLUÍDOS.** [Release estável v0.01.82-54387](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.82-54387) no GitHub Releases/latest, APK `PokeSearch-v0.01.82-LT.apk` `49.546.482` bytes, SHA-256 `c63a42b678ef08cd402244891851b7086c143e79c5ef6d315e70b6e41a3eedc9`, assinatura Android v2 com certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Arquivo compartilhado no Drive atualizado no MESMO ID**, sem mudar o link: [PokeSearch APK atualizado](https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view). Download posterior foi conferido com o **mesmo SHA-256 da Release GitHub**, tamanho idêntico e permissão pública `anyone` preservada. Staging temporário apagado.
- **Integração:** PR [#138](https://github.com/LucianoToscano/PokeSearch/pull/138) merge `c1a8849c6e349854e02e3e8598b897246b84d9be`, PR [#139](https://github.com/LucianoToscano/PokeSearch/pull/139) merge `e28c4e8d58f1ea9444cf51e06cdea56038db84b6`. Commit fonte da release `466eaf2ae78e8ff2cd0675fd85885dd3572333cc`.
- **Action oficial:** [#40966123666 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40966123666), validações Node/Gradle/R8/sprites/certificado v2/apk/hash concluídas. O erro de sintaxe YAML do primeiro acionamento foi corrigido; não confundir com a release final.
- **Distribuição:** GitHubUpdateCenter oferece esta latest a aparelhos elegíveis ao consultar o feed, sem instalação silenciosa, respeitando o aceite do Android. Vínculo treinador deve ser realizado no PoGoCoordinates. QA físico Discord/Google no Samsung ainda pendente.
- **Registro completo:** [ESTADO_CANONICO_LT182_OFICIAL_20261029.md](ESTADO_CANONICO_LT182_OFICIAL_20261029.md). **LT181 preservada como release anterior**, sem rollback ou alteração do OTA assinado.

---

## LT182 — Discord OAuth e confirmação do treinador (29/10/2026)

- **Correção integrada na main:** PR [#138](https://github.com/LucianoToscano/PokeSearch/pull/138) mesclada, commit squash `c1a8849c6e349854e02e3e8598b897246b84d9be`. O vídeo recebido demonstra a autorização Discord reconhecida pela Conta 2, porém sem treinador confirmado; isso não prova bloqueio pelo Discord.
- `MainActivity.java` deixou de fechar automaticamente o login 6,5 s após OAuth enquanto `/profile` ainda está hidratando. Leitura limitada a 16 tentativas, com perfil oficial liberado para inspeção quando inconclusivo. Estado `unknown` nunca vira `unlinked` por suposição.
- Se o site confirma `Pokemon GO accounts 0/N`, a Home mostra **Vincular** e informa que autenticar Google/Discord não vincula automaticamente o treinador Pokémon GO. Vínculo continua manual no site; não copiar código da Conta 1 nem atravessar os cookies dos perfis.
- **Histórico pré-publicação:** a branch inicial passou Node/Java/Gradle. O job privado de testes com assinatura provisória falhou por configuração própria; o workflow **oficial** de release LT182, com certificado permanente, concluiu com sucesso após a correção YAML, conforme seção LT182 OFICIAL acima. QA real Discord no Samsung continua pendente.
- Documento de diagnóstico, limites e teste: [LT182_DISCORD_OAUTH_PROFILE_RECOVERY_QA_20261029.md](LT182_DISCORD_OAUTH_PROFILE_RECOVERY_QA_20261029.md). LT181 continua último APK estável até nova release oficial.

---

## LT181 — Publicação geral solicitada (29/10/2026)

O proprietário solicitou explicitamente **"Certo aplica para versão pública então."** Referência: [PR #137](https://github.com/LucianoToscano/PokeSearch/pull/137). Código da LT181 reúne aviso de atualização no topo acima das Pokébolas, paridade compacta dos três menus Doce Raro, atualização/cadência oficial, transparência dos botões Reportar/Doar/Fechar no •••, e correção do recorte dos dez doces (removido teto fixo 460dp, área rolável quando necessário). [QA assinado SUCCESS #40952601562](https://github.com/LucianoToscano/PokeSearch/actions/runs/40952601562), versão `0.01.81/54386`; o workflow `lt181-menu-parity-official-release.yml` exige assinatura permanente, integridade SHA-256 e base `Releases/latest=v0.01.80-54385` antes de tornar pública a LT181. **Distribuição CONCLUÍDA E CONFIRMADA:** [Action oficial #40955101902 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40955101902), [Release/latest v0.01.81-54386](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.81-54386), `draft=false`, `prerelease=false`, APK assinado `PokeSearch-v0.01.81-LT.apk` 49.546.158 bytes, SHA-256 `03567e9cfaa16ad597039cc41ee22ca4ae59f808f51143fc000a33acdb35c98f`, SOURCE_COMMIT `1b18c6b0cd2ac663b6c29e6a177e28b40bea63bd`. Lançamento disponível ao atualizador baseado no GitHub, sujeito à consulta/aceite Android. Google Drive legado não atualizado; QA físico Samsung pendente.

---

## LT180 OFICIAL — Distribuição geral confirmada (29/10/2026)

- Autorização expressa do proprietário para publicar a LT180 para todos. PR [#136](https://github.com/LucianoToscano/PokeSearch/pull/136) mesclada na `main`; SOURCE_COMMIT: `80d3949405880aca4f55ade560fe283a3cbb7667`.
- [GitHub Actions oficial #40948554564 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40948554564), testes, R8, APK, certificado Android v2 e SHA verificados.
- [GitHub Releases/latest v0.01.80-54385](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.80-54385): publicado em 29/10/2026, `draft=false`, `prerelease=false`.
- [APK PokeSearch-v0.01.80-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.80-54385/PokeSearch-v0.01.80-LT.apk), `versionCode=54385`, **49.544.214 bytes**, SHA-256 `438b9444bb9a3323653a7d308ae5e163cd37822a3c86bb7b9ab6f2f949ab354d`, proveniente do digest oficial e conferido na Action. Assinatura v2 permanente SHA-256 de certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Novidades: ↻ Doce Raro gira durante busca; 3 minutos por padrão e OFF/3/5/10/15/20; novo refresh quando os 10 doces ativos são copiados e ficam cinza; menu de localização compacto como Pokébola (copiar/colar, slider e km), sem cooldown artificial local. `HTTP 429 Retry-After` e prazo de despawn são do provedor e continuam sendo respeitados.
- Distribuição pelo atualizador `GitHubUpdateCenter` ao consultar `releases/latest`; download/instalação requer rede e confirmação Android. Não houve alteração da ponte antiga Google Drive.
- Pedido separado da próxima versão: [PR #137 — LT181 QA](https://github.com/LucianoToscano/PokeSearch/pull/137) adiciona aviso de atualização **acima das Pokébolas** no topo da Home; não mesclar/publicar LT181 sem próxima validação/autorização.

---

## LT180 QA — ícone ↻ de Doce Raro animado (29/10/2026)

**Distribuição LT180 autorizada:** proprietário pediu novamente enviar para todos. CI assinado da revisão funcional **SUCCESS** [#40947947148](https://github.com/LucianoToscano/PokeSearch/actions/runs/40947947148), artefato QA [#12929519250](https://github.com/LucianoToscano/PokeSearch/actions/runs/40947947148/artifacts/12929519250). Workflow oficial protegido `lt180-candy-menus-official-release.yml` será executado após merge #136, verificando GitHub `latest=v0.01.79-54384` e assinatura v2; ainda não afirmar distribuição até confirmação real. Próxima versão (LT181): mover **aviso de atualização** para acima das Pokébolas no topo, sem alterar LT180. Referência detalhada [LT180](LT180_CANDY_REFRESH_SPIN_QA_20261029.md).

**Relato após LT179 pública:** botão ↻ não girava visualmente. Causa encontrada: faltava `@keyframes` no SVG e sincronização da execução nativa. Correção em branch `fix/lt180-candy-refresh-spin-20261029`: giro CSS de 0,8 s apenas enquanto `busy=true` no serviço oficial, feedback instantâneo no toque, parada em resposta/erro/429 e espera com ícone parado; consultas automáticas e após copiar todos seguem o mesmo estado. Abertura tardia do menu sincroniza o indicador; o rótulo do intervalo (OFF/3/5/10/15/20m) não gira.

**Ampliação com prints do Samsung:** o mesmo ramo/PR #136 também incorpora os menus Localização e Atualização da Pokébola (copy/paste, coordenadas, slider do raio em km, ✓/lixeira, tiles OFF/3/5/10/15/20), default 3 minutos, busca automática quando **os 10 doces ativos** ficarem cinza depois da última cópia, sem cooldown local de 15s e sem refresh extra após despawn. Permanecem obrigatórios o `HTTP 429 Retry-After` do provedor e o TTL factual dos doces, sem contorná-los. O teste `lt180-candy-cadence-location.test.js` é novo. **O artefato QA de 49.542.682 bytes listado a seguir corresponde à etapa anterior; não contém os novos ajustes e precisa ser substituído por QA assinada a partir do HEAD atualizado.** [Detalhes de implantação](LT180_CANDY_REFRESH_SPIN_QA_20261029.md).

**QA assinada verificada:** [GitHub Actions #40943703228 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40943703228), [ZIP do artefato #12929110259](https://github.com/LucianoToscano/PokeSearch/actions/runs/40943703228/artifacts/12929110259) de 46.599.165 bytes, SHA-256 do ZIP `06293b42d17c4f4c58450d4de0e9a216c6ad96318bfbd018dcc7b8b4b8de5cfd`. APK interno `PokeSearch-v0.01.80-LT-QA.apk` (49.542.682 bytes), `versionCode=54385`, certificado v2 permanente conferido, SOURCE_COMMIT `6c9aa7ed8c5164f9058b6cdcb51d8ac718321d62`. Passaram o teste de animação LT180, testes LT179/LT175 e build R8; ensaio visual no Samsung ainda pendente. **Sem merge/Release/Drive/OTA público autorizados para a LT180 neste relato**; a LT179 permanece a versão pública. Ver [LT180 QA](LT180_CANDY_REFRESH_SPIN_QA_20261029.md).

---

## LT179 — DISTRIBUIÇÃO GERAL AUTORIZADA (29/10/2026)

O proprietário solicitou explicitamente: **"Envie para atualizar o app de todo mundo"**. Assim, autorizou merge da PR #135, lançamento estável e exposição no atualizador existente do aplicativo. O fluxo da LT179 usa a mesma chave permanente e cria **`v0.01.79-54384`**, sem sobrescrever a LT178. O workflow protegido `.github/workflows/lt179-candy-official-release.yml` só publica após detectar `latest=v0.01.78-54383`, assinar o APK, passar os testes/Android e conferir SHA-256 e tamanho do asset. O canal é GitHub Releases/latest; o Android pede consentimento para instalar. **Google Drive não é sincronizado pelo workflow**, não afirmar upload ao Drive sem evidência.

Escopo: ↻ Doce Raro com toque simples e segurar distintos, refresh automático quando toda lista válida ficar cinza após cópia, proteção contra busca duplicada/429 e registro da LT179 em `release_notes.json`. Código e PR: [#135](https://github.com/LucianoToscano/PokeSearch/pull/135); escopo de QA [LT179](LT179_DOCE_RARO_REFRESH_APOS_COPIA_20261029.md). **PUBLICAÇÃO CONCLUÍDA:** merge PR #135 em `45d9611477459e9c068f9fb5959a3a782cc24e5e`, [workflow oficial SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40942572376), [release estável/latest LT179](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.79-54384) e [APK oficial assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.79-54384/PokeSearch-v0.01.79-LT.apk). Versão `0.01.79 / 54384`, 49.542.366 bytes, digest SHA-256 `484f85afce3d25d38f8e34411788d4658b866203ff896eccf5088b905ac97184`, certificado v2 permanente e R8 validados na Action. `draft=false` e `prerelease=false` verificados em Releases/latest. App oferece a atualização mediante consulta do GitHub e aceite Android. **Drive legado não alterado**; homologação física Samsung não equivale ao CI. Registro: [relatório LT179](LT179_DOCE_RARO_REFRESH_APOS_COPIA_20261029.md).

---

## LT178 — NOVA CANDIDATA OFICIAL DOCE RARO (29/10/2026)

**Correções sobre a LT177:** controle de Nome Doce Raro ocultável, distância inserida dentro da célula da sprite (sem coluna lateral), barra e popups refinados, visibilidade inicial `Nome OFF · Localização OFF · Despawn ON · Distância OFF` e sprite de Doce Raro original com transparência em resolução 96×96. Botão ↻: toque curto chama consulta na soltura, pressão longa abre somente opções 1/3/5min, com uma busca pendente durante consulta anterior sem disparos simultâneos. Versão destinada ao APK completo assinado **0.01.78 / versionCode 54383**; novo `release_notes.json` registra novidades para usuários. Ações preservam as duas Pokébolas e contas independentes.

Registro da etapa: [LT175–LT178 QA e lançamento](LT175_DOCE_RARO_FLUTUANTE_QA_20261029.md). PR #134 deve passar pela QA e ser integrada na main; workflow específico `lt178-official-release.yml` publicará GitHub Releases/latest somente se a base atual for LT173 e se assinatura, R8 e regressões passarem. Drive requer upload/validação específicos; não é automaticamente atualizado pelo GitHub.

---

## LT177 EM QA — API DIRETA DOCE RARO E MENUS VISUAIS DA POKÉBOLA (29/10/2026)

**Build de QA confirmado:** [GitHub Actions #40936145937 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40936145937), [ZIP QA #12923894267](https://github.com/LucianoToscano/PokeSearch/actions/runs/40936145937/artifacts/12923894267), APK `PokeSearch-v0.01.77-LT-QA.apk` com 49.539.430 bytes e assinatura v2 verificada. A origem de código é `366503ce3501465d761b9555c847477e3835bfb0`. **Testes reais do usuário no Samsung ainda pendentes**, sem atualização geral.

Após comparação de prints físicos no Samsung, corrigida a escala da sprite (20dp) e substituído o menu anterior por **toolbar nativa em WebView local** com o mesmo CSS de tiles 30×34dp, espaçamento 2dp e popups do dock das Pokébolas. Os resultados agora são coluna transparente compacta em vez de cards largos. A coleta passou da extração DOM do site para **POST oficial `/rare-candy/search`** executado dentro da origem PoGoCoordinates: `coords` diretas, `expires_at` UTC, `distance_km`, sem `/reveal`, sem transferência de JWT para Android, rate-limit 429 e raio em **metros** na UI (1000m→1km API). Nova candidata privada **0.01.77 / 54382**, assinada somente para QA, sem nova release pública, sem merge e sem OTA. [Especificação e registro de teste LT177](LT175_DOCE_RARO_FLUTUANTE_QA_20261029.md).

---

## LT176 EM QA — CORREÇÃO DA BOLHA DO DOCE RARO (29/10/2026)

**QA assinada concluída:** [Actions #40932888221 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40932888221), [artifact privado #12924075960](https://github.com/LucianoToscano/PokeSearch/actions/runs/40932888221/artifacts/12924075960), APK `0.01.76 / 54381` de 49.536.381 bytes, assinatura Android v2 permanente verificada. Publicação pública e testes funcionais Samsung continuam pendentes. 



Após o primeiro teste físico LT175 no Samsung, o proprietário confirmou ícone de Doce Raro grande, com quadrado atrás e sem resposta a toque/arraste. A causa foi a WebView oculta consumir touch antes do listener da janela da bolha. **Corrigido na branch da PR #134:** grip transparente nativo de 45dp acima da WebView, candy visual de 27dp sem fundo, clique/long press/arraste independentes, e reposicionamento dos cards para não cobrir o próprio ícone. Nova versão QA LT176 `0.01.76 / 54381`, APK completo assinado para teste, sem release pública. A LT173 continua estável; testes reais de coleta Rare Candy no WebView e ciclo de despawn permanecem necessários. [Evidências LT176 no registro de QA](LT175_DOCE_RARO_FLUTUANTE_QA_20261029.md).

---

## LT175 EM QA — DOCE RARO COMO TERCEIRO OVERLAY (29/10/2026)

**LT173 segue sendo a única versão pública estável.** Em branch separada, LT175 integra na Home um ícone Doce Raro ao lado de Clima e acrescenta `RareCandyOverlayService`: bolha independente de 45dp, toque para abrir cards, segurar para menus no estilo das Pokébolas, localização/raio, atualização 1/3/5m, mostrar/ocultar infos, cópia por sprite com estado cinza, despawn e remoção automática com busca controlada. Fonte é a aba Rare Candy do PoGoCoordinates em WebView, usando sessão e acesso oficiais; nenhuma coordenada inventada, máximo 10. **Alterações de Java e Manifest exigem novo APK**, não recurso OTA na LT173. QA CI e físico Samsung/Moto ainda não comprovado; não houve merge nem distribuição. [Registro LT175](LT175_DOCE_RARO_FLUTUANTE_QA_20261029.md). PR LT174 (#133) de segurança OTA segue isolada.

---

## LT173 OFICIAL — ATUALIZAÇÕES INTELIGENTES ASSINADAS (29/10/2026)

**VERSÃO ESTÁVEL ATUAL: LT173 `0.01.73 / versionCode 54378`, disponível para todos via GitHub Releases/latest.** A PR [#132](https://github.com/LucianoToscano/PokeSearch/pull/132) foi mesclada. SOURCE_COMMIT oficial `7d3f7497539af826de491cc6daac2e16e4411758`. APK `PokeSearch-v0.01.73-LT.apk` **49.514.961 bytes**, SHA-256 `5d330bafeabe3a24fdfb5ef8864c7ae463743ae4cda362d014fc9c08ef34ade9`, R8, certificado Android v2 permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. [Release oficial LT173](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.73-54378) · [Actions #40921988685 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40921988685) · [Registro canônico LT173](ESTADO_CANONICO_LT173_OFICIAL_20261029.md).

- **Sistema OTA:** introduz manifestos de recursos assinados com a mesma identidade do APK, SHA-256 por arquivo, downloads apenas de recursos elegíveis modificados, instalação atômica em armazenamento privado, rollback e fallback aos arquivos do APK. A primeira atualização para LT173 ainda é APK completo; mudanças Java/Manifest/SDK continuam exigindo novo APK.
- **Canal OTA:** `ota/channel.json` permanece `{"packVersion":0}`; nenhum pacote OTA de recursos está sendo enviado agora. A primeira publicação de recursos exige procedimento específico aprovado e assinado.
- **Paridade:** duas Pokébolas, duas contas PoGoCoordinates com cookies separados, seleção de treinadores VIP por Pokébola, login, Shiny, GL/UL, menus, sprites, chat, favoritos e filtros preservados. O WebView local usa origem protegida e não carrega páginas remotas como fallback.
- **Distribuição:** GitHub Releases/latest já entrega LT173 ao atualizador instalado; o usuário pode receber aviso e baixar a versão sob sua própria confirmação no Android. Não há instalação silenciosa nem prova de que todos instalaram. LT172 continua acessível como versão anterior. **Google Drive legado sincronizado**: mesmo ID público `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P`; hash SHA-256 da leitura Drive conferido e idêntico ao asset estável GitHub.
- **Validação:** Node completo, Gradle, SHA-256, R8, ZIP e certificado aprovados no CI. QA físico Samsung/Moto G15 com duas contas, VIP, sprites, API ON/OFF e rollback **continua pendente**, mesmo com publicação pública autorizada pelo proprietário.

---


## HISTÓRICO — LT172 OFICIAL ANTERIOR — COORDENADAS, MENU MAIS E VINCULAÇÃO (29/10/2026)

**VERSÃO ESTÁVEL ANTERIOR: LT172 `0.01.72 / versionCode 54377`, publicada para todos via GitHub Releases.** PR #130 mesclada; SOURCE_COMMIT imutável do APK `40e94bafe86dfb778be719e0cf1310a7f3085457`; [Release/latest LT172](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.72-54377); APK `PokeSearch-v0.01.72-LT.apk` **49.514.561 bytes**, SHA-256 `5b407116707beacb1c41400c05eceb8d91199496bfb2b7d9ad29b0ebfbd63a2f`. [GitHub Actions #40909102893 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40909102893), R8 e certificado permanente Android v2 verificados.

- **Contas e treinadores:** preservados ambos os cards completos Conta 1/Conta 2, logins WebView isolados e seleção independente P1/P2 de Conta 1 ou 2 e Treinador 1/Treinador 2 em contas VIP que realmente possuam dois vínculos verificados. Os controles de privacidade também valem para Conta 2.
- **Get coords:** mensagem **Taxa Limitada PoGoCoordinates ⓘ** somente com limite efetivamente sinalizado pelo site/API. Ao tocar, abre balão explicativo; se houver prazo explícito do provedor, mostra contagem de segundos, sem inventar tempo. Contador de usos em círculo, não apresentado como saldo oficial quando local.
- **Menu Mais (⋯):** tiles individuais do tamanho da barra, sem coluna preta contínua. **Pokébola 1:** ativa overlay mantendo Home visível. **Gerenciar:** abre o formulário de vínculo oficial sem autorizar `Look up` ou `Yes, link it` automaticamente; após vínculo confirmado, navega às buscas oficiais do site. Fluxos por conta mantidos.
- **Entregas e QA:** integração na [PR #130](https://github.com/LucianoToscano/PokeSearch/pull/130), workflow oficial `lt172-coords-menu-trainer-official-release.yml`, [registro canônico da LT172](ESTADO_CANONICO_LT172_20261029.md). Testes Node/Java/Gradle e integridade do APK aprovados. QA físico no Samsung com duas sessões, VIP, taxa real e popup continua pendente; não confundir CI com testes ao vivo.
- **Distribuição:** GitHub Releases latest anuncia a nova versão pelo mecanismo já existente; o usuário precisa aceitar a instalação no Android. LT171 e anteriores preservadas.

---

## HISTÓRICO — LT171 OFICIAL ANTERIOR (29/10/2026)

**VERSÃO ESTÁVEL ANTERIOR: LT171 `0.01.71 / 54376`, publicada para todos via GitHub Releases.** PR #128 mesclada, SOURCE_COMMIT do APK `e7570bd169fca569ff4fd2d5f6fd2fce82164080`. [Release/latest v0.01.71-54376](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.71-54376), APK `PokeSearch-v0.01.71-LT.apk` **49.510.871 bytes**, SHA-256 `1a00dde87c54f6119b6153cf9be4b7bf7c055233d7923aa5b7a287907e486ede`. [GitHub Actions #40906715606](https://github.com/LucianoToscano/PokeSearch/actions/runs/40906715606) **SUCCESS**; assinatura Android v2 permanente, R8, conteúdo ZIP e release latest validados.

- **Dois cards completos:** tanto Conta 1 quanto Conta 2 mostram nome/avatar, login/provedor, equipe/nível, treinador vinculado, código, copiar, Gerenciar/Remover e saída individual, no estilo existente da Home. Conta 2 não usa dados da Conta 1 nem compartilha cookies.
- **Treinadores VIP:** se Conta 1 tem 2 treinadores oficiais vinculados, ambos ficam disponíveis como Treinador 1 e Treinador 2; uma Conta 2 comum com 1 treinador mostra só o seu. P1/P2 podem escolher independentemente conta e treinador válidos, inclusive P1=A/T1 e P2=A/T2, ou A/T1+B/T1. Sem treinador confirmado, Shiny permanece indisponível naquela Pokébola.
- **Privacidade:** Anônimo / XXXX XXXX XXXX são aplicados aos dois cards, com cópia do código verdadeiro; avatar da Conta 2 usa apenas URL pública Google validada e fallback neutro.
- **QA:** testes Node/Java e release oficial aprovados; **Samsung físico, OAuth com duas contas, VIP 2/2 e orientação visual continuam pendentes**, não declarar homologação física. Atualização oferecida pelo app via GitHub Releases, instalação exige aceite Android.
- **Continuidade:** [registro canônico da LT171](ESTADO_CANONICO_LT171_OFICIAL_20261029.md) e [auditoria LT171](LT171_DOIS_CARDS_COMPLETOS_TREINADORES_VIP_QA_20261029.md). Para LT172+, partir de `main` + `releases/latest`. Preservar PRs QA #121–#123 separadas, as duas Pokébolas e a assinatura. Não modificar backup mestre integral.

---

## HISTÓRICO — LT170 DUAS CONTAS POGOC E POKÉBOLAS INDEPENDENTES (29/10/2026)

**STATUS HISTÓRICO: LT170 0.01.70 / 54375 FOI PUBLICADA ANTES DA LT171.** PR #126 mesclada na `main`, commit de distribuição `dd39c94c80ed4199a070ba0002a6407b0bf4ccd2`. Release latest: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.70-54375 . APK `PokeSearch-v0.01.70-LT.apk` (49.510.519 bytes), SHA-256 `ebbd4a12e923b9c15ff6cd3abb8c067ee58ad1f05dd8d55ab2c7e23987afad9b`. Certificado Android v2 permanente e R8 verificados. GitHub Actions oficial #40899409701 **SUCCESS**, com publicação e checagem do digest do arquivo na API de Releases. Os usuários veem a atualização pelo fluxo GitHub Releases existente na Home e precisam confirmar a instalação.

- **Duas áreas de login PoGoCoordinates na Home:** Conta 1 mantém cookies e treinador legados, Conta 2 usa Chromium WebView `MULTI_PROFILE` com cookies e armazenamento próprios, Login Google/Discord, Gerenciar e Sair sem afetar Conta 1. Conta 2 fica indisponível quando o WebView do aparelho não suporta perfis separados.
- **Associação independente por Pokébola:** P1 e P2 escolhem Conta 1 ou 2, depois exclusivamente treinadores verificados no perfil daquela conta. Permite A/A, A/B, B/A e B/B; não altera resultados de uma Pokébola ao trocar a outra. `Sem treinador` explícito não herda outro treinador nem ativa Shiny.
- **Buscas API/DOM e Shiny:** cada serviço `OverlayService` obtém sua própria WebView e CookieManager da conta atribuída; Shiny exige código verificado da mesma conta. Cooldown e login Shiny seguem o treinador da Pokébola de origem. Alteração de conta reinicia apenas serviço afetado; não há compartilhamento de token entre contas nem benefício artificial de limites.
- **Segurança e testes:** assinaturas APK v2 permanentes, R8 e teste do cenário de isolamento de sessão no CI; testes reais de Google/Discord, WebView Samsung e Moto G15 continuam importantes. Workflow `.github/workflows/lt170-dual-accounts-signed-qa.yml`. Auditoria `docs/LT170_DUAL_POGOC_INDEPENDENT_LOGIN_BUILD_QA_20261029.md`.
- **Outras PRs:** #121 (taxa de coordenadas), #122 (Pokébola 1 e fluxo de vínculo) e #123 (Mais transparente) permanecem independentes para evitar conflitos. Nenhum código dessas PRs é presumido presente na LT170 antes de merge explícito.


### Entrega final LT170 — checklist oficial 29/10/2026
- QA anterior: [Actions #40898670734](https://github.com/LucianoToscano/PokeSearch/actions/runs/40898670734) **SUCCESS** (incluindo seleção explícita Sem treinador que impede herança de vínculo e Shiny).
- Merge PR [#126](https://github.com/LucianoToscano/PokeSearch/pull/126): `dd39c94c80ed4199a070ba0002a6407b0bf4ccd2`. O arquivo mestre e as notas de versão acompanham a `main`.
- Compilação e distribuição oficial: [Actions #40899409701](https://github.com/LucianoToscano/PokeSearch/actions/runs/40899409701) **SUCCESS**; upload Release latest, versão 0.01.70, code 54375, hash e certificado verificados. [Download direto do APK](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.70-54375/PokeSearch-v0.01.70-LT.apk).
- **Limite de QA:** não houve execução física de OAuth Google/Discord com dois logins simultâneos em Samsung/Moto G15 por este ambiente. Caso o provedor Android WebView não suporte `MULTI_PROFILE`, o aplicativo informa a indisponibilidade da segunda conta em vez de compartilhar cookies.
- PRs #121–#123 não estão incluídas neste merge. Manter sua revisão separada, sem afirmar que foram distribuídas nesta release.


## HISTÓRICO — LT169 (0.01.69 / versionCode 54374) — 29/10/2026

**LT169 É A BASE HISTÓRICA ANTERIOR À LT170.** PRs #113–#119 mescladas na main. APK oficial SOURCE_COMMIT `81503cc6e2ce7e974532503759e2d690af7aedbd`; [Release estável latest v0.01.69-54374](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.69-54374) confirmada por [Actions #40875761778 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40875761778). APK `PokeSearch-v0.01.69-LT.apk` com **49.493.674 bytes**, SHA-256 `58acf4bd0b663149e803daf411d7d0a118b7a0112da87240abda4acdb7e3f4f6`; assinatura Android v2 permanente e R8 verificados.

- **Sprites:** índice GO exato de 1.679 formas/trajes por variante e Shiny, cache SHA-1 Git, API ON / DOM OFF, Flabébé cinco cores, Floette, Florges, Furfrou trims e Shellos/Gastrodon East Sea. DOM prioriza sua própria URL; API usa a arte GO da mesma forma quando verificada. Falta real vira identificação textual, não círculo.
- **Home:** ícone discreto de alternância somente com 2+ treinadores válidos; três opções independentes de privacidade em Menu → Preferências para ocultar nome PoGoCoordinates, nome do treinador e código (Anônimo / Anônimo / XXXX XXXX XXXX), apenas na apresentação.
- **Coordenadas:** botão de card mostra valor completo sem reticências, alinhado à esquerda e quebrando linha se necessário; continua copiando o valor exato.
- **Estado dos testes:** Node completo, Android, R8, assinatura, pacote ZIP e atualização GitHub latest aprovados pelo CI; **teste visual real Samsung, API ON/OFF e P1/P2 ainda pendente**. O atualizador oferece instalação voluntária, nunca silenciosa. A LT168 anterior e Google Drive legado permanecem intocados.
- **Fonte oficial de continuidade:** [ESTADO_CANONICO_LT169_OFICIAL_20261029.md](ESTADO_CANONICO_LT169_OFICIAL_20261029.md). Não recomeçar da LT168, nem sobrescrever tags/APKs antigos; verificar main HEAD e releases/latest para toda próxima LT.

---

## HISTÓRICO — LT168 (0.01.68 / versionCode 54373) — versão anterior

**LT168 FOI A BASE CANÔNICA ANTERIOR.** PR [#112](https://github.com/LucianoToscano/PokeSearch/pull/112) mesclada em `main`, commit `b21bb0aed5f6f919a0a1d0f1d64677f908c2859f`. Release estável oficial `latest` [v0.01.68-54373](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.68-54373) publicado e validado pelo [workflow #40864077543](https://github.com/LucianoToscano/PokeSearch/actions/runs/40864077543) (SUCCESS). APK `PokeSearch-v0.01.68-LT.apk`, 49.416.673 bytes, SHA-256 `a331a28b853a23b2bbd0fc02e51d2f483646eac4d21aca717ef7e29faa3ab70f`. Preserva a assinatura permanente Android v2. O atualizador consulta `releases/latest`; instalação depende de aceite no Android.

- Corrige chat com **vinculação visual local e reversível** do UID de mensagens antigas pelo menu `⋮ → Mensagens antigas`, com foto existente e alinhamento à direita quando confirmada pelo usuário. Não inferir propriedade por nickname nem alterar autoria/regras do Firebase.
- Remove matte escuro de bordas dos próprios PNGs de modo em compartilhamentos; mantém fallback seguro e cache.
- Home agora oferece **Importar dados**, lendo o JSON v1 exportado, validando preferências e até 50 favoritos, sem importar contas, tokens, coordenadas, conversa nem alterar a segunda Pokébola.
- Regressões Node, Java e APK assinado aprovados em CI; **homologação visual Samsung P1/P2 pendente**, especialmente matte, histórico do chat e restauração JSON.
- [Registro técnico detalhado e ponto de retomada](ESTADO_CANONICO_LT168_OFICIAL_20261029.md). **Não reutilizar LT167/LT145 como base** e não republicar a tag/versão LT168. Se houver nova release posterior, revalidar GitHub HEAD e `releases/latest` antes de atualizar este aviso.

---

### LT169 — Perfis e privacidade (histórico do desenvolvimento, incluído na release oficial)

- Branch `fix/lt169-trainer-profiles-visibility-20261029` derivada de LT168. Na Home, o ícone fino `ps_trainer_switch` com duas pessoas e setas fica `GONE` quando há 0 ou 1 treinador confirmado (sem largura vazia), e aparece imediatamente à direita de `Treinador vinculado` apenas para dois ou mais treinadores distintos. Substitui o antigo botão largo `Perfis/Escolher (N)`; seletor e broadcast preservados.
- Contagem usa códigos/nome válidos e elimina duplicatas, alinhada ao seletor; entrada normal de gerenciamento do vínculo permanece no card.
- Testes: `app/tests/lt169-trainer-profiles-visibility.test.js` + atualização da regressão LT141. CI LT169 completo aprovado; validação visual Samsung 0/1/2+ permanece pendente.
- **Privacidade na Home:** 3 checkboxes independentes em `☰ → Preferências`, todos ON por padrão. Ocultar nome PoGoCoordinates ou treinador exibe **Anônimo**; ocultar código exibe **XXXX XXXX XXXX**. Atualiza imediatamente, não altera login/identificadores/sessão/P1/P2; código real continua copiável. Persistência local, sem incluir essas flags no JSON de exportação. Teste `lt169-home-identity-privacy.test.js`; validação física pendente.
- Registro [LT169 visibilidade de Perfis](POKESEARCH_LT169_PERFIS_TREINADORES_VISIBILIDADE_QA_20261029.md). **Mesclado na LT169 oficial; este parágrafo documenta o estado de QA anterior à publicação**.


## LT145 0.01.45 — atualização oficial global via GitHub (29/10/2026)

- **Publicação oficial CONFIRMADA:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.45-54350 — estável, não pré-lançamento, disponível em `releases/latest`.
- **APK oficial:** `PokeSearch-v0.01.45-LT.apk`, 49.405.343 bytes, SHA-256 `72be16d527bfeb977840ef7fef73ff5a38e60be52bbae9ed9f8a577ad75d90dd`; versão 0.01.45 (54350) e certificado Android v2 permanente verificados.
- **Publicação e validação:** GitHub Actions https://github.com/LucianoToscano/PokeSearch/actions/runs/40810267067 — SUCCESS, merge main preservado, download e assinatura verificados. Fonte exata do APK QA22: `87bd4988b056186d3c8254d021f7df2cb22994b1`.
- **Atualização no app:** `GitHubUpdateCenter` consulta `releases/latest`; só usuários com `versionCode < 54350` são elegíveis ao aviso e à instalação voluntária. APKs QA com versionCode 54350 exigem instalação manual do APK oficial; a atualização nunca é silenciosa.
- **Ponte legada Google Drive:** o arquivo público `atualizacao.json` (ID `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf`) ainda anunciava LT144 no momento da auditoria; não declarar que esse canal foi atualizado. Atualizá-lo exige publicar APK LT145 na pasta Drive e substituir o manifesto com a referência/verificação SHA correta.
- **Limitações de QA:** validação física específica da QA22 em ambos os overlays ainda pendente; pode haver placeholder para formas especiais sem sprite exata. Não confundir CI SUCCESS com teste Samsung.

## LT145 QA22 — acabamento do card, Rank e rolagem (29/10/2026)

### Distribuição e merge QA22 — verificado (29/10/2026)

- **PR #96 mesclada na main:** https://github.com/LucianoToscano/PokeSearch/pull/96 · merge commit `dd9366268b3c29d3ba34d263d32973307ec911a4`. Conflitos resolvidos preservando os cinco workflows de distribuição que já existiam na main e as regras de entrega em AGENTS.md.
- **Testes e build:** GitHub Actions regressão [#40807041098](https://github.com/LucianoToscano/PokeSearch/actions/runs/40807041098) e compilação assinada [#40807041234](https://github.com/LucianoToscano/PokeSearch/actions/runs/40807041234) ambos **SUCCESS**; `SOURCE_COMMIT=87bd4988b056186d3c8254d021f7df2cb22994b1`.
- **Pré-lançamento público QA22 no GitHub:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.45-54350-qa22-card. APK `PokeSearch-LT145-QA22-CARD-COMPACTO.apk`, **49.405.343 bytes**, SHA-256 `72be16d527bfeb977840ef7fef73ff5a38e60be52bbae9ed9f8a577ad75d90dd`, Android v2 e certificado permanente validados, `versionName=0.01.45`, `versionCode=54350`.
- **Limite da distribuição:** Release é **pré-lançamento de teste** para instalação manual; não altera manifest de atualização, Firebase `distribution/globalEnabled` nem faz atualização automática em massa. Homologação no Samsung/P1/P2 **ainda não comprovada** e é requisito anterior à distribuição global estável. Não afirmar que todos receberam atualização automática.
- **Limitação conhecida:** faltas de sprite exata em determinadas formas (por exemplo Shellos West Sea) recebem fallback neutro; correção do pacote de artes exactas ainda requer verificação.



- **Branch preservada:** `feature/lt145-coords-quota-account-20261028`. Base QA21 — sem recomeçar e sem descartar Premium, alertas, API, localização, cooldown e duas Pokébolas.
- **Card:** mantém largura externa de **200 dp**, cabeçalho com número/sexo/tamanho/forma imediatamente sob nome, botões de 23 px e Despawn abaixo da estrela. Espaços verticais aparados. Caixas IV/PC/Nv. com **23 px de altura**, larguras responsivas e conteúdo não sobreposto; tipos originais à esquerda no IV e porcentagem verificada à direita.
- **Rank:** selo de vidro dourado compacto (★ Rank 1), alinhado à esquerda imediatamente sob IV/PC/Nv.; invisível quando rank não existe.
- **Rolagem:** card fechado passa a ocultar rolagem desnecessária; classe `needsScroll` habilita rolagem quando altura real ultrapassa o painel após o redimensionamento nativo. Evoluções PvP continuam expansíveis e roláveis quando necessário.
- **Sprites:** mantém resolução exata online/offline, ajuste de Gengar Halloween e padronização por alfa quando imagem permite; fallback neutro ◉ quando a imagem exata falhar, sem substituir por forma errada. A falta de arte exata permanece pendência de acervo.
- **Atualizações:** notas QA22 incluídas na Home em `app/src/main/assets/release_notes.json`; documento de QA em `docs/POKESEARCH_LT145_QA22_CARD_DISTRIBUICAO_20261029.md`.
- **Regra de entrega:** testes e APK assinados verificados antes de divulgar; **não habilitar Firebase/globalEnabled nem publicar atualização universal sem homologação Samsung P1/P2**. Status da distribuição deve constar no documento específico.



### LT134 — Premium Google sobre base LT133, sem regressão (27/10/2026)

- **Base real preservada:** LT133 / PR #92; branch LT134 `feature/lt134-google-premium-preserve-lt133-20261027`, PR #95 **Draft** para LT133, não main. QA `0.01.34 / 54339`; NÃO usar a LT125 antiga como atualização.
- **Google Premium:** instância Firebase própria `PokeSearchPremiumIdentity`, Credential Manager, mesmo projeto `pokesearch-lt` e UID da conta do painel Deus Ivern. `PokeSearchStats` anônimo, admin Google do chat e login PoGoCoordinates preservados. `PremiumAccess` valida token/lease no servidor sem persistir privilégios; P1/P2 usam `OverlayService` compartilhado e flags somente em build QA protegido.
- **Sprites/chat LT133 mantidos:** assets de 1025 base, 1025 shiny, 716 formas, 16 trajes; Halloween 2021 Pikachu/Piplup/Drifblim normais/Shiny; capturas compactas em duas linhas, rolagem e reações. Testes estáticos LT134 e suíte completa LT133 passaram.
- **CI e APK QA:** [GitHub Actions SUCCESS #40509063977](https://github.com/LucianoToscano/PokeSearch/actions/runs/40509063977), [Artifact #12735304713](https://github.com/LucianoToscano/PokeSearch/actions/runs/40509063977/artifacts/12735304713), SOURCE_COMMIT `6084f354c9053d0e98be34b61af4958e5c2aa68d`. APK `PokeSearch-v0.01.34-LT134-Halloween-Chat-Gmail-Premium-QA.apk` **46.426.701 bytes**, SHA-256 `613c3cf77315b15074639b2c0cd317886f04d595822b316a03a161a637d7a8e9`. ZIP **43.772.922 bytes**, SHA-256 `a229f66d558f02392dbff90c29113ba0122f885cc5fa7f2e47e8229591981706`, CRC OK. Certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; SHA-1 `dd7bf665e1d47a257fc557b51cb5a57dfd13cb96`; v2 confirmado.
- **Segurança:** build LT134 QA controlado usa Netlify Deus Ivern, pagamentos desativados; sem alteração nas Rules RTDB nem no site Netlify. Firebase `distribution/globalEnabled` e `versions/54339` continuam desabilitados por padrão. Assim **P1/P2 não funcionarão até que a versão QA seja liberada expressamente**; login Google na Home pode ser testado, mas instalação sobre aparelho principal não é recomendada sem plano de retorno. APKs normais mantêm controle OFF.
- **Pendências:** teste Samsung real Gmail/Premium, P1/P2, login chat, costumes, filtros/notificações, revogação, recuperação após reinstalação; não marcar como homologação física. Seguir [doc LT134](POKESEARCH_LT134_PREMIUM_GMAIL_PRESERVE_LT133_20261027.md) e entrega GitHub primeiro (evitar `Library file not found`).


### LT133 — Halloween 2021 e chat de capturas compacto (27/10/2026)

- Branch `feature/lt133-halloween-sprites-compact-chat-20261027` sobre LT132, PR [#92](https://github.com/LucianoToscano/PokeSearch/pull/92), **QA versionName 0.01.33 / versionCode 54338**, não mesclar main nem publicar release estável sem QA física.
- **Problema identificado via screenshots Samsung:** Piplup #393 e Drifblim #426 `Halloween 2021 Costume` sem roupa/sprite no overlay, enquanto PoGoCoordinates mostra a imagem. Resolvido por assets GO **exatos** PokeMiners `cHALLOWEEN_2021_NOEVOLVE`, commit fixo `c2a686eb08ace6e890d8fe3d2134c76988db87b5`; seis PNGs (Pikachu #25, Piplup #393, Drifblim #426 normais/Shiny), SHA1 de blob verificado, 16 trajes no pacote. `sprite_offline.js` usa aliases EXATOS de Halloween 2021 em resultados e detalhes de P1/P2, sem trocar outros anos pelo sprite base.
- **Chat:** captura com **máximo 2 linhas de conteúdo**: [sprite 27dp margem 2dp] `✨ Luciano capturou um Natu!`; abaixo **faixa única e pequena alinhada à direita**: ícone Hundo/Shundo/Nundo/Shnundo ou IV, GL/UL real, tamanho, sexo **último** e relógio no canto direito. Os atributos deslizam horizontalmente caso a tela seja estreita. Sem `Detalhes ▾`, PC, nível, golpes ou boost na mensagem nova; 4 reações continuam como ações comuns abaixo. Mensagens antigas continuam legíveis.
- **Sem mudança RTDB:** `chat/messages/text` até 240 caracteres, sem coordenadas, JWT ou campos novos. Ao copiar coordenadas continua normal; publicar exige dois toques com confirmação explícita. Firebase `stats`, `premium`, `distribution` e 4 reações intactos.
- **QA produzida e auditada:** [CI SUCCESS #40487294368](https://github.com/LucianoToscano/PokeSearch/actions/runs/40487294368), [APK no artifact GitHub #12724984304](https://github.com/LucianoToscano/PokeSearch/actions/runs/40487294368/artifacts/12724984304), commit de fonte `0e14189a41e66141d88c02b616e0f46243b581b6`. `PokeSearch-v0.01.33-LT133-Halloween-Compact-Chat-QA.apk` **43.516.597 bytes**, SHA-256 `d2e080863f97b22c716ca3ed8524fe2c59ef4f1953c707e44b17361409656a01`; ZIP **41.027.323 bytes**, SHA-256 `2170b393ffd28b4ae61ab6e3bfab8f0d33eaa26423d7e673783aa610b1138c97`, CRC íntegro. Android assinatura v2 permanente certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; 16 trajes e **seis PNGs Halloween 2021 normal/shiny** auditados no APK. Testes Node e Android CI passaram; teste Samsung físico ainda obrigatório.
- Referência: [POKESEARCH_LT133_HALLOWEEN_COMPACT_CHAT_20261027.md](POKESEARCH_LT133_HALLOWEEN_COMPACT_CHAT_20261027.md). Entregar APK pelo GitHub Actions antes de sandbox (Issue #84).


### LT132 — Card compacto de captura e correção do chat rolável (27/10/2026)

- PR [#91](https://github.com/LucianoToscano/PokeSearch/pull/91), branch `feature/lt132-capture-card-badges-sex-last-20261027` empilhada na LT131 #90. QA `0.01.32 / 54337` com assinatura permanente. Main/release estável preservados.
- **Conquistas:** mini sprite + `🎉 Luciano capturou um Quagsire!` sem repetir IV no título. Selos usam os **ícones dos menus** (`StarIVRaw`, `StarGL`, `StarUL`); Hundo/Shundo/Nundo/Shnundo usam ícones existentes. Tamanho embaixo; **sexo é SEMPRE o último atributo**, com ♂ azul e ♀ rosa; valores ausentes são omitidos. Apenas rank PvP que existe no card com fonte `api-pvp` ou `explicit-species-iv` e liga associada. `Detalhes ▾` revela PC, nível, golpes e boost confirmados.
- **Firebase:** nenhuma alteração de regra ou estrutura: as conquistas via confirmação dupla são apenas `chat/messages/text` (até 240 caracteres, com metadados compactos), mantendo posts LT131, reações ❤️ 👍 🎉 ✨️ e privacidade sem coordenadas. P1/P2 usam `OverlayService` compartilhado.
- **Bug crítico da Home/chat:** `MainActivity` usa `stage1HomeScroll`; `CommunityScrapbookOnline` usa `timeline` aninhado. Novo detector de limite repassa o arraste para Home quando timeline está no topo/fim e **libera imediatamente no ACTION_DOWN se chat curto não pode rolar**, restaurando o acesso à parte inferior e ao campo de digitação. Novas mensagens fazem autoscroll somente se já estava perto do fim ou na primeira carga; reações/detalhes não alteram a posição de leitura.
- **QA assinada confirmada:** CI GitHub Actions [#40482871143](https://github.com/LucianoToscano/PokeSearch/actions/runs/40482871143) SUCCESS e [artifact #12724036682](https://github.com/LucianoToscano/PokeSearch/actions/runs/40482871143/artifacts/12724036682) com APK e relatórios. Fonte compilada `5a47998fddc0bc42077e11442505655e1e459b33`; mudanças posteriores são apenas testes/documentação. APK `PokeSearch-v0.01.32-LT132-Capture-Badges-Scroll-QA.apk`, 43.375.725 bytes, SHA-256 `d9ec2a10d8c64ae106d425030ed8a71c07150b4935d23b841ef5fe8c566d4534`; ZIP 40.889.410 bytes SHA-256 `5cda01b6def945af746a72689042a3bcd6ea4fea46e83328ac4aa3cf0a1552e6`. ZIP/APK CRC OK, SHA256SUMS corresponde, Android v2 assinado com certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; verificados ícones `StarIVRaw`, `StarGL`, `StarUL` e Quagsire #195 no APK. Inclui detector `ACTION_DOWN` que passa gesto à Home quando chat curto não rola. Testes em Samsung físico de Home+chat e em duas contas ainda pendentes.
- Documento técnico: [POKESEARCH_LT132_CAPTURE_BADGES_CHAT_SCROLL_20261027.md](POKESEARCH_LT132_CAPTURE_BADGES_CHAT_SCROLL_20261027.md).



### LT131 — Sprite + IV nos anúncios de captura (27/10/2026)

- **Branch:** `feature/lt131-capture-sprites-ivs-20261027` na LT130; PR [#90](https://github.com/LucianoToscano/PokeSearch/pull/90), Draft, sem merge main.
- **Visual aprovado:** [sprite normal Beldum] `🎉 Luciano capturou um Beldum 0/15/14!`; [sprite Shiny Ditto] `✨ Luciano capturou um Ditto 15/15/15!`. Mini sprite **38dp** dentro da bolha, nickname correto, reação e horário preservados; conversas comuns inalteradas.
- **Origem real:** IV A/D/S `0..15/0..15/0..15` é lido do resultado já selecionado no `OverlayService` compartilhado por P1/P2; quando IV inválido/ausente, omitir em vez de inventar. Nome/forma vêm do card. Sprite da espécie obtida por correspondência exata em `pokemon_catalog.json` (Ditto #132, Beldum #374) com sprites offline base/shiny da QA. Nunca inventar sprite de costume/forma desconhecida.
- **Firebase:** anúncio usa somente `chat/messages` (quatro campos anteriores), sem alteração nas regras públicas/reactions/stats/premium/distribution, sem compartilhar coordenadas, CP, GPS, token ou reveal. Não declara captura verificada pelo jogo: o usuário confirma voluntariamente num botão discreto inline após copiar Get coords, como na LT129.
- **QA produzida e auditada:** `0.01.31 / 54336`, [CI SUCCESS #40476951765](https://github.com/LucianoToscano/PokeSearch/actions/runs/40476951765), [APK no GitHub Artifact #12721646113](https://github.com/LucianoToscano/PokeSearch/actions/runs/40476951765/artifacts/12721646113). SOURCE_COMMIT `d6f867921960f15c1d161d9fe236617625c89b8a`. APK `PokeSearch-v0.01.31-LT131-Capture-Sprites-IVs-QA.apk`, 43.375.725 bytes, SHA-256 `dae7719a47738d8cc8b6ad32c241db9f127c8f8d564ea57e563fc0836675be15`; ZIP 40.884.676 bytes CRC OK, SHA-256 `22ecf0b7b0b071f1c662c80c40c2f1076a2147d92ba6754c360a2566a42713da`; Android v2 permanente certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Inspecionados sprites normais Beldum #374 e Shiny Ditto #132 dentro do APK. GitHub primeiro por Issue #84. Testes em Samsung e com duas contas necessários; não declarar homologação física sem os mesmos.
- Docs: [POKESEARCH_LT131_CAPTURE_SPRITES_IV_20261027.md](POKESEARCH_LT131_CAPTURE_SPRITES_IV_20261027.md).


### LT130 — Reação ✨️ no Chat (27/10/2026)

- PR [#89](https://github.com/LucianoToscano/PokeSearch/pull/89), Draft empilhada na LT129 PR #88, branch `feature/lt130-sparkle-reaction-20261027`; versão QA `0.01.30` / `54335`. Não mesclar/release oficial sem QA físico.
- Quatro reações disponíveis para mensagens: ❤️ 👍 🎉 **✨️** (U+2728 + FE0F), todas compactas no mesmo conjunto, uma escolha por UID/mensagem; toque alterna/remove sem criar notificações.
- Firebase: novo valor exato `✨️` permitido em `chat/reactions/$messageId/$uid`; gravação apenas pelo próprio UID, exige mensagem existente; nenhuma modificação em messages, avatars, admin, P1/P2 ou estatísticas.
- Regras **atuais fornecidas pelo usuário** incluem `premium` e `distribution` bloqueados; template completo fiel em [POKESEARCH_LT130_FIREBASE_RULES_PRODUCAO_COMPLETAS.json](POKESEARCH_LT130_FIREBASE_RULES_PRODUCAO_COMPLETAS.json). **Não foi implantado** automaticamente; backup e colar no Console preservando as regras exatas de produção.
- Teste Node `app/tests/lt130-sparkle-reaction.test.js`, CI Android v2/R8 assinado e conferência do artefato GitHub. Faltam teste real Samsung e Firebase RTDB em produção. A função discutida de edição em até 30 min permanece fora do escopo da LT130.



### LT129 — Capturas voluntárias e reações no Chat (27/10/2026)

- **Branch:** `feature/lt129-capture-share-chat-reactions-20261027`, PR [#88](https://github.com/LucianoToscano/PokeSearch/pull/88) empilhada na LT128. **QA assinada validada**: 0.01.29 / 54334, SOURCE_COMMIT `287714827fd80b16911134e895395ffe6424d706`; [CI sucesso #40472467296](https://github.com/LucianoToscano/PokeSearch/actions/runs/40472467296), [APK e relatórios Artifact #12718609297](https://github.com/LucianoToscano/PokeSearch/actions/runs/40472467296/artifacts/12718609297). APK `PokeSearch-v0.01.29-LT129-Capture-Reactions-QA.apk` 43.375.725 bytes, SHA-256 `9f0f59009af20330171769524ae368871d7e71e6999265488e301ac52586e838`. ZIP 40.883.213 bytes, SHA-256 `6caa397be2d9bd97d7cb20d041b96399af5e6cf929cd8b8076071a670fc4eb0c`, CRC OK; assinatura Android v2 com certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Sem mexer na main, release estável, Firebase real ou backup integral.
- **Get coords:** copiar continua inalterado na P1/P2. Somente com cartão aberto e cópia bem-sucedida aparece discretamente `🎉 Capturou? Compartilhar no chat`. O jogador deve tocar, ver a confirmação inline `Capturou mesmo?` e tocar **✓ Sim, compartilhar** para publicar; não é captura detectada pelo app. Tocar longo, ignorar ou fechar não gera popup nem postagem. API/DOM preservados.
- **Mensagem:** `Apelido: 🎉 Capturou um Pokémon ✨!` conforme nome/shiny confiáveis do resultado, usando `chat/messages` e `ServerValue.TIMESTAMP`. Não enviar coordenadas, localização, IV, CP, reveal_code ou dados individuais.
- **Reações:** ❤️, 👍, 🎉, até uma por UID/mensagem em `chat/reactions`; tocar novamente desfaz, outro emoji substitui. Contagem em tempo real com UI compacta, sem autoscroll, sons ou notificações.
- **Segurança:** rules versionadas e modelo de produção acrescentam somente `chat.reactions`, preservando `stats` integralmente. **Não publicado em Firebase produção**: antes de usar reações é necessário mesclar este nó às Rules do RTDB ao lado de messages/avatars, mantendo contadores online/instalações já ativos.
- **Testes:** `app/tests/lt129-capture-share-reactions.test.js`, CI Android/Node assinado. Prova de funcionamento Samsung/API/DOM/diferentes contas ainda pendente.
- Detalhes e regras: [POKESEARCH_LT129_CAPTURE_SHARE_REACTIONS_20261027.md](POKESEARCH_LT129_CAPTURE_SHARE_REACTIONS_20261027.md). Entregar GitHub artifact primeiro, nunca só link ChatGPT `sandbox`.


### LT128 — QA final assinada e auditada (27/10/2026)

- **GitHub Actions SUCCESS:** [run #40468096447](https://github.com/LucianoToscano/PokeSearch/actions/runs/40468096447) com [APK e relatórios no artefato #12717366645](https://github.com/LucianoToscano/PokeSearch/actions/runs/40468096447/artifacts/12717366645). Fonte exata do APK: commit `89bedec26f7925325c3020ddee16526cf773c8e4` (posteriormente somente documentação atualizada).
- **APK:** `PokeSearch-v0.01.28-LT128-Google-Admin-QA.apk`, versionName `0.01.28`, versionCode `54333`, applicationId `com.lucianotoscano.pokesearch`; tamanho 43.358.837 bytes; **SHA-256 `e21cf9757625dc4d0a9922a129260d29542292237d1d46e80f11056df1040164`**, coincidente com o arquivo `SHA256SUMS.txt` do ZIP.
- ZIP de download GitHub 40.880.754 bytes; SHA-256 `425630185d26fa7fa533828ebc0a89c89edd4cc6d972d7bd89896de7ea10dcba`; ZIP CRC íntegro. Todos os 2.776/2.776 hashes dos sprites do manifesto conferidos com os bytes do APK (1.025 base, 1.025 Shiny, 716 forms, 10 costumes). Certificado v2 SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; SHA-1 `dd7bf665e1d47a257fc557b51cb5a57dfd13cb96`. Android minSdk 26, targetSdk 33, compileSdk 36.
- **OAuth:** Web Client ID do `google-services (2).json` verificado presente nos arquivos DEX do APK; Google e Anônimo estavam ativados no Console Firebase conforme capturas. Não foi utilizada nem embutida a chave privada da conta de serviço enviada anteriormente.
- **Defeito de entrega corrigido:** primeira execução gerou APK correto mas anexou nome de arquivo errado, e o ZIP tinha apenas relatórios apesar de build SUCCESS. Nova execução possui guarda `test -f "$QA_APK"`, tamanho acima de 30 MB, `sha256sum --check` e `unzip -t` ANTES de fazer `upload-artifact`; artefato real de ~40,9 MB foi inspecionado depois e contém APK correto. Seguir Issue #84, **GitHub primeiro**.
- **Pendentes:** escolha de conta Google e validação FirebaseAuth reais no Samsung, exclusão restrita por RTDB após login, teste entre dois usuários, e preservação de ativos/instalações após trocar sessão de admin. PR [#87](https://github.com/LucianoToscano/PokeSearch/pull/87) segue Draft empilhada na LT127 PR #86, sem merge nem release estável ou deploy de rules.


## LT128 — OAuth Google administrador do chat (27/10/2026)

- **Origem verificada:** arquivo `google-services (2).json` enviado pelo usuário (configuração **cliente** do Firebase, sem chave privada). Projeto `pokesearch-lt`, pacote `com.lucianotoscano.pokesearch`, OAuth tipo 1 Android com SHA-1 `dd7bf665e1d47a257fc557b51cb5a57dfd13cb96`, OAuth tipo 3 **Web Client ID** `1007816617051-abhc4riftns3om8gs0o67ce1s386ue9d.apps.googleusercontent.com`.
- **Implementado:** `app/build.gradle.kts` adota o Web Client ID **público e verificado** como default de `CHAT_GOOGLE_WEB_CLIENT_ID`; `app/chat-google-oauth-public.json` mantém proveniência (somente identificadores públicos, sem API key ou Firebase Admin SDK). CI assinado usa o mesmo ID e executa `lt128-google-admin-oauth.test.js` para garantir versão, SHA-1, pacote, isolamento de Firebase Admin e rules restritas. Não misturar OAuth Android client com client Web. Código LT127 que autentica `FirebaseAuth.signInWithCredential(GoogleAuthProvider.getCredential(...))` passa a alcançar escolha de conta Google em vez de mensagem de cliente ausente.
- **Versão QA planejada:** `0.01.28 / 54333`, branch `fix/lt128-google-admin-oauth-20261027` **base LT127/PR #86**, assinatura permanente e artefato GitHub principal. Preservar `main` e versões anteriores, não publicar release estável nem fazer merge automaticamente.
- **GO/NO-GO:** nenhum token Google foi usado pelo assistant; autenticação real no Samsung e privilégios de exclusão no Firebase devem ser demonstrados após instalação. A tela do Firebase mostrada pelo usuário tem Google e Anônimo ativos; não comprova o sucesso OAuth no aplicativo. As regras de produção foram editadas manualmente pelo usuário nas etapas anteriores; não fazer deploy automatizado sem ler o estado real e preservar `stats/online` e `stats/installations`.
- **Segurança:** `firebase-adminsdk-...json` enviado anteriormente contém uma chave privada de serviço. **Nunca** incluir em GitHub, APK, CI ou logs. Recomendação de revogação/rotação já comunicada; isso não é necessário para configurar OAuth cliente.
- Para detalhes técnicos ver `docs/POKESEARCH_LT128_OAUTH_ADMIN_20261027.md`.


## LT127 — Foto opcional e administração do Chat (27/10/2026)

- Nova PR [#86](https://github.com/LucianoToscano/PokeSearch/pull/86) Draft, baseada na LT126 PR #83; `main` preservada. Escopo exclusivamente Chat, sem tocar em P1/P2, API/DOM ou stats.
- Foto escolhida da galeria com autorização explícita; imagem JPEG 96×96 comprimida, máximo 24.000 caracteres, armazenada em `chat/avatars/$uid` (RTDB); foto Google **não importada automaticamente**. Miniaturas dos autores nas mensagens; foto opcional/removível.
- Apelido editável por lápis no cabeçalho, substitui `Chat PokeSearch`; mantém limite de 24 caracteres e timestamp nas mensagens.
- Admin exclusivo validado pelo **token Firebase Auth `google.com` + `email_verified=true` + `lucianotoscano@gmail.com`** nas Rules; opções de apagar mensagem e limpar chat sob confirmação. O login WebView PoGoCoordinates Google é separado e não concede admin. Para não trocar o UID anônimo de contadores, conta admin usa FirebaseApp nomeado `PokeSearchChatAdmin`, sem alterar `PokeSearchStats`.
- Dependência real ainda pendente: o `google-services.json` disponível não possui `oauth_client`; requer ativar Google em Firebase Authentication, registrar Android OAuth com SHA-1 do certificado permanente `dd7bf665e1d47a257fc557b51cb5a57dfd13cb96`, fornecer Web OAuth Client ID válido em secret GitHub `POKE_CHAT_GOOGLE_WEB_CLIENT_ID` e compilar nova QA. Sem ID, o administrador **não é ativado**; a foto e o chat normal seguem utilizáveis.
- Rules versionadas só alteram `chat`, mas **não publicar arquivo inteiro** sobre a produção atual: o console exibia `stats/online` e `stats/installations` com leitura autenticada, diferente de rules antigas do repositório; integrar somente o bloco `chat` e preservar o resto.
- Guia detalhado em [POKESEARCH_LT127_CHAT_AVATAR_GOOGLE_ADMIN_20261027.md](POKESEARCH_LT127_CHAT_AVATAR_GOOGLE_ADMIN_20261027.md); testar duas contas, avatar, troca de apelido, exclusão bloqueada anonimamente, exclusão admin após OAuth e preservação dos contadores.
- **QA assinada:** [CI #40463733833](https://github.com/LucianoToscano/PokeSearch/actions/runs/40463733833) SUCCESS, [GitHub artifact #12716390819](https://github.com/LucianoToscano/PokeSearch/actions/runs/40463733833/artifacts/12716390819), APK `0.01.27` / `54332`, SOURCE_COMMIT `5387eabbb294e8292a2661171e2ad6c599e644f9`, 43.358.837 bytes SHA-256 `272016a07993ceb2bf1b4e417ead04b5a87a42ac152b32e8d1931172ea2c3c0d`; ZIP 40.880.603 bytes, SHA-256 `c47e291c3c63de557f8d1d9df69b474457f6e97836c6b321636d3f11c6ca9161`, CRC 100% íntegro, assinatura v2 permanente verificada. Aponta primeiro ao GitHub (AGENTS #9), nunca somente sandbox. Certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Limite real do build:** o cliente OAuth web Google ainda não aparece configurado no APK QA; admin depende de Firebase Authentication Google + Web Client ID verdadeiro e integração manual APENAS das rules `chat` no Firebase em produção, sem alterar stats. A existência de botões/regras no repositório não concede privilégios em produção antes disso. QA física ainda não testada, sem release estável nem deploy.


## ALERTA PERMANENTE — Falha recorrente de entrega `Library file not found` (27/10/2026)

- O usuário relatou e demonstrou repetidas vezes o toast **`Library file not found`** ao acessar anexos de APK/ZIP entregues pelo ChatGPT no Android. Classificação: **falha de distribuição de arquivos pelo ChatGPT (não confundir com Gradle/assinatura)**.
- **Regra mandatória em `AGENTS.md` #9** e procedimento completo em [PROTOCOLO_ENTREGA_APK_SEM_LIBRARY_NOT_FOUND.md](PROTOCOLO_ENTREGA_APK_SEM_LIBRARY_NOT_FOUND.md).
- **NUNCA** fornecer link `sandbox:` como único download nem declarar o APK disponível ao usuário apenas com a existência do arquivo no container. Primeiro fornecer URL verificada de **GitHub Actions artifact**, indicar login/expiração; link interno opcional. Em caso de falha no ChatGPT, direcionar imediatamente ao GitHub sem recompilar.
- Conferir SHA-256, bytes, arquivo ZIP (CRC), certificado, SOURCE_COMMIT, versionCode e limite de 199 MB; não criar Release estável ou fazer merge sem autorização específica.
- LT126 referência: [QA artifact #12708327476](https://github.com/LucianoToscano/PokeSearch/actions/runs/40446596976/artifacts/12708327476), SHA-256 APK `ba9e8b0ce32111567233646c31250b659e91985fb5d9da0d01d83d23a0c9bd0b`. Artifact GitHub existe no checkpoint consultado e é uma alternativa ao link defeituoso do ChatGPT. Isso não garante que o serviço externo nunca falhe.


## LT126 — Chat Firebase + primeiro catálogo GO WatWowMap (27/10/2026)

- Branch `fix/lt126-chat-wwm-catalog-sprite-audit-20261027`, PR #83 Draft **baseada na PR #80 LT125**. `main` permanece LT124, sem merge e sem release oficial.
- Captura do usuário: Home ainda estava em `0.01.24`, mostrando chat sem ler/enviar e contadores `—`; não era a QA R2. Código corrigido para inicializar o app Firebase nomeado independentemente da ordem de montagem, só liberar envio após leitura do feed, distinguir `PERMISSION_DENIED` e permitir reconexão. **Sem deploy de Rules em produção**, chat entre dois usuários reais ainda NO-GO.
- Fonte realmente integrada no build: `WatWowMap/pogo-data-api` commit `42b315f317ca8cee8e178249328eab5173e5ca70`. Importador valida, versiona e empacota JSON/JS **offline** com 1.025 espécies, 1.506 formas, 87 trajes, PT-BR e SHA-256 da origem. `dock.html` e `detail.html` carregam mesmo catálogo, sem chamadas extras durante Search API/DOM.
- Correção de imagem exata: Pumpkaboo #710 Average ID 2641 e Gourgeist #711 Average ID 2645 apontam para as bases verificadas, nunca para Small/Large/Super; Drifblim #426 comum permanece base. `api_result_contract.js` preserva `form_id` documentado apenas quando recebido. P1/P2 compartilham resolvedor sem misturar filtros/estado.
- UIcons, wwm-uicons (index examinado), HomeIcons, ShuffleMap e PokeMiners: inspecionados como fontes de alternativas; **nenhum novo PNG redistribuído** sem verificar identidade e condições por arquivo. Manter as 2.776 sprites R2 e as dez artes especiais já existentes.
- **APK QA ASSINADO CI SUCCESS**: [workflow #40446596976](https://github.com/LucianoToscano/PokeSearch/actions/runs/40446596976), [artifact #12708327476](https://github.com/LucianoToscano/PokeSearch/actions/runs/40446596976/artifacts/12708327476). SOURCE_COMMIT `4e8475af7c093ffd70be63364f2d1bf64d846bc8`; versão `0.01.26` / `54331`. APK 43.337.972 bytes SHA-256 `ba9e8b0ce32111567233646c31250b659e91985fb5d9da0d01d83d23a0c9bd0b`; assinatura v2 e certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` válidos. Extração do APK: 2.776/2.776 hashes de sprites conferidos, zero divergências. ZIP 40.852.206 bytes, abaixo de 199 MB.
- **Pendentes:** Firebase live RTDB Rules/autenticação/contadores, mensagens entre dois aparelhos/usuários, validação Samsung visual para P1/P2, API/DOM em rede lenta. Código aprovado não substitui homologação física. Relatório: `docs/POKESEARCH_LT126_CHAT_WWM_CATALOG_20261027.md`.


## LT125 QA-R2 — APK assinado com recuperação Noibat e 317 variedades offline (26/10/2026)

- **Build QA R2 comprovada:** [GitHub Actions #40437190589](https://github.com/LucianoToscano/PokeSearch/actions/runs/40437190589) SUCCESS, [artifact #12704732660](https://github.com/LucianoToscano/PokeSearch/actions/runs/40437190589/artifacts/12704732660). Commit-fonte do APK `3aabc5450aaa057417a77d6f9db3ea24a2fb7b6c`; `versionName 0.01.25` / `versionCode 54330`; APK `PokeSearch-v0.01.25-LT125-Samsung-Sprites-QA-R2.apk` de **43.289.081 bytes**, SHA-256 `f9c5beeafdb8fbd413488a5f3283f02f770a6317a9ac6aa7f091b2dc39cebea1`. Assinatura Android v2 e certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` verificados pelo CI e relatório extraído do artefato.
- **Auditoria binária independente:** manifest e bytes no APK conferidos: 1.025 base, 1.025 Shiny, 716 PNGs formas (82 anteriores: 80 LT116 + 2 LT119; mais 317 variedades normais e 317 Shiny de commit PokeAPI fixado), 10 trajes. **2.776/2.776 SHA-256 corretos; zero arquivo faltante**. Os 80 sprites LT116 conferem byte a byte com o ZIP original.
- **Causa de parte dos vazios Samsung:** `probe.js` transmite `form:""` em cards comuns; `sprite_offline.js` antigo exigia form explicitamente Normal/Default/nome, impedindo recuperar o PNG já no APK de Noibat #714 e outros sem URL. Correção usa 1.025 nomes Dex canônicos com verificações de forma/traje/região e resolve normal ou Shiny localmente. Em `dock.html`, imagem já completa mas quebrada inicia o fallback verificado imediatamente.
- **Regressão:** testes Node e Java, Android compile/R8/assinatura e auditoria de pacote PASS. Os testes novo `lt125-samsung-empty-form-sprites.test.js` cobrem 2.050 formas-base normais/Shiny sem rótulo e exclusões de variantes; `lt125-all-offline-varieties.test.js` cobre 317 variedades normal/Shiny; ajustes em testes legados que esperavam imagens HTTP.
- **Limites:** screenshot não demonstra que todos os círculos vazios têm a mesma causa; formas GO sem arte exata ainda podem usar placeholder neutro. Testes físicos do Samsung, Firebase contadores em produção e chat real entre dois usuários continuam pendentes. **PR #80 continua Draft; `main` LT124 preservada, nenhum merge/publicação estável.**
- **Fontes:** inventário de 95 itens fornecido pelo usuário é referência; não ativar novos scrapers no app. Direitos de imagens de terceiros são independentes da autorização do proprietário do app. Detalhes em [relatório Samsung/Fontes](POKESEARCH_LT125_QA_R2_SPRITES_SAMSUNG_FONTES.md).


## LT125 QA-R2 — Recuperação de sprites vazias no Samsung (26/10/2026)

- **Evidência:** screenshot do usuário exibiu Noibat #714 sem sprite no card (◇) e vários círculos (◉) na coluna de resultados.
- **Causa de código isolada:** `probe.js` fornece `form:""` em espécies comuns sem forma etiquetada; `sprite_offline.js` só recuperava base local se o campo fosse NORMAL/DEFAULT/nome da espécie. Logo Noibat podia não usar o PNG base/shiny já presente no APK. Não inferir que todas as imagens do print têm a mesma causa sem logs físicos.
- **Correção:** tabela exata 1.025 Dex/nomes do catálogo local, verificação de identidade antes de resolver base/shiny em forma vazia, bloqueio de flags de traje/variante/região e de ID/nome incompatível. Não alterar resolução de formas e trajes especiais, nem API/DOM, Firebase ou P1/P2.
- **Latência:** `dock.html` inicia fallback verificado quando um IMG `complete` falhou antes de registrar listeners.
- **Teste:** `app/tests/lt125-samsung-empty-form-sprites.test.js` confere 2.050 rotas (1.025 × normal/shiny), Noibat e bloqueios de substituição falsa.
- **Novo artefato QA separado:** LT125 R2 — `0.01.25/54330`, nome `PokeSearch-v0.01.25-LT125-Samsung-Sprites-QA-R2.apk`. Não substituir a QA original `0.01.25/54329`; só anunciar se CI/assinatura/sha256 confirmados.
- **Fontes:** inventário de 95 entradas enviado pelo usuário é referência de pesquisa, não 95 integrações instaladas; detalhes em [LT125 Samsung/Fontes](POKESEARCH_LT125_QA_R2_SPRITES_SAMSUNG_FONTES.md). Direitos de terceiros exigem verificação própria.
- **Pendente:** homologação Samsung, Firebase live real, Chat entre dois usuários, PR #80 Draft/merge estável. Preservar main LT124 até os testes de produção.


### LT125 — Evidência do APK QA e auditoria dos bytes (26/10/2026)
- GitHub Actions QA assinado SUCCESS: [workflow #40433868388](https://github.com/LucianoToscano/PokeSearch/actions/runs/40433868388) e [artefato #12703436369](https://github.com/LucianoToscano/PokeSearch/actions/runs/40433868388/artifacts/12703436369). Sucessos dos testes Node/Java, JDK17, Gradle8.11.1, SDK36, R8, Android assinatura v2 e assembleRelease.
- APK: PokeSearch-v0.01.25-LT-Costumes-Firebase-QA.apk; versionName 0.01.25; versionCode 54329; applicationId com.lucianotoscano.pokesearch; SOURCE_COMMIT d5382398b972b29cbe0b45cf446157a9d0317dcf. APK 42.320.719 bytes, SHA-256 71fb69c82d1ee2c4db8a909d695b557a3f6e6fe71ba7aee9edd772d6ee2618df. Certificado v2 SHA-256 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e.
- ZIP do GitHub Actions: 40.115.947 bytes; SHA-256 35c9d6efb07fd70b19fb46c0e6ca803a287f5160e89c8c083d05c01e3831718d; CRC de ZIP íntegro.
- Prova de sprites dentro do APK: 1.025 base, 1.025 shiny, 82 formas (80 do LT116 + 2 LT119), 10 trajes. Todos os 2.142 hashes SHA-256 do manifesto conferidos com bytes dentro do APK; zero ausências/erros. Os 80 PNGs LT116 são idênticos byte a byte ao ZIP original do usuário. Não equivale a cobertura de todas as formas e trajes Pokémon GO.
- NO-GO produção: ausência de teste autenticado nos dados reais Firebase (1/2 usuários, instalações sem duplicidade e onDisconnect), ausência de prova de deploy real, chat entre dois usuários distintos e testes Samsung pendentes. Manter PR #80 Draft e main LT124 preservada; não promover QA a release estável.

## LT125 — recuperação da presença legada e sprites LT116 (26/10/2026)
- Checkpoint: main inicial `65c9b4219744bad180e435faa23739e08e7d183f`; LT124/PR #79 preservada. Mudanças isoladas na PR #80, sem promoção estável automática.
- **Causa precisa no histórico:** tags oficiais `v0.00.87-54290` e `v0.01.11-54315` contêm `FirebaseStats.java` blob `a9da533b45de15c2fde945bfebe558bc264ea0ed`, com `stats/online` e `stats/installations` contados por `getChildrenCount()`. Commit LT117 `5c14d3a67d63ceb61b7dad5cdc947763ec0af05b` removeu ambas as leituras ao migrar para `stats/public/*`, sem comprovante de deploy do backend. Commits posteriores LT121 e LT124 não restauraram a leitura legada. Evidência de código, não prova de regras em produção.
- PR #80 recupera ponte de compatibilidade: agregado `stats/public` prioritário; fallback nas coleções somente se as regras atualmente implantadas autorizarem. Regras versionadas continuam negando leitura global de IDs. Erro mostra `—`, jamais zero inventado. Produção Firebase ainda requer leitura real verificada, sem expor UIDs e sem supor Functions disponíveis.
- O ZIP fornecido `PokeSearch-LT116-Sprites-Correcoes.zip` contém 80 PNG válidos (40 variedades normais e Shiny), 3 JS, 2 HTML e script. Substituição indiscriminada dos JS/HTML rejeitada: removeria melhorias LT117–LT125. Criado `app/scripts/fetch_form_sprites.py`, com hashes Git blob das 80 imagens fornecidas, para recuperar bytes idênticos do PokeAPI/sprites em commit imutável; `build_sprite_bundle.py` adiciona essas 80 aos 2 aliases já preservados da LT119. Resolver compartilhado passa a priorizar as imagens locais exatas, não a espécie base.
- Sprites de trajes da PR #80: 10 PNG PokeMiners, GOGGLES_2026 (#4/#5/#6 normal e shiny) e COPY_2019 (#3/#6/#9, incluindo Venusaur fêmea), sem inventar clone shiny. Inventário esperado no build: 1.025 bases, 1.025 shiny, 82 regionais/formas nomeadas e 10 trajes; números só serão certificados após manifest do APK assinado.
- Testes de regressão antigos LT54/LT117/LT119/LT124 foram adaptados ao novo comportamento, sem liberar permissões globais RTDB. Novo teste `lt125-lt116-form-pack.test.js` checa 40 variedades × 2 imagens exatas. CI/Android físico/Samsung/Firebase live e APK permanecem pendentes até evidência de sucesso; não confundir QA de código com implantação.
- Chat PokeSearch de LT122, P1/P2 independentes, proteção R8, certificado permanente e backups permanecem sem alterações intencionais. Guia integral: `docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md`.


## LT125 — Restaurar contagens antigas e sprites oficiais de trajes (26/10/2026)
- **Correção de diagnóstico por evidência histórica:** LT87 lia diretamente `stats/online` e `stats/installations` e exibia `DataSnapshot.getChildrenCount()` enquanto as regras antigas permitiam; LT117 mudou para agregados `stats/public/*Count` antes de confirmar Functions implantadas. Isso explica a regressão para `—`. LT125 mantém prioridade aos agregados privados em produção e introduz leitura **compatível somente se as regras já permitirem**, sem armazenar IDs no cliente ou abrir regras novas. Se ambos forem bloqueados, exibe `—`, nunca zero inventado.
- **Backend preparada:** Functions `index.js` passam a utilizar explicitamente `pokesearch-lt-default-rtdb`, com ledger idempotente, trigger e reconciliação periódica já presentes; `functions/scripts/reconcile-once.js` checa contagem real e `stats/public`; `firebase.json`, `.firebaserc`, `.github/workflows/lt125-firebase-live-deploy.yml` indicam alvo exato. **Não declarar deploy concluído até conferir workflow/contagens reais.** Credencial segura de serviço `FIREBASE_SERVICE_ACCOUNT_POKESEARCH_LT` pode estar ausente; funções de Firebase exigem permissões e plano de faturamento elegível.
- **Artes verificadas:** catálogo PokeMiners do commit imutável `c2a686eb08ace6e890d8fe3d2134c76988db87b5` contém PNGs de trajes `GOGGLES_2026` para Charmander #4, Charmeleon #5 e Charizard #6 (normal e Shiny); `COPY_2019` para Venusaur #3, Charizard #6 e Blastoise #9 (normal, variante fêmea Venusaur). Dez PNGs são verificados pelo Git blob SHA-1 e PNG SHA-256 no build CI e empacotados em `pokemon-sprites/costumes/`. Não inventar sprites Shiny COPY_2019 ausentes. Mesma resolução no card, resultados e picker, ambas as Pokébolas.
- **QA candidata** `0.01.25` / `54329`, sem mudança de `applicationId`, assinatura, dependências Gradle ou dados pessoais. [Relatório técnico LT125](POKESEARCH_LT125_FIREBASE_E_TRAJES_20261026.md). Samsung e backend ao vivo exigem verificação independente.



## LT124 — Correção de sprites no picker + Firebase retry (26/10/2026)
### LT124 — QA assinada e merge verificados
- **PR #79 MERGED** em `main`: [ver PR](https://github.com/LucianoToscano/PokeSearch/pull/79), merge commit `bc4b1883f6744f738c83a44c6103e2fe40423234`. Fonte binária exata `2e92c07266ebf0bce1dcbde53948e2e467993c39`.
- **GitHub Actions assinado #40426146549 SUCCESS**: [workflow](https://github.com/LucianoToscano/PokeSearch/actions/runs/40426146549), [artifact #12700590080](https://github.com/LucianoToscano/PokeSearch/actions/runs/40426146549/artifacts/12700590080). Node QA, sprites, Android Gradle/R8, assinatura v2 e upload concluídos. Testes LT124 6/6 PASS.
- **APK QA:** `PokeSearch-v0.01.24-LT-Sprite-Picker-Stats-QA.apk`, versionName `0.01.24`, versionCode `54328`, applicationId `com.lucianotoscano.pokesearch`, 41.838.110 bytes. SHA-256 `4f8c11ce6558acc87f295f4ec3776de46a9a2d1ead9df7c8645e3d3e0e3c98a5` verificado ao extrair do ZIP usando `sha256sum -c`. Certificado Android v2 SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; ZIP ~39,7 MB (menor que 199 MB). O manifesto do APK confirma 1.025 base + 1.025 shiny + 2 regionais, nenhum desses arquivos ausente.
- **Restrição permanente:** QA não é homologação Samsung. Contadores ainda dependem de implantação Functions/regras no Firebase remoto; formas GO sem arte verificada continuam sem sprite exata. Não anunciar restauração real de contagens ou cobertura 100% do catálogo GO.


- Base LT123 `ed712bfe716257b27c7937bb3a97c8f53382f5bb`: botões P1/P2 no topo com ícones `sem_filtro.png` OFF e `personalizado.png` ON já estavam implementados, mantidos.
- Aliases oficiais confirmados: `DARMANITAN_GALARIAN_STANDARD` 10177, `DARMANITAN_GALARIAN_ZEN` 10178 e `Squawkabilly White` 10262 (Blue 10260 / Yellow 10261). Pesquisa Pokémon usa resolvedor de sprite exata já compartilhado por cards/resultados, sem atribuir sprite comum a trajes `GOGGLES_2026`, `COPY_2019`. Busca rola ao primeiro candidato novo.
- `FirebaseStats`: recupera nova tentativa de inicialização/autenticação após falha e reutiliza app nomeado sem erro de inicialização repetida. Contadores públicos **não podem apresentar números reais sem RTDB rules e Functions efetivamente implantadas**; nenhuma implantação remota foi confirmada.
- Testes LT124 em Node, compilar Android/R8, conferência de ícones/assinatura no APK QA `0.01.24/54328` por workflow. Detalhes em [LT124](POKESEARCH_LT124_SPRITES_PICKER_FIREBASE_20261026.md). É QA, não release estável. Testes Samsung e formas GO ainda pendentes.



## LT123 — Merge + APK QA assinado (26/10/2026)
- [PR #78](https://github.com/LucianoToscano/PokeSearch/pull/78) **MERGED**, commit `5365ce277c171a1b4055ca433dd7bca7169c74ba`. PR #77 ficou superada pela integração cumulativa LT122/123. SOURCE_COMMIT APK `6a15743b6c26b72b5ef57f6a5de40093dc430883`.
- **Build assinada SUCCESS:** [GitHub Actions #40423724854](https://github.com/LucianoToscano/PokeSearch/actions/runs/40423724854), artifact [#12698283902](https://github.com/LucianoToscano/PokeSearch/actions/runs/40423724854/artifacts/12698283902). Versão QA `0.01.23` / `54327`, pacote inalterado `com.lucianotoscano.pokesearch`, APK `PokeSearch-v0.01.23-LT-Chat-Sprites-Stats-QA.apk`, **41.837.342 bytes**, SHA-256 `d810f13097113f818ca99e55d533855296fd7602747c888727eb291fd59fc493` (confere `SHA256SUMS.txt`). Assinatura Android v2 válida com certificado original SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Botões Home P1/P2:** colocados lado a lado sob o cabeçalho; OFF usa `Sem Filtro.png` e ON `Personalizado.png`. Fontes originais verificadas no Drive; ambas as imagens foram conferidas pixel a pixel dentro do APK, embora recursos comprimidos estejam renomeados como `res/uO.png` e `res/FF.png`. Cada botão controla somente a sua Pokébola.
- **Sprites:** 317 variedades PokeAPI com normal + Shiny disponibilizadas por URL oficial fixada, com cache Android em disco, resolvidas pela mesma biblioteca JS nos resultados, buscas e card. Fonte alterna PokeAPI não inclui 9 variedades nem todas fantasias Pokémon GO; não declarar cobertura universal ou teste físico de todas as imagens. Zigzagoon de Galar continua disponível offline.
- **Chat:** mural substituído por conversa simples, mensagens em tempo real, sem categorias e sem moderação prévia. `firebase-realtime.rules.json` inclui caminho `chat/messages` e proteção mínima Auth/append-only. **Regras NÃO comprovadamente implantadas**; Chat pode não funcionar em produção até deploy. Nenhuma mensagem fictícia.
- **Firebase Stats:** ações `onInstallationAdded/Removed`, `onPresenceAdded/Removed` agora têm ledger de idempotência e `reconcileCounters` periódico para preenchimento de `stats/public`. **Somente código commitado**, sem deploy em produção nem números reais atestados. Traços `—` podem persistir até implantação; não substituir por contagens inventadas.
- **QA restante:** testar no Samsung 110 cenários; API/DOM, sprites regionais GO, sons e notificações P1/P2, chat com dois usuários, instalação incremental, bateria/Doze, regras Firebase em produção. **APK de teste QA, não release pública estável**. Relatório anterior [LT123](POKESEARCH_LT123_CHAT_STATS_SPRITES_DUAL_TOP_20261026.md) e backup integral preservados.



## LT123 — Screenshot Samsung: contadores, sprites e botões duplos (26/10/2026)
- Problemas reportados: `Ativos agora` e `Instalações` não mostram números; ausências de sprites nos resultados e buscas com formas/variações; P1 e P2 devem ficar lado a lado no topo, com as imagens do Drive Sem Filtro.png OFF / Personalizado.png ON. Persistência das preferências, dois serviços, sons e assinatura mantidas.
- Frontend: controle P1/P2 lado a lado na Home, usando PNGs fornecidos, sem biblioteca Android nova. Cada toque controla somente o serviço correspondente.
- Auditoria oficial PokéAPI: CSV 326 variedades alternativas, cruzadas com tree de sprites fixado; **317** têm PNG normal e shiny, gerando 742 aliases verificadas. Corrigido resolvedor compartilhado lista/detalhes com URL exata de variedade em commit imutável e cache nativo local. 9 variedades e alguns trajes GO não têm imagens comprovadas nesta fonte, evitar sprite errada.
- Estatísticas: app lê `stats/public`, mas Functions de publicação não têm implantação comprovada. Código de atualização idempotente por ID de evento e reconciliação servidor hora-a-hora preparado; não afirmar valores restaurados até deploy real e leitura no Firebase em produção. Sem expor UIDs nos clientes.
- Chat LT122 permanece simples e público, sem divisões. Regras RTDB do chat também exigem deploy para envio/recebimento. Testes de regressão e build com versão QA **0.01.23/54327**, mantendo Firebase BoM e libs Android atuais.
- Pendências: deploy Firebase, 9 variações sem PNG, trajes GO exclusivos, Samsung físico e auditoria geral LT116. [Relatório](POKESEARCH_LT123_CHAT_STATS_SPRITES_DUAL_TOP_20261026.md).



## LT122 — Substituição do Mural pelo Chat PokeSearch (26/10/2026)
- Solicitação: **um único chat ao vivo estilo WhatsApp**, sem divisões Recados/Sugestões/Bugs/Dicas, cartões Orkut, telas adicionais, mensagens fictícias, aprovação prévia ou moderação neste estágio. O usuário confirmou aceitar conversa sem moderação e priorizou simplicidade.
- UI na mesma Home: título Chat PokeSearch, bolhas à esquerda e direita, nome, hora, campo de mensagem e botão enviar, últimos 60 recados ao vivo via Firebase Auth anônimo e Realtime Database, sem abrir Activity secundária. Apelido editável, tema claro/escuro; chat visível por padrão em builds elegíveis e opção Ocultar/Mostrar Chat, sem migrar antiga preferência de protótipo.
- Backend projetado **sem Cloud Functions**: clientes autenticados enviam via `chat/messages` com `ServerValue.TIMESTAMP`. Regras RTDB novas limitam campos/tamanhos, leitura autenticada e consulta até 60, escrita por UID somente para adicionar registro; ninguém altera apaga mensagens de terceiros. **Não há revisão/moderação/rate-limit confiável**; risco explícito de spam/conteúdo impróprio. O app tem pausa local de 2s (não é defesa contra abuso). Antigo `scrapbook/posts` continua somente leitura.
- **Deployment do backend:** regras versionadas não representam deploy; sem confirmação das regras Firebase ativas o chat poderá exibir erro de permissão e não será chamado online operacional. Publicação e testes reais dependem de instalar regras no projeto `pokesearch-lt` e verificar Android com dois usuários.
- Preservar duas Pokébolas independentes, sprites, notificações, API/DOM, áudio e assinatura. QA candidata 0.01.22/54326. [Detalhes LT122](POKESEARCH_LT122_CHAT_SIMPLIFICADO_20261026.md).



## LT121 — Correção dual de presença e segurança Native WebView (26/10/2026)
- **Merge confirmado:** [PR #76](https://github.com/LucianoToscano/PokeSearch/pull/76) MERGED na `main`; commit de integração `82d6b5b2ae09aaf3b3fa8bed919bbf9c9d02adfc`. Código do APK QA `5d4482d608b3060b704228f454dbe46b42f4f204`.
- **APK QA assinado confirmado:** `PokeSearch-v0.01.21-LT-Bridge-Presence-QA.apk`, versionName `0.01.21`, versionCode `54325`, 41.754.958 bytes; SHA-256 `32bf812bff45450a67fa8ddd68b52d0efadc8c29bd8176046aee73f476bd0374` validado contra `SHA256SUMS.txt`. Certificado v2 SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. [Build protegida #40418117890 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40418117890), [artefato #12697580015](https://github.com/LucianoToscano/PokeSearch/actions/runs/40418117890/artifacts/12697580015).
- **WebViews com ponte Native:** corrigidos os cinco WebViewClient locais sem allowlist de navegação por `LocalBridgePagePolicy` (documento exato `dock.html`/`detail.html`, queries conhecidas), preservando sprites; risco de documento remoto com interface Android mitigado. A navegação do WebView remoto PoGoCoordinates não foi alterada.
- **Presença de usuários com duas Pokébolas:** booleano único `FirebaseStats.overlayVisible` substituído pelos estados P1/P2; a desconexão de qualquer Pokébola não desliga a presença da outra quando ativa. Testes de oito estados e URLs maliciosas em Java/Node passaram, além dos demais testes e compilação.
- **Limites:** sem deploy Firebase, sem backend idempotente de agregados, mural continua somente leitura, sem matriz Samsung, subframes/CSP e 2.050 sprites-base pinados ainda pendentes. APK **QA**, não release oficial. [Relatório técnico LT121](POKESEARCH_LT121_SEGURANCA_E_PRESENCA_DUAL_20261026.md). Backup imutável preservado.



## LT121 — Segurança dos WebViews locais + presença das duas Pokébolas (26/10/2026)
- **Causa confirmada em código:** cinco WebViews internos expõem `Native` via `addJavascriptInterface` mas seus `WebViewClient` não restringiam navegação de documento principal. `onPageFinished` aceitaria qualquer arquivo com prefixo `file:///android_asset/`. Corrigido com política de URLs exatas local `dock.html` e `detail.html` (somente parâmetros conhecidos), rejeitando HTTP(S), `data:`, `content:` e arquivos extras para os cinco; clientes continuam interceptando sprites offline e preservam seu callback de inicialização. O WebView remoto autenticado não recebe `Native` e não sofre mudança de navegação nesta etapa.
- **Causa confirmada nos contadores:** `FirebaseStats.overlayVisible` era booleano global alimentado por dois serviços independentes. Ao parar P1, era marcado falso mesmo com P2 ativo. Estado separado P1/P2 e Home; `PresenceWindowState.isActive` agrega os três com teste Java da matriz de oito combinações.
- **QA candidata:** 0.01.21 / versionCode 54325, testes estáticos + Java e APK assinado no CI. Não declarar sucesso até assinar/verificar artefato. Nenhum deploy Firebase.
- **Limites:** ainda falta revisão de subframes/cross-origin, Content Security Policy, instrumentação Samsung, agregados Firebase idempotentes em backend, mural/moderação, pins restantes dos 2.050 sprites e compatibilidade Doze/target SDK.



## LT120 — Correções adicionais verificadas, integradas e APK QA assinado (26/10/2026)
- **Problemas confirmados por auditoria de código:** (a) dados `costume_id`/`costume` eram descartados por `api_result_contract.js`, podendo converter uma forma com traje numa imagem comum no WebView, apesar de a API recusar a URL genérica; (b) `api_browser_transport.js` truncava os resultados antes de validar rank PvP GL/UL, ocultando Pokémon válidos após o décimo candidato. Nos dois casos, P1 e P2 compartilhavam a falha.
- **Correções:** preservação sanitizada de evidência de traje e bloqueio de sprite-base para fantasia; validação prévia de liga e rank inteiros usando todos os candidatos da resposta original, preservando `sourceIndex` para Get coords; limite visual de dez continua. PvP não comprovado em resposta não vazia não vira resultado vazio falsamente certificado. Resultados anteriores preservados em falhas de contrato.
- **Integração:** [PR #75 MERGED](https://github.com/LucianoToscano/PokeSearch/pull/75), commit de merge `2e21e8d9dc151ad7655c0599bf1b181b515236aa`; fonte do APK `4bb2292a1903ef1cdd059eee06fe4bad0f465b4e`. [CI QA assinado #40415380981 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40415380981), [Node #40415405985 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40415405985) e [Android Java compile #40415405952 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40415405952).
- **APK QA:** `PokeSearch-v0.01.20-LT-API-Parity-QA.apk`, `versionName 0.01.20`, `versionCode 54324`, pacote `com.lucianotoscano.pokesearch`, 41.754.958 bytes. **SHA-256:** `5620e9062ad9375b1081ae1d1623069d75cbb648f20a4070812296c5c707a57e`, igual ao `SHA256SUMS.txt` verificado. Assinatura Android v2 verificada com certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. [Artefato GitHub Actions #12695621124](https://github.com/LucianoToscano/PokeSearch/actions/runs/40415380981/artifacts/12695621124). Bundle: 1.025 normais + 1.025 shiny + 2 Zigzagoon Galar regionais; R8/Gradle e testes LT120 aprovados.
- **Limites:** o merge e assinatura NÃO equivalem a testes físicos Samsung. Ações pendentes de Firebase produção, moderação e rate limit do Mural, pin imutável dos 2.050 sprites gerais, allowlists WebViews, targetSdk/FGS/Doze, formas regionais adicionais e 110 testes no Samsung seguem **não concluídas**. Não transformar QA em release pública estável. [Relatório LT120 detalhado](POKESEARCH_LT120_AUDITORIA_ADICIONAL_20261026.md). Histórico integral segue preservado.



## LT120 — API: trajes preservados e rank PvP antes de cap de 10 (26/10/2026)
- Auditoria estática identificou dois defeitos: (`api_result_contract.js`) descartava `costume_id`/`costume` dos cards sanitizados, permitindo que `sprite_offline.js` substituísse sem segurança um sprite normal em fantasia; (`api_browser_transport.js`) só validava rank GL/UL **depois** de truncar os dez candidatos preliminares, ocultando spawns válidos com `sourceIndex` posterior.
- Correção candidata: preservar `costume_id` inteiro e `costume` textual limitado no contrato entregue ao Android; rejeitar ID inválido. O resolvedor compartilhado dos dois WebViews recebe a evidência e impede a substituição de imagem de traje por espécie normal.
- Ranking: apenas candidatos da liga exata, rank inteiro 1–50 e até o limite configurado entram no conjunto de até dez; validação feita antes de cap/deduplicação; `sourceIndex` ORIGINAL preservado para Get coords. Não aceitar uma resposta HTTP com linhas não confirmadas como zero PvP verdadeiro.
- Testes LT120 incluem trajes com ID e texto, forma padrão sem traje, GL e UL, posições posteriores a dez, dados inválidos, transporte HTTP simulado e duas Pokébolas compartilhando o código.
- Destino QA assinado **0.01.20/54324**. Merge/relatórios condicionados ao CI; Samsung P1/P2, Firebase, restante dos 110 cenários, segurança WebViews, bateria, sprites extras continuam pendentes.



## LT119 — Print Samsung: sprite regional ausente no card (26/10/2026)
- Evidência enviada: duas Pokébolas 0% e 100% simultâneas, card de Zigzagoon #263 forma Galarian Shiny 15/15/15 exibe losango ◇ em vez de sprite. O print confirma a lacuna visual, não confirma funcionamento de notificações/filtros/Get coords.
- Causa observada no código LT118: parser de API deixa `image=""` corretamente quando forma regional não é padrão, mas `sprite_offline.js` recupera somente formas-base; tanto lista quanto detalhe usam o mesmo resolvedor. Assim, falta mapeamento explícito exato da variedade 10174.
- Correção LT119 em branch: resolver apenas Zigzagoon #263, forma GALARIAN/GALAR validada e sem traje para os assets locais `forms/zigzagoon-galar.png` e `forms/zigzagoon-galar-shiny.png`. Sem reciclar o sprite Zigzagoon padrão. Base do fornecedor fixada por commit `d8c2fb78563e28ad7b3abe938cf6e79998d04e90`, nomes varietais `10174.png` e `shiny/10174.png`; build falha se qualquer arquivo estiver ausente ou PNG for inválido.
- Incluídos testes LT119 API raw 100%/0%, máscara de forma/tra​​je, mesma resolução `dock.html`/`detail.html`, e auditoria de dois assets extras além dos 2.050 base já existentes. Versão QA prevista `0.01.19/54323`; NÃO afirmar build pronto até Actions SUCCESS e artefato assinado.
- Preservar `prefs`/`prefs_secondary`, filtros independentes, som, Get coords, assinatura e limite 10. Testes físicos Samsung, Firebase e bloqueios pendentes LT118 continuam abertos.

- **CI final:** [GitHub Actions LT119 #40406601954 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40406601954). Testes Node/Java/R8, PNGs de forma regional e assinatura Android v2 passaram. QA assinada `0.01.19` / `versionCode 54323`.
- **APK verificado:** `PokeSearch-v0.01.19-LT-Galarian-Sprites-QA.apk`, 41.754.630 bytes, SHA-256 `b649dee85e84e879ff34125d154d91d46ebd380d459ed54c0774ba30a096db66`. `SOURCE_COMMIT=b9a3e494dc63a4561b211dc052f79015e1916938`. Certificado de release v2 SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. [Artefato protegido #12690744356](https://github.com/LucianoToscano/PokeSearch/actions/runs/40406601954/artifacts/12690744356).
- **Merge concluído:** [PR #74](https://github.com/LucianoToscano/PokeSearch/pull/74) integrada à `main` por commit `0c3ce05470c6b5857fc4d8c1aad665eb64f5e1ad`; versão pública estável 0.01.11 não substituída. **Validação visual Samsung da LT119 ainda pendente**; observar se losango desaparece no card do Zigzagoon de Galar Shiny e manter duas Pokébolas 0%/100%.
- **Assets confirmados:** além de 1.025 base + 1.025 shiny, pacote inclui dois PNGs regionais 10174: normal SHA-256 `649b21a22030afdfd17c88e22224a2200dc871b16e7da21798e1bdc34ca78cbb` e shiny `9ef64df9b5802f94056e890ba3576dac7ae74a31f85414b76da41f42122942bf`. Imagens visualmente verificadas contra forma exata, sem substituição genérica.
- **Documento especializado:** [LT119 Zigzagoon de Galar](POKESEARCH_LT119_ZIGZAGOON_GALAR_SPRITES_20261026.md). Demais formas e problemas da auditoria LT116 seguem pendentes.


> **PONTO DE ENTRADA OBRIGATÓRIO • 25/10/2026**  
> Este documento substitui o *uso diário* do antigo guia de ~1,46 MB. **O histórico integral não foi excluído.** Ele está arquivado, byte por byte, em **[GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md](GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md)**. Consulte o backup apenas para tirar dúvidas históricas, conferir requisitos antigos, versões, decisões, evidências e regressões.
>
> **REGRA DE PRIORIDADE:** verificar sempre o HEAD e as PRs reais. Estado recente comprovado por commits/CI prevalece sobre instruções de versões antigas dentro do backup. *Nenhuma numeração QA comprova a conclusão de uma etapa de roadmap ou teste Samsung.*


- **Última release oficial comprovada em 25/10/2026:** **PokeSearch LT111, v0.01.11 / versionCode 54315**, [GitHub Release estável e latest](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.11-54315). Fonte QA assinada `f3dd2ba2286a84cbb5f4cd43da328339afe92a80`; PR #72 squash MERGED. **LT87/PR #62** foram checkpoints históricos, não a versão atual. O HEAD real e os PRs devem ser consultados novamente antes de editar.

## LT118 — Merge aprovado e APK QA assinado verificado (26/10/2026)
- **Merge concluído:** [PR #73](https://github.com/LucianoToscano/PokeSearch/pull/73) MERGED na `main` com commit `5b4b578a94b41ac7c6588295cc8bc07292b4afe1`, preservando as mudanças de `main` e todas as revisões LT112–LT118 da branch. HEAD da `main` nesse checkpoint confirmado pelo GitHub.
- **APK QA efetivamente gerado:** `PokeSearch-v0.01.18-LT-Audit-Fixes-QA.apk` (**41.752.444 bytes**; SHA-256 **`f005c20ecedb22894a6aabd2feb6eb8091c6675790d89ad6be1e2666cc0c9566`**, validado contra `SHA256SUMS.txt` após extração do artefato), versionName `0.01.18`, versionCode `54322`, protegido e assinado com certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. [Workflow assinado #40403874677 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40403874677); artefato [PokeSearch QA LT118 #12689304902](https://github.com/LucianoToscano/PokeSearch/actions/runs/40403874677/artifacts/12689304902), com APK, `SHA256SUMS.txt`, prova de assinatura, origem e manifesto de sprites. SOURCE_COMMIT do binário `88649af72edaf2b7c3e07eef33838912b02d80a5`, antes do commit de merge.
- **QA automática:** [Node #40403881216 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40403881216); [Android Java compile #40403881070 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40403881070); workflow assinado também concluiu todos os testes de código, sprites, R8, certificado e upload.
- **Segunda Pokébola:** a opção de ativar/desativar está novamente visível e acionável na Home; serviços `OverlayService` e `SecondaryOverlayService`, preferências `prefs` e `prefs_secondary`, dois filtros, resultados e posições preservados conforme configuração; testes estáticos LT111/LT112/LT118 e build concluídos.
- **API/segurança desta etapa:** shiny solicitado separado de itens comprovadamente shiny; cap real da API e limite visual de 10 separados; 401 revoga JWT local; 429 respeita Retry-After; sem desvio DOM para negação/autorização; `networkSecurityConfig` explícito bloqueia HTTP puro.
- **Restrições honestas:** a `main` contém o código integrado, porém **LT118 é APK QA, não release oficial estável**. A última distribuição oficial permanece 0.01.11/54315. Nenhuma implantação Firebase foi atestada. As correções e melhorias restantes listadas em [LT118 pendências](POKESEARCH_LT118_VALIDACAO_E_PENDENCIAS_20261026.md) não estão todas implementadas. **Sem homologação Samsung dos 110 cenários** (especialmente P1/P2, notificações, áudio, sprites e coordenadas), não alegar compatibilidade integral ou sanar P1 de servidor.

## LT118 — Segunda Pokébola reativada e autorização integral (26/10/2026)
- Usuário autorizou expressamente aplicar correções, melhorias, merge e gerar APK; controle da segunda Pokébola deve voltar à Home, sem apagar `prefs_secondary` ou alterar a Pokébola primária.
- `MainActivity.buildHome()` muda somente a visibilidade do controle; ambas permanecem independentes em filtros, resultados, posições, modo e preferências. Login e lista de Favoritos seguem compartilhados quando previsto.
- Corrigidos os testes estáticos LT111/LT112 para a nova interface visível. Persistem as correções de notificações, fila de favoritos, FirebaseStats e Mural de leitura da LT117.
- Origem: quatro documentos DOCX LT116 da auditoria, incluindo Plano Mestre. Nova QA prevista: **0.01.18 / 54322**; deve haver confirmação de CI, assinatura e aparelho Samsung antes de chamar resultado de estável.
- Pendências abertas e não ocultáveis: Functions/regras em produção, moderação de servidor, pin dos sprites, WebView allowlist, bateria, versões Android, testes instrumentados, 110 cenários Samsung. Merge foi autorizado, mas build/merge não equivalem à homologação física.
- Consultar [relatório LT118](POKESEARCH_LT118_VALIDACAO_E_PENDENCIAS_20261026.md) e [backup integral](GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md). Nenhuma credencial é registrada.

## QA LT116 final, sem publicação oficial — 25/10/2026
- **GitHub Actions #40243697039 SUCCESS:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40243697039. SOURCE_COMMIT do binário: `dd4c7dcde6404bd5f15a0dc897f873e7ca802d90`.
- **APK assinado:** `PokeSearch-v0.01.16-LT-Coords-Parity-QA.apk`, `versionName=0.01.16`, `versionCode=54320`, applicationId `com.lucianotoscano.pokesearch`.
- **SHA-256 binário:** `38bf598b5c267f2ad8493de69fae79b836d2e3388a0ac3fd314fcebf39c6b762`; **certificado v2:** `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- ZIP APK íntegro; 2.050 sprites com SHA-256 conferidos contra manifesto de cada arquivo (1.025 normais, 1.025 shiny). Node QA, Java, Gradle/R8 e assinatura concluídos com sucesso no workflow. Semelhante a builds anteriores, `testDebugUnitTest NO-SOURCE` não é execução de testes instrumentados no aparelho.
- **Não instalar os candidatos 0.01.15/54319:** builds de desenvolvimento abortaram antes da criação de APK. Somente 0.01.16/54320 possui binário assinado aprovado nesta etapa.
- **Samsung pendente:** P1 100%/P2 0% no mesmo momento, sprite lista + detalhe normal/shiny, pulso durante API e DOM, fallback transitório (sem burlar 401/403/429), preferências/sons/alertas/Favoritos, instalação preservando dados e Get coords. PR #73 segue Draft e main estável não pode ser modificada sem autorização.

## LT115 — API e DOM integrados, sprites e pulso da Pokébola (25/10/2026)
- **Causa confirmada por código:** a API ficava em searchPhase="filling" em vez de "searching", enquanto o CSS só pulsava durante searching; shinyPending também suprimia o efeito. A UI agora usa busca realmente ativa (filling/searching), incluindo API e DOM, na Pokébola 1 e 2.
- **Sprites:** o parser aceitava pokemon_id numérico/textual, mas spriteData exigia número — corrigido com ID normalizado já validado; o carregamento não considera img.complete de dimensões zero como imagem boa, nem abandona a cópia offline em apenas 1,4 s; card de detalhes intercepta o mesmo recurso PokeAPI verificado do APK que a lista.
- **API + site:** API primeira fonte. Falhas transitórias permitidas fazem fallback DOM através de session + verificações oficiais; sem misturar linhas ou coordenadas entre fontes. **Sem fallback para** 401,403,429, login, VIP, trainer não vinculado, erro de filtro; sem burlar limites. Resultados e filtros por serviço seguem independentes, mesma conta autenticada.
- **QA LT115 preliminar:** 0.01.15/versionCode 54319 não deve ser instalado: a primeira revisão adicionou um WebViewClient extra que seria substituído pelo cliente posterior do card. **QA corrigido LT116:** 0.01.16/versionCode 54320, com interceptação de sprites e onPageFinished no MESMO cliente. Build de teste, não release. Testes 100%/0%, imagens base/shiny e UI, regressões de coords, filtros, preferências/alertas. **CI e Samsung devem ser verificados; nenhuma promoção automática.**
- PR #73 Draft; main oficial permanece 0.01.11/54315; backups imutáveis.

## LT114 — status de QA e instalação
- [GitHub Actions LT114 #40240634152](https://github.com/LucianoToscano/PokeSearch/actions/runs/40240634152) SUCCESS; APK QA **0.01.14 / 54318**, origem **4734b6ce877961eff3bdaf7e5c05c69d33e86151**, SHA-256 **df04ad96591e2019181f49d9fb322f706807b2ceb568cea1987510da00e13b85**, certificado v2 SHA-256 **34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e**. 8/8 regressões Get coords, 10/10 paridade LT112, 2.050 PNGs verificados. PR #73 Draft com conflito de merge; main ainda **56403a2999fc8037aa020466cf03041b7926ae02**. Samsung P1/P2 pendente. [Evidências](POKESEARCH_LT113_GET_COORDS_DUAL_PARITY_20261025.md).

## LT114 — Get coords: expiração durante requisição (25/10/2026)
- Auditoria adicional do transporte compartilhado identificou risco de GET iniciado antes do despawn e concluído depois: revalidar `q.expiry` **após** HTTP e antes de entregar/copy coords; nunca reutilizar seleção vencida. Cobre o mesmo código compartilhado P1/P2 e adiciona teste de simultaneidade 100%/0%.
- Versão QA sequencial prevista `0.01.14 / 54318`, preservando intacto `0.01.13 / 54317` (SHA-256 APK `e69fec269ba5613d71d1b55abd7705742553ed97edbd1a1ab671564dc7cf9614`; certificado v2 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`). 2.050 PNGs normais/shiny do APK anterior conferidos byte a byte com manifesto.
- PR #73 segue Draft, não mesclar; branch divergente da main por três commits e resolução de conflitos requer avaliação separada, sem descartar funcionalidades. Samsung P1 e P2 ainda pendentes. Detalhes [LT113 Get coords dual](POKESEARCH_LT113_GET_COORDS_DUAL_PARITY_20261025.md).

## LT113 — Get coords API com comparação incorreta e pesquisa obsoleta (25/10/2026)
- Print do Samsung: **Audino shiny #531, PC 1538, 15/15/15**, card exibiu `Get coords API: stale-or-ambiguous-selection`.
- API e UI usavam representações diferentes do mesmo PC: `"1538"` na resposta bruta e `1538` na seleção Android, o que era rejeitado no `api_browser_transport.js` por comparação estrita de tipos. Normalizar somente PC decimal canônico para inteiro, mantendo índice, espécie, ID exato da busca, despawn e código efêmero autenticado.
- `OverlayService.requestCoordinates`: não consultar coordenadas de cards antigos enquanto a API atualiza; impedir seleção obsoleta. Mensagens claras em Português para busca atualizada, expirada ou já consultando.
- Tudo na `OverlayService` compartilhada: Pokébola 1 e 2 obrigatoriamente testadas (15/15/15 e 0/0/0).
- Teste `app/tests/lt113-get-coords-canonical-dual.test.js` obrigatório no Node QA; inclui formatos ambíguos, índices/PC de outro encontro, tentativa após refresh e proteção contra vazamento do `reveal_code`.
- Backup `backup/lt112-before-get-coords-fix-20261025` = `c8e1c2eb7c394b4aec516a7013a1d919dee9b5ad`. Branch/PR #73 Draft; **QA 0.01.13 / versionCode 54317**, apenas arquivo de Actions, ainda não release estável.
- Detalhes e roteiro físico Samsung: [LT113 Get coords dual](POKESEARCH_LT113_GET_COORDS_DUAL_PARITY_20261025.md).

## REGRA PERMANENTE — PARIDADE DE CORREÇÕES NAS DUAS POKÉBOLAS (LT112)
**Obrigatória e prioritária em todas as próximas etapas.** Qualquer correção ou melhoria de API/DOM, filtros, sprites, cartões, localização, favoritos, notificações, sons, resultados, expiração, menus, atualização ou funcionamento deve ser efetiva e verificada na **Pokébola 1 e Pokébola 2** antes de concluir. A segunda Pokébola não pode ficar com bugs antigos enquanto a primeira é corrigida.
- Código preferencialmente compartilhado por `OverlayService` (herdado por `SecondaryOverlayService`), sem copiar correções isoladas para uma instância. Quando houver comportamento específico, cobrir cada serviço.
- **Independente em cada instância:** modos, IV 100%/0%, localização, filtros, opções de atualização, sprites/resultados, janela, estado da pesquisa, histórico de spawns e deduplicação de alertas. Preferências `prefs` e `prefs_secondary`. Uma conta autenticada, uma lista global `watchList` com três perfis e sons globais de Favoritos.
- Validar 0% e 100%, resultado API HTTP verificado, sprites comuns e shiny do APK em lista e card nos dois serviços, Favoritos ativos, novos Pokémon, perfis 1/2/3, canais Android e não alertar Pokémon expirado/desconhecido/duplicado. Se qualquer cenário falhar, registrar como pendente.
- O botão de **habilitar segunda Pokébola permanece oculto na Home**, sem remover serviço nem dados persistidos. Não criar distinção fixa de cor/numeração entre as Pokébolas.
- **LT112:** um encontro visto como Pokémon comum pode tornar-se Favorito após salvar/ativar o perfil. Sua notificação específica não pode ser bloqueada apenas pela deduplicação de Pokémon novos. As deduplicações são separadas em cada OverlayService, protegendo contra avisos duplicados a cada refresh.
- **Checkpoint:** main oficial de partida `726ee2147f7b4e0b37638c23b5665ce80905c1c3`; backup `backup/lt111-before-dual-overlay-parity-20261025`; correção branch `fix/lt112-two-pokeballs-parity-20261025`. Última release pública verificada `v0.01.11-54315`. Status QA de LT112 exige CI e testes Samsung, não publicar como estável antes de ambos.
- Ver `AGENTS.md` regra 8 e o teste `app/tests/lt112-dual-overlay-parity.test.js`.

## 1. Checkpoint canônico — NÃO REINICIAR
- **Repositório:** [LucianoToscano/PokeSearch](https://github.com/LucianoToscano/PokeSearch).
- **Última release oficial confirmada:** **LT87, v0.00.87 / versionCode 54290**, [release v0.00.87-54290](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.87-54290). **main oficial verificada em 25/10/2026:** `83cf9a693a3672276e01d04e38ed14dce0071cb8`. PR #62 mesclada com histórico LT84–LT87; PR #59 mesclada, #60 e #61 encerradas como substituídas.
- **Linha de desenvolvimento preservada:** [PR #63](https://github.com/LucianoToscano/PokeSearch/pull/63), Draft, branch `feature/lt88-lt93-evolution-20261025`, último HEAD confirmado para a origem desta reorganização: `352a3bdc048d4b6f7337209ccd1d77939b8ae2bf`. **Não voltar à LT83 ou à LT86.**
- **Scrapbook / Mural da Comunidade:** [PR #64](https://github.com/LucianoToscano/PokeSearch/pull/64), Draft **baseada na PR #63**, branch `feature/pokesearch-community-scrapbook-stage1-20261025`. Estado imediatamente anterior à reorganização documental: `40440b1f510f9c2b6b1977985e3d550debaa0927`. Alterações deste guia ficam nessa branch, **sem merge e sem Release**.
- **Importante:** o usuário informou ter realizado etapas adicionais, mas **o último estado GitHub tecnicamente comprovado do Mural contém apenas a Etapa 1 demonstrativa**. Etapas Firebase 2–5 não devem ser declaradas concluídas/online sem novos commits, regras, evidências e homologação.
- Confirmar periodicamente HEAD, PR, testes e Release antes de agir. SHA de **fonte de APK** pode ser diferente de SHA documental posterior.

## 2. Identidade e arquitetura INTOCÁVEIS
- `applicationId = com.lucianotoscano.pokesearch`; `namespace = com.lucianotoscano.pokesearchoverlay`.
- **Android Java / Overlay nativa + WebView**, `probe.js` e DOM do PoGoCoordinates; API REST direta **já autorizada** com fallback DOM. Não solicitar novamente autorização nem misturar `PvPPokeGo`.
- **JDK 17; Gradle 8.11.1; compileSdk 36; targetSdk 33; minSdk 26.**
- Site de referência: `https://pogocoordinates.com/search`. Não utilizar GPS físico; coordenadas são somente filtro voluntário da pesquisa.
- Preservar login e sessão no site, FirebaseStats, Editor Visual, temas, notificações, sons, preferências, histórico, favoritos, alertas, Home, atualização de app, privacidade, cache e integridade.
- **Máximo 10 resultados**, respeitar autenticação/quotas do servidor, nunca driblar **401/403/429**, nunca expor JWT, cookies, `reveal_code`, credenciais ou chave de assinatura.
- Versões release: **R8/ProGuard**, não depurável, assinatura Android v2 com certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. VersionCode sempre estritamente crescente para APK novo; nunca sobrescrever binário da mesma versão/tag.

## 3. Ponto funcional atual — Overlay, Pokémon e resultados
- Barra flutuante, menus e Pokébola de resultados permanecem independentes da Home; cliques atrás de painéis não devem ser bloqueados sem necessidade. Botão de atualização giratório, menus compactos e resultado arrastável.
- Filtros / Modos: **GL/UL/PvP, IV A/D/S, IV%, Shiny, PC, nível 1–50, Sexo incluindo ⚲ Genderless, Forma, Tamanho, Clima, Ordenação**, Pokémon e opções oficiais. Nunca inventar IV, rank ou fonte de dado.
- Pesquisa API/DOM conforme preferências sem violar autenticação. Fallback não pode contornar limites. Metadados de card (IV/PvP/distância/Despawn) pertencem somente ao mesmo encontro confirmado; limpar expirados mesmo com timer oculto; nunca ressuscitar resultados vencidos.
- Sprites: `VerifiedSpriteCache.java` e cache WebView para URLs **exatas verificadas** PokeAPI base/shiny, mirror CDN somente para origem legítima; shiny separado, limite PNG/dimensões/cache. Forma especial/traje não comprovado fica em placeholder neutro, nunca substituído por outra forma.
- Favoritos: até **50**, grade compacta, **três perfis em estrelas** com **autosave do perfil ativo**, troca isolada entre slots; segurar estrela solicita confirmação para limpar apenas aquele perfil. Preservar listas históricas e notificações.
- Editor Visual: transparência base dos menus em **50%** inicialmente, blur ajustável **0–16 px**, temas claro/escuro, fundos e contraste efetivamente legíveis no Android (blur de outra janela pode falhar). Preservar personalizações anteriores.

## 4. Último layout confirmado em código — LT88 R8
Este checkpoint **substitui instruções visuais antigas** do arquivo histórico:
- **A própria palavra “Filtro” é o botão**. Removido símbolo redondo `⊙`. Popup contém **Padrão / Filtro 1 [disquete SVG fino branco] [lixeira SVG fina branca] / Filtro 2 [disquete] [lixeira]**, sem título ou descrição inferior. Padrão zera somente filtros gerais, **não** Shiny nem localização; salvar/aplicar/excluir respeitam o slot e popup fecha ao aplicar. **Dados do antigo terceiro perfil persistem, mas o botão foi ocultado** — não apagar.
- **Localização:** painel compacto em três linhas: título, campo de coordenadas, linha com Colar/Copiar, raio+“km”, slider, Aplicar/Limpar. Raio permitido **0–1000 km**; par de teste `24.9407581,121.1889794` com 0, 215 e 1000 km. Aceitar texto/Gboard/links Maps válidos, mas erro de foco no clipboard Android requer QA físico; sem favoritos de locais antigos ou “?” visíveis, sem apagar valores legados.
- **Som de notificações:** submenu flutuante com **Padrão + 36 áudios personalizados**; tocar prévia marca opção `✓` com contraste, sem gravar até **“✓ Usar áudio”**. Ao abrir, realçar áudio salvo (incluindo “Quem é esse Pokémon? · BR” como padrão de Favoritos não personalizado). Não navegar para a Home.
- **Pix:** abrir no painel flutuante usando temas, alpha e blur, sem trocar Home. 
- Fonte detalhada: [R6 Favoritos/sprites](LT88_FAVORITOS_SPRITES_SAMSUNG_R6_QA.md), [R7 Drive/compartilhamento](LT88_DRIVE_SHARE_R7_QA.md), [R8 filtros/som/localização](LT88_R8_FILTROS_AUDIO_LOCALIZACAO_QA.md).
- **Último APK de QA R8 confirmado:** `PokeSearch-v0.00.95-LT-Compact-Filters-Location-Audio-QA.apk` / `versionCode 54298` (**não** “LT95 concluída”), SOURCE_COMMIT `352a3bdc048d4b6f7337209ccd1d77939b8ae2bf`; SHA-256 `0cd3ce47841950fe7946ae1e50241a47273b14a771b2ea72ba6b9a0b8c563782`; [CI assinado #40187862412 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40187862412). QA protegido ≠ Release oficial ou homologação física.

## 5. Home, atualização e distribuição
- Home: login PoGoCoordinates, perfil treinadora/treinador, controles de tema, overlay, Apoiar, menu, contador FirebaseStats, painel de atualizações, compartilhar app e rodapé de versão real (`BuildConfig.VERSION_NAME`). Preservar papel de parede sem deformação.
- **GitHubUpdateCenter** monitora **Releases oficiais estáveis** com hash e assinatura; o usuário confirma instalação. O `UpdateCenter` legado e ponte Drive LT79 são independentes. Não publicar release ou mesclar PR automaticamente.
- Botão **“Compartilhar app”** usa Android Sharesheet e link **estável de arquivo Drive**, sem compartilhar endereço GitHub:
  - [Pasta PokeSearch_App no Drive](https://drive.google.com/drive/folders/1fVw93qUDE0YWp6tlJZaNjRmymyhEAUbR).
  - [APK espelhado no Drive](https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view), ID **`1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P`**.
  - Em 25/10, arquivo Drive foi atualizado *in place* ao binário **R8 0.00.95 QA**, SHA acima verificado após redownload; acesso anônimo por terceiros ainda exige confirmação física. Em atualização **expressamente autorizada**, validar pacote, versão, certificado e SHA, e substituir **o mesmo ID** de arquivo para manter o link. **Não confundir APK QA compartilhado com Release oficial.**

## 6. Mural da Comunidade PokeSearch (Scrapbook / PR #64)
- **Etapa 1 verificada por código/CI:** Home tem preview de três postagens locais fictícias, avatars textuais, autor, categoria, texto, horário, curtidas/respostas e “Ver todos”, recolher/expandir, temas claro/escuro, scroll quando demo ligada; tela própria `CommunityScrapbookActivity` fora do overlay, com **um único feed** e filtros **💬 Recados | 💡 Sugestões | 🐞 Bugs | 🎓 Dicas**.
- **Limitação obrigatória:** **não é um mural online.** Posts e estatísticas são exemplos; `Escrever/curtir/responder/denunciar/excluir` desabilitados; editor restrito a 300 caracteres na UI de demonstração. Nenhuma gravação Firebase no mural.
- **Feature gate:** `BuildConfig.DEBUG || BuildConfig.SCRAPBOOK_STAGE1_QA`; na distribuição pública normal o flag de QA é **false** e a demo não aparece. Somente o APK QA expressamente assinado 0.00.96/54299 habilita `SCRAPBOOK_STAGE1_QA=true`, mostrando a demonstração por padrão e permitindo ocultar/mostrar no menu lateral. Activity `exported=false`; sem endpoint público, postagem real ou Firebase do mural.
- `FirebaseStats.java` existe para `stats/installations`, `stats/online` e presença com Firebase Auth anônimo; **não modificar** para criar o mural. Integração futura: `scrapbook/users`, `posts`, `replies`, `likes`, `reports`, `config`, regras `deny-by-default`, autoria por UID, validação de textos, App Check, rate limit **confiável no servidor**, moderação, privacidade/LGPD e orçamento. Não implementar / ligar banco público sem inspeção de Security Rules e autorização explícita.
- **QA Etapa 1:** [Node+Java #40189621731 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40189621731), 7 testes específicos PASS, `compileDebugJavaWithJavac` PASS sem APK; exceção histórica `lt74-local-update-preview.test.js` já excluída pelo CI LT88 R8. [Guia append anterior #40189422785 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40189422785).
- **Candidato Scrapbook QA assinado (25/10/2026):** `PokeSearch-v0.00.96-LT-Scrapbook-Stage1-Demo-QA.apk`, 0.00.96/54299; SOURCE_COMMIT `542e5f177031bbbad40e3197a5415a4632d8165d`; SHA-256 `bb138727636978f7870df9c461a96414fe02ded4feace2ac7bbdc94954d32fa2`; [GitHub Actions #40190881436 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40190881436); R8 não depurável, assinatura v2 e certificado mantido. **Apenas demo local visível no QA; não é versão pública nem Firebase online.** Detalhes: [POKESEARCH_SCRAPBOOK_APK_QA_20261025.md](POKESEARCH_SCRAPBOOK_APK_QA_20261025.md).
- Fonte detalhada: [POKESEARCH_SCRAPBOOK_ETAPA1.md](POKESEARCH_SCRAPBOOK_ETAPA1.md). **Etapas 2–5 (Firebase real, interações, moderação, homologação) exigem evidências novas**. Mesmo se houver declaração de progresso em conversa, não marcar concluído sem encontrar na branch correta.

## 7. QA, pendências e critérios de aceite
- **CI aprovado não é PASS Samsung.** Para cada APK candidato: Node + Gradle Java/unit + R8 + `assembleRelease` + `apksigner` v2 + certificado + SHA256SUMS + SOURCE_COMMIT + código/versão. A entrega do arquivo é separada de merge e da publicação oficial.
- **Samsung pendente de evidência** (build exata): favoritos 1/2/3 e autosave, fundo/alpha/blur nos menus, tela pequena, Gboard clipboard/Colar e links Maps, coords e raios, menu dos sons com seleção, Pix, sprites base/shiny/formas especiais, temporizador/remoção de Despawn, IV/GL/UL/PvP/distância por encounter, interação da Pokébola e painéis.
- **Scrapbook pendente de aceite visual** em debug: temas, scroll, preview expandido/recolhido, menu, filtros, back, resolução Samsung, nenhum input real e ausência em release; **Firebase de produção não foi habilitado pela Etapa 1**.
- Lista histórica útil: [LT87 Samsung](LT87_CHECKLIST_SAMSUNG.md), [R6 Samsung](LT88_FAVORITOS_SPRITES_SAMSUNG_R6_QA.md), [R8 Samsung](LT88_R8_FILTROS_AUDIO_LOCALIZACAO_QA.md), [Scrapbook Etapa 1](POKESEARCH_SCRAPBOOK_ETAPA1.md).
- Não inventar passes Samsung, screenshots, links de APK/Drive, hashes, credenciais ou conclusão de roadmap. Respeitar proteção do app e rede.

## 8. Como recuperar informações do HISTÓRICO ORIGINAL
1. **Primeiro ler ESTE guia curto** e consultar o HEAD real das branches/PRs.
2. Para dúvida específica antiga (ícone, regra, commit, correção, versão, implementação), consultar **[backup completo](GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md)**; pesquisar **palavra-chave, LT ou seção específica**. Não despejar 1,46 MB inteiro em contexto a cada execução.
3. Para um assunto atual, usar documento especializado. Prioridade: evidência verificável (código, CI e build) **mais recente** > checkpoint resumido atualizado > documentação específica > histórico antigo. Divergência deve ser registrada, não escondida.
4. **Proveniência imutável do backup:** conteúdo é exatamente o antigo `docs/GUIA_MESTRE.md` no commit `40440b1f510f9c2b6b1977985e3d550debaa0927`, tamanho **1.459.814 bytes**, **Git blob SHA `466a92323dc319720b4ced50caf413a1a2bbef04`**, **SHA-256 dos bytes `f02d6396a3ae6a4e833f78be8aedbe0b8d0b40254f31203644f3040a30e2a861`**. O novo caminho aponta para **o mesmo objeto Git**, sem recodificação, truncamento ou alteração de bytes. O GitHub histórico de commits também conserva versões anteriores.
5. **Regra nova de manutenção:** manter `docs/GUIA_MESTRE.md` **resumido e atualizado por edição pontual** com HEAD/versão/testes/decisões; criar detalhes de cada etapa em documentos próprios; **não voltar ao append indiscriminado de 1,46 MB**, não modificar o backup imutável, não substituir guia com retorno truncado de conector. Validar backup por `git hash-object docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md` = SHA acima.
6. **GitHub Actions antigos de append** foram feitos para guia gigante; no ciclo atual precisam funcionar como auditoria somente leitura, sem tentar acrescentar texto ao arquivo de backup ou exigir guia resumido com mais de 1,4 MB.

## 9. Scrapbook moderado — preparação online QA 0.00.97
- Em 25/10/2026, evolução da PR #64 prepara `CommunityScrapbookOnline.java` e `firebase-realtime.rules.json`: feed de posts aprovados, envio para moderação, curtida e denúncias, com gate exclusivo do APK QA 0.00.97/54300. **Não afirmar Firebase online** sem inspeção e deploy de regras, App Check, moderação e homologação; em QA inicialmente fechado. Detalhes e critérios: [Scrapbook Online QA](POKESEARCH_SCRAPBOOK_ONLINE_QA_20261025.md).
- Ações documentais e CI devem manter main LT87, PR #63 e PR #64 sem merge e o mesmo certificado; APK atual no Drive permanece intocado.

## 10. QA 0.00.98 — Home com Scrapbook, Agradecimentos e Localização
- Branch nova `feature/pokesearch-home-scrapbook-thanks-qa98-20261025` derivada do HEAD `e02475fcfebcd64b74300fd8ab5e8ac29a35b8a6` da PR #64, mantendo #63 e main LT87 intactas.
- Proprietário autorizou posts/respostas diretos (sem aprovação), porém **não declarar Online funcional** sem Security Rules implantadas, flag `allowDirectPosts=true` e validação. Mural na própria Home com exemplos **fictícios identificados**, categorias e editor inline.
- Dois WebP originais aprovados são recursos offline em `drawable-nodpi`; cartão 💙 Agradecimentos na Home e menu, visualizador sobre Home, zoom e compartilhamento via FileProvider.
- Janela Localização recupera largura ~286dp, botões Aplicar/Limpar visíveis, Colar/Copiar adjacentes, campo coords e raio 0–1000. Missão primeira instalação após guia; posteriores 3 aberturas/10min.
- **QA candidata 0.00.98/54301**, CI, assinatura e Samsung a validar. Guia detalhado [QA 0.00.98](POKESEARCH_QA98_HOME_COMMUNITY_TRIBUTE_LOCATION.md). Não fazer merge/release/Drive sem autorização.

### Checkpoint CI 0.00.98 — build assinada
- [PR #65](https://github.com/LucianoToscano/PokeSearch/pull/65) Draft, baseada na PR #64. [Actions #40194558819](https://github.com/LucianoToscano/PokeSearch/actions/runs/40194558819) **SUCCESS**, Android 0.00.98/54301, SOURCE_COMMIT `44cc6fa0cf551edb80e423b070f47cd01aa9ff0e`, SHA-256 APK `08b49f76550f95bc0521dce950b18abadb90034732087eceeebb33f0f1285276`, certificado permanente confirmado, R8/não depurável. Asset ZIP artifact ID 12598909133.
- **Não** implantadas Rules Firebase, flag `allowDirectPosts` não confirmada true; APK serve para validar Home/Homenagem/Localização e a UI do Mural. Produção e teste Samsung físico pendentes. Detalhes [QA 0.00.98](POKESEARCH_QA98_HOME_COMMUNITY_TRIBUTE_LOCATION.md).

### LT99 — localização Samsung de três linhas (25/10/2026)
- Após prints reais, ajuste visual na PR #65: `dock.html` com exatamente 3 linhas em Localização: **Localização [Colar ↓] [Copiar] / [coordenadas até 30 caracteres] / [0–1000]km [Aplicar ✓] [Limpar 🗑]**. Slider mantido apenas como estado JS sincronizado, fora do DOM visível. Botões somente ícones, janela 286dp máx sem vazios; funções Native de colar/copiar/aplicar/limpar preservadas.
- Candidato QA `0.00.99/54302`, CI e APK ainda a validar. Documento especializado: [Localização três linhas](POKESEARCH_LOCATION_QA99_THREE_ROWS_20261025.md). Não publicar Release, merge ou substituir APK público sem autorização.

### LT100 — slider alinhado com campo de coordenadas (25/10/2026)
- O usuário esclareceu pelo print: Localização ocupa **quatro linhas compactas**. (1) título, colar ↓ e copiar; (2) campo latitude/longitude até 30 caracteres (ex.: `53.759856,-1.495755`); (3) barra 0–1000 km com **a mesma largura do campo**, sem recuo; (4) `[0000]km [✓] [🗑]`, centralizados. Substitui exigência LT99 de não exibir slider.
- HTML `dock.html` inclui `locSliderRow` entre `locCoordsRow` e `locRadiusRow`, sem alterar contrato da ponte Native, API, assinatura, preferências. Candidato QA `0.00.100/54303`. Detalhes [LT100 Localização](POKESEARCH_LOCATION_QA100_FOUR_ROWS_20261025.md). PR #65 Draft; sem merge, Release, distribuição pública ou alteração do Drive público.

### QA LT101 — Agradecimentos compacto e Mural em estilo Scrapbook (25/10/2026)
- Após feedback visual Samsung, o cartão largo de Agradecimentos foi substituído por **atalho cápsula 48dp**, discreto à direita após atualizações; tocar abre a mesma arte original offline sobre a Home, zoom/compartilhar/Voltar preservados.
- Mural único na Home ganhou **balões de recados estilo Orkut**, avatar redondo, autor/categoria, cores sutis por categoria e ações pequenas. Os três exemplos seguem com identificação explícita como fictícios. Em expansão: categorias, feed real em ordem decrescente (até 20) e composer compacto, sem ScrollView dentro de ScrollView. Firebase segue bloqueado até implantação de regras segura e flag admin.
- QA protegida candidata `0.00.101/54304`, PR #65 (sem merge), CI/assinatura/Samsung a validar. Detalhes [QA LT101 Home](POKESEARCH_HOME_QA101_SCRAPBOOK_MINI_TRIBUTE.md). Imagens originais `.webp` intactas e assinatura preservada.

### LT102 — revisão final de sprites + promoção autorizada (25/10/2026)
- Proprietário relatou imagens intermitentes no menu Pokémon e nos resultados. Em `dock.html` foi adicionado **watchdog finito** no pool de sprite-base PokeAPI (origem → CDN exata), impedindo promessa pendente infinita; retorno neutro quando não existe URL válida. Resultados mostram fallback neutro após tentativas limitadas; não atribuir forma/skin/Shiny incorreto.
- Auditoria incremental: manter `VerifiedSpriteCache.java` (PNG, forma base, HTTPS, limite/cache), `probe.js`, login, API, filtros, localização LT100, IV/PvP, Home, Agradecimentos, notificações, sons, Pix e assinatura; comparar PRs #63/#64/#65 antes da promoção.
- Usuário autorizou **merge e publicação oficial** e envio de APK ao Drive. QA candidata `0.00.102/54305`, com R8, assinatura permanente e testes integrais. **Firebase RTDB não tem regras publicadas confirmadas**: não anunciar publicação de recados ativa. Detalhes no documento [LT102 Publicação/Auditoria](POKESEARCH_LT102_RELEASE_AUDIT_20261025.md).

### LT102 — evidência do APK aprovado para promoção
- GitHub Actions #40199018230: **SUCCESS**; artifact #12601060845 `PokeSearch-v0.00.102-LT-Sprite-Recovery-Community-QA-protected-release`. APK extraído 39.203.529 bytes, SOURCE_COMMIT `69c4a28684fa0d8f93dbac2f3bb16a73ad3c3f8a`; SHA-256 `2e99d46355ecef4e6046787dce56b9557b039a2cea0e33857947feecf4a9b303`. versionName `0.00.102`, versionCode `54305`, certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, v2 true, R8 e não depurável.
- Proprietário autorizou merge/release neste turno. Pipeline de promoção de uso único `lt102-official-approved-on-merge.yml` confere SOURCE_COMMIT, ancestralidade de main, integridade e certificado antes de publicar GitHub Release. Até confirmação da execução **não afirmar Release publicada**. Firebase Rules não alteradas; teste Samsung físico desta versão pendente.

### LT103 — correção urgente após homologação Samsung (25/10/2026)
- Após publicação oficial LT102, o usuário confirmou por prints que Localização estava desproporcional (~286dp) e 💙 Agradecimentos isolado entre perfil e indicadores.
- Branch `fix/lt103-compact-location-home-20261025` derivada da main oficial. O popup **e sua janela nativa** passam a ter largura máxima 148dp, aprox. quatro ícones da barra; quatro linhas: título/Colar↓/Copiar, coordenadas até 30 caracteres, slider com mesma largura, raio km/✓/lixeira. Não alterar valores, ponte Native, filtros, outros menus ou transparência do tema.
- Atalho Agradecimentos foi colocado **na mesma linha do botão Compartilhar app**, mantendo miniatura original offline/visualizador, zoom e menu lateral. Nenhum cartão solto entre perfil e indicadores.
- Candidato protegido `0.00.103/54306`, certificado permanente, R8, CI e Samsung pendentes até evidência. Registrar testes e hash após compilação. Detalhes `docs/POKESEARCH_LT103_URGENT_VISUAL_FIX.md`.

### LT103 — QA assinada confirmada e promoção oficial autorizada
- [GitHub Actions #40202166900](https://github.com/LucianoToscano/PokeSearch/actions/runs/40202166900) **SUCCESS**. SOURCE_COMMIT `e86c1fb385e7345fbe8414c5932d17babc38c267`; APK `PokeSearch-v0.00.103-LT-Compact-Location-Integrated-Thanks-QA.apk` 39.203.901 bytes; SHA-256 `ba47356a73f80213943fb8cebde58fe4a9c931abd5f93d751c5493efb7552027` confirmado com SHA256SUMS; package `com.lucianotoscano.pokesearch`, version `0.00.103/54306`, assinatura v2 e certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. R8/não-depurável confirmados.
- Release LT102 foi temporariamente retirada do canal estável (prerelease=true) por workflow de contenção #40201587415 enquanto a correção visual LT103 era testada. Nova Release oficial via `lt103-official-approved-on-merge.yml` deve ser verificada após merge PR #66. Não afirmar que o Samsung físico foi homologado; prints anteriores identificaram o bug corrigido. Sem ativar Firebase remoto.

### LT103 — distribuição oficial confirmada (25/10/2026)
- PR #66 mesclada em `main` commit `f48f0a0dbf526a4dd8a42d32871794f3c801f87b`. Pipeline QA #40202166900 **SUCCESS**; pipeline oficial #40202554931 **SUCCESS**; GitHub Release estável/latest [v0.00.103-54306](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.103-54306).
- APK oficial `PokeSearch-v0.00.103-LT.apk`, 39.203.901 bytes, SHA-256 `ba47356a73f80213943fb8cebde58fe4a9c931abd5f93d751c5493efb7552027`; `0.00.103/54306`, assinatura v2 do certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, R8 e não depurável.
- Arquivo Drive compartilhado **substituído no mesmo ID**, mantendo link de Compartilhar app: [Drive LT103](https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view). Nome/size do novo APK verificados via Drive; URL anterior permanece válida.
- LT102 foi demovida a `prerelease=true` por contenção; LT103 agora é `latest` estável. Samsung físico **precisa homologar** as dimensões de 148dp e toque/teclado; CI não substitui inspeção visual. Firebase do mural continua dependente das Rules/flag administrativa remotas, não alteradas nesta entrega.

## 11. Protocolo obrigatório do próximo chat
Ler primeiro este resumo, verificar `main`, PR #63 e PR #64 e últimas Actions, preservar todas as mudanças anteriores e escolher a branch correta antes de alterar arquivos. Etapas pequenas, reversíveis e auditáveis, com testes; não apagar preferências, não mexer na assinatura, não ativar Firebase real por inferência. Registrar mudanças neste guia **em poucas linhas** e encaminhar documentos aprofundados para arquivos separados. **Nunca declarar Release, merge, aprovação Samsung ou mural online sem prova real.**


## 14. Desenvolvimento seguro — Duas Pokébolas, filtros separados (25/10/2026)
- **Backup antes da alteração:** `backup/lt103-before-dual-pokeballs-20261025` -> HEAD original `97654f3c0ecaf4d3de4e22fe1f3efb6d979f0297` (sem modificações). Branch de implementação isolada `feature/dual-pokeballs-100-0-20261025`.
- **UX solicitada:** dois overlays simultâneos com uma única conta, **sem diferenciação artificial de cor/número/ícone**; ícones mudam com filtros de cada Pokébola. Padrão da primeira IV 15/15/15 (100%) e da segunda IV 0/0/0 (0%); filtros subsequentes persistem por instância.
- Implementação: componente `SecondaryOverlayService` reaproveita `OverlayService` com `prefs_secondary` para seus filtros/posições e ID 74 de notificação; primário usa `prefs` e ID 73. WebView/CookieManager compartilha autenticação, não resultados/filtros em memória. Botão independente na Home, login/logout propagados, resultados até 10 por instância.
- **Código integrado à main:** PR #67 MERGED, commit de integração `54fc1274c0fac62c1827071d8e6cf6361219dfca`. CI da PR: Node #40216822416 SUCCESS (inclui 7/7 testes dual) e Java Android compile #40216822421 SUCCESS. **Ainda sem APK novo nem homologação física Samsung**, release oficial permanece LT103. Backup original intacto; release depende de QA em dispositivo. Ver [documento detalhado](POKESEARCH_DUAL_POKEBALLS_20261025.md) para limitações, testes, segurança, origem e rollback. QA obrigatória antes de publicar.


### QA assinada LT104 — 25/10/2026
- **Código com duas Pokébolas:** PR #67 merged (base de funcionalidade), main atual passou a conter os fluxos CI LT104.
- **APK de teste produzido:** `PokeSearch-v0.00.104-LT-Dual-Pokeballs-QA.apk`, versionName `0.00.104`, versionCode `54307`, tamanho 39.203.925 bytes, SHA-256 `64f5a5bad090486b029cff9eeedcfc55e3645e6313ef91706ebd9f037ad280b7`.
- **Fonte exata do APK:** `55cee3c34ed9b6bf017f2acebebdc600f6ea54b1`, teste/build assinado [Actions #40217437596](https://github.com/LucianoToscano/PokeSearch/actions/runs/40217437596) SUCCESS. Workflow de publicação de download QA [#40217680586](https://github.com/LucianoToscano/PokeSearch/actions/runs/40217680586) SUCCESS.
- [**Download direto do APK LT104**](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.00.104-54307-qa/PokeSearch-v0.00.104-LT-Dual-Pokeballs-QA.apk); [release QA](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.104-54307-qa) está marcada como **pré-release, NÃO latest**. Oficial estável permanece LT103 e link Drive não alterado.
- APK RELEASE não depurável com R8/mapping, assinatura Android v2 e certificado permanente checados pelo CI. **Samsung físico ainda não homologado**. Confirmar duas buscas ao mesmo tempo, ícones dinâmicos, login compartilhado, filtro 100/0, isolamento, rate limits e desempenho em hardware.
- **Backup de segurança:** `backup/lt103-before-dual-pokeballs-20261025` mantém SHA `97654f3c0ecaf4d3de4e22fe1f3efb6d979f0297`. Nunca sobrescrever.


## LT105 — Sprites offline no APK (25/10/2026)
- **Backup criado antes da implementação:** `backup/lt104-before-bundled-sprite-cache-20261025` aponta ao commit original `89b4b25c146af11c331a13ac4aad5d088e92e548`, que permanece intacto.
- **Implementação integrada:** PR [#68](https://github.com/LucianoToscano/PokeSearch/pull/68) MERGED, commit `9336d556c63ac02b728de5061b1242d28d3e1c13`; `VerifiedSpriteCache` usa pacote de assets antes do disco/rede; `PokemonPicker` lê as mesmas imagens sem download, preservando as duas Pokébolas e configurações LT104.
- **Pacote exato aprovado:** 1.025 sprites-base e 1.025 shiny da PokeAPI, todos verificados por PNG (cabeçalho/tamanho/dimensões); inclui `SPRITE-MANIFEST.json` e hash individual. Construídos e embutidos no APK no CI, não adicionados binário ao Git.
- **LT105 QA assinada:** [APK `PokeSearch-v0.00.105-LT-Offline-Sprites-QA.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.00.105-54308-qa/PokeSearch-v0.00.105-LT-Offline-Sprites-QA.apk), 41.748.462 bytes, versionName `0.00.105`, versionCode `54308`, SHA-256 `681115fdac97e875c3542bb02fed08d66e97c0043d8d81b8d521a0baaf195066`. SOURCE_COMMIT `094c23f202c87bf34b99b1ddb3404ea805ef60f7`, Actions [#40221698051](https://github.com/LucianoToscano/PokeSearch/actions/runs/40221698051) SUCCESS, certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, R8 e Android assinatura v2 aprovados.
- **Status:** pré-release QA [v0.00.105-54308-qa](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.105-54308-qa), não substitui release pública oficial LT103 nem arquivo Drive. QA Samsung física ainda não comprovada. Formas especiais/trajes requerem sprite exato verificado: não mostrar imagens de formas erradas.
- Detalhes e checklist: [documento LT105](POKESEARCH_LT105_OFFLINE_SPRITES_20261025.md).

## LT106 — Som dos favoritos (25/10/2026) — QA assinado
- **Backup imutável:** `backup/lt105-before-favorite-alert-audio-20261025` = main anterior `72882b0a40d64a670dfa28fa4a4859a6e0c9e558`. PR [#69](https://github.com/LucianoToscano/PokeSearch/pull/69) MERGED, commit `4a86932ba512cb6508c013519efc893d37f00ef2`.
- Correção: Android preservava a configuração de som dos canais antigos v1/v2 (NotificationChannel imutável). Favoritos usam canal v3 por som configurado, mantendo histórico, listas, áudio BR padrão, 36 faixas, OFF/Sem som e bloqueios Android/Não Perturbe. Botão **Testar notificação de favorito** abre teste real e diagnóstico no menu de áudios flutuante. Notificação geral deixa de usar ID 74, reservado à segunda Pokébola.
- **APK QA LT106:** `PokeSearch-v0.00.106-LT-Favorite-Sounds-QA.apk`; versionName `0.00.106` / code `54309`, 41.748.462 bytes, SHA-256 `87af989a86e9f8c373c91a4e6ae3c0111a26aebc3ac398bd15174bf994b8d4c8`. SOURCE_COMMIT `0a87a6be8dc4d2b11febe7e77d4f3a39d8c341a6`; [GitHub Actions #40223078604 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40223078604), R8, não depurável, Android assinatura v2, certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- [**Download direto LT106 QA**](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.00.106-54309-qa/PokeSearch-v0.00.106-LT-Favorite-Sounds-QA.apk), pré-release NÃO latest; não altera release oficial LT103 nem Drive.
- Pacote mantém LT105: 1.025 sprites-base + 1.025 shiny (total 2.050) no APK, duas Pokébolas LT104, mesma sessão e filtros independentes.
- QA físico Samsung ainda **não** validado. Testar favorito real recém-confirmado, som ON, canal Android, volume, DND, OFF e Sem som. Registro de detalhes: [LT106](POKESEARCH_LT106_FAVORITE_SOUND_FIX_20261025.md).


## Auditoria LT107 (25/10/2026) — API, sprites, alertas, perfis e versão
- **BACKUP:** `backup/lt106-before-semantic-version-correction-20261025` → SHA `ed229ad9717113c4cc255108a67f1c5e1567313d`, imutável. Trabalho `fix/lt107-version-scheme-00100-20261025`.
- **Versão corrigida:** regra `0.00.99 → 0.01.00 → ... → 0.01.06 → 0.01.07`. Relação histórica: LT100 `0.01.00`, LT101 `0.01.01`, LT102 `0.01.02`, LT103 `0.01.03`, LT104 `0.01.04`, LT105 `0.01.05`, LT106 `0.01.06`. APKs antigos `0.00.100..106` **não são adulterados**; nome exibido é normalizado pelo novo `VersionNames` e código Android/URI/hashes permanecem originais.
- **Causa raiz alertas:** `OverlayService.applyCollectedResults` descartava **todos** os alertas quando `source=authorized-api-qa`, enquanto API está ON por padrão. Com verificação HTTPS, `criteriaConfirmed`, `requestValidated`, freshness, filtros/IV/rank PvP e despawn, respostas reais API agora acionam `recordNewResults` para avisos de novos Pokémon e de Favoritos. Resultados falsos/expirados não geram alertas. Canais de som geral migrados a v3; Favoritos v3 preservados.
- **Causa raiz imagens da segunda Pokébola:** `api_result_contract.js` devolvia `image=""` para `SPECIES_NORMAL`/`SPECIES_DEFAULT` de espécie comum. Sem URL de imagem, os 2.050 sprites empacotados não podiam ser usados. Parser aceita *somente* formas-base verificadas e cria URL PokeAPI exata atendida offline via `VerifiedSpriteCache` nos dois WebViews. Não troca formas especiais ou trajes por base falsos.
- **3 perfis Favoritos:** chaves globais `favoritePresetV1_1..3`, `favoritePresetActiveV1` e lista ativa `watchList` são compartilhadas pelos overlays; perfis inativos permanecem salvos e não disparam alertas. Alertas de Novos são configurados individualmente por overlay; permissões Android, DND, volume e modo OFF/Sem som permanecem respeitados.
- **QA assinada corrigida:** [APK `PokeSearch-v0.01.06-LT-Alerts-Sprites-QA.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.06-54310-qa/PokeSearch-v0.01.06-LT-Alerts-Sprites-QA.apk), `versionName 0.01.06` / `versionCode 54310`, tamanho 41.749.278 bytes, SHA-256 `6ee021e683c7e09ffef00d2f07d4011754e3b3fe5e36c42cc0c42ac0eb01d947`, SOURCE_COMMIT `288da0c8fac741f011e64b952f2fcb5a490c69c0`, Actions [#40225008916](https://github.com/LucianoToscano/PokeSearch/actions/runs/40225008916) SUCCESS. R8, assinatura Android v2, certificado permanente, suites Node/Java e 1.025+1.025 sprites verificados. **PR #70 MERGED na main** (squash `43d04544722261a39b71d3bd32b51f9346780c5b`). A main inclui ainda endurecimento posterior no parser do atualizador; o APK QA assinado refere-se exatamente ao SOURCE_COMMIT acima e não deve ser apresentado como build do HEAD documental mais recente.
- **Importante:** pré-release QA apenas, não altera LT103 no canal estável nem APK do Drive. Samsung físico não homologado: testar permissões, som de Novos/Favoritos, volume, perfil ativo, resultados API, distinção entre sprites-base/formas especiais e dois overlays. Ver [auditoria detalhada](POKESEARCH_LT107_AUDITORIA_API_ALERTAS_SPRITES_VERSAO_20261025.md).


## LT110 — Correção de sprites nos cards e filtros sem localização (25/10/2026)
- **Checkpoint e backup:** main inicial `c9a75ca38021f6cbeb954a7abb6873c5ba4eb928`, backup `backup/lt107-before-detail-sprite-fix-20261025` (imutável). PR [#71](https://github.com/LucianoToscano/PokeSearch/pull/71) **MERGED na main** por squash `6e1fb7af50a7a92738b5bff1dd9c856ed15fe60f`.
- **Sprites ausentes dentro dos cards de detalhes:** `detail.html` carrega num WebView distinto e antes usava apenas URLs HTTPS. `sprite_offline.js` compartilhado com `dock.html` agora usa os 2.050 PNGs normais/shiny locais `file:///android_asset/pokemon-sprites/...<dex>.png` para URL-base PokeAPI verificada. Fallback exato mantém forms/trajes desconhecidos sem exibir imagem falsa; lista e cards carregam mesma espécie; isso vale para os dois overlays.
- **Furfrou Natural #676:** recebe sprite-base verificado no `api_result_contract.js` mesmo com `form=Natural/Furfrou Natural/FURFROU_NATURAL`. Demais cortes (Dandy, Kabuki, Heart, etc.) não recebem base errada.
- **Filtros Tamanho/Sexo/etc. bloqueados por erro irrelevante de localização:** `dock.html` não bloqueia Aplicar para chips XXS/XS/S/M/L/XL/XXL, Sexo ♂/♀/⚲, PC, Nível, Clima e Forma quando uma ordenação antiga `Distance (nearest)` ficou salva mas a localização está OFF. Agora ela volta para `Despawn (longest)` e preserva demais parâmetros. Escolher explicitamente Distância sem coords/raio exibe aviso contextual. `OverlayService.patchSearchFilters` possui defesa equivalente. Na inicialização, migra somente `sortBy` residual inválido, preservando todos filtros, perfis e sessão.
- **QA automática:** [Node QA do HEAD original da PR](https://github.com/LucianoToscano/PokeSearch/actions/runs/40228142893) SUCCESS e [compilação Java Android](https://github.com/LucianoToscano/PokeSearch/actions/runs/40228142900) SUCCESS. Testes `lt108-detail-offline-sprites.test.js` e `lt108-filter-application-audit.test.js` protegem estes cenários.
- **Nova build QA:** `0.01.10`/`versionCode 54314` usando certificado de release permanente e R8; [GitHub Actions build](https://github.com/LucianoToscano/PokeSearch/actions/runs/40228138666). Registrar sha do APK e status de upload depois de sucesso; este código não deve ser confundido com as versões QA imutáveis 0.01.07/08/09.
- **Status:** PR integrada, teste Samsung de sprites/menus/filtros ainda **pendente**. Não alterar APK oficial estável nem link no Google Drive sem teste/distribuição expressos. Ver [auditoria detalhada LT108/LT110](POKESEARCH_LT108_CARD_SPRITES_20261025.md).


### APK LT110 0.01.10 QA — assinatura confirmada
- **Arquivo:** [`PokeSearch-v0.01.10-LT-Sprites-Filters-Migration-QA.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.10-54314-qa/PokeSearch-v0.01.10-LT-Sprites-Filters-Migration-QA.apk); `versionName=0.01.10`, `versionCode=54314`, 41.751.324 bytes.
- **SHA-256:** `3caf3f5831f5e5e230eba4b3acd13c9b6c67fffe7a9469e7290a30b0cac70a63`.
- **SOURCE_COMMIT assinado:** `c34437f6f25d9e0ea8cf7d2e2279986e1dea998a` (branch de QA antes do squash), distinto do commit `6e1fb7af50a7a92738b5bff1dd9c856ed15fe60f` mesclado à main e de alterações documentais posteriores.
- [**GitHub Actions #40228138666**](https://github.com/LucianoToscano/PokeSearch/actions/runs/40228138666) **SUCCESS**: Node/Java QA; 1.025 sprites normais e 1.025 shiny no APK; Android release não depurável, R8, assinatura v2 permanente, verificação pacote/versão/assinatura e upload.
- [**Release QA**](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.10-54314-qa) marcada como `prerelease=true`, **não** substitui a release pública estável, nem o arquivo Drive. APKs QA 0.01.07/08/09 preservados e não sobrescritos.
- **QA físico Samsung ainda pendente** para confirmação visual de Furfrou Natural, sprites em todos os detalhes, 2 overlays, filtros Tamanho/Sexo/PC/Nível, reset de Distance residual e atualizações de favoritos/notificações.


## LT111 — Ocultar ativação da segunda Pokébola na Home (25/10/2026)
- **Backup pré-LT111:** `backup/lt110-before-hide-second-pokeball-home-20261025`, SHA `e20f4c0469787edef1a4489159d44036dbc24bf0` (não sobrescrever).
- **PR #72:** [ocultar segunda Pokébola na Home](https://github.com/LucianoToscano/PokeSearch/pull/72); branch `fix/lt111-hide-second-pokeball-home-20261025`.
- **Interface:** `MainActivity.buildHome()` mantém o controle interno antigo, mas não exibe a linha `Segunda Pokébola · filtro independente` porque `dualOverlayRow.setVisibility(View.GONE)` é aplicado antes de anexar a linha. Zero espaço visual, sem botão de ativação tocável/acessível.
- **Preservação:** Pokébola principal e seus botões continuam normais; `SecondaryOverlayService`, filtros e posição `prefs_secondary` não são apagados, som, API, sprites, 3 favoritos e sessão permanecem. Uma instância secundária já ativa não é parada apenas porque a opção de habilitar foi ocultada.
- **Teste/QA:** `lt111-hide-second-pokeball-home.test.js`; workflow [LT111 signed QA](https://github.com/LucianoToscano/PokeSearch/actions/workflows/lt111-hide-second-pokeball-signed-qa.yml), gera candidato `0.01.11`/`versionCode 54315` com assinatura permanente, Android release R8, testes e sprites locais.
- **Status:** antes de declarar estabilidade: conferir no Samsung ausência da opção e do espaçamento extra, botão principal, continuidade de eventuais instâncias secundárias e preservação dos dados. Manter release oficial/Drive intactos.
- Detalhes em [LT111](POKESEARCH_LT111_HIDE_SECOND_POKEBALL_HOME_20261025.md).


## PUBLICAÇÃO OFICIAL LT111 — PokeSearch 0.01.11 (25/10/2026)
- **Aprovação explícita do usuário:** publicar atualização LT111. Publicada como release **estável/latest** no GitHub pelo workflow [Actions #40230454383](https://github.com/LucianoToscano/PokeSearch/actions/runs/40230454383), **SUCCESS**, sem recompilar APK.
- **Release oficial:** [v0.01.11-54315](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.11-54315), não draft, não prerelease, latest. **Download direto:** [PokeSearch-v0.01.11-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.11-54315/PokeSearch-v0.01.11-LT.apk).
- `versionName=0.01.11`, `versionCode=54315`, 41.751.324 bytes. **SHA-256:** `4e5aa5bd9710df28b00545c3496f58f203a05053268fab0b60185942c3bacc64`; certificado de release permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, Android v2 e R8 verificados pelo workflow. Arquivo **idêntico** ao QA assinado de [#40229950113](https://github.com/LucianoToscano/PokeSearch/actions/runs/40229950113).
- SOURCE_COMMIT do APK `f3dd2ba2286a84cbb5f4cd43da328339afe92a80`; PR [#72](https://github.com/LucianoToscano/PokeSearch/pull/72) squash-merged para `9dcc7b00cee3751db8f5f286455a117beff5b651`. Workflow oficial confirmou `git diff --quiet` em `app/src/main` e Gradle entre fonte QA e main antes de publicar. Commits posteriores apenas de workflow/guia.
- **Canal de atualização GitHub do app:** consulta `/repos/LucianoToscano/PokeSearch/releases/latest`, exige `prerelease=false`, `draft=false`, pacote/versão/código/assinatura/digest verificados antes de instalar. Agora retorna oficialmente `v0.01.11-54315`.
- **Google Drive:** o manifesto `atualizacao.json` (ID `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf`) **não foi alterado** nesta publicação, pois não existe upload de novo APK LT111 verificado nesse Drive. Não anunciar Drive como atualizado. A release GitHub já fornece download e mecanismo de atualização automáticos.
- **Backup de segurança:** `backup/lt110-before-hide-second-pokeball-home-20261025` aponta para `e20f4c0469787edef1a4489159d44036dbc24bf0`, intacto. Homologação visual no Samsung continua a ser verificada em campo; código e assinatura auditados.

## LT117 — Aplicação do Plano LT116 em QA (26/10/2026)
- Documentação: [POKESEARCH_LT117_EXECUCAO_PLANO_CORRECOES_20261026.md](POKESEARCH_LT117_EXECUCAO_PLANO_CORRECOES_20261026.md), derivado do DOCX de auditoria do usuário.
- P1-01: alerta geral por encontro com deduplicação **após** Android aceitar notificação; histórico e avisos separados, TTL, P1/P2 independentes.
- P1-04: fila de Favoritos em lotes de até cinco espécies a cada 12s; respeita som, canal, TTL, novas tentativas e estado por Pokébola.
- P1-02: FirebaseStats usa escalares `stats/public`; regras versionadas ocultam UIDs, Cloud Functions de agregados NÃO implantadas, exigem deduplicação de eventos/backfill e permissão explícita.
- P1-03: Mural somente leitura no app e regras versionadas de post/reply negadas. Moderação e rate-limit backend pendentes; nenhuma regra foi implantada.
- P2-01/P2-03: comentário da fonte API alinhado; removida leitura de árvore inteira.
- QA candidata 0.01.17/54321 apenas; nenhuma publicação oficial/merge/alteração na main. Samsung P1/P2 e backend ainda **NO-GO**.


### LT117 QA 0.01.17 — build protegido validado (26/10/2026)
- [GitHub Actions #40402057720](https://github.com/LucianoToscano/PokeSearch/actions/runs/40402057720) **SUCCESS**: 82 suítes Node ativas (teste LT74 DEBUG antigo excluído), Java independente, Gradle `:app:testDebugUnitTest` (verificar resultado NO-SOURCE), `:app:assembleRelease`, R8 e assinatura.
- APK: `PokeSearch-v0.01.17-LT-Audit-Fixes-QA.apk`, **source commit** `5c14d3a67d63ceb61b7dad5cdc947763ec0af05b`, `versionName=0.01.17` / `versionCode=54321`, 41.751.812 bytes.
- APK SHA-256: `15af7e7a436e351ce74d2032d1f084f495c088e9b29520d8fd2c8d30b7320fab`; certificado v2 SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- APK ZIP íntegro; 1.025 PNG base e 1.025 PNG shiny com hashes 2.050/2.050. **Zero hash alterado** em comparação ao QA LT116.
- **No-go:** o código Firebase/Functions foi somente versionado, sem deploy/regras em produção. Contadores agregados ainda exigem idempotência/servidor/migração; Mural sem escrita até moderação segura. Não mesclar/lançar sem homologar 110 cenários Samsung nas duas Pokébolas e obter aprovação.


### LT178 PUBLICADA OFICIALMENTE — 29/10/2026

- Merge confirmado: PR #134 → `main`, commit `7344f6039f4ba388cfbc42fa492e1327ac6fdf58`.
- [GitHub Actions — publicação oficial concluída SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40939407855).
- Tag `v0.01.78-54383`, versão Android `0.01.78`, versionCode `54383`.
- [GitHub Release/latest LT178](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.78-54383).
- [APK oficial assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.78-54383/PokeSearch-v0.01.78-LT.apk), **49.541.890 bytes**.
- SHA-256 do APK: `45571c188dcc7ecb1290963674d0a81d67ea450e66a32e0774072167b3e1df4e` (digest publicado pela API do GitHub e verificado no workflow).
- `Releases/latest` confirmado como LT178 (draft=false, prerelease=false); atualização poderá ser vista pelo atualizador existente na próxima consulta, conforme preferências e permissões do Android. A instalação exige confirmação do usuário, sem instalação forçada.
- **Google Drive não atualizado nesta etapa:** o registro de Drive anteriormente usado não foi encontrado no escopo da conta Drive conectada; link antigo não foi alterado nem declarado atualizado. Distribuição pública verificada via GitHub.
- Após publicação, testes funcionais de uso real no Samsung/Moto devem validar menus, sessão autenticada, chamada API/429, contagem e cópia. O sucesso automático não equivale à homologação física.


### LT179 QA — ↻ Doce Raro e atualizar quando todos copiados (29/10/2026)
- Base da branch: LT178 oficial `0.01.78 / 54383`; não alterar/invalidar a distribuição atual.
- Branch: `fix/lt179-candy-refresh-after-copy-20261029`; detalhes e checklist em [LT179](LT179_DOCE_RARO_REFRESH_APOS_COPIA_20261029.md).
- Toque curto ↻: `pointerup` + fallback `click` deduplicado 400ms na WebView local; segurar por 550ms abre somente 1/3/5 min. Bridge Android confirma recebimento com Toast.
- Ao copiar a última coordenada ainda ativa e colorida, marca cinza e solicita a próxima busca uma vez por geração; toques em coordenadas já cinzas não fazem nova consulta. Continua respeitando `Retry-After` e guardando atualização pendente até o fim do bloqueio.
- Proteção contra loop e cap oficial de 10 preservadas; duas Pokébolas sem alterações. Teste `lt179-candy-refresh-gestures.test.js` e regressão LT175.
- Workflow QA isolado `lt179-candy-refresh-signed-qa.yml` tenta gerar versão `0.01.79 / 54384` assinada; validar execução/arquivo/hash antes de anunciar artefato. Não houve autorização nesta solicitação para merge, Release, Drive ou atualização pública.

### Espelho Google Drive LT181 para compartilhar (29/10/2026)
- **Pedido:** compartilhar também no Google Drive. O APK oficial extraído do artefato GitHub Actions `PokeSearch-LT181-54386-Oficial-Assinado` foi comparado byte a byte pelo tamanho **49.546.158** e hash SHA-256 `03567e9cfaa16ad597039cc41ee22ca4ae59f808f51143fc000a33acdb35c98f` do Release oficial.
- **Upload concluído:** [PokeSearch-v0.01.81-LT.apk](https://drive.google.com/file/d/1sOV61y9De_OkPk1Kxqd2jbj2l70AwJGt/view?usp=drivesdk), Drive ID `1sOV61y9De_OkPk1Kxqd2jbj2l70AwJGt`, MIME `application/vnd.android.package-archive`. O arquivo está na [pasta compartilhada PokeSearch_App](https://drive.google.com/drive/folders/1fVw93qUDE0YWp6tlJZaNjRmymyhEAUbR), pasta ID `1fVw93qUDE0YWp6tlJZaNjRmymyhEAUbR`.
- **Compartilhamento verificado em Drive:** permissões de acesso `anyone` com papel `commenter` (herdadas da pasta), não indexado por busca; qualquer pessoa com link pode abrir e baixar. Não foi modificado o Google Drive `atualizacao.json` legado nem seu pacote anterior. **Canal de atualização automático permanece GitHub Releases/latest.**

## LT184 QA — Sincronização de notificações de Favoritos P1/P2 (29/10/2026)
- Relato: lista compartilhada de 13/50 selecionados; P2 alerta, mas P1 100% aparentemente não. Diagnóstico: a mudança de `watchList` ou modo global não avisava a outra instância até a próxima pesquisa.
- `OverlayService` agora escuta as preferências globais em ambas as instâncias e reavalia somente resultados verificados, atuais, não expirados, que correspondam aos filtros próprios da Pokébola; filas e deduplicação seguem independentes. Testes nativos identificam P1/P2.
- Regressões adicionadas à suíte LT112 de ambas as Pokébolas. **Publicação oficial efetuada:** PR #142 mesclada, GitHub Actions assinado e APK LT184 publicado e espelhado no mesmo ID do Drive; restam QA físico Samsung P1/P2 e confirmação de encontro real IV 100%.
- Detalhes e roteiro: [LT184 QA](LT184_FAVORITOS_ALERTAS_P1_P2_QA_20261029.md).
