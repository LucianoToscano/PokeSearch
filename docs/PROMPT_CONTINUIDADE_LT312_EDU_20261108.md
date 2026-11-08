# CONTINUAR POKÉSEARCH — EDU LT312, RELÓGIO, EVENTO E 67 SPRITES

Responda e documente sempre em português do Brasil. Repositório: https://github.com/LucianoToscano/PokeSearch. **Antes de qualquer mudança, confira novamente `main`, Release/latest, workflow oficial, pull requests e SHA dos APKs. Não comece do zero e não faça downgrade.**

## Ponto de partida
- Base pública confirmada antes desta tarefa: **LT311 / 0.03.11 / versionCode 54517**; release https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.11-54517, APK `PokeSearch-v0.03.11-LT.apk` (SHA-256 `a0d3b68c4c03c27b123c79a83fd193709f32ad0d5ad144b8811a4fd86f5a8565`), workflow #42487237502 SUCCESS.
- **Atualização proposta:** LT312 / 0.03.12 / versionCode 54518. PR #311: https://github.com/LucianoToscano/PokeSearch/pull/311. Nunca afirmar que LT312 está publicada sem verificar Release/latest e workflow concluído.
- **Leitura obrigatória na ordem:** `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`, `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`, `docs/LT312_EDU_AUDITORIA_COMPLETA_RELÓGIO_IDLE_67_20261108.md`, `docs/LT312_EDU_CORPO_TAMANHO_FIXO_IDLE_20261108.md`, `docs/LT311_EDU_EVENTO_HORARIO_LOCAL_MEGA_CHANDELURE_20261108.md`.
- Verificar a `release/official-request.json` para publicação e `app/src/main/assets/release_notes.json` para notas. Só atualizar `main` por PR com testes, squash e assinatura original permanente.

## Evidência do erro e correção
Na captura do Samsung em 08/11/2026, o relógio **Edu** foi ajustado para **30/10/2026 às 11h07**, porém o diálogo perguntava “Qual é o Dia de Reides?” e mostrava **07/11/2026**. O erro foi a separação de três fontes: `EduEventClock`, `RaidDaySchedule`, `RaidDayPreparation`. Salvar a janela também removia a confirmação da data.

`EduEventSelection.java` agora sincroniza uma data **já definida**, sem pedir novamente os botões ±7/±1. Se o relógio Edu é **manual** e está entre 30/10 e 01/11/2026, **sem evento configurado**, carrega automaticamente o exemplo oficial **Mega Chandelure** de **31/10/2026, das 14h às 17h locais**. Se houver outra janela personalizada, não a substitui: pergunta **Usar Chandelure / Manter evento**. Salvar o exemplo na tela `RaidDayEventSettingsActivity` ativa a configuração imediatamente; o serviço reflete mudanças ao vivo (clockPulse) sem apagar histórico anterior.

**Importante:** 30/10/2026 às 11h07 em Brasília ainda é **véspera**. O primeiro começo é Kiribati às 21h de Brasília de 30/10; Auckland às 22h; Singapura às 03h, Brasília às 14h de 31/10 e Havaí às 21h de 31/10. O início não é obrigatoriamente em Kiribati; o Edu considera a **região IANA selecionada** e apenas o relógio interno, sem acesso ao servidor Pokémon GO e sem alterar GPS ou conceder passes.

## Sprite / animações
- Atlas original de **62 quadros** `edu_avatar_atlas_62.webp` permanece intacto e com fallback antigo LT304.
- Complemento com **5 sprites exatas do ZIP enviado** `edu_avatar_extra_5.webp` WebP RGBA lossless **640×128, 12.374 bytes**, SHA-256 `cfcccdc0981899200073da63bb0ba6e61396fc7e575656304acf5f1c041cd933`. Indices 62 Shiny, 63/64 Jogando, 65 Armadura Mewtwo, 66 Armadura Mewtwo Shiny: total **67 sprites**, P/M/G = 50/75/100 px.
- Rotação **ociosa sem interação e com balão fechado**: parado, Pokébola (4), caminhada frente/direita/esquerda (4 cada), Shiny, Jogando 01/02, armaduras normal/Shiny. Pausas naturais, sem cortar animação, sem girar ao tocar/arrastar.
- **Regra inegociável de escala:** corpo do Edu sempre proporcional à altura da sprite parada, cerca de **112 px numa célula de 128**; pés alinhados, sem encolher em Pokébola/caminhada/Shiny/armadura. Pokébola e efeitos são desenhados separadamente, não contam como altura do corpo. Pixel art sem blur, sem alterar a caixa P/M/G a cada troca. Arquivo principal `EduSpriteAtlas.java`; lógica `RaidDayAssistantOverlayService.java`.

## Testes e segurança
- Tests `app/tests/lt312-edu-fixed-idle-scale.test.js`, `app/tests/lt312-edu-event-autosync-idle.test.js`, `app/tests/lt312-edu-assets-67.test.js` e regressões LT311.
- Executar e verificar QA Node total LT169, QA LT211, compilação Java LT62, OTA LT173, APK beta e workflow permanente do APK oficial. Nunca anunciar publicação com CI parcial.
- Preservar **applicationId com.lucianotoscano.pokesearch**, assinatura Android v2 original, duas Pokébolas P1/P2, Doce Raro, GL/UL/ML/RG, Pokémon API PoGoCoordinates, favoritos, relógio único na Home, MediaProjection opt-in, sem leitura remota de tela e sem mudanças não solicitadas no roteiro comunitário E01–E11.
- Exigir homologação visual física no Samsung antes de dizer que o efeito foi observado no aparelho. O relógio manual simula eventos históricos, não garante passes.
- Documentar versões, SHA de commit, PR, workflow, SHA-256 do APK e tamanho no Arquivo Mestre `docs/GUIA_MESTRE.md`.

## Próxima ação no novo chat
Confirme a última Release real e o estado da PR #311, corrija qualquer regressão da LT312 se necessário e continue o refinamento do Edu **um passo de cada vez**, conforme as novas capturas e instruções do usuário. Não reabrir uma pergunta de data quando o evento já estiver configurado.
