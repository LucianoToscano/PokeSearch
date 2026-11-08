# LT308 — Etapa 1: relógio único do Edu ao lado do ícone de passes

**Data:** 08/11/2026 · **Base pública:** LT307 `0.03.07` / versionCode `54513`.
**Governança atualizada:** em 08/11/2026 o proprietário autorizou explicitamente **merge, publicação oficial, registro no Arquivo Mestre e prompt para novo chat**. QA físico Samsung continua pendente, mesmo após publicação.

## Especificação atual — corrigida pelo proprietário com duas imagens
O proprietário explicou: **“O Assistente Edu não tem simulador. Ele vai ser já o final. Ele vai se basear na hora e data deste relógio.”** Assim, não pode haver relógio de treino separado, nem uma pergunta “Simular hoje ou Evento real” no diálogo. Tudo o que Edu diz sobre dia D, véspera D−1, datas e condição de início usa **o mesmo relógio do ícone de passes**.

## Interface
- Pequeno visor à **direita do ícone dos passes na Home**: duas linhas `dd/MM/yy` e `HH:mm:ss`, 65 × 34 dp, sem abrir janela grande por padrão.
- **Primeira abertura:** data e hora atuais do celular usando o fuso já configurado no Android (por padrão Brasília quando aplicável), com segundos passando em velocidade normal. Não altera GPS nem data do Android.
- **Toque:** abre a tela **Data e hora** organizada como as imagens Samsung, com os interruptores Automático/Manual, fuso e formato 24 horas. Os ajustes de data e hora manuais aparecem somente quando o automático é desligado.
- **Segurar o visor:** restabelece instantaneamente a hora do aparelho. A escolha manual salva âncoras locais; os segundos continuam correndo naturalmente, inclusive viradas de dia e após recolher a Home.
- A barra superior reserva espaço para o relógio, ocultando o wordmark em celulares muito estreitos, mas não oculta os controles. Não adicionar botões de simulador na conversa do Edu.

## Fonte única do assistente
- `EduEventClock.java` fornece `Clock forEdu(context)`, usando o próprio relógio da Home. **Apagar** o protótipo `EduSimulationClock.java` para não haver dois relógios.
- `RaidDayAssistantOverlayService`: inicializa `eventClock=EduEventClock.forEdu(this)` depois que o serviço está ativo; **TODAS** as verificações de data da conversa usam este clock; o painel atualiza quando a data simulada muda e ao passar da meia-noite.
- Depois de “Olá, sou Edu ... Está pronto?”, a resposta **Sim** abre diretamente a preparação normal do tutorial; não há seleção “Simular hoje / Evento real”, nem botão “Treinar” nas telas normais.
- O calendário manual do evento consulta o mesmo relógio. Quando ajustado, o Edu mostra “**Hora ajustada**”; quando não, mostra horário do celular no fuso selecionado. Não afirmar que hora ajustada manualmente é verificação oficial de rede.
- Funções internas legadas de `training` podem permanecer inativas por compatibilidade com histórico anterior, mas **não são expostas na conversa** nem alteram a fonte de horário.
- Futuramente, quando o proprietário autorizar, o **horário oficial de Brasília** substituirá a fonte editável `EduEventClock` sem duplicar o relógio ou criar um simulador dentro do Edu.

## Layout das duas novas capturas Samsung — automático ou manual

Foi perguntado expressamente se a tela estava **como as imagens, com todas as opções**. A resposta anterior era **não**: existia um menu de itens sem switches. Agora a PR inclui **`EduClockSettingsActivity.java`**, uma tela interna de fundo preto com três grupos arredondados, títulos e switches equivalentes às imagens:

1. **Data e hora automáticas** — ON por padrão, segue o instante do relógio do Android (a rede só se o próprio Android estiver configurado para sincronizá-la). OFF ativa **Definir data** e **Definir hora**. Os campos são ocultados enquanto ON e usam os pickers nativos do sistema quando OFF; a hora continua correndo na velocidade normal após o ajuste.
2. **Fuso horário automático** — ON por padrão; usa o fuso que o Android já configurou. OFF exibe **Definir fuso** com escolha manual, incluindo Brasília, Manaus, Fernando de Noronha, Rio Branco e o fuso atual do Android.
3. **Definir fuso conforme localização** — switch ON por padrão. **Não é o controle privilegiado de detecção de localização do Android**: dentro do relógio Edu ON significa respeitar o fuso já detectado pelo Android, sem acesso a GPS; OFF mantém Brasília. É desativado visualmente se o fuso automático estiver desligado. Não declarar que este switch muda configurações do sistema.
4. **Formato 24 horas** — switch ON/OFF; acompanha o padrão do próprio Android até o usuário escolher. OFF usa formato 12 horas com AM/PM. A Home ajusta o tamanho da fonte para acomodar o horário.
5. **Topo** — título “Data e hora”, seta de retorno, informação curta do relógio, que atualiza a cada segundo. A Home continua com visor compacto de data/hora próximo ao ícone dos passes; tocar abre esta nova Activity.

Os grupos seguem a organização das imagens, **mas não reproduzem a interface privilegiada do Android nem controlam hora, rede ou fuso do celular**. As escolhas controlam somente o Edu, que utiliza a mesma fonte temporal para a preparação e o roteiro. Data/hora manual são identificadas como **ajustadas, não oficiais**.

## QA e proteções
- Contrato Node em `app/tests/lt308-edu-simulation-clock.test.js` foi atualizado para validar **fonte única**, interruptores, data/hora manual, tempo com segundos, fusos, formato 24h, relógio compartilhado e remoção da escolha de treino.
- Testar Node QA, regressão LT169, Android core LT211, Java LT62 e OTA LT173 no último commit da branch, além de teste físico Samsung do cabeçalho.
- **Não presumir** que as opções das imagens foram homologadas visualmente; verificar tamanho de fonte, pressões, calendário, TimePicker, seleção de fuso e ausência de cortes.
- **Não mexer** no roteiro E01–E11, assinatura Android permanente, duas Pokébolas, Doce Raro, API, consentimento MediaProjection ou histórico real de passes. A alteração manual do relógio não modifica Pokémon GO e não garante recompensas.
- A fonte de tempo ajustada **não é relógio oficial verificado**. Não programar notificações reais para horários fictícios como se fossem horários confirmados pela Niantic.

**Status deste documento:** PR #306 em preparação para merge/publicação autorizados. Conferir no GitHub o commit, os gates e a Release antes de marcar como publicado; a homologação física ainda é pendente.

## Revisão antes da publicação — fuso e virada de dia

A auditoria da PR identificou que a tela do relógio permitia escolher um fuso, mas as decisões do Edu sobre D−1/D permaneciam fixas no horário de Brasília. O comportamento foi alinhado em `EduEventClock.today(context)` e `EduEventClock.dayState(context, dataDoEvento)`, com seleção de fuso refletida imediatamente no serviço e na preparação; o mesmo dia é exibido e usado nas perguntas. O calendário e a hora manual continuam avançando pelo tempo real decorrido. O relógio não altera as opções do sistema Android e a simulação não comprova eficácia do relato comunitário.
