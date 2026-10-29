# LT174 (QA) — preflight de compatibilidade OTA — 29/10/2026

## Base oficial e escopo
- Base canônica mantida: LT173 `0.01.73 / 54378`, `v0.01.73-54378`.
- Não há mudança de `versionName`, `versionCode`, certificado, Java Android, layout, navegação, conta ou dados.
- Nenhum APK novo, release, pacote assinado, mudança de `ota/channel.json`, merge ou atualização aos usuários é produzido nesta etapa.
- A `main` posterior ao tag LT173 continha somente alterações documentais (comparação GitHub); não havia recursos elegíveis para pacote OTA.
- Regra da base oficial: não recomeçar o projeto, preservar Pokébola 1/2, contas e treinadores VIP independentes, cache/sprites, bridge e atualização APK existente.

## Falha preventiva corrigida
A primeira versão de `scripts/build_ota_pack.py` selecionava arquivos compatíveis por allowlist, mas não recusava um pacote se outros arquivos nativos ou assets não elegíveis também tivessem mudado desde o tag base. Um HTML/JS de revisão posterior poderia depender de APIs Java ou dados ausentes na LT173 instalada.

O preflight LT174 falha fechado ANTES de gerar manifesto quando o diff entre o tag de base e o HEAD inclui:
- conteúdo sob `app/src/main/` diferente dos arquivos explicitamente permitidos para OTA, incluindo Java, AndroidManifest, recursos e assets fora da allowlist;
- alterações em build Gradle, ProGuard ou wrapper Gradle;
- exclusões de assets dentro de `app/src/main/assets/` que o protocolo cumulativo v1 não representa.

Mantêm-se os limites atuais de pacote (64 arquivos, 8 MiB somados e 3 MiB por arquivo), as verificações SHA-256, assinatura por certificado permanente no runner protegido, staging/rollback e whitelist estrita. A função de distribuição manual passa a executar a regressão Python antes de assinar ou publicar qualquer pacote.

## Regressões de integração criadas
O teste `scripts/test_ota_builder.py` passa a simular um repositório temporário com:
1. alteração permitida de HTML e PNG (passa);
2. novo JS restrito, ausente no APK-base (falha);
3. alteração Java nativa (falha);
4. exclusão de recurso antigo (falha).

A workflow de PR para LT173 já executa o gerador e os testes; a workflow manual `ota-publish-signed.yml` executa a mesma pré-validação.

## Estado e critérios para ativação
- **Status atual:** implementação em branch de QA; a execução de CI e seu resultado devem ser avaliados na PR correspondente.
- `ota/channel.json` segue em `{"packVersion":0}`, sem qualquer pacote ativo.
- Não ativar a publicação por mera mudança documental. Exigir alteração real elegível, pacote não vazio, assinatura, inspeção dos arquivos do manifesto e teste em Samsung/Moto, com API ON/OFF e duas Pokébolas.
- Após testes físicos, solicitar aprovação expressa para usar o workflow manual protegido `ota-publish-signed.yml`. Somente ele deve assinar e habilitar o ponteiro do OTA.
- Correções nativas devem ser lançadas via APK completo assinado; neste caso usar uma nova baseline validada antes de admitir novos recursos OTA para aquela versão.
- O rollback automático documentado em LT173 cobre integridade de pacote armazenado. Reversão remota de um pacote assinado porém funcionalmente defeituoso ainda exige estratégia específica e QA: **não presumir um kill-switch de OTA instalado**.

## Referências
- [LT173 oficial](ESTADO_CANONICO_LT173_OFICIAL_20261029.md)
- [Política de OTA LT173](LT173_OTA_ASSINADO_BASE_LT172_20261029.md)
- [Workflow de publicação assinada](../.github/workflows/ota-publish-signed.yml)
