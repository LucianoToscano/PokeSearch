# Protocolo obrigatório — entrega de APK sem dependência do ChatGPT

**Criado:** 27/10/2026 — reincidência demonstrada por captura Android com toast `Library file not found`.

## Natureza e severidade

O erro `Library file not found` aparece ao abrir um arquivo/anexo do ChatGPT. Ele não é, por si, erro de compilação, ausência no repositório, invalidade do APK nem problema de Android. Pode ocorrer mesmo quando o APK está íntegro no container de geração; não é possível garantir ou corrigir a disponibilidade do link interno de outra interface somente mudando o PokeSearch. **Tratar como problema recorrente de distribuição (bloqueador de entrega), nunca pedir para o usuário repetir tentativas do mesmo link.**

## Ordem obrigatória de publicação QA

1. Conferir GitHub Actions **SUCCESS** na branch/commit exato; verificar se o artifact existe, não expirou e tem tamanho plausível.
2. O primeiro link de resposta é sempre o **GitHub Actions artifact verificado**, com link da execução e indicação de que poderá exigir login no GitHub e que tem validade limitada. Não trocar por uma URL imaginada de CDN. Se a publicação persistente for necessária, solicitar/usar autorização específica para um GitHub Release; não criar release oficial silenciosamente.
3. Publicar como fallback, quando verificado no container da conversa atual, um link `sandbox:/mnt/data/arquivo`. A existência local não garante que a entrega ChatGPT funcione no cliente Android; não afirmar sucesso da experiência de download.
4. Registrar no mesmo texto: `versionName`, `versionCode`, `SOURCE_COMMIT`, SHA-256 do APK, tamanho em bytes, certificado v2, hash do ZIP e limite ZIP inferior a 199 MB.
5. ZIP deve conter exatamente o APK identificado + checksums/relatórios; abrir com zipfile e conferir CRC/hash após extração; não reutilizar link de outra sessão sem confirmar arquivo.
6. Em falha no link interno, **usar o artefato GitHub já existente**. Não recompilar para tentar corrigir o toast. Caso o artifact esteja expirado, gerar artefato novo sem mudar o binário e registrar digest idêntico, se houver permissão e infraestrutura para isso.
7. Não declarar `APK entregue/instalado/testado no Samsung` só porque o build CI aprovou. O usuário precisa conseguir abrir/instalar pelo canal escolhido.

## Exemplo real — LT126 QA

- Versão: `0.01.26` / `54331`.
- Source commit assinado: `4e8475af7c093ffd70be63364f2d1bf64d846bc8`.
- APK: `PokeSearch-v0.01.26-LT126-Chat-WWM-QA.apk`; 43.337.972 bytes.
- SHA-256 APK: `ba9e8b0ce32111567233646c31250b659e91985fb5d9da0d01d83d23a0c9bd0b`.
- Assinatura Android v2: certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Artefato GitHub: https://github.com/LucianoToscano/PokeSearch/actions/runs/40446596976/artifacts/12708327476
- Workflow GitHub: https://github.com/LucianoToscano/PokeSearch/actions/runs/40446596976
- ZIP do GitHub Actions: 40.852.206 bytes, SHA-256 `6c1f0178617a9e4ce0bc08f8629f842b3a670ab93f1175a6f6d9d4c1440cf069`; contagem e hash auditados. Artifact existente (verificado em 27/10/2026), data de expiração informada pelo GitHub 26/11/2026.
- Cópia local validada em 27/10/2026: `/mnt/data/PokeSearch-LT126-QA-DOWNLOAD.apk`; bytes/sha-256 idênticos; ZIP adicional com relatórios íntegro em `/mnt/data/PokeSearch-LT126-QA-DOWNLOAD-COM-RELATORIOS.zip`. **Esses caminhos de runtime não devem ser presumidos em outras sessões.**

## Critérios de aceite e retrospectiva

- CI: **binário válido** ≠ **download pelo ChatGPT válido** ≠ **teste físico no Samsung**.
- Solução preventiva viável: redundância GitHub + sandbox opcional e evidência dos bytes, com prioridade ao canal menos sujeito a essa falha. Não há como assegurar que o erro da própria plataforma ChatGPT nunca volte a surgir.
- Manter rastreabilidade em GitHub Issue permanente para reincidências; não repetir o ciclo `Library file not found` → gerar novo arquivo `sandbox` → mesmo erro.
