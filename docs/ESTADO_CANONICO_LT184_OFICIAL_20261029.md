# PokeSearch LT184 — Estado canônico oficial (29/10/2026, horário de Fortaleza)

## Publicação e versão
- **Status:** release oficial publicada e verificada após autorização expressa do proprietário.
- **Versão:** `0.01.84` / Android `versionCode=54389`, nome `PokeSearch-v0.01.84-LT.apk`, pacote `com.lucianotoscano.pokesearch`.
- **Origem:** PR [#142](https://github.com/LucianoToscano/PokeSearch/pull/142) integrada à `main` via squash, commit-fonte `b3dd24839322029c4d6c4ce2e030ddb987625f0b`.
- **Release estável/latest:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.84-54389
- **APK público GitHub:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.84-54389/PokeSearch-v0.01.84-LT.apk
- **Tamanho do APK:** `49.547.006 bytes`; **SHA-256:** `e7679eafd1b43ca4f770a0939195603846e0cd6ed07881a217c078a2f09ac183` (fonte, asset de release e Drive iguais).
- **Assinatura:** Android APK Signature Scheme v2 = `true`; certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **GitHub Actions oficial:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40984409972 — `completed/success`, com regressões P1/P2/Doce Raro e OTA, restore sprites, Gradle/R8, validação de versão, assinatura, SHA e latest.
- **Artefato CI assinado:** `PokeSearch-LT184-54389-Oficial-Assinado`, ID `12947025068`, contendo APK, `SOURCE_COMMIT.txt`, `SHA256SUMS.txt`, `SIGNING-REPORT.txt`, `PACKAGE-VERSION.txt` e `APK-ENTRIES.txt`. `SOURCE_COMMIT.txt` = SHA do merge.

## Drive — mesmo link e mesmo arquivo
- ID preservado: `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P`, link: https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view
- Arquivo `PokeSearch-v0.01.84-LT.apk` substituído **no mesmo ID**, via Google Drive `files.update`, tamanho `49.547.006 bytes`, permissão pública `anyone/commenter` existente mantida e pasta `PokeSearch_App` preservada.
- Origem de upload: APK assinado do artefato GitHub Actions. Conferência em `SHA256SUMS.txt`, digest GH asset `sha256:e7679eafd1b43ca4f770a0939195603846e0cd6ed07881a217c078a2f09ac183`.
- **Readback posterior do Drive:** download bruto de `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` mostrou `49.547.006 bytes`, SHA `e7679eafd1b43ca4f770a0939195603846e0cd6ed07881a217c078a2f09ac183` e comparação `cmp` byte a byte idêntica ao APK do artefato assinado.
- Staging temporário `PokeSearch-LT184-PUBLICACAO-STAGING.apk`, ID `1FR4yOjaR815ftFDV_-XnyvMP4ryOgePE`, removido após validação. Teste temporário de transferência também removido.

## Correção LT184
- Lista global de favoritos e modo de alertas sincronizados via listener de preferências compartilhadas, disponível em ambas instâncias de `OverlayService`/ `SecondaryOverlayService`; listener é desligado no `onDestroy`.
- Mudanças na lista invalidam itens pendentes desatualizados; P1 e P2 reavaliam **apenas resultados próprios** da geração corrente, previamente confirmados pela API oficial ou DOM, compatíveis com filtros 100% e 0%, dentro do despawn e sem notificação já registrada.
- Nenhuma rechecagem faz uma nova pesquisa remota ou gera aviso geral. Filtros, resultados, posição, login/treinador e deduplicação permanecem individuais, lista de favoritos e tons globais como previsto.
- Testes de notificação Android de Favoritos identificam P1 ou P2 com IDs diferentes; não se confundem com notificação de encontro real.
- Regressores na suíte `app/tests/lt112-dual-overlay-parity.test.js` integrados com sucesso. Notas exibidas no app em `app/src/main/assets/release_notes.json`, `minVersionCode=54389`.

## Distribuição e limitações
- `GitHubUpdateCenter` consulta `GitHub Releases/latest` (agora LT184); a atualização aparece no app quando o feed for consultado, com aceite Android. Não houve instalação silenciosa nem mensagem push garantida no aparelho.
- `atualizacao.json` legado do Google Drive **não foi alterado**; não substituir por dados de nova release sem auditar clientes antigos.
- A compilação e o readback validam a publicação e integridade do APK. **QA físico no Samsung ainda não executado neste turno**: verificar P1 100%, P2 0%, som, sem som, notificações Android, API/DOM, os mesmos favoritos, troca de perfil, resultados expirados e ausência de avisos duplicados. Uma Pokébola 100% sem encontros 100% não deve alertar.
- Preservados LT183 e anteriores, assinatura permanente, Doce Raro, recursos do overlay e permissões existentes.
