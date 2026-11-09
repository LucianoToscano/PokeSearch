# LEIA PRIMEIRO — PokeSearch LT322 oficial (09/11/2026)

**ÚLTIMA RELEASE OFICIAL VERIFICADA: LT322 · 0.03.22 · versionCode 54528 · label 51326.** [Release pública](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.22-54528); [APK PokeSearch-v0.03.22-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.22-54528/PokeSearch-v0.03.22-LT.apk), **34.788.940 bytes**, SHA-256 `91db785c8c69218d10ced2cf15cee57aa7b6fa99d5da12730644bb567e72d3a8`. PR #322 squash `062ff94f3f259b7ff623c300c8f83970b485596d`, fonte `5a35e7f9cabec43781d7780256648d450f8a6670`, [workflow oficial #42649309515](https://github.com/LucianoToscano/PokeSearch/actions/runs/42649309515) `completed/success`, certificado v2 permanente preservado. Evoluções: 77 condições, 15 ícones de imagem em miniaturas 64×64, janela temporal do Dia Comunitário de Kingambit. API, dados, Edu e P1/P2 preservados; **QA físico Samsung ainda pendente**. Leia `docs/GUIA_MESTRE.md` e `docs/LT322_EVOLUCOES_ESPECIAIS_ITENS_CONDICOES_20261109.md`. Não fazer downgrade.

---

## Histórico anterior — LT320 Edu (08/11/2026)

**PADRÃO DEFINITIVO DO EDU (09/11/2026):** a imagem fornecida e aprovada pelo proprietário do **Edu Parado #42** é a nova referência visual canônica. Original preservado na Biblioteca `/PokeSearch/Arquivos Mestres/Edu/Edu_Parado_42_PADRAO_OFICIAL_2026-11-09.jpg`, SHA-256 `dd995781c039972bd72ea22bc2d89c7c32c04cf056d1dfd96d3e94d735fec1cc`. Ler [documento de identidade visual](docs/EDU_PADRAO_VISUAL_OFICIAL_SPRITE_42_20261109.md) **antes de retocar ou recriar qualquer uma das 68 sprites**. O original é JPEG 1536×1536 RGB com fundo preto, não uma sprite transparente pronta para substituir o atlas; este registro não altera o APK.

> **REGISTRO HISTÓRICO DA SOLICITAÇÃO LT321 (posteriormente publicada em 09/11/2026):** A [PR #321](https://github.com/LucianoToscano/PokeSearch/pull/321) do upscale das 68 sprites Edu foi integrada na `main` (squash `5bd5bceff6b5abcb0d0cb995aeb1a910f2387e2f`). Cinco gates no head `f4505595a3e8c8b1b42d3366297cf819d2a3b1da` passaram. A solicitação oficial foi escrita em `release/official-request.json` (commit `37452bdcce96f998510a15c0aa72c95c604e0e43`) para **0.03.21/code54527**, mas **não considerar publicada até verificar workflow, tag e APK**. Última Release comprovada abaixo permanece LT320. Registrar resultado no Guia Mestre assim que comprovado. QA físico Samsung segue pendente.\n\n**BASE HISTÓRICA LT320 (não é mais a versão atual): 0.03.20 · versionCode 54526 · label 51324.** [Release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.20-54526), publicada em 08/11/2026 às 23:15:47 UTC; APK [PokeSearch-v0.03.20-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.20-54526/PokeSearch-v0.03.20-LT.apk) de **34.710.274 bytes**, SHA-256 `ed44ac2214c569392c57d1e88ebeb422889c78281b9d9518c295304016c76bc8`. PR #320 merge `b98e80b8a0b44d4b5e1d68e0b782a61e5507f39a`, fonte/pedido `20f88cc3cf36ef1da75445d5f95d0122d31f0615`, [workflow #42534031454](https://github.com/LucianoToscano/PokeSearch/actions/runs/42534031454) **SUCCESS**, assinatura permanente preservada. Não começar do zero nem fazer downgrade.

**Edu LT320:** 68 sprites do atlas original em **128px por quadro**, amostradas em buffers **512px** sob demanda para exibição, cache LRU 8 e fallback seguro; **isso não é a fonte original 512 nem redesenho do rosto**. P100/M150 (padrão)/G200 preservados. Relógio virtual da Home simplificado: oito momentos essenciais **na mesma tela**, controle de tamanho P/M/G, slider **0–60% transparência** aplicado só no fundo do balão, mantendo letras, links e personagem opacos. As configurações são persistidas e refletidas no overlay em tempo real. Internamente os 17 momentos permanecem por compatibilidade. Preservar UX de conversa LT318, sprites de fase, contador, E01–E11, duas Pokébolas, Doce Raro, PoGoCoordinates, dados e assinatura.

**QA físico Samsung pendente**: verificar nitidez verdadeira dos olhos, tamanho, sobreposições, slider e oito momentos. Se a origem 128 realmente não tiver detalhes suficientes, obter o conjunto de 512 masters antes de redesenhar as 68 sprites. Ler [relatório oficial LT320](docs/LT320_EDU_RELEASE_OFICIAL_QUALIDADE_SLIDER_20261108.md), [Guia Mestre](docs/GUIA_MESTRE.md) e [prompt LT320](docs/PROMPT_CONTINUIDADE_LT320_EDU_20261108.md).

---

## Histórico LT319 — versão anterior


**BASE ATUAL OFICIAL: LT319 · 0.03.19 · versionCode 54525 · label 51323.** [Release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.19-54525), publicada em 08/11/2026 às 22:40:59 UTC; APK [PokeSearch-v0.03.19-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.19-54525/PokeSearch-v0.03.19-LT.apk) de **34.709.718 bytes**, SHA-256 `a0cf19f7af8b6e954c24b905ec21899ec519b23dc1422bee7a595f1d1511758f`. PR #319 integrada por squash `893edb035531323c635161f7ee1412be9a4ebd82`; fonte/pedido protegido `f556338f9bf6e2d331bd11e817527a2a45177245`; [workflow oficial #42531166399](https://github.com/LucianoToscano/PokeSearch/actions/runs/42531166399) **SUCCESS**. Certificado Android v2 permanente preservado; não começar do zero ou fazer downgrade.

**Edu LT319:** tamanhos **P100 / M150 (novo padrão) / G200 pixels**, migração única de escolhas anteriores P50/M75/G100 preservando categorias. O atlas de 68 quadros não foi redesenhado; filtros de bitmap/antialias/dither desligados e renderização por software para melhorar a nitidez dos olhos, óculos e bordas. O **painel do relógio virtual** na Home foi compactado: hora/data grandes, Automático, 17 momentos e Ajustar data/hora; fuso e 24h ficam recolhidos em Mais opções. Mantida a primeira conversa simples do Edu da LT318, sem X, ETAPA e botões desnecessários, sprites por fase, contador e checklist, E01–E11, P1/P2, PoGoCoordinates, Doce Raro, ranking, dados, OTA e segurança.

**Homologação física Samsung PENDENTE:** confirmar nitidez real dos olhos, tamanhos, gestos, balão e relógio após instalar LT319 sobre LT318. CI/Release não comprovam instalação nem aparência perfeita. Ler [relatório LT319](docs/LT319_EDU_PUBLICACAO_OFICIAL_SPRITES_RELOGIO_20261108.md), [Guia Mestre](docs/GUIA_MESTRE.md) e [prompt LT319](docs/PROMPT_CONTINUIDADE_LT319_EDU_20261108.md).

---

## Histórico LT318 — versão anterior


**BASE OFICIAL VERIFICADA: LT318 · 0.03.18 · versionCode 54524 · label 51322.** [Release oficial](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.18-54524) publicada em 08/11/2026 às 21:59:05 UTC. [APK PokeSearch-v0.03.18-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.18-54524/PokeSearch-v0.03.18-LT.apk) **34.709.358 bytes**, SHA-256 `14e28a71fcbbadae35179c91c61e40957f6f7d865e886299f3c5845ef9462280`. PR #318 squash `9688f8e25788d4b3bfae2eb2aba9b2b38fd08de6`, commit fonte `8eef94422ab26d76f7afbc7f3b335d08911df483`, workflow protegido [#42527566539](https://github.com/LucianoToscano/PokeSearch/actions/runs/42527566539) **SUCCESS**, assinatura Android v2 permanente verificada. **Não reiniciar ou fazer downgrade.**

**Edu corrigido LT318:** primeiro balão sempre abre apresentação e `Bug dos Passes ⓘ` mesmo com sessão antiga salva (ex.: `ETAPA 10/11`). Cabeçalho com etapa, X, botões `Conferir novamente`/`Rever região`, nomes técnicos de fuso, `relógio simulado` e `exemplo histórico` foram retirados do primeiro fluxo. Sprites conforme estado: apresentação #42, antes #38, ativo #37, encerrado #36, atualizadas com prioridade. Se antes do início, contador regressivo em dias/horas/minutos/segundos e checklist com três `ⓘ` no balão. Chandelure 31/10/2026 14h–17h local é a janela-base sem outro evento válido. O único relógio da Home com 17 momentos é ferramenta para testar eventos; **Edu não fala do relógio**. Mantidas 68 sprites/22 ociosas, P/M/G, E01–E11, dois overlays, Doce Raro, API, OTA e assinatura.

**QA físico Samsung ainda pendente** após a instalação real da LT318. Testes automáticos aprovados não comprovam resultado visual. Ler [relatório oficial LT318](docs/LT318_EDU_PUBLICACAO_OFICIAL_E_HOMOLOGACAO_20261108.md), [Guia Mestre](docs/GUIA_MESTRE.md) e [prompt de continuidade LT318](docs/PROMPT_CONTINUIDADE_LT318_EDU_20261108.md).

---

## Histórico LT317 — não é mais a versão atual


**BASE ATUAL VERIFICADA:** **LT317 · 0.03.17 · versionCode 54523 · label 51321**. [Release oficial](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.17-54523) de 08/11/2026 21:15:21 UTC, APK [PokeSearch-v0.03.17-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.17-54523/PokeSearch-v0.03.17-LT.apk) **34.708.982 bytes**, SHA-256 `a477f8aa93c75d50ab09e6c95d14435744ec6f8d69ec1629d1494ba636026dda`. PR #317 squash `a4c4b696c94e32f3afeb01ec03d3b93d646e9a0d`, fonte/pedido `903994b905da8dd33bc4e77695af4bb18c1e28a3`, workflow oficial [#42523901901](https://github.com/LucianoToscano/PokeSearch/actions/runs/42523901901) **SUCCESS**, assinatura v2 permanente verificada. Não começar do zero nem fazer downgrade.

**Edu LT317:** primeiro balão de apresentação com `Bug dos Passes ⓘ`, estados do evento por fuso (sprites 36/37/38), contador regressivo, checklist manual com três ⓘ, ponta do balão prolongada. Um único relógio na Home, cujo menu `Data e hora` tem 17 momentos de teste em ordem cronológica baseados na janela de início/fim e fuso do evento; opção altera apenas o relógio manual do Edu. Mantém 68 sprites/22 ociosas, Sombria, teleporte, P/M/G 50/75/100, E01–E11, P1/P2, Doce Raro, login, API e assinatura. **Homologação física Samsung pendente**, sem presumir passes ou instalação. Ler [registro LT317](docs/LT317_EDU_PUBLICACAO_OFICIAL_E_HOMOLOGACAO_20261108.md), [Guia Mestre](docs/GUIA_MESTRE.md) e [prompt LT317](docs/PROMPT_CONTINUIDADE_LT317_EDU_20261108.md).

---

## Histórico LT316 — não é mais a versão atual

**BASE OFICIAL ATUAL:** LT316 · `0.03.16` · versionCode `54522` · label `51320`. [Release oficial](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.16-54522), APK `PokeSearch-v0.03.16-LT.apk` **34.708.590 bytes**, SHA-256 `7646eb5254da13f5da930813767d4265701da37a46f59d2d9fba2373ca47c252`. [Workflow #42513115954](https://github.com/LucianoToscano/PokeSearch/actions/runs/42513115954) preflight/publish **SUCCESS**. [PR #316](https://github.com/LucianoToscano/PokeSearch/pull/316) squash `ec12fc48c7116449d7785dd6ba51a744b3fcff44`, pedido `fd3cdf373b4bb79e900b4e182ff38a8ffe530a03`. Assinatura v2 permanente preservada; não começar do zero e não fazer downgrade.

**Edu LT316:** 68 sprites nos índices 0–67, atlas revisto `edu_avatar_uniform_68_lt316.b64` e retoque `EduSpriteManualRetouch.java` nos índices **20/28/30/36/49** para escalar somente o corpo do personagem e não seus acessórios. Demais poses preservadas, incluindo 9 teletransportes intencionalmente variáveis e Sombria ansiosa. Sem reescala dupla; tamanhos P50/M75/G100, balões, 22 animações ociosas, relógio único, tutorial e dados intactos. Testes `app/tests/lt316-edu-uniform-68-audit.test.js`, `app/tests/lt316-edu-manual-retouch.test.js`, documento `docs/LT316_EDU_RETOQUE_FINAL_5_QUADROS_20261108.md`. QA físico no Samsung ainda pendente; texto minúsculo de imagens P50 não precisa ser legível, explicar no balão.

**Governança:** ler `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`. Não alterar P1/P2, Doce Raro, PoGoCoordinates, API, login, rankings, assinatura, relógio ou dados sem nova autorização. Toda Release requer gates e verificação de hash antes de oferecer link.

---

## Histórico LT314 e versões anteriores

**ÚLTIMA BASE OFICIAL:** LT314 · `0.03.14` · versionCode `54520` · label `51318`.
[Release oficial](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.14-54520), APK `PokeSearch-v0.03.14-LT.apk` de **34.953.255 bytes**, SHA-256 `21ad916305460d9bcf36e2fce200419f65b6488de82a51ed831d55dc7251f99a`.
[Workflow oficial #42503837610](https://github.com/LucianoToscano/PokeSearch/actions/runs/42503837610) **completed/success**, [PR #313](https://github.com/LucianoToscano/PokeSearch/pull/313) squash `af6edbb4212596984322bd223481b2bb63d8289a`; release request `43f071bd98be9f62d5260587579fe643a9945cf6`. Não fazer downgrade; confirmar HEAD, Releases e CI antes de mexer.

**Mudanças LT314:** coleção de **68 sprites**, nova Sombria (índice 67) em espera ansiosa, geometria `EduSpriteGeometry` fixa âncoras de cabeça/rosto X=64 e pés Y=119, 112 px referência para corpo, pixel art sem blur, cache e P/M/G mantidos. Os 22 quadros ociosos não recebem reescala; teleporte preserva alterações intencionais de tamanho/opacidade. Assets antigos preservados (62 base, cinco especiais e override de 22). Teste `app/tests/lt314-edu-68-geometry-shadow.test.js`, registro `docs/LT314_EDU_AUDITORIA_68_SPRITES_SOMBRIA_GEOMETRIA_20261108.md`. QA física Samsung **ainda pendente**. Não modificar dados, GPS, passes, botões, relógio único, P1/P2, login, OTA ou assinatura.

## Histórico LT313 — referência visual anterior

**Foco LT313:** normalizar a identidade e as proporções do Edu nas **22 poses ociosas**. Novo atlas local `app/src/main/assets/edu_avatar_idle_consistent_22.webp` (WebP VP8L 256 cores, 1024×384, 22 sprites transparentes de 128×128 px, 59.618 bytes, SHA-256 `9ec3afa294d06d9d1cad9db8d4a3256e5f7230623f58cd6819e835192eee1a62`). Cabeça/rosto/corpo no mesmo estilo, altura corporal 112px, pés Y=120. A nova imagem substitui visualmente 22 quadros pelos índices originais, sem mexer nas demais 45 poses ou nas 67 referências. Fallback para o atlas anterior se necessário, mantendo P/M/G 50/75/100, sem blur e com ciclo ocioso em sequências e pausas naturais. **QA físico Samsung permanece pendente**.

**Base LT312 preservada:** relógio único automático/manual do Edu, correção da data histórica do Mega Chandelure (31/10/2026, 14h–17h no horário LOCAL da região IANA), sem Kiribati obrigatório, 67 sprites, 22 animações idle, tutorial E01–E11, balões, assinatura, P1/P2, Doce Raro e APIs. Nunca afirmar obtenção real de passes, mudança de GPS ou instalação física que não tenham sido verificadas.

**LEIA AGORA:** `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`, `docs/LT313_EDU_22_POSES_IDENTIDADE_VISUAL_20261108.md` e `docs/PROMPT_CONTINUIDADE_LT313_EDU_20261108.md`. Não divulgar segredos/keystore e não relaxar verificação do APK.

---

## Registro histórico LT308 e anteriores (não é a base atual)

**LEITURA OBRIGATÓRIA DE CONTINUIDADE:** [manual completo de GitHub, CI, build, APK assinado, merge, OTA, Drive, Arquivo Mestre e recuperação](docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md). Verifique o estado remoto antes de agir e preserve o protocolo de consentimento. Este documento não transfere acesso, secrets nem permissões entre contas.

**Fonte oficial:** https://github.com/LucianoToscano/PokeSearch

**Estado oficial verificado em 08/11/2026:** **LT308 · 0.03.08 · versionCode 54514 · label 51312**. [Release/latest v0.03.08-54514](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.08-54514), APK público [`PokeSearch-v0.03.08-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.08-54514/PokeSearch-v0.03.08-LT.apk), **34.035.668 bytes**, SHA-256 `c693b8c28be6536d91c6774c17d8c6867a685091232b06bf8a8bf8624a217871`. PR #306 por squash `60581c4ef69e1c85a4a35e8e0fc687309cd5c598`; fonte do APK/pedido oficial `25873554634f66d8af202d5f5a8eb081db6ebf9a`; [workflow permanente #42472319313](https://github.com/LucianoToscano/PokeSearch/actions/runs/42472319313) `completed/success`. Certificado v2 original fingerprint `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` validado. **Mudança principal:** Edu usa relógio único na Home (ao lado do ícone dos passes), com menu Data e hora semelhante ao Samsung (automático/manual, fuso e 24h); não há simulador separado dentro do personagem. O dia D−1/D é baseado no mesmo horário/fuso exibido. **QA físico Samsung e OCR ainda pendentes**; horários manuais não são fonte oficial de rede. Ver [GUIA MESTRE](docs/GUIA_MESTRE.md) e [prompt pós-LT308](docs/PROMPT_CONTINUIDADE_LT308_EDU_APOS_RELOGIO_20261108.md). LT307 e anteriores são históricos; não fazer downgrade.

**Prioridade atual:** após instalar a LT308 no Samsung, verificar visualmente relógio ao lado dos passes, interruptores automáticos/manuais, calendário/hora, formato 12/24h, fuso, virada de dia e retomada; a conversa Edu deve usar o mesmo relógio sem botões de simulação. Continuar **uma peça por vez**, segundo as próximas instruções do proprietário, sem novos botões/painéis por iniciativa própria. Preservar assinatura, P1/P2, Doce Raro e API. Não declarar instalação ou QA físico até evidência em aparelho.

**Histórico — novidades da LT227 (não é base atual):** sprites P/M/G nos resultados com escala da área alfa visível, moldura opcional e Sem fundo sem sombras/bordas, preservando duas Pokébolas, preferências independentes e os filtros. É um hotfix incremental, não um projeto novo.

**IMPORTANTE:** este arquivo pode ser posterior ao commit de fonte do APK. Antes de auditar, verificar o HEAD, Release/latest e versão do pacote ZIP realmente recebido. Não afirmar QA Samsung, sessão real de API ou instalação sem evidências. Atualizações estáveis e assinatura só com autorização explícita do dono. Não publicar credenciais.

## Para qualquer IA que receba o pacote editável

1. Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT215_INVENTARIO_RECRIACAO_AUDITORIA_20261101.md`, `settings.gradle.kts`, `app/build.gradle.kts`, `app/src/main/AndroidManifest.xml` e os testes antes de editar.
2. Confira commit real, tags e hashes no GitHub. Não confunda versão declarada de build com versão efetivamente publicada.
3. Preserve `applicationId=com.lucianotoscano.pokesearch`, namespace, assinatura permanente e versionCode monotônico, login independente, duas Pokébolas e limite máximo de dez resultados.
4. Fonte oficial dos resultados é a API PoGoCoordinates, sem proxy/backend improvisado; respeite HTTP 429, Retry-After, segurança do WebView, autenticação e termos do provedor.
5. Doce Raro tem cooldown informativo, que não é cronômetro automático de coleta: somente confirmação de coleta cria referência. O raio de busca é distinto da distância real entre coletas.
6. LT214: abertura da Localização tenta preencher texto válido da área de transferência e mostra cooldown informativo ao tocar no título ou arrastar raio. Clipboard não dispara busca.
7. Não modifique chat/Firebase nesta etapa sem solicitação expressa. Não disponibilize arquivos com chaves privadas, keystore, tokens, JWTs ou credenciais.
8. Após mudanças, execute testes Node, Java, OTA, Android, verificação de R8, assinatura v2, SHA-256 e teste físico Samsung. Faça release apenas com evidências claras.

## Recriação

Este repositório contém **código-fonte editável, documentação e scripts**. A compilação exige JDK 17, Gradle 8.11.1, Android SDK 36, Node.js e Python 3 para scripts de assets. Os recursos externos necessários precisam estar disponíveis. A identidade do aplicativo original só pode ser mantida nas atualizações se for usada a **chave privada original**, que não integra o ZIP. Consulte inventário e workflows para variáveis e etapas exatas.
