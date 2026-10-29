# LT172 — Integração das correções de coordenadas, menu e vinculação

Data: 29/10/2026. **Base confirmada:** LT171 `0.01.71` / `54376`, tag `v0.01.71-54376` publicada. Branch `release/lt172-pogo-coords-menu-trainer-20261029`, PR #130.

## Escopo entregue ao pipeline

- Home: **preservados os dois cards completos** da Conta 1 e Conta 2 (avatar, Google/Discord, equipe, treinador, código, copiar, gerenciar, logout, opções de privacidade). Implementação oficial LT171 mantida; não substituir pela implementação simplificada das branches antigas.
- Seleção P1/P2 de Conta 1 ou Conta 2 e **Treinador 1 / Treinador 2** para conta VIP: mantém a verificação por códigos oficiais distintos armazenados por conta, sem inventar segundo treinador se o site só listar um. As sessões de WebView da Conta 2 continuam isoladas.
- PR #121: **Taxa Limitada PoGoCoordinates ⓘ** somente quando a recusa é confirmada pelo site ou backend autorizado da API. Distingue rate temporário e cota de revelações gratuitas; tooltip acessível, contador regressivo apenas se texto do site contém tempo verificável; sem automação de novas tentativas nem bypass. Contador de Get coords em círculo de 22px; valores locais não representam saldo oficial total.
- PR #122: Pokébola 1 mantém Home visível ao abrir overlay; `Gerenciar` para conta sem vínculo abre o formulário **Link my account** quando identificado com segurança no DOM oficial, sem clicar em **Look up**/**Yes, link it**. Após vinculação efetivamente confirmada no DOM, volta à página `/search`. Adaptado para não confundir cookies de Conta 1 e Conta 2.
- PR #123: menu vertical ⋯ com **botões individuais**, sem fundo preto atrás da coluna; tamanho e separação herdados da barra, inclusive no WebView independente via ponte Android.
- Respeitados GPS, Pokémon GO PvP/GL/UL, Premium, chat, filtros, histórico, sprites, login e Shiny por treinador validado e paridade das duas Pokébolas.

## Qualidade, artefato e publicação

- Testes originais LT170 das três PRs integrados sem sobrescrever a `main` LT171, e regressões antigas adaptadas.
- Novo pipeline **`.github/workflows/lt172-coords-menu-trainer-official-release.yml`**, origem LT171, JDK 17 / Gradle 8.11.1 / compileSdk36; teste Node completo, Java, assets GO, build Android R8, assinatura Android v2 permanente SHA-256 de certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, APK ZIP e SHA-256.
- Candidata: LT172 / `0.01.72` / `54377`. **Release somente se** `releases/latest` ainda for `v0.01.71-54376`; nunca sobrescrever asset ou tag existente. Instalação disponibilizada no feed GitHub Releases com aceitação do usuário.
- A publicação e o hash de APK devem ser registrados **após confirmação real** no Actions, não antes.
- **QA físico pendente**: duas contas simultâneas no Samsung e outro aparelho Android, 1/2 treinadores VIP, limitador real do site, contagem circular, tooltip, P1 não minimiza, status após Link my account e 3 ações do menu ⋯.
