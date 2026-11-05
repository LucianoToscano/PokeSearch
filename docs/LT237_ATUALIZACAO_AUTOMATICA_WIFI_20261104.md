# LT237 — Atualização automática segura no aplicativo (04/11/2026)

## Atualização de estado — LT237 OFICIAL (05/11/2026)

- **Publicação confirmada:** [v0.02.37-54441](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.37-54441) em `2026-11-05T03:16:32Z`, `releases/latest`, estável (sem draft/prerelease), compilação e assinatura concluídas.
- **Código de origem:** merge da [PR #208](https://github.com/LucianoToscano/PokeSearch/pull/208), SHA `061fdfa678ac25fbd65c3783cf9c0be02e4d71bc`. Incorpora a LT236 (segunda Pokébola livre de VIP e PvP das Megas).
- **Workflow:** [Actions #41960200682](https://github.com/LucianoToscano/PokeSearch/actions/runs/41960200682) finalizado com `success`; certificado v2 permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **APK:** [PokeSearch-v0.02.37-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.37-54441/PokeSearch-v0.02.37-LT.apk), 28.125.033 bytes, SHA-256 `954572ce0f21d6e90e8ac665d73389e2d9b0682127c215ba02ded6d7b3097dd2`. Guia Mestre contém verificação independente de download/assinatura, reports e artefato.
- **Instalação em Samsung:** ainda sem comprovação física. A versão LT233 detecta LT237 como atualização, mas a primeira instalação exige ação do usuário. Depois, a LT237 fará pré-download automático em rede não tarifada por padrão; a instalação segue exigindo a confirmação do Android.

## Comportamento implementado
- Fonte única dos APKs: GitHub `releases/latest`, Release estável, tag/nome/versionCode/digest válidos e acima do `BuildConfig.VERSION_CODE`.
- WorkManager com janela de 30 minutos (horário não garantido devido a Doze/bateria/rede), e consulta na abertura da Home.
- Quando há Release nova, pré-download automático **habilitado por padrão, apenas em rede não tarifada**; cancelado ao deixar essa rede. Configuração na Home: `Baixar atualizações automaticamente no Wi-Fi`.
- Transferência em executor dedicado com exclusão mútua de downloads; cache no diretório privado `updates`. Toda transferência confere tamanho e SHA-256, identidade do pacote, versão, app não depurável e certificado Android v2 permanente antes de renomear o arquivo `.partial`. Um APK já em cache é revalidado com hash e assinatura antes de reaproveitar.
- Após download validado, limpa APKs antigos no mesmo cache privado; a Home identifica a atualização **pronta para instalar**. Aviso nativo de atualização disponível / pronta, respeitando a preferência de notificações e permissão Android.
- Ao tocar em **Instalar atualização**, o APK é **revalidado** e entregue ao instalador oficial do Android com `FileProvider`. O usuário deve confirmar a instalação; não há instalação silenciosa, bypass de Play Protect, Bloqueador Automático Samsung ou permissões especiais.
- O fallback por navegador continua disponível; alterações Java exigem APK completo assinado, não apenas OTA de assets.

## Validações e pendências pós-publicação

1. **Concluído:** testes Node, Android/Java, OTA assinado, beta privado e APK oficial, além da verificação de SHA-256, packageName, versionCode e certificado.
2. **Concluído:** `releases/latest` contém o asset oficial assinado e oferece a LT237 às versões elegíveis.
3. **Pendente:** teste físico no Samsung com LT233 instalada (sem desinstalar), instalação sobreposta, permissões, notificações, P1/P2, Megas e integridade dos dados.
4. **Pendente:** teste real de Wi-Fi sem rede, rede tarifada, VPN, Doze, cache danificado e pouco espaço; WorkManager não garante horário exato.
5. **Futuras versões:** serão procuradas e pré-baixadas pelo app quando disponibilizadas como Releases oficiais estáveis; gerar, assinar e aprovar cada nova release ainda requer pipeline de publicação e QA. Não há instalação silenciosa.

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
