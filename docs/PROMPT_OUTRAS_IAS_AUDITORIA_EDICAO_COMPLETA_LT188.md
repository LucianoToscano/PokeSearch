# PROMPT MESTRE PARA OUTRAS IAs — POKESEARCH LT188
## AUDITORIA, CONTINUIDADE, REVISÃO E EDIÇÃO DO CÓDIGO-FONTE REAL
Data: 30/10/2026 • Idioma obrigatório: português (Brasil)

**ESTE PROMPT É A PORTA DE ENTRADA DO PACOTE-FONTE E NÃO SUBSTITUI `docs/GUIA_MESTRE.md`.**
A referência anterior no Google Drive é `PROMPT_AUDITORIA_POKESEARCH.md` (24/10/2026). Este texto atualiza o escopo até a LT188 sem renomear o projeto, inventar arquivos nem restaurar versões antigas.

### Instrução principal para a IA receptora
> Analise TODO o repositório Android PokeSearch incluído neste ZIP com fidelidade. Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/PROTOCOLO_ENTREGA_APK_SEM_LIBRARY_NOT_FOUND.md` e o relatório LT188 antes de propor alterações. Use os arquivos **reais** e faça mudanças incrementais. Não comece outro aplicativo e não confunda PokeSearch com PvPPokeGo. Não afirme que um APK foi compilado, assinado, publicado, instalado ou testado num Samsung sem evidências verificáveis.

### Fonte de verdade
- Repositório oficial: https://github.com/LucianoToscano/PokeSearch
- A árvore deste ZIP é um snapshot de um **único commit Git**, declarado em `AUDITORIA/ORIGEM_E_INVENTARIO.json` e `AUDITORIA/SOURCE_COMMIT.txt`.
- Código editável: `app/src/main/java`, `app/src/main/assets`, `app/src/main/res`, `app/build.gradle.kts`, `build.gradle.kts`, `settings.gradle.kts`, `scripts`, `app/tests`, `functions`, `ota`, `.github/workflows`.
- Documentação oficial: `docs/GUIA_MESTRE.md` (resumo canônico) e `docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md` (histórico integral protegido). Nunca sobrescrever o backup com texto truncado.

### Identidade e continuidade
- `applicationId`: `com.lucianotoscano.pokesearch`; `namespace`: `com.lucianotoscano.pokesearchoverlay`.
- Java 17, Android compileSdk 36/targetSdk 33/minSdk 26, Gradle 8.11.1.
- Versão alvo pós-publicação: 0.01.88 — LT188; versionCode 54393. **Confirmar se o release realmente foi publicado, pois os fontes isolados não comprovam publicação.**
- Base imediatamente anterior: LT187, v0.01.87, code 54392, 29.013.825 bytes. Preservar mesma assinatura Android v2 (fingerprint SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`) sem incluir qualquer chave privada.
- Arquitetura: `OverlayService.java`, `SecondaryOverlayService.java`, WebViews `dock.html`, `probe.js`, integração PoGoCoordinates via sessão autenticada/API, duas Pokébolas, resultados por encontro, localização, filtros GL/UL/Raw IV/IV%, notificações, cache de sprites, Favoritos, Rare Candy, OTA e Home.

### Regras obrigatórias ao auditar/editar
1. **Paridade Pokébolas 1 e 2:** modificar e testar ambas. Cada serviço tem `prefs`/`prefs_secondary`, modo, conta/treinador, posição, consulta e resultados próprios. Compartilhar somente o que o código e o produto definem como global (por exemplo Favoritos).
2. **Modos GL/UL e IV:** conservar Ordenar → PC → Nível → Clima → Tamanho → Sexo → Forma; em ligas acrescentar PC PvP e Evoluções. Não transferir `pvp_min_cp`, rank UL/GL ou resultados antigos para IV personalizado/IV% após troca. Validar 0/13/13; 15/15/15; 0/0/0; IV% 0–100; top PvP #1–50.
3. **Contrato de pesquisa:** validar `/search`, `/reveal`, filtros confirmados e limite de resultados; diferenciar dados API/DOM; não fabricar IV, rank, sprite de fantasia, coordenada ou autenticação.
4. **Rede e login:** diagnosticar 401/403/429, erro de internet, OAuth Discord/Google, sessão e dois treinadores VIP sem expor JWT, cookies, chaves ou outros segredos.
5. **Resultados:** TTL/despawn, deduplicação por encontro, cópia Get coords sob demanda, distância só com coordenadas válidas, identificador da pesquisa aplicada e apresentação de prévia antiga somente se explicitamente rotulada.
6. **Interface:** clean, moderna, minimalista, compacta, sem rolagem ou textos redundantes; popups ancorados, mesma transparência/fundo dos menus e mesma escala nas duas Pokébolas e no Doce Raro.
7. **Qualidade:** verificar UI e funções, sprites/sons, Favoritos, notificações P1/P2, localização, refresh toque/segurar, Doce Raro, OTA, Home, menus, relatório de falhas, regressões e tamanho do APK.
8. **Segurança e dependências:** revisar Android WebView, JS bridges, ProGuard/R8, erros de rede, Firebase, GitHub Actions, expiração de resultados e privacidade. Não inserir segredos no ZIP. Não modificar versão, assinatura, publicação ou permissões sem aprovação específica.
9. **Testes:** executar `node app/tests/lt188-dual-mode-filters.test.js`, testes `app/tests/*.test.js`, `scripts/test_ota_builder.py`, e build Gradle somente em ambiente preparado. Validar Java/Android, assinatura e pacote. Teste automatizado NÃO comprova teste físico no Samsung.
10. **Entrega:** abrir PR com diferenças revisáveis; documentar arquivos, correções, evidências/testes, riscos remanescentes e SHA. Fazer merge, APK público e alterações no Drive somente se explicitamente autorizado pelo dono.

### Como revisar e editar sem perder o projeto
A. Confirmar `SOURCE_COMMIT.txt`, `ORIGEM_E_INVENTARIO.json`, hashes de conteúdo e se a árvore está completa. `AGENTS.md` é referência de continuidade.
B. Ler o Guia Mestre resumido e as mudanças recentes, depois abrir os módulos relevantes; evitar carregar 1,46 MB de backup de uma só vez sem necessidade.
C. Escrever inventário das funções existentes e matriz de riscos; classificar problemas como confirmados, prováveis, dependentes de servidor ou pendentes de teste.
D. Antes de alterar, registrar resultado esperado e teste que o demonstra; criar branch, editar somente arquivos necessários, rodar testes de regressão.
E. Para cada erro, verificar P1 e P2, com API ligada/desligada quando aplicável. Ao final, apresentar diffs, comandos de QA e o que não foi possível verificar.
F. Se compilar APK, checar versionCode/Name, assinatura v2, identidade, SHA-256, limite de resultado e ZIP do artefato inferior a 199 MB. Nunca declarar `Library file not found` como erro de compilação sem prova.

### Limites deste pacote
- Snapshot dos arquivos rastreados no Git na revisão declarada; não contém credenciais privadas, keystore, arquivos de build, cache Gradle ou dependências baixadas.
- Recursos gerados/baixados de fontes externas devem ser reconstruídos pelos scripts reais quando necessário, sem misturar novas versões sem registrar.
- Um ZIP de código-fonte NÃO é APK nem prova de publicação, instalação, autenticação ou autorização da API de terceiros.
- Preferir atualização incremental em vez de reconstrução do zero. **Reconstrução completa só mediante pedido específico do dono.**

### Entregáveis esperados da outra IA
Relatório de auditoria com diagnóstico e evidências, lista de melhorias priorizadas, alterações editáveis em commits/PR, testes e resultados reais, documentação no Guia Mestre, pacote completo atualizado com inventário e hash; se solicitado e autorizado, APK assinado e distribuição verificada. Nunca declarar funções testadas se não foram.

**IMPORTANTE:** Se faltar alguma ferramenta/conexão/credencial, explique a limitação exata e entregue o progresso verificável — não invente um resultado.
