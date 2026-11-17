# ARK LT403 — Recuperação de sprites na Minha Pokédex e release oficial

**Data:** 17/11/2026. **Base anterior:** v0.03.87 LT / versionCode 54594. **Versão solicitada:** v0.03.88 LT / 54595 / label 51403.

**Estado da publicação: PUBLICADA E VERIFICADA.** [Release estável v0.03.88-54595](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.88-54595) publicada em **17/11/2026 às 19:27:02 UTC** (16h27 BRT), draft=false e prerelease=false. [APK oficial permanente](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.88-54595/PokeSearch-v0.03.88-LT.apk) `PokeSearch-v0.03.88-LT.apk`, asset `uploaded`, **61.747.738 bytes**, digest SHA-256 informado e verificado pelo workflow/GitHub: `d7ed73e6e85b3e615ca0f25db2fd003abb1fda0df9c58462088b5a1bb91aa621`.

**Workflow oficial protegido [#44158042854](https://github.com/LucianoToscano/PokeSearch/actions/runs/44158042854): completed/success**, HEAD `d25ad7a22c7dc3052bf117be8088e647caab78b9`. Gates: preflight, Node/OTA, geração de assets, Android R8, **certificado permanente conferido no CI** (SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`), upload, release pública, verificação de hash/asset e limpeza de segredo: success. **O hash público foi consultado da API GitHub e validado pelo workflow; não se alega recálculo independente dos bytes baixados ou instalação em Samsung nesta sessão.** A release v0.03.87 foi preservada.

## Código integrado
- Implementação: PR [#520](https://github.com/LucianoToscano/PokeSearch/pull/520), squash `d6c9a7101a7409bd1819f3c649118ebe51e86630`.
- Pedido da versão: PR [#522](https://github.com/LucianoToscano/PokeSearch/pull/522), squash `d25ad7a22c7dc3052bf117be8088e647caab78b9`, altera `release/official-request.json` e `app/src/main/assets/release_notes.json`.
- `personal_pokedex.js`: não confia em `file:///android_asset/` sem verificar arquivo; usa sprite exata do catálogo ou fallback auditado de forma-base e percorre tentativas de recuperação controladas na ocorrência de erro do `<img>`.
- `PersonalPokedexActivity.java`: ponte JavaScript `hasBundledSprite()` para testar a presença local de PNG somente em diretórios do pacote pré-autorizados; sem acesso arbitrário a outro aplicativo.
- `app/tests/lt403-pokedex-sprite-runtime-recovery.test.js`: mapeamento e fallback de Mewtwo normal/Armored, Giratina, Zacian, Zamazenta, Landorus, URI de cache, forma numérica desconhecida e cadeia limitada de tentativas. Um erro inicial do próprio harness de teste foi corrigido antes dos gates finais.
- Auditoria de causa: [LT403](LT403_AUDITORIA_CORRECAO_SPRITES_20261117.md). Vídeo de referência enviado pelo proprietário mostrava losangos na grade; o `sprite_offline.js` podia fornecer um caminho `pokemon-sprites/base/<dex>.png`, mas no pacote a pasta `pokemon-sprites/` continha apenas `costumes/`. Antes, um único `onerror` terminava em `◇` em vez de tentar a entrada exata conhecida pelo manifesto.

## Evidências de CI da implementação — PR #520
- Node QA [#44156618512](https://github.com/LucianoToscano/PokeSearch/actions/runs/44156618512): success.
- LT169 [#44156618503](https://github.com/LucianoToscano/PokeSearch/actions/runs/44156618503): success.
- LT211 [#44156618508](https://github.com/LucianoToscano/PokeSearch/actions/runs/44156618508): success.
- LT62 Android Java [#44156618505](https://github.com/LucianoToscano/PokeSearch/actions/runs/44156618505): success.
- LT173 OTA [#44156618606](https://github.com/LucianoToscano/PokeSearch/actions/runs/44156618606): success.
- Secure beta/R8 [#44156618521](https://github.com/LucianoToscano/PokeSearch/actions/runs/44156618521): success.
- FastDev advisory smoke [#44156618504](https://github.com/LucianoToscano/PokeSearch/actions/runs/44156618504): success, **somente CI, não APK público**.

## Evidências de CI do versionamento — PR #522
- Node [#44157455305](https://github.com/LucianoToscano/PokeSearch/actions/runs/44157455305): success.
- LT169 [#44157455155](https://github.com/LucianoToscano/PokeSearch/actions/runs/44157455155): success.
- LT211 [#44157455344](https://github.com/LucianoToscano/PokeSearch/actions/runs/44157455344): success.
- LT62 [#44157455246](https://github.com/LucianoToscano/PokeSearch/actions/runs/44157455246): success.
- LT173 [#44157455436](https://github.com/LucianoToscano/PokeSearch/actions/runs/44157455436): success.
- Secure beta/R8 [#44157455224](https://github.com/LucianoToscano/PokeSearch/actions/runs/44157455224): success.
- Workflow oficial de PR [#44157455350](https://github.com/LucianoToscano/PokeSearch/actions/runs/44157455350): apenas preflight success, publicação skipped (correto para PR).

## Compatibilidade, segurança e limitações
- Não modifica espécie, IV, golpes, apelido, PC, amizade, tags ou inventário real de Pokémon GO ou PGSharp. Os dois inventários do PokeSearch, fundos, notas, filtros, edição de Pokémon, exclusões locais reversíveis, sincronização SAF opt-in, ícones Home e P1/P2 permanecem.
- Sem redistribuição de sprites extraídas de jogos no APK. Dependência de rede/cache para algumas imagens exatas persiste; formas ausentes no catálogo não recebem arte arbitrária.
- **QA físico Samsung SM-S928B Android 17, importação real PGSStats, URL de cada PNG, rede 403/404/429, TalkBack, restauração integral de notas/fundos e update instalado por cima permanecem pendentes.** Não equiparar CI a homologação física.
- Sincronização automática lê documento local com permissão SAF válida na abertura e a cada 3 minutos com Pokédex ativa, não pasta privada PGSharp. Exportação JSON ainda não abrange integralmente notas e fundos decorativos.

## Próxima etapa
[LT404](LT404_PROMPT_CONTINUIDADE_APOS_LT403_20261117.md) para homologação física e auditoria de lacunas restantes. Seguir ARK para qualquer nova atualização, usar apenas canal público oficial e assinatura permanente, nunca FastDev.
