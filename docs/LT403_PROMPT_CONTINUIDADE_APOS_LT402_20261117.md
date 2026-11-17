# POKESEARCH — CONTINUIDADE ARK LT403

**Base prevista:** PokeSearch **v0.03.87 LT / versionCode 54594**, após confirmação da publicação oficial LT402. Se a release ainda não constar pública, **não presumir que foi publicada**; verificar a latest release e resolver o bloqueio antes de iniciar alterações.

Repositório `LucianoToscano/PokeSearch`, branch `main`. Consultar `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT402_AUDITORIA_POKEDEX_EDICAO_SYNC_SPRITES_20261117.md`, registro oficial da LT402 e as verificações do GitHub Actions.

## Missão LT403

1. **Homologação física** da Minha Pokédex no Samsung Android 17: Importar `PGSStats.json` real com 1.200 registros, alternar inventário 1/2, editar apelido/PC/PS/IV/movimentos/segundo ataque, favoritar, melhor amigo/corações, tags e seleção múltipla; conferir reimportação, exclusão em lote, desfazer e limpeza integral sem perda cruzada.
2. **Sprites**: verificar no aparelho normal/Shiny/costumes/formas/gênero e especialmente Mewtwo #150 Armored/Normal, Giratina #487, Zacian #888, Zamazenta #889, Landorus #645, Magikarp #129 e Ducklett #580; inventariar casos sem arte, cache remoto, fallback offline, HTTPS 404/403/429, sem mostrar espécie/forma incorreta. Não incorporar redistribuição de PNGs de terceiros sem autorização.
3. **Sincronização SAF**: testar vínculo persistível e revogação de documento autorizado, reabertura do app, exportação real PGSharp para o mesmo URI, intervalos de 3m *com tela aberta* e troca do documento; ausência de arquivo não pode apagar dados pessoais. Acesso direto à pasta privada PGSharp não pode ser prometido; qualquer automação extra deve respeitar Android/scoped storage e consentimento.
4. **Backup completo**: avaliar exportação/restauração não só dos registros/tags, mas também notas privadas, fundos decorativos e exclusões reversíveis; hoje `Exportar` salva o snapshot de Pokémon/tags/ovos, enquanto notas e decoração vivem em armazenamento privado separado.
5. **Lixeira**: avaliar restaurar lotes anteriores (atualmente `Desfazer` recupera apenas o último lote); tratar mudanças locais/reimportação, listas vazias, IDs repetidos e limites de armazenamento.
6. **Acessibilidade e visual**: conferir grade 3 colunas, cabeçalho, botão Gerenciar recolhível, modal do editor, teclado numérico, 360dp, TalkBack, rolagem e alças de seleção sem colidir com a navegação. Preservar rigorosamente ícones atuais da Home, overlay P1/P2, filtros e perfis.
7. **Política de ARK**: testes completos Node/LT169/LT211/LT62/LT173/Secure beta/R8 antes de merge na `main` e release pública assinada, versão monotônica e SHA/verificação do APK. Não usar FastDev como canal de distribuição. Documentar pendências físicas de modo explícito, não alegar teste do aparelho executado remotamente.

## Condições funcionais permanentes

A Pokédex é um inventário local do PokeSearch. **Não** alterar por conta própria os Pokémon reais, PC, ataques, amizade, apelidos, status, tags ou transferências dentro do Pokémon GO/PGSharp. Uma ausência entre arquivos importados não comprova que um Pokémon foi transferido ou excluído do jogo.

O próximo chat deve ler os artefatos, verificar a versão oficial atual, auditar, corrigir, executar QA, fazer o merge e publicar somente após gates aprovados, e registrar novo ARK com evidências.
