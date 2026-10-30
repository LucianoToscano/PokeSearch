# LT184 QA — Favoritos: sincronização de alertas P1/P2 (29/10/2026)

## Sintoma
Na tela com P1 100% e P2 0%, a lista compartilhada de Favoritos exibiu 13/50, mas o usuário relatou alertas de Pokémon selecionados somente na Pokébola 2; P1 sem aviso.

## Diagnóstico verificável no código
- `WatchAlerts.PREF_LIST` e `favoriteAlertMode` são persistidos em `prefs` global, com uma lista ativa para P1 e P2.
- Os resultados, critérios (100% versus 0%), filas, cooldown e deduplicação continuam por instância, respectivamente `OverlayService` e `SecondaryOverlayService`.
- Antes desta etapa, a outra instância não escutava alterações da lista/modo enquanto rodava. Só reavaliava favoritos ao aceitar uma nova pesquisa remota, criando uma janela em que a lista selecionada e os alertas do outro overlay ficavam dessincronizados.
- A captura de tela não demonstra que houve encontro 100% correspondente na P1 nem revela estado do canal Android. Não atribuir exclusivamente a essa causa a ausência de som sem teste físico.

## Correção em QA
1. `OverlayService` registra listener para as preferências globais de lista e modo; a implementação é herdada por P1 e P2, e remove listener em `onDestroy`.
2. Ao mudar favoritos, descarta fila pendente desatualizada da própria Pokébola; somente resultados aceitos na **geração atual**, não expirados e ainda válidos para seus critérios são reavaliados. Não pesquisa no servidor, não envia aviso geral e não reenvia encontros já notificados.
3. Em OFF limpa pendências. A ativação e a troca de lista mantêm as preferências globais intencionais, sem misturar filtros, resultados, posição, treinador e autenticação de P1/P2.
4. Teste nativo de favoritos emite título `Teste P1` ou `Teste P2` e IDs Android distintos; esses testes não equivalem a capturas reais.
5. Foram acrescentados contratos na suíte `app/tests/lt112-dual-overlay-parity.test.js`, já executada pelo workflow Node QA em PRs para main.

## Homologação necessária
- Abrir as duas Pokébolas, conferir 13/50 no mesmo perfil, testar notificações P1 e P2 com Som e com Sem som; inspecionar canal/permite notificações do Android.
- Com resultados reais confirmados e ainda ativos, selecionar um favorito presente nos cards de P1 e verificar notificação `P1` **sem refazer a busca**; repetir P2. Repetir ativar/desativar, trocar perfil, fechar/reabrir overlay.
- Testar P1 100% e P2 0% separadamente: P1 só deve alertar sobre IV 100% verificado; ausência de correspondências 100% **não é falha**. Verificar explicitamente as duas fontes, API autenticada e DOM, com TTL/despawn.
- Validar que sem resultados, com pesquisa pendente, login, cartões expirados ou após troca de filtros não existe aviso antigo. Confirmar Android real Samsung; testes estáticos/CI não provam entrega física.

**Estado atualizado:** autorizado pelo proprietário, PR #142 mesclada na `main` (commit `b3dd24839322029c4d6c4ce2e030ddb987625f0b`), LT184 0.01.84/54389 publicada oficialmente no GitHub Releases/latest e APK assinado enviado ao mesmo arquivo público do Drive, SHA idêntico. Consulte [registro oficial](ESTADO_CANONICO_LT184_OFICIAL_20261029.md). **Pendente apenas a homologação física dos alertas no Samsung.**
