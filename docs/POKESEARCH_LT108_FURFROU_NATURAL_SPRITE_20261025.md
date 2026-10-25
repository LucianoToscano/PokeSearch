# PokeSearch LT108 — Furfrou Natural sprite faltando (25/10/2026)

## Evidência do Samsung
- Na captura enviada, a lista de 0% (0/0/0) mostra **Furfrou #676, forma Natural** e o painel de detalhes mostra o símbolo **◇**, embora outras espécies apresentem sprites.
- O problema não é necessariamente falha de download: no arquivo `api_result_contract.js`, `spriteData(item)` reconhecia apenas NORMAL, DEFAULT ou nome da espécie; para `form: "Natural"` retornava `image: ""`. Com isso, `dock.html` e `detail.html` não criavam imagem, e `VerifiedSpriteCache` nunca podia carregar o sprite #676 já embutido.
- Fonte de nomenclatura da espécie: [Pokémon Pokédex Furfrou](https://www.pokemon.com/uk/pokedex/furfrou), [Pokémon GO Hub Furfrou Natural](https://db.pokemongohub.net/pokemon/676-Natural).

## Backup e escopo
- Main antes do trabalho: `c9a75ca38021f6cbeb954a7abb6873c5ba4eb928`.
- Backup imutável: `backup/lt107-before-furfrou-natural-sprites-20261025`.
- Branch: `fix/lt108-furfrou-natural-sprite-20261025`.
- Não alterar applicationId, três perfis de favoritos, som já confirmado no Samsung, mesma conta nas duas Pokébolas, 2.050 sprites offline, filtros, versão oficial publicada ou sincronização de localização.

## Patch
- `app/src/main/assets/api_result_contract.js`: normalizar texto da forma e criar exceção **só para species FURFROU + pokemon_id 676**:
  `NATURAL`, `NATURALFORM`, `NATURALTRIM`, `FURFROUNATURAL`, `FURFROUNATURALFORM`, `FURFROUNATURALTRIM`.
- Os nomes padrão anteriores continuam aceitos para todas as espécies; outras formas e cortes como Heart, Star, Diamond, Dandy, Matron, Kabuki, Debutante, La Reine e Pharaoh **não** usam o #676 base incorretamente.
- Bloqueio por `costume_id` e `costume` continua. Shiny utiliza `shiny/676.png`; normal utiliza `676.png` da PokeAPI, ambas já no pacote LT105.
- Como os dois WebViews, a lista lateral e o card de detalhes consomem o mesmo `image` JSON, **não** é necessário duplicar dados/imagens ou modificar a interface.
- Testes `app/tests/lt108-furfrou-natural-sprites.test.js` validam Furfrou Natural e Shiny, variantes de grafia, cortes especiais, falso Natural em outra espécie, WebViews, alertas, IV e despawn.

## Versão e QA
- Próxima versão canônica: **0.01.07**, versionCode **54311**, para atualizar por cima da 0.01.06/54310. A LT é o número da etapa (LT108), não o patch da versão; evitar `0.00.108`.
- APK QA não é release estável nem alteração do link de distribuição Google Drive.
- Teste em Samsung: Furfrou Natural na lista lateral, toque para detalhes, sprite-base correspondente; Furfrou Shiny Natural; ambas Pokébolas; cortes especiais mantêm identidade correta; áudio de Favoritos e Novos continua funcionando; cache funciona sem rede para imagens já incluídas.
