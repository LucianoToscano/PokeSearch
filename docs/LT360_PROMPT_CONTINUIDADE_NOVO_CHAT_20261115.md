# PokeSearch ARK LT361 — continuar suporte multicliente Pokemod/PGSharp após LT360

## Estado confiável ao iniciar
Reconsultar **na hora** `main`, `releases/latest`, SHA público, certificado e workflows do GitHub, pois este arquivo deve sobreviver a futuras versões. Base oficial verificada antes da LT360: **PokeSearch 0.03.55 / versionCode 54562 / label 51359**, APK [v0.03.55-54562](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.55-54562), SHA-256 `8ff05e65a5e77a3432955e2fb052d3ad679127cfa3767715dbef595919b1f40d`, workflow permanente #43682477988 success, `main` `79821b47c8bfd9578f7766e9d4b7979b61c62b4b`.

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
