# POKESEARCH — AUDITORIA TÉCNICA v0.42-beta
Revisão em 14/10/2026, com base no código v0.40 e capturas do aparelho enviadas pelo usuário.

| ID | Prioridade | Falha | Correção no código | Validação |
| --- | --- | --- | --- | --- |
| PS-023 | P1 | Sprites distantes (+10dp em cada linha) | Linha = spriteSize - 8dp, mínima 26; mantém scroll | Teste real pendente |
| PS-024 | P1 | Seta para recolher acima da engrenagem | Seta ^ ao final da coluna, fecha tudo menos engrenagem | Teste real pendente |
| PS-025 | P2 | X fora do padrão | X vermelho no último botão ao lado do coração | Revisão visual pendente |
| PS-026 | P0 | Janela de controles transparente bloqueia toques no jogo | Barra em janela separada (308 x 29dp), dock estreito isolado, popover amplia somente quando aberto | Teste de pass-through pendente |
| PS-027 | P1 | Favoritos: título e rodapé Android cinza duplicados | Dialog customizado, único quadro cinza translúcido arredondado, Concluir dentro e blur condicional | Teste em aparelho pendente |
| PS-028 | P2 | Login enviava Activity ao segundo plano | Não usar moveTaskToBack depois de autenticar; permanecer Home | Teste no aparelho pendente |
| PS-029 | P2 | Tutorial pouco claro e ícones errados | Tutorial.html com 13 SVGs/desenhos alinhados ao dock e texto mais didático | Revisão visual pendente |
| PS-030 | P1 | Barra do menu permanecia sobre favoritos/login | Ocultar menuRoot enquanto dialog aberto, restaurar ao voltar | Teste no aparelho pendente |

## Matriz de verificação
- Node check do parser e do dock, smoke de filtros IV100/GL/UL/Shiny.
- Testes estáticos de UI (ícone X após coração, seta após lista, modo touch-safe, layout favoritos, tutorial).
- Java17 Gradle assembleDebug + lintDebug + testDebugUnitTest.
- Android APK zip íntegro, package/versionCode=41, signature v2, SHA256SUMS.
- Real-time search e interação com Android NÃO foram testados fisicamente nesta sessão. O CI só confirma compilação, contratos de código e assinatura.

## Riscos e recomendações
1. Blur atrás de diálogos depende do sistema e das opções do aparelho; a cor translúcida permanece disponível.
2. Na abertura de dropdown de opções, sua janela expande o retângulo tocável temporariamente; os toques fora dela seguem para o jogo.
3. A extração do site depende de HTML de terceiro e pode exigir ajustar seletores caso DOM mude. Relatório ⚠ e screenshot sem dados sensíveis ajudam a depurar.
4. Evitar mudanças de assinatura de APK entre betas: preparar keystore estável protegida por Secrets do GitHub após autorização explícita.
5. Considerar ajuste de espaçamento P/M/G como preferência opcional no futuro. Não aumentar a largura da área bloqueadora do jogo.
6. Não alegar instalação em aparelho ou login real testado sem evidência.
7. O projeto é beta privada para amigos; respeitar permissão de uso do fornecedor e limitações de taxa.

Fontes no repositório:
- docs/ARQUIVO_MESTRE_v0.41.md
- app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java
- app/src/main/assets/dock.html e tutorial.html
- app/src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java

## NOVOS ACHADOS E CORREÇÕES v0.42
| ID | Gravidade | Relato | Correção | Validação |
|---|---|---|---|---|
| PS-031 | P1 | Necessário filtrar área geográfica sem abrir interface do site | Um pin 📍 no menu, coordenadas coláveis, raio 0–1000km, ON/OFF dentro do painel e ocultação independente | CI em andamento; aparelho pendente |
| PS-032 | P1 | Uso não intencional de coordenadas após desligar | OFF apaga estado e valores do formulário oficial; verificação antes do Search | Teste do site pendente |
| PS-033 | P1 | Escape duplo impedia validação de coord. e contador Showing N | Corrigir expressões regulares JavaScript | Testes de sintaxe e CI |
| PS-034 | P2 | Coordenadas aparecem em logs se não forem mascaradas | Registros usam apenas ON/OFF e raio; relatório de bugs mascara padrões de coordenadas | Revisão estática |
## Próxima validação física
Verificar teclado e fechamento do painel; OFF e ON; preenchimento Coords + raio 0 e 1000; se ocultar o painel preserva a opção; Shiny e IV100 mantêm estado; não bloqueia toques no Pokémon GO fora dos controles; favoritos e tutorial v0.41 continuam funcionando.
