# LT369 — Correção: um único menu de Busca Pokémon

Data: 15/11/2026. Base: LT368 oficial 0.03.64 / versionCode 54571.

## Motivo

A LT368 incluiu abas Pokémon, Ação e Ajustes, mas o gesto da bolha continuava chamando `showToolbar()` e exibindo a antiga barra `Buscar / Tempo / Notificações / Personalização / Fechar`. A opção "Mais opções" em Ajustes abria outros painéis para Tempo/Avisos/Visual/Auto Hunt. Isso contradizia a solicitação de um menu único e tornava a navegação redundante.

## LT369 implementado nesta branch

1. **Segurar a bolha** (570 ms, gesto original) abre **direto** a Central de Busca com as abas Pokémon, Ação, Ajustes, sem mostrar cinco botões antigos. Tocar na bolha com a Central aberta retrai. A Central tem o único ícone × no cabeçalho; ele fecha o painel, não desativa a busca. Para desativar a busca, continuam os controles explícitos do mecanismo.
2. O painel é posicionado **ao lado da bolha**, calculando lado direito/esquerdo e limites da tela sem usar uma toolbar intermediária. Arrastar a bolha enquanto o menu está aberto reposiciona a mesma janela, sem recriá-la.
3. Aba **Ajustes** une, na mesma área rolável: tempos padrão, espera entre alvos, mapa, sem Shiny; avisos Novos/Shiny em três estados com som/sem som/off; contador, efeito visível de toque com prévia e tamanho dos ícones P/M/G.
4. **Ajustes avançados recolhíveis** mostram tempos numéricos exatos (sem limite artificial), preferências de Auto Hunt do perfil atual (quando selecionado) e acesso manual a notificações Android. A origem de cores/transparência permanece o Editor Visual oficial das Pokébolas P1/P2.
5. Removemos a escolha duplicada de espera da aba Ação; o valor só aparece em Ajustes.
6. Preservados os métodos antigos de toolbar e submenu no código como legado **sem chamadas pelo fluxo normal de interação**. A remoção do código morto e a migração completa de destinos avançados de alvo continuam para futura auditoria, sem promessa de que todos os diálogos transitórios (modelo/sprite/perfil) já são inline. Nenhum atalho de início ou toque automático foi acrescentado.

## Restrições

- Não trocar nem duplicar `PgsAutoClickService`; não apagar sprites, preferências, sequências, contas ou modelos.
- Para qualquer gesto no jogo, manter validações de cliente/serviço/alertas/duas leituras e consentimento OFF padrão.
- Não interpretar callback Android como captura ou teleporte comprovado.
- Respeitar transparência/tema/medidas P1/P2 e padrões compactos, sem fundo adicional opaco.
- Teste físico em PGSharp e Pokemod separados, Android 11/13/14, ainda pendente; não marcar como homologado apenas por CI.

## QA

O novo contrato `lt369-single-overlay-contract.test.js` assegura abertura direta, retração, mesmo painel ancorado, abas, opções incorporadas e ausência de atalhos para submenus dentro da aba Ajustes. Executar a regressão Node completa, Java, QA PGS, OTA e Secure beta/R8 no mesmo SHA. Se falharem, corrigir antes do merge e do pedido oficial.

## Publicação

**Estado inicial:** branch de implementação, NÃO release publicada. A próxima atualização só pode usar `versionCode >54571`, assinador oficial e pedido por `release/official-request.json`. Após a publicação, atualizar este documento e `AGENTS.md` com SHA, APK e workflow efetivamente verificados.
