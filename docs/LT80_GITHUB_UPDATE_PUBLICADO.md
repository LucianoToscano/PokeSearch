# LT80 — atualização oficial GitHub para usuários LT79

Publicação autorizada explicitamente pelo proprietário após relato Samsung sobre o Get coords do Swablu Shiny.

- Versão: 0.00.80 LT, versionCode 54283
- Tag GitHub Release oficial: `v0.00.80-54283`
- URL: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.80-54283
- Estado: estável (draft=false, prerelease=false), marcado latest, asset uploaded
- Asset: `PokeSearch-v0.00.80-LT.apk`
- SHA256 do APK: `14eedd2d181f1d09437b3985f88ac5a5c758463772dfce50f3d97a34f136b317`
- Tamanho APK: 38,601,751 bytes
- Certificado assinante permanente SHA256: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`
- Package: `com.lucianotoscano.pokesearch`
- Fonte exata do APK: `f97aa19a2ee2d6d0917c4eab0b9cd61f77209605`
- CI QA assinado: https://github.com/LucianoToscano/PokeSearch/actions/runs/40154892844 — SUCCESS
- Aprovação e publicação: https://github.com/LucianoToscano/PokeSearch/actions/runs/40155214318 — SUCCESS
- O GitHub Releases confirmou SHA256 em campo `digest` do asset, além de flags `uploaded`, não Draft, não prerelease.
- GitHubUpdateCenter do aplicativo LT79 já consulta `/releases/latest` no retorno à Home, usa WorkManager em intervalo nominal de 30 minutos (sujeito a Doze/bateria) e pode notificar com permissão POST_NOTIFICATIONS. Banner tem download nativo, SHA-256 e assinatura pinada, verificação de pacote/versão e instalador Android. Respeitar "Depois" e "Ignorar".
- Distribuição LT79 (Google Drive) continua no manifesto público de ID `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf`. Não atualizar Drive para LT80, pois a transição LT79 → LT80 é via GitHub. Não mudar branch main nem mesclar PRs.
- Nota de homologação: teste automatizado de código e assinatura foram bem sucedidos, mas resultado físico da correção Get coords em Samsung após LT80 permanece pendente. Não declarar resolvido sem nova validação física.
