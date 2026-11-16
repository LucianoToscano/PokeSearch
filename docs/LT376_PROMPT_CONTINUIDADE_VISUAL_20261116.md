# POKESEARCH — ARK LT376 | Continuidade de homologação física
Partir da última versão oficial LT374 `0.03.68 (54575)` e da candidata PR #454, branch `fix/lt375-pokeball-background-sort-more-ui` (não publicar sem aprovação). Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT375_CORRECOES_VISUAIS_P1_P2_20261116.md`, e o ARK `docs/LT375d_MINIOR_MEDIDAS_DESFOQUE_TUTORIAL_ARK_20261116.md`.

Prioridades:
1. Homologar Minior em pelo menos duas formas e outras espécies, P/M/G, com imagens originais, silhueta proporcional, sem artifícios de sprite falsa; verificar `--tile-alpha-zoom` com e sem geometria exata.
2. Homologar Editor Visual: medidas por tile `34×30` legíveis, medida do painel sem sobreposição, nenhuma faixa preta sobre sprites; indicadores respeitam modo claro/escuro e zoom; desligar os guias continua funcionando.
3. Homologar desfoque: padrão **50% de transparência**, slider de blur em 0, 4, 8 e 16px. Android 11 e aparelhos sem cross-window blur devem informar corretamente e preservar fallback. Em Android 12/13/14 com blur suportado, comparar efeito, performance, toque e se o desfoque afeta a tela toda; evitar efeitos inesperados. Não depender de captura da tela do jogo.
4. Tutorial apenas Pokébola P1/P2: primeiro uso uma vez entre ambas, Pular, replay voluntário, circle/spotlight e dedo alinhados ao PNG visível, long press e ↻. Não iniciar automaticamente nos overlays Busca Pokémon e Doce Raro neste ciclo.
5. Regressão das correções LT375 anteriores: Localização cooldown/km clicável, Favoritos alinhados à barra, alça ⋮⋮ e Reset sem fundo, Background mesmo tamanho, Padrão/Inverso com fundos individuais, ⋯ sem placa, guia roxa sem espaço fantasma, barra independente de resultados.

Executar 7/7 gates no mesmo SHA, compilar APK debug QA, auditar assinatura e não publicar uma versão oficial sem testes concluídos e autorização de release. Registrar screenshots/vídeos físicos anonimizados, divergências e próximo ARK. Nunca alegar caminhada/captura confirmada sem evidência do jogo.
