# LT260 — Shellos/Gastrodon, limpar localização → Despawn e Raides visível

Data: 06/11/2026 · Base oficial: LT259 (0.02.59, versionCode 54463).

## Evidências enviadas
- Captura Samsung de Shellos #422, forma East Sea, IV 0/15/12, PC 674: a lista vertical exibia arte ausente e o cartão não mostrava uma sprite de tamanho útil.
- O botão de Raides da LT259 não aparecia em uma captura anterior mesmo com a análise PvP carregada.
- Pedido explícito: quando o usuário **limpar a localização da busca**, substituir automaticamente a ordenação **Distância** por **Despawn** (padrão). As demais opções permanecem intocadas.

## Correções
1. `app/scripts/build_sprite_bundle.py` passa a baixar, validar PNG e checar os SHA-1 Git blob do commit PokeMiners `c2a686...` para oito arquivos **normais/Shiny** Shellos/Gastrodon **East/West Sea**. Os hashes já estavam cadastrados no `go-exact-sprites.tsv` antes da correção; não há substituição por imagem de espécie diferente.
2. `app/src/main/assets/sprite_offline.js` inclui esses nomes na allowlist de artes já empacotadas. Para **East Sea**, prefere o PNG exato incluído no APK em vez de uma imagem remota que pode carregar vazia. A forma **West Sea** continua usando a sprite base offline correta (e mantém o comportamento anterior para URL validada do site). Aplica-se às duas Pokébolas e ao card de detalhes, incluindo Shiny.
3. `.github/workflows/pokesearch-official-release.yml`: a liberação exige todos os oito PNGs de Sea no ZIP do APK final e os quatro costume Halloween anteriores; qualquer falta ou PNG inválido bloqueia a publicação oficial.
4. `OverlayService.java`, `Bridge.setLocation(false,"",0)`: no toque do 🗑 de Localização, caso o sort salvo seja `Distance (nearest)`, troca **imediatamente** por `Despawn (longest)`, remove eventual `clearExtraKeys:sortBy`, persiste em `extraFiltersJson` e segue para a busca geral. A ação repetida quando a localização já está desligada também corrige um sort antigo. Todo outro filtro e preferência são preservados. A migração anterior em reinicialização permanece.
5. `dock.html`: ao sincronizar o estado nativo sem localização, o sort ativo e o rascunho de menu são mostrados como Despawn, sem inconsistência visual.
6. `detail.html`: o botão `🏆 Raides` é exibido imediatamente ao abrir o cartão, **mesmo sem rank PvP**; quando o módulo externo falhar, permanece visível com status `Módulo PvE indisponível nesta instalação`. Tenta de novo se o card for redesenhado e o botão estiver oculto, sem gerar rank inventado.

## Testes e limitações
- `app/tests/lt260-shellos-location-sort-raid.test.js`: oito imagens com SHA imutável, normal/Shiny, East/West, prioridades de fonte, bloqueio de release, código nativo de persistência, fallback de Raides.
- `app/tests/lt161-shellos-gastrodon-west-sea-sprites.test.js`: regressão histórica aprovada no harness JS.
- O método Java usa `JSONObject` já adotado pelo código nativo; a compilação Android/Node e o workflow oficial devem testar o código depois do merge.
- **Não confundir** testes de navegador com o dispositivo Samsung. Ainda falta comprovar que a nova versão é instalada e que a sprite é exibida no aparelho P1/P2 em P/M/G.
- **QA concluído:** sete gates CI verdes no commit `b0c40a0b477cff4e0dadb66afd4074d1126c8de0` ([PR #240](https://github.com/LucianoToscano/PokeSearch/pull/240)), após duas regressões antigas ajustadas com testes mantidos. Merge `de9e2ab7923234463deff40a9d59ec34ac8ea08f`.
- **Build/assinatura/publicação concluídos:** [workflow oficial #42186211688](https://github.com/LucianoToscano/PokeSearch/actions/runs/42186211688) `preflight=success`, `publish=success`; a validação de conteúdo passou com os oito PNGs Sea e quatro PNGs Halloween dentro do APK, assinatura v2 permanente e versão verificada. [Release LT260 v0.02.60-54464](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.60-54464) `draft=false`, `prerelease=false`, publicada em `2026-11-06T08:17:12Z`. APK público **28.603.424 bytes**, SHA-256 `0aece81de59e6dff0e35faa4a0b8f9ccea84ca2e9dbd26f0bdf1c8649609f3ad`.
- **Pendente físico:** não foi observada instalação no Samsung, nem captura P1/P2 após atualização. Manter LT259 para rollback, caso o visual do Shellos ou o filtro não se comporte como o esperado.
