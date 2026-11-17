# LT384 — FastDev com Home real e atualização automática (16/11/2026, horário de Fortaleza)

## Contexto do proprietário
Duas capturas mostravam (1) painel intermediário `PokeSearch FastDev` com erro HTTP 403 e botões manuais e (2) `FastDev Live — somente visual`, contendo prévia de `dock.html` com um ícone e não os menus reais do app. O proprietário pediu que o FastDev funcionasse automaticamente, como o canal público, e que o tempo de desenvolvimento realmente melhorasse.

## Implementação integrada
- PR [#475](https://github.com/LucianoToscano/PokeSearch/pull/475), **MERGED**, squash `35be32eddd6548dc55ba58dfbac32080ef5c5c78`; SHA de código aprovado na PR: `8470d2b3b994b8f200688c497861f807ac579ea3`.
- Novo `FastDevApplication` no source set `app/src/preview`: inicializa WorkManager e consulta versão assinada quando a `MainActivity` real retoma. A variante Preview usa a Home original como único launcher.
- `app/src/preview/AndroidManifest.xml`: aplica o nome `PokeSearch FastDev`, deixa `MainActivity` como launcher e não registra a antiga atividade `FastDevLiveActivity` de sandbox. A antiga `FastDevConsoleActivity` não tem launcher; atalhos legados apontando à atividade redirecionam para Home.
- `FastDevConsoleActivity`: consulta o manifesto público de baixa quota `fastdev/latest.json`, com fallback API; quando há nova versão, baixa automaticamente, confere SHA-256, tamanho, pacote, versionCode e o certificado do APK instalado antes de abrir o instalador do Android. Não interrompe a Home diante de offline/403. Throttle monotônico de 10 min e cache do APK verificado.
- **Limite obrigatório:** Android convencional exige aprovação do instalador para atualizar um APK baixado fora da Play Store; eventualmente é preciso autorizar a fonte de instalação. Não há instalação silenciosa ou downgrade.
- Notificações WorkManager periódicas abrem a Home, e não o painel debug.
- `pokesearch-fastdev.yml` agora cria a variante Preview automaticamente após merge de código em `main` (`app/src/main/**`, `app/src/preview/**` e Gradle/CI FastDev). Sem editar `preview-request.json` e sem clicar em Actions. Pushes `docs/**` ou `fastdev/latest.json` não disparam nova build.
- `secure-release.yml` mantém o job de beta/R8, mas prévias de alterações **exclusivamente Preview** encerram sem compilar o APK oficial irrelevante. `scripts/fastdev-qa-scope.cjs` exige beta completo em mudanças de código comum, assinatura, Gradle, gates de QA, caminho desconhecido ou alteração da própria regra. Contratos testam a política fail-closed. PRs de código comum e oficial continuam com QA integral.

## Evidências da PR e build automática
- [FastDev PR #44001038705](https://github.com/LucianoToscano/PokeSearch/actions/runs/44001038705): SUCCESS.
- [QA core LT211 #44001038391](https://github.com/LucianoToscano/PokeSearch/actions/runs/44001038391): SUCCESS.
- [LT169 full Node #44001038819](https://github.com/LucianoToscano/PokeSearch/actions/runs/44001038819): SUCCESS.
- [Preview Java #44001038518](https://github.com/LucianoToscano/PokeSearch/actions/runs/44001038518): SUCCESS, compila a variante real e mescla o manifesto.
- [Beta/R8 #44001038479](https://github.com/LucianoToscano/PokeSearch/actions/runs/44001038479): SUCCESS (executada nesta PR porque a própria política de QA mudou).
- [FastDev build automático #44001429317](https://github.com/LucianoToscano/PokeSearch/actions/runs/44001429317): **SUCCESS**, disparado pelo squash da PR #475 sem alteração do arquivo de solicitação. Smoke ~22 s de job (2,92 s de testes selecionados) e job APK assinado ~100 s; execuções independentes, não SLA.
- [Pré-release FastDev 1000041](https://github.com/LucianoToscano/PokeSearch/releases/tag/fastdev-1000041): pública, prerelease e não draft, gerada automaticamente.
- [APK FastDev 1000041](https://github.com/LucianoToscano/PokeSearch/releases/download/fastdev-1000041/PokeSearch-FastDev-Preview.apk), `package=com.lucianotoscano.pokesearch.preview`, `versionCode=1000041`, `versionName=fastdev.1000041-preview`.
- APK **62.321.028 bytes**, SHA-256 `fa0d6305bb8270a33bd106bda891f24496f1648f8a2996ca752298c66b235f67`.
- Certificado permanente FastDev **e712422729f6ec3c66646f752f4cfb88c4e0d4141404a3a1c271c7a6f0aaa4ea**, mesmo do canal 1000039/1000035, verificado por `apksigner` e preflight do workflow.
- [Manifesto público FastDev](https://raw.githubusercontent.com/LucianoToscano/PokeSearch/main/fastdev/latest.json) confere exatamente tag 1000041, versão, asset, SHA-256, tamanho e SOURCE_COMMIT `35be32eddd6548dc55ba58dfbac32080ef5c5c78`.
- A versão oficial permanece **0.03.73 / versionCode 54580**, `release/official-request.json` intocado, nenhuma publicação oficial LT384.

## Ação única no Android
1. Baixar `PokeSearch-FastDev-Preview.apk` da pré-release 1000041.
2. Instalar **por cima** do FastDev existente, sem desinstalar, pois pacote e certificado são permanentes. O instalador do Android deve apresentar confirmação de atualização.
3. Abrir o ícone **PokeSearch FastDev**: agora deve entrar **diretamente na Home real**; antigo console e a simulação HTML não são telas de navegação.
4. A primeira verificação automática não deve interromper a Home se não houver versão mais recente. Na próxima release, quando existir, o app baixa/verifica o APK e chama o instalador Android, que exige aprovação.
5. Testar em Wi-Fi e dados móveis, com/sem rede, rotação, troca de contas, estado de atualização pendente, permissões de fonte, instalação por cima e preservação de preferências.

**Limites:** QA físico Android e instalação automática do instalador **ainda não executados**. O código foi compilado e os contratos verificam o launcher, mas a navegação observada no aparelho depende da instalação da nova versão. Não prometer ganho fixo de tempo de Gradle; o ganho comprovado é a automação do disparo e a eliminação de builds beta irrelevantes para mudanças exclusivamente Preview, pendente de benchmark futuro.
