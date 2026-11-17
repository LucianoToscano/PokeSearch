# ARK LT402 — Minha Pokédex editável, PGSStats local e sprites

**Data:** 17/11/2026. **Base:** PokeSearch v0.03.86 LT / versionCode 54593. **Versão oficial solicitada:** v0.03.87 LT / versionCode 54594 / label 51402. **Estado da publicação:** em execução no workflow protegido; confirmar resultado final abaixo antes de marcar o ARK como publicado.

## Código integrado

- PR de implementação [#517](https://github.com/LucianoToscano/PokeSearch/pull/517), HEAD `6de3063c48b1a9e58154828eb25aa5eed3ef68c5`, squash `cf675b5199bf0c163c12d0beaeb39df5b2ee1d3b`.
- PR de release [#518](https://github.com/LucianoToscano/PokeSearch/pull/518), HEAD `3a47117002535ae71c25ef25e0c290e523d51c17`, squash `20e6310f1ebec8b0376abbeaa6b135522de3b7b2`.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/PokedexLocalEdits.java`: edição por slot, camada local de mudanças, exclusões reversíveis, recriação manual, tags e replay após reimportar.
- `PersonalPokedexActivity.java`: SAF import/export e vínculo autorizado do `PGSStats.json`, SHA-256 para evitar importações repetidas, sincronização ao abrir e cada 3 minutos **somente com a Pokédex ativa**, histórico de diferenças individuais.
- `personal_pokedex.html/js/lt402.css`: editor de apelido/PC/PS/IV/golpes1–3/favorito/melhor amigo/corações, tags editáveis, seleção longa e operações em lote, menu Gerenciar recolhível, histórico detalhado.
- `app/tests/lt402-inventory-editing-regression.test.js` e atualização de testes legados LT399, para contrato da seleção múltipla.

## Segurança e preservação

Os dois inventários, filtros, fundos, notas, históricos, sprites existentes, visual Home e sobreposições P1/P2 foram mantidos. A extensão edita somente registros locais, **não altera Pokémon GO nem PGSharp**. Android moderno impede acesso arbitrário à pasta privada do PGSharp: a sincronização requer um documento local autorizado pelo usuário via SAF e só detecta nova versão do mesmo documento/URI enquanto a Pokédex está ativa. Falha de acesso não elimina as coleções.

A exclusão local tem tombstones e botão de desfazer do **último lote**; faltas em arquivos sucessivos não equivalem a transferências confirmadas no jogo. O backup exportado contém snapshot de Pokémon/tags/ovos; notas privadas e decoração mantidas em armazenamento separado ainda não fazem parte de um backup integral multiplataforma.

## Sprites

A LT401 já havia corrigido a interpretação de IDs numéricos de forma no PGSStats e adicionado PNG exato via HTTPS commit fixo/caches privados. A LT402 fortalece a guarda para que forma numérica desconhecida não seja trocada silenciosamente por imagem base. **Não foi possível garantir que todas as variantes, Shiny, trajes ou fundos têm PNG correspondente**; onde não existir imagem comprovada ou estiver sem rede/cache, o placeholder é preferível a arte errada. Teste físico de espécies com a galeria completa continua necessário.

## Evidências de CI no código aprovado

- Node QA **success** [#44140115309](https://github.com/LucianoToscano/PokeSearch/actions/runs/44140115309).
- LT169 **success** [#44140115397](https://github.com/LucianoToscano/PokeSearch/actions/runs/44140115397).
- LT211 **success** [#44140115334](https://github.com/LucianoToscano/PokeSearch/actions/runs/44140115334).
- LT62 Android Java compile **success** [#44140115240](https://github.com/LucianoToscano/PokeSearch/actions/runs/44140115240).
- LT173 OTA/Android **success** [#44140115238](https://github.com/LucianoToscano/PokeSearch/actions/runs/44140115238).
- FastDev advisory smoke **success** [#44140115262](https://github.com/LucianoToscano/PokeSearch/actions/runs/44140115262) — teste, **não canal de publicação**.
- Secure beta/R8 **success** [#44140115310](https://github.com/LucianoToscano/PokeSearch/actions/runs/44140115310) — assinatura de teste isolada, **não distribuída**.
- PR #518 de pedido de release: Node/LT169/LT211/LT62/LT173/Secure beta e preflight oficial success.
- Workflow oficial protegido [#44141555140](https://github.com/LucianoToscano/PokeSearch/actions/runs/44141555140): **em execução ao redigir**; assinatura permanente exigida `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Completar asset/digest/estado após o run.

## Homologação física não realizada

Samsung SM-S928B Android 17, importação de PGSStats real/atualizado, URI persistível revogado/trocado, menus em tela, imagens Shiny/formas/vestimentas, TalkBack e atualização por cima do APK anterior ainda precisam ser testados no aparelho. CI Java/Node/R8 não equivale a instalação/aparência física. Android exige confirmação do usuário para instalação. Nenhum arquivo de conta do usuário foi enviado ao GitHub.

## Próxima continuidade

Ler [LT403](LT403_PROMPT_CONTINUIDADE_APOS_LT402_20261117.md). Executar QA físico, verificar lacunas de sprites e backup integral sem modificar o jogo, preservar a versão pública oficial e seguir a política de ARK.
