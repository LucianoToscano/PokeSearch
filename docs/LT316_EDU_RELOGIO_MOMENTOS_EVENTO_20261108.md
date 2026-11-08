# LT316 — seleção de momentos do evento no relógio do Edu (08/11/2026)

## Pedido e decisão de UX

Adicionar aos **ajustes existentes de Data e hora** um único controle tocável **Momento do evento**. Ao tocar, abre uma lista ordenada cronologicamente, com 17 opções. A seleção ajusta exclusivamente o relógio interno do Edu para um instante calculado a partir da janela regional já configurada, usando o mesmo relógio da Home, dos balões, do contador e das fases BEFORE/ACTIVE/ENDED. Não existe relógio paralelo ou opção nova dentro do personagem.

O campo permanece visível mesmo quando a opção de data/hora automáticas está ligada: selecionar um momento altera **somente o relógio Edu** para o modo manual e faz os segundos continuarem correndo. Não altera a data/hora/fuso do Android, GPS, Pokémon GO, passes, vitórias, nem a programação do evento.

O modal usa a data e a hora de cada opção no **fuso IANA do evento**. Se não houver data, início, fim e região válidos, mostra instrução para configurar a janela antes, sem aplicar um momento arbitrário.

## As 17 opções

| Referência | Nome exibido | Offset |
| --- | --- | --- |
| Início | Evento não começou · 3 dias antes | −72 h |
| Início | Faltam 24 horas | −24 h |
| Início | Falta 1 hora | −1 h |
| Início | 30 minutos antes | −30 min |
| Início | 10 minutos antes | −10 min |
| Início | 1 minuto antes | −1 min |
| Início | 10 segundos antes | −10 s |
| Início | Início do evento | 0 |
| Início | 2 horas após o início | +2 h |
| Início | 4 horas após o início | +4 h |
| Início | 8 horas após o início | +8 h |
| Início | 12 horas após o início | +12 h |
| Início | 24 horas após o início | +24 h |
| Início | 48 horas após o início | +48 h |
| Fim | 10 minutos antes do fim | −10 min relativos ao término |
| Fim | 10 minutos depois do fim | +10 min relativos ao término |
| Fim | 1 semana depois do fim | +7 dias relativos ao término |

**Revisões de clareza:** "Evento não começou" recebeu referência objetiva de 3 dias antes para não repetir as 24h; "10 antes do fim" foi interpretado como 10 **minutos** antes do fim. O aplicativo ordena os 17 instantes cronologicamente **após** conhecer a duração real do evento, portanto a posição dos itens de término é intercalada corretamente. Exemplo: para evento das 14h às 17h, `10 min antes do fim` equivale a 16h50 e vem entre +2h e +4h do início. Se um item "4h após o início" for posterior ao encerramento, o Edu mostra estado encerrado, nunca "ativo" só porque a opção menciona o início.

## Arquivos

- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduEventMomentPresets.java`: cálculo puro e lista cronológica dos 17 instantes.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduClockSettingsActivity.java`: linha clicável nos ajustes de relógio e lista modal, sem botões dentro do Edu.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduEventClock.java`: `setManualInstant(Context,Instant)` usa a mesma âncora virtual atual, sem conversão ambígua no horário de verão.
- `app/tests/lt316-edu-event-clock-moments.test.js`: 17 opções, ordenação, cálculo relativo ao fim, relógio único, fuso, estado sem evento e ausência de mudança de sistema.

## Preservação e aceitação

Mantidas as 68 sprites, o primeiro balão, P/M/G, relógio único, agenda regional do evento, E01–E11, histórico local, P1/P2, Doce Raro, PoGoCoordinates, favoritos, login e atualizador/assinatura permanente. **Não exigir confirmação de passes, não confundir hora manual com servidor.**

Testar no Samsung: selecionar cada opção, verificar data e horário ao voltar à Home, observar segundos correndo, contador em 10s/1min antes, transição de sprite e texto ao cruzar o início e o fim, cenários 2/4/8/12/24/48h após início, duração curta e fuso diferente de Brasília. QA físico ainda pendente; publicação e merge dependem de autorização específica do proprietário.
