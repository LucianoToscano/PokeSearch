# PokeSearch ARK LT361 — continuar suporte multicliente Pokemod/PGSharp após LT360

## Estado oficial verificado em 15/11/2026 — revalidar ao retomar
PokeSearch **0.03.56 / versionCode 54563 / label 51360**, [release estável](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.56-54563), [APK](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.56-54563/PokeSearch-v0.03.56-LT.apk), **61.138.479 bytes**, SHA-256 `9e3edf78a86b0d4f8a062ac58ced4181a16cee042eb868cc0b855c1d3d1969f9`. [Workflow #43685068118](https://github.com/LucianoToscano/PokeSearch/actions/runs/43685068118) preflight e publish **success**, signer permanente, R8, assets, APK e digest verificados. PR #413 scanner por lateral squash `cee03c252a76e98cb47a4f72df860f5275dcae80`, sete gates; PR #415 Galaxy Store squash `a6b042de02ff8acd9dce9f0007a3e18d6e89eac9`, sete gates; PR #414 release squash `43821e81938b498c595a84d865953f1e63167df9`. Reconsultar `main`, `releases/latest`, certificado e PRs antes de alterar/pedir próximo versionCode (>54563). **Sem QA físico** do Pokemod nem de reconhecimento ou teleporte; lista circular apenas evidência visual.

**LT360** auditou novamente o APK Pokemod 14.2.1 enviado, SHA-256 `a671a80e9454882bc456ed9d857bb6be2e0c220c34c43c119d6b98bd256851f1`, e três screenshots do usuário. Capturas mostram uma lista circular de Pokémon na **lateral esquerda**, não uma feed Quick Sniper do PGSharp. Uma imagem é recorte/ampliação e outra foi fotografada: não usar as dimensões como px exatos do aparelho nem afirmar resultado de toque/teleporte. O APK continua sendo **gerenciador/injetor** (não um catálogo de sprites por espécie), com 411 PNG UI, 23 OGG, 2 DEX, 9 libs .so e `assets/pokemod-injector` ELF arm64 de 23.746.440 bytes; nenhum componente foi executado/copied. Modelos nativos do feed permanecem `entries: []` sem direitos verificados.

## Ler antes de codificar
- `AGENTS.md`
- `docs/GUIA_MESTRE.md`
- `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`
- `docs/LT357_AUDITORIA_PROFUNDA_PGSHARP_20261115.md`
- `docs/LT358_AUDITORIA_AVANCADA_PGSHARP_20261115.md`
- `docs/LT359_AUDITORIA_POKEMOD_MULTICLIENTE_20261115.md`
- `docs/LT360_AUDITORIA_POKEMOD_LISTA_LATERAL_20261115.md`
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/PgsAutoScanRegionPolicy.java`
- `app/tests/PgsAutoScanRegionPolicyTest.java`

## Continuar
1. Não requerer PGSharp e Pokemod simultaneamente. Cada usuário seleciona exatamente um cliente, e PokeSearch guarda amostras **separadas por perfil**. `other` apenas prévia até homologar cliente específico; sem root novo nem `QUERY_ALL_PACKAGES`.
2. Verificar físicamente no Samsung **Pokemod ativo sobre Pokémon GO**, comparando lista esquerda e direita, 1/5/10 espécies, variantes e formas. Confirmar se tocar miniatura abre encontro, opções ou teleporta **antes** de automatizar a ação; nenhum callback Android ou delta RGB comprova teleporte. Círculo de radar inferior é controle, não Pokémon.
3. Medir falsos positivos, escaneamento <=4.500ms, limite 256, CPU/RAM/bateria, imagem dia/noite, densidade, retrato/paisagem, menus pequenos e sobreposição entre bolhas. Ajustar ROI por prova física, **não** pela imagem comprimida. O detector agora usa `PgsAutoScanRegionPolicy`, preservando PGSharp duas bordas e Pokemod um lado selecionável.
4. Evoluir **monitor sem clique** com alertas e deduplicação de espécies favoritas selecionadas, opt-in explícito. Não ler dados privados do Pokemod, APK root, contas ou memória do jogo. Os módulos Pokemod Shiny Scanner/GO Plus/Quests/Magic Bag já existem; PokeSearch deve oferecer filtros, histórico, planejamento, PvP, Reides, Rocket, Power Spots e Quests com dados próprios, sem copiar/duplicar mecanismos internos.
5. Desenvolver catálogo de modelos **licitamente redistribuíveis e verificados no aparelho** por `provedor/versão/dex/forma/variante/escala/lado/hash/direitos`. Futura atualização remota precisa assinatura criptográfica, pinning, antirrollback e revogação. Não utilizar sprites de cartão LT357 como modelos de feed não comprovados.
6. Manter confirmações de segurança `Sou passageiro`, login, avisos de conta sempre manuais. Proteger P1/P2, Rare Candy, Edu, contas, filtros, favoritos, menus compactos, QA Samsung e PR LT350 #385 draft.
7. ARK: concluir no máximo após gates exatos no SHA do PR, merge seguro, versão oficial monotônica superior à release atual pelo **workflow protegido**, APK público com assinatura permanente e SHA-256 verificados e documentação atualizada. Estados separados: COMPROVADO, IMPLEMENTADO, TESTADO, PUBLICADO, BLOQUEADO. O APK não instala sem confirmação humana.

## Referências originais 
`docs/LT360_AUDITORIA_POKEMOD_LISTA_LATERAL_20261115.md`, `docs/LT359_INVENTARIO_TECNICO_POKEMOD_20261115.json` e `https://pokemod.dev/pt` (funcionalidades declaradas pelo fornecedor; não prova de API).

## Achado extra a preservar — Samsung Galaxy Store
`classes.dex` Pokemod 14.2.1 contém `POKEMON_GO_SAMSUNG` e referência `nianticlabs.pokemongo.ares`; a [Galaxy Store](https://galaxystore.samsung.com/detail/com.nianticlabs.pokemongo.ares?langCd=pt) confirma pacote oficial `com.nianticlabs.pokemongo.ares`. `PgsAutoHostPolicy.isGameWindow` deve permitir exclusivamente ele e `com.nianticlabs.pokemongo` sem aceitar o gerenciador Pokemod, prefixos falsos, `QUERY_ALL_PACKAGES` ou root. Testar ambos os builds fisicamente, independente de qual mod está instalado. Não confundir suporte ao identificador com suporte funcional do módulo.
