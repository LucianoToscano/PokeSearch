# PokeSearch v0.51-beta — arquivo mestre
Base: v0.50-beta; branch isolada `security/v0.51-beta`. O desenvolvimento original em `main` permanece intocado. IDs: `com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`, versionCode 51, versionName 0.51-beta, minSdk 26, targetSdk 33, compileSdk 36, JDK 17, Gradle 8.11.1, AGP 8.10.1.
## Estado
R8 release e shrinkResources habilitados; keep de entrada Android/JavaScriptInterface; FLAG_SECURE no diálogo OAuth; IntegrityGuard valida nome do pacote, SHA-256 do Pix e existência de certificado de assinatura.
**Não é distribuição final.** A checagem de certificado apenas não comprova o autor; é obrigatório fixar SHA-256 do certificado release, configurar assinatura privada e testar APK em aparelho antes de disponibilizar.
Scripts probe.js e shiny_login.js ainda não são criptografados nesta etapa. Não declarar proteção completa.
## Distribuição
Somente o APK release assinado deve ser entregue a amigos. Não enviar ZIP-fonte, mapping.txt, keystore, senhas ou segredos. APK assinado para distribuição privada; não redistribuir o keystore.
Preservar todos os documentos anteriores e funcionalidades de login, overlay, notificações, Pix e favoritos.
