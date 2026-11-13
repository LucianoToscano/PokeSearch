# LT328 — Auditoria ampliada: formas, vestimentas e sprites GO
**Data:** 11/11/2026  
**Escopo:** PokeSearch, P1/P2, resultados, menus e Rank Geral.

## Fontes efetivamente conferidas

| Fonte | Volume | Tratamento |
| --- | ---: | --- |
| WatWowMap `pogo-data-api` (`forms.json`, main, commit `9272f9e8...`) | 1.506 formas | Fonte de IDs, protos e nomes PT-BR. Mantido o importador pinado para compatibilidade. |
| WatWowMap `costumes.json` | 87 fantasias | Evidência de IDs e rótulos; não é um banco de imagens. |
| PokeAPI `pokemon.csv` (`master`, consultado) | 1.025 espécies + 326 variedades | 317 variedades anteriores já pinadas em arte local normal/Shiny. Nove adicionais não foram automaticamente atribuídas ao GO: oito modos de movimento Koraidon/Miraidon e Zygarde Mega. |
| PokeMiners `pogo_assets` | 3.850 arquivos no diretório de ícones, 1.715 arquivos especiais f/c | Comparado com o antigo manifesto (1.679 especiais) do PokeSearch. |
| PoGoCoordinates `/forms`, `/pokemon/catalog?costumes=true` | Sem contagem externa verificável | Endpoints definidos na integração, mas acesso público remoto não foi possível nesta auditoria; **não declarar sincronização concluída**. O cliente oficial continua com verificação de origem/CORS e validação. |

**Proveniência:** manifesto original `go-exact-sprites.tsv` (commit PokeMiners `c2a686eb08ace6e890d8fe3d2134c76988db87b5`). Novo `go-extra-sprites-lt328.tsv` lista 36 nomes com SHA-1 de blob e commit individual (22 do commit antigo; 14 do commit novo `db10df75d6f6f92018d9786af0aecc238fecc4ef`). Duas imagens antigas `pm25.fPXP_2026` mudaram o SHA no branch atual do PokeMiners: **não foram substituídas**; a versão pinada antiga permanece para evitar trocas silenciosas.

## Cobertura nova

- **35 arquivos extras com identidade verificável** (1 registro inválido excluído): Crobat Halloween 2026, Zubat/Golbat Halloween 2026 e variações femininas, Pikachu aniversário Tailândia 2026 em normal/Shiny e feminino, fantasia combinada com formas de Zigzagoon/Ponyta de Galar, Pumpkaboo/Gourgeist Small/Average/Large/Super com fantasia Fall 2022, e Eevee May 2023.
- O item `pm479.f.s.icon.png` consta na árvore de origem, mas **não indica qual forma** e, por isso, não pode ser ligado com segurança a Rotom ou a qualquer forma. Continua identificado como não mapeável, nunca é convertido em forma genérica.
- Total de nomes especiais com arte indexada: **1.714** (1.679 antigos + 35 extras), incluindo pares normal/Shiny, sexo e composições form+costume. Isso não significa 1.714 espécies diferentes.
- O build assinado baixa e valida os 35 PNGs extras, conferindo PNG/medidas/SHA-1 de blob. A WebView e a cache Android aceitam os dois commits imutáveis, com controle de origem e SHA exato por arquivo.
- Regras de identificação: validar `pokemon_id`/Dex + espécie; utilizar `form_id` e `costume_id` somente se pertencem ao registro da espécie no WatWowMap; verificar conflito com rótulo explícito; admitir rótulos PT-BR validados no mesmo catálogo. Sem ID, permitir somente nome de forma que corresponda a um arquivo indexado. Sem evidência exata, **não usar sprite-base de outra forma, traje, cor ou sexo**.
- Correção crítica: IDs WatWowMap `2641=Pumpkaboo Small`, `2642=Average`, `2645=Gourgeist Small`, `2646=Average`. O fallback de imagem de variedade Average deve corresponder apenas a `2642/2646`; os IDs Small não devem herdar o PNG Average da PokeAPI.
- Catálogo PoGoCoordinates: limite validado do cliente ampliado para até 5.000 formas/2 MiB, sem remover validações de tipo, origem, TTL ou CORS.

## Testes e escopo de certeza

- `app/tests/lt328-form-costume-catalog-audit.test.js`: varre os 1.714 arquivos especiais indexados, os 35 novos, sexo, Shiny, formas compostas, nomes localizados, IDs WWM e políticas de segurança.
- `app/tests/lt77-api-catalog-cache.test.js`: valida importação de 1.506 nomes sem truncamento.
- `app/tests/lt126-chat-wwm-sprites.test.js`: ajusta o ID de Average incorreto.
- `app/tests/lt169-all-go-sprites-api-dom-parity.test.js`: preserva auditoria da base anterior.
- A fonte PokeMiners também oferece imagens-base de Pokémon não presentes no índice de fantasias, e a PokeAPI oferece 1.025 sprites-base e 317 variedades pinadas. **Uma forma no catálogo não implica automaticamente uma imagem distinta**: muitos registros são `NORMAL`, cosméticos sem sprite separado, rótulos de evento ou formas ainda sem arte verificável.
- Não há garantia de 100% de carregamento visual em aparelho somente pela presença de URL/arquivo verificado. Testar WebView Android com internet/desconectada, locale PT-BR, casos de erro, e conferir os hashes efetivos do APK antes de publicação.

## Estado oficial posterior à auditoria (12/11/2026)

- [PR #329](https://github.com/LucianoToscano/PokeSearch/pull/329) integrada por squash `79575b2ba5fe60ded9b18412d73f7d2a13f9b72d`; testes Node, Java/Android, OTA e compilação privada aprovados no processo, conforme PR e [notas da Release `v0.03.27-54533`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.27-54533). Asset oficial de 35.363.403 bytes, SHA-256 `3705e48bbc3d4317c33637c613a5666d0fe550f8ccce48e42010002a52923ce0`; publicado em 11/11/2026. Substituído posteriormente pela LT329 como latest.
- **Permanece pendente:** inspeção física Samsung nas Pokébolas P1/P2 e carregamento real da WebView online/offline. Validação da origem de 35 sprites não equivale a cobertura visual total. Não alegar que os catálogos externos PoGoCoordinates foram integralmente sincronizados sem conexão autenticada e verificação atual.

