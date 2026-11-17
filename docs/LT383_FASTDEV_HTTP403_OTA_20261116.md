# LT383 — FastDev: recuperação do atualizador após HTTP 403 (16/11/2026, horário de Brasília)

## Problema relatado
- Tela FastDev no Android: **"Consulta falhou: HTTP 403"** ao procurar atualizações.
- Origem comprovada no código anterior: `FastDevConsoleActivity.java` consumia diretamente `https://api.github.com/repos/LucianoToscano/PokeSearch/releases?per_page=30`; em caso de falha HTTP interrompia a busca. O 403 foi observado na captura do usuário; **os cabeçalhos HTTP do celular não foram coletados**, então não é possível afirmar com certeza que foi rate limit, apenas que o código era vulnerável a esse cenário.
- HTTP 403 não indica necessariamente falha de login, assinatura ou instalação. O app antigo não conhece o manifesto público novo; exige uma instalação manual de transição.

## Correção implementada
- PR [#474](https://github.com/LucianoToscano/PokeSearch/pull/474) **MERGED**, squash `dc4cd5eb7d6d6ef423063b43c09ceaebdcbafe3b`. SHA de QA do código `59eeec9ac97a851657d2568242c16636c372a9c5`.
- Android Preview usa primeiro [`fastdev/latest.json`](https://raw.githubusercontent.com/LucianoToscano/PokeSearch/main/fastdev/latest.json), documento público servido no raw GitHub (sem consumir quota da API Releases). Apenas se o manifesto falha tenta a API anterior. Valida esquema, versão, tag, URL, SHA-256, tamanho e commit, conserva checagem de certificado de APK antes de instalar.
- Tela sempre mostra versionCode instalado, erro recuperável e botão **Abrir downloads FastDev no navegador**.
- Workflow protegido FastDev gera manifesto do arquivo APK assinado real e atualiza `main` **depois** da publicação da pré-release, por API autenticada e lease SHA.
- Contratos Node novos de seleção, host permitido, integridade, manifesto e ordem de publicação; branch FastDev não compila Android em cada push.
- Nenhuma chave, assinatura, conta OAuth, APK oficial, `release/official-request.json` ou código de produção foi alterado.

## Atualização FastDev verificada
- Solicitação em `fastdev/preview-request.json` (SHA `2d26105fd57b1aede3511efaed81aceef8e0ebfe`, request `fastdev-lt383-http403-20261116-01`).
- [Workflow FastDev #43999281475](https://github.com/LucianoToscano/PokeSearch/actions/runs/43999281475): **SUCCESS**, incluídos preflight, compilação Preview, assinatura, verificação de pacote e assinatura, upload, pré-release e manifesto.
- [Pré-release `fastdev-1000039`](https://github.com/LucianoToscano/PokeSearch/releases/tag/fastdev-1000039): prerelease pública, não draft. [APK instalável](https://github.com/LucianoToscano/PokeSearch/releases/download/fastdev-1000039/PokeSearch-FastDev-Preview.apk).
- Package `com.lucianotoscano.pokesearch.preview`, `versionCode=1000039`, `versionName=fastdev.1000039-preview`.
- APK: **62.304.688 bytes**, SHA-256 `47f20b2e539e0d077f4f2fb6d9e03168549e6cf4d593acafcdabf574d449a086`.
- Certificado público SHA-256 reportado pelo `apksigner`: `e712422729f6ec3c66646f752f4cfb88c4e0d4141404a3a1c271c7a6f0aaa4ea`, igual ao permanente FastDev já usado no `1000035` e `1000027`.
- Metadados da API de release, `fastdev/latest.json` em `main` e raw público foram confrontados: **todos apontam 1000039, SHA e tamanho idênticos**.
- [FastDev smoke PR #43998894219](https://github.com/LucianoToscano/PokeSearch/actions/runs/43998894219): SUCCESS.
- [Preview Java compile PR #43998894255](https://github.com/LucianoToscano/PokeSearch/actions/runs/43998894255): SUCCESS.
- [Node LT169 #43998894013](https://github.com/LucianoToscano/PokeSearch/actions/runs/43998894013): SUCCESS.
- [QA core LT211 #43998894023](https://github.com/LucianoToscano/PokeSearch/actions/runs/43998894023): SUCCESS.
- [Beta APK/R8 #43998894118](https://github.com/LucianoToscano/PokeSearch/actions/runs/43998894118): SUCCESS; não usar esse APK temporário como FastDev.

## Como sair do erro 403 no celular
1. Acessar a pré-release `fastdev-1000039` pelo navegador e baixar **PokeSearch-FastDev-Preview.apk**.
2. Abrir e instalar **por cima** do FastDev anterior. Não desinstalar; a assinatura permanente e packageId continuam iguais e a atualização pode preservar as preferências. Android pode solicitar autorização de instalação da fonte, confirmação sempre manual.
3. Abrir o console FastDev: deve informar **FastDev instalado: 1000039**. Tocar em Verificar atualização deve consultar o manifesto e informar que não existe uma versão mais nova (até publicar 1000040+).
4. Testar em rede móvel e Wi-Fi, reinício, atualização 1000039 → próxima versão e preservação de dados.

**Limitação:** Android físico e comportamento em rede do aparelho **ainda não homologados**. Atualizador antigo não pode ser consertado remotamente antes de instalar APK novo. Se o link direto de release também responder 403 na rede, a alternativa é usar rede/navegador diferentes e documentar os cabeçalhos/erros sem expor credenciais.

**Release oficial preservada:** PokeSearch `0.03.73 / versionCode 54580`; não houve ARK/publicação oficial neste ciclo.
