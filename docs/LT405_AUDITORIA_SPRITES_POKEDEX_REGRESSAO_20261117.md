# LT405 — Auditoria de regressão nas sprites da Minha Pokédex (17/11/2026)

> **Encerramento LT405 (17/11/2026):** PR #527 integrada por squash `8bfd2980dae82ca7bd3f4dbf235d56995c7da633`; versão PR #528 por squash `b277b39c33bc5c7fe077f6a09bda5851df3d8179`. **PokeSearch v0.03.90 LT / 54597 publicado oficialmente** em [release estável](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.90-54597); [APK](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.90-54597/PokeSearch-v0.03.90-LT.apk), SHA-256 público `1dda619d87ee487fa426455829428889e812e2761b05654000c349668159f42a`. [Workflow protegido #44173772883](https://github.com/LucianoToscano/PokeSearch/actions/runs/44173772883) completed/success, assinatura permanente validada no CI. Homologação física Samsung Android 17 permanece pendente. [ARK completo](ARK_LT405_SPRITES_POKEDEX_OFICIAL_20261117.md) e [prompt LT406](LT406_PROMPT_CONTINUIDADE_APOS_LT405_20261117.md).

## Sintoma e evidência
Imagem enviada pelo proprietário: grade da Pokédex com 1.198 Pokémon, poucos desenhos visíveis (Dragonite) e losangos em Mewtwo, Garchomp, Metagross, Hydreigon, Rhyperior, Goodra, Haxorus e Conkeldurr. É evidência visual de falha de carregamento — não prova que os Pokémon desapareceram do inventário.

## Comparação das versões
- Base antiga de referência: `v0.03.83-54590` (LT398). A UI `personal_pokedex.js` delegava a imagem a `PokeSearchOfflineSprite.resolve`, permitindo sprite conhecida por PokeAPI/asset e usando `◇` se a requisição falhasse.
- LT400–403 acrescentaram catálogo exato do Pokémon GO e `pokedex_sprite_delivery.js`. A LT403 corrigiu o problema de caminhos locais inexistentes, mas ainda priorizava URLs PNG do commit PokeMiners e deixava PokeAPI como fallback pixelado no fim da cadeia.
- Confirmado no código: `app/src/main/assets/pokemon-sprites/` só possui `costumes/`; não há `base/<dex>.png` disponível. O manifesto GO tem as sprites `pm150.icon.png`, `pm445.icon.png` etc., mas a presença no catálogo não garante que a rede/carregamento na WebView funcione. O motivo exato de eventuais erros 403/404/429 no aparelho **não foi observado**.
- URLs públicas da PokeAPI com artwork de alta resolução, por exemplo `sprites/pokemon/other/official-artwork/150.png`, são fontes alternativas existentes e não dependem de empacotar cópias no APK. A imagem oficial normal não pode ser substituta de forma alternativa, traje, Shiny ou dimorfismo feminino conhecido.

## Alterações LT405
1. `verifiedOrdinaryArtwork(p,exact)` identifica com metadados verificáveis as espécies de forma ordinária (incluindo numeric form NORMAL de PGSStats); o gênero feminino com diferença visual não utiliza a sprite genérica.
2. No carregamento da Pokédex, cache privado da **sprite exata** mantém prioridade. Um arquivo embutido existente continua válido. Quando não há uma cópia local, espécies-base usam primeiro o artwork PokeAPI em maior resolução. A imagem PNG exata do catálogo Pokémon GO continua no fallback.
3. Fallback limitado por URL: primeiro GO exata, em seguida PokeAPI artwork e espelho jsDelivr, por fim imagem legada PokeAPI e seu espelho. Tudo somente para espécies-base auditadas; Shiny permanece sempre Shiny, e formas/trajes não aceitam imagem base como substituição.
4. Nenhum novo rastreamento, permissão Android ou acesso a arquivos de outro aplicativo; não embute artes de terceiros nem PGSStats no APK; carregamento continua de imagens HTTPS públicas já aceitas pela WebView.

## Testes e restrições
- `app/tests/lt405-pokedex-common-artwork-regression.test.js`: casos Mewtwo normal, Garchomp, Metagross, Hydreigon, Rhyperior, Goodra normal, Haxorus, Conkeldurr, Dragonite; Shiny, Garchomp feminino, Mewtwo Armored, Giratina Altered, Goodra Hisuian, Zacian Hero e formas/trajes desconhecidos. Retém regressão LT403 atualizada para base de alta resolução.
- **Pendência:** imagem física no Samsung Android 17 após instalar a release, rede Wi-Fi e móvel, diferenciação visual Shiny/forma/traje/gênero, HTTP e thumbnails, cachê e consumo de dados. Testes automatizados não são comprovação física.
- Os dois inventários, tags, exclusões reversíveis, edição de Pokémon, notas, fundos, PGSStats SAF e overlays P1/P2 permanecem preservados.

## Política ARK
Não afirmar 100% de cobertura ou publicação antes de Node/LT169/LT211/LT62/LT173/Secure beta R8 aprovados, merge e workflow oficial de assinatura/hashes. A versão oficial anterior v0.03.89 LT (54596) deve ser preservada, e a seguinte é monotônica. Não usar FastDev para distribuir APK.
