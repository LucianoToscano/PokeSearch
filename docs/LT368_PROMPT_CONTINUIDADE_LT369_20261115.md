# PokeSearch — ARK LT369: continuidade da Central de Busca LT368

Atue como desenvolvedor Android sênior, auditor UX/UI e mantenedor da assinatura/CI no repositório `LucianoToscano/PokeSearch`. Respeite as autorizações técnicas já declaradas para APKs/APIs; não solicitar novamente. Ler `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md` e `docs/LT368_CENTRAL_BUSCA_INTELIGENTE_20261115.md`.

**Código LT368 incorporado:** PR [#438](https://github.com/LucianoToscano/PokeSearch/pull/438), squash `1b6b7f421f443ffe4ce21db1fd03d63a69447730`. HEAD de aprovação `d40f32d5bf9e0904e47a049bd6c225c39ebb6dc7`, sete gates `completed/success` no mesmo SHA: Node #43769245944, LT169 #43769245948, LT211 #43769245962, Java LT62 #43769245968, OTA LT173 #43769245938, PGS Android QA #43769245959, Secure beta/R8 #43769245971. **Na preparação deste documento, a release 0.03.64/54571/51368 está solicitada, NÃO comprovada como publicada.** Revalidar última release, workflow oficial, APK, SHA, signer e PR antes de declarar versão oficial.

## O que foi entregue no código

- Janela Buscar Pokémon unificada em **abas internas Pokémon, Ação e Ajustes**, sem nova bolha ou painel independente principal.
- Busca de espécies no topo, sprites salvos/nativos preservados, perfil explícito PGSharp/Pokemod, atalhos rápidos de status e ação.
- Escolher Monitorar, Clicar, Auto Hunt ou Sequência muda só a configuração; executar continua exigindo toque humano e consentimento de gestos, com dados separados por cliente.
- Editor de sequências embutido na aba Ação: adicionar Toque, Arrastar, Sprite do feed e Espera; lista numerada, editar origem/destino/duração/pausa, copiar/colar interno, reordenar/excluir, limpar com toque longo e prévia sem gesto.
- Ajustes inline de tempos padrão, mapa, espera, notificações e efeito de toque; avançados recolhidos.
- Ao verificar uma sprite na sequência, continuar capturando **só imagens** durante no máximo 5 segundos para duas leituras consistentes, interrompendo sem clique cego em falta de evidência. Não declarar captura/teleporte/IV/Shiny baseada no callback.
- Preservados P1/P2, Rare Candy, contas/OAuth, filtros, Auto Hunt, PokeList, Data Hub, Android 11+, 12 etapas, orçamento 120s/watchdog180s, avisos humanos e assinatura original.

## P0 no próximo ciclo

1. **Homologação real em Android:** testar Samsung Android 11/13/14, PGSharp e Pokemod separadamente, 1/5/10 espécies, retrato/paisagem, telas P/M/G, temas e transparência, rolagem, teclado/TalkBack, reancoragem, toque, arraste e tempo de sprite. Sem evidência física, registrar `BLOQUEADO`, não `PASSOU`. Issue #350 permanece referência.
2. Corrigir eventual truncamento em `popupHeight` mínimo; nenhum botão Start/Parar deve ficar fora da tela. Comparar visualmente com P1/P2 e Doce Raro.
3. Testar reinício de app, perda de serviço, revogação Acessibilidade, troca de host, avisos `Sou passageiro`, rotação durante captura, estado de carregamento do mapa, sprite ausente/instável e concorrência Auto Hunt/Sequência.
4. Refinar feedback: estado por etapa (planejada, enviada, callback Android, inconclusivo); evitar inferir sucesso real do jogo.
5. Concluir documentação e, após todas as evidências, corrigir problemas de usabilidade sem inventar integração privada ou contornar avisos de segurança.

## P1/P2 planejado — NÃO entregue na LT368

- Arrastar marcadores diretamente na tela em modo edição com Confirmar/Cancelar/Desfazer.
- Condições explícitas `SE sprite aparecer`, `SENÃO parar/avisar` com limites por etapa, sem loops de toque cego.
- Biblioteca nomeada de sequências por cliente e importação/exportação JSON validado via SAF.
- Ancorar gestos relativamente a sprite quando o reconhecimento for confiável; respeitar áreas proibidas.
- Opção de tempos adaptativos somente se os dados observáveis permitirem validação real; não afirmar aprendizado automático inexistente.

## ARK de integração/publicação

Sempre: auditar `main`/latest/PRs → patch com testes → sete gates verdes no mesmo SHA → merge → pedido de release monotônico (`versionCode` > versão atual) → preflight → workflow protegido com R8, certificado original, APK e SHA públicos → docs/arquivo mestre/prompt do próximo chat. Separar **implementado, testado em CI, publicado e homologado no aparelho**. Nunca anunciar publicação apenas com PR, screenshot ou execução ainda em andamento.
