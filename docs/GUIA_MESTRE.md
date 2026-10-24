
---

## ETAPA 8 — LT76 RELEASE PROTEGIDO E PUBLICAÇÃO REMOTA (24/10/2026)

**Autorização do proprietário:** após solicitar a etapa 8 e a publicação do APK no Drive, confirmou expressamente a operação. A LT76 é distribuída como teste público por Google Drive; a homologação física Samsung ainda é pendente e não deve ser tratada como aprovada.

### Fonte, versão e proteções

- Branch de desenvolvimento: `feature/support-mission-v2-20261024`, preservando `main` e PRs Draft #34 e #49.
- Fonte exata do APK: commit `6916be5b2d0e13ddcb94f38baa993980cebad854`. Este documento é alterado por commit posterior, sem recompilação do APK.
- Workflow de release: `.github/workflows/build-v076-support-mission-release.yml`. GitHub Actions [40125870288](https://github.com/LucianoToscano/PokeSearch/actions/runs/40125870288): **SUCCESS**; artefato privado originário `12573141700`.
- Versão pública instalada: `versionName=0.00.76`, `versionCode=54276`, `applicationId=com.lucianotoscano.pokesearch`, `namespace=com.lucianotoscano.pokesearchoverlay`.
- Nome original do artefato de CI `PokeSearch-v0.00.76-LT-MissaoV2-release.apk`; nome **público obrigatório** `PokeSearch-v0.00.76-LT.apk` (exigência exata de `UpdatePolicy.validVersion`). Mudança de nome NÃO muda bytes nem assinatura.
- APK release de `:app:assembleRelease`, não depurável, R8/minify e shrinkResources; SHA-256 `889e7193b9f2fd87a1a96b2bfb6d3842c3630215e52a93287c6428d50fb7940c` e tamanho `38443571` bytes.
- Certificado persistente LT75 compatível: SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` (verificação automática `apksigner` scheme v2). Nenhum segredo enviado ao repositório, manifesto ou Drive.
- CI aprovou contratos da Missão V2, 21 suítes históricas JS, políticas Java, testes Android e validação de assinatura do APK.

### Drive oficial — arquivos e distribuição

- Pasta **Atualizacoes_PokeSearch**: https://drive.google.com/drive/folders/1qzfJjtR4B4PQb9WCKZDHv-d9p0wMqBA-
- APK LT76 **publicado no Drive e compartilhado para leitura por link**: ID `1RS1NbEhzfzzAz3eD87BVbAZYnjn9nl-l`, nome `PokeSearch-v0.00.76-LT.apk`, https://drive.google.com/file/d/1RS1NbEhzfzzAz3eD87BVbAZYnjn9nl-l/view
- Download esperado pelo app: https://drive.google.com/uc?export=download&id=1RS1NbEhzfzzAz3eD87BVbAZYnjn9nl-l
- **Arquivo manifesto estável preservado:** `atualizacao.json`, ID `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf`, no mesmo local e com leitura por link. Modificado in-place sem alterar o ID fixo consultado por `UpdateCenter`.
- **Manifesto ativo validado por readback após a gravação:** schema `pokesearch-update-v1`, `enabled=true`, `versionName=0.00.76`, `versionCode=54276`, `apkName=PokeSearch-v0.00.76-LT.apk`, `apkFileId` LT76, `apkUrl` exato, `apkSha256` exato, `forceUpdate=false`, `status=lt76_publicado_missao_v2`. O JSON é UTF-8 puro, sem BOM, começa em `{`, tem 857 bytes e satisfaz validações estritas do parser Android.
- Backup pré-publicação LT75: `atualizacao_LT75_backup_antes_LT76.json`, ID `1CkcVLuLiCDliBvxSwDZOBzijAmaG64-N`, 624 bytes; conferido byte a byte com o manifesto LT75 anterior. LT75 permanece disponível no Drive.
- A versão LT76 foi baixada novamente **do Google Drive** e seu hash SHA-256 recalculado localmente, coincidindo com o hash do GitHub Actions (não apenas tamanho/metadata).
- Materiais intermediários temporários usados para transferência do JSON foram apagados do Drive e movidos para lixeira na Biblioteca; pasta oficial e arquivos históricos preservados.

### Comportamento e validações pendentes

- `UpdateCenter` da Home consulta `atualizacao.json` público, respeita `enabled`, só exibe versões com `versionCode` superior à instalada, mantém opção de dispensar aviso e abre explicitamente o link no navegador; não instala automaticamente.
- Instalação efetiva no Samsung (LT75 -> LT76), preservação de preferências, assinatura em dispositivos físicos, 02A/02B, quatro temas, gatilhos de 10 aberturas/100 minutos, 15 dias de cooldown, Pix em app bancário **sem efetuar pagamento**, overlay/Editor Visual/filtros e resultados continuam **pendentes de homologação física**. Não afirmar que foram verificados por CI.
- **Publicação remota LT76 finalizada**, com backup para rollback; nenhum merge e nenhuma alteração à `main`, aos PRs #34/#49 ou à chave Pix.
