# Auditoria LT273 — revisão dos cartões e painéis

- **Objetivo:** sanar pontos marcados #2EFF2C (remover botões de exportação e explicações longas), #EB3BE5 (alinhamento), #FF7D1A (seletor de liga inoperante), #9933FF (mover Golpes capturados/Local para antes de Pegar Coordenadas), #0028B8 (cabeçalho único da liga), e reposicionar ícone de evolução sem tocar bandeira ou bordas.
- **Implementação:** `detail.html`: `#info` após `#evolutions` (o explorador é inserido entre ambos); cabeçalho com bandeira LT268, nome de liga colorido e ações ataque/X na mesma linha; linha duplicada de liga visualmente suprimida; source notes PvE/PvP fora da interface, com a fonte preservada em metadados e engine; ícone de evolução original LT272 reduzido para 11px (9px P) no canto inferior direito (4px/3px). Não alterar a bandeira central.
- **Explorador `pvp_rank_explorer.js`:** seleção de liga `GL/UL/ML` e filtro `Todos/Top 10/50/100` em menus WebView próprios; `select` legado oculto preservado para integração; controles `#1 Topo / Meu IV ou Minha posição / Todos` em grade de três colunas; botões Copiar/Compartilhar/CSV retirados do layout (motor de ranking e comparação intactos). Informação de Rank Classe sobre 4096 IVs continua contextual pela liga selecionada.
- **Regressões:** verificar Node, QA Android/Java, PvE, OTA, screenshots reais do Chromium/WebView P/M/G, seletor de liga por toque, posicionamento de símbolo sem sobreposição, fonte em metadados, sem exportação visual. Nenhum teste físico Samsung declarado.
- **Versionamento a publicar só após CI verde:** LT273 `0.02.73` / `versionCode 54477`; rollback LT272 `v0.02.72-54476`.


## Publicação e QA posterior (06/11/2026)

- PR #263 mesclada `3f6aea55cd1020046911dd6a566e791d1fca46cc` (a duplicada #262 fechada, não mesclada).
- Visual real Chromium P/M/G #42297909949 aprovado, incluindo toque no seletor de liga, badges com distância da bandeira, colunas de ranking e sem cortes.
- Todas as regressões Node, Java, PvE e OTA da PR #263 passaram. Publicação oficial #42298287130 `preflight` e `publish` aprovados; QA assinada independente #42298287129 aprovada.
- GitHub Releases confirma `v0.02.73-54477` como release oficial (`draft=false`, `prerelease=false`), publicação `2026-11-06T21:41:42Z`. APK `PokeSearch-v0.02.73-LT.apk` de **33.612.358 bytes**, SHA-256 **`a2e92d2ee73acafd831d10607159a6e481eb1b75131ae7f1e8fde3feb77c6e37`** e asset `uploaded`.
- **Pendentes:** nenhuma evidência de instalação/OTA bem-sucedida no Samsung real; teste de toque dos menus na sobreposição, fundos claros/escuros e rolagem com tamanho P/M/G; APK enviada ao Drive não comprovada. O status de QA automatizada não elimina teste físico.
