# LT318 QA — Edu: reiniciar a conversa sem UI legada (08/11/2026)

## Evidência física relatada pelo proprietário

Captura Samsung na LT317 mostrou `Edu ETAPA 10/11 · Hora ajustada 28/10 14:00`, X, dois botões `Conferir novamente` e `Rever região`, texto `America/Sao_Paulo`, `exemplo histórico oficial` e `Relógio Edu`. A sprite não mudou para "evento ainda não começou" e o contador regressivo não apareceu. **Isso contraria o fluxo de início solicitado.** A falha vinha da prioridade dada a `active/training` restaurados do banco: o código antigo `showEduGuide()` tomava o lugar de `showEduFirstBubble()`.

## Correções na PR #318 (branch `fix/lt318-edu-clean-first-bubble-20261108`)

1. **Abrir o Edu = apresentação, sempre.** Ao tocar no personagem, o primeiro balão diz: "Olá! Eu sou o Edu, seu coach de Pokémon GO! Vou acompanhar você nesta jornada. Hoje vamos conhecer o Bug dos Passes ⓘ." O termo é sublinhado e clicável. Outro toque na fala avança à fase do evento; não há botão adicional. O estado E01–E11 da sessão antiga continua em Room, mas **não pode aparecer na apresentação**.
2. **UI realmente removida, não só oculta:** `createPanel()` não cria mais `nameChip`, cabeçalho "Edu ETAPA", etiqueta de relógio nem botão X. A conversa do início permanece apenas o balão branco; tocar novamente a sprite recolhe o balão, e segurar a sprite abre os ajustes ocultos. Os containers de respostas antigas não mostram botões durante o primeiro fluxo.
3. **Sprite coerente com a fase e atualização imediata:** a introdução usa `apresentacao` (42); antes do início usa `evento_nao_comecou` (38); ativo usa `evento_comecou` (37); encerrado usa `evento_encerrou` (36). O renderer e o ticker priorizam esses estados enquanto a fala está aberta, inclusive com `active=true`, `training=true`, `finished=true` recuperados do histórico. Reações antigas não sobrescrevem a sprite contextual. O estado encerrado usa a arte própria de encerramento, não a de antes do início.
4. **Texto enxuto, sem revelar relógio de testes:** antes do evento diz somente que não começou, data e hora da janela (sem código de fuso) e os três requisitos: sem softban; não ter visitado região que já entrou no dia; guardar passe laranja da véspera. Cada item tem `ⓘ` e sublinhado; informações são abertas no **mesmo balão**, sem menus/botões adicionais. Ativo informa início/fim do evento, depois outro toque exibe o checklist. Encerrado diz que acabou e pede aguardar o próximo evento. Não mostrar "America/Sao_Paulo", "relógio manual", "simulador" ou "exemplo histórico oficial" nas falas.
5. **Contador regressivo visível:** destaque no topo do balão, horas/minutos/**segundos**, atualizados a cada segundo via `eventClock` do aplicativo. O relógio da Home com 17 presets serve somente para simular a passagem do tempo; não é assunto da fala do Edu. Quando cruzar o início/término, atualizar conteúdo e sprite.
6. **Chandelure como evento-base:** caso não haja janela válida, carregar o exemplo Mega Chandelure em **31/10/2026, 14h–17h locais**, sem sobrescrever um evento personalizado válido. Como o relógio real já passou dessa data, usar o seletor de momentos da Home para conferir as fases BEFORE/ACTIVE/ENDED sem esperar dias reais.
7. **Geometria e legibilidade:** manter balão branco sem painel exterior, cauda 28dp e ponta estimada a 5px da lateral da cabeça, sem distorcer sprites ou alterar P/M/G 50/75/100, 68 quadros e 22 poses ociosas. Necessária checagem física para colisões com outras overlays.

## QA técnica

- Novo teste: `app/tests/lt318-edu-clean-first-bubble-regression.test.js` protege contra a etapa antiga e verifica ausência de X/botões/fuso, sprites #42/#38/#37/#36 e contagem.
- Contratos LT304 que esperavam cabeçalho/arraste pelo chip foram atualizados para UX LT318, mantendo a movimentação pela sprite e o acesso aos ajustes por toque longo. Contrato LT316 passou a validar `AGENTS.md` contra Release LT317 oficial, sem perder guardas das 68 sprites.
- Propriedade: toda integração futura precisa testar abertura com histórico salvo em `ETAPA 10/11` e relógio virtual 28/10/2026 14:00, depois 31/10/2026 14:00 e 31/10/2026 17:01. Não presumir que CI prova aparência.

## Publicação e precauções

**Esta PR é apenas correção em QA, não Release.** A versão pública ainda é **LT317 · 0.03.17 / versionCode 54523**. Nada foi instalado, mesclado ou assinado nesta etapa. Fazer os cinco gates e validar a posição/clicabilidade da fala e a sprite real no Samsung antes de declarar visual aprovado. Proteger `E01–E11`, duas Pokébolas, PoGoCoordinates, Doce Raro, login, dados, fontes, OTA, assinatura v2 permanente e tamanho de APK.
