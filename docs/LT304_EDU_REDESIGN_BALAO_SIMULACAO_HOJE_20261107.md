# PokeSearch LT304 — Edu: interface de conversa compacta e simulação de hoje
**Registro:** 07/11/2026 · **PR #300** (draft) · branch de desenvolvimento sobre LT303  
**Origem:** três capturas reais do Samsung mostrando janela antiga muito alta, ajustes misturados com o tutorial e sobreposição sobre a confirmação de captura do Android.

## Decisão do proprietário
- **Nome do personagem e do assistente:** **Edu**. Descrição longa: “Edu · Assistente do Dia de Reides”. Subtítulo comunitário “Bug dos Passes”.
- **Nova UX:** Edu aparece como treinador pixel-art e **fala/pergunta por balões de texto**, apenas uma instrução por vez; preferir verbos claros como “Vi um passe”, “Sem passe”, “Venci”, “Perdi”, “Saí”, “Ainda não”, “Copiar local”.
- **Separar totalmente** tutoriais das configurações: tamanhos P/M/G, animação, horários/lembretes/calendário, leitura visual e pausa ficam no menu **⋯**, não no fluxo principal.
- **Sem escolha arbitrária do local de partida**: a sequência comunitária é **E01 Preparação → E02 Havaí → E03 Nova Zelândia → E04 resultado → E05 Havaí → E06 conferir passe → E07 decisão do ciclo → E08 dia de reides → E09 Kiribati opcional → E10 local do evento → E11 encerramento**. O local escolhido pelo jogador para jogar reides só importa no **dia do evento**, não na véspera.
- **Simular evento acontecendo HOJE:** botão “Simular hoje” no início, data atual em Brasília calculada em tempo de uso, etiqueta explícita **SIMULAÇÃO HOJE / Evento fictício**, navegação por todas as etapas em Modo Treino, sem alterar GPS, conceder recompensas ou salvar resultados reais.
- **Tamanho inicial do Edu:** **G = 100 px físicos** em novas instalações/sem preferência; P=50 e M=75 px no menu ⋯. Escolhas já salvas continuam preservadas.
- **Janela pequena e arrastável:** largura máxima de 286dp, altura máxima de ~43% da tela e 285dp, rolagem apenas quando inevitável. Arrastar pelo cabeçalho “Edu” com limites de tela; salvar `edu_panel_x`/`edu_panel_y` no aparelho.
- **Android consentimento:** ao solicitar compartilhamento de tela, remover/recolher o painel e esconder o treinador **antes** de abrir o `RaidDayCaptureConsentActivity`. Reexibir **somente o mini treinador recolhido** após autorização/cancelamento, com comando `ACTION_CONSENT_DONE` emitido em `onDestroy` (exceto recriação de atividade). O jogador deve conseguir tocar livremente em **Autorizar** no diálogo do Android.
- **Véspera e dia em modo real:** apenas confirmar etapa quando estiver na fase temporal correta; para D−1, conferir `dataEvento - 1 dia`, para D conferir `dataEvento`, usando `America/Sao_Paulo` sem horários fixos. Quando a programação oficial não for verificada, não afirmar que uma janela de passes está liberada. Treino ignora essa restrição temporal e não grava dados reais.
- **Interações de reide enxutas:** E04 “Venci / Perdi / Saí”; depois de vitória perguntar “Capturei / Fugiu / Não sei”; E10 “Registrar reide / Seguir”, permitindo registrar várias sem a grade antiga de nove botões. Tudo é informação do usuário, não recompensa certificada pelo app.
- **Reconhecimento visual:** continua apenas sugerindo com duas respostas “Sim, é essa tela / Não era”; nunca avança etapa automaticamente, nunca ativa na simulação e nunca inicia sem consentimento explícito. Captura local sem salvar frames ou textos OCR.

## Alterações realizadas na branch
- `app/src/main/assets/roteiro_bug_passes.json`: cada uma das 11 etapas passa a conter `falaEdu`, `ajudaEdu`, `periodo` (`preparacao`, `D-1`, `D`, `fim`). Fonte comunitária preservada.
- `RaidDayGuidePlan.java`: valida os novos campos, a fase e a ordem do roteiro.
- `RaidDayPreparation.java` + `arrays_raid_day.xml`: **7 perguntas** em vez de 8, removendo a pergunta sobre lugar de início; migração de respostas antigas com marca `raid_day_prep_v3_migrated`. **Não descartar histórico de sessões Room**.
- `RaidDayAssistantOverlayService.java`: interface compacta de conversa com menu isolado, perfil Edu, piloto de simulação “hoje”, controles relevantes por etapa, resumo, histórico, feedback e cabeçalho arrastável.
- `RaidDayCaptureConsentActivity.java`: restaura a bolha depois da permissão do Android; nenhuma captura visual oculta.
- `MainActivity.java` + `strings_raid_day.xml`: nome Edu visível/descrição acessível.
- Teste `lt304-edu-conversation-ui.test.js` garante anti-regressão contra janela gigante, escolhas de lugar iniciais, bloqueio da permissão e perda de sequência; demais testes LT304 atualizados.
- APK privada de QA2: versionCode **54509** e versionName **0.03.04**. **Não publicar** uma Release oficial, nem mesclar PR sem nova autorização.

## Critérios de validação física (pendentes)
- [ ] No Samsung: janela compacta em todos os tamanhos de fonte, com o jogo atrás, fora do centro e junto às quatro bordas.
- [ ] Cabeçalho arrastável; posição salva após fechar/abrir serviço, tamanho P/M/G com avatar nítido.
- [ ] Simulação de **hoje** acessível no primeiro toque, sequência E01–E11, repetição e desvio por falta de passe, todos sem eventos reais gravados.
- [ ] Perguntas de preparação simples e sem cidades como início; clique único para respostas; ajuda e voltar não apagarem dados.
- [ ] Ao solicitar captura visual, **painel e treinador desaparecem antes do diálogo**. Autorizar, negar e voltar reexibem somente a bolha.
- [ ] Seleção do evento real calcula D−1 e D e não antecipa a etapa; horário não verificado permanece rotulado.
- [ ] Reides E04/E10 e captura/fuga geram eventos distintos; confirmação de OCR nunca avança sozinha.
- [ ] Coexistência P1/P2 e Doce Raro, sem mudar API PoGoCoordinates, limite de 10 ou tratamento de 429.
- [ ] Verificar ZIP/APK QA2, `SHA256SUMS`, certificado permanente, versionCode, instalação sobre LT304 QA1 e QA Samsung.
**Automação/CI não substitui teste físico.**

## Risco e escopo
O “Bug dos Passes” é um relato comunitário que pode violar os Termos de Pokémon GO e não promete passes. Edu não teleporta, não automatiza reides, não acessa servidor do jogo nem ajuda a evitar detecção. Simulação hoje é **fictícia** e destina-se exclusivamente a avaliar a UX.
