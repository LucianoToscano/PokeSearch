# CONTINUAR POKÉSEARCH — LT320 · EDU E RELÓGIO/TRANSPARÊNCIA

Continue o projeto Android [LucianoToscano/PokeSearch](https://github.com/LucianoToscano/PokeSearch), respondendo em português do Brasil. **Não começar do zero, não fazer downgrade, não apagar histórico/preferências, não substituir a assinatura original.**

## Estado oficial verificado (08/11/2026)

- **Última Release pública:** **LT320 · 0.03.20 · versionCode 54526 · label 51324**, tag [`v0.03.20-54526`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.20-54526), publicada às **23:15:47 UTC**.
- **APK:** [`PokeSearch-v0.03.20-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.20-54526/PokeSearch-v0.03.20-LT.apk), **34.710.274 bytes**, SHA-256 `ed44ac2214c569392c57d1e88ebeb422889c78281b9d9518c295304016c76bc8`.
- **Certificado Android v2 permanente** SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **PR #320:** squash `b98e80b8a0b44d4b5e1d68e0b782a61e5507f39a`, HEAD QA `143efcd96ec20893b57acf38c6afd353b00e4d8f`.
- **Fonte exata do APK/pedido permanente:** `20f88cc3cf36ef1da75445d5f95d0122d31f0615` em `release/official-request.json`.
- **Workflow oficial [#42534031454](https://github.com/LucianoToscano/PokeSearch/actions/runs/42534031454):** `completed/success`, preflight/publish, compilação, assinatura, verificação de hash e limite 35MB.
- **CI pré-merge 5/5 SUCCESS**: Node [#42533793472](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793472), LT169 [#42533793348](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793348), LT211 [#42533793545](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793545), Java LT62 [#42533793441](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793441), OTA LT173 [#42533793398](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793398).
- **Cuidado:** lançamento no GitHub ≠ instalação concluída no Samsung. QA de aparência e toques físico AINDA PENDENTE.

## Leia antes de qualquer alteração

1. `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`.
2. `AGENTS.md`.
3. `docs/GUIA_MESTRE.md`.
4. `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`.
5. `docs/LT320_EDU_RELEASE_OFICIAL_QUALIDADE_SLIDER_20261108.md`.
6. `docs/LT320_EDU_QUALIDADE_512_RELOGIO_SLIDER_20261108.md`.
7. `docs/LT319_EDU_PUBLICACAO_OFICIAL_SPRITES_RELOGIO_20261108.md`.

Conferir HEAD, Releases/latest, PRs e workflows novamente, pois o projeto recebe atualizações frequentes.

## Edu — identidade, imagens e tamanhos

- O repositório **só tem os 68 quadros de 128×128**, no atlas LT316 `edu_avatar_uniform_68_lt316.b64`. **Não há 68 masters originais de 512×512** disponíveis. A LT320 criou **representações de exibição 512×512** em memória *a partir do original 128* usando `Bitmap.createScaledBitmap`, cache LRU de no máximo oito quadros e fallback seguro quando a memória é insuficiente. A saída 512 melhora amostragem/serrilhado em telas densas, mas **não inventa detalhe do olho que não existia no original**. Se ainda estiver ruim, pedir a fonte mestre 512 e corrigir todas as poses com identidade consistente; não prometer perfeição apenas por upscale.
- Tamanhos **P=100, M=150, G=200 pixels**, **M padrão** para quem não salvou tamanho. Migração uma vez de preferências P50/M75/G100. 68 poses/22 idle/Sombria #67/teleporte 52–60/five manual retouches 20,28,30,36,49 preservados.
- O serviço `RaidDayAssistantOverlayService` escuta `SharedPreferences` de `raid_assistant_overlay` e aplica mudança de tamanho **ao vivo** sem reiniciar o overlay.

## Relógio virtual e aparência — uma tela

- A `EduClockSettingsActivity` exibe prévia grande de data/hora e Automático, mais **8 momentos inline em grade 2×4**: 24h antes, 1h antes, 10min antes, 10s antes, início, 2h após, 10min antes do fim e 10min após o fim. Selecionar muda imediatamente o único relógio interno; o modelo `EduEventMomentPresets` mantém os 17 offsets anteriores por compatibilidade, mas sem mostrá-los todos no painel. **Não restaurar modal com 17 itens**.
- **Tamanho da sprite P100/M150/G200** na mesma tela, aplicado ao vivo.
- **Slider de transparência do balão de 0–60%**: 0%=branco sólido, 60%=mais transparente; armazena a opacidade de 100% a 40% em `edu_speech_opacity_percent`. `EduSpeechDrawable.setAlpha` afeta apenas fundo e borda; **texto, links e Edu devem permanecer opacos**, com `panelParams.alpha=1f`. A opção atualiza imediatamente, persiste e não requer reiniciar o Edu.
- Fuso e formato 24h ficam em `Mais opções`. O relógio é interno ao Edu e não modifica hora/GPS do Android ou Pokémon GO; o assistente não fala sobre simulação.

## UX/funcionalidades intocáveis

- Primeira conversa simples da LT318: balão branco, `Bug dos Passes ⓘ` sublinhado; sem chip ETAPA, X, botões de respostas antigos e nomes técnicos de fuso. Sprites por fase: apresentação #42, antes #38, iniciado #37 e encerrado #36, com contador regressivo e checklist ⓘ. Chandelure (31/10/2026 14h–17h locais) é janela-base caso nenhuma outra janela válida exista.
- Preservar E01–E11, dois overlays de Pokébolas independentes P1/P2, Doce Raro, PoGoCoordinates, filtros, favoritos, rankings, login, Firebase, dados, OTA e assinatura v2.
- Não afirmar passes extras garantidos, detecção automática de softban ou modificação do jogo.

## Próximos testes práticos

Instalar **LT320** sobre LT319 **sem desinstalar**. Capturar vídeo/prints das poses em P/M/G, especialmente olhos, óculos, cabelo, pés e efeitos; testar animações, consumo de memória, cauda/posição da fala, slider 0/30/60% com texto nítido, tamanho em tempo real, os oito presets e o contador perto do início e do fim. Se algum quadro permanecer feio, comparar com originais e diagnosticar a arte, não só o tamanho.

## Publicações futuras

Não fazer merge ou release sem autorização expressa. Executar cinco gates no HEAD final e publicar exclusivamente por `release/official-request.json` na `main`, workflow protegido e assinatura permanente; verificar tag, SHA, tamanho e Release/latest, registrar no Arquivo Mestre e atualizar prompt de continuidade.
