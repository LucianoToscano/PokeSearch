# PokeSearch LT304 — QA físico do Edu no Samsung (pendente)
**Registro:** 07/11/2026. **Base oficial:** LT304 / 0.03.04 / versionCode 54510.
**Objetivo:** testar no aparelho real antes de propor correções funcionais. Este checklist não comprova testes executados.

## Antes de começar
- Confirmar no Android a versão instalada **LT304 54510** e que o APK veio da Release `v0.03.04-54510`. QA1 54508 e QA2 54509 são antigas; a publicação oficial não implica instalação no celular.
- Manter duas Pokébolas e Doce Raro como estão. Não apagar preferências nem histórico para testar o Edu.
- Não incluir coordenadas pessoais, notificações privadas ou dados de outros aplicativos nas capturas enviadas para análise. A leitura visual do Edu não deve salvar capturas nem texto OCR.

## Cenários a observar no aparelho
| ID | Passo físico | Esperado para aprovação | Evidência e status |
| --- | --- | --- | --- |
| S01 | Abrir Edu pela primeira vez na Home e recolher/abrir sua bolha | Avatar pixel-art **G=100 pixels físicos** quando não houver preferência; seleção anterior P/M/G preservada; acesso fácil à conversa | **Pendente** |
| S02 | Mover avatar com arraste, alternar animação e P/M/G no menu ⋯, fechar/abrir o app | Bolha nítida, não cortada, tamanho e posição preservados, reações coerentes | **Pendente** |
| S03 | Abrir a conversa nas 4 bordas, em retrato/paisagem e com fonte aumentada | Janela glass compacta (largura até 286dp, altura limitada), cabeçalho arrastável, legibilidade sem invadir controles essenciais do Pokémon GO; uma pergunta por vez | **Pendente** |
| S04 | Selecionar **Simular hoje** na primeira conversa | Etiqueta **SIMULAÇÃO HOJE**; Brasília como referência; véspera D−1 fictícia = ontem e evento D fictício = hoje; sem passar por autorização de tela | **Pendente** |
| S05 | Percorrer E01–E11 no modo treino, incluindo repetição e Kiribati opcional | Ordem determinada pelo `roteiro_bug_passes.json`; Havaí → Nova Zelândia → retorno ao Havaí; não sugerir cidade inicial aleatória, nem avançar automaticamente etapas críticas | **Pendente** |
| S06 | Entrar em **Evento real**, responder preparação e mudar data | Sete perguntas, sem escolha de cidade inicial; horários não verificados sinalizados; D−1 diferente de D; data informada em Brasília | **Pendente** |
| S07 | Em E04, registrar vitória, derrota ou saída, e resposta separada de captura; em E10, registrar múltiplas reides | Eventos independentes; não confundir ganhar, recompensas, encontro, captura, fuga ou sair; histórico coerente | **Pendente** |
| S08 | Pausar, “Me perdi”/Ajuda, voltar, sair do Pokémon GO e reabrir | Sessão real é retomada sem perder passos, pausas e registros; treino não contamina o histórico real | **Pendente** |
| S09 | No modo real, usar ⋯ → **Autorizar leitura de tela** e autorizar/recusar/voltar no Android | **Painel e avatar somem antes do diálogo**; botão Autorizar clicável; somente a bolha recolhida retorna depois; nova autorização em cada sessão | **Pendente** |
| S10 | Com autorização, observar lobby, batalha, vitória/derrota, recompensas e captura/fuga em PT-BR/EN | OCR local é só sugestão, conservador, após quadros concordantes; pede confirmação/rejeição do usuário e nunca avança etapas ou confirma passes por si | **Pendente** |
| S11 | Parar captura pela notificação, revogar permissão e alternar com captura do Doce Raro | MediaProjection é encerrado; modo manual disponível; não há duas projeções simultâneas nem captura silenciosa | **Pendente** |
| S12 | Com Edu, Pokébola 1, Pokébola 2 e Doce Raro ligados, pesquisar e atualizar | Overlays coexistem sem bloquear controles; pesquisa sem login, favoritos, sprites e ranks intactos; limite 10 resultados; HTTP 429/Retry-After preservados | **Pendente** |

## Registre um problema de forma objetiva
Para cada falha: **ID do teste; LT instalada; print ou gravação opcional; o que foi tocado; esperado; o que realmente ocorreu; se acontece novamente**. Se for permissão do Android, registrar se foi **autorizar**, **cancelar** ou **voltar**, e se a bolha reapareceu. Não descrever uma evidência como resultado aprovado sem teste físico correspondente.

## Regras para correção
1. Confirmar HEAD `main`, Release/latest, workflows e base LT304 antes de editar.
2. Abrir branch/PR com correção mínima reproduzível; manter testes de regressão LT304, Node, LT169, LT211, LT62, LT173 e OTA conforme o impacto. Repetir QA Samsung para falhas visuais/MediaProjection.
3. Não fazer merge nem publicar APK sem autorização expressa. Se autorizado futuramente, usar fluxo oficial permanente e versionCode **superior a 54510**.
4. Não automatizar GPS, teleporte, cliques ou reides. O tutorial comunitário “Bug dos Passes” não é garantido e pode violar os Termos de Pokémon GO.

**Situação em 07/11/2026:** checklist preparado; **S01–S12 ainda não executados nem homologados por este registro**.
