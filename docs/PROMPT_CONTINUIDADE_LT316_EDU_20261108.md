# PROMPT PARA CONTINUAR POKÉSEARCH — LT316 EDU (08/11/2026)

Continue o Android `LucianoToscano/PokeSearch` em português do Brasil, sem começar do zero e sem downgrade. **ÚLTIMA RELEASE:** LT316 · `0.03.16` · versionCode `54522`, label `51320`. Tag https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.16-54522 ; APK `PokeSearch-v0.03.16-LT.apk` (34.708.590 bytes, SHA256 `7646eb5254da13f5da930813767d4265701da37a46f59d2d9fba2373ca47c252`). Workflow oficial https://github.com/LucianoToscano/PokeSearch/actions/runs/42513115954 **success**. PR #316 squash `ec12fc48c7116449d7785dd6ba51a744b3fcff44`; release request commit `fd3cdf373b4bb79e900b4e182ff38a8ffe530a03`. Original signing cert Android v2 fingerprint `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.

Leia primeiro, na ordem: `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`, `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`, `docs/LT316_EDU_RETOQUE_FINAL_5_QUADROS_20261108.md`, `docs/LT316_EDU_AUDITORIA_COMPLEMENTAR_68_LEGIBILIDADE_20261108.md`. Confirmar main, Releases/latest, PRs e CI antes de qualquer alteração.

### Identidade e animações
68 sprites (0–67) integradas. Atlas revisado `app/src/main/assets/edu_avatar_uniform_68_lt316.b64` (WebP lossless 1024×1152 em Base64), com 51 ajustes gerais. `EduSpriteManualRetouch.java` implementa tratamento especial dos quadros 20/28/30/36/49 para aumentar **apenas** o personagem e manter celular, calendário e ícones na escala original, preservando borda, rosto, cabeça e pés. `EduSpriteAtlas.java` aplica ajustes apenas se a arte QA carregar, com fallback LT315; cache por frame e pixel art sem blur. Teleportes 52–60 permitem variação de tamanho/opacidade intencional. Preservar poses Jogando, Sombria ansiosa, Shiny, armaduras e 22 animações ociosas, com pausas naturais.

Tamanho fixo de visualização P50/M75/G100 (G padrão). Cabeça/corpo devem parecer o mesmo Edu durante as trocas; evitar mudança lateral. Em P50 é impossível prometer leitura de letras pequeninas desenhadas na arte: o balão deve trazer instruções em texto. **QA visual em Samsung físico ainda pendente**; não declarar feita sem vídeo/print confirmando instalação LT316.

### Preservar
Relógio Edu único (automático/manual, fonte da Home); Mega Chandelure exemplo histórico por fuso IANA (31/10/2026, 14–17h local); tutorial E01–E11; duas Pokébolas P1/P2, Doce Raro, scanner/PoGoCoordinates, IV/PvP, favoritos, login, notificações, Firebase, dados, atualização segura por GitHub, assinatura v2 original. Nada concede passes ou manipula Pokémon GO.

Mudanças futuras: confirmar autorização, usar branch/PR, executar Node completo/LT169/LT211/Java LT62/OTA LT173, integrar squash, emitir pedido protegido em `release/official-request.json`, verificar versão/APK/assinatura/SHA/limite e registrar no Arquivo Mestre. Responder sem menus extras ou interfaces poluídas.


## QA em andamento após a Release LT316 (ainda NÃO publicada como LT317)

A PR em rascunho [#317](https://github.com/LucianoToscano/PokeSearch/pull/317), branch `qa/lt316-edu-samsung-visual-guards-20261108`, protege o tamanho P/M/G da sprite Edu quando o atlas antigo LT304 falha no carregamento (função `eduAvatarArtSize()` em `RaidDayAssistantOverlayService.java`). Acrescenta `app/tests/lt316-edu-samsung-visual-guards.test.js` para as 22 poses ociosas, Sombria e teleporte só por gatilhos, cinco retoques e fallback LT315. `AGENTS.md` foi alinhado à LT316. CI no commit de código `eb3a0e44d5c268f04c1c75b74e4c88043b48b45f`: Node/LT169/LT211/Java LT62/OTA LT173 todos SUCCESS. Guia e detalhes em `docs/LT316_EDU_HOMOLOGACAO_VISUAL_GUARDAS_20261108.md`.

**Pendente:** homologação física Samsung em P50/M75/G100 com vídeos/prints. A PR #317 permanece draft, sem merge nem novo APK/Release. Jamais usar o código de QA para declarar LT317 oficial; qualquer publicação futura exige autorização expressa, workflow e validação de assinatura/hash.
