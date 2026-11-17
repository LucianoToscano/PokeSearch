# ARK LT405 — Sprites da Minha Pokédex e recuperação de imagens-base

**Data:** 17/11/2026. **Base:** v0.03.89 LT / versionCode 54596. **Versão solicitada:** v0.03.90 LT / code 54597 / label 51405. 

<!-- O resultado do workflow/asset só é incluído após confirmação na API GitHub; não presumir publicação. -->

## Evidências de alteração
- PR código [#527](https://github.com/LucianoToscano/PokeSearch/pull/527), squash `8bfd2980dae82ca7bd3f4dbf235d56995c7da633`.
- Comparação com a versão inicial da Pokédex `v0.03.83-54590`: prioridade posterior às imagens do catálogo remoto GO deixou muitas espécies ordinárias com `◇` em rede/cache não funcional. A pasta `pokemon-sprites/base/` não existe no APK, de modo que URI local previamente escolhida não é recurso utilizável.
- Novo `verifiedOrdinaryArtwork()` no `personal_pokedex.js` usa imagem PokeAPI de alta resolução para espécies-base auditadas, inclusive IDs numéricos NORMAL do PGSStats; arte GO exata permanece fallback. Cache privado verificado continua prioritário. Para formas/trajes/Shiny e dimorfismo feminino, somente imagens exatas podem ser usadas.
- Cadeia de recuperação controlada com HTTPS pinned GO, PokeAPI official-artwork e espelho CDN, PokeAPI sprite legada e espelho CDN. Fallback termina em `◇` somente após fontes permitidas; não inventa identidades.
- Arquivos: `personal_pokedex.js`, teste novo `app/tests/lt405-pokedex-common-artwork-regression.test.js`, atualização do teste LT403 e [auditoria de causa](LT405_AUDITORIA_SPRITES_POKEDEX_REGRESSAO_20261117.md).

## Testes na PR de código
- [Node QA #44172543933](https://github.com/LucianoToscano/PokeSearch/actions/runs/44172543933) success.
- [LT169 #44172544185](https://github.com/LucianoToscano/PokeSearch/actions/runs/44172544185) success.
- [LT211 #44172543973](https://github.com/LucianoToscano/PokeSearch/actions/runs/44172543973) success.
- [LT62 Java #44172544023](https://github.com/LucianoToscano/PokeSearch/actions/runs/44172544023) success.
- [LT173 OTA #44172543976](https://github.com/LucianoToscano/PokeSearch/actions/runs/44172543976) success.
- [Secure beta R8 #44172544082](https://github.com/LucianoToscano/PokeSearch/actions/runs/44172544082) success.
- [FastDev smoke #44172543989](https://github.com/LucianoToscano/PokeSearch/actions/runs/44172543989) success, testes apenas, não canal público.

## Escopo preservado e limitações
Os dois inventários, edição manual de Pokémon (apelido, CP/HP/IV, ataques/segundo carregado, corações/melhor amigo), favoritos, tags, seleção longa e exclusão múltipla reversível, fundos, notas, filtros, PGSStats SAF ao abrir/3m com tela ativa, Home e overlays P1/P2 não foram alterados. Edições afetam somente o PokeSearch, nunca Pokémon GO/PGSharp.

**Não houve homologação física Samsung Android 17 nesta sessão.** URLs HTTPS remotas podem falhar; forma/traje sem imagem exata e sem cache/rede pode continuar indisponível. Não foi incluída ou redistribuída coleção proprietária de sprites no APK. A inspeção de código e os testes não garantem 100% de cobertura ou reprodução visual no aparelho.

## Próxima etapa
[LT406](LT406_PROMPT_CONTINUIDADE_APOS_LT405_20261117.md): homologar sprites comuns/especiais fisicamente e verificar cache, rede, PGSStats e preservação de inventários. Fazer merge/publicação futuros somente com ARK completo e assinatura permanente, nunca FastDev.
