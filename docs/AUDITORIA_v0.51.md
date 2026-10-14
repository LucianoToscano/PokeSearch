# Auditoria de segurança v0.51-beta
- PS-086: verificação de package, SHA-256 Pix e presença de assinatura implementada; **pendente** comparação com certificado oficial de distribuição. Verificações locais podem ser alteradas por atacante sofisticado.
- PS-087: **pendente** cifragem de assets em build-time e hash de scripts antes da execução. XOR derivado de Pix público não oferece confidencialidade criptográfica.
- PS-088: FLAG_SECURE aplicado ao loginDialog; confirmar comportamento em aparelhos/OAuth externos.
- PS-089: R8/minify/shrink habilitados em release; regras conservadoras preservam métodos bridge e classes de entrada. Não usar -dontwarn ** indiscriminadamente, pois oculta dependências ausentes.
- Testes estáticos acrescentados em overlay-ux.test.js; execução CI e testes físicos pendentes.
- Assinatura: **pendente** keystore release persistente e configuração segura fora do repositório; nenhuma senha deve ser commitada.
- Entrega: **bloqueada** até assembleRelease, apksigner verify, aapt dump badging, inspeção ZIP e testes reais.
- Nenhuma alegação de proteção anti-clonagem forte deve ser feita antes de pinning do certificado.
