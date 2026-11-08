# LT311 — Mega Chandelure por horário local e sprites do Edu

**Base publicada:** LT310 `0.03.10` / `54516` (sem downgrade).
**Pedido:** utilizar o Dia de Super Megarreides: Chandelure como exemplo, garantir que o Edu determine antes/durante/depois pelo local selecionado, inclusive quando o evento já tiver começado em um país e ainda não em outro.

## Fonte oficial
- https://pokemongo.com/pt-BR/news/chandelure-super-mega-raid-day-2026
- Sábado **31/10/2026**, das **14h às 17h no horário local**.
- 6 Passes de Reide gratuitos no evento base, até 14 com ingresso; recompensas distintas não são prova do suposto método comunitário. Evento histórico, já encerrado: configurar o relógio **manual do Edu** para testá-lo.

## Design
- Somente um relógio interno do Edu (automático ou manual). Nunca modificar o sistema/GPS.
- Configuração: exemplo oficial com data/hora locais, seletor de região (fuso IANA) com principais regiões e campo livre para outras.
- Persistir local, data, origem, instantes inicial/final (UTC) de forma isolada em `raid_assistant_overlay`. Migrar silenciosamente janelas antigas para Brasília; não apagar histórico.
- Estados `BEFORE`, `ACTIVE`, `ENDED`, limite final exclusivo. Sprites atuais: `evento_nao_comecou`, `evento_comecou`, `evento_encerrou`.
- Relógio cruza as fronteiras e atualiza conversa e sprite automaticamente, sem dar passes ou marcar evento real no jogo. Exigir confirmação manual para continuar.
- A região de **início** não é Kiribati. Kiribati aparece somente na etapa opcional do roteiro comunitário anterior, que continua devidamente identificada.

## Instantes de referência (em Brasília)
| Região local | Começo 14h local | Término 17h local |
| --- | --- | --- |
| Kiritimati (UTC+14) | 30/10 21h | 31/10 00h |
| Auckland (UTC+13, horário de verão) | 30/10 22h | 31/10 01h |
| Singapura (UTC+8) | 31/10 03h | 31/10 06h |
| Brasília (UTC-3) | 31/10 14h | 31/10 17h |
| Honolulu (UTC-10) | 31/10 21h | 01/11 00h |

O intervalo se refere ao mesmo dia local 31/10 em TODAS as regiões; meia-noite em Brasília não muda automaticamente o estado de outros locais.

## Testes
- `node app/tests/lt311-edu-event-regions.test.js`: conversões independentes via Intl, fuso IANA, limites e sprites conectadas.
- Executar CI Node integral, Java Android, OTA, assinaturas e publicação protegida.
- Ainda requer QA físico no Samsung (simulação com relógio manual P/M/G e transições), pois testes de software não garantem alinhamento visual/instalação real.
