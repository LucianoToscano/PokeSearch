# LT181 — Próxima versão: aviso de atualização acima das Pokébolas (29/10/2026)

## Pedido do proprietário
Na mesma conversa em que autorizou publicar a LT180 para todos, pediu que **na próxima versão** o aviso de atualização apareça **acima das Pokébolas, na parte superior da Home**.

## Implementação isolada
- `MainActivity.buildHome()`: o único `homeUpdateHolder` passa a ser inserido em `screen` com índice **1**, diretamente após o cabeçalho PokeSearch e antes da linha `dualOverlayRow` (Pokébolas 1/2).
- Cartão mantém interface nativa existente e callbacks de `GitHubUpdateCenter` e `UpdateCenter`, só muda a posição. Protege os fluxos de download/assinatura SHA-256/mesmo certificado, Depois, Ignorar, avisos e versão atual.
- `View.GONE` quando não elegível: não abre espaço vazio acima das Pokébolas nem desloca demais a Home.
- Margens laterais 4dp e superior/inferior 5dp para alinhar visualmente à linha de Pokébolas.
- P1/P2, login, overlays, chats, mural, condições de rede, atualização OTA e menus do Doce Raro permanecem intactos.

## Verificação/lançamento
- Teste estático de regressão `app/tests/lt181-top-update-banner.test.js` verifica índice de inserção, ocultação e todas as ações do cartão.
- Notas LT181 preparadas com `minVersionCode=54386` no arquivo `release_notes.json`.
- Branch `feature/lt181-update-banner-above-pokeballs-20261029`, derivada da `main` com correção LT180 mesclada; a **LT180 (54385) é a publicação autorizada neste turno**.
- **A LT181 não deve ser mesclada ou publicada durante a publicação da LT180.** Exigir testes Node/Java e APK com assinatura permanente e validação visual antes de próxima publicação.
