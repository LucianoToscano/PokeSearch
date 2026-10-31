# LT198 — O detector de Doce Raro não confirma novamente

**Estado: QA de correção, não distribuído.** Base LT197 oficial `0.01.97/54404`, que passou no CI mas teve nova falha de detecção relatada pelo usuário no Samsung.

## Evidência e diagnóstico
- Foram comparadas localmente as imagens já fornecidas, sem enviar capturas ao GitHub. A implementação de `CandyPickupEvidence.hasDualCandyBanner` identifica corretamente ambas as sprites vermelha-amarela-verde e o centro claro do banner real nas imagens de 740×1536. Isso **não prova que o MediaProjection esteja recebendo os mesmos pixels** no aparelho.
- **Defeito concreto no fluxo de produção:** `onFrame()` interrompia TODA amostragem quando `inFlight=true`, flag mantida até a conclusão assíncrona do OCR ML Kit. Se o modelo ainda estivesse baixando ou o OCR demorasse, o aviso poderia aparecer e desaparecer sem nenhuma análise visual. Regressões anteriores só verificavam evidências sintéticas, não um OCR bloqueado.
- Um segundo problema era a flag `A` verde: representava serviço iniciado, **não recebimento de quadros válidos**. Os erros de leitura de pixels eram engolidos por `catch` silencioso e o detector alegava “coleta detectada” antes de confirmar que o serviço do overlay aceitou a ocorrência.
- Ao copiar um novo doce, a espera pelo desaparecimento do banner anterior podia ficar travada se o OCR não devolvesse mais resultados.

## Correção QA LT198
- O reconhecedor visual de duas sprites passa a amostrar **a cada 350ms enquanto houver seleção**, independentemente de tarefas OCR em andamento; OCR conserva no máximo uma tarefa em andamento, sem bloquear os frames visuais.
- Respostas OCR antigas não podem desfazer um reconhecimento visual mais recente; o banner anterior é liberado após **dois quadros sem ele**, inclusive com OCR travado.
- O serviço de captura registra somente data/hora da última imagem e estado de validade dos pixels em preferências locais. O menu Info informa **“Sem imagens da tela · reautorize captura completa”** se não houver quadro por 6s, distinguindo de “Aguardando mensagem”. Erros de formato, leitura e processamento ficam visíveis em status curtos. Não persiste nem envia pixels, imagens, texto OCR, coordenadas, JWT ou conta.
- O serviço de overlay só mostra **“✓ Coleta confirmada no PokeSearch”** após verificar o único ponto pendente e chamar a rotina de registro da coleta. Se o callback não corresponder, mostra aviso de seleção divergente.
- A detecção mantém o opt-in, permissão Android por sessão, notificação de Parar, fallback manual, cooldown por confirmação, ocultação apenas após confirmar e ausência de GPS ou API extra.

## QA e próximos passos
- Novo teste Node `lt198-candy-capture-watchdog-ack.test.js` exige que OCR assíncrono não interrompa a análise visual e valida resposta real do serviço de coleta.
- Testes LT197 existentes são preservados com o novo intervalo de 350ms. CI Node/JVM/Android/OTA da branch ainda precisa ser confirmado.
- **Diagnóstico real indispensável:** testar no Samsung que o status receba imagens da tela, que o aviso gere duas leituras visuais e que o overlay confirme a coleta. Sem essa medição, não declarar funcionamento real nem distribuir automaticamente a todos.
