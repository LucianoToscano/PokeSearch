# PokeSearch LT187 — Publicação oficial, instalação e Google Drive (30/10/2026)

## Resultado oficial
- **Status:** PUBLICAÇÃO CONCLUÍDA após autorização expressa do proprietário: "Faça o merge. Mande a atualização para aplicativo. E registre tudo. E coloque no Google drive."
- **Versão pública:** `0.01.87`, Android `versionCode=54392`, arquivo `PokeSearch-v0.01.87-LT.apk`.
- **Tamanho oficial:** **29.013.825 bytes (29,01 MB)**, redução de **20.533.181 bytes (41,44%)** em comparação com a LT184 oficial `49.547.006 bytes`. A LT187 QA tinha 29.013.661 bytes; pequena diferença se deve ao build oficial e notas, não usar tamanho QA como oficial.
- **APK SHA-256 oficial:** `e462b213343253de0b1f84d318ec9ea5a1e29bb7adeb239c76a8878212a7285e`.
- **Pacote:** `com.lucianotoscano.pokesearch`; assinatura permanente Android v2 confirmada com SHA-256 do certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Commit de compilação da Release:** `82b9f67cd43a61663627f368563ba366f50bfba6`.
- **Workflow oficial:** [Actions #40994712359 — completed/success](https://github.com/LucianoToscano/PokeSearch/actions/runs/40994712359), validou baseline, merge dos três estágios, notas no aplicativo, chaves e certificado, regressão Node/P1/P2/Doce Raro/OTA, sprites offline, Android SDK/Gradle/R8, `shrinkResources`, testes Android, ZIP/APK, SHA-256 e publicação/latest.
- **Releases/latest:** [v0.01.87-54392](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.87-54392), `draft=false`, `prerelease=false`, asset com nome/tamanho/digest conferidos por readback na API oficial.
- **Download direto GitHub:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.87-54392/PokeSearch-v0.01.87-LT.apk
- **Artefato CI assinado:** `PokeSearch-LT187-54392-Oficial-Assinado`, ID `12950698551`, com `SHA256SUMS.txt`, `SIGNING-REPORT.txt`, `SOURCE_COMMIT.txt`, `PACKAGE-VERSION.txt`, `APK-ENTRIES.txt` e `LT187-OFFICIAL-APK-INVENTORY.json`. ZIP extraído e `sha256sum --check` aprovado localmente.

## Merge e origem
- [PR #143 — LT185 PNG](https://github.com/LucianoToscano/PokeSearch/pull/143) integrada na main, merge commit `49c5ea264e8d4f0d68a49c1ae300a81a2800d1c6`.
- [PR #144 — LT186 WebP/branding](https://github.com/LucianoToscano/PokeSearch/pull/144) integrada depois, merge commit `8c9d982be70e7380daf14f58fa7ebd99ab4d9aa7`.
- [PR #145 — LT187 MP3/auditoria](https://github.com/LucianoToscano/PokeSearch/pull/145) integrada depois, merge commit `4d7920d49359ebec446a4d38af6463a122bb94a9`.
- Documentação divergente da main e histórico das PRs preservados ao usar merge commits; não houve rollback de funcionalidades.
- Notas de atualização LT187 adicionadas em `app/src/main/assets/release_notes.json` com `minVersionCode=54392`.

## Google Drive — mesmo link e mesmo ID, verificado
- **ID público preservado:** `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P`.
- **Link inalterado:** https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view
- **Pasta preservada:** `PokeSearch_App`, ID `1fVw93qUDE0YWp6tlJZaNjRmymyhEAUbR`.
- **Substituição in-place:** arquivo original `PokeSearch-v0.01.84-LT.apk` substituído no mesmo ID e renomeado `PokeSearch-v0.01.87-LT.apk`. Agora **29.013.825 bytes**.
- **Permissão existente preservada:** `anyone/commenter` com `allowFileDiscovery=false`; link permanece compartilhado.
- **Readback independente do Drive:** arquivo baixado de volta por Google Drive connector, SHA-256 `e462b213343253de0b1f84d318ec9ea5a1e29bb7adeb239c76a8878212a7285e`, `cmp` byte a byte idêntico ao APK oficial extraído do GitHub Actions.
- **Staging temporário:** ID `1lSPJ0RM9KvNvx0XyTKlweOKL3bw-uhhz`, usado para verificação e transferência; depois **excluído** com sucesso. Nenhuma duplicata de staging deixada no Drive.

## Atualização dentro do aplicativo
- `GitHubUpdateCenter` consulta `GitHub Releases/latest`; a latest agora está em `v0.01.87-54392` e será oferecida a usuários elegíveis quando o app consultar o feed.
- Atualizador e notas do app preservados; download e instalação dependem de conexão e aceite no Android. **Não existe instalação silenciosa garantida nem push imediato em todos os aparelhos.**
- Manifesto legado `atualizacao.json` permanece inalterado; não inventar sincronização por esse canal.

## Testes e limites
- [LT187 QA assinada](https://github.com/LucianoToscano/PokeSearch/actions/runs/40990477785): **29.013.661 bytes**, R8, alertas P1/P2, Doce Raro, OTA, sprites e 36 sons validados em código.
- [Emulador Android 16](https://github.com/LucianoToscano/PokeSearch/actions/runs/40993150452): LT184 -> LT187 via `adb install -r`, UID e data original preservados, Home abriu nas duas versões, sem encerramento imediato.
- **QA físico Samsung pendente:** validar som real, OAuth Discord/Google, perfis de treinadores VIP, duas Pokébolas com alertas reais, arte WebP, Doce Raro, recompensas/sprites e atualização sem perda de preferências. Nenhum teste automatizado comprova esses cenários de hardware/rede.
- Preservados históricos LT184 e anteriores, conta/token/API do provedor, dados dos usuários, fonte e certificados privados.

## Ações que NÃO foram executadas
- Nenhuma alteração retroativa de `atualizacao.json`.
- Nenhuma instalação silenciosa de APK em celulares.
- Nenhuma exclusão de bibliotecas de autenticação, sprites ou 36 sons.
