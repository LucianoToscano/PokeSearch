# LT385 — Paridade visual e nomenclatura oficial/Dev (16/11/2026, America/Fortaleza)

## Regra permanente solicitada pelo proprietário

- Canal público: **PokeSearch v0.03.73 LT**, APK assinado oficial `v0.03.73-54580`, pacote `com.lucianotoscano.pokesearch`.
- Canal de desenvolvimento: **PokeSearch v0.03.73 Dev**, pacote `com.lucianotoscano.pokesearch.preview`, com a mesma fonte visual/funcional `app/src/main`, acrescida exclusivamente das funções técnicas de atualização Preview. O nome do lançador Dev é `PokeSearch Dev`.
- **LT** identifica atualização publicada para o público; **Dev** identifica build de desenvolvimento. Nunca mostrar `fastdev.10000xx-preview LT` ou usar o versionCode interno como nome visível.
- A versão Dev deriva o número público dinamicamente de `release/official-request.json` (não é necessário editar manualmente `0.03.73` a cada publicação futura).
- `versionCode` do Dev permanece independente e crescente, para permitir instalar por cima com a assinatura permanente Dev. Não reutilizar a chave oficial no Preview.

## Paridade com a versão pública

- O APK Dev usa a mesma `MainActivity`, a mesma implementação de Home e todos os recursos/arquivos de `app/src/main` da base do PokeSearch; o source set `preview` contém somente aplicativo e atualizador isolado, **não um segundo layout da Home**.
- Comparação do conjunto de **341** arquivos de `app/src/main/res` e `app/src/main/assets` da publicação oficial `v0.03.73-54580` contra `main` antes da LT385: somente `profile_summary.js` diferia; recursos de imagem/artes se mantiveram. A LT385 adicionou exclusivamente 2 novos arquivos WebP fornecidos pelo proprietário, sem substituir os anteriores.
- A LT385 coloca na mesma fileira da Home, depois de Doação, os atalhos **Login / Perfil** e **PoGoCoordinates**, preservando os controles já existentes e a navegação de Conta 1/Conta 2.
- **Limite essencial:** aplicativo público e Dev possuem pacotes distintos; por isolamento Android, suas preferências pessoais, login, conta, tema escolhido e cache não são automaticamente compartilhados. A mesma base visual não significa reproduzir os dados privados já personalizados no aparelho. Não ler dados privados do APK oficial por caminhos não autorizados.

## Código, testes e publicação

- [PR #476](https://github.com/LucianoToscano/PokeSearch/pull/476) **integrada** por squash `507061e0f0132bf4af768e76ec7ebdf9b6f4a85f`.
- CI da PR no SHA `ab944c8b5baa1ff8cf3210719c3ca94f30668b0b`: FastDev smoke, compilação Preview Java, LT62, LT173 OTA, LT169 Node completa, QA core LT211, Node QA e beta/R8 isolada — **SUCCESS**.
- [Build automática FastDev #44005259401](https://github.com/LucianoToscano/PokeSearch/actions/runs/44005259401): **SUCCESS**. `aapt` confirmou pacote `com.lucianotoscano.pokesearch.preview`, `versionCode=1000057`, `versionName='0.03.73 Dev'`, `application-label='PokeSearch Dev'`.
- [Pré-release FastDev 1000057](https://github.com/LucianoToscano/PokeSearch/releases/tag/fastdev-1000057) e [APK](https://github.com/LucianoToscano/PokeSearch/releases/download/fastdev-1000057/PokeSearch-FastDev-Preview.apk). APK: **62.328.413 bytes**, SHA-256 `a2ab7dbfce22c286d4b8181376680724e0b3803f0c192ad91cce871cfd0a9b92`. Certificado Dev permanente SHA-256 `e712422729f6ec3c66646f752f4cfb88c4e0d4141404a3a1c271c7a6f0aaa4ea`.
- [Manifesto público FastDev](https://raw.githubusercontent.com/LucianoToscano/PokeSearch/main/fastdev/latest.json): versão 1000057, hash, tamanho e source SHA confrontados com a pré-release.
- **A release oficial 0.03.73 / 54580 não foi modificada**, nem sua assinatura ou pacote.

## Homologação física ainda necessária

Instalar o APK Dev 1000057 **por cima** do Dev anterior (não desinstalar), abrir e confirmar a Home, a posição dos dois atalhos, o rodapé `PokeSearch v0.03.73 Dev`, efeitos de tema, botões e atualização pelo instalador Android. Comparar com a Home do APK público 0.03.73 e anotar quaisquer diferenças de preferências/contas. CI prova construção e contratos, mas não substitui teste em aparelho.
