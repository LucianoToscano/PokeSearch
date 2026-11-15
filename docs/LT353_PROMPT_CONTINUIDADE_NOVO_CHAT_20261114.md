# PROMPT DE CONTINUIDADE — POKESEARCH LT353 / PRÓXIMO CHAT

Atue como desenvolvedor principal e auditor Android do PokeSearch no GitHub `LucianoToscano/PokeSearch`. **ARK** significa autorização para investigar, corrigir, testar, documentar, abrir PR, fazer merge quando gates verdes, atualizar o Guia Mestre e publicar uma release monotônica pelo workflow protegido — sem atalhos de assinatura ou instalação silenciosa. Não declare homologação física sem Samsung. **Consultar agora** `docs/GUIA_MESTRE.md`, `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`, `docs/LT353_ARK_AUDITORIA_E_ACCEPTANCE_20261114.md` e `AGENTS.md`. Verificar a última release real na API GitHub, não presumir o estado de build a partir de chat.

## Estado ao iniciar
- Base técnica anterior: 0.03.48 / versionCode 54555, release `v0.03.48-54555`, PR #390 docs.
- LT350 design system proposta PR #385 estava *draft*, não forçar merge sem comparação das Pokébolas em modo claro/escuro.
- LT353 corrigiu clipping de campos Tempo, sobreposição em Personalização, altura real dos popups, ROI lateral do feed, pixels transparentes, checagem RGB/modelos válidos, confirmação da mesma amostra, foco Android sob overlays, indicadores de toque e prévia de sprites sem clicar no jogo.
- **Verificar PR, commits, testes e última versão oficial LT353 no GitHub neste momento**; não assumir que foi publicada se não constar tag e asset público.
- Fotos de teste: menu Tempo com valores "15" e "5" cortados; menu Personalização com linhas sobrepostas. Vídeo original 11,11 s mostra halo branco/ciano pulsante no mapa. Não comprova teleporte nem toque real.

## Prioridade do próximo chat
1. Conferir PRs e logs recentes, identificar regressões; não recriar componentes nem descartar modelos do usuário.
2. Homologar no Samsung: menu Tempo (15/5 legíveis), Personalização sem sobreposição, popup ancorado, preview ◎ encontra Metagross real do feed e ilumina a posição, gesto Android aceito, jogo reage corretamente; comparar brilho com vídeo de referência.
3. Se preview não encontra, auditar alpha/máscara, escala, região de feed e correspondência `PgsAutoCatalog` → `PgsAutoTemplateStore`; não transformar cena 3D em sprite do feed. Garantir logs de coordenadas normalizadas e pixels reais.
4. Se preview encontra mas gesto não funciona, separar erro de foco/acessibilidade da resposta do PGSharp; exigir captura/evento real, sem afirmações não verificadas. Confirmar "Sou passageiro" manualmente somente se não estiver dirigindo.
5. Preservar todos os overlays das Pokébolas, Doce Raro, Assistente Edu, 68 sprites, contas, Rank, filtros, Shiny, notificações, ícones do Drive e proteções de segurança.
6. Testar Node, Java, Gradle Android, OTA, R8, assinatura, release e SHA-256. Marcar testes físicos não executados como BLOQUEADOS. Documentar commits, PRs, workflow e APK.
7. No fim, informar alterações realmente realizadas e novo prompt de continuidade.

Não usar cronômetro de cooldown nem brilho de toque como prova de que o jogo recebeu o gesto. Preferir correções incrementais e fail-closed a cliques cegos.
