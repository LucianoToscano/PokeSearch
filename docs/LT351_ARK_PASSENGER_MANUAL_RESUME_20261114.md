# LT351 ARK — Aviso «Sou passageiro» e entrega visual LT349

**Estado:** candidato de correção complementar, baseado na main `7ec71ff4bd12e8d9f6a54a95271810b733a3fefd` (última release pública 0.03.46 / 54553). A PR #385 de design system LT350 está em rascunho para homologação visual no Samsung; não forçar merge nem desconsiderar o gate físico.

## Auditoria real
As correções visuais LT349 solicitadas já foram integradas pela PR #382; abertura lateral e alça branca da LT349b foram integradas na PR #384. Os testes de contrato são `app/tests/lt349-visual-opacity-scanner-and-pgs-contract.test.js` e `app/tests/lt349b-pgs-side-menu-white-crop-handle.test.js`, mas a integração não equivale a APK público: a última release disponível é v0.03.46-54553. A LT350 tem implementação proposta na PR #385, com gates Node/Java/PGS QA aprovados e Secure beta marcado como skipped; permanece draft sem captura física.

## Diagnóstico «Sou passageiro»
O serviço `PgsAutoClickService` já reconhecia a etiqueta no conteúdo de acessibilidade e bloqueava gestos, de propósito: é uma declaração de segurança feita pelo usuário. NÃO implementar clique automático, OCR para contornar avisos de direção, nem alteração das condições do jogo. Na versão anterior, o estado podia parecer silêncio/travamento, não notificava o usuário uma vez, e o `tapFixedTarget` podia retornar sem agendar nova leitura.

## LT351
- Uma função `holdForPassengerPrompt()` centraliza a detecção: mantém status "CONFIRME MANUALMENTE", emite Toast e notificação **uma vez por ocorrência**, sem tocar na caixa.
- Ao desaparecer o alerta, estado muda para "RETOMANDO BUSCA"; loops do feed, modo de ponto fixo e modo Encontro aguardam e retomam de acordo com seus próprios tickets. Ao interromper, sinalizadores são limpos.
- O relógio de carregamento preserva `passengerHoldAt`, compensando o tempo de bloqueio para não esgotar cooldown enquanto a pessoa lê o alerta.
- Se o jogo não expuser o texto no AccessibilityNodeInfo, a detecção não pode ser comprovada por testes de código. Teste físico Samsung e leitura real da tela seguem BLOQUEADOS; o usuário deve confirmar no jogo somente se verdadeiramente passageiro e não estiver dirigindo.
- Contratos `lt343` atualizados para esperar a guarda compartilhada em vez do aviso anterior e novo `lt351` protege a política e as correções LT349.

## Aceite e publicação
Executar Node QA, LT169, Core LT211, Java LT62, OTA LT173, PGS QA Android, Secure beta/R8. Somente com PASS de todos os gates aplicáveis considerar merge; publicar versão monotônica assinada com workflow protegido, sem descartar assets nem preferências, mantendo a PR #385 em rascunho até homologação visual. Não afirmar teleporte, confirmação de passageiro ou interação real no aparelho por CI.
