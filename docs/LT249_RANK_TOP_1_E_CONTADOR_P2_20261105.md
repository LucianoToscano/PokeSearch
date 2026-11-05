# LT249 — Corrigir falso Top #1 e contador 0 desprendido (05/11/2026)

## Evidências do Samsung
- Print 1: ícone da Pokébola 2, sem encontros, com o número `0` flutuando abaixo e dando a impressão de resultados separados do ícone.
- Print 2: Machop 0/15/15 em pesquisa GL Top #1: a faixa exibe `GL · Top #1 · Machop #611`, mas a análise expandida aponta **Machop IV #611 / RG #513, Machoke IV #2 / RG #500, Machamp IV #196 / RG #253**. A classificação Top #1 era apenas o filtro solicitado, e nunca um rank confirmado para o exemplar.

## Alterações
1. `detail.html`: não apresentar o número do filtro Top #N como se fosse ranking. Quando nenhum candidato verifica o limiar solicitado, selecionar a combinação local verificável mais próxima por **menor IV Rank Classe**, desempatando por RG confirmado. A etiqueta compacta fica `GL · IV #2 · ↳ Machoke · RG #500`. `rankLine.dataset.topVerified=false` e tooltip relatam que Top #1 não foi confirmado. Essa regra não insere resultados novos na API nem afirma que o Pokémon corresponde ao filtro remoto. O botão IV leva à tabela dos 4096 spreads e o RG à classificação geral da espécie. Se evolução estiver desligada, mostrar rank real da forma atual, sem inventar Top N.
2. `dock.html`: em janela independente de resultados, se não houver cards, ocultar a legenda de estado `0` / `…` / `!` que flutuava 18px abaixo da Pokébola e não desenhar número `0` nos contadores. O comando nativo de status continua disponível e mensagens de erro são acessíveis nele. Preservar posições manuais, contadores para quantidades positivas e tamanhos P/M/G.
3. `app/tests/lt249-true-pvp-iv-rg-no-false-top-empty-counter.test.js`: teste Machop/Machoke/Machamp, novo critério Top 1 verificado e não verificado, toggle de evoluções, independentemente P1/P2 e sem indicador vazio. Regressão LT164 ajustada para a etiqueta honesta do IV mais próximo.

## QA e release
- Base pública LT248 `0.02.48/versionCode 54452`; candidata LT249 `0.02.49/versionCode 54453/label 51253`.
- Rodar QA Node completo, LT169, QA core, compilação Java, OTA e APK beta privado; mesclar apenas após seis aprovações. Solicitar `release/official-request.json` para publicar APK permanente assinado, validar SHA-256, confirmar `releases/latest` e registrar evidências no Arquivo Mestre.
- **Nenhuma instalação ou inspeção visual física Samsung P1/P2/P/M/G foi feita remotamente; essa etapa continua pendente.**

## Complemento da mesma revisão — faixa de quatro ações e simulador (pedido do usuário)

- Barra compacta definitiva, **sem segunda linha**: `[🔵 GL IV #1] [↳ Evolução] [RG #840] ⚔️`. O bloco `[🔵 GL IV #N]` abre o **explorador de Rank Classe**; `↳ Nome` abre a **Análise PvP já existente**, expandindo-a e focalizando a linha da mesma forma/liga; `RG #N` abre **Rank Geral**; `⚔️/🗡` abre golpes recomendados/estado legado. Não compartilhar o mesmo onClick entre esses controles. O botão `+N` permanece somente quando houver alternativas com rankings verificáveis.
- Destaques automáticos de liga: 🔵 GL, 🟡 UL, 🟣 ML. Fora de buscas PvP, priorizar um IV Classe Top #1 **real** dessas ligas; se não houver, exibir Mega IV #1 **projetada** com o símbolo autêntico já versionado em `mega_evolution_icon.svg`. Não inventar RG nem elegibilidade GBL para Mega. As seções do painel expandido também têm marcadores por liga e Mega, sem nova linha na barra.
- **Calculadora Teddiursa**: o produtor de dados em `dock.html` envia `familyForms` calculado a partir do grafo de evolução confiável e do Game Master local, independentemente do filtro Top/IV ou `includePreviousEvolutions`. A família real contém Teddiursa → Ursaring → Ursaluna, **sem Mega catalogada**. Famílias que têm Mega incluem exclusivamente as espécies Mega documentadas no Game Master.
- **Uso acessível em Android**: painel PC/Nível agora tem setas ‹ › além da lista para trocar a forma, botões −/+ para ajustar o nível em 0,5, slider de nível 1–50, entrada de PC-alvo (10 a 10000) e botão `Calcular nível` (maior nível com PC ≤ alvo). O cálculo usa IVs atuais e estatísticas CPM oficiais do snapshot local, mostra comparação 0/0/0 e 15/15/15, GL/UL; não inventa custos de Doces/Poeira ou nível 51. Sem nenhuma chamada à API para simulação.
- **Testes adicionados**: `app/tests/lt249-four-click-actions-leagues-evolution-cp-family.test.js` cobre destinos separados dos botões, cores GL/UL/ML, símbolo Mega, grafo de evolução, inexistência de Mega Teddiursa e trocas reais do simulador. Ajustadas as regressões LT164/LT243/LT244/LT245/LT247 para o botão unificado IV+Liga, sem suavizar validação de dados.
- O teste físico em Samsung P1/P2 P/M/G continua pendente e não deve ser confundido com a compilação automatizada.
