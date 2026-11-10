# PokeSearch — Especificação: duas áreas independentes de login PoGoCoordinates e associação por Pokébola

Data: 29/10/2026. Documento de design, **nenhum código funcional ou APK entregue nesta PR**. Base pública LT169 (0.01.69/54374), sem alterar PRs de QA LT170 #121, #122 e #123.

## Requisito do usuário

A Home deve oferecer **duas áreas de login separadas**, cada uma podendo autenticar uma conta PoGoCoordinates.com diferente via fluxo oficial Google/Discord. O usuário pode escolher de maneira independente para a **Pokébola 1** e **Pokébola 2**:
- qual das duas contas PoGoCoordinates conectadas usar;
- qual treinador Pokémon GO realmente vinculado a essa conta usar (se houver mais de um, conforme a capacidade do site).

Matrizes obrigatórias: P1=conta1/P2=conta2; ambas=conta1; ambas=conta2; contas trocadas; mesma conta mas treinadores diferentes **somente se ambos estiverem legitimamente vinculados a essa mesma conta no site**. A imagem do site mostra "Pokémon GO accounts 0/1"; portanto não prometer selecionar treinador2 sob conta1 se o provedor permitir somente um vínculo naquele login.

## Home — layout proposto

Seção compacta "Contas PoGoCoordinates" com dois cartões simétricos:
- **Conta 1:** estado Conectar / Conectada Google ou Discord / Reconectar, avatar e nome respeitando a preferência de privacidade, treinador vinculado, botão Gerenciar/Vincular, Sair **somente desta conta**.
- **Conta 2:** os mesmos controles e status totalmente independentes.
- Se uma área estiver desconectada, indicar sem acesso e oferecer login oficial somente nela; não preencher com credenciais da outra.
- Seções de Pokébola 1 e Pokébola 2: seletor de Conta 1/2 (desabilitar contas sem login confirmado); seletor do treinador verificado **da conta escolhida**. Com um treinador, escolha automática; com dois ou mais válidos, oferecer troca por ícone discreto; nenhum treinador, Shiny bloqueado apenas naquele escopo.
- Nada de áreas enormes ou menus redundantes: usar cartões compactos no estilo vidro existente. Preservar Pokébola 1 sem minimizar (PR #122) quando essa alteração for integrada.

## Arquitetura e segurança

**Situação verificada (LT169)**:
- `SecondaryOverlayService` herda `OverlayService`. O comentário original confirma que ambos compartilham cookies/autenticação WebView.
- `OverlayService` usa `CookieManager` padrão, `prefs` para seleção global do treinador Shiny, e `prefs_secondary` somente para filtros e visual. O broadcast `TRAINER_CHANGED` atual força ambas as Pokébolas a atualizar. Duplicar seletores sem refatoração misturaria identidades, Shiny, resultados e cotas.
- `app/build.gradle.kts` ainda não declara dependência direta `androidx.webkit:webkit` no baseline lido.

**Caminho recomendado**:
1. Verificar suporte `WebViewFeature.MULTI_PROFILE` usando AndroidX WebKit; quando suportado, configurar `WebViewCompat.setProfile` no início da construção de cada WebView PoGoCoordinates. Perfis persistentes nominados, ex. `pogo_account_1` e `pogo_account_2`; dados e cookies específicos da conta. Android docs: https://developer.android.com/reference/androidx/webkit/WebViewCompat ; https://developer.android.com/jetpack/androidx/releases/webkit .
2. A Home deve abrir a WebView autenticada do **mesmo** perfil que o overlay selecionado, jamais criar um WebView padrão e assumir que o login da outra conta vale nele. Manter sessão existente do perfil padrão como Conta 1 na migração, sem deslogar clientes antigos. P2/Conta 2 inicia vazio e só é usado depois de login oficial.
3. Toda leitura de `/users/me`, `/trainer`, prova DOM, token temporário, sessão, Shiny e `reveal` deve ser operada **exclusivamente** no WebView/profile selecionado por aquele overlay. `CookieManager.getInstance()` representa apenas perfil padrão; nunca usar isso para limpar/atribuir cookies da Conta 2. Preferir APIs de cookie/armazenamento associados a `Profile`. Não copiar JWT/cookies entre contas.
4. Guardar configurações não secretas por `accountSlotId` e `overlaySlotId`, separar `linkedTrainerCode`, lista verificada de treinadores, sessões observadas, cooldown/captura quando associados ao treinador e status UI. Não exportar cookies, tokens, contas Google nem dados confidenciais em backups JSON.
5. Ao mudar conta/treinador de uma Pokébola: cancelar requests em voo, aumentar generation daquele serviço, invalidar somente seus cards Shiny/resultados/alertas e recarregar do login selecionado. Não reiniciar, desconectar ou reconfigurar o outro overlay desnecessariamente. Logout de Conta 1 invalida os overlays associados à Conta 1, não Conta 2.
6. Mesma conta selecionada para ambas: reutilizar profile/identidade, sem duplicação de login ou ganhos artificiais de limites. Contas diferentes usam seu estado real perante o provedor; nunca contornar quotas/grátis/Premium.
7. Se `MULTI_PROFILE` não estiver disponível, **não simular sessões independentes no mesmo CookieManager**. Mostrar indisponibilidade do segundo login ou planejar isolamento alternativo explícito por processos Android, após auditoria de compatibilidade. Não afirmar que suporte em biblioteca equivale a suporte no aparelho.
8. Garantir controles do Google/Discord somente por fluxos oficiais, sem automatizar confirmação permanente do treinador; verificar possíveis restrições de autenticação OAuth em WebViews Android e teste real no Samsung.

## Testes de aceite antes de APK

- Conta1 Google A + Conta2 Google/Discord B conectadas ao mesmo tempo; sessões, nome, Premium e treinador corretamente isolados após reiniciar o aplicativo.
- P1 A/P2 B; P1 B/P2 A; ambas A; ambas B; P1 e P2 com conta igual mas filtros independentes.
- Login/logout/relogin de um slot não invalida outro slot; erro/expiração de um não herda cookies nem Shiny do outro.
- Troca de treinador só permite os vinculados ao slot, sem herdar o código global anterior. Se site mostrar 0/1, impedir escolha do treinador de outro login.
- 10-result cap, Get coords/reveal, rate limits, Premium e alertas respeitam autorização de cada conta.
- Testar no Samsung S24 Ultra e Android de segunda marca, atualizações do WebView, cold start, rede perdida, dois overlays simultâneos e restauração após processo morto.
- Exigir revisão de segurança das APIs e scripts antes de distribuição; sem merge automático, alteração Firebase ou Release oficial nesta PR.

**Governança:** este documento é somente contrato de implementação futura. LT169 continua latest oficial, PRs #121/#122/#123 preservadas e separadas. Não criar duas telas visualmente independentes com autenticação compartilhada.
