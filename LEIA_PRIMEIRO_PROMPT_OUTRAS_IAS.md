# LEIA PRIMEIRO — PokeSearch LT305 Edu (07/11/2026)

**LEITURA OBRIGATÓRIA DE CONTINUIDADE:** [manual completo de GitHub, CI, build, APK assinado, merge, OTA, Drive, Arquivo Mestre e recuperação](docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md). Verifique o estado remoto antes de agir e preserve o protocolo de consentimento. Este documento não transfere acesso, secrets nem permissões entre contas.

**Fonte oficial:** https://github.com/LucianoToscano/PokeSearch

**Estado oficial verificado em 07/11/2026:** **LT305 — 0.03.05 — versionCode 54511 — label 51309**, [Release/latest v0.03.05-54511](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.05-54511), APK `PokeSearch-v0.03.05-LT.apk` (34.033.264 bytes, SHA-256 `9d20b6dbe607a13a442d41d8c7e4aca6c717ff5be0632226a08f9a0ce687754d`). GitHub Actions oficial [#42407546825](https://github.com/LucianoToscano/PokeSearch/actions/runs/42407546825) **completed/success**; fonte de publicação `7cb70daec956b8f6991cea7d200fab6a6c4468a5`; PR #302 mesclada por squash `58859a5b65ec2b933540f3652d2cde79456d035b`. Certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, v2 validado no workflow. LT304, QA1/QA2 e LT227 são **históricos**, nunca restaurar versões antigas como base.

**Prioridade atual:** validação física do **Edu — Assistente do Dia de Reides** no Samsung: balões brancos de quadrinhos, personagem G=100 pixels físicos, toque longo de 1,2 s para configurações ocultas, arraste, conversa com passe, coordenadas tocáveis e separação D−1/D. A LT305 está publicada, **mas Samsung/OCR PT-BR/EN ainda NÃO foram homologados**. Leia [Guia Mestre](docs/GUIA_MESTRE.md) e os registros especializados [balões](docs/LT304_EDU_BALOES_QUADRINHOS_AJUSTES_OCULTOS_20261107.md) e [conversa](docs/LT304_EDU_CONVERSA_GUIADA_PASSES_HAVAI_NZ_D_20261107.md). Não anunciar instalação automática.

**Histórico — novidades da LT227 (não é base atual):** sprites P/M/G nos resultados com escala da área alfa visível, moldura opcional e Sem fundo sem sombras/bordas, preservando duas Pokébolas, preferências independentes e os filtros. É um hotfix incremental, não um projeto novo.

**IMPORTANTE:** este arquivo pode ser posterior ao commit de fonte do APK. Antes de auditar, verificar o HEAD, Release/latest e versão do pacote ZIP realmente recebido. Não afirmar QA Samsung, sessão real de API ou instalação sem evidências. Atualizações estáveis e assinatura só com autorização explícita do dono. Não publicar credenciais.

## Para qualquer IA que receba o pacote editável

1. Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT215_INVENTARIO_RECRIACAO_AUDITORIA_20261101.md`, `settings.gradle.kts`, `app/build.gradle.kts`, `app/src/main/AndroidManifest.xml` e os testes antes de editar.
2. Confira commit real, tags e hashes no GitHub. Não confunda versão declarada de build com versão efetivamente publicada.
3. Preserve `applicationId=com.lucianotoscano.pokesearch`, namespace, assinatura permanente e versionCode monotônico, login independente, duas Pokébolas e limite máximo de dez resultados.
4. Fonte oficial dos resultados é a API PoGoCoordinates, sem proxy/backend improvisado; respeite HTTP 429, Retry-After, segurança do WebView, autenticação e termos do provedor.
5. Doce Raro tem cooldown informativo, que não é cronômetro automático de coleta: somente confirmação de coleta cria referência. O raio de busca é distinto da distância real entre coletas.
6. LT214: abertura da Localização tenta preencher texto válido da área de transferência e mostra cooldown informativo ao tocar no título ou arrastar raio. Clipboard não dispara busca.
7. Não modifique chat/Firebase nesta etapa sem solicitação expressa. Não disponibilize arquivos com chaves privadas, keystore, tokens, JWTs ou credenciais.
8. Após mudanças, execute testes Node, Java, OTA, Android, verificação de R8, assinatura v2, SHA-256 e teste físico Samsung. Faça release apenas com evidências claras.

## Recriação

Este repositório contém **código-fonte editável, documentação e scripts**. A compilação exige JDK 17, Gradle 8.11.1, Android SDK 36, Node.js e Python 3 para scripts de assets. Os recursos externos necessários precisam estar disponíveis. A identidade do aplicativo original só pode ser mantida nas atualizações se for usada a **chave privada original**, que não integra o ZIP. Consulte inventário e workflows para variáveis e etapas exatas.
