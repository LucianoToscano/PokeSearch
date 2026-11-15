# LT368 — Central de Busca Inteligente e Editor de Sequências Integrado

Data: 15/11/2026. Base: LT367 0.03.63 / versionCode 54570. Este documento descreve **implementação candidata em branch**, NÃO uma release publicada.

## Objetivo e decisões de UX

A janela da lupa passa a conter **abas internas Pokémon, Ação, Ajustes**. Não são novas Activities, nem novas bolhas e nem três popups independentes. A toolbar externa de cinco tiles (Buscar, Tempo, Notificações, Personalização, Fechar) e a geometria oficial P1/P2 são mantidas.

- **Pokémon:** pesquisa antes da lista, contador de 10 selecionados, miniaturas pessoais/nativas, inclusão/remoção, cadastro de recorte e reordenação persistida originais. Perfil PGSharp/Pokemod explícito; a presença do gerenciador Pokemod não é prova de mod ativo.
- **Ação:** Monitorar (sem gesto), Clicar (consentimento), Auto Hunt (modo observação por padrão; toque separado), Sequência visual. Mudar seleção altera só o rascunho de configuração, **não dispara gestos**.
- **Ajustes:** tempos padrão, espera entre alvos, tempo do mapa, novos Pokémon/Shiny, indicador de toque. Configurações de alta complexidade recolhidas em Mais opções. Os ajustes continuam usando preferências reais do mecanismo legado, sem motores duplicados.
- Estado no rodapé com `PgsAutoClickService.searchStatus()`, Prévia sem gesto e ação Iniciar explícita. O início exige sprite salva e selecionada no perfil. Outro cliente continua somente prévia.
- Ações e Ajustes possuem rolagem interna: rodapé e status ficam fora da região rolável.
- O editor de sequências LT367 é **conteúdo da aba Ação**: +Toque, +Arrastar, +Sprite, +Espera, lista numerada, expansão contextual, duração/pausa, copiar/colar interno, ordenação e exclusão. Limpar tudo exige segurar o botão.

## Automação segura

- `PgsSmartSearchSettings`: modos de ação, autorização de clique e preferência de tempos sugeridos em `pgs_smart_central_<perfil>_v1`, separados por PGSharp/Pokemod e outros; consentimento desligado por padrão.
- Ao adicionar uma espera, usar 1 segundo por padrão; toque/arraste conservam defaults validados de `PgsSequencePolicy`. Com tempos automáticos desligados, nova espera expande sua edição. Não há aprendizagem dinâmica de tempos da interface, portanto não apresentar como adaptação garantida.
- Iniciar Monitorar reutiliza o observador passivo e a confirmação visual existente. Iniciar Clicar/Auto Hunt reutiliza o único motor seguro, forçando alvo SPRITE e interrompendo a sessão anterior. Nunca iniciar concorrendo com outra sequência.
- Etapa SPRITE confirma a mesma miniatura do feed em duas capturas. Agora pode **reler somente a imagem** a intervalos limitados durante até 5 segundos; se não houver prova de estabilidade, **para sem clicar**. O teto é incluído no orçamento estimado. Não faz teleporte, arremesso, captura, reinício do jogo nem bypass de avisos.
- Prévia dos marcadores permanece `FLAG_NOT_TOUCHABLE` e, portanto, não envia gesto ao jogo; a mira é transitória e exige confirmação.

## Design obrigatório

Reutilizar `PgsAutoMenuStyle` / `prefs.visualPrefsJson` / `OverlayQuickMenus`. Toolbar com célula 30dp, arte 16dp, intervalo base 2dp e raio 5dp. Preservar opções P/M/G, tema, transparência, ancoragem e gestos da bolha. Não implementar camada cinza opaca, menu gigante ou nova barra flutuante. Em telas pequenas, rolar conteúdo; não esconder o botão Iniciar.

## Limites / não homologado

- A opção de modo e a autorização são separadas. O usuário deve iniciar conscientemente, e o mecanismo de Acessibilidade/Android 11+ segue obrigatório.
- A detecção real no jogo varia por cliente e ambiente; PGSharp e Pokemod requerem **testes físicos separados**.
- O temporizador de confirmação de sprite mede apenas ausência/instabilidade de miniaturas. Um callback Android não comprova encontro, captura ou teleporte.
- Arrastar marcadores diretamente, salvar bibliotecas nomeadas, importar/exportar JSON, ancoragem relativa à sprite e ramificação IF/ELSE generalizada ficam planejados para futura implementação com testes; não são alegados como prontos.

## Verificação

1. Rodar todos os contratos Node, PgsSequencePolicyTest, QA LT169/LT211, Android debug QA, OTA e build R8 seguro no mesmo SHA.
2. Testar em dispositivo Android 11/13/14: P/M/G, temas, densidades, editor com 1/5/10 alvos, miniaturas e toques, mapa, acessibilidade/TalkBack, teclado, mudança de orientação, permissão revogada e avisos.
3. Verificar sem regressões P1/P2, Doce Raro, login, filtros, Auto Hunt, Radar, telemetria, OTA e certificado permanente.
4. Nenhuma publicação oficial ou APK assinado de produção pode ser afirmado antes dos workflows e do release real.

**Arquivos principais:** `PgsAutoMenus.java`, `PgsAutoClickService.java`, `PgsSmartSearchSettings.java`, `PgsSequencePolicy.java`, contratos LT366/LT367/LT368 e workflow PGS QA.
