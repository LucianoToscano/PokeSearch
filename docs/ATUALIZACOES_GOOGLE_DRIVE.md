# PokeSearch — Publicação de atualizações pelo Google Drive (LT72)

## Fonte única de download
Pasta oficial: https://drive.google.com/drive/folders/1qzfJjtR4B4PQb9WCKZDHv-d9p0wMqBA-

Manifesto público **atualizacao.json**: ID `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf`. APK público de referência LT62: ID `1K59Jh1jw1Qd6BvAYE-geFdp3Z53dOFej`. Ambos devem ter compartilhamento "Qualquer pessoa com o link / Leitor". Pasta Histórico permanece intacta.

A Home verifica o manifesto por HTTPS no Drive, sem backend, proxy ou GitHub Releases. Ela só anuncia quando **enabled=true**, o JSON é estruturalmente válido, a versão remota tem `versionCode` **maior** que o APK instalado e o usuário não dispensou exatamente aquela versão. `forceUpdate` é preservado, mas **não** bloqueia o usuário, nem força instalação. O download apenas abre o navegador Android; o Drive pode exigir confirmação manual para APKs grandes. O aplicativo **não baixa nem verifica o binário do APK diretamente**; o SHA-256 é um campo do manifesto e deve ser conferido no processo de publicação.

## Processo seguro para uma nova versão

1. Homologue o APK no Samsung. Confirme assinatura Android persistente, package, versão e SHA-256 do arquivo **real**.
2. Envie o APK oficial à pasta Atualizacoes_PokeSearch no Drive, mantendo o nome `PokeSearch-v0.00.XX-LT.apk`, e compartilhe o arquivo como "Qualquer pessoa com o link / Leitor".
3. Edite **somente** o conteúdo de `atualizacao.json` existente (não troque o ID do arquivo), preservando os campos abaixo. Ajuste `apkFileId`, `apkUrl`, `apkSha256`, `versionName`, `versionCode`, `apkName`, `message`, `description`, `status` e `notes`. Enquanto estiver em teste mantenha `enabled=false`.
4. Depois da homologação, altere apenas `enabled` para `true`, salve o arquivo e aguarde a próxima consulta da Home. Novas publicações podem ser feitas **sem recompilar** o app LT72+.
5. Não apague o APK anterior antes de confirmar que o link novo abre corretamente, que não é HTML de login e que os usuários recebem a versão correta.

Modelo ilustrativo (**NÃO PUBLICAR** com dados fictícios):
```json
{
  "schema": "pokesearch-update-v1",
  "enabled": false,
  "versionName": "0.00.XX",
  "versionCode": 0,
  "apkName": "PokeSearch-v0.00.XX-LT.apk",
  "apkFileId": "SUBSTITUA_PELO_ID_REAL",
  "apkUrl": "https://drive.google.com/uc?export=download&id=SUBSTITUA_PELO_ID_REAL",
  "apkSha256": "SUBSTITUA_PELO_SHA256_REAL",
  "message": "Nova atualização disponível!",
  "description": "✨ Novidades, melhorias e correções.",
  "forceUpdate": false,
  "notes": [],
  "status": "aguardando_homologacao"
}
```

## Contrato e falhas seguras

- Schema exato `pokesearch-update-v1`; campos obrigatórios presentes; `enabled` e `forceUpdate` booleanos; `versionCode` inteiro positivo.
- `versionName` segue `0.00.XX`; `apkName` deve concordar com o nome da versão. `apkFileId` deve conter somente letras, números, hífen e sublinhado; `apkUrl` deve ser exatamente `https://drive.google.com/uc?export=download&id=<apkFileId>`; SHA-256 hexadecimal de 64 caracteres; `notes` array.
- O leitor usa uma única thread de rede, agrupa solicitações repetidas, cache temporário de 5 minutos, timeouts de 4 s e limite de 16 KiB para o JSON. Falha de rede, JSON malformado, redirect HTTP não-HTTPS, host inesperado ou HTML de login/confirmação não travam a Home — o aviso é omitido.
- Requisição pode seguir redirecionamentos HTTPS para hosts oficiais do Google; existe segunda URL oficial do Google Drive para tentativa alternativa. **Apenas teste real em dispositivo/rede externa** confirma que o arquivo público está sendo entregue como JSON sem página de confirmação.
- O ✕ persiste em `prefs/homeDriveUpdateDismissedCode`. Uma versão mais recente volta a aparecer. Ao instalar versão igual/superior a anunciada, o aviso desaparece por regra de comparação de `versionCode`.
- Nenhuma permissão nova foi adicionada. Nada instala APK silenciosamente. Cookies, OAuth, filtros, resultados, overlay, Firebase, arquivos originais e o histórico local `release_notes.json` são independentes dessa central.
- `status` e `notes` continuam no manifesto para organização/editoria, não interferem no fluxo visual compacto.

## Checkpoint LT72 (24/10/2026)

Base LT71 PR #45 Draft, commit `43b2b220750213b36d763a2a628339f2586529f7`. Branch `feature/lt72-drive-update-center-20261024`; PR #46 Draft. Novo aviso acima dos contadores Firebase na Home, oculto quando não elegível, tema claro/escuro, botão de navegação para Drive e dispensa por versão. Configuração remota permanece `enabled:false`, LT62 versão 54260; um APK LT72 (54272) não deve exibir aviso da LT62.

Workflow `.github/workflows/build-v072-lt-drive-update-signed.yml` compila versão `0.00.72`, código `54272`, usando a assinatura persistente existente nos segredos GitHub Actions; verifica identidade do app e a assinatura antes de disponibilizar um artefato. Homologação Samsung continua pendente; não fazer merge em `main` nem marcar PR como Ready.
