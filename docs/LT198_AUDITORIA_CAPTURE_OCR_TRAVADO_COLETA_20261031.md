# LT198 — O detector de Doce Raro não confirma novamente

**Estado atual: LT198 publicada oficialmente em 31/10/2026.** O restante do texto preserva os checkpoints históricos de QA da etapa, anteriores ao merge e à publicação. A falha foi relatada no Samsung com a LT197; ainda falta validar a coleta real na LT198.

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

## APK LT198 QA assinado para diagnóstico (31/10/2026)
- [Workflow QA #41185495866 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/41185495866), [artefato #13036803518](https://github.com/LucianoToscano/PokeSearch/actions/runs/41185495866/artifacts/13036803518). SOURCE_COMMIT `150b77f6b219878b11899c8c3ca0bcc45ce3a4b7`.
- Instalador `PokeSearch-LT198-QA-0.01.98-54405.apk`: **29.255.355 bytes**, versionName `0.01.98`, versionCode `54405`, SHA-256 `ea336e167b6d28b8f4e2c3932015b95d7db4478ec0fc34bb909c1991a86a9650`. APK Signature Scheme v2 = true; certificado original `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- ZIP do artefato: **26.914.277 bytes**, SHA-256 `7d94340fd85cfadb26ad3b2a2f0ff94d9f2439fc4418166733a1b41b58aff78d`. Teste de integridade ZIP: sem erro; hash APK interno coincide com SHA256SUMS e certificado verificado.
- [Google Drive — LT198 QA APK e relatórios](https://drive.google.com/file/d/122i4OBJ8YBaO8QefEfOhVBkOHFsyHyZg/view). Publicação manual de ZIP de teste na pasta PokeSearch_App, não é release público.
- **Não foi feito merge**; PR #165 permanece draft. **Não foi publicada atualização OTA LT198.** A LT197 `v0.01.97-54404` continua oficial. Falta validar no Samsung que MediaProjection entrega imagens e o reconhecimento/ACK funciona na coleta real.
- Teste sugerido: instalar APK 54405 sobre LT197, abrir Info > A, autorizar **compartilhar a tela inteira** (quando disponível), copiar coordenadas do doce e observar mensagem inferior do menu. “Sem imagens da tela” indica falta de quadros; “Aviso reconhecido · aguardando confirmação” indica pipeline visual; “✓ Coleta confirmada no PokeSearch” indica que o callback passou e registrou a coleta. Se não reconhecer, registrar somente a mensagem de status, sem fotografar a tela inteira nem coletar dados sensíveis.


## Publicação oficial — LT198 (31/10/2026)

- PR #165 integrada à main: SOURCE_COMMIT `4df63b21d5a0a9d65d7a0c386d3f2ec7e3f82105`.
- [Workflow oficial #41187283116 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/41187283116), incluindo Node, JVM, Android/OTA, R8, assinatura original e comparação do asset na release.
- [Release pública latest `v0.01.98-54405`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.98-54405); APK `PokeSearch-v0.01.98-LT.apk`, 29.255.819 bytes, SHA-256 `52a853c0686a6ff42060f4bf8bfdae232205a6cf37fce8013bf90de1a2e0dc33`. Versão `0.01.98`, código `54405`, assinatura v2 permanente com certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- [Google Drive — ZIP oficial e relatórios](https://drive.google.com/file/d/1z1x6MrfnFeCVKSaKoRB8paE4zY8vAVmS/view), 26.914.348 bytes, SHA-256 `9e40415063304bb1ed1957825904cf83c59bc3626436693ae2163eac2c6cc5ec`. ZIP validado; APK interno tem o mesmo SHA do asset público. Arquivo QA anterior mantido como histórico separado.
- **Disponibilidade:** release GitHub `latest` é utilizada pelo mecanismo de atualização pública; não comprova instalação em todos os aparelhos, nem disparo de push individual.
- **Homologação física:** teste de coleta real no Samsung após LT198 ainda pendente; detector experimental é OFF por padrão e requer consentimento de compartilhamento de tela por sessão. Botão manual `✓ Peguei` permanece disponível.
