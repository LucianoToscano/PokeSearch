# LEIA PRIMEIRO — PokeSearch LT313 Edu (08/11/2026)

**BASE OFICIAL ATUAL:** **LT313 · 0.03.13 · versionCode 54519 · label 51317**, [Release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.13-54519), APK **`PokeSearch-v0.03.13-LT.apk`** de **34.949.360 bytes**, SHA-256 `ec1a85fbcd37483cfde7823797b22c4fca53bef303d43ec01128c01282652b3f`. [Workflow oficial #42498529759](https://github.com/LucianoToscano/PokeSearch/actions/runs/42498529759) **completed/success**. [PR #312](https://github.com/LucianoToscano/PokeSearch/pull/312) integrada por squash `36754a72f6d08f1dd8ad107b1b5b42dd5c186d72`. Pedido oficial commit `b61bd0220b325bd944d586f7aab66ed2f0406bc7`. **Não restaurar versões antigas nem começar pela LT308/LT312**. Verificar HEAD e Release/latest em tempo real a cada novo chat.

**Foco LT313:** normalizar a identidade e as proporções do Edu nas **22 poses ociosas**. Novo atlas local `app/src/main/assets/edu_avatar_idle_consistent_22.webp` (WebP VP8L 256 cores, 1024×384, 22 sprites transparentes de 128×128 px, 59.618 bytes, SHA-256 `9ec3afa294d06d9d1cad9db8d4a3256e5f7230623f58cd6819e835192eee1a62`). Cabeça/rosto/corpo no mesmo estilo, altura corporal 112px, pés Y=120. A nova imagem substitui visualmente 22 quadros pelos índices originais, sem mexer nas demais 45 poses ou nas 67 referências. Fallback para o atlas anterior se necessário, mantendo P/M/G 50/75/100, sem blur e com ciclo ocioso em sequências e pausas naturais. **QA físico Samsung permanece pendente**.

**Base LT312 preservada:** relógio único automático/manual do Edu, correção da data histórica do Mega Chandelure (31/10/2026, 14h–17h no horário LOCAL da região IANA), sem Kiribati obrigatório, 67 sprites, 22 animações idle, tutorial E01–E11, balões, assinatura, P1/P2, Doce Raro e APIs. Nunca afirmar obtenção real de passes, mudança de GPS ou instalação física que não tenham sido verificadas.

**LEIA AGORA:** `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`, `docs/LT313_EDU_22_POSES_IDENTIDADE_VISUAL_20261108.md` e `docs/PROMPT_CONTINUIDADE_LT313_EDU_20261108.md`. Não divulgar segredos/keystore e não relaxar verificação do APK.

---

## Registro histórico LT308 e anteriores (não é a base atual)

**LEITURA OBRIGATÓRIA DE CONTINUIDADE:** [manual completo de GitHub, CI, build, APK assinado, merge, OTA, Drive, Arquivo Mestre e recuperação](docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md). Verifique o estado remoto antes de agir e preserve o protocolo de consentimento. Este documento não transfere acesso, secrets nem permissões entre contas.

**Fonte oficial:** https://github.com/LucianoToscano/PokeSearch

**Estado oficial verificado em 08/11/2026:** **LT308 · 0.03.08 · versionCode 54514 · label 51312**. [Release/latest v0.03.08-54514](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.08-54514), APK público [`PokeSearch-v0.03.08-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.08-54514/PokeSearch-v0.03.08-LT.apk), **34.035.668 bytes**, SHA-256 `c693b8c28be6536d91c6774c17d8c6867a685091232b06bf8a8bf8624a217871`. PR #306 por squash `60581c4ef69e1c85a4a35e8e0fc687309cd5c598`; fonte do APK/pedido oficial `25873554634f66d8af202d5f5a8eb081db6ebf9a`; [workflow permanente #42472319313](https://github.com/LucianoToscano/PokeSearch/actions/runs/42472319313) `completed/success`. Certificado v2 original fingerprint `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` validado. **Mudança principal:** Edu usa relógio único na Home (ao lado do ícone dos passes), com menu Data e hora semelhante ao Samsung (automático/manual, fuso e 24h); não há simulador separado dentro do personagem. O dia D−1/D é baseado no mesmo horário/fuso exibido. **QA físico Samsung e OCR ainda pendentes**; horários manuais não são fonte oficial de rede. Ver [GUIA MESTRE](docs/GUIA_MESTRE.md) e [prompt pós-LT308](docs/PROMPT_CONTINUIDADE_LT308_EDU_APOS_RELOGIO_20261108.md). LT307 e anteriores são históricos; não fazer downgrade.

**Prioridade atual:** após instalar a LT308 no Samsung, verificar visualmente relógio ao lado dos passes, interruptores automáticos/manuais, calendário/hora, formato 12/24h, fuso, virada de dia e retomada; a conversa Edu deve usar o mesmo relógio sem botões de simulação. Continuar **uma peça por vez**, segundo as próximas instruções do proprietário, sem novos botões/painéis por iniciativa própria. Preservar assinatura, P1/P2, Doce Raro e API. Não declarar instalação ou QA físico até evidência em aparelho.

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
