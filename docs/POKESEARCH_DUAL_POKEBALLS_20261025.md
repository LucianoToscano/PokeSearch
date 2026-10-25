# Duas Pokébolas simultâneas — etapa de integração (25/10/2026)

## Ponto de restauração
- Base real: main `97654f3c0ecaf4d3de4e22fe1f3efb6d979f0297` (release pública observada LT103, 0.00.103/54306).
- Backup remoto imutável por convenção: `backup/lt103-before-dual-pokeballs-20261025`, apontando para o commit original. **Nunca escrever nessa branch**.
- Desenvolvimento: `feature/dual-pokeballs-100-0-20261025`. PR #67 integrada por squash à main, merge SHA `54fc1274c0fac62c1827071d8e6cf6361219dfca` em 25/10/2026. Testes Node #40216822416 SUCCESS (7/7 contratos próprios) e Java compile #40216822421 SUCCESS. Sem APK novo e sem QA Samsung.

## Pedido funcional
- Ativar duas Pokébolas em dois overlays com uma só conta PoGoCoordinates.
- **Sem cor, selo ou ícone artificial diferente:** cada Pokébola herda o ícone dinâmico do filtro escolhido no próprio overlay, inclusive quando muda de GL/UL/IV/IV%.
- Primeira Pokébola: padrão IV bruto A/D/S = 15/15/15 (100%). Preservar qualquer filtro que já tenha sido escolhido e salvo pelo usuário.
- Segunda Pokébola: primeiro uso IV bruto A/D/S = 0/0/0 (0%). Depois de alterada, reabrir usando o filtro salvo, sem reset automático.
- Até 10 resultados por pesquisa, localização, Shiny, filtros, menus e atualizações independentes.

## Implementação inicial
- `OverlayService` mantém estado de pesquisa por instância; `SecondaryOverlayService` herda o serviço, reutiliza os mesmos recursos e mantém instância própria.
- `prefs` e `prefs_secondary` separam filtros, posições, perfis de filtro e UI; padrão secundário inicializado somente uma vez pelo botão da Home. Lista de favoritos de treinador permanece global (WatchAlerts); notificações secundárias começam OFF por segurança.
- Android WebView compartilha `CookieManager` do mesmo aplicativo, mas cada serviço tem WebView próprio e coleta própria, sem duplicar login ou transmitir credenciais à camada de interface.
- Notificações Android do serviço usam IDs distintos (73 e 74).
- A Home oferece botão adicional para ativar/desativar a segunda Pokébola. Login aberto/fechado e refresh de sessão propagam para ambas; logout encerra ambas antes de apagar cookies.
- Posições iniciais separadas para impedir sobreposição dos dois docks.

## Restrições/QA obrigatórias
- Não alterar applicationId/namespace, página-alvo, limite de 10, proteção de tokens/API/reveal, campos 0..15, ícones existentes e versões oficiais durante QA.
- Testar no Samsung: duas janelas e respectivos menus sem conflitos de z-index; busca IV 100 da primeira e IV 0 da segunda, alternância de modos sem interferência; 10 resultados independentes; despawn individual; Get coords; logout; reinício; memória/CPU; limite/rate de API; alternância DOM/API.
- Se o backend proibir buscas simultâneas, **não contornar limites**: precisa serializar/agendar os pedidos e exibir erro legítimo.
- A presença de código/PR/CI não prova homologação Android nem APK assinado. Não realizar merge ou publicação sem build e testes.


### QA assinada LT104 — 25/10/2026
- **Código com duas Pokébolas:** PR #67 merged (base de funcionalidade), main atual passou a conter os fluxos CI LT104.
- **APK de teste produzido:** `PokeSearch-v0.00.104-LT-Dual-Pokeballs-QA.apk`, versionName `0.00.104`, versionCode `54307`, tamanho 39.203.925 bytes, SHA-256 `64f5a5bad090486b029cff9eeedcfc55e3645e6313ef91706ebd9f037ad280b7`.
- **Fonte exata do APK:** `55cee3c34ed9b6bf017f2acebebdc600f6ea54b1`, teste/build assinado [Actions #40217437596](https://github.com/LucianoToscano/PokeSearch/actions/runs/40217437596) SUCCESS. Workflow de publicação de download QA [#40217680586](https://github.com/LucianoToscano/PokeSearch/actions/runs/40217680586) SUCCESS.
- [**Download direto do APK LT104**](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.00.104-54307-qa/PokeSearch-v0.00.104-LT-Dual-Pokeballs-QA.apk); [release QA](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.104-54307-qa) está marcada como **pré-release, NÃO latest**. Oficial estável permanece LT103 e link Drive não alterado.
- APK RELEASE não depurável com R8/mapping, assinatura Android v2 e certificado permanente checados pelo CI. **Samsung físico ainda não homologado**. Confirmar duas buscas ao mesmo tempo, ícones dinâmicos, login compartilhado, filtro 100/0, isolamento, rate limits e desempenho em hardware.
- **Backup de segurança:** `backup/lt103-before-dual-pokeballs-20261025` mantém SHA `97654f3c0ecaf4d3de4e22fe1f3efb6d979f0297`. Nunca sobrescrever.
