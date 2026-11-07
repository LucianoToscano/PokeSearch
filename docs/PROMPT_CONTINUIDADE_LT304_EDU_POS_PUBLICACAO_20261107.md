# PROMPT DE CONTINUIDADE — PokeSearch LT304 Edu (07/11/2026)

Você está continuando o desenvolvimento do aplicativo Android **PokeSearch** em **Português do Brasil**. O usuário trabalha com você no projeto e quer correções precisas, visual compacto, simétrico, vidro/glass e código pronto em GitHub, sem prometer ações não concluídas. **Não recomece do zero nem faça downgrade.**

## Abertura obrigatória
1. Conecte ao GitHub `LucianoToscano/PokeSearch`. Leia, **nesta ordem**, `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`, `AGENTS.md`, `docs/GUIA_MESTRE.md`.
2. Verifique o HEAD de `main`, Releases/latest, `release/official-request.json`, notas de atualização e workflows, antes de modificar código. Leia `docs/LT304_EDU_REDESIGN_BALAO_SIMULACAO_HOJE_20261107.md` e `docs/LT304_E2B_E3_E4_E5_APK_TESTE_20261107.md`.
3. **Base oficialmente publicada:** PokeSearch **LT304 / 0.03.04 / versionCode 54510 / label 51308**, release tag **`v0.03.04-54510`** e APK `PokeSearch-v0.03.04-LT.apk`. A PR **#300 foi integrada por squash** em `9c391c4a0c8b92ff8735640b9539fa1d6f714289`. O pedido oficial foi enviado no commit `e467a1fa524b52dd8d173584a2912636e9c62e4f`. Workflow **#42400096648** finalizado com jobs preflight/publish em SUCCESS. URL: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.04-54510
4. Integridade oficial verificada: APK **34.032.628 bytes**, SHA-256 **`b8b5073e272a958676f068e2eba7ede79762608975f175d9946840bacce375b4`**, assinatura v2 com certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. **QA1 54508 e QA2 54509 são antigas**; não usá-las para novas publicações. A LT303 54507 é a versão oficial anterior.

## Identidade e interface do Edu
- Nome: **Edu — Assistente do Dia de Reides**. Ícone laranja/azul do passe continua ativador na Home. Dentro do jogo, treinador pixel-art enviado pelo usuário, com animações e reações.
- **Padrão G = 100 pixels físicos** na ausência de preferência; P=50 e M=75 selecionáveis em **⋯**. Respeitar escolhas anteriores já salvas; não transformar tamanho em DP sem solicitação.
- Janela flutuante **compacta, arrastável pelo cabeçalho**, largura até 286dp e altura limitada; efeito glass. Posição salva. **Uma mensagem/ação de cada vez**, em balão de conversa. Respostas curtas contextualizadas. NÃO voltar a painel gigante com quatro relógios permanentes, nove botões ou P/M/G misturados ao tutorial.
- Configurações de tamanho, animação, agenda/lembretes, pausa e captura visual somente no menu **⋯**.
- **Modo Simular hoje** é treinamento explicitamente fictício, calculado pelo horário de Brasília; simula véspera D−1 como ontem e dia D como hoje. **Não** altera GPS, joga, grava resultado real, concede passes ou avança com OCR sozinho.
- Preparação faz **sete perguntas** (não há seleção de locais de partida). A ordem do roteiro comunitário de **11 etapas** é dados JSON: E01 preparar; E02 Havaí; E03 Nova Zelândia; E04 resultado da reide; E05 Havaí; E06 verificar novo passe; E07 repetir ciclo ou seguir; E08 dia de evento; E09 Kiribati opcional; E10 reides no local do evento; E11 encerramento. D−1/D diferentes. Local de jogo só é selecionado/relevante no dia D.
- Nas reides: registrar lobby/batalha/vitória/derrota/saída/recompensas/encontro/captura/fuga separadamente. E04 responde Venci/Perdi/Saí; pergunta sobre captura vem depois. E10 permite Registrar reide/Seguir e vários registros.
- A leitura visual usa MediaProjection **somente com autorização Android por sessão**, OCR ML Kit local, três quadros concordantes e confirmação humana. Edu **se esconde antes do diálogo de permissão** e restaura só a bolha após autorizar/cancelar; nunca bloquear o botão Autorizar. Tela do jogo não prova concessão de passe, mudança de local pelo servidor ou recompensa.
- Avisar sobre risco: o método comunitário chamado “Bug dos Passes” pode violar os Termos do Pokémon GO, não é garantido. Não automatizar localização, PGSharp, cliques, reides, bypass de restrições ou dados do servidor. Horários não verificados não viram horários oficiais.

## Objetivo do próximo chat
**Prioridade é QA visual e funcional da LT304 no Samsung**, pois as suítes automatizadas e publicação foram concluídas, mas a validação física do novo painel e o detector OCR com capturas reais PT-BR/EN ainda são **pendentes**. Peça ou analise as capturas/feedbacks que o usuário apresentar (sem refazer perguntas já respondidas); reproduza bugs e faça correções localizadas em branch/PR.

Checklist físico: primeira abertura e Simular hoje; conversas legíveis; cabeçalho arrastável, altura limitada e posição salva; Edu no tamanho G padrão; escolhas P/M/G/animação persistidas; não obstruir Pokémon GO; 7 perguntas sem locais iniciais; passar etapas D−1/D; reides E04/E10 e captura separada; Voltar, Me perdi, Não aconteceu, pausa e retomada após fechar jogo; mini Edu recolhido antes da autorização da captura e restaurado após; notificação/stop; coexistência das duas Pokébolas e Doce Raro; ausência de regressões em busca, favoritos, classificação, sprites e OTA.

## Regras de engenharia e publicação
- Preservar appId `com.lucianotoscano.pokesearch`, duas Pokébolas independentes, Doce Raro, busca sem login, teto 10 resultados, 429/Retry-After, sprites, filtros e R8/assinatura permanente.
- Executar Node QA, LT169, LT211, LT62 Android Java, LT173 OTA, testes LT304 e build assinado privado; verificar Android físico antes de chamar mudança de homologada. Documentar cada ajuste no Arquivo Mestre.
- **Não publicar nova versão sem pedido explícito do usuário**. Se houver autorização futura, usar o workflow permanente `.github/workflows/pokesearch-official-release.yml` por meio de `release/official-request.json`, com código superior a 54510 e qualquer QA posterior, sem sobrescrever tags/APKs existentes. O sistema de atualização lê GitHub Releases/latest; instalação requer confirmação do Android.
- Não anunciar merge, assinatura, APK publicada, Drive ou instalação como concluídos sem confirmação por ferramentas/GitHub.
- Preparar relatórios curtos de mudanças, QA aprovado, pendências e links diretos de PR/Release.

**Primeira ação:** conferir a LT304 oficial no GitHub e aguardar os prints ou o primeiro problema específico que o usuário deseja corrigir no Edu. Se ele trouxer uma nova demanda, executar no código existente e documentar.
