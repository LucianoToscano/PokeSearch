# PokeSearch LT385 — canais LT/Dev, atalhos da Home e FastDev 1000057 (16/11/2026)

## Convenção de identificação — OBRIGATÓRIA
- **Canal público/oficial:** `PokeSearch v0.03.73 LT` na Home; `LT` significa versão publicada. Pacote `com.lucianotoscano.pokesearch`, código `54580`.
- **Canal de desenvolvimento:** `PokeSearch v0.03.73 Dev` na Home e como `versionName` do APK. `Dev` significa desenvolvimento; a referência numérica `0.03.73` acompanha o último release oficial até a próxima publicação LT. Android mostra `PokeSearch Dev` como rótulo do aplicativo.
- O DEV **não** usa `LT` no texto, e o LT **não** usa `Dev`. A versão base do DEV vem automaticamente de `release/official-request.json`; não colocar versão antiga à mão.
- O Android `versionCode` do DEV é **independente e crescente** (ex.: `1000057`); não substituir por `54580`, pois isso quebraria instalações por cima. O pacote `.preview` e a chave FastDev são independentes da versão oficial.

## Alterações integradas
- [PR #476](https://github.com/LucianoToscano/PokeSearch/pull/476), squash `507061e0f0132bf4af768e76ec7ebdf9b6f4a85f` na `main`.
- Home: ordem **Doação → Login/Perfil → PoGoCoordinates → Tema**, ícones nativos compactos de 28dp; Login reutiliza as três artes enviadas pelo proprietário (claro/escuro/sem login) e abre gerenciamento de contas; PoGoCoordinates usa ON/OFF conforme a Conta 1 e abre a sessão oficial isolada já implementada. Nenhum login ou token paralelo.
- Rodapé mostra `PokeSearch v` + `BuildConfig.VERSION_NAME` + somente o sufixo oficial ` LT` quando `FASTDEV_PREVIEW=false`; o APK Dev recebe ` Dev` via `versionNameSuffix` do Android build type. Evita duplicação dos sufixos.
- Canais mantêm o mesmo código/layout principal da Home; os recursos do DEV são apenas o canal de atualização e os controles próprios da variante.
- Testes legados LT73/LT75/LT378 ajustados para a distinção por build; contratos FastDev de nomenclatura, login e recursos preservados.

## Evidências de QA e publicação
- SHA de PR validado `ab944c8b5baa1ff8cf3210719c3ca94f30668b0b`: FastDev, QA core LT211, LT169 Node completo, Preview Java, LT62 Java, LT173 OTA, Node QA e secure beta/R8 **SUCCESS**.
- [Workflow FastDev automático #44005259401](https://github.com/LucianoToscano/PokeSearch/actions/runs/44005259401): **SUCCESS**.
- `aapt` verificou **`com.lucianotoscano.pokesearch.preview` / `versionCode=1000057` / `versionName=0.03.73 Dev`**.
- [Pré-release FastDev 1000057](https://github.com/LucianoToscano/PokeSearch/releases/tag/fastdev-1000057), [APK](https://github.com/LucianoToscano/PokeSearch/releases/download/fastdev-1000057/PokeSearch-FastDev-Preview.apk): `62328413` bytes, SHA-256 `a2ab7dbfce22c286d4b8181376680724e0b3803f0c192ad91cce871cfd0a9b92`.
- Certificado permanente DEV SHA-256 `e712422729f6ec3c66646f752f4cfb88c4e0d4141404a3a1c271c7a6f0aaa4ea`; manifesto `fastdev/latest.json` aponta exatamente para código, tamanho, asset e SHA corretos.
- Oficial `0.03.73 / 54580` preservado; **nenhum APK oficial LT385** foi publicado.

## Limites da evidência visual
- A captura enviada sobre o DEV exibe **a tela inicial do Android**, com sprites/indicadores flutuantes, não uma captura da Home nativa do PokeSearch. Isso não determina se a Home fechou por integridade, por erro ou se o usuário estava fora do app. Não presumir correção da inicialização sem logcat e teste físico.
- **QA físico pendente:** abrir o APK DEV atualizado, conferir a Home real, toque dos dois botões, Login/Perfil, conta isolada, persistência de instalação, sem duplicação de overlays e atualização OTA. Não confundir compilação aprovada com execução homologada no aparelho.
