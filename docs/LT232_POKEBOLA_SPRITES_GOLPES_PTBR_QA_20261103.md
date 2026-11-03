# LT232 — Regressão visual Samsung: alinhamento, P/M/G, sprites e golpes PT-BR

Data: 03/11/2026. Base imutável: `245efcd05f8f4a032326230b15b121014013e98b` (LT231 publicada; HEAD posterior apenas documental).

## Evidência da pessoa usuária

Capturas do Samsung após a LT231 revelam: (1) a Pokébola acima da lista mas aproximadamente meia largura de sprite fora do eixo visual; (2) sprites de Rowlet (#722), Froakie (#656) e outras substituídos pelas iniciais `RO`/`FR` na lista, apesar da sprite visível em cards; (3) P e M maiores do que o esperado; (4) painel ⚔️ excessivamente longo, com nomes dos ataques em inglês, indicação técnica redundante e sem cor por tipo.

## Alterações implementadas

1. **Geometria nativa P1/P2:** `ResultsSpacingPolicy.centeredSpriteOffsetDp(dockDp(),resultTileDp())` agora centraliza o primeiro quadrado de sprite sob a Pokébola nativa, preservando os ajustes X/Y do Editor Visual, o limite de tela, as listas horizontal/vertical e preferências de cada Pokébola.
2. **Escala compacta:** mantém os IDs de preferência 35/45/55 do menu e usa tiles físicos internos P=24dp, M=32dp, G=40dp, comparado aos antigos 30/40/50. `OverlayService`, `dock.html` e `visual_editor.js` usam os mesmos números. Espaço de 2dp e arte responsiva de 88% permanecem.
3. **Sprites da lista:** preserva a prioridade do sprite do site para variantes exatas. Após falha ou carregamento travado, a lista tenta primeiro o PNG base/shiny **comprovadamente correspondente** recebido pela bridge Android e, em seguida, sua URL local `file:///android_asset/pokemon-sprites/...`, sem trocar formas, costumes, gênero ou Shiny. Para espécies cuja identidade não está comprovada, mantém o sprite exato do provedor ou fallback neutro. O APK LT231 foi inspecionado: já traz PNG normal e Shiny para Rowlet/Froakie/Shuppet/Snover; a existência de PNG não comprova que toda WebView o carrega.
4. **Golpes PvP ⚔️:** painel minimalista exclusivamente com `Ataques Recomendados:`, `Ágil`, `Carregado 1`, `Carregado 2` e legenda `💠 Ataque Legado` apenas quando aplicável. Removidos título da evolução, ataques atuais duplicados, carimbo de base, inglês e explicações internas. 💠 é menor que o nome e tooltip explica MT Elite confirmada versus legado sem confirmação.
5. **Nomes e cores auditáveis:** rankings/seleção e indicação Elite/legado vêm de PvPoke no commit `e02bde78d19be9b9099b5a6629c6a8d0835a53be`. A correspondência de nomes PT-BR e tipo de golpe vem de `WatWowMap/pogo-data-api`, commit `31a3bcdc2e412f315c4be2bb593807f45cb9bd9b`, paths `data/v1/moves.json` e `data/v1/translations/pt-br/moves.json`. São requisitados **somente quando a pessoa toca ⚔️**, sem cookies ou autenticação. Um nome ou tipo não comprovado é exibido como `—`, nunca uma tradução inventada; conexão indisponível mostra a mensagem breve `Ataques Recomendados: indisponíveis`. Cores de texto usam paleta legível por tipo, sem alterar as informações atuais do Pokémon.

## Verificações locais

- `node app/tests/lt232-compact-sprites-and-moves.test.js` — PASS.
- 214/214 suítes `app/tests/*.test.js` — PASS.
- `ResultsSpacingPolicyTest.java` compilado e executado em JDK 17 (12/12) — PASS.
- `python3 scripts/test_ota_builder.py` — PASS.
- `lt142-source-sprites-align.test.js` e `lt144-all-sprites-native-site.test.js` — PASS (prioridade para costume e sprite exato do site).
- APK LT231 inspecionado como evidência: PNG de espécies problemáticas presente; não inferir que LT232 já foi compilada.

## Regras de publicação e pendências

- **Paridade P1/P2:** `SecondaryOverlayService` herda `OverlayService` e utiliza o mesmo `dock.html`/`detail.html`; manter preferências independentes. Provar visualmente ambos os modos no Samsung.
- **Pendente físico:** após a assinatura e a publicação oficial, testar Rowlet/Froakie/Shellos/Flabébé/Gengar normal e fantasia, P/M/G, vertical/horizontal, P1/P2 e golpes com MT Elite/legado. Fonte web de traduções pode ficar indisponível; nesse caso, o painel não deve exibir nomes incorretos.
- **Não alterar assinatura, keystore, login, endpoints da API, limite 10 spawns, funcionalidades de Doce Raro nem código de PvPPokeGo.** Não afirmar QA físico concluído sem capturas de teste após atualização.
