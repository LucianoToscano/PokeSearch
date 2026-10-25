# PokeSearch LT105 — sprites offline dentro do APK (25/10/2026)

## Origem e backup
- Main de origem: `89b4b25c146af11c331a13ac4aad5d088e92e548` (LT104 QA não sobrescrita).
- Branch de segurança: `backup/lt104-before-bundled-sprite-cache-20261025` — não alterar.
- Branch de trabalho: `feature/lt105-bundled-offline-sprites-20261025`.

## Problema relatado
- Algumas imagens dos Pokémon não aparecem em Resultados, Pokémon/Favoritos e menus, sobretudo na primeira pesquisa, sob rede lenta e quando Android limpa cache.
- Antes, `VerifiedSpriteCache` guardava no máximo cerca de 64–80 PNGs em `cacheDir`, e os arquivos eram obtidos sob demanda da internet; `PokemonPicker` repetia a necessidade de rede.

## Mudança
- Gerador versionado `app/scripts/build_sprite_bundle.py` monta, *durante build de QA*, sprites verificados do projeto público [PokeAPI/sprites](https://github.com/PokeAPI/sprites) para **todos os 1.025 Pokémon do catálogo** (normal e shiny quando a origem oferece).
- Pacote fica em `app/src/main/assets/pokemon-sprites/base/<dex>.png` ou `shiny/<dex>.png`, com `manifest.json` de cobertura, ausências e SHA-256.
- `VerifiedSpriteCache` responde às **URLS exatas de sprites-base PokeAPI** primeiro a partir do APK, e só cai no cache privado ou rede quando o recurso verificado não está empacotado. O mesmo carregador vale para os WebViews de resultados e menus das duas Pokébolas.
- `PokemonPicker` lê **o mesmo arquivo no APK** antes de cache privado ou HTTP; favoritos e busca de Pokémon deixam de depender de downloads no primeiro uso.
- Gerador limita tamanho e dimensões, confere PNG e mantém IDs e tipo normal/shiny; **não atribui uma imagem de espécie diferente, forma ou traje não comprovado**. Formas especiais dependem de fonte oficial compatível. Evitar layout mostrando sprite errado é mais importante do que substituir por outra forma.
- O cache local privado antigo continua como fallback para formas e imagens não incluídas. Não limpar automaticamente preferências, resultados, perfil, filtros, login ou coordenadas.
- **Distribuição:** imagens de Pokémon pertencem a seus titulares; confirmar condições de redistribuição aplicáveis antes de disponibilizar APK amplamente. Fonte de projeto: [PokeAPI Sprites](https://github.com/PokeAPI/sprites).

## Validação e aceite Samsung
1. No modo avião, menus Pokémon/Favoritos e resultados que apresentem URL PokeAPI-base devem exibir as imagens pré-empacotadas.
2. Reiniciar app, alternar as duas Pokébolas e limpar apenas cache Android sem perder os sprites-base.
3. Shiny exibido somente quando o objeto consulta shiny; não mostrar shiny indevidamente.
4. Formas especiais, trajes e imagens fornecidas por terceiros não podem ser trocadas por base se identidade divergir.
5. Limite 10 resultados por Pokébola, despawn e sessão compartilhada seguem intactos.
6. QA Node, compilação Android, R8, assinatura v2 permanente, certificado SHA-256 e APK instalável sobre LT104 devem passar. A aprovação CI não substitui homologação física.
