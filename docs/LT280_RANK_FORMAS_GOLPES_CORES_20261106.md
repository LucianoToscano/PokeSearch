# LT280 — Rank Classe de Burmy/Wormadam e cores reais dos golpes

## Evidência visual e escopo
Em telas reais Samsung, Burmy #412 Sandy (0/15/15) apresentava — nas ligas por não conciliar `Sandy` com `Burmy (Sandy)` do PvPoke. Outra captura de Litleo mostrou golpes Brasa / Lança-chamas sem a cor do tipo Fogo. O pedido é corrigir isso sem comprometer sprites da forma exata do PoGoCoordinates ou ranks de formas diferentes.

## Correções
1. Identidade de batalha: no `dock.html`, somente Burmy **Dex #412** e Wormadam **Dex #413** cuja espécie foi validada pela tabela Pokédex recebem mapeamento controlado de Plant/Sandy/Trash (incluindo `BURMY_SANDY`) para `Burmy (Sandy)` / `Wormadam (Sandy)`. O nome exibido, imagem, Shiny, fantasia e forma do provedor ficam intactos. Não usar fallback genérico `Burmy` inexistente no Game Master.
2. Conferência contra a fonte: o mesmo `pvpoke-iv-gamemaster.js` possui as três linhas Burmy com stats 53/83/120, mas Wormadam Trash tem 127/175/155 em contraste com Sandy/Plant 141/180/155. Logo, não agrupar Wormadam por estatística; não usar o ranking de outra forma. Bloquear formas desconhecidas, Galar, Shadow, regional ou espécie/Dex divergente.
3. `pvpEvolutionDetails` comunica `rankSpecies` exclusivamente quando a forma foi encontrada na fonte local. O cartão mantém `name` original e sprite da capa; o botão IV/Rank Classe passa a abrir a tabela dos 4096 IVs da mesma forma verificada, nas três ligas. Rank Geral e Raides continuam independentes e só mostram rank quando a fonte confirma.
4. Golpes: o módulo de tradução `pve_moves_ptbr.js` usa `moves.json` e as traduções PT-BR no mesmo commit imutável WatWowMap já auditado, agora também para descobrir os **18 tipos por move ID**, além de um subconjunto offline explicitamente auditado. `pokemon_card_presentation.js` colore cada golpe separadamente com uma paleta fixa; se o tipo não for confirmado, sem cor e sem palpite por tipo do Pokémon. Ajuste CSS compacto, translúcido e legível no `detail.html`. Os golpes e textos originais não são alterados.
5. Não alterar botões Raides/GL/UL/ML/RG, setas, evolução LT275–LT278, packs GO offline LT279, as duas Pokébolas, filtros, localização, credenciais, respostas da API ou OTA.

## Aceitação
- Teste `lt280-form-rank-move-color.test.js` executa o módulo de rank real com Burmy/Wormadam 3 capas x GL/UL/ML, assegura entrada exata, Dex validado, bloqueio de Shadow e forma desconhecida, stats Wormadam diferenciados, e golpes de cores Fogo/Normal/Inseto/Sombrio.
- Executar suites Node, PvP, Android Java, OTA e screenshots P/M/G da própria WebView; só efetuar merge/release após aprovar.
- Falta teste físico Samsung (renderização e golpe recebido pelo site) após instalar.
- LT279 release oficial prévia: `v0.02.79-54483`. LT280 candidata `0.02.80 / 54484`.
