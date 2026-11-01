# LT211 — Auditoria comparativa de fonte e relatórios LT206 (QA, NÃO PUBLICADA)

**Data:** 31/10/2026 (America/Fortaleza)  
**Base oficial de leitura:** `main` @ `0649f38d33192f92a69901386793b186bf042d2a`  
**Versão oficial preservada:** LT211 / `0.02.11` / `54418`  
**Escopo:** relatórios das quatro IAs na base LT206 + revisão seletiva do código mais atual da LT211. Os ZIPs originais são fontes históricas, **não** substituem a fonte LT211.

## Evidências revalidadas

1. **429 Doce Raro (P2, confirmado LT211):** `RareCandyOverlayService.providerWaitLabel()` arredondava o resto dos segundos após dividir horas, gerando `1h60m` em 7141–7199 segundos. A branch substitui exclusivamente a formatação por `ProviderWaitFormatter.format429()`, sem alterar `blockedUntil`, backoff ou cadência do provedor. Teste Java independente cobre 15 limites (inclusive overflow).
2. **Teste histórico LT74 (P3, confirmado):** ainda exigia mock de atualização removido na LT75. Reescrito para verificar ausência do mock e integridade dos fluxos atuais Drive e GitHub. Isso torna desnecessário ignorá-lo em QA.
3. **Gate oficial LT211 (P2, confirmado):** o workflow de publicação `lt211-official-release.yml` executa somente dois testes Java puros e pula LT74. Esta branch acrescenta `qa-core-contracts.yml` com todos os Java puros, toda a suíte Node e teste OTA; **não** modifica a publicação imutável já concluída.
4. **Ícone StarIVRaw (P2, confirmado LT211):** o asset é PNG RGB 1254×1254, 1.198.192 bytes e contém preto na própria imagem; blob SHA `2b9b833b0db7eb0aa004aafd4c0c67c240199991`, igual ao ZIP LT206. Requer reconstrução com canal alfa a partir da arte autorizada e teste sobre fundos claro/escuro. **Não substituir automaticamente por chroma key sem revisão de halo.**
5. **Chat Firebase (P1, risco de abuso confirmado em desenho):** `firebase-realtime.rules.json` aceita criação sem cota por UID; a sessão básica usa `signInAnonymously()`. O controle local de frequência é contornável. Rate limiting efetivo exige operação de servidor transacional / Cloud Function, App Check, moderação, denúncia e política de exclusão. **Não negar contas anônimas cegamente:** isso quebra o chat atual. Produção e regras aplicadas ainda não verificadas.
6. **Licenciamento dos assets (P1 jurídico, revisão pendente):** efeitos e músicas de franquia no APK precisam de matriz de origem/direitos e autorização. Um aviso de não afiliação não constitui licença.
7. **Privacidade/LGPD (P2):** não foi localizada política dedicada no repositório; há dados de login, presença, avatar, chat e capture consentida. Publicar documento real de finalidades, retenção, exclusão, contato e fluxo de revogação, com revisão jurídica; verificar se existe documento externo antes de declarar ausência pública.
8. **Firebase API key (P2/configuração):** presença no cliente é normal para Firebase; verificar restrições por pacote e assinatura e App Check, sem tratar a API key isoladamente como segredo de backend.
9. **UI e acessibilidade (P2):** textos de 8–11px e controles compactos exigem modo de escala maior sem forçar aumento permanente; comparar 13 menus da LT211, dois overlays, seleção de favorito, arraste e Background/Shiny ocultos por padrão em Samsung. Não refatorar `dock.html` de uma vez.
10. **CI/manutenção (P3):** há 235 workflows na `main` LT211 e 40 nomes de workflows de release oficial; consolidar gradualmente somente após mapear gatilhos/secrets. `targetSdk=33` requer plano Android 14–16 e teste de MediaProjection/FGS.
11. **Sistema de sprites (P2):** testar costumes e formas sem fallback circular; auditar cache offline, imagem de site autorizada e integridade em P1/P2. Sem evidência de execução física nesta revisão.
12. **Provedor (P2 dependência):** DOM fallback sensível a alterações; usar testes de contrato e mensagens distintas para 401/403/422/429. **Não** inventar endpoint nem contornar autenticação, quotas, ou 429.

## Auditoria executada e limites

- Os arquivos históricos LT206 foram extraídos; **897/897** entradas do inventário SHA-256 conferidas localmente, sem divergências.
- LT206 original: **190/191** testes Node; único teste obsoleto LT74. LT206 com teste LT74 reescrito: **191/191**.
- **13/13** programas de teste Java puro existentes na LT206 passaram; o novo formatador: **15/15** casos.
- A fonte LT211 atual foi consultada diretamente no GitHub para o código afetado, regras Firebase, workflows e metadados. **Não** foi possível compilar o Android LT211 localmente (ausência do SDK/Gradle/keystore e aparelhos); o novo workflow PR é a validação seguinte.
- API autenticada, Firebase em produção, assinaturas de build novo, testes Samsung e Google Drive não foram alterados nem declarados testados. O APK LT211 publicado continua o mesmo.
- Resumos históricos das IAs contêm sugestões não validadas; especialmente **não aplicar** o `buildCleanSearchParams` proposto por Gemini sem teste do contrato real.

## Próximos gates de publicação

1. Executar o novo workflow de QA da PR (todos Node/Java/OTA) + Gradle Android com JDK17/SDK36.
2. Validar captura/movimentação/posicionamento dos Favoritos e menus em Samsung Android 16 + Android de entrada; conferir dois overlays simultâneos.
3. Auditar e corrigir assets com direitos verificáveis, acessibilidade, chat/LGPD e moderação por backend.
4. Repetir prova de login e buscas reais no provedor, inclusive bloqueio 429, sem copiar tokens.
5. Só após aprovação, integrar via PR, incrementar versão monotônica, compilar R8, assinar com a **mesma** chave permanente e publicar release/Drive com SHA256, APK e relatório; nunca declarar publicação a partir de um patch.

**Decisão:** branch de QA limitada e reversível. Sem merge automático, sem alteração da versão pública e sem envio forçado ao atualizador.
