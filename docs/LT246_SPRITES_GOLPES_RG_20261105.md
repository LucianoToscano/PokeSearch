# LT246 — Flabébé offline, golpes PvP e Rank Geral no card (05/11/2026)

## Evidência dos prints recebidos
1. A lista da Pokébola exibe um marcador genérico `#669` onde deveria aparecer Flabébé Vermelha; o card do mesmo Pokémon identifica corretamente a forma `Red`. Este é um defeito de **entrega de sprite exato**, não autorização para trocar pela cor padrão.
2. Rattata 15/15/15 mostra `GL · IV #1 · Atual`, e ao tocar ⚔️ recebe `Ataques Recomendados: indisponíveis` embora a captura mostre `Tackle / Dig`. Não há base para chamar golpes possíveis de conjunto otimizado quando a espécie está ausente do ranking PvPoke.
3. Teddiursa 0/14/14 aparece como `GL · IV #1 · ↳ Ursaluna` embora a análise expandida mostre `Ursaluna GL Rank Geral #163`. Este formato compacto corresponde ao código **pré-LT245**; o código oficial LT245 já promove RG confirmado e possui botão separado de IV, mas o print não comprova a versão instalada no Android.

## Correções
- **Sprites:** arquivos PNG originais de Pokémon GO PokeMiners (`pogo_assets` commit `c2a686eb08ace6e890d8fe3d2134c76988db87b5`) copiados e verificados por Git blob SHA-1. Os 10 arquivos `pm669.f{RED,YELLOW,BLUE,ORANGE,WHITE}[.s].icon.png` foram adicionados em `app/src/main/assets/pokemon-sprites/costumes/` e incluídos no `BUNDLED_GO_COSTUME_FILES` de `sprite_offline.js`. Assim `goExactIcon`, `bundledGoCostumeSource` e `Native.bundledExactSprite` utilizam a variante exata e funcionam offline, inclusive Shiny. Não trocar por outra cor ou forma. Os direitos de Pokémon GO permanecem com seus titulares.
- **Golpes ⚔️:** `pvp_rank_moves.js` agora diferencia três resultados: (a) recomendação PvPoke confirmada na liga; (b) para espécies não classificadas na tabela overall, lista de golpes **possíveis** verificados no Game Master com tradução/tipo em PT-BR somente quando correspondem a IDs confirmados; (c) consulta/fonte indisponível: mostrar **golpes capturados** conhecidos, sem inventar nomes nem recomendação. Elimina cache de falhas HTTP permanente; falha no JSON do ranking não impede ler golpes possíveis no Game Master. O painel é limitado em altura e tem rolagem.
- **RG no card:** código LT245 preservado. Teste regressivo com dados de Teddiursa/Ursaluna GL confirmados no print exige `GL · ↳ Ursaluna`, botão `RG #163` e botão `IV #1`, mais alternativa Ursaring `+1`. Não apresentar RG quando a forma não tem ranking geral confiável. Para ver a faixa correta no telefone é necessário atualizar **APK/asset** para LT245 ou posterior.
- **Duas Pokébolas:** mesmas assets WebView, sem alterar contas, busca, filtros, favoritismo ou coordenadas.

## Testes previstos e publicação
- Base oficial LT245 `0.02.45/54449`; candidata LT246 `0.02.46/54450`, label 51250.
- `app/tests/lt246-flabebe-moves-compact-rg.test.js`: verifica hash Git dos 10 PNGs, identidade de cor/Shiny, fallback sem recomendar movimentos arbitrários, tradução por IDs e JS compilável. LT245 testa exibição independente de RG/IV de Ursaluna.
- Gates: Node geral, core Java, regressões, OTA, beta privado assinado e workflow permanente antes de anunciar publicação.
- **Sem QA manual comprovado no Samsung** (P1/P2, P/M/G). Sem prova da versão instalada no aparelho. Não afirmar cobertura completa de sprites fora das formas verificadas.
- Histórico da publicação será acrescentado aqui somente depois de comprovado.

## Evidências oficiais do merge, testes e assinatura (05/11/2026)

- **PR #222:** [LT246 sprites e golpes](https://github.com/LucianoToscano/PokeSearch/pull/222), mesclada na `main` com commit `036925e426e5f242a85372edb5bb97a7c466329a`. Revisão final aprovada no SHA `58076fb776389a937734c1d3fca817e1ec28a710`.
- **Gates concluídos:** QA core LT211 #41995641773, regressão Node LT169 #41995641753, Node QA #41995641648, Java Android LT62 #41995641585, OTA LT173 #41995641639 e beta privado #41995641750: todos `completed/success`. Testes da LT246 validam os hashes dos 10 PNGs Flabébé, forma/cor/shiny, fontes de golpes e RG separado.
- **Solicitação oficial:** `release/official-request.json` no commit `e448cf9f2304692bbefbd6754907b0260fb67459`, `0.02.46`, `versionCode 54450`, `label 51250`, `previous_tag v0.02.45-54449`.
- **Workflow assinado permanente:** [Actions #41996094113](https://github.com/LucianoToscano/PokeSearch/actions/runs/41996094113), `completed/success`; preflight e publish `success`. `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` concluídos com `success`.
- **Release pública e estável:** [v0.02.46-54450](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.46-54450) publicada em `2026-11-05T08:43:02Z`, `draft=false`, `prerelease=false`, fonte `e448cf9f2304692bbefbd6754907b0260fb67459`, confirmada em `releases/latest`.
- **APK oficial:** [PokeSearch-v0.02.46-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.46-54450/PokeSearch-v0.02.46-LT.apk), **28.362.505 bytes**, SHA-256 `7d8c0fe6dc8e5c3f1b90a62e96217844ca665ba50d1dcb261ec3830ed67a1269`, asset `uploaded`.
- **Artefato assinado no CI:** `PokeSearch-v0.02.46-54450-Signed-Verified` ID `13400237707`, ZIP **26.177.348 bytes**, SHA-256 do ZIP `4dea7a1c2be0cd1af2eb4b097b37e6c746587f8349098a5bd84a768fb45d2e7a` (não confundir com hash do APK).
- **Entrega ao atualizador:** GitHub `releases/latest` expõe a LT246, permitindo a detecção e o download pelo aplicativo compatível. O Android precisa confirmar a instalação. **Não há comprovação de instalação remota no Samsung nem teste físico P1/P2/P/M/G.** O print antigo com GL · IV #1 sem RG continua indício de versão/asset anterior, não prova da LT246 instalada.

Esta seção comprova a publicação e substitui o status "em desenvolvimento" deste relatório. Os direitos dos sprites do Pokémon GO continuam com seus titulares.
