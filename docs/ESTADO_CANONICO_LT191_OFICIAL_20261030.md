# PokeSearch LT191 — estado canônico da publicação oficial (30/10/2026)

## Release verificada
- **Versão pública oficial:** LT191 `0.01.91`, `versionCode=54396`, SOURCE_COMMIT `c73c5ca0f15728c8896e3da4fcc6d2cce23f556f`.
- [GitHub Releases/latest](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.91-54396), não draft nem prerelease, contém `PokeSearch-v0.01.91-LT.apk`.
- **APK:** 29.015.817 bytes, **SHA-256 `bc8d44627d67907a7a61647bf13e637addd85e7c2850ec4de47fda0c730f62dd`**.
- [GitHub Actions #41019720898](https://github.com/LucianoToscano/PokeSearch/actions/runs/41019720898) **SUCCESS**: Node/OTA, recursos completos, build Gradle R8, versão/package, certificado v2 permanente, hash do APK, upload e verificação do mesmo hash na release.
- **Assinatura permanente** SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; identidade `com.lucianotoscano.pokesearch` intacta.
- PR [#151](https://github.com/LucianoToscano/PokeSearch/pull/151) mesclada em `c73c5ca0f15728c8896e3da4fcc6d2cce23f556f`. Nenhuma reinstalação limpa exigida: atualizar por cima preservando conta e preferências.

## Alterações
1. `Retry-After: 7200` e prazos até 86400 s agora são respeitados nas buscas API; antes o teto 3600 descartava durações maiores e transformava em 60 s. A regra de espera compartilhada P1/P2 permanece, com retomada escalonada e sem contorno de limite.
2. `api_browser_transport.js`, `api_android_session.js`, `OverlayService.java`, `rare_candy_probe.js`, `RareCandyOverlayService.java` e `probe.js` adaptados para espera de até 24 h onde aplicável.
3. Erros HTTP 400/422, 401, 403 e timeout com textos mais úteis sem corpos de resposta, JWT ou PII. Menu de Get coords mantém contador oculto e limites internos.
4. Nova suíte `app/tests/lt191-provider-backoff-24h.test.js`; código e CI validados, assinatura e verificação da release concluídas.

## Google Drive e distribuição
- **Novo ZIP de distribuição verificado:** [PokeSearch-LT191-APK-Oficial-Assinado-Relatorios.zip](https://drive.google.com/file/d/1skCB1VGUcCwaV3xBIdxCc22SPe0fA0FA/view), **26.718.909 bytes**, MIME ZIP, conteúdo verificado (CRC sem erros; APK interno 29.015.817 bytes, hash idêntico à release). O ZIP contém APK, SHA256SUMS, assinatura, versão e SOURCE_COMMIT.
- O **link legado do Drive `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` ainda é LT187** (confirmado por metadados, 29.013.825 bytes); não anunciar esse link antigo como LT191. Para instalação direta, usar o APK do [GitHub](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.91-54396/PokeSearch-v0.01.91-LT.apk).
- Atualizador integrado consulta GitHub Releases/latest e pode oferecer a LT191 aos usuários. Android requer confirmação para instalar; não é instalação silenciosa.

## Limites e trabalho futuro
- **Samsung físico e API real autenticada: NÃO HOMOLOGADOS** nesta execução. 429 depende do provedor; o novo intervalo não garante liberação da conta.
- A Conta 2 deve ter seu treinador vinculado no PoGoCoordinates para acessar funções que exigem vínculo.
- Refatoração de `dock.html` e arquivamento de centenas de workflows requerem migração dedicada e testes, não exclusão em massa durante hotfix de rate-limit. Não declarar essas mudanças como feitas.
- Relatório e checklist: [LT191_AUDITORIA_CORRECOES_20261030.md](LT191_AUDITORIA_CORRECOES_20261030.md).

**Origem:** release GitHub e artefato da execução oficial lidos novamente; dados sensíveis e chave de assinatura não incluídos.
