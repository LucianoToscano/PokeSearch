# PROMPT DE CONTINUIDADE — POKÉSEARCH / LT308 EDU (08/11/2026)

> Cole o texto a seguir em um novo chat. **A LT308 foi publicada e verificada em 08/11/2026.** Antes de agir, confira novamente o GitHub: o repositório pode ter avançado desde esta conferência.

CONTINUAR POKÉSEARCH — EDU, UM PASSO POR VEZ (PT-BR)

Repositório: LucianoToscano/PokeSearch (https://github.com/LucianoToscano/PokeSearch).
Não começar do zero nem restaurar versões antigas. **Última Release pública verificada em 08/11/2026: LT308 — 0.03.08 — versionCode 54514 — label 51312**, tag https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.08-54514, APK `PokeSearch-v0.03.08-LT.apk`, tamanho **34.035.668 bytes**, SHA-256 **`c693b8c28be6536d91c6774c17d8c6867a685091232b06bf8a8bf8624a217871`**. PR #306 integrada à `main` por squash **`60581c4ef69e1c85a4a35e8e0fc687309cd5c598`**; fonte do APK foi o commit **`25873554634f66d8af202d5f5a8eb081db6ebf9a`**. Workflow oficial https://github.com/LucianoToscano/PokeSearch/actions/runs/42472319313 terminou **`completed/success`**, com assinatura v2 permanente e digest verificados. **Este é o novo ponto de partida oficial**, mas confirme `main`, `releases/latest`, workflows e PRs novamente antes de editar.

Leia nesta ordem:
1. LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md
2. AGENTS.md
3. docs/GUIA_MESTRE.md
4. docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md
5. docs/LT308_EDU_RELOGIO_SIMULACAO_ETAPA1_20261108.md
6. docs/LT307_EDU_ROTEIRO_VIDEO_TXT_PDF_20261108.md

**Combinado de UX com o proprietário:** reconstruir o Edu uma peça de cada vez. O usuário descreve, o assistente implementa apenas aquela parte, mostra o resultado e aguarda aprovação antes de passar para a próxima. Não adicionar painéis enormes, balões sobre balões, configurações abertas por padrão ou botões extras. Após uma aprovação, executar merge/publicação somente se solicitado/permitido.

**Estado visual da conversa:** treinador flutuante pixel-art, tamanho G=100px inicial (preferências P/M/G preservadas), um balão branco independente com cauda apontando para Edu e botões de resposta separados. Configurações do personagem ocultas por toque prolongado na sprite (~1,2 s). Não modificar indevidamente o roteiro E01–E11 já alinhado ao vídeo/TXT/PDF de usuário.

**Primeira etapa publicada (LT308): relógio único do Edu.** Ícone dos passes na Home tem ao lado visor compacto de `dd/MM/yy` e `HH:mm:ss`, que avança segundo a segundo. Tocar abre tela “Data e hora” com aparência inspirada em Samsung. Exibir:
- Interruptor **Data e hora automáticas** (ON esconde Definir data/Definir hora; OFF permite edição).
- **Fuso horário automático** e **Definir fuso conforme localização**, com indicação do fuso já detectado pelo Android; OFF no automático permite definir o fuso manual.
- **Formato 24 horas** ON/OFF.
- Ajustes são **apenas do relógio interno do Edu**: não alteram as opções do sistema, GPS, Pokémon GO nem horários oficiais. Quando a hora é alterada, o Edu mostra “Hora ajustada”.
- O Edu **não tem simulador separado** nem botões “Simular hoje/Evento real”; sua fala inicial “Olá, meu nome é Edu...” e o fluxo de evento leem a MESMA referência de data, hora e fuso que o relógio. Escolhas manuais permitem encenar o dia do evento, sem conceder passes.
- A versão final futura poderá substituir a fonte ajustável por referência oficial de Brasília, em uma etapa que o proprietário pedirá. Não fingir verificação de rede se só há tempo do celular.

**Arquivos LT308 relevantes:** `EduEventClock.java`, `EduClockSettingsActivity.java`, `MainActivity.java`, `RaidDayAssistantOverlayService.java`, `RaidDayPreparation.java`, `RaidDayEventSettingsActivity.java`, `AndroidManifest.xml`, `app/tests/lt308-edu-simulation-clock.test.js` e `app/src/main/assets/release_notes.json`.

**Restrições técnicas:** applicationId com.lucianotoscano.pokesearch, assinatura v2 original, JDK 17/Gradle 8.11.1, API PoGoCoordinates, limite máximo 10 resultados, busca sem login, favoritos, sprites, GL/UL/ML/RG, HTTP 429/Retry-After, duas Pokébolas independentes e Doce Raro preservados. MediaProjection requer autorização a cada sessão, sem gravar/transmitir captura; OCR nunca avança etapas críticas sozinho.

**QA obrigatório:** validar Node QA, LT169, LT211, Java LT62, OTA LT173 e workflow oficial de publicação. Conferir SHA exato, versionCode, assinatura e SHA-256 do APK. Ainda faltam testes físicos no Samsung da tela de data/hora, interruptores, fuso, passagem de dia, relógio com segundos, toque longo e retorno ao jogo. Não alegar homologação visual nem instalação silenciosa sem evidência.

**Próxima ação no novo chat:** aguardar as próximas capturas e instruções do proprietário para refinar SOMENTE a parte do Edu que ele indicar. Responda/documente sempre em Português do Brasil e mantenha Arquivo Mestre atualizado.
