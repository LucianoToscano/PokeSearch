# LT304 — Proposta: preparação inteligente do Assistente do Dia de Raides

**Data:** 2026-11-07  
**PR:** #300 (rascunho), sobre LT303.  
**Escopo:** roteiro do vídeo "Bug dos Passes" (não ferramenta genérica de reides).  
**Estado:** esta especificação é proposta para próximas implementações; NÃO equivale a funcionalidade já programada, testada ou lançada.

## 1. Perguntas iniciais: apenas o necessário

A primeira abertura do ícone mostra uma tela compacta:

1. **Qual a data do Dia de Raides?** Seleção manual de data, ou seleção a partir de um evento previamente verificado. Não assumir que o dia 30–31/10/2026 do vídeo seja um evento futuro.
2. **Qual a situação do seu Passe de Reide Diário?** [Tenho um / Não tenho / Não sei]. Se o usuário não sabe, a primeira etapa orienta como verificar no jogo, sem inventar saldo.
3. **Como quer acompanhar?** [Manual / Visual autorizado]. O modo manual não solicita permissão de captura; o visual explica escopo e pede autorização do sistema Android apenas quando a sessão começar.

Campos não obrigatórios: já fez uma reide no dia? deseja instruções curtas ou explicação longa? Roteiro pausado pode ser retomado com revisão do horário.

**Resumo antes de começar:** data selecionada, hora atual em Brasília, fase estimada, evento selecionado, modo, passe informado, aviso de que o método relatado não é oficial/garantido e pode violar regras. Botão [Iniciar instruções] habilitado somente depois de aceitar ver o aviso; permitir [Treinar sem executar].

## 2. Relógio e janelas

- Usar hora local da zona IANA `America/Sao_Paulo` (horário de Brasília) para calcular e apresentar todas as etapas. Não alterar o relógio, fuso ou GPS do Android nem inferir localização do jogo.
- Exibir sempre **data + hora + zona** (ex.: "30/10/2026, 22:00 BRT"), convertendo a hora local do dispositivo apenas para apresentação adicional.
- O vídeo de referência menciona um início às 22h de Brasília na véspera de 31/10/2026. Isso é **somente um exemplo histórico do vídeo**, não uma janela universal comprovada. O usuário deve selecionar/confirmar o evento e o horário aplicável antes de qualquer contagem.
- Estados de relógio: `EVENT_UNSET`, `BEFORE_PREP`, `PREP_WINDOW`, `EVENT_DAY`, `PAST_WINDOW`, `CLOCK_UNCERTAIN`. Não chamar nada de "liberado" sem verificar o evento e sua janela.
- Se estiver cedo: "Ainda não chegou o horário selecionado. Quer ver o tutorial em modo treino?".
- Se estiver tarde: "O horário deste roteiro já passou. Não é possível confirmar que o método ainda se aplica. Rever data ou treinar?".
- Em horários ausentes/não verificados: "Horário do método não confirmado — sem automação de avanço".
- Alarme opcional LOCAL: avisar em horário configurado de preparação, começo e fim da janela selecionada. Não disparar alarmes de localização/teleporte.

## 3. Orientação passo a passo

Em cada etapa, a bolha expande um único cartão legível com:
- Etapa X de N, fase, hora de Brasília, instrução **"Agora faça isto"**, por quê, confirmação esperada, indicação "manual"/"detecção visual", e botão de ajuda.
- Ações: [✓ Confirmar], [Não aconteceu], [Voltar], [Pausar], [Me perdi] e, somente onde pertinente, [Copiar coordenadas].
- `Confirmar` grava o que foi **declarado** pelo jogador, com timestamp e `source=USER`; não prova que passou a ganhar passes.
- `Não aconteceu` registra `FAILED_OR_NOT_OBSERVED`, abre instrução de revisão e oferece sair do ciclo, sem reiniciar de forma oculta.
- "Me perdi" mostra última etapa realmente confirmada, último checkpoint e como retornar sem perder o histórico.
- Não avançar por timer sozinho. Cronômetro de aproximadamente 1 minuto do vídeo é indicativo, não prova que jogo, recompensa ou cooldown estão corretos.
- Ao entrar em ciclo Havaí / Nova Zelândia, contador de ciclos (nunca rótulo "passes"). Se o usuário confirmar que **viu** um passe, poder continuar; se disser que não viu, oferecer [Sem passe → evento].
- Salvar a etapa e o modo. Na retomada, recalcular janela com hora de Brasília; se estiver fora da janela selecionada, exigir revisão, não retomar cegamente.

## 4. Diagnóstico e alertas

Não acusar usuário de erro quando não houver evidência. Categorização:

| Condição | Mensagem e ação |
|---|---|
| Fora da janela selecionada | "Fora do horário configurado" → Revisar data / Treinar |
| Data original do vídeo no passado | "Este exemplo já passou" → Configurar evento |
| Passe não apareceu | "Passe não confirmado no jogo" → Revisar / Pular ciclo |
| Reide não concluída | "Resultado não confirmado" → Voltar / Reavaliar |
| Mudança de país somente presumida | "Localização não verificada" → Confirmar manualmente |
| Captura não autorizada/indisponível | "Acompanhamento visual desligado" → Continuar manual |
| OCR contraditório ou instável | "Não consigo confirmar esta tela" → Confirmar manualmente |
| Jogo em segundo plano ou captura interrompida | "Tela indisponível" → Reabrir e, se necessário, reautorizar |
| App perdeu hora confiável ou evento não verificado | "Horário não confirmado" → Revisar; nunca presumir elegibilidade |

Manter regra de neutralidade: **ausência de evidência não é evidência de falha ou de sucesso**.

## 5. Captura visual opcional do Pokémon GO

Tecnicamente possível no Android por `MediaProjectionManager.createScreenCaptureIntent` e seleção da janela do Pokémon GO, mediante aprovação do Android. Somente a janela escolhida pode ser compartilhada no Android 14+; não há acesso ao estado privado do servidor do jogo. A captura pode ser negada, interrompida ou protegida.

O PokeSearch já possui `CandyCaptureConsentActivity` e `CandyScreenCaptureService` com OCR ML Kit para Doce Raro. Em **outra PR**, refatorar a captura em um coordenador único da sessão autorizada e dois detectores independentes, evitando tentar manter duas projeções concorrentes.

Pipeline planejado:
- Solicitar permissão de compartilhamento de tela por sessão **apenas se usuário optou por modo visual**.
- Processar frames localmente na RAM, sem salvar imagens, enviar pixels, cookies, localização, credenciais ou textos OCR para servidor.
- Detectar apenas marcadores necessários: mapa visível, interface de reide, vitória, resultados, e eventual indicação **visível** de passe.
- Exigir evidências consistentes; só sugerir avanço quando o evento estiver bem identificado. **Saldo do passe depende de confirmação explícita quando a UI não for conclusiva**.
- O usuário pode desligar a captura em qualquer momento; notificação persistente com [Parar].
- No Android 14+ preparar nova autorização por sessão; ao bloquear o aparelho ou terminar compartilhamento, parar captura e manter guia manual.
- Não simular toques, não controlar GPS, não acessar memória do Pokémon GO, não usar Accessibility Service para clicar no jogo.

## 6. Regras de segurança e comunicação

- Chamar publicamente "Assistente do Dia de Raides"; "Bug dos Passes" é apenas subtítulo comunitário.
- **Não afirmar que 15–40 passes são possíveis ou garantidos**, nem que o vídeo comprova recompensas.
- Falsificação de GPS, manipulação de fuso e exploração intencional de bugs podem infringir regras do Pokémon GO; avisar na preparação.
- O próprio usuário decide se segue o vídeo. O app pode simular o roteiro e ajudar a verificar estados, mas não deve automatizar uma exploração de mecânicas do servidor.

## 7. Sequência de entrega

**A — refinamento manual e horário:** fluxo de 3 perguntas, relógio Brasília, estados antes/durante/depois, botão "Não aconteceu", retomada segura e testes de data/hora.

**B — diagnóstico:** registro de evidência declarada, ajuda contextual e contagem de ciclos distinta de passes, simulação e alertas sem exagerar a certeza.

**C — detecção visual opt-in:** compartilhamento da janela Pokémon GO com consentimento, OCR local, classificação de telas e integração não intrusiva com o guia, QA no Samsung e regressão Doce Raro.

**Critérios de aceite:** nenhum avanço duplo, avanço automático nunca apenas por timer, preservação dos 3 overlays, timezone Brasília independente do fuso do aparelho, sem captura silenciosa e sem alegação de passe confirmado na ausência de evidência.

**Importante:** Não concluir merge ou release LT304 com base apenas nesta especificação. O código atual da PR #300 é o MVP manual; a fase visual e o onboarding seguem pendentes.
