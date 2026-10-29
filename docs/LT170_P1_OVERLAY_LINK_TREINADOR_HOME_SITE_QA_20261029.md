# LT170 QA — Pokébola 1 sem minimizar e vínculo treinador sem navegação manual

Base: LT169 oficial (`0.01.69 / 54374`), branch separada para evitar conflitos com PR #121 (aviso de taxa PoGoCoordinates), também ainda não publicada.

## Reproduzido pelos vídeos e screenshots (29/10/2026)

1. Toque em Pokébola 1 na Home inicia `OverlayService`, mas `startOverlay()` chama `moveTaskToBack(true)`. A Pokébola 2 inicia seu overlay sem esse comando; o usuário quer manter a Home na frente nas duas.
2. No cadastro de treinador, a Home já oferece `Gerenciar` quando não há treinador vinculado, porém o diálogo WebView apenas carrega `/profile` e deixa o usuário encontrar manualmente `Link my account`.
3. Após digitar código, tocar em `Look up` e confirmar o card via `Yes, link it`, o site permanece em `/profile`; o usuário deseja retornar à Home do próprio PoGoCoordinates (rota pública `/search`).

## Correção

- Remover exclusivamente `moveTaskToBack(true)` de `MainActivity.startOverlay()`. Manter permissão overlay, permissão de notificações, startForegroundService, toggles P1/P2, autenticação e ações de login Shiny sem alteração.
- `Gerenciar` só inicia atalho quando não há código confirmado: na WebView autenticada do domínio HTTPS `pogocoordinates.com/profile`, validar o bloco `Pokemon GO accounts 0/1` e tocar **apenas uma vez** no botão legítimo `Link my account`. Não usar rota interna, credencial, scraping para confirmar ou clicar em `Look up`/`Yes, link it`. Quando o site muda/controle não aparece, manter perfil original para operação manual.
- Ao abrir formulário, observar somente o estado DOM do perfil oficial, num ciclo limitado a 10 min; o usuário digita código, consulta e confirma no próprio PoGoCoordinates. **Só após a conta mudar para `linked` com nome, time e código verificados pelo leitor oficial `profile_summary.js`** salvar no PokeSearch, avisar os dois overlays e navegar a WebView para `https://pogocoordinates.com/search`, que é a página inicial de buscas do site.
- Não remover a confirmação de remoção de treinador já vinculado nem os caminhos Login, Google, Discord, Premium, Shiny, duas Pokébolas. A PR #121 continua independente.

## Testes
- `app/tests/lt170-p1-overlay-trainer-link-return.test.js`: P1 e P2 não minimizam; seletor DOM autorizado apenas em perfil exato; conta já vinculada, domínios não oficiais, botão ambíguo ou confirmação aberta não ocasionam clicks involuntários; apenas sucesso confirmado pode disparar navegação para `/search`; sem envio automático de lookup/vínculo.
- CI Node e Java/Android aprovados; aguardando QA físico no Samsung: toque na Pokébola 1, sobreposição sem redução da Home; vínculo 0/1 com consulta e confirmação do site; 1/1 sem atalho; sessão não autenticada; WebView volta a buscas após vínculo; cancelamento e reabertura; P2 não alterada.
- **Não houve merge nem distribuição pública desta correção.** O APK LT169 assinado permanece oficial enquanto a revisão não for aprovada.

## Execuções de QA da revisão c44e1eed4a7968175eed9cc42e37a43b691b908c

- [Node completo — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40886668497)
- [Node QA padrão — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40886668480)
- [Java/Android compile sem APK — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40886668398)

Todos passaram com o teste específico LT170 sobre P1, autenticação de formulário e confirmação manual. O teste inicial encontrou um problema somente no mock (o cenário 1/1 ainda continha componente filho 0/1); corrigido, a suíte completa passou. Não houve lookup nem vínculo automático. PR #122 continua draft, não mesclada e sem distribuição; LT169 permanece oficial.
