# LT304 — Edu: conversa guiada com respostas reais (sem lista estática)
**Data:** 07/11/2026 · **Status:** candidato na PR #302, **não publicado** · **Base:** LT304 `0.03.04` / `54510`.

## Pedido do proprietário
A experiência deve parecer diálogo de quadrinhos: Edu se apresenta como treinador, pergunta se o jogador está pronto, orienta **uma decisão por vez**, espera respostas claras, e não passa automaticamente para a etapa seguinte. A configuração técnica permanece oculta pelo **toque prolongado de 1,2 segundo na sprite**. O tutorial não deve virar lista de 11 instruções gigantes.

## Roteiro conversacional implementado
1. **Apresentação:** “Olá! Meu nome é Edu. Serei seu treinador hoje! Vou te ensinar ... Está pronto?” → **Sim, vamos lá / Agora não**. Com Sim, aparece a escolha **Simular hoje / Evento real**.
2. **Data e passe anterior (E01):** informar data de evento, e horário **somente se fornecido pelo usuário e correspondente à data selecionada**. Sem horário: mostrar “horário não informado”; treino fictício não inventa horário oficial. Orientar a guardar Passe Diário gratuito sem gastar, e perguntar **Sim, tenho / Não tenho / Vou conferir**. “Não tenho” ou “Vou conferir” mantém a etapa aberta.
3. **Havaí (E02):** exibir `21.2709423,-157.818172` tocável (copia), perguntar se já está na região. Depois da confirmação, **outra pergunta** pede fechar/reabrir jogo e conferir carregamento do mapa e Pokémon após aproximadamente um minuto. “Ainda não” não avança.
4. **Nova Zelândia (E03):** exibir `-41.282491,174.769132` tocável; confirmar chegada; **só depois** verificar Passe Diário realmente visível. Sem passe observado, desviar para o dia do evento, sem inventar reide.
5. **Resultado da reide (E04):** escolher **Venci / Perdi / Saí**. Se venceu, pergunta separada **Capturei / Fugiu / Não sei**; não confundir vitória, encontro e captura.
6. **Voltar ao Havaí (E05):** perguntar se voltou à região; em seguida reabrir Pokémon GO e confirmar mapa carregado. Não tratar mudança de localização como prova do servidor.
7. **Conferir passe (E06):** **Sim, tenho / Não tenho / Vou conferir**; sem passe vai ao fluxo do dia do evento.
8. **Repetir ou seguir (E07):** retorno a E02 ou ir a E08; contador de ciclos não equivale a recompensas.
9. **Dia do evento (E08):** se **nova sessão real** começa no próprio dia D (Brasília), entrar diretamente nesta etapa, sem forçar passos de D−1. Perguntar se há passe disponível; sem passe, oferecer nova conferência ou encerrar/resumir, sem registrar reide inexistente.
10. **Kiribati opcional (E09):** coordenadas `1.987149,-157.477137` tocáveis; conferir ou pular.
11. **Reides e encerramento (E10/E11):** registrar várias reides separadamente; mostrar resumo de respostas reais, nunca garantia de passes.

## Integridade, privacidade e retomada
- **`roteiro_bug_passes.json` permanece a fonte da ordem E01–E11**, desvios de falta de passe e fase D−1/D. Não alterar GPS, teleporte, cliques ou servidor do Pokémon GO. O roteiro é relato comunitário, não comprovado e pode violar os Termos.
- Estado de **subpergunta na sessão real** é associado à combinação `sessionKey:stepId` em preferências locais; ao fechar/reabrir, retornar ao mesmo ponto sem fingir que “chegou” ou que “carregou”. Treino não grava essas subperguntas como progresso real.
- Data/horário manual do evento são considerados **não verificados**. Formatação em `America/Sao_Paulo`. Se a data da janela não corresponder ao evento escolhido, não apresentar hora de outro evento.
- A autorização MediaProjection permanece por sessão, com captura 100% local, consentimento Android sem sobreposição e sugestões visuais que não avançam etapas.
- Mantidos tamanho G=100 pixels físicos por padrão, preferencias salvas P/M/G, duas Pokébolas, Doce Raro, busca sem login, 10 resultados, 429/Retry-After e assinatura original.

## QA (não homologado)
- [ ] Node QA, LT169, LT211, LT62 e LT173 com commit exato da PR.
- [ ] Samsung: apresentação e opções Sim/Não; escolha treino/real; horário manual/ausente; passe sim/não/conferir; coordenadas tocáveis; chegada e carregamento separados; fechar/reabrir entre duas perguntas; evento D e D−1; reides múltiplas; balão branco em diferentes fundos.
- [ ] MediaProjection autorizar, cancelar e voltar com avatar oculto durante diálogo e só bolha recolhida depois.
- [ ] Teste de regressão completo dos overlays P1/P2 e Doce Raro.
- [ ] Não marcar físico ou novo APK como concluído sem evidência; **sem merge/publicação não autorizados**.

**Observação:** a preparação real pré-existente ainda faz sete perguntas antes da etapa E01; será avaliada com as capturas do Samsung para decidir como simplificá-la, sem perder respostas anteriores. A nova apresentação e o início de sessão não dependem de uma lista de cidades.
