# CONTINUAR POKÉSEARCH — LT319 · EDU E RELÓGIO VIRTUAL

Continue o projeto Android [LucianoToscano/PokeSearch](https://github.com/LucianoToscano/PokeSearch), documentando sempre em português do Brasil. **Não começar do zero, fazer downgrade, apagar preferências ou substituir sprites por assets antigos.**

## Estado oficial — confirmado em 08/11/2026

- **Última Release pública:** **LT319 · 0.03.19 · versionCode 54525 · label 51323**. [Release `v0.03.19-54525`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.19-54525), publicada em **08/11/2026 22:40:59 UTC**.
- **APK:** [`PokeSearch-v0.03.19-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.19-54525/PokeSearch-v0.03.19-LT.apk), **34.709.718 bytes**, SHA-256 `a0cf19f7af8b6e954c24b905ec21899ec519b23dc1422bee7a595f1d1511758f`.
- **Assinatura Android v2 permanente:** certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **PR #319:** squash `893edb035531323c635161f7ee1412be9a4ebd82`, head testado `70e1e3bb9550e25632d6eefa866baac29be5ff2e`.
- **Fonte exata do APK e solicitação oficial:** commit `f556338f9bf6e2d331bd11e817527a2a45177245`, arquivo `release/official-request.json`.
- **Workflow oficial:** [#42531166399](https://github.com/LucianoToscano/PokeSearch/actions/runs/42531166399) — **completed/success**, preflight/publish e validação pública de APK e hash.
- **CI da PR:** Node [#42530553005](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530553005), LT169 [#42530553188](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530553188), LT211 [#42530552992](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530552992), Java LT62 [#42530553315](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530553315), OTA LT173 [#42530552971](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530552971) — **5/5 SUCCESS**.
- **Não confundir:** Release/CI não comprovam que a atualização foi instalada no Samsung ou que a arte está visualmente perfeita.

## Leitura obrigatória

1. `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`.
2. `AGENTS.md`.
3. `docs/GUIA_MESTRE.md`.
4. `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`.
5. `docs/LT319_EDU_PUBLICACAO_OFICIAL_SPRITES_RELOGIO_20261108.md`.
6. `docs/LT318_EDU_PUBLICACAO_OFICIAL_E_HOMOLOGACAO_20261108.md`.
7. `docs/LT316_EDU_AUDITORIA_COMPLEMENTAR_68_LEGIBILIDADE_20261108.md`.

Antes de alterar qualquer coisa, conferir novamente `main`, PRs, Releases/latest, workflows e fonte do APK.

## Regras atuais — Edu LT319

**Tamanhos e nitidez:**
- **P=100, M=150 e G=200 pixels físicos**; **M é o padrão inicial** para contas sem tamanho salvo. Migração única de escolhas anteriores `50→100`, `75→150`, `100→200`, preservando a categoria P/M/G.
- Os arrays em `EduSpriteAtlas.SIZES_PX` e `RaidDayAvatarFrames.SIZES_PX` precisam permanecer sincronizados. `RaidDayAssistantOverlayService` usa `avatarSizeIndex=1` antes da leitura das preferências, preserva migração e fallback.
- Renderização pixel art usa `setFilterBitmap(false)`, `setAntiAlias(false)`, `setDither(false)` nos drawables, e ImageView com camada de software. Não suavizar olhos/óculos ao ampliar.
- **Não alterar sem evidência os pixels dos 68 sprites, cabeça, óculos, olhos e pés**: atlas LT316 corrigido é o original de referência; 22 poses idle, cinco retoques 20/28/30/36/49, Sombria #67 e teleporte 52–60 permanecem intactos. A nova nitidez vem da escala/renderização, não de reilustração.

**Relógio virtual da Home:**
- `EduClockSettingsActivity` agora tem prévia grande da data/hora, um switch **Automático**, **Momento do evento** com 17 presets, **Ajustar data e hora** em uma única operação, e **Mais opções** recolhidas para fuso/24h. **Não voltar a quatro switches nem adicionar relógio separado no Edu.**
- O relógio é virtual e exclusivo para testes; não altera hora, fuso ou GPS do Android ou Pokémon GO. O balão do Edu não menciona simulação. Corrigir o label do fuso manual Brasília quando for o caso, e apagar a escolha de momento ao voltar ao automático.
- A janela Mega Chandelure em 31/10/2026, 14h–17h locais, permanece exemplo-base quando não há outro evento válido; o jogador pode simular a passagem do tempo pelos 17 momentos.

**Conversa e funções anteriores:**
- LT318 corrigiu a retomada indevida de `ETAPA 10/11`; a primeira fala apresenta o Edu e link `Bug dos Passes ⓘ` dentro do balão branco sem cabeçalho, X, relógio técnico ou botões de resposta. As fases usam sprites de apresentação #42, evento não começou #38, começou #37, terminou #36; contador com segundos e checklist ⓘ; reações antigas não substituem a sprite contextual.
- Preservar E01–E11, P1/P2 independentes, Doce Raro, PoGoCoordinates, favoritos, filtros, IVs/ranks GL/UL/ML/RG/Reides, login, Firebase, dados/preferências e OTA assinada.

## Próxima prioridade: homologação física Samsung

Instalar LT319 **por cima da LT318, sem desinstalar**; capturar prints/vídeo em P100/M150/G200, observar tamanho real, legibilidade dos olhos e óculos, nitidez, transições, posição/cauda do balão sem cobrir outras sprites, e painel virtual simplificado. Testar os 17 momentos, retorno ao automático e fuso diferente de Brasília. **QA físico ainda não executado nesta conversa.** Se o olho parecer desalinhado depois da ampliação, identificar os quadros específicos e só então editar arte; não afirmar que um desenho foi corrigido sem evidência.

## Próximas Releases

Qualquer merge/publicação futura exige autorização do usuário, versionCode monotônico, cinco gates de QA no SHA final e pipeline permanente via `release/official-request.json` na `main`, com certificado original e digest verificável. Registrar no Guia Mestre, atualizar `AGENTS.md`, `LEIA_PRIMEIRO` e este prompt. Evitar anexos sandbox como canal primário de APK.

**Estilo desejado:** compacto, limpo, intuitivo, minimalista, sem botões e textos desnecessários; desenvolvimento por etapas.
