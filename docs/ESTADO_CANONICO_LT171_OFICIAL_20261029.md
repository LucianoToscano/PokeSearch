# PokeSearch — Estado canônico LT171 OFICIAL (29/10/2026)

## Versão pública mais recente, verificada em GitHub Releases

- **LT171, versionName `0.01.71`, versionCode `54376`**.
- Repo `LucianoToscano/PokeSearch`; base original: LT170 oficial 0.01.70/54375.
- PR de código/Guia Mestre: [#128](https://github.com/LucianoToscano/PokeSearch/pull/128), merge squash `e7570bd169fca569ff4fd2d5f6fd2fce82164080`.
- **SOURCE_COMMIT imutável do APK** `e7570bd169fca569ff4fd2d5f6fd2fce82164080`. Alterações documentais posteriores não alteram este APK.
- Tag estável/latest: [v0.01.71-54376](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.71-54376), publicada 29/10/2026 às 16:00:48 UTC, `draft=false` e `prerelease=false`.
- APK: [PokeSearch-v0.01.71-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.71-54376/PokeSearch-v0.01.71-LT.apk).
- Tamanho exato **49.510.871 bytes**.
- SHA-256: `1a00dde87c54f6119b6153cf9be4b7bf7c055233d7923aa5b7a287907e486ede`, igual ao campo `digest` do asset da API GitHub Releases, `state=uploaded`.
- Certificado permanente Android v2: SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; proteção R8 preservada pelo workflow oficial.
- [GitHub Actions oficial #40906715606](https://github.com/LucianoToscano/PokeSearch/actions/runs/40906715606) — **SUCCESS**, 25 etapas aprovadas, incluindo suites Node, build Android R8, assinatura, integridade ZIP, versão, SHA e confirmação da release latest.
- [Artefato de evidências #12910689262](https://github.com/LucianoToscano/PokeSearch/actions/runs/40906715606/artifacts/12910689262): ZIP **46.717.902 bytes**, SHA-256 `0f504db7252716debee72b521070883eea97b1b3e1d4b5a34934329a9b41c45b`. Inclui APK assinado de QA e relatórios do build. Artefato GitHub Actions pode expirar; a Release é o canal persistente.
- Release histórica LT170 `v0.01.70-54375` preservada sem sobrescrita.

## Implementação da LT171

- Home com **dois cards completos e de estilo igual**. Conta 1 mantém layout já existente, Conta 2 agora exibe avatar circular, login oficial Google/Discord, nome da conta/provedor, Sair, equipe, treinador, nível, código, copiar e Gerenciar/Remover no perfil oficial.
- Conta 2 usa `PogoAccountSlots.prefs(context,2)`, cookie jar e perfil WebView separados. Sem `WebViewFeature.MULTI_PROFILE`, o segundo login é bloqueado, com mensagem explícita, em vez de usar a sessão da Conta 1.
- Nos dois cards, `Anônimo` e `XXXX XXXX XXXX` são apenas apresentação e nunca alteram a identidade real; copiar código usa o valor real.
- Conta VIP com **dois treinadores confirmados no site** apresenta Treinador 1 e Treinador 2; conta comum com apenas um oferece somente o treinador existente. Não se criam treinadores fictícios.
- Pokébola 1 e Pokébola 2 podem selecionar Conta 1 ou 2 e treinador de cada conta **independentemente**. Uma mesma Conta VIP pode alimentar P1=Treinador1 e P2=Treinador2 ou ambos usando o mesmo treinador. A escolha feita no card de Conta 2 não troca automaticamente o treinador explicitamente atribuído à outra Pokébola.
- Avatar público Google da Conta 2 carregado com allowlist de host, sem enviar cookies ou JWT entre sessões. Sem imagem ou rede, usa ícone neutro.
- Preservados sistema de filtros, GL/UL, Shiny da conta correta, sprites/cache offline, coordenadas completas, alertas, Favoritos, chat e Home Premium.

## Testes, limites e governança

- [Node regressão completa LT171 #40906529536](https://github.com/LucianoToscano/PokeSearch/actions/runs/40906529536): **SUCCESS** na revisão final (aprovou `lt171-vip-two-trainers-per-account.test.js` e `lt171-two-mirrored-profile-cards.test.js`).
- [Java Android compile LT171 #40906529994](https://github.com/LucianoToscano/PokeSearch/actions/runs/40906529994): **SUCCESS**.
- **QA visual real Samsung não executado neste ambiente**. Testar dois logins simultâneos (conta VIP 2/2 e comum 1/1), P1/P2 misturadas, copiar código oculto, avatar, dark/light, Shiny e logout individual.
- O feed GitHub Releases está em `latest=v0.01.71-54376`. O aplicativo elegível deve oferecer a atualização por seu mecanismo existente; **instalação não é silenciosa nem garantida sem aceite do usuário**.
- PRs QA #121, #122 e #123 permanecem separadas; não afirmar que foram integradas nesta LT171 sem merge posterior.
- Próxima LT172+ deve partir de `main` e do `releases/latest` reais, preservar assinatura permanente e paridade das duas Pokébolas. Não recomeçar de LT169/LT170 e não alterar o backup integral `GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md`.
