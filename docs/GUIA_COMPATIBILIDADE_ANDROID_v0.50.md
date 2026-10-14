# PokeSearch v0.50-beta — compatibilidade Android e diretrizes de interface

**Objetivo:** aplicativo Android independente, preparado para funcionar em diferentes fabricantes, resoluções, densidades e versões do Android. Samsung SM-S928B/Android 16 é um **caso de teste**, não o único dispositivo suportado nem requisito de uso.

## Suporte de projeto vs. validação comprovada
- Configuração preservada: `minSdk 26` (Android 8.0), `targetSdk 33`, `compileSdk 36`; JVM 17; Gradle 8.11.1; AGP 8.10.1.
- Android 8 a Android 16 estão **dentro da faixa prevista pelo minSdk e pelo build**, mas comportamento de overlay, WebView, OAuth, bateria e notificações depende de versão, fabricante e permissões.
- Compilação/CI não significa homologação em aparelhos físicos. Não afirmar que qualquer marca/versão foi testada sem relatório real.

## Padrão visual de aceitação
1. **Minimalismo funcional**: paleta neutra cinza/branco, fundos do dock transparentes, pequenos contrastes apenas em estados críticos.
2. **Alinhamento/simetria**: barra com 12 ações organizadas em **6 colunas iguais × 2 linhas**; botões do mesmo tamanho e mesmo espaçamento (2 px CSS). Cada célula tem 30 px CSS de altura. Ícones centralizados; ícone 📍 proporcional.
3. **Sem espaços artificiais**: o dock reserva margem vertical **apenas** quando o menu realmente cobre a área dos Pokémon; não acrescentar espaço de 34 dp ao posicionamento lateral/por cima. Seta imediatamente após lista ou indicador de estado.
4. **Controle compacto, porém legível**: textos curtos, símbolos reconhecíveis, descrição acessível via `aria-label` e `title`, foco perceptível e feedback imediato.
5. **Sem obstrução indevida**: toques fora das janelas de ações e Pokémon devem seguir para o jogo; preferir janela pequena, não uma tela invisível por cima do jogo.
6. **Expansão orgânica**: popover abre abaixo da segunda linha do menu; alterar menu de opções sem empurrar sprites quando não houver sobreposição física.
7. **Consistência de estado**: AUTO OFF, Shiny autenticado, filtros IV/GL/UL, raio e notificações preservam indicação visual clara.

## Matriz mínima de verificação

| Dimensão | Casos recomendados | Critério de aceite |
|---|---|---|
| Android API | 26 (8.0), 29 (10), 31/32 (12), 33 (13), 34 (14), 35 (15), 36 (16) | Abrir app e overlay sem falhas; permissões adequadas |
| Fabricantes | Google Pixel, Samsung, Motorola, Xiaomi/Redmi e outro OEM disponível | Overlay, bateria/permissões e retorno do OAuth |
| Largura lógica | 320, 360, 393/411 e 600+ dp | Controles alinhados; sem corte, espaços arbitrários ou sobreposição |
| Orientação | Retrato e paisagem | Barra e sprites continuam acessíveis; janela não sai da tela |
| Navegação do sistema | Gestos e 3 botões | Arraste/recolhimento, Voltar no login e área de toque |
| Aparência | Tema claro/escuro, fonte e escala de tela aumentadas | Contraste do ícone sem fundo, textos legíveis, sem corte |
| Sessão e rede | Antes/depois do login, rede lenta/intermitente | IV100/GL#1/UL#1 e Shiny sem dados antigos; diagnóstico seguro |
| Notificações | Permissão negada/concedida, OFF/ON/silencioso | Sons/canais corretos, inclusive alertas específicos |
| Memória | Uso por 30 min, matar e reabrir app, rotação | Sem janelas residuais, consultas duplicadas ou crashes |

## Procedimento de teste manual por dispositivo
1. Registrar fabricante, modelo, API, WebView e resolução lógica (não gravar coordenadas ou credenciais).
2. Conceder a permissão de sobreposição nas configurações nativas. Em API 33+, testar a solicitação de notificações e opção de negar.
3. Iniciar sem login: consultar IV100, GL#1 e UL#1, conferir carregamento inicial e a ausência de ✨ não autorizado.
4. Ativar e desativar AUTO (OFF, 5/10/15/20), atualizar ↻ manualmente e testar geolocalização 0–1000 km com coordenadas públicas.
5. Abrir/recolher menu nos quatro cantos, tocar em sprites e verificar que não há fundo nos ícones ⚙/⌃, desalinhamentos, áreas vazias ou alvos invisíveis bloqueando o jogo.
6. Confirmar login OAuth Google/Discord pela interface oficial e verificar Shiny apenas após sessão e vínculo confirmados.
7. Alternar notificações OFF/ON/silencioso, favoritos e preferências com overlay aberto.
8. Se falhar, exportar ⚠ relatório sanitizado e revisar antes de compartilhar. Registrar resultado individual como **aprovado/reprovado/não executado**.

**Pendência atual:** esta matriz ainda necessita execução real. O roteiro específico Samsung está em `GUIA_TESTE_SAMSUNG_v0.50.md` apenas como um dos cenários; versões históricas permanecem intactas.

## Verificação complementar — toque em ✨ sem espera
- [ ] Com conta desconectada, tocar ✨: login oficial abre diretamente, sem aguardar 60 segundos nem concluir uma pesquisa.
- [ ] Com conta conectada e página pronta, tocar ✨: filtro do site liga e recebe confirmação rápida, independentemente de AUTO OFF/ON ou do cooldown da última consulta.
- [ ] Tocar novamente: Shiny desliga no site sem exigir novo login.
- [ ] Rede lenta/página hidratando: acesso ao botão oficial é tentado brevemente sem redirecionar para URLs OAuth inventadas. Ausência de controle não equivale a ativação confirmada.
- [ ] Alternar IV100/GL#1/UL#1 mantendo ✨: cada modalidade respeita a opção selecionada no site e não mostra resultados de modo antigo como se fossem confirmados.

## Regressões PS-086 a PS-088 — roteiro por fabricante
1. Com sessão já ativa no site e botão Logout escondido no menu móvel, tocar ✨ e abrir a etapa de autenticação: o PokeSearch deve **reconhecer a indicação de conta** e voltar à Home, sem exigir Shiny previamente ligado.
2. Fazer novo login no Google/Discord: ao retornar ao domínio PoGoCoordinates, conferir que o WebView fecha assim que a sessão é identificada; testar também login/modal SPA sem navegação (demora superior a 6 segundos).
3. Alternar ✨ nos três modos IV100, GL#1, UL#1: confirmar alteração no controle visível da aba Pokémon mesmo que as abas Stats/PvP não estejam disponíveis; Shiny desligado não pede login.
4. Forçar site lento: confirmar que resposta atrasada não abre um segundo login ao detectar sessão autenticada e que o estado ON só aparece após `verifyShiny`.
5. Mostrar o menu no topo da tela e abrir popovers: conferir que a engrenagem continua próxima do **primeiro sprite**, sem espaço vertical arbitrário, e que o popover não cobre botões.
6. Repetir em telas estreitas e largas, versões/fabricantes distintos. Não marcar um aparelho como aprovado sem teste manual real.
