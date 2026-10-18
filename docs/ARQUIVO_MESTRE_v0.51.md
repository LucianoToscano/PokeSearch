# PokeSearch v0.51-beta — arquivo mestre
Base: v0.50-beta; branch isolada `security/v0.51-beta`. O desenvolvimento original em `main` permanece intocado. IDs: `com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`, versionCode 51, versionName 0.51-beta, minSdk 26, targetSdk 33, compileSdk 36, JDK 17, Gradle 8.11.1, AGP 8.10.1.
## Estado
R8 release e shrinkResources habilitados; keep de entrada Android/JavaScriptInterface; FLAG_SECURE no diálogo OAuth; IntegrityGuard valida nome do pacote, SHA-256 do Pix e existência de certificado de assinatura.
**Não é distribuição final.** A checagem de certificado apenas não comprova o autor; é obrigatório fixar SHA-256 do certificado release, configurar assinatura privada e testar APK em aparelho antes de disponibilizar.
Scripts probe.js e shiny_login.js ainda não são criptografados nesta etapa. Não declarar proteção completa.
## Distribuição
Somente o APK release assinado deve ser entregue a amigos. Não enviar ZIP-fonte, mapping.txt, keystore, senhas ou segredos. APK assinado para distribuição privada; não redistribuir o keystore.
Preservar todos os documentos anteriores e funcionalidades de login, overlay, notificações, Pix e favoritos.


## Referência técnica externa — PokéLocation (18/10/2026) — NENHUMA IMPLEMENTAÇÃO AUTORIZADA
Auditoria completa e backlog por aprovação: [REFERENCIA_POKELOCATION_2026-10-18.md](REFERENCIA_POKELOCATION_2026-10-18.md).
Fontes avaliadas: https://github.com/ayranoliveira1/pokelocation (Android, AGPL-3.0-only); https://github.com/ayranoliveira1/pokelocation-server (Go/PostgreSQL/Redis, MIT); perfil https://github.com/ayranoliveira1 . O estudo trata apenas desses projetos e do APK fornecido, não implica auditoria dos demais repositórios do perfil.

**APK arquivado intacto fora dos APKs de teste:** Google Drive > Projetos > PokeSearch > 05_Referencias_Externas > PokeLocation > pokelocation-v1.2-release.apk — https://drive.google.com/file/d/1uSuww0uFIqQRyGnpYXRwJqnDsqdm76Kx/view . 2.555.264 bytes, SHA-256 d4aba3d0a813c114a0f45a9718fdaf506198d9156655c970d18cbd2e036ac5a3. O Git blob do APK enviado difere do APK referido pela árvore do upstream, mesmo com tamanho igual; motivo ainda não comprovado. Preservar ambos como referências separadas.

**Resumo verificado:** app v1.2 contém GPS fictício, joystick e rotas (NÃO aproveitar), mais cliente PoGoCoordinates com pesquisa, filtros, PvP, shiny, bolhas, catálogo/cache, login Google/Discord, alertas e atualização. O servidor tem API proxy, fila Redis, workers de alertas, controle 429/Retry-After, cursor/histórico, deduplicação por encounter_id, criptografia de tokens AES-GCM e testes. Cliente/servidor exigem conta e infraestrutura próprias; NÃO integrar nosso aplicativo ao serviço de terceiros por padrão.

**Lições técnicas aproveitáveis gradualmente (todas aguardando confirmação):** PL-01 analisar contrato real dos filtros e diferenças entre consulta mundial e mapa; PL-02 reação imediata à troca de modo + cancelamento da requisição antiga; PL-03 persistência de login e retorno confiável ao app; PL-04 tratamento de erro distinto de '0 resultados'; PL-05 cache seguro de consultas/imagens/catálogo; PL-06 Sort by, persistência e validação das opções reais; PL-07 alertas favoritos sem repetição; PL-08 histórico local opcional; PL-09 renderização incremental e despawn econômico; PL-10 diagnósticos sem tokens; PL-11 segurança/Android 15–16; PL-12 estudo eventual de backend próprio, apenas mediante decisão explícita. Detalhes, fontes, riscos e critérios de aceitação no relatório vinculado.

**Restrições permanentes:** PokeSearch independente de PvPPokeGo e de PokéLocation; preservar todas as funcionalidades existentes, overlay compacto/transparente, 18 ícones/modos, shiny próximo ao seletor de busca, 46 IV% válidas, GL#1/UL#1 independentes, até 10 Pokémon, geofiltro 0–1000 km, favoritos, notificações, Pix, relatório, copiar coordenadas e contagem de despawn; não acrescentar joystick, GPS fake, chat, clone de APK, servidores/tokens de terceiros ou permissões extras por padrão. Respeitar licenças (app AGPL-3.0-only; servidor MIT) e termos das APIs; ideias podem ser reimplementadas independentemente.

**Processo de implantação obrigatório:** propor exatamente uma etapa, esclarecer mudança/arquivos/riscos/testes → obter CONFIRMAÇÃO → implementar em branch isolada sem prejudicar o código original → testar filtros reais, login e overlay Android → submeter resultado antes da próxima etapa. STATUS GLOBAL: DOCUMENTAÇÃO REGISTRADA; IMPLEMENTAÇÃO NÃO INICIADA.
