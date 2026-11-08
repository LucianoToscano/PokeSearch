# LEIA PRIMEIRO — PokeSearch LT307 Edu (08/11/2026)

**LEITURA OBRIGATÓRIA DE CONTINUIDADE:** [manual completo de GitHub, CI, build, APK assinado, merge, OTA, Drive, Arquivo Mestre e recuperação](docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md). Verifique o estado remoto antes de agir e preserve o protocolo de consentimento. Este documento não transfere acesso, secrets nem permissões entre contas.

**Fonte oficial:** https://github.com/LucianoToscano/PokeSearch

**Estado oficial verificado em 08/11/2026:** **LT307 — 0.03.07 — versionCode 54513 — label 51311**. Release/latest [`v0.03.07-54513`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.07-54513), APK [`PokeSearch-v0.03.07-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.07-54513/PokeSearch-v0.03.07-LT.apk), **34.035.016 bytes**, SHA-256 `74cb0c10d4f262146827f1890657943cb9fe0e0814c8d33cecc8d39f07facb2b`. PR #305 mesclada por squash `f042f7fa09a429fc24b6141370944b54057f4c56`; fonte oficial `b9e772b77051d07e9de150bcf5f7b2710db40612`, workflow [#42462978668](https://github.com/LucianoToscano/PokeSearch/actions/runs/42462978668) `completed/success`; assinatura permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` validada. **Novidade:** Edu segue o roteiro do vídeo/TXT/PDF do usuário em vez de uma ordem resumida incorreta; Havaí inicial sem reinício, retorno com reinício; Nova Zelândia para conferência do passe e recuperação local, Kiribati depois de evento iniciado. Método relatado sem garantia; Samsung/OCR ainda não homologados fisicamente. **Não restaurar LT306 ou qualquer versão anterior.** Ver [Guia Mestre](docs/GUIA_MESTRE.md) e [auditoria LT307](docs/LT307_EDU_ROTEIRO_VIDEO_TXT_PDF_20261108.md).

**Prioridade atual:** validar a LT307 no Samsung, incluindo balão branco sem painel externo, cauda e botões soltos, G=100px, toque longo 1,2s, ordem Havaí→NZ reide→Havaí reinício→NZ, nova conferência após reinício na própria NZ, fase Kiribati somente após início do evento, passagem D−1/D, permissões Android e OCR PT-BR/EN. **Testes automatizados e Release publicados não equivalem a teste físico concluído**. Horários 31/10 e número de passes anunciados no vídeo são apenas relato histórico. Instalação exige confirmação do Android.

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
