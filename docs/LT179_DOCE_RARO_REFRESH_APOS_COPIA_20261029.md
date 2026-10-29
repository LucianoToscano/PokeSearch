# LT179 — Doce Raro: ↻ confiável e auto-busca depois de copiar todos (29/10/2026)

## Escopo sobre LT178 estável (0.01.78 / 54383)
- Fonte preservada: API oficial PoGoCoordinates na WebView autenticada; sem extração de JWT, bypass de limites nem /reveal.
- `rare_candy_controls.html`: o botão ↻ dispara no `pointerup` curto e tem fallback `click` para WebView Android que perdeu `pointerup`. Uma janela de 400 ms evita pedido duplicado com o clique sintetizado. Segurar 550 ms abre somente a seleção de intervalo 1/3/5m, sem pesquisar.
- `RareCandyOverlayService`: a bridge local mostra confirmação `Atualizando doces…` no toque. Se estiver carregando ou consultando, conserva no máximo uma atualização pendente.
- Quando o usuário copia **o último doce ainda colorido e válido da lista**, a sprite fica cinza e a próxima busca é solicitada automaticamente. Uma cópia repetida em doce já cinza **não** dispara novas buscas. Se o provedor devolver os mesmos resultados, permanecem cinza sem ciclo infinito.
- Sob `HTTP 429 Retry-After`, a solicitação manual/automática pendente aguarda a liberação e o `tick` retoma uma única consulta, sem antecipar chamadas; pesquisa periódica e expiração continuam protegidas.
- O histórico de até 100 coordenadas copiadas agora usa ordem de inserção para descartar a mais antiga.
- P1/P2, contas, treinadores, localização, sprites, controles e versionamento OTA anterior não foram alterados.

## Validação
- Teste estático/contrato original: `app/tests/lt175-rare-candy-overlay.test.js`.
- Teste comportamental novo: `app/tests/lt179-candy-refresh-gestures.test.js`, com simulação de pointerup, click fallback, pressão longa e deduplicação.
- CI isolado `.github/workflows/lt179-candy-refresh-signed-qa.yml`, produz candidato **0.01.79 / 54384**, assinado pelo certificado permanente, em artefato QA privado (se concluído com sucesso). **Sem merge, Release/latest, Google Drive, OTA público ou envio aos usuários nesta etapa.**
- Homologação pendente no Samsung: toque simples realmente troca os resultados; botão segurar escolhe 1/3/5m; 10 doces copiados geram uma única busca e mantêm cinza os repetidos; rede offline e limite 429; P1 e P2 continuam independentes.


## LT179 — Publicação oficial confirmada (29/10/2026)
- **Aprovação:** usuário solicitou explicitamente atualizar o aplicativo de todos os usuários.
- **Merge:** PR #135 (squash) para `main` no SHA `45d9611477459e9c068f9fb5959a3a782cc24e5e`.
- **GitHub Actions oficial SUCCESS:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40942572376
- **Release/latest:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.79-54384 — `draft=false`, `prerelease=false`.
- **APK oficial:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.79-54384/PokeSearch-v0.01.79-LT.apk
- **Metadados:** `0.01.79`, versionCode `54384`, pacote `com.lucianotoscano.pokesearch`, **49.542.366 bytes**.
- **SHA-256 APK:** `484f85afce3d25d38f8e34411788d4658b866203ff896eccf5088b905ac97184` (confirmado pelo campo `digest` do asset oficial e comparado no workflow).
- **Assinatura v2 permanente** (certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`), R8 e regressões executados com sucesso no pipeline.
- **Atualizador:** os usuários com versão compatível recebem a oferta via `GitHubUpdateCenter` ao consultar `releases/latest`; depende de conexão, agendamento/abertura do app e confirmação de instalação pelo Android. Não há push forçado ou instalação silenciosa.
- **Ponte antiga Google Drive:** não atualizada por este workflow; nenhuma afirmação de novo APK na pasta Drive. O canal GitHub fornece o APK oficial com verificação de integridade.
- **QA real Samsung:** não confirmada por este workflow; relatórios de uso reais podem exigir refinamento posterior. LT178 preservada sem substituição retroativa da release/tag.
