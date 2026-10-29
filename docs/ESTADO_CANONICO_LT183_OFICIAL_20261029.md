# PokeSearch — estado canônico LT183 oficial — 29/10/2026

## Distribuição pública concluída
- **Versão:** LT183 `0.01.83`, Android `versionCode=54388`, pacote `com.lucianotoscano.pokesearch`.
- **Release GitHub estável/latest:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.83-54388. `draft=false` e `prerelease=false`; publicada às 22:53:15 UTC de 29/10/2026.
- **APK oficial:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.83-54388/PokeSearch-v0.01.83-LT.apk
- **Tamanho:** 49.546.774 bytes. **SHA-256:** `2d336d6b7a3da61fb0c0553bb9762cce009189b324c3508fe9d735d4401ce5c4` conferido em `SHA256SUMS.txt`, no asset de GitHub Releases e no arquivo baixado novamente do Google Drive.
- **Certificado permanente APK:** SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; Android Signature Scheme v2 `true` no `SIGNING-REPORT.txt`.
- **Fonte da release:** commit `bb00878c572efc490f338d14eb61dea4f6dd9156`, verificado por `SOURCE_COMMIT.txt`.
- **GitHub Actions de produção:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40968750617 — `completed/success`, com Node, regressões, sprites, Gradle/R8, assinatura, verificação versão, digest e publicação latest.
- **Artefato assinado imutável de CI:** `PokeSearch-LT183-54388-Oficial-Assinado`, ID `12939032495`.

## Google Drive — mesmo link, bytes idênticos
- Arquivo mantido: https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view, ID `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P`.
- Atualizado **no mesmo ID** (Drive `files.update`) para `PokeSearch-v0.01.83-LT.apk`, 49.546.774 bytes, permissão `anyone` preservada; link público inalterado.
- Verificação feita de ida e volta: APK baixado do mesmo link após atualização, SHA-256 `2d336d6b7a3da61fb0c0553bb9762cce009189b324c3508fe9d735d4401ce5c4`, comparação byte a byte com o APK assinado extraído do artefato oficial GitHub Actions. Arquivo intermediário de staging apagado.

## Merge e registro
- PR [#140](https://github.com/LucianoToscano/PokeSearch/pull/140), retorno Discord OAuth: merge squash `a59b44567503eb9f1f6993c434354fbf693fde39`.
- PR [#141](https://github.com/LucianoToscano/PokeSearch/pull/141), preparação da release pública: merge squash `bb00878c572efc490f338d14eb61dea4f6dd9156`.
- Testes de Node e regressão, compilação Java e verificação OTA anteriores concluídos `success`. Workflow privado `Secure beta APK` falhou pela exigência de assinatura de release, mas o **workflow oficial assinado LT183** completou com sucesso e é o caminho canônico de publicação.
- Notas de atualização incorporadas no app (`release_notes.json`) para `minVersionCode=54388`.
- LT182 e os APKs anteriores preservados; `GitHubUpdateCenter` usa `releases/latest`. Usuários elegíveis veem a atualização quando consultam o feed; aceitação/instalação no Android não é silenciosa.

## Escopo funcional e limitações
- LT183 ajusta a visibilidade da página oficial no retorno da autorização Discord/Google, evita mascarar callbacks e mensagens oficiais de erro, impede navegação prematura a `/profile`, inclui confirmação de sessão também no caminho `Gerenciar/Vincular` e amplia janela de espera por hidratação do callback.
- Os logs de falha HTTP/rede não registram URL OAuth, tokens, cookies, `code` ou `state`. Contas 1/2, treinadores VIP, Pokébolas, Shiny e cookies isolados permanecem preservados.
- **OAuth real no Samsung não foi homologado.** A publicação e o CI assinados confirmam distribuição, mas não demonstram que a conta Discord do usuário conseguirá concluir a autorização. Se o PoGoCoordinates rejeitar o callback ou não persistir a sessão no WebView, será necessário examinar a página oficial de erro ou revisar o handoff de autenticação com o provedor, sem contornar controles OAuth.
- O arquivo legado `atualizacao.json` do Drive não foi alterado. O canal oficial principal segue GitHub Releases/latest.
