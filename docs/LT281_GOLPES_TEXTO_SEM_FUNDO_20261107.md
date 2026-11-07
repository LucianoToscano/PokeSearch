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

## Publicação oficial e integridade confirmadas
- PR #274: https://github.com/LucianoToscano/PokeSearch/pull/274 ; merge: `5176475bbfb2007555fe5c29f25acbbe7b3a5e05`.
- Todas as verificações da PR, incluindo Node, PvP, Java Android, interface visual P/M/G, OTA e QA de release concluídas com sucesso.
- Workflow oficial https://github.com/LucianoToscano/PokeSearch/actions/runs/42333232466: preflight=success, publish=success; validações automatizadas de assinatura, versionCode e SHA-256 passaram.
- Release estável: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.81-54485 em 07/11/2026 03:19:40 UTC, tag `v0.02.81-54485`, nome `0.02.81`, code `54485`.
- APK: `PokeSearch-v0.02.81-LT.apk`, **33.814.976 bytes**, SHA-256 **`b3ece2180d2795cf8c78d9235213f3f1517f47e9dc76c1b47024304fe5d3d32c`**, asset state `uploaded`.
- **Pendente:** confirmação da nova apresentação dos golpes no Samsung físico e aceitação P1/P2. A publicação não equivale à instalação automática sem autorização do Android.
