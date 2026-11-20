> **ATUALIZAÇÃO DE STATUS — 20/11/2026:** este documento registra o estágio de desenvolvimento anterior à publicação. A funcionalidade **de planejador GPX manual (não Auto Hunt noturno)** foi publicada como **PokeSearch v0.03.93 LT / 54600** na [release oficial](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.93-54600). Ver [ARK LT408 com prova de assinatura, build e limitações](ARK_LT408_GPX_OFICIAL_20261120.md). Afirmações históricas de “PR de rascunho”, “não publicável” ou “publicação pendente” abaixo devem ser entendidas como status da época, não o estado atual. **Automação noturna segue pendente.**

# LT408 — Auto Hunt GPX: primeiro estágio auditável (18/11/2026)

## Pedido
O proprietário quer executar durante a noite o fluxo mostrado no vídeo enviado: importar GPX de missões de pesquisa de campo, visitar Poképaradas, reunir até três tarefas "Realizar um lançamento excelente" com recompensa de 25 doces de Eternatus, concluir e resgatar três pesquisas por ciclo e repetir. O arquivo GPX-25CE-18_11_2026_1794975410164.GPX foi inspecionado fora do repositório. Contém **500 waypoints**, todos diferentes, nomeados de 1 a 500, perto de Nova York. Não possui tags de tempo, tarefas, Poképaradas verificadas, validade, recompensa ou cooldown. Não publicar o arquivo temporário nem dados pessoais no GitHub.

## Implementação deste PR (não é automação noturna)
- PgsMissionGpxPlan: parser GPX local, limite 1 MB / 3.000 coordenadas, prevenção de XXE/DOCTYPE, latitude/longitude verificadas, preservação de ordem e nomes, duplicatas sinalizadas, suporte a wpt/rtept/trkpt. **Trincas são somente candidatos**; jamais confirmar presença de Poképarada, tarefa ou doces por uma coordenada.
- PgsMissionGpxActivity: importação SAF de arquivo selecionado, cópia privada no armazenamento interno, persistência local do progresso marcado manualmente, coordenadas copiáveis, visualização de grupos e projeção hipotética de doces. O arquivo não é enviado nem incorporado ao APK.
- Atalho compacto somente no modo Auto Hunt existente; nenhum sexto ícone na Home, toolbar ou alteração dos dois inventários, notas, fotos, login, filtros, imagens, P1/P2.
- Testes Java e Node para interpretação de 500 pontos, segurança XML e ausência de "fake" automação.
- LT408 continuação: PgsMissionLedgerPolicy e controles manuais para confirmar pesquisa recebida, confirmar recompensa efetivamente resgatada e desfazer. Cada GPX usa hash SHA-256 para isolar progresso e registros. Apenas resgates confirmados manualmente entram na contagem de doces (25 por registro); GPX importado não gera ganhos. Testes PgsMissionLedgerPolicyTest e contrato Node atualizados.
- **Não** há serviço em segundo plano, GPS falsificado, teleporte, tocar/girar Poképaradas, dispensar missões, arremessar Pokébola, resgatar recompensas, ler memória de outro app ou contornar aviso de conta. O projeto anterior LT366/LT371 declara esses recursos não integrados.

## Resultado do GPX enviado
- 500 pontos, 500 coordenadas distintas.
- Cálculo local com fórmula haversine entre os 499 pares consecutivos do GPX enviado: aproximadamente **569,45 km**, com salto máximo entre pontos consecutivos de **22,32 km**. PGSharp no vídeo exibe 569,63 km. Diferença de cálculo não implica que a rota seja diversa; valores não fornecem cooldown seguro nem distância percorrida em ruas.
- 166 grupos candidatos de três pontos e 2 pontos restantes.
- 166 x 3 x 25 = **12.450 doces teóricos**, APENAS se todos os pontos tiverem a pesquisa elegível, cada uma pagar 25, todas forem aceitas, concluídas e resgatadas e a lista estiver válida. Este número não é uma projeção de ganhos reais.
- Pelo site e vídeo, as coordenadas podem ficar obsoletas após aproximadamente 24 horas; o GPX não traz dado que permita validar esse prazo.
- A fonte narrada no vídeo atribui cooldowns; eles NÃO constam do GPX. Não inventar horários/esperas.

## Arquitetura exigida para um Auto Hunt realmente não supervisionado (PENDENTE)
1. Fonte verificável e atualizada que associe coordenada a Poképarada, tarefa, recompensa e expiração. Um GPX comum não fornece isso.
2. Adaptador de cliente/gestos sujeito a validação real em Samsung Android 17 para ver mapa pronto, girar parada, coletar pesquisa, detectar tela de pesquisa, descartar tarefa errada, verificar conclusão do lançamento e resgatar recompensas. O dispatchGesture bem-sucedido não prova que o jogo aceitou o gesto.
3. Módulo de deslocamento/cooldown somente se houver integração válida e explícita com o cliente escolhido. A espera fixa do vídeo não representa garantia contra detecção, penalidade ou ban.
4. Motor com estados observáveis: IMPORTAR → VALIDAR → POSICIONAR → AGUARDAR → VERIFICAR MAPA → GIRAR → CONFERIR PESQUISA → 3 PESQUISAS → LANÇAMENTO → CONFIRMAR → RESGATAR → SALVAR CHECKPOINT → PRÓXIMO.
5. Pausar por tela não identificada, pesquisa divergente, falta de espaço, rede desconectada, permissão revogada, captcha/aviso da conta, necessidade de gesto não verificado, estado do jogo inesperado, dispositivo quente, bateria baixa ou fim/expiração da lista. Jamais confirmar resultados sem evidência.
6. Execução Android persistente com permissão e notificações adequadas, proteção contra encerramento do processo e recuperação explícita de checkpoints, sem acordar ou liberar tela de bloqueio por bypass. É necessário avaliar requisitos de políticas Android e compatibilidade PGSharp/Pokemod.
7. Homologação presencial: 1 ponto, 3 pontos, 1 trio completo, timeout, parada e retomada; somente depois duração longa. Ações no Pokémon GO alteradas via software e localização simulada violam políticas do jogo e têm risco de penalidades.

## Evidência e publicação
Implementação feita em branch de funcionalidade e PR de rascunho, não publicável como Auto Hunt noturno e não apta a ARK oficial sem QA verde e homologação de dispositivo. **Não** fazer merge automático nem criar APK oficial apenas com esta prévia. Somente PokeSearch LT é canal de distribuição; FastDev/DEV/Preview estão removidos da branch oficial.


## Evidência da gravação enviada em 18/11/2026 (1000975030.mp4)
- Vídeo de tela sem trilha de áudio, aproximadamente 4min26s, gravado em Android. Em torno de 00:24 e 02:16, interface de mapa/rota PGSharp mostra **500 pontos / 569,63 km** e controles de pausa e parada; isto comprova a rota carregada no cliente, não o ciclo de pesquisa.
- Por volta de 00:46, aparece o bônus de **primeira Poképarada do dia**, evidência de pelo menos um giro/recompensa de parada na gravação.
- Em torno de 00:52, o jogo exibe **"O seu estoque de Pokémon está cheio"**. O bloqueio de captura é real e precisa de resolução manual ou método comprovado, sem transferir Pokémon automaticamente.
- Em torno de 01:04, o usuário percorre a tela de Pesquisas de Campo e uma confirmação de remoção. Não foi mostrada uma recompensa confirmada de 25 doces de Eternatus nem a conclusão de três tarefas. O PokeSearch não deve registrar os doces só por girar a Poképarada.
- Perto de 04:08, configurações do PGSharp mostram **GoPlus Virtual**, **PokéParada Próxima**, **Giro Rápido** e **Pular Animações** ligados. Estas opções não demonstram, sozinhas, a recepção de pesquisas desejadas, execução de excelente e resgate das três recompensas.
- As configurações exibidas perto de 04:00 contêm **dados identificadores de assinatura/conta**. Não copiar e-mails, identificadores ou capturas do vídeo para repositório, logs ou PRs; recomendar ocultação antes de compartilhamento público. O vídeo original permanece fora da árvore de código.

### Ajustes implementados a partir do vídeo
- PgsMissionPreflightPolicy: checklist de sete declarações manuais separadas por hash do GPX, com validade conservadora da confirmação por no máximo 24 horas locais desde o primeiro registro; não valida a expiração real do site.
- PgsMissionGpxActivity: checks de rota/tarefas recentes, vagas de Pesquisa de Campo, estoque de Pokémon, bolsa de itens, GoPlus/PokéParada Próxima, recompensa de Eternatus verificada e esperas/cooldown revisados. Indicador "N/7" deixa claro que checklist completo **não habilita** automação no jogo.
- Testes PgsMissionPreflightPolicyTest.java e contrato Node LT408, mantendo o recurso independente de contas, APIs e P1/P2.
- Regra de segurança pendente: se uma futura leitura visual detectar estoque cheio, confirmação de exclusão de pesquisas, aviso de conta, jogo oculto ou dados insuficientes, deverá pausar e pedir ação humana. Não automatizar a remoção de tarefas nem prometer ausência de risco de penalidade.


## Evidência visual PoGo Coordinates — 20/11/2026 (3 capturas)
As capturas do proprietário mostram a configuração exata do filtro de pesquisas no site, não uma API de consulta ou confirmação de coleta no jogo:
- Aba **Quests**; **Reward type: Candy**.
- **Candy Pokemon: Eternatus**. Na lista do seletor o site identifica **#890 Eternatus**, distinto de **#813 Scorbunny**.
- **Task: Make an Excellent Throw**. O seletor também apresenta outras tarefas (Catch Pokémon, Unlock max move, Win a Max Battle), que não podem ser misturadas com o alvo.
- O primeiro resultado visível, Poképarada **Javali Autopeças**, exibe **Eternatus Candy ×25** e uma ação **Get coords**. A página indica **Showing 10 quests**, link **GPX**, selo **Free account · up to 10**.
- A busca usa um campo de coordenadas de referência e raio, mas uma localização digitada e uma busca com 10 resultados não provam que todas as pesquisas ainda estejam disponíveis, foram aceitas ou que um GPX de 500 pontos continue válido. O limite de 10 observado é **apenas o rótulo exibido para aquela conta e tela**, não um limite geral para arquivos GPX.
- As imagens não revelam payload JSON de API nem estrutura enriquecida de GPX que permita confirmar tarefa/recompensa por coordenada. Não inventar integração com serviços autenticados.

### Alterações LT408.1
- PgsMissionQuestPreset: perfil fixo Candy → Eternatus (#890) → Make an Excellent Throw → recompensa esperada x25. Comparações conservadoras de tipo, espécie, tarefa e rótulo de recompensa, sem matching por substring solta; uma pesquisa ou coordenada isolada não vira recompensa recebida.
- PgsMissionGpxActivity: filtro exibido e copiável; limitação de 10 visível explicada sem cap arbitrário a GPX de terceiros; confirmação explícita antes de registrar pesquisa e confirmação separada antes de registrar **resgate efetivo**. Contador manual mantém trios completos somente de recompensas marcadas como resgatadas.
- PgsMissionQuestPresetTest.java e contratos Node/Java do CI adicionados.
- O modo noturno automático permanece **não implementado**. Sem scraping de sessão, sem contornar credenciais e sem claim de auto-giro, teleporte ou auto-arremesso. PR #535 segue em rascunho até CI e homologação.
