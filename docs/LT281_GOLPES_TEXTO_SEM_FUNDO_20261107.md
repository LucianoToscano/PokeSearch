# LT281 — Golpes em texto colorido, sem fundo, com separador vertical
Data: 07/11/2026.

## Pedido verificado no Samsung
Captura do usuário mostra Wurmple #265 15/15/15 com `Picada / Insistência` em dois pequenos chips com fundo e contorno. Pedido: apenas letras coloridas pelo tipo do golpe e separador `|`.

## Escopo da implementação
- `pokemon_card_presentation.js`: manter busca de tipo verificado, paleta dos 18 tipos, localização PT-BR, aviso legado e separador HTML `|` em vez de `/`. A fonte textual original da API não é reescrita.
- `detail.html`: remover background/border/padding dos golpes; cor apenas em `color:var(--ps-move-type)`, sem mudança nos cartões de classificação, IV, sprites, ações e localização. Fallback sem módulo também troca ` / ` por ` | `.
- `lt281-moves-text-only.test.js`: valida dados conhecidos e desconhecidos, barra e separador, cores, CSS sem moldura, fallback.
- `release_notes.json`: adiciona apenas LT281.
- `release/official-request.json`: publica 0.02.81/54485 após aprovação e merge via workflow oficial.
- Duas Pokébolas compartilham o mesmo HTML de detalhe; preservar comportamento independente.

## Critérios de publicação
1. CI Node, Java Android, PvP, OTA e visual aprovado antes do merge.
2. Só dizer que o release foi publicado depois da confirmação da release estável, asset `uploaded`, hash SHA-256 e workflow oficial success.
3. Teste físico P1/P2 pós-instalação continua pendente; sucesso de CI não substitui renderização física.
