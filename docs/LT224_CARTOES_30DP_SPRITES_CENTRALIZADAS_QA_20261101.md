# PokeSearch LT224 — Paridade visual real entre botões do menu e resultados

Data de referência: 01/11/2026. Base LT223 QA (0.02.23 / 54430). Próxima QA: 0.02.24 / 54431.

## Pedido aprovado

Na imagem real da LT223, os quadrados de resultado são maiores que as imagens, que ficam diminutas e desalinhadas, com pouca folga entre molduras. O usuário definiu explicitamente que **cada Pokémon deve ocupar exatamente o mesmo quadrado de um botão do menu: 30×30dp**, com **2dp de espaço** e **sprite proporcional, legível e perfeitamente centralizada, ocupando ~84%**. Isso vale para as quatro combinações: horizontal/vertical × com/sem fundo.

## Causa comprovada na fonte LT223

- O menu usava 30×30dp com gap 2, mas os resultados ainda dependiam de `spriteSize` P/M/G (35–55dp), `rowDp=spriteSize+3`, `--dock=spriteSize+8` e pitch adicional do Editor Visual.
- O `computeResultLayout` podia reduzir as sprites para encaixar dez linhas, enquanto cada espécie usava `--visual-art-fit` (Gengar/Minior menor) e ainda a transformação `--visual-sprite-scale × --ps-alpha-scale`; essas multiplicações produziam imagens muito pequenas dentro do fundo individual.
- O Android calculava a área tocável e as colunas pela largura antiga, diferente da moldura definida por CSS. Somente corrigir a borda não resolve.

## Correção LT224

1. `computeResultLayout` retorna 30dp para cada slot e sprite do overlay de resultados; até 10 slots: altura vertical = 30×N + 2×(N−1). A rolagem interna existente preserva os dez resultados em displays reduzidos.
2. CSS final específico de `body.result-window` define um slot de 30×30dp para ambos os estilos, `gap:2px`, contêiner de sprite centralizado, imagem `25.2×25.2dp` (`84%`), `object-fit:contain` e `transform:none`. Evita a escala composta da LT223. Outros elementos como ícones de modo, menu e a janela de detalhes não são redimensionados.
3. `visual-results-tiles`: moldura também 30×30dp, raio 8dp, mesmo padrão dos botões do menu. Sem fundo: nenhum pseudo-elemento, mesma geometria.
4. `OverlayService.resultWidthDp()` usa 30dp por tile e 2dp entre tiles, preservando a largura opcional da coluna de metadados e reservando pelo menos 38dp para a antiga área do cabeçalho. `updateResultHeaderGrip` centraliza no trilho de 38dp. O cálculo real da janela acompanha a WebView.
5. Não mexe em nomes, quantidade, busca, ordens, IV, ranks, eventos de clique, tamanho da Pokébola ou quantidade de consultas da API. Preferências por Pokébola, fundos claros/escuros e transparência da LT223 continuam válidos.

## Testes e validação física

- Novo teste `app/tests/lt224-result-menu-parity.test.js`: executa o próprio `computeResultLayout` nas quatro combinações (10×30dp + nove gaps = 318dp) e verifica CSS, clique, native hitbox, dimensões e alinhamento.
- Contrato legado `visual-editor.test.js` atualizado para o espaçamento fixo 2dp dos resultados.
- Rodar Node, Java e Android/OTA; gerar APK QA privado assinado v2, comparar certificado e hashes antes de liberar.
- **Samsung:** testar com exatamente 10 Pokémon em vertical e horizontal, com/sem fundo e com tema claro/escuro. Conferir igualdade real dos quadrados 30×30dp com os ícones de menu, sprites próximas a 84% do quadrado, intervalos 2dp, centralização, toque de cada card, nenhum corte, resultados legíveis com metadados opcionais.
- Repetir em P1 e P2, inclusive com menu e resultados em orientações opostas. Se a tela não comportar 10 colunas de 30dp, quebrar linha sem diminuir o cartão.
- **Limitação:** sprites de origem podem ter margens transparentes internas. O app mantém o enquadramento proporcional e não deve cortar a arte para aumentar visualmente uma espécie.

Não publicar via atualizador estável antes de QA física. LT215 continua pública, sem trabalho relacionado ao chat.
