# ARK LT398 — Pokédex pessoal publicada no PokeSearch oficial
Data: 17/11/2026. Base: versão pública 0.03.82 LT / 54589.

## Publicação confirmada
- Versão: **PokeSearch v0.03.83 LT**, versionCode **54590**, label **51398**.
- Release pública: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.83-54590
- APK oficial: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.83-54590/PokeSearch-v0.03.83-LT.apk
- Tamanho: **61.470.546 bytes**, status uploaded na API GitHub.
- SHA-256 do asset GitHub: **494ebfe66df0373a17f258bc451a5a7435c17f2db355604eaf5257dbbe215a88**.
- Certificado permanente SHA-256: **34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e**.
- Workflow protegido #44068120870: https://github.com/LucianoToscano/PokeSearch/actions/runs/44068120870 — completed/success, no commit **044690f5699781785371c0e8dc51f79c84b304ad**. Etapas Build signed protected release, Validate APK and signer, Release to all app users, Verify public release and hash, Erase private signing material: SUCCESS. Release não-draft e não-prerelease.
- Código PR #506: https://github.com/LucianoToscano/PokeSearch/pull/506 , squash **1ff2b781769c6a07b05a0dbbdfa23f7e67b0c27d**. Versão PR #507: https://github.com/LucianoToscano/PokeSearch/pull/507 , squash **044690f5699781785371c0e8dc51f79c84b304ad**.
- PR experimental LT377 #457 encerrada sem merge por base desatualizada, migrada para LT398.

## Gates
PR código #506 head 0487a8ca561c02bc90213794c10f7f2300833808: Node, LT169, LT211, LT62 Java, LT173 OTA, PGS QA e Secure beta/R8 success. PR versão #507 head 3056e31b7d307a63e8e4331b5363c2561fa4378a: preflight, Node, LT169, LT211, LT62, LT173, Secure beta/R8 success. Trabalhos skipped não são alegados como aprovados. APK público novo compilado, assinado e verificado pelo workflow.

## Funcionalidades
- Ícone Pokédex original mantido no grid Home de 16 módulos; seu clique abre a nova PersonalPokedexActivity, com entrada redundante no menu lateral.
- Importação manual via Android SAF do PGSStats.json (máximo 24MB e 10 mil registros). Dois inventários privados separados, IDs extensos de Pokémon/tags mantidos como strings, sem credenciais, sem envio de coleção, sem guardar JSON bruto.
- Abas Tags, Pokémon e Ovos, grade em 3 colunas, lista e busca, chips Shiny/Sombroso/Purificado/Hundo/Traje/Fundo/Favorito/Mega/Dinamax/Gigamax/Eventos/tags. Ordenação por PC, data, IV, nome, PS e favoritos. Ficha com IVs, movimentos, tamanho/peso, forma, fundo e data; fundos decorativos próprios separados do que foi registrado no jogo.
- Catálogo de metadados offline: 537 golpes pt-BR, 278 fundos, 87 trajes. Sprites via resolvedor já existente; não copiar arte proprietária de terceiros do Fandom. Categorias inspiradas no ZIP de ícones do usuário; arte dos ícones Home preservada.
- Ranking PvP por IV em GL/UL/ML com snapshot PvPoke 19/10/2026; não inventar rank quando espécie/forma não encontra correspondência.

## Teste de dados e limitações
PGSStats de referência: 1.209 entradas (1.198 Pokémon + 11 ovos), 176 Shiny, 114 Pokémon com registro de fundo, 47 com vestimenta, capacidade 1200; reprocessamento com IDs numéricos extensos preservados como texto. JSON privado não foi enviado ao GitHub.

**QA físico não executado:** validar no Samsung SM-S928B Android 17 importação SAF, duas coleções, tags, sprites de variantes, contagem, navegação, ranks, acessibilidade, orientação, modo noturno e atualização por cima do APK anterior. Testes CI não substituem homologação Android. Imagens 3D/VFX e artes de todos os fundos/trajes não foram licenciadas nem reproduzidas. O sistema não sincroniza automaticamente com o jogo e não inclui trocas, vendas ou leilões. O Android exige confirmação de instalação.
