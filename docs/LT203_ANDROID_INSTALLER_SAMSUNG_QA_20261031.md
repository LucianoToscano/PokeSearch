# LT203 — Instalador de atualização Android/Samsung (31/10/2026)

## Sintoma reproduzido pelo usuário
No Samsung Android 16, a Home do PokeSearch LT201 exibe `v0.02.02 disponível`; o download interno termina em **APK verificado — 100%**, mas `Instalar atualização` abre e fecha o Package Installer sem instalar. O rodapé ainda exibe LT201. Capturas comprovam download concluído e falha da interface de instalação; **não comprovam causa única** ou erro de certificado.

## Diagnóstico do código anterior
- O arquivo era baixado para `cache/updates/pokesearch-54409.apk` e validado por SHA-256, packageName, versionCode, assinatura v2 e certificado permanente.
- `AndroidManifest.xml` já possui `REQUEST_INSTALL_PACKAGES` e `FileProvider` exportado false com grantUriPermissions; `res/xml/update_file_paths.xml` expõe apenas cache/updates/.
- A entrega ao Android usava apenas `Intent.ACTION_VIEW`, MIME `application/vnd.android.package-archive`, `setDataAndType`, `FLAG_GRANT_READ_URI_PERMISSION` e `startActivity`. Não usava `ACTION_INSTALL_PACKAGE`, `ClipData`, `startActivityForResult`, diagnóstico de cancelamento imediato nem fallback acessível no diálogo.
- O Samsung Auto Blocker / permissão de origem desconhecida é possível fator externo. O app não pode e não deve contorná-lo.

## Ajustes de produção
- Preferir `ACTION_INSTALL_PACKAGE` com `content://` do FileProvider e `ClipData.newRawUri`, com grant read e `Intent.EXTRA_RETURN_RESULT` para receber o retorno do Android. Se o launch falhar com `ActivityNotFoundException` ou `SecurityException`, tentar `ACTION_VIEW` com o mesmo URI, ClipData, MIME e grant.
- Em retorno de cancelamento quase instantâneo (menos de 4 segundos), exibir ajuda compacta e botão para download oficial externo; não lançar duas instalações sucessivas sem ação explícita do usuário.
- Verificar novamente o arquivo no cache, assinatura e versão antes de chamar o Package Installer; bloquear caminho fora de cache/updates.
- Se `canRequestPackageInstalls()` for falso, explicar e abrir `ACTION_MANAGE_UNKNOWN_APP_SOURCES` apenas por ação do usuário, com rota alternativa ao browser. Não desligar o Auto Blocker nem remover overlays/contas/filtros.
- Botão adicional `Instalar pelo navegador` aparece após verificação do APK. URI externa fica restrita ao GitHub Releases oficial e ao nome canônico do APK.
- Evitar mensagens com nomes/credenciais/URLs privadas, testes de regressão e assinatura inalterada.
- **Recuperação enquanto LT201/202 estão instaladas:** instalar APK oficial pelo Chrome → Meus Arquivos → Downloads → Atualizar PokeSearch. Não desinstalar; permitir origem explicitamente se o sistema solicitar.

## QA obrigatória
- `node app/tests/lt203-ota-installer-handoff.test.js` + regressão Node completa, Java compile, OTA, release R8 e signer v2 original.
- Samsung Android 16: comparar lançamento via botão principal e fallback pelo navegador, com/sem autorização de origem desconhecida, presença de Auto Blocker, com Pokébola 1/2 ativadas e desativadas.
- Confirmar nome de pacote, versionCode novo e preservação de dados da instalação anterior.
- **Sem teste físico ainda:** sucesso na compilação ou verificação da assinatura não prova que o Package Installer do telefone abrirá em todos os dispositivos.
