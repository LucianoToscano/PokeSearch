# LT108 — Sprite nos cards e forma Furfrou Natural (25/10/2026)

## Checkpoint e backup
- Repositório `LucianoToscano/PokeSearch`, `main` de origem `c9a75ca38021f6cbeb954a7abb6873c5ba4eb928`, contendo a auditoria/API/alertas LT107.
- **Backup imutável**: `backup/lt107-before-detail-sprite-fix-20261025` apontando à main original.
- Branch de correção `fix/lt108-furfrou-card-sprites-20261025`. Não remover as duas Pokébolas, 3 perfis Favoritos, filtros, som de novos/favoritos ou 2.050 PNGs do APK.

## Erros reais e correções
1. `api_result_contract.js:spriteData` retornava `image:""` para `form:"Natural"` de **Furfrou #676**, apesar de ser sua forma-base. Passa a aceitar somente `NATURAL`/`FURFROU_NATURAL` para `pokemon_id=676` e espécie Furfrou. **NÃO** aceitar Dandy, Heart, Pharaoh, Kabuki, demais cortes ou trajes como imagem-base.
2. A lista do `dock.html` e o seletor Pokémon carregavam URL remota de PokeAPI em WebViews, dependendo de interceptação de rede; sprites já empacotados muitas vezes não eram usados como prioridade explícita.
3. O `detail.html` em um **outro WebView** ignorava o pacote local e tentava **somente HTTPS** quando `c.image` existia. Se fosse vazio, o cartão permanecia com ◇. Isso valia para os cards de detalhes das duas Pokébolas.
4. Adicionado `app/src/main/assets/sprite_offline.js` puro, compartilhado por `dock.html` e `detail.html`, com `resolve(card)`. URLs de sprites-base PokeAPI normais/shiny exatos (Dex 1..1025) são convertidos em `file:///android_asset/pokemon-sprites/base/<id>.png` ou `shiny/<id>.png`. Caso Furfrou Natural tenha `image` ausente, seu ID+nome+forma confirmados são usados para o sprite-base exato. O restante permanece URL original/placeholder, sem substituição fictícia.
5. `detail.html` mostra imagem com `onload` e tamanho mínimo >=8px, e usa o mesmo URL exato como contingência quando falhar arquivo local. Preserva a verificação do Pokémon selecionado e proteção contra imagem errada. `dock.html` mantém fallback de rede apenas para a URL exata e impede colunas invisíveis.
6. O carregamento é igual nas duas instâncias do `OverlayService`, sem login extra nem mudança nos filtros. Não ampliar livremente a aceitação de formulários/identidades para outras variantes desconhecidas.

## Validação
- `app/tests/lt108-detail-offline-sprites.test.js`: Furfrou Natural, rejeição de cortes e trajes, sprites normais/shiny, URLs válidas, lista, menus, card e dois WebViews.
- Reexecutar suites completas Node/Java e APK release protegido usando certificado permanente, R8 e código Android crescente `54311`, nome **`0.01.07`** (corrigindo a numeração). Gerar *pré-release QA* não-latest.
- Samsung: abrir Furfrou Natural na busca IV 0% do segundo overlay e verificar sprite à esquerda **e no topo do card**; repetir com IV 100%, Pikachu, Pokémon Shiny; abrir card após atualização sem rede (imagem-base deve vir do APK). Formas especiais sem sprite verificado continuam placeholders.
- Som de novos e favoritos validado pelo usuário na LT107: não alterar canais ou modos. Não reivindicar homologação física dos novos sprites até evidência.
- Preservar os códigos de fonte/assinatura no Guia Mestre, não alterar arquivo do Google Drive/canal oficial sem solicitação.
