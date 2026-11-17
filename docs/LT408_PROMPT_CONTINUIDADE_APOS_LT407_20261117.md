# POKÉSEARCH — LT408: continuidade após ARK LT407 (somente oficial)

**Base:** PokeSearch **v0.03.92 LT / versionCode 54599 / label 51407**, [release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.92-54599), [APK oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.92-54599/PokeSearch-v0.03.92-LT.apk), SHA-256 `937e2ded83797ae23df195d3435bea0b5400493652053c88ca015427e09acf06`, workflow #44193252703 completed/success.

## Prioridades
1. **Nunca recriar FastDev, variante Android `.preview`, fluxo DEV/Preview, outro APK público ou atualizador paralelo**. Manter único package `com.lucianotoscano.pokesearch` e workflow oficial `pokesearch-official-release.yml`; testes internos de compilação não são distribuídos.
2. Revisar as **42+ releases `fastdev-*` e 15 branches antigas** detectadas; eliminar administrativamente pela interface/API autorizada com privilégio de proprietário, junto do ambiente `fastdev-signing` e dos segredos `POKE_FASTDEV_*` após confirmação de independência da chave oficial. A integração Chat atual não oferece DELETE dessas entidades. Não reescrever história de `main` nem apagar release oficial.
3. No Samsung SM-S928B Android 17, atualizar **sobre** a versão oficial anterior sem desinstalar e validar inventários, P1/P2, Home, login, instalação e atualização oficial. Qualquer app PokeSearch DEV já instalado requer desinstalação pelo usuário no Android; não alterar ou apagar dados da versão oficial.
4. **Regressão Pokédex:** comparar vídeo v0.03.83 e inventário de 1.198 Pokémon com v0.03.92: Mewtwo, Garchomp, Dragonite, Metagross, Hydreigon, Rhyperior, Goodra, Haxorus, Conkeldurr, Giratina, Zacian, Magikarp #129, Ducklett #580, Shiny, trajes, gêneros e formas. Testar WebView, manifesto 3.850+2.213, Wi-Fi/dados móveis/cache. CI aprovado não substitui teste físico.
5. Qualquer código novo deve passar Node/LT169/LT211/LT62/LT173/Android R8, merge e ARK com APK **oficial assinado**, validação pública de SHA e certificado, sem build paralelo. Preservar ícones/identidade, fundos, tags, notas, edições e PGSStats SAF.

**Não afirmar que releases FastDev históricas foram deletadas nem que todas as sprites funcionam sem evidência.**
