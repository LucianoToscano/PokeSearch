# LEIA PRIMEIRO — PokeSearch LT306 Edu (07/11/2026)

**LEITURA OBRIGATÓRIA DE CONTINUIDADE:** [manual completo de GitHub, CI, build, APK assinado, merge, OTA, Drive, Arquivo Mestre e recuperação](docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md). Verifique o estado remoto antes de agir e preserve o protocolo de consentimento. Este documento não transfere acesso, secrets nem permissões entre contas.

**Fonte oficial:** https://github.com/LucianoToscano/PokeSearch

**Estado oficial verificado em 07/11/2026:** **LT306 — 0.03.06 — versionCode 54512 — label 51310**. Release/latest [`v0.03.06-54512`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.06-54512), APK [`PokeSearch-v0.03.06-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.06-54512/PokeSearch-v0.03.06-LT.apk), 34.033.684 bytes, SHA-256 `7acad66adb80c2c00cd6d247bd65ae3f9f6fdfd27bb1c3f911a1c15d36ffa64a`. PR #304 integrada por squash `6993f98b875f666030df8f199603450336056b22`; fonte oficial `fc10717686fea8af27d0a960cfc7628065d7c2a9`, workflow [#42409882851](https://github.com/LucianoToscano/PokeSearch/actions/runs/42409882851) `completed/success`, certificado Android permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. **Visual:** balão único branco sem fundo externo, cauda lateral apontando para Edu, botões independentes e arraste conjunto. **QA físico Samsung com este novo layout ainda pendente**; testes automatizados não comprovam aparência final. LT305 e anteriores são históricos, nunca usar como base de downgrade. Ver o [Guia Mestre](docs/GUIA_MESTRE.md) e o [relatório LT306](docs/LT306_EDU_BALAODIALOGO_SOLTO_SEM_PAINEL_20261107.md).

**Prioridade atual:** validar fisicamente a **LT306** no Samsung: balão realmente solto e sem fundo escuro, cauda ao lado da sprite, botões independentes, largura e posição em jogo, G=100 pixels físicos, gesto longo de 1,2 s, conversa de passes/coords e fluxo D−1/D. **OCR PT-BR/EN e UI nova ainda NÃO foram homologados no aparelho**. Leia [Guia Mestre](docs/GUIA_MESTRE.md) e os registros especializados [balões](docs/LT304_EDU_BALOES_QUADRINHOS_AJUSTES_OCULTOS_20261107.md) e [conversa](docs/LT304_EDU_CONVERSA_GUIADA_PASSES_HAVAI_NZ_D_20261107.md). Não anunciar instalação automática.

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
