# ARK LT401 — Recuperação das sprites da Pokédex · v0.03.86 LT OFICIAL

**Data:** 17/11/2026 · Base: v0.03.85 LT / versionCode 54592.
**Publicação:** PokeSearch **v0.03.86 LT**, versionCode **54593**, label **51401**.
**Release:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.86-54593
**APK oficial:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.86-54593/PokeSearch-v0.03.86-LT.apk

## Evidência de publicação protegida
- Release GitHub pública `draft=false`, `prerelease=false`, publicada 2026-11-17T15:04:45Z.
- Asset GitHub `PokeSearch-v0.03.86-LT.apk`, `state=uploaded`, tamanho exato **61.740.911 bytes**.
- Digest SHA-256 informado pela API GitHub: `7e3a275903fba7be189b8fa68f8ff4c69bf3b40374133d1fb48d572e9b863b76`.
- Assinatura permanente esperada e verificada pelo workflow protegido (certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`).
- Workflow oficial https://github.com/LucianoToscano/PokeSearch/actions/runs/44109518350 — **completed/success** no commit `7ad87d204b0bb428940f9736360bb9b566d96de5`, etapas de compilação assinada, validação e release pública aprovadas.
- PR de correção #515 https://github.com/LucianoToscano/PokeSearch/pull/515, squash `a46b6df8758f7e2c654a48d1e896514fb0a00799`.
- PR versionamento #516 https://github.com/LucianoToscano/PokeSearch/pull/516, squash `7ad87d204b0bb428940f9736360bb9b566d96de5`.

## Causa raiz e correção
Após LT400, imagens da Minha Pokédex apareciam como losangos (especialmente Mewtwo, Giratina, Zacian, Zamazenta, Landorus). O `PGSStats.json` frequentemente contém `pokemonDisplay.form` numérico sem o campo `formName`; a classificação da LT400 ignorava o ID quando não havia texto, tratava o Pokémon como base e recusava o fallback offline quando seu formId positivo não estava marcado como default. Além de ocultar sprites, podia propor baixar arte de forma errada.

1. `pokedex_sprite_catalog.js`: o ID numérico positivo é o referencial principal; `formName` torna-se complementar. IDs desconhecidos não viram forma base por suposição.
2. `personal_pokedex.js`: deriva o nome de forma do catálogo e preserva o ID original; reutiliza imagem offline já empacotada somente quando a forma numérica `NORMAL` coincide exatamente com a base verificada.
3. `pokedex_sprite_delivery.js`: gera URLs HTTPS apenas para chaves exatas contidas no manifesto de sprites e commit fixo de PokeMiners. As imagens podem ser exibidas sob demanda se ainda não foram baixadas, sem solicitar pacote inteiro nem aumentar APK; arquivos previamente baixados continuam prioritários.
4. WebView permite PNG da origem fixa `raw.githubusercontent.com/PokeMiners/pogo_assets/db10df75d6f6f92018d9786af0aecc238fecc4ef/Images/Pokemon%20-%20256x256/`, além das origens PokeAPI previamente permitidas. Não envia PGSStats, IVs, ID de conta, nome de treinador ou credenciais.
5. Teste `app/tests/lt401-sprite-form-fallback-regression.test.js` cobre Mewtwo Armored #150/id133 e Normal id135, Giratina Altered #487/id90, Zacian Hero #888/id2577, Zamazenta Hero #889/id2579, Landorus Incarnate #645/id144, Latias Normal e Magikarp Normal, Shiny, desconhecidos e path traversal.

## Gates aprovados
Na PR de código #515: Node QA, FastDev smoke, LT169, LT211, LT62 Java, LT173 OTA e Secure beta APK/R8 **success**. Na PR de versão #516: preflight oficial, Node, FastDev smoke, LT169, LT211, LT62, LT173 e Secure beta/R8 **success**. Builds skipped não são contados como aprovados. Workflow oficial final construiu e confirmou o APK público.

## Limitações conhecidas e próximos testes
- Sem instalação e homologação física no Samsung SM-S928B Android 17; as screenshots enviadas pelo usuário são evidência da falha, não de correção no aparelho.
- Formas não instaladas localmente precisam de internet para mostrar a imagem remota; para uso offline, permanece a opção de download privado da coleção. Sem fallback para imagem de forma errada.
- A origem PokeMiners e quaisquer sprites são recursos de terceiros: as imagens não são incorporadas ao APK nem o projeto reivindica direito de redistribuição. Metadados e links versionados somente.
- A correção é sistêmica para `formId` numérico; não afirma que os milhares de sprites do catálogo estão todos disponíveis ou testados fisicamente.
- O trabalho separado de sincronização automática do PGSStats via Android SAF está na branch de desenvolvimento `feat/lt401-pgsstats-live-sync-local-exclusions`; **não foi incluído** na v0.03.86. Precisa reaplicar sobre a base pública atual e validar com CI e aparelho.
- Preservados ícones Home/P1/P2, assinaturas, fundos, filtros, inventário privado, notas, históricos e buscas. Sem comércio/trocas/leilões.

## ARK para LT402
Prioridade: testes físicos do hotfix, auditoria de imagens ausentes por inventário e rede, preservação de cache, seguido da integração isolada da sincronização SAF sem regressão de sprites. Exigir CI completo, versionCode monotônico, assinatura permanente, verificação de hash/asset e registros no Guia Mestre.
