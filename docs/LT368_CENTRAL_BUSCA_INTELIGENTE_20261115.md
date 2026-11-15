# LT368 — Central de Busca Inteligente e Editor de Sequências Integrado

Data: 15/11/2026. Base: LT367 0.03.63 / versionCode 54570. **LT368 oficial publicada**: versão 0.03.64 / versionCode 54571 / label 51368. [Release e APK](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.64-54571).

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

## ARK LT368 — fechamento oficial (15/11/2026)

- **PUBLICADO:** [v0.03.64-54571](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.64-54571), APK `PokeSearch-v0.03.64-LT.apk` de **61.176.383 bytes**, SHA-256 `5b2c046c2bf860e4050ce2157131cae9b6d550a8e49c512608b67759fa99ceff`; API GitHub retornou asset uploaded e release pública não-draft; [workflow #43770160211](https://github.com/LucianoToscano/PokeSearch/actions/runs/43770160211) success no SHA `f85c0db3366c514fa63e763e5900f14a634e7f5f` com verificação de assinatura e digest, sem download independente nesta sessão.
- **CÓDIGO:** PR #438 squash `1b6b7f421f443ffe4ce21db1fd03d63a69447730`, sete gates green no head final `d40f32d5bf9e0904e47a049bd6c225c39ebb6dc7`: Node #43769245944, LT169 #43769245948, LT211 #43769245962, Java LT62 #43769245968, OTA #43769245938, PGS APK QA #43769245959, Secure beta #43769245971.
- **VERSÃO:** PR #439 squash `f85c0db3366c514fa63e763e5900f14a634e7f5f`, inclui request 0.03.64 e notas internas `release_notes.json` para 54571. O teste LT169 inicialmente detectou a ausência das notas, corrigida antes do merge; CI de request aprovado.
- **FÍSICO PENDENTE:** cenários em Samsung Android 11/13/14, PGSharp/Pokemod independentes, toque/arraste, reconhecimento em duas leituras, P/M/G, TalkBack, consumo e resultado real no jogo seguem sem homologação; issue #350. Não inferir teleporte ou captura de callback Android.
- **PRÓXIMO:** [ARK LT369](LT368_PROMPT_CONTINUIDADE_LT369_20261115.md); revalidar latest no próximo chat. `versionCode` futuro deve ser superior a **54571**, mantendo assinatura permanente e fluxo oficial.
