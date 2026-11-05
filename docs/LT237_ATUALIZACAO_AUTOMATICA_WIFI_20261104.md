# LT237 — Atualização automática segura no aplicativo (04/11/2026)

## Estado — publicação oficial confirmada

**LT237 0.02.37 / versionCode 54441 PUBLICADA pelo canal oficial de atualizações.**
- PR [#208](https://github.com/LucianoToscano/PokeSearch/pull/208) mesclada por squash: fonte da release / HEAD de merge `061fdfa678ac25fbd65c3783cf9c0be02e4d71bc`.
- QA em PR SHA `df181c91a6fe349805f48a68abe96b8de47699a8`: Node, core, compilação Java Android, QA OTA assinada e APK beta protegido todos `success`.
- [GitHub Actions oficial #41960200682](https://github.com/LucianoToscano/PokeSearch/actions/runs/41960200682): `conclusion=success`, release `v0.02.37-54441`, `draft=false`, `prerelease=false`, publicada em `2026-11-05T03:16:32Z`.
- [APK assinado PokeSearch-v0.02.37-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.37-54441/PokeSearch-v0.02.37-LT.apk): **28.125.033 bytes**, SHA-256 `954572ce0f21d6e90e8ac665d73389e2d9b0682127c215ba02ded6d7b3097dd2` (verificado pelo release e workflow). Certificado Android original pinado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Inclui cumulativamente LT236 — Pokébola 2 sem VIP e projeções PvP das 60 Megaformas. **Teste físico Samsung/instalação do usuário ainda não comprovado.**
- A primeira atualização para LT237 a partir de LT233 exige a ação do usuário no app antigo; depois de instalar LT237, o pré-download em Wi-Fi ficará habilitado por padrão, com confirmação de instalação pelo Android.

## Comportamento implementado
- Fonte única dos APKs: GitHub `releases/latest`, Release estável, tag/nome/versionCode/digest válidos e acima do `BuildConfig.VERSION_CODE`.
- WorkManager com janela de 30 minutos (horário não garantido devido a Doze/bateria/rede), e consulta na abertura da Home.
- Quando há Release nova, pré-download automático **habilitado por padrão, apenas em rede não tarifada**; cancelado ao deixar essa rede. Configuração na Home: `Baixar atualizações automaticamente no Wi-Fi`.
- Transferência em executor dedicado com exclusão mútua de downloads; cache no diretório privado `updates`. Toda transferência confere tamanho e SHA-256, identidade do pacote, versão, app não depurável e certificado Android v2 permanente antes de renomear o arquivo `.partial`. Um APK já em cache é revalidado com hash e assinatura antes de reaproveitar.
- Após download validado, limpa APKs antigos no mesmo cache privado; a Home identifica a atualização **pronta para instalar**. Aviso nativo de atualização disponível / pronta, respeitando a preferência de notificações e permissão Android.
- Ao tocar em **Instalar atualização**, o APK é **revalidado** e entregue ao instalador oficial do Android com `FileProvider`. O usuário deve confirmar a instalação; não há instalação silenciosa, bypass de Play Protect, Bloqueador Automático Samsung ou permissões especiais.
- O fallback por navegador continua disponível; alterações Java exigem APK completo assinado, não apenas OTA de assets.

## Verificações concluídas e pendências

1. **Concluído:** regressões de Node, compilação Java Android, teste OTA, APK beta protegido no SHA da PR, build de release assinado e publicação verificável no GitHub.
2. **Concluído:** `releases/latest` aponta para LT237; nome, tamanho, SHA-256 do APK e identidade do certificado verificados no release oficial.
3. **Pendente:** no Samsung, verificar recebimento do aviso na LT233, instalação sobre o aplicativo existente sem desinstalar, preservação dos dados, P1/P2, Megas, banner pronto, permissão para instalar apps e notificações.
4. **Pendente:** testar Doze, economia de bateria, falta de espaço, cache danificado, redes tarifadas/VPN, mudança de Wi-Fi e atualização de versões QA instaladas. O Android não garante periodicidade exata do WorkManager.
5. **Governança futura:** publicar cada nova versão após QA e assinatura oficial. O atualizador instalado encontrará automaticamente novas Releases estáveis, mas não cria nem aprova novas versões sozinho. Nunca alterar a assinatura ou aceitar APK não verificado.

## Arquivos alterados
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/GitHubUpdateCenter.java`
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java`
- `app/src/main/AndroidManifest.xml`
- `app/tests/lt237-automatic-app-updates.test.js`
- `app/src/main/assets/release_notes.json`
- `.github/workflows/lt237-official-release.yml`
- `app/tests/lt203-ota-installer-handoff.test.js`
- `.github/workflows/pokesearch-node-qa.yml`

Documentos de continuidade: `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`, `docs/LT236_ATUALIZACAO_OFICIAL_P2_MEGAS_20261104.md`.
