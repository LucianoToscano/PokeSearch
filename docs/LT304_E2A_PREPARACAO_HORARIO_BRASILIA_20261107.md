# LT304 — Entrega E2A: Preparação inicial e relógio de Brasília
Data: 07/11/2026. PR: #300 (**draft**). Base: LT303 (sem merge/release).

## Escopo deste incremento
Esta entrega é **parte da E2**, não a E2 inteira, e não substitui os requisitos E1/E3/E4/E5. O suporte visual continua **não implementado** e o Samsung ainda não foi validado fisicamente.

### Implementado na branch
- `RaidDayPreparation.java` e `res/values/arrays_raid_day.xml`: oito perguntas, **uma por tela**, com escolhas em recursos pt-BR. Data manual ajustada por dias, local do jogo (Central Park, Parque Ibirapuera, Pier 39, Honolulu ou Outro), passe do dia anterior, passe atual, reide já realizada, início prévio do roteiro, restrição/aviso informado, escolha de acompanhamento Manual ou “Híbrido (planejado)”.
- Cada resposta parcial e a pergunta atual são armazenadas em `SharedPreferences`, permitindo retomar a preparação se o serviço for fechado.
- Após preencher as respostas, cada data/local selecionados geram uma chave de evento `manual:<data>:<local>`. O aceite de risco é verificado contra a **versão do texto e a chave do evento**. Um novo evento solicita novo aceite; sem aceite não iniciar novo roteiro.
- A tela de revisão mostra todas as respostas **rotuladas como informações do jogador**, não como dados comprovados. Se o jogador não souber a condição de um passe, a resposta `Não sei` permanece explícita, sem ser convertida em Sim/Não.
- `RaidDayEventClock.java`: utiliza `java.time.ZoneId` (IANA) para `America/Sao_Paulo`, `Pacific/Honolulu`, `Pacific/Auckland` e `Pacific/Kiritimati`. Mostra hora e data dos quatro lugares, com respeito ao horário de verão da Nova Zelândia, estado calendário antes/hoje/depois da data D e aviso quando o horário automático do aparelho está desligado.
- **Não existe programação oficial vinculada a esta E2A.** Data escolhida manualmente é marcada como **não verificada**, e a UI nunca afirma “o evento começou” apenas porque a data D chegou. Não é implementada janela oficial de início/fim.
- Tentar iniciar o roteiro numa **data passada** mostra aviso e oferece editar o evento ou entrar no Modo Treino. Sessões reais já iniciadas são preservadas mesmo se ainda não tinham a nova preparação; a introdução da E2A não apaga o log Room da E1.
- Ícone/overlay, treinador pixel-art P/M/G, Modo Treino, histórico Room, riscos e 11 etapas E01–E11 mantidos e independentes de Pokébolas 1/2 e Doce Raro.
- `app/tests/lt304-preparation-clock.test.js`: contratos de perguntas, persistência, risk por evento, fuso da amostra histórica **30/10/2026 22h Brasília = 30/10 15h Havaí = 31/10 14h Auckland = 31/10 15h Kiribati** e comparação do horário de inverno da Nova Zelândia. Usa `Intl` para validar as conversões e procura chamadas de `ZoneId` no código Java.

### Limitações e próximos incrementos da E2
- [ ] Cadastro de eventos **oficiais verificados** com fonte, horários de início/fim, fuso do evento e data de verificação. Não transformar a data informada pelo jogador em horário oficial.
- [ ] Lembretes e notificações do app com permissão Android, cancelamento/atualização, fallback de alarmes não exatos; botão calendário `Intent.ACTION_INSERT` e confirmação pelo usuário.
- [ ] Seletor de data Android mais rápido, se for viável no overlay não-focável. O seletor inicial por botões é funcional, porém necessita revisão de usabilidade para datas distantes.
- [ ] Campo personalizado para “Outro local” com entrada manual confiável (atualmente é rótulo genérico, não coordenadas).
- [ ] Estado de janela verdadeira “antes/dentro/depois” calculada por início/fim oficiais, e validação ao retomar sessão.
- [ ] Internacionalização futura; português-BR primeiro.
- [ ] **Teste físico no Samsung**: 8 perguntas, rolagem, botões, retomada, hora automática desligada, fuso do aparelho diferente, data passada, novo evento e novo aviso, coexistência overlays.
- [ ] Não confundir escolha “Híbrido (planejado)” com captura de tela: E4/E5 ainda não existem. Não pedir permissão de MediaProjection nesta entrega.

## Governança
PR #300 permanece **draft**, sem merge, APK oficial, OTA ou alterações de assinatura; versão estável LT303. Resultado de testes automatizados deve ser verificado no HEAD antes de qualquer aceite; nenhuma homologação física foi executada neste chat.
