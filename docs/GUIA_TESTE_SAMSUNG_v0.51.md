# Guia Samsung v0.51-beta — validação obrigatória
Usar dispositivo de teste e conta de teste.
1. Compilar release R8 com JDK 17, Gradle 8.11.1, SDK 36 e keystore release privada.
2. Conferir `apksigner verify --verbose --print-certs PokeSearch-0.51-beta.apk` e `aapt dump badging` (package, versionCode 51, versionName 0.51-beta).
3. Abrir app e confirmar ausência de crash; iniciar overlay com permissão; mover/recolher engrenagem; testar os 12 controles, favoritos, atualização e modo AUTO.
4. Abrir login, tentar captura de tela: janela deve estar protegida; completar login Google/Discord no fluxo oficial e retornar ao app.
5. Confirmar Native.* no WebView, filtros IV100/GL/UL/Shiny, notificações, Pix e favoritos.
6. Testar APK modificado em ambiente controlado: bloqueio de integridade esperado; documentar resultados sem credenciais.
7. Verificar que distribuição contém **apenas** APK, sem código-fonte, mapping.txt ou keystore.
**Status:** roteiro, não evidência de testes executados. Não distribuir até aprovar.
