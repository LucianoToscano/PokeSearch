# CONTINUAR POKESEARCH — APÓS LT267 (preparar LT268)

Continue o desenvolvimento REAL do aplicativo Android PokeSearch, repositório:
https://github.com/LucianoToscano/PokeSearch

## Estado comprovado, não recomeçar da LT265
- **Release oficial:** LT267 · 0.02.67 · versionCode 54471 · label 51271.
- **Tag:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.67-54471
- **APK:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.67-54471/PokeSearch-v0.02.67-LT.apk
- **SHA-256:** a25c9a6b56408d532359b516066ff5c571d6c958ffb1e9d7be230c300f6c3250
- **Tamanho:** 33.059.748 bytes; release pública estável.
- **Workflow de publicação:** https://github.com/LucianoToscano/PokeSearch/actions/runs/42254494312 — preflight e publish SUCCESS; APK assinada permanentemente, integridade validada.
- **QA assinada pós-release:** https://github.com/LucianoToscano/PokeSearch/actions/runs/42257888047 — SUCCESS no commit 1d4ae1d856a1d3951e452314e7d4c05970c8d01a; build protegido, Node/Java e 128 sprites de evento conferidos.
- **PRs mescladas:** #247, #248, #249, #250, #251, #252, #253.
- **Rollback público:** LT266 · 0.02.66/code 54470. Testes físicos Samsung ainda NÃO realizados; atualização instalada e Drive NÃO confirmados.

## Documentação a ler primeiro
1. docs/GUIA_MESTRE.md
2. docs/LT267_AUDITORIA_FINAL_POS_RELEASE_20261106.md
3. docs/LT267_AUDITORIA_SPRITES_ICONES_RAIDES_20261106.md
4. docs/PROMPT_NOVO_CHAT_LT268_20261106.md
5. docs/LT265_AUDITORIA_PTBR_COMPACTACAO_20261106.md

## Preservar todas as funções da LT267
Duas Pokébolas independentes, overlays/candy, favoritos, filtros, busca e localização com ordenação automática, IV 0/100/raw/percentual, Rank Classe e Rank Geral distintos, Liga Copa/GL/UL/ML, PvP, evoluções/Megas, calculadora (IV A/B, PC, PS, níveis, PC-alvo e limites das ligas), Raides por TIPO e sem ranking de counters atuais, movimentos legados/MT Elite, sprites por forma/costume/shiny, alertas, atualização OTA e APK com a assinatura permanente, compactação P/M/G.

Ícones LT267: 18 tipos PNG_512 locais e transparentes; RG próprio; Copa na LC; novos Mega e Sombroso (mostrar Shadow só quando confirmado). As 18 artes LT266 ficam em docs/legacy-assets/lt266-types/ para rollback, não duplicar no APK. Sprites exatos Pikachu Diwali e as quatro cores de Squawkabilly normal/Shiny; site de origem verificado prioritário. O manifesto de trajes contém 128 arquivos: 124 PokeMiners pinados + 4 de evento LT144 de origem hash-pinnada. Nunca converter 128 em 124/116/106 por suposição.

## Objetivo LT268
Auditar primeiro a versão pública e os arquivos reais. Melhorar a legibilidade no Samsung, principalmente contraste dos pergaminhos/ícones e ausência de cortes nos cartões P/M/G; revisar rolagem, deslocamento, abrir/retrair painéis e atualizador do app. Confirmar calculadora com Weedle, evoluções, formas, Mega e casos PvP limítrofes, comparando IV A/B, PC, PS, nível, limites LC/GL/UL/ML. Verificar Sprite Diwali, Squawkabilly cores, Shellos Leste/Oeste, especiais/Shiny antes de alterar fallback. Conferir traduções PT-BR do Fletchling, Talonflame, Pidgey e Pidgeot exclusivamente contra fonte versionada/IDs: quando fonte não cobrir, marcar sem tradução confirmada, jamais inventar golpes. Em Raides manter 1 Ágil e 1 Carregado se a fonte só oferecer essa combinação; jamais criar segundo ataque recomendado sem dados.

## Procedimento obrigatório para implementação e nova release
1. Conferir releases/latest, HEAD da main, PRs/Actions e docs.
2. Inspecionar código, testes e capturas reais, e registrar hipóteses antes de alterações.
3. Corrigir somente problemas reproduzidos; preservar funcionalidades e UI compacta/transparente, sem retirar testes para obter CI verde.
4. Testar Node completo, Java, visual WebView P/M/G, PvE, OTA/assinatura e build APK. Verificar 18 ícones PNG e 128 sprites.
5. Abrir PR, obter gates verdes, fazer merge; antes de nova release conferir assinatura permanente, orçamento <35 MB, conteúdo e SHA-256.
6. Solicitar publicação oficial LT268 apenas se houver mudanças aprovadas, verificar workflow publish=success, release pública, nome do APK, versão e hash. Nunca dizer que APK foi instalada, Drive sincronizado ou Samsung testado sem evidência.
7. Atualizar Guia Mestre, auditoria, resultados físicos pendentes e prompt de continuidade da próxima versão; fazer auditoria pós-release.

Não empobrecer o PokeSearch. Priorizar confiabilidade, simplicidade progressiva, simetria, performance e nomes BR sem perder funcionalidades.
