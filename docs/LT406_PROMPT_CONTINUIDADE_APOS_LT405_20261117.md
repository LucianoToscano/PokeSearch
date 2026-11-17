# POKESEARCH — LT406, continuidade após LT405

**Base prevista:** PokeSearch v0.03.90 LT / versionCode 54597, **somente após confirmar a release oficial** (não presume publicação antes da verificação). Repositório `LucianoToscano/PokeSearch`, branch `main`.

Ler `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT405_AUDITORIA_SPRITES_POKEDEX_REGRESSAO_20261117.md`, `docs/ARK_LT405_SPRITES_POKEDEX_OFICIAL_20261117.md` e as auditorias LT400–LT404.

## Missão de homologação e correção
1. **Testar fisicamente no Samsung Android 17** a instalação por cima da LT404 e verificar que a nova fonte de artwork restaura sprites de Mewtwo, Garchomp, Dragonite, Metagross, Hydreigon, Rhyperior, Goodra, Haxorus e Conkeldurr nas três colunas da Minha Pokédex. Comparar com imagem de 17/11/2026 mostrando 1.198/1.200 registros e numerosos losangos.
2. Validar imagens corretas por **espécie, forma NORMAL com ID numérico, Shiny, trajes, evento, sexo diferente** e variantes: Mewtwo Armored/Normal, Giratina Altered/Origin, Zacian Hero/Crowned, Zamazenta Hero/Crowned, Landorus Incarnate/Therian, Goodra Hisuian, Magikarp #129 e Ducklett #580. Não exibir sprite-base em variante especial por desconhecimento.
3. Testar Wi-Fi/dados móveis/sem rede, caminhos locais inexistentes, cache privado, URLs PokeAPI e PNGs GO no commit pinned, fallbacks/jsDelivr, carregamento lazy de 96 cards, quantidade de requests, 403/404/429 e acessibilidade. Não distribuir PNGs de terceiros dentro do APK sem autorização.
4. Validar preservação de Inventário 1/2, seleção em lote, edição de apelido/IV/PC/golpes/segundo ataque/corações, favorito, tags, exclusões reversíveis, notas/fundos, backup e sincronização do `PGSStats.json` por SAF com consentimento (abertura e 3m com tela ativa), sem alterar o jogo. Avaliar backup integral de notas/fundos ainda pendente.
5. Seguir o procedimento ARK obrigatório: QA Node/LT169/LT211/LT62/LT173/Secure beta R8 e testes relevantes, merge em main, nova versão monotônica, release apenas pelo workflow protegido, assinatura permanente, APK SHA-256 público, Guia Mestre, auditoria e próximo prompt. Nunca usar FastDev como canal público.

**Limitação:** automação de CI não comprova que o Android apresentou imagens em todas as condições. Faltas reais, inclusive cache/rede, devem ser documentadas com capturas do aparelho, sem prometer cobertura total. A Pokédex é um inventário local: nenhum cadastro/edição altera Pokémon GO ou PGSharp.
