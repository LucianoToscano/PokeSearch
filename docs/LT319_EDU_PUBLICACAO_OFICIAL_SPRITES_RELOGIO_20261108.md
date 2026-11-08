# LT319 — Edu maior, pixel art nítida e relógio virtual compacto (08/11/2026)

## Publicação confirmada

- **Última Release oficial estável:** [v0.03.19-54525](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.19-54525) — **LT319 · versão 0.03.19 · versionCode 54525 · label 51323**, publicada em **08/11/2026 às 22:40:59 UTC**; `draft=false`, `prerelease=false`.
- **APK oficial persistente:** [`PokeSearch-v0.03.19-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.19-54525/PokeSearch-v0.03.19-LT.apk), tamanho **34.709.718 bytes**, SHA-256 **`a0cf19f7af8b6e954c24b905ec21899ec519b23dc1422bee7a595f1d1511758f`**. Confirmado por GitHub Releases/latest e pelo pipeline oficial; não inventar outro URL, nem disponibilizar APK de sandbox como distribuição primária.
- **Pipeline permanente:** [#42531166399](https://github.com/LucianoToscano/PokeSearch/actions/runs/42531166399) — `completed/success` (preflight + publish), incluindo validação de assinatura, APK, hash público e integridade.
- **Certificado Android v2 permanente:** SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, preservado na publicação protegida; APK abaixo do limite **35.000.000 bytes**.
- **PR e integração:** [PR #319](https://github.com/LucianoToscano/PokeSearch/pull/319) integrada por squash, commit **`893edb035531323c635161f7ee1412be9a4ebd82`**; head testado **`70e1e3bb9550e25632d6eefa866baac29be5ff2e`**. Solicitação oficial e SOURCE_COMMIT do APK: **`f556338f9bf6e2d331bd11e817527a2a45177245`**.
- **QA automatizado do head de PR:** Node completo [#42530553005](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530553005), LT169 [#42530553188](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530553188), LT211 [#42530552992](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530552992), Java LT62 [#42530553315](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530553315) e OTA LT173 [#42530552971](https://github.com/LucianoToscano/PokeSearch/actions/runs/42530552971) — **5 de 5 SUCCESS**. Os testes legados de LT304/LT309/LT312/LT313/LT316 foram ajustados para os novos tamanhos sem abandonar a validação dos assets, hashes e quadros.

## Funcionalidades efetivamente entregues

### 1. Edu ampliado com renderização sem suavização

- **P = 100 px, M = 150 px e G = 200 px**. O tamanho **M é padrão** para quem ainda não tinha um tamanho explicitamente salvo. Preferências antigas migram uma única vez por categoria **P50→P100, M75→M150, G100→G200**, preservando as escolhas do jogador; os valores novos não são confundidos com os antigos em reinícios seguintes.
- `EduSpriteAtlas.java` e `RaidDayAvatarFrames.java` utilizam os mesmos tamanhos P/M/G, inclusive no fallback. Desativados os filtros de bitmap, antialias e dither; a ImageView é renderizada via camada de software para evitar interpolação nos olhos, óculos e bordas.
- **Não houve redesenho de olhos, corpo nem mudança nos dados de imagem dos 68 quadros**. O atlas original LT316 e seus cinco retoques 20/28/30/36/49 permanecem intactos. Preservados os 22 quadros ociosos, animações Shiny, Sombria e teleporte 52–60. A nitidez é uma melhoria do renderizador, não evidência de que qualquer eventual erro do desenho original foi corrigido.

### 2. Painel do relógio virtual mais limpo

- Em `EduClockSettingsActivity.java`, a Home abre um painel com **prévia grande de hora e data**, interruptor **Automático**, escolha **Momento do evento** (17 presets) e única ação **Ajustar data e hora**.
- `Mais opções` oculta o controle de **fuso horário** e o interruptor **Formato 24 horas**; removidos os dois controles redundantes de fuso que poluíam a tela. A opção Automático do fuso usa o celular; localidades Brasília/Manaus/Noronha/Rio Branco ficam disponíveis manualmente.
- Corrigidos o rótulo do fuso Brasília previamente salvo, o texto de restauração da hora no visor da Home e a escolha de momento exibida após a volta ao automático. Os 17 presets continuam relacionados ao início/fim do evento em ordem cronológica.
- **O relógio permanece único e interno ao Edu.** Ele não altera as configurações de hora, fuso ou GPS do Android, nem o Pokémon GO ou passes.

### 3. Continuidade preservada

- Primeiro balão minimalista da LT318, imagens contextualizadas #42/#38/#37/#36, contador regressivo e checklist com `ⓘ`, histórico E01–E11, duas Pokébolas independentes P1/P2, PoGoCoordinates, Doce Raro, filtros, login, rankings, Firebase, preferências, assinatura original e OTA.

## Limites de validação e próximos testes

**Homologação visual e de toque no Samsung físico ainda PENDENTE**. Embora as verificações automatizadas tenham passado, é necessário instalar a LT319 sobre a LT318 (sem desinstalar) e conferir os tamanhos 100/150/200 px, o padrão M para contas sem escolha antiga, o rosto e os olhos de cada pose, nitidez sem borrões, animações fluidas, cauda do balão perto da cabeça sem cobrir outros elementos e navegação compacta do relógio com os 17 momentos. Se os olhos ainda parecerem desalinhados após ampliar, diagnosticar o **quadro específico** em screenshot/vídeo antes de alterar a arte.

**Não afirmar instalação ou QA físico aprovado:** a Release foi publicada, mas o Android exige que o usuário confirme a instalação da atualização. Se o instalador interno Samsung fechar, abrir o APK oficial pelo navegador ou Meus Arquivos/Downloads, sem desinstalar a versão anterior.
