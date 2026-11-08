# LT308 — Etapa 1: relógio de simulação ao lado do ícone dos passes

**Data:** 08/11/2026 · **Base oficial existente:** LT307 `0.03.07` / versionCode `54513`.

## Escopo autorizado nesta conversa
O proprietário pediu reconstruir a interface do Edu **uma peça por vez**, com confirmação antes de avançar. O primeiro item é um relógio no PokeSearch ao lado do ícone dos passes. O relógio começa na data/hora atual do próprio celular e avança automaticamente com segundos, minutos, horas e dias. É um **simulador temporário** para ensaiar o evento; depois será removido e o Edu real dependerá de data/hora de Brasília. Nesta etapa **não publicar APK nem mesclar** sem o proprietário conferir e aprovar.

## Implementação candidata
- **Home:** novo visor compacto **65 × 34 dp** imediatamente à direita do ícone do Edu/Passes e à esquerda do apoio/coração; sem janela enorme. Data `dd/MM/yy` na linha superior e `HH:mm:ss` na inferior. Atualização na thread principal aproximadamente a cada segundo enquanto a Home está visível; ao fechar, o relógio virtual continua pelo tempo decorrido.
- **Toque curto no visor:** selecionar **data** no calendário Android e **hora/minuto** no seletor do sistema. Os segundos ficam inicialmente `:00` e seguem automaticamente. **Toque prolongado:** restaurar a data/hora do celular sem mexer nas configurações do Android.
- **Primeira abertura:** usar relógio do celular sem ajustes. Alterações explícitas são gravadas em `edu_simulation_clock`, usando `virtual_epoch_ms` e `wall_epoch_ms`; o horário virtual é âncora escolhida + diferença do tempo real transcorrido. Horas/dias avançam em sequência automaticamente. Não há serviço de rede, permissões ou alteração do GPS.
- **Compatibilidade visual:** o cabeçalho reserva largura para o novo visor; em telefones estreitos omite apenas o wordmark de texto, mantendo o logo e controles tocáveis.
- **Treinamento do Edu:** quando `training && demoToday`, a data e hora fictícias alimentam o cabeçalho e as datas da simulação por `EduSimulationClock.forTraining`. A entrada “Simular hoje” muda para “Simular data” quando a data/hora foram modificadas. Nenhum histórico de reide real é criado.
- **Sessão real:** usa `Clock.systemUTC()` e interpreta a data em `America/Sao_Paulo` nos pontos já existentes; **nunca** usa o relógio ajustado, não muda os horários oficiais do evento e não presume que dados do celular sejam uma autoridade de tempo verificada na internet.
- **Remoção futura:** relógio temporário encapsulado em `EduSimulationClock.java`; desacoplar somente o modo de treino, remover visor, manter `RaidDayEventClock.BRASILIA` para o modo real.

## Arquivos nesta branch de aprovação
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduSimulationClock.java` (novo)
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java` (visor e seletores, sem alterar botão dos passes)
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/RaidDayAssistantOverlayService.java` (treino isolado)
- `app/tests/lt308-edu-simulation-clock.test.js` (contratos Node)

## Testes exigidos e pendências
- [ ] Node QA + LT169, Android core LT211, Java LT62, OTA LT173 no HEAD exato da PR.
- [ ] Ver no Samsung o visor ao lado do ícone, sem cortes e com dígitos legíveis.
- [ ] Testar hora escolhida, segundos, meia-noite, mudança de dia, retorno da Home e long-press para usar horário real.
- [ ] Iniciar treinamento com hora fictícia; verificar que sessão **real** ignora qualquer ajuste da simulação.
- [ ] Não alterar duas Pokébolas, Doce Raro, configuração do Edu, MediaProjection/OCR, assinatura original ou APK publicado LT307.

**Governança:** branch e PR devem permanecer em **rascunho e sem merge** até confirmação da aparência/comportamento pelo proprietário. Testes automatizados aprovados não significam teste físico no Samsung.
