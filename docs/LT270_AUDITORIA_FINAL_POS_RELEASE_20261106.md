# LT270 — Auditoria final independente pós-release

**Data:** 06 de novembro de 2026. Base: API pública GitHub, commit `main`, PR #258, workflows de CI e release, hashes do APK.

## Publicação verificada
- **Versão**: LT270 `0.02.70`, `versionCode 54474`.
- **Release**: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.70-54474 — publicada `2026-11-06T18:40:49Z`, `draft=false`, `prerelease=false`.
- **APK oficial**: `PokeSearch-v0.02.70-LT.apk`, **33.606.774 bytes**, SHA-256 **`3e883e605061a82e87418952978babf87418b1e5a8355016dfee6f4afa366bab`**, state `uploaded`, sob a assinatura permanente do workflow.
- **Merge**: PR #258, commit `ba2ab97eff6e7ffbc6e56ed003df07a7be454ce7` sem mudança posterior no código da APK.

## Gate por evidência
| Verificação | Workflow | Resultado |
| --- | --- | --- |
| Node completo | #42271364173 | success |
| Node QA | #42271364067 | success |
| Core/Android contracts | #42271364128 | success |
| Compilação Java | #42271364064 | success |
| PvE fonte/esquema | #42271364197 | success |
| OTA | #42271364217 | success |
| WebView real P/M/G | #42271364184 | success |
| Build privado com assinatura isolada | #42271364137 | success |
| Release oficial preflight + publish | #42272288403 | success + success |
| QA assinada da main | #42272288415 | success |

Todos os runs citados referem-se à PR/mesmo código funcional ou à `main` mesclada. O gate visual original #42271091387 também passou; os dois testes históricos LT231/LT247 foram atualizados para reconhecer a nova faixa sem permitir ícones de ataques sem rank de origem. **Não houve redução de cobertura.**

## Mudanças realizadas e verificações funcionais
- Atalhos do cartão agora são cinco superfícies de toque: ícones GL, UL e ML com rank IV independente; emblema RG com posição da espécie; ação ⚔︎ de golpes recomendados.
- A marca ↳ indica somente que a classificação é da evolução, nunca da captura atual; Mega e trajes com `referenceOnly` são excluídos dos atalhos jogáveis, preservando a projeção na análise.
- Seleção de liga **dentro** do explorador Rank Geral troca tabela, forma, posição, cabeçalho e ícone resumido usando o mesmo snapshot. Segunda ação fecha, sem novas janelas.
- CSS em `#rankLine[data-rank-rail="five"]` preserva dimensões P/M/G e contraste, com quatro ícones LT268, sem alterar menus Modos ou duas Pokébolas. Javascript do cálculo antigo segue acessível para contratos de WebView text-only.
- Não houve modificação em dados de PvP/PvE, cálculos IV/PC/PS, catálogo de golpes, sprites, login, favoritos, alertas, raio/localização, OTA e keystore permanente.

## Pendências verdadeiras
- **Samsung físico P1/P2:** abrir os cinco ícones, verificar hitboxes, bordas e nomes no fundo claro/escuro, deslizar e rolar card sem corte, alternar RG GL/UL/ML, expandir/retrair PvP/Raides/Calculadora/Golpes.
- **Instalação e OTA:** conferir update dentro do aplicativo e consentimento Android. Nenhuma execução de CI comprova que o aparelho já recebeu a versão.
- **Drive APK:** os PNGs LT268 podem estar no Drive, mas sincronização da nova APK LT270 com Drive **não foi comprovada**.
- **Performance real:** medir suavidade e memória em Samsung com outras sobreposições, algo que os screenshots Chromium não substituem.

## Rollback e continuação
Permanecem disponíveis LT269 `v0.02.69-54473` e LT268 `v0.02.68-54472`. Próximo chat deve partir do documento `docs/PROMPT_NOVO_CHAT_LT271_20261106.md`, preservando todas as funcionalidades.
