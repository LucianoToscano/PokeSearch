# PokeSearch LT276 — seletor de liga dentro do Rank Classe (06/11/2026)

## Origem
Print real do Samsung mostra o Pokémon **Grimer (10/15/14)** no painel Rank Classe, com lista de 4.096 IVs restrita à Grande Liga. Pedido: escolher GL, UL ou ML **dentro do painel aberto pelo toque em IV** sem retornar ao cartão.

## Implementação
- `pvp_rank_explorer.js`: o mesmo seletor interno, por botões WebView, usado no Rank Geral aparece agora no **Rank Classe**. `switchClassLeague()` mantém espécie/forma e IV e recalcula os 4.096 resultados da liga solicitada usando o Game Master local `getIvRows` (limites PC 1500/2500/sem limite, nível até 50). Não reaproveitar classificação de outra liga.
- Ao trocar GL/UL/ML, o painel mantém o próprio contexto Rank Classe, recomputa rank/PC/nível/eficiência, limpa comparações e seleção de Top anteriores para evitar equivalência falsa, e reposiciona em `Meu IV`.
- Uma liga sem dados verificáveis fica indisponível em vez de exibir número fabricado. O Rank Geral mantém o próprio seletor e suas fontes PvPoke.
- `detail.html`: IV do cartão abre usando última seleção de liga do Rank Classe no mesmo Pokémon; o seletor retorna ao padrão normal quando o Pokémon capturado muda. Clicar os atalhos GL/UL/ML continua abrindo a liga específica daquele atalho.
- Não alterar cinco bandeiras/ranks, marcador de evolução LT275, golpes, raides, duas Pokébolas, filtros, fontes do PvP, OTA ou dados de usuário.

## QA
- Contrato `lt276-rank-class-league-picker.test.js` usa Grimer 10/15/14 e valida rankings locais completos de GL/UL/ML sem alegar que CP sempre muda (espécies de PC baixo podem atingir o mesmo PC nas três ligas).
- Gate `lt253-visual-screenshots.cjs` passa a abrir o Rank Classe via **IV real do cartão**, selecionar Ultra Liga e Liga Mestra por toque e verificar o rank do IV capturado com o snapshot local em P/M/G. Reabre o IV para validar que a seleção foi preservada.
- Assinatura, revisão Node/Java/OTA/PvE e screenshots somente com CI do commit exato. Samsung físico P1 e P2 ainda precisam de confirmação pós-instalação.
- Base da implementação: LT275 estável `v0.02.75-54479`; versão candidata LT276 `0.02.76 / 54480`; publicação só após CI/merge e workflow oficial.
