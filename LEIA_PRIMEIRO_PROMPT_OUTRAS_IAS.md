# LEIA PRIMEIRO — PokeSearch LT304 Edu (07/11/2026)

**LEITURA OBRIGATÓRIA DE CONTINUIDADE:** [manual completo de GitHub, CI, build, APK assinado, merge, OTA, Drive, Arquivo Mestre e recuperação](docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md). Verifique o estado remoto antes de agir e preserve o protocolo de consentimento. Este documento não transfere acesso, secrets nem permissões entre contas.

**Fonte oficial:** https://github.com/LucianoToscano/PokeSearch

**Estado oficial verificado em 07/11/2026:** **LT304 (0.03.04, versionCode 54510)**, release pública `v0.03.04-54510`, APK `PokeSearch-v0.03.04-LT.apk`, 34.032.628 bytes, SHA-256 `b8b5073e272a958676f068e2eba7ede79762608975f175d9946840bacce375b4`. Fonte de publicação `e467a1fa524b52dd8d173584a2912636e9c62e4f`; PR #300 integrada por squash `9c391c4a0c8b92ff8735640b9539fa1d6f714289`; workflow oficial [#42400096648](https://github.com/LucianoToscano/PokeSearch/actions/runs/42400096648) **SUCCESS**. O certificado permanente SHA-256 permanece `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. A `main` foi verificada em `bc4453a2fa0fae068b49c43857cfa978da0dbd79` (alterações documentais posteriores à publicação). A **LT304 é a base**; QA1 54508, QA2 54509 e LT227 são históricos e **não** devem substituir a versão pública.

**Prioridade atual:** validação física do **Edu — Assistente do Dia de Reides** no Samsung (balões compactos, avatar G=100 px, arraste, simulação fictícia hoje, permissão de tela sem overlays, progresso, várias reides e coexistência P1/P2/Doce Raro). O QA automatizado e a Release foram confirmados, **não** a homologação física. Seguir [checklist Samsung LT304](docs/LT304_EDU_CHECKLIST_QA_FISICO_SAMSUNG_20261107.md). Não publicar nem mesclar sem autorização expressa. Os parágrafos abaixo sobre LT227 permanecem **somente como histórico**.

**Histórico — novidades LT227:** sprites P/M/G nos resultados com escala da área alfa visível, moldura opcional e Sem fundo sem sombras/bordas, preservando duas Pokébolas, preferências independentes e os filtros. É um hotfix incremental, não um projeto novo.

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
