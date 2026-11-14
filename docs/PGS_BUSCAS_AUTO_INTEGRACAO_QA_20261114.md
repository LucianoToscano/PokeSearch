# PGS Buscas Auto — integração incremental de QA (14/11/2026)

Origem estudada: `LucianoToscano/PGSharp-Privado`, branch `feature/auto-favoritos-0.7-pokesearch` (SHA `2221bddd`). Arquitetura consultada: `AutoClickService`, `IconDetector`, `TemplateStore`, `MapReadiness`, `ShinyListener`, `PokeSearchCatalog` e `PokeSearchMenus`; no PokeSearch: `OverlayService`, `OverlayQuickMenus`, `RareCandyOverlayService`, `PokemonPicker`, `WatchAlerts`, `PokeSoundLibrary` e `PixSupport`.

## Implementado nesta branch

- Atalho **Buscas Pokémon** da Home LT337 abre painel nativo no APK principal, sem criar outro aplicativo.
- Quatro abas Buscas/Tempo/Alertas/Mais.
- Catálogo offline existente (`pokemon_catalog.json`), filtro por nome ou número, seleção máxima 50, remover, limpar, prioridades por ordem e persistência separada (`pgs_buscas_auto_v1`).
- Configurações persistidas de espera 5s, timeout 60s, revarreduras 60/120s, repetição; preferência de vibração.
- Pix chama `PixSupport.show` sem copiar dados de pagamento.

## Bloqueios deliberados

**Não existe motor de automação ativo nesta branch.** O código auxiliar de origem usa um `AccessibilityService` próprio, screenshots e gestos; transplantá-lo diretamente criaria duplicação de serviço/permissões e poderia clicar incorretamente no jogo. O botão de mão, captura local, cadastro visual, detector, teleporte, revarredura em execução, listener confiável de notificações Shiny, alarmes e relatórios ainda **não foram integrados**. A tela mostra explicitamente a limitação. Nenhum reconhecimento Shiny visual foi alegado.

## QA necessário

Compilar APK de QA, executar regressões, testar catálogo e persistência no Samsung, verificar que os overlays P1/P2/Doce Raro continuam operando e validar permissões. Não fazer merge/publicação oficial sem homologação. Branch baseada na LT337, portanto depende da conclusão da PR #347.
