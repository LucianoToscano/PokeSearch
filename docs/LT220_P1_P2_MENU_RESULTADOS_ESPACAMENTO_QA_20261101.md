# LT220 QA — menu e Pokémon sem sobreposições entre P1/P2

**Data:** 01/11/2026. Base LT219 QA (0.02.19 / 54426). Release pública anterior: LT215. Revisão visual baseada nas cinco últimas capturas Samsung.

## Confirmado pelas capturas

- LT219 resolveu o menu vertical numa única coluna de botões compactos.
- Personalização aparece completa, em vez de cortada no rodapé.
- Com menu vertical e Pokémon horizontais, alguns sprites são desenhados atrás/ao lado dos botões: dois overlays nativos estão ocupando a mesma região.
- As duas Pokébolas podem abrir seus menus ao mesmo tempo. Eles são independentes por design, mas precisam evitar se sobrepor quando houver espaço.
- No modo Pokémon horizontal, a grade ainda reserva no máximo **cinco** colunas, mesmo quando há largura física para mais; essa limitação era artificial. **Não diminuir sprites para forçar 10 em uma linha.**

## Alterações técnicas

1. `OverlayPlacementPolicy.java`: geometria pura em pixels físicos. Se um retângulo de menu encontra outro menu ou a janela de resultados, calcula a posição livre mais próxima: direita/esquerda/abaixo/acima. **Nunca altera largura, altura, ícones, sprites, aparência ou permissões**. Se não houver espaço, mantém posição segura dentro da tela.
2. `OverlayService.java`: registra somente as coordenadas atuais das janelas de menu P1/P2 (sem compartilhar resultados, login ou filtros). Limpa os registros ao fechar e destruir o overlay. Ao abrir ou mover, posiciona um menu evitando a janela de Pokémon da mesma conta e o menu da outra Pokébola. Atualiza o cálculo ao mudar largura/altura dos resultados.
3. Resultados horizontais: calcular quantas colunas de sprites no tamanho original realmente cabem na tela, até dez. Remover máximo fixo de cinco. Onde não cabem dez, permitir duas ou mais linhas sem cortes e sem diminuir as imagens.
4. Resultados verticais, menus horizontais, favorito, Editor Visual arrastável, cooldown Doce Raro, chat e demais funções são preservados.
5. Não recolocar uma janela em posição diferente quando ela já está visível e não conflita com os demais elementos. A movimentação manual continua disponível.

## Testes e homologação

- Testes puros Java: `app/tests/OverlayPlacementPolicyTest.java` (sem Android SDK) valida ausência de colisão, telas estreitas, P1/P2 lado a lado e geometria de dois obstáculos.
- Teste Node: `app/tests/lt220-overlay-placement.test.js` verifica integração, persistência e a remoção do limite artificial de cinco colunas.
- Regressões Node, Java, OTA, SDK Android, assinatura v2 e certificados antes de distribuir.
- **Samsung obrigatório:** abrir menu vertical com 10 resultados horizontais, conferir que Pokémon não ficam cobertos; abrir P1 e P2 lado a lado e testar o arraste de ambos; alterar a orientação dos dois sem mudar tamanho de nenhum botão/sprite; abrir Personalização e Editor Visual e testar gestos e cortes.
- Quando o espaço não permitir todas as regiões lado a lado, menus podem ficar acima/abaixo, mas não devem sair da tela. A UI **não garante** uma fila horizontal de dez sprites quando a soma de suas larguras excede o display.

**Versão de QA pretendida:** LT220, 0.02.20, versionCode 54427. Não substituir a LT215 pública antes de validar fisicamente.
