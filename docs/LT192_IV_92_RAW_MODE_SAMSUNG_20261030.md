# LT192 — Correção da transição IV% → IV personalizado em duas Pokébolas

Data: 30/10/2026. Base pública verificada antes da correção: LT191 `0.01.91 / 54396` (commit APK `c73c5ca0f15728c8896e3da4fcc6d2cce23f556f`).

## Evidências das capturas
- Em modo **IV% 0–92**, um Noibat #714 com IV real **7/15/5 = 60%** é exibido corretamente. Isso não prova a existência de um Noibat **0/15/15 = 67%** no mesmo horário.
- Ao mudar para **IV 0/15/15**, a lista fica sem resultados e surge `IV não comprovado` com `!` no ícone. O IV **7/15/5** não é desconhecido nem inválido: ele apenas **não corresponde ao novo filtro**.
- Os botões de modo e os resultados são janelas Android distintas; manter a independência de posicionamento e a personalização existente, sem mover ou reconfigurar as duas Pokébolas arbitrariamente.

## Correções no código
1. `app/src/main/assets/probe.js`: `collect()` agora informa separadamente a contagem `verifiedNonmatchingIv`, além de `unverifiedIv`. Apenas dados IV verificados entram na primeira contagem; não expor dados da conta.
2. `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java`: após as tentativas de estabilização do DOM, a condição de IV comprovado diferente não exibe mais `IV não comprovado`. Se a lista do novo filtro estiver vazia, mostra **“Nenhum Pokémon com o IV selecionado foi confirmado”**, sem tratar uma lista anterior do site como prova de ausência global. Se existirem resultados confirmados do mesmo filtro, preserva-os e informa divergência.
3. Validação nativa: cartões rejeitados em Raw/IV/IV% distinguem IV de outro filtro (com dados internamente consistentes) de valores IV ausentes/inválidos. Nunca inserir resultados incompatíveis no cache, histórico ou alertas.
4. A paridade é automática porque `SecondaryOverlayService` compartilha a lógica com `OverlayService`, sem misturar `prefs` e `prefs_secondary`. Estado anterior só pode ser usado na sua própria chave de filtro.

## Testes e critérios
- `app/tests/lt192-iv-evidence-mode-transition.test.js` cobre captura de Noibat 7/15/5 (60%), alvo Raw 0/15/15, distinção de dados reais e verificação de ambas Pokébolas.
- Executar toda a suíte Node, OTA e Gradle, inclusive LT188/LT189/LT190/LT191 e testes de modo/site/API.
- **Samsung físico: NÃO EXECUTADO.** Testar IV% 0–92, Raw 0/15/15, Raw 0/13/13, GL/UL, duas Pokébolas, listas vazias reais, alternância repetida, botão coordenadas e drag independente.
- **Servidor PoGoCoordinates autenticado: NÃO VALIDADO** nesta coleta. Não afirmar 100% de correção em ambiente real até observar o comportamento do Samsung.

## Registro de distribuição
- Candidato solicitado: **LT192 / `0.01.92` / `54397`**. Antes de anunciar público: CI/Gradle R8, assinatura permanente, hash, Release/latest, leitura de volta do APK.
- Para Google Drive, publicar somente APK real/ZIP de artifact validado e conferir ID/tamanho. O link legado de APK bruto `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` ainda continha LT187 na última leitura; nunca afirmar que é LT192 sem substituição real.
