# POKESEARCH — ARK LT402 — Validação de sprites + sincronização da Pokédex

**Base obrigatória:** PokeSearch v0.03.86 LT, versionCode 54593, label 51401, oficial em 17/11/2026.
Release https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.86-54593
APK https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.86-54593/PokeSearch-v0.03.86-LT.apk
Hash SHA-256 `7e3a275903fba7be189b8fa68f8ff4c69bf3b40374133d1fb48d572e9b863b76`
Workflow protegido #44109518350 completed/success; PR #515 código squash a46b6df8758f7e2c654a48d1e896514fb0a00799; PR #516 versão squash 7ad87d204b0bb428940f9736360bb9b566d96de5.

**Leia antes de agir:** AGENTS.md, docs/GUIA_MESTRE.md, docs/ARK_LT401_SPRITES_RECUPERADAS_OFICIAL_20261117.md e docs/LT401_HOTFIX_SPRITES_FALTANTES_AUDITORIA_20261117.md. Usar a base atual main, preservar keystore, Home 16 ícones, overlays P1/P2, fundos, busca e dados privados.

## P0 — Garantir que a correção realmente aparece no aparelho
- Instalar 0.03.86 por cima de 0.03.85 sem desinstalar no Samsung SM-S928B Android 17.
- Importar a exportação PGSStats pela SAF; confirmar comportamento das formas numéricas sem `formName`: Mewtwo Armored e Normal, Giratina Altered/Origin, Zacian/Zamazenta Hero/Crowned, Landorus Incarnate/Therian, Kyurem fusões, Eternatus, Minior, Shiny e trajes.
- Testar com rede disponível e sem rede: local instalado é preferido; variante catalogada não instalada usa URL fixa sob demanda; sem imagem real válida, placeholder legítimo. Nunca mostrar espécie, cor, gênero, traje ou forma errados.
- Testar 1198 Pokémon (ou contagem real da exportação atual), rolagem, 'Mostrar mais', uso de memória, desempenho, cancelamento/retomada dos downloads e cache privado.
- Revisar texto da disponibilidade de sprites no painel para refletir que algumas imagens são exibidas online sob demanda mas não estão baixadas para uso offline.
- Não se limitar a exemplos do print: auditar todas as chaves do manifesto, formas numéricas e variante Shiny, registrando cobertura e inconsistências.

## P0 — Prosseguir sincronização do PGSStats.json
- Reconciliar a branch de trabalho `feat/lt401-pgsstats-live-sync-local-exclusions` com main v0.03.86; evitar sobrescrever o hotfix e não mergear código sem CI/QA.
- Android Storage Access Framework ACTION_OPEN_DOCUMENT; permissão persistente de leitura quando suportada. Vincular um PGSStats por inventário 1 e 2; preservar acesso entre aberturas, detectar documento substituído ou permissão revogada e solicitar nova seleção sem apagar inventário.
- Acompanhar a substituição do arquivo pelo PGSharp em login: hash/digest do conteúdo, checagem periódica enquanto Pokédex aberta e ao retornar para tela. Limitar uso de CPU e leituras, não alegar sincronização em tempo real dentro do jogo.
- Comparar snapshots por ID exato, preservar notas/tags manuais e histórico, adicionar novos, remover ausentes apenas do inventário atual, e oferecer Ocultar/Restaurar local de forma reversível. Não afirmar que Pokémon ausente foi transferido e não escrever no JSON do PGSharp.
- Isolar as duas coleções; tratar concorrência, UTF-8, erros temporários de escrita, arquivo incompleto, limite de tamanho, SAF negada, mudanças de URI, cancelamento/pausa, reinício e privacidade.

## ARK
Executar Node, LT169, LT211, LT62 Java, LT173 OTA, PGS QA, Secure beta R8; só liberar no canal oficial permanente após gates, nova versão monotônica, assinatura/asset/hash e evidências documentadas; atualizar Guia Mestre, auditoria e prompt sucessor. Não declarar validação física sem testes reais.
