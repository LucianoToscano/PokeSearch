# PokeSearch LT309 — Integração de 62 sprites do Edu (08/11/2026)

## Base verificada
- Base `main` observada: `6c874b5df4dd32965ddeb905fbd5177bb0e272fe` (LT308 oficial 0.03.08/code 54514).
- Proposta de atualização: LT309 0.03.09/code 54515; publicação somente após PR, QA e workflow oficial.
- Atlas 8×8 com 62 células RGBA de 256×256 px, total 2048×2048 px.
- Arquivo `app/src/main/assets/edu_avatar_atlas_62.png`, SHA-256 `0737ac6a7c8e8164c0b702093fa4e0672714d06d5da8668dd467ae610a4ad65f`, 3.035.779 bytes.
- Origem: pacote `Sprites_Treinador_Edu.zip` enviado pelo proprietário e auditado neste chat.

## Alterações
- Novo `EduSpriteAtlas.java`: carregamento local, cache por quadro, sem interpolação; 62 estados e animações indexados, fallback antigo preservado.
- `RaidDayAssistantOverlayService.java`: o Edu apresenta sprite contextual por etapa E01–E11, sem novos botões, sem alterar sequência, relógio nem consentimento do OCR.
- Movimentos: 4 poses à frente, 4 à direita, 4 à esquerda, 10 arrastando, 9 teleporte e 4 com Pokébola. Transições não representam comprovação de localização ou resultado do jogo.
- Emoções e respostas: passe guardado, passe disponível/ausente, vitória, derrota, saída, captura/fuga, carregamento, espera, restrição, evento não iniciado/iniciado e resumo.
- **Evento iniciado independe de Kiribati**: apenas a confirmação contextual no lugar em que o jogador participa exibe a sprite de evento iniciado. Kiribati permanece um passo específico do relato, não é origem obrigatória.
- Tamanho G=100 px inicial, P=50 e M=75 salvos, balão branco e ajustes ocultos no toque prolongado 1,2s preservados.
- O atlas antigo `raid_day_avatar_atlas.png` de 12 quadros permanece como fallback se a imagem nova falhar.
- Reação visual não informa nem confirma concessão de passes, teleporte, conclusão de etapa ou horários oficiais.

## QA
- Teste específico: `app/tests/lt309-edu-sprites-62.test.js`, verifica 62 PNG RGBA, dimensões, SHA-256, sequências, estados, fallback e não alteração de GPS.
- CI obrigatório no SHA exato: Node, LT169, LT211, Java LT62, LT173 e fluxo oficial para compilação/assinatura.
- **Não homologado no Samsung nesta etapa**: verificar P/M/G, quatro tipos de movimento, 10 quadros ao arrastar, 9 de teleporte, toque longo, retorno de tela, relógio D−1/D, OCR e integração sem cortar nas bordas.
- Não alterar P1/P2, Doce Raro, API, favoritos, rankings e consentimento da captura.
