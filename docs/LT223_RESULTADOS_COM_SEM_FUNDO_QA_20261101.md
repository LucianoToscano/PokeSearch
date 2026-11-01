# LT223 QA — resultados de Pokémon com ou sem fundo individual

**Data:** 01/11/2026. Base: LT222 QA `0.02.22` / `54429`. Próxima QA: LT223 `0.02.23` / `54430`.

## Pedido e referências

As oito imagens mostram o mesmo layout de menu e resultados em quatro combinações: cinco Pokémon na horizontal e na vertical, com uma moldura escura arredondada **em cada sprite** ou sprites soltas sobre fundo transparente. O usuário quer escolher os dois eixos (horizontal/vertical) e a presença do fundo separadamente.

## Implementação

1. Já existem `resultsOrientation` vertical/horizontal, `menuOrientation` vertical/horizontal e tamanhos P/M/G e escala do sprite. **Preservar esses recursos**, a ordem dos resultados, os dez Pokémon, ícones de modo e dados.
2. Nova chave `resultsTileStyle` persistida por Pokébola (P1/P2): `none` (padrão legada, sem fundo e sem borda) / `card` (cada sprite dentro de um quadrado de vidro arredondado, com borda e sombra suaves).
3. Nova `resultsTileTransparency` 0–100% (padrão 40%), **separada** da transparência global `resultsTransparency`. Quando `card`, o tema existente claro/escuro define a cor do fundo. Com 100% de transparência, não há sombra/linha residual. Quando `none`, a pseudo-moldura é desativada inteiramente.
4. Os cartões são desenhados por `spriteStage::before`, sob a sprite original. A moldura quadrada tem largura e altura `--sprite` (a mesma em ambos os eixos, não extrapolando o pitch vertical), `pointer-events:none`, sem entrar no fluxo de layout e sem afetar IV, CP, nome, detalhes, timers, cliques nem a altura da linha.
5. Quando cartões individuais estão habilitados, a área `#shell` não ganha uma segunda faixa preenchida atrás deles. Nos resultados sem cartão, a apresentação anterior permanece idêntica.
6. Editor Visual > Pokémon > **Cores e guias**: seletor “Fundo dos Pokémon: Sem fundo | Com fundo”, seletor de tema Escuro/Claro, controle “Transparência dos cartões” apenas em modo Com fundo e transparência da área preservada.
7. `OverlayService.normalizeVisualPrefs` valida novas propriedades de maneira conservadora. Perfis antigos sem `resultsTileStyle` são interpretados como `none` e preservam o visual anterior; imports JSON inválidos são rejeitados/normalizados.

## Validação

- `app/tests/lt223-result-tiles-background.test.js`: CSS isolado à janela de resultados, sem alterar tamanho das sprites nem captura de toque; opções e preferências nativas válidas; ambas as orientações continuam.
- Gates Node, QA, Java, Android/OTA e APK privado assinado.
- QA Samsung: trocar fundo com o mesmo conjunto de dez resultados; conferir cards **horizontais e verticais**, com temas claro/escuro e 0/40/100% de transparência; garantir sem sobreposição nem cortes, toques continuam abrindo detalhes, sprites continuam intactas.
- Repetir com duas Pokébolas em estilos diferentes para provar isolamento. Confirmar configuração salva após fechar e reiniciar.
- Não publicar no atualizador estável até aprovação física. Última estável atualmente LT215.

## Não é escopo

Não gerar sprites 3D de referência (elas são meramente exemplos visuais). Não alterar a fonte dos Pokémon, APIs, quotas, Shiny, chat, login, cooldown, assinaturas nem atividades de terceiros.
