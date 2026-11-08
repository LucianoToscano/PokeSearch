# Edu LT316 — primeira conversa, estado do evento e checklist (08/11/2026)

## Escopo autorizado

A pedido do proprietário: trabalhar **somente no primeiro balão e seus estados**, sem criar botões, menus, telas novas ou reiniciar o projeto. Base LT316 `0.03.16 / versionCode 54522`, respeitando o QA anterior de P/M/G da PR #317.

A apresentação fica no mesmo balão branco do Edu. Ao tocar no ícone flutuante, a sprite aparece e a conversa abre com o personagem parado. Ao tocar **no próprio balão**, avança para o status do evento (sem botões de Sim/Não/Começar). Textos sublinhados com ⓘ são zonas tocáveis dentro do balão; ao abrir informação, o texto é substituído por explicação e outro toque no balão retorna à etapa anterior. Não existem novos controles flutuantes.

### Copys principais

- **Apresentação:** "Olá! Eu sou o Edu, seu coach de Pokémon GO! Vou acompanhar você nesta jornada. Hoje vamos conhecer o Bug dos Passes ⓘ."
- **Evento encerrado:** "Infelizmente, o evento já foi encerrado nesta região. Aguarde o próximo evento!" Usa a sprite `evento_encerrou` (#36).
- **Evento antes do início:** "O evento ainda não começou. Início: data e hora no fuso configurado." Mostra o contador regressivo vivo e os três itens de checklist; usa `evento_nao_comecou` (#38).
- **Evento ativo:** "O evento já começou!" acompanhado de nome do evento quando conhecido, data/hora de início, término e orientação para conferir reides e passes no próprio jogo. Ao tocar novamente no balão aparece só o checklist; usa `evento_comecou` (#37).
- **Sem janela válida:** informa que data e horário ainda não foram configurados, sem inventar dia ou status. O calendário do Edu continua acessível pelo menu oculto já existente, ao segurar a sprite.

### Checklist manual, sem botões

1. `☐ Sem softban ⓘ`
2. `☐ Não ter acessado uma região onde já é dia do evento ⓘ`
3. `☐ Guardar o passe de reide laranja da véspera ⓘ`

O jogador toca no `☐` para marcar, sem efeito sobre o estado do Pokémon GO, sem presunção de passes ou softban. O nome sublinhado com ⓘ explica o significado/como se prevenir ou obter o item em **um único balão**; clicar na fala volta à tela anterior. Nenhuma etapa posterior E01–E11 é automaticamente iniciada.

`Bug dos Passes ⓘ` explica o que o método *alega* oferecer (passes extras), sua origem comunitária, ausência de garantia de benefícios e risco de violar regras. Evitar linguagem de recurso oficial.

## Tratamento de imagem e horário

- `EduSpeechDrawable` continua sendo o balão branco sem caixa externa, com ponta lateral mais longa (28dp) orientada à região da cabeça, ponta posicionada a aproximadamente **5 pixels da lateral estimada da cabeça**, descontadas as margens transparentes da arte, e posicionamento limitado à tela, favorecendo o lado com mais espaço. Não obstrui o corpo do próprio Edu; eventuais conflitos com outras overlays independentes devem ser observados no Samsung.
- A cabeça/cabelo/pés, 68 quadros, 22 poses ociosas, Sombria e efeitos de teleporte não são redimensionados. Tamanhos P/M/G 50/75/100 preservados.
- Contador da janela BEFORE usa o **mesmo `eventClock`** já configurado na Home; dia/hora de início vêm de `RaidDaySchedule`, exibidos no fuso IANA selecionado. Atualização de segundos somente com o balão visível no estado BEFORE; fora dele, intervalo original de 5 s.
- Relógio manual é simulação interna, **não comprova horário do servidor**. O exemplo Mega Chandelure (31/10/2026, 14–17h local) é histórico.

## Contrato de segurança e QA

Arquivos da branch: `RaidDayAssistantOverlayService.java`, teste `app/tests/lt316-edu-first-bubble-onboarding.test.js`, este documento, Guia Mestre e prompt de continuidade. Preservados P1/P2, PoGoCoordinates, Doce Raro, ranking, login, relógio único, dados, assinatura, OTA e todo E01–E11.

**Pendente:** conferir em Samsung que o primeiro toque abre só o balão, links/ⓘ são tocáveis, texto cabe sem cortar, scroll é possível, a ponta fica próxima à cabeça sem cobrir outra sprite, o contador avança em segundos, e as três sprites mudam de acordo com o fuso. CI automatizado não substitui homologação física. Esta entrega é apenas QA em branch; não declara release nem APK instalado.
