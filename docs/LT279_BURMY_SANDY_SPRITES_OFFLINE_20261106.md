# PokeSearch LT279 — Burmy (Manto Areia) e Wormadam com sprites offline

## Evidência Samsung em 06/11/2026
Screenshot enviada pelo usuário mostra `Burmy`, `#412`, forma `Sandy` e IV `0/15/15`. O espaço da imagem exibe somente **BU**, a forma aparece como texto **Sandy**, a lista lateral também não desenha o Pokémon e os cinco cartões de avaliação mostram `—`.

## Diagnóstico confirmado em código
1. `sprite_offline.js` indexa arquivos GO exatos `pm412.fBURMY_SANDY.icon.png` e Shiny por nome `BURMYSANDY`, mas recebe do provedor `SANDY` sem alias da espécie; com isso não identifica a imagem.
2. A lista `BUNDLED_GO_COSTUME_FILES` não possuía arquivos Burmy/Wormadam, portanto o APK não garantia a imagem offline. Uma tentativa remota podia falhar no WebView.
3. O `go-exact-sprites.tsv` já tinha os nomes e hashes Git blob verificados para todas as três formas de Burmy e Wormadam em normal/Shiny.
4. Os `—` nas bandeiras não constituem, por si, erro visual: são a representação atual de posição de raid/GL/UL/ML/RG **não confirmada**. Não fabricar ranks ou confundir Burmy com Wormadam evoluído.

## Mudanças LT279
- Mapeamento restrito a Pokédex **412 Burmy** e **413 Wormadam** e formas **Plant/Planta**, **Sandy/Areia**, **Trash/Lixo**, normal e Shiny. Nomes são conciliados somente depois de validar espécie e número, evitando troca de sprites entre formas.
- Doze sprites imutáveis do PokeMiners via commit fixo `c2a686eb08ace6e890d8fe3d2134c76988db87b5`, com SHA-1 do Git blob retirado do manifesto já versionado, são empacotados pelo `build_sprite_bundle.py`.
- O resolvedor mostra a imagem **offline exata** antes de uma URL do site potencialmente ausente, em ambos os WebViews; mantém a arte original como fallback verificado.
- Verificação adicional da release exige que os doze PNG estejam dentro do APK assinado; teste `lt279-burmy-wormadam-sandy-offline.test.js` cobre 3×2×2 variações e impede substituição silenciosa por espécie/forma errada.
- Preserva IV, golpes, classificações não confirmadas, cincos atalhos, marcadores de evolução, filtros, duas Pokébolas e sistema de atualizações.

## Validação e publicação oficial LT279
- PR [#272](https://github.com/LucianoToscano/PokeSearch/pull/272) mesclada, pipeline de QA Node/Android/OTA/visual aprovado. Os doze PNG foram exigidos no pacote e conferidos pelos hashes antes da assinatura.
- Release oficial estável [LT279 0.02.79 · versionCode 54483](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.79-54483), publicada em **07/11/2026 às 02:19:27 UTC**, APK `PokeSearch-v0.02.79-LT.apk`, **33.812.508 bytes**, SHA-256 `7dc9c4c3600c52d36ffd49d88798afb6944c529ef79a17c38cb2b78aaaba8795`.
- A existência de sprites não prova o resultado de classificação. A melhoria de Rank Classe para Burmy/Wormadam foi tratada **separadamente na PR #273 / LT280**, sem reaproveitar os rankings de formas com atributos diferentes.
- Pendente validação física no Samsung após instalação P1/P2.
