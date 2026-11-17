# LT406 — Auditoria de regressão crítica no catálogo de sprites da Minha Pokédex (17/11/2026)

## Evidência de regressão
- O proprietário mostrou que a versão inicial **0.03.83 LT** exibia muitas sprites dos 1.198 registros importados, enquanto versões LT400–LT405 mostravam numerosos losangos; vídeo de 17/11/2026 recebido como evidência. Não afirmar que o vídeo testa o APK LT406.
- Comparação com `v0.03.83-54590`: antes `personal_pokedex.js` delegava o carregamento diretamente a `PokeSearchOfflineSprite.resolve`; depois LT400 passou a exigir correspondência com índice `PokeSearchSpriteCatalog` antes de renderizar várias formas numéricas.

## Causa raiz reproduzida por inspeção de código
- Manifesto `app/src/main/assets/pokedex_sprite_manifest.json`: `commit=db10df75d6f6f92018d9786af0aecc238fecc4ef` (**40 caracteres**), 3.850 PNG GO principais e 2.213 legadas.
- O Java `PokedexSpriteStore.PINNED_COMMIT` estava `db10df75d6f6f92018d9786af0aecc4ef` (**33 caracteres**, truncado) e o JavaScript `pokedex_sprite_delivery.js` usava corretamente o pin completo.
- O construtor Java exige que o `commit` seja exatamente igual; com o pin incorreto a verificação falhava, lançava `IOException`, entrava em `catch`, apagava `catalog` e fixava `manifest={}`. O bridge `getSpriteManifest()` passava `{}` para a WebView.
- Sem `forms` do catálogo, `safeSprite()` retornava vazio quando `p.form>0` e sua forma numérica não aparecia na lista. Isso bloqueava inclusive sprites de espécies comuns (ex.: Mewtwo Normal com `form=135`), independentemente das URLs alternativas acrescentadas na LT405. O cache de imagens do catálogo também ficava inviável quando o índice era zerado.
- Essa falha foi **comprovada no código**, não foi observada em depurador do Samsung. Ainda podem existir causas externas adicionais de falha de rede/404/429.

## Mudança e regressões
- PR [#530](https://github.com/LucianoToscano/PokeSearch/pull/530), squash `3d2b04b371554f4b86f1c368242438cf9bf42d48`: usar o pin completo no Java.
- Novo contrato LT405 exige igualdade entre pin do Java, do JS e do manifesto, SHA de 40 caracteres e manutenção das contagens esperadas.
- Contrato LT400 que fixava o SHA **errado** foi alterado para ler dinamicamente `manifest.commit`. Os primeiros testes LT169/LT211 falharam porque o contrato antigo exigia o erro; o head corrigido `a138527dd4a09569da8a28517ae69b4a231b9326` passou Node QA, LT169, LT211, LT62, LT173 e Secure beta.
- PR versão [#531](https://github.com/LucianoToscano/PokeSearch/pull/531) squash `7ed386c698cf28ff5fb45106edfa8e054563b6c1`, gates aprovados.

## ARK, release e integridade
- **Oficial v0.03.91 LT / versionCode 54598 / label 51406**, [release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.91-54598) publicada em 2026-11-17T22:26:34Z, draft=false e prerelease=false.
- [APK oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.91-54598/PokeSearch-v0.03.91-LT.apk): **61.749.310 bytes**, digest público SHA-256 `9624f5bc0b0f7a63a9c194aa230390e0f1ba3945e63c3e9b043009c74e8a80a8`, asset `uploaded`.
- [Workflow permanente #44189493629](https://github.com/LucianoToscano/PokeSearch/actions/runs/44189493629): `completed/success`; preflight, versão, regressões, recursos, build R8, verificação `apksigner` e SHA256, publicação, asset/digest e limpeza de material privado. Certificado permanente esperado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` comparado pelo workflow. Hash confirmado pelo GitHub e workflow, **não recalculado independentemente de download físico**.
- A tag e a release LT405 não foram substituídas; FastDev não foi usado para distribuição oficial.

## Limites e pendências honestas
- **Sem homologação física pós-LT406 no Samsung SM-S928B Android 17.** Não alegar que as 1.198 sprites funcionam, nem 100% de variantes. Testar em Wi-Fi, dados móveis e sem rede, incluindo Mewtwo Normal/Armored, Giratina Altered/Origin, Zacian/Zamazenta Hero/Crowned, Goodra Hisuian, Shiny, roupas, sexo visualmente distinto, Magikarp #129 e Ducklett #580.
- Imagens GO de terceiros permanecem remotas ou em cache privado sob ação do usuário; nada foi empacotado no APK, nenhuma modificação no Pokémon GO ou na área privada do PGSharp.
- Preservados por escopo de código: Inventário 1/2, edição, exclusão reversível, etiquetas, fundos, notas, sincronização PGSStats por SAF, Home/ícones/P1/P2. Instalação/upgrade e funções físicas não foram testados neste ambiente.
