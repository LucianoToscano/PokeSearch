# LT403 — Auditoria de sprites ausentes na Minha Pokédex (17/11/2026)

> **Encerramento ARK LT403 (17/11/2026):** PR código #520, squash `d6c9a7101a7409bd1819f3c649118ebe51e86630`; PR release #522, squash `d25ad7a22c7dc3052bf117be8088e647caab78b9`. **PokeSearch v0.03.88 LT / versionCode 54595 publicado oficialmente**, workflow protegido [#44158042854](https://github.com/LucianoToscano/PokeSearch/actions/runs/44158042854) completed/success, [APK](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.88-54595/PokeSearch-v0.03.88-LT.apk), SHA-256 `d7ed73e6e85b3e615ca0f25db2fd003abb1fda0df9c58462088b5a1bb91aa621`. Certificado permanente validado pelo CI; QA físico Samsung Android 17 ainda pendente. Ver [ARK oficial](ARK_LT403_SPRITES_RECUPERACAO_OFICIAL_20261117.md) e [LT404](LT404_PROMPT_CONTINUIDADE_APOS_LT403_20261117.md). O texto "aguardando gate" abaixo registra a decisão de publicação na fase da auditoria inicial, antes dos merges.


## Base real e material observado
- `main` e release estável confirmadas antes do patch: **v0.03.87 LT / versionCode 54594** (LT402), não voltar à 0.03.86.
- Revisados: `AGENTS.md`, `docs/GUIA_MESTRE.md`, auditorias LT400/LT401/LT402, política ARK, catálogo/manifesto, WebView Android e testes LT400–LT402.
- Vídeo recebido `Screen_Recording_20261117_152256.mp4` (~46 s, gravado 15:22): grade com losangos em Mewtwo, Zacian, Zamazenta e outras entradas, enquanto Dragonite, Gyarados e parte das formas especiais exibem arte. Não foi gravado um teste Android a partir do código corrigido.
- Referências visuais fornecidas: grade de três colunas e ícones redondos originais; preservar escala, fundo e identidade gráfica.

## Falha comprovada no código
1. `PokeSearchOfflineSprite.resolve()` devolve uma URI `file:///android_asset/pokemon-sprites/base/<dex>.png` para espécies comuns, incluindo `base/150.png`.
2. A árvore real de `app/src/main/assets/pokemon-sprites/` contém apenas `costumes/`, **sem** `base/`. A antiga `safeSprite()` aceitava cegamente a URI inexistente como sprite `offline`.
3. O `<img>` fazia `onerror` diretamente para o losango `◇`, sem tentar a URL exata do catálogo PokeMiners ou uma fonte secundária de espécie-base confirmada.
4. O catálogo em si **encontra** os exemplos `Mewtwo 150/135 -> pm150.icon.png`, `150/133 -> pm150.fA.icon.png`, `Giratina 487/90 -> pm487.fALTERED.icon.png`, `Zacian 888/2577 -> pm888.fHERO.icon.png`, `Zamazenta 889/2579 -> pm889.fHERO.icon.png` e `Landorus 645/144 -> pm645.fINCARNATE.icon.png`. O problema de exibição é distinto da existência da chave.

## Correção aplicada na branch LT403
- `PersonalPokedexActivity.InventoryBridge.hasBundledSprite()` testa a existência real do recurso permitido exclusivamente em `pokemon-sprites/{base,shiny,forms,costumes}/<nome>.png`; não abre arquivos arbitrários nem dados do PGSharp.
- A WebView passa a usar uma URI `file:///android_asset/` somente se o asset existe. Não existe obrigação de baixar imagens GO ao inserir/editar o inventário.
- Para uma chave exata do catálogo, usa a URL imutável da variante correta se não houver cópia local. Em caso de falha de carregamento, tenta alternativas **controladas**, nunca o desenho de outra forma, traje ou Shiny.
- A URL comum do PokeAPI só é considerada para espécie-base sem variação, ou para a forma `NORMAL` explicitamente auditada pelo manifesto (p.ex. Mewtwo Normal); Mewtwo Armored, Giratina Altered e demais formas não recebem genericamente a base.
- A segunda falha termina em placeholder honesto, sem looping e sem inventar imagem.
- `app/tests/lt403-pokedex-sprite-runtime-recovery.test.js`: reproduz o asset-base ausente com o catálogo real e verifica isolamento de Armored/Normal, Giratina, Zacian, Zamazenta, Landorus, forma desconhecida, cache e tentativas sequenciais.

## Limitações
- O catálogo GO tem 3.850 entradas principais e 2.213 legadas, mas **não certifica todos os cruzamentos** espécie/forma/gênero/Shiny/traje; arquivo ausente no catálogo permanece sem arte.
- Não é seguro incluir gratuitamente 6.063 PNGs de terceiros no APK sem permissão. O download/cache privado já existe, depende da autorização e da rede do aparelho.
- A fonte remota pode falhar por conexão/403/404 ou mudança de servidor: testes de Node/Java não garantem carga real no Samsung Android 17.
- Sem teste físico Android, importação real atualizada, restauração integral de notas/fundos, permissão SAF/PGSharp ou captura no Pokémon GO; essas pendências continuam abertas. Nenhuma mutação em outro aplicativo.

## ARK e gates
A versão pública permanece **v0.03.87 LT / 54594** até a PR de código e todos os gates exigidos aprovarem. Não atribuir a esta auditoria uma publicação futura não confirmada. Publicar somente após merge + PR separado de versão monotônica + workflow protegido de assinatura + verificação do asset e hash. Atualizar este registro, AGENTS.md e Guia Mestre com evidências verificadas ao concluir.
