# POKESEARCH — LT407, continuidade após ARK LT406 (17/11/2026)

**Base oficial:** PokeSearch v0.03.91 LT / versionCode 54598 / label 51406, [release publicada](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.91-54598) e [APK permanente](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.91-54598/PokeSearch-v0.03.91-LT.apk), hash público `9624f5bc0b0f7a63a9c194aa230390e0f1ba3945e63c3e9b043009c74e8a80a8`, workflow #44189493629 completed/success.

Ler `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/ARK_LT406_SPRITES_CATALOGO_OFICIAL_20261117.md`, `docs/LT406_AUDITORIA_POKEDEX_MANIFESTO_CATALOGO_20261117.md` e auditorias LT398–LT405.

## P0 — homologar sprites antes de afirmar reparo visual
1. Instalar **sobre** a versão anterior em Samsung SM-S928B Android 17, sem desinstalar/apagar armazenamento, abrir Minha Pokédex com os 1.198 registros do proprietário e comparar com vídeo 0.03.83 (onde várias sprites apareciam). Não exigir que o proprietário repita testes sem necessidade.
2. Verificar carregamento real do manifesto `getSpriteManifest()`: `commit` correto de 40 caracteres, contagem de 3.850 sprites GO/2.213 legadas, classificação de formas numéricas presentes, nenhum retorno silencioso `{}` sem diagnóstico; não expor dados privados no log.
3. Testar os nomes/IDs que desapareceram: Mewtwo Normal/Armored, Garchomp, Dragonite, Metagross, Hydreigon, Rhyperior, Goodra Normal/Hisuian, Haxorus, Conkeldurr; Giratina Altered/Origin, Zacian/Zamazenta Hero/Crowned, Landorus, Magikarp #129, Ducklett #580, Shiny, eventos/trajes e sexo diferente. Proibir fallback visual de variante incorreta.
4. Testar Wi-Fi/dados móveis/sem rede e cache privado: carga lazy em 3 colunas, erros HTTPS (403/404/429), comportamento PokeAPI/PokeMiners/jsDelivr, integridade do catálogo e thumbnails. Medir cobertura observada e distinguir arte realmente ausente de falha no carregador. Não prometer 100% apenas com testes JS.
5. Preservar e verificar Inventário 1/2, etiquetas, exclusão/desfazer, edição, filtros, fundos/notas, backup e sincronização `PGSStats.json` SAF (abertura/3m com tela ativa), Home, ícones e overlays P1/P2. Edições são locais ao PokeSearch.

## Regras de entrega
Toda correção futura parte do APK oficial e do `main` vigente. Gates Node/LT169/LT211/LT62/LT173/PGS/Secure beta R8; merge e ARK completo, release oficial apenas pelo workflow protegido, com APK assinado, asset, hash, certificado e documentação auditada. Não usar FastDev como canal público. Não empacotar PNGs de terceiros sem autorização. Nunca confundir CI com teste físico.
