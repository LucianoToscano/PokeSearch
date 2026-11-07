# LT305 — Edu: balão conectado à sprite, sem fundo global, botões soltos
**Origem:** captura real enviada pelo proprietário em 07/11/2026, após a LT305.
**Status:** correção candidata em branch/PR; **não publicada nem homologada no Samsung**.

## Problema observado
A captura mostra que a conversa ainda parecia uma janela grande com um retângulo escuro/translúcido atrás da fala e dos botões. A antiga cauda era um triângulo inferior e não parecia sair do personagem. As respostas visuais pareciam presas à caixa de texto, dificultando reconhecer a diferença entre o que o Edu fala e o que o jogador pode responder.

## Solução implementada em `RaidDayAssistantOverlayService.java`
- A **raiz do painel e o ScrollView agora têm fundo totalmente transparente**, sem borda de vidro/retângulo global. Há apenas elementos individuais onde necessário.
- O **balão branco** concentra a fala, o pequeno nome **Edu**, estado e botão **×**; todos mantêm contraste legível. Sombra e contorno finos; o cabeçalho continua arrastável.
- A cauda passou para a **lateral** do balão e acompanha o lado do avatar. `positionEduSpeechTail()` escolhe esquerda/direita pela posição horizontal da sprite, ajusta a altura aproximada à cabeça e é atualizado ao abrir, mover avatar ou mover painel. A cauda não aponta para os botões.
- Respostas **Sim/Não**, coordenadas e ações de etapa são botões brancos independentes em uma faixa **transparente, com respiro lateral e vertical**, fora do balão. Os controles auxiliares **Voltar/Ajuda** também ficam soltos, em outra linha.
- Preparação da data e configurações acionadas por **segurar a sprite por 1,2 s** mantêm superfícies próprias, claras, em vez de reconstruir o painel escuro. O balão/cabeçalho e o botão de fechar permanecem acessíveis durante esses estados.
- O avatar G=100 px, P/M preservados, posição salva, OCR opt-in e roteiro E01–E11 não foram alterados. Não há teleporte, passes automáticos ou leitura de tela sem consentimento.

## Regressões e limites
- Testes de contrato foram estendidos em `app/tests/lt304-edu-conversation-ui.test.js` para bloquear retorno do fundo global, exigir cauda lateral orientada à sprite, botões independentes e manutenção de cabeçalho/fechar.
- **Pendente**: CI Node, LT169, LT211, LT62 e LT173 sobre o commit final; QA visual Samsung em fundo claro/escuro do Pokémon GO, cauda em ambos lados, arrastar a sprite e o painel, legibilidade com fonte ampliada, coordenadas e clique nos botões.
- **Pendente**: testar sobreposição com as duas Pokébolas e o Doce Raro; consentimento MediaProjection sem a janela visível; retomada do progresso.
- Não afirmar que a captura de tela demonstra o resultado da correção: ela demonstra **a falha anterior**. Apenas um teste novo no aparelho pode validar a aparência final.

## Regra de publicação
LT305 (`0.03.05`, code `54511`) permanece Release pública enquanto não houver autorização para uma atualização posterior, cujo versionCode deverá ser maior que `54511`. Não publicar nem mesclar esta correção sem autorização posterior; preservar pacote e assinatura permanente.
