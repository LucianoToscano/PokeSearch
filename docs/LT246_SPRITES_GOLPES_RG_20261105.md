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
