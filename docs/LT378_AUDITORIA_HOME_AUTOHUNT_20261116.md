# PokeSearch LT378 — Auditoria: Home limpa e Auto Hunt OFF — 16/11/2026

## Pedido evidenciado pelo proprietário

A captura enviada após o APK 0.03.71 mostra os elementos de Home marcados para remoção: texto **PGS Monitor: desligado** acima dos perfis, palavra/logo **PokeSearch** e subtítulo **POKÉMON GO** próximos ao emblema superior esquerdo, e sufixo **PoGoCoordinates /search** no rodapé. O proprietário também informou que o Buscar Pokémon / Auto Hunt liga automaticamente em vez de iniciar desativado como as Pokébolas, e solicitou que o número da versão abra a página de Release no GitHub.

## Causa e correção

- `MainActivity.buildHome()` criava `homeWatchStatus` como TextView de **18dp** e `refreshHomePgsIcon()` preenchia a frase de monitor. **Excluídos componente e espaço**, sem excluir o monitor propriamente dito de `PgsAutoClickService` nem seus menus/diagnósticos.
- A Home desenhava separadamente o emblema `ps_home_brand_transparent`, a arte de palavra `ps_home_official_wordmark` e o subtítulo textual `POKÉMON GO`. **Somente palavra e subtítulo deixam de ser adicionados à UI**; as imagens originais permanecem no pacote. O acesso administrativo por pressão longa foi preservado no próprio emblema.
- O rodapé usava `PokeSearch v<version> LT • PoGoCoordinates /search`. Agora usa `PokeSearch v<version> LT` e abre a release da **versão realmente instalada** em `https://github.com/LucianoToscano/PokeSearch/releases/tag/v<VERSION_NAME>-<VERSION_CODE>` por `Intent.ACTION_VIEW`, com tratamento de ausência de navegador. Mantida a altura de 30dp e acessibilidade.
- `PgsAutoClickService.onServiceConnected()` chamava `showBubble()` incondicionalmente e restabelecia monitor de preferências anteriores. Agora conexão Acessibilidade **não liga** bolha, monitor ou busca. O monitor somente é ativado por comando explícito e o estado de execução é desligado ao iniciar o serviço. `armFromHome` legado não é suficiente: é necessário registro de toque explícito recente (`armFromHomeAtMs`, no máximo 120 segundos), consumido de modo único no handoff de permissão. Modelos, sprites, espécies, contas e ajustes permanecem persistidos.
- O evento automático de ensino de templates só pode ser iniciado com bolha ativa. Nenhuma captura, caminhada ou gesto é inferido do fato de Acessibilidade estar conectada.

## Evidências de revisão

**PR #461**: https://github.com/LucianoToscano/PokeSearch/pull/461; HEAD `de9663d6859bff0788155efba3feca184001d486`, squash `9d2e06df00033485a9ec865e04e0c367e9059a09`.

Gates de código **7/7 success**: Node QA #43974228849, LT169 Node #43974228989, LT211 #43974228841, LT62 Java #43974228843, LT173 OTA #43974228773, PGS APK debug QA #43974228899, Secure beta/R8 #43974228850. Foram corrigidos testes históricos LT54, LT73, LT75, LT341, LT342 e LT362 que exigiam a apresentação visual antiga. Teste dedicado LT378 valida a Home minimalista, URL versionada e ausência de auto-start por simples conexão.

**PR #462**: https://github.com/LucianoToscano/PokeSearch/pull/462; HEAD `5b1623a84bea7cdc22046057ec7b43490e09d422`, squash `5aa764a0f330cacc51598ada03cabdc9b65e2b7b`. Versão candidata `0.03.72`, code `54579`, label `51378`, anterior `v0.03.71-54578`; release notes incorporadas para `minVersionCode=54579`. Workflow oficial pós-merge: https://github.com/LucianoToscano/PokeSearch/actions/runs/43975405288; **verificar a publicação e assinatura na API antes de alegar finalização**.

## Limites físicos e preservação

Não foram executados testes em Android 11–14 Samsung/PGSharp/Pokemod em aparelhos reais após a mudança, nem clique real na versão, estabilidade da Acessibilidade após reiniciar, passagem de permissão após 120 segundos, dimensões e centralização em diferentes densidades ou OAuth Google/Discord. QA automatizado não comprova comportamento físico. Se a sessão de Acessibilidade estiver viva e o usuário já tiver ativado a busca, abrir novamente a Activity não interrompe sessão deliberada — evita desligar ferramentas usadas em segundo plano.

Preservados P1/P2 e Visitante, login PoGoCoordinates, modelos, filtros, Favoritos, Sequências/Monitor, Modo Noturno, sprites P/M/G, tutorias, assinatura, OTA e PR #457 de Pokédex separada. Supervisão de UI ≠ caminhada externa ≠ tentativa de captura ≠ captura confirmada.
