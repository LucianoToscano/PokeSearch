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

## Validação
Aguardando CI (Node/Android/OTA/visual, PNGs assinados) e teste físico no Samsung. A correção é localizada no *sprite*, não na base PvP. Versão candidata: LT279 `0.02.79 / 54483`, derivada da LT278 `0.02.78 / 54482`.
