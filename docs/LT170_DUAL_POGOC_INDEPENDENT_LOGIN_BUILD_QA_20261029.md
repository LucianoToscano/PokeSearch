# LT170 — Duas contas PoGoCoordinates e seleção de conta/treinador por Pokébola

Data: 29/10/2026. Base de desenvolvimento: main da LT169 (0.01.69 / 54374).
Branch: feature/lt170-dual-pogo-isolated-logins-20261029.
Estado inicial: implementação em QA, sem alteração do canal estável.

## Funcionalidade construída
- **Home com duas áreas de login:** cartão original da Conta 1 preservado, e um cartão compacto da Conta 2 com entrada Google/Discord, Gerenciar e Sair dessa conta.
- Na Home, P1 e P2 possuem seletor independente. Primeiro selecionar **Conta 1/2**; depois selecionar somente um treinador comprovadamente vinculado àquela conta pelo perfil oficial. A opção "Sem treinador" permite busca normal, sem Shiny.
- Configurações das Pokébolas persistem em SharedPreferences sem copiar credenciais. `pogoOverlayAccount1/2` e `pogoOverlayTrainer1/2` são independentes e nunca usados como prova de um treinador; a prova está na lista de treinadores verificados do slot correspondente.
- **Conta 1** = WebView/CookieManager padrão e `prefs` legados, sem migração destrutiva. **Conta 2** = WebView profile persistente exclusivo `pokesearch_pogocoordinates_account_2`, e `pogo_account_2`. AndroidX WebKit 1.17.1 + checagem runtime de `WebViewFeature.MULTI_PROFILE`; quando indisponível, não oferecer falso segundo login usando cookies globais.
- Todas as WebViews **remotas** do navegador de busca e do login da Conta 2 usam `WebViewCompat.setProfile` ANTES de tocar `WebSettings`, cookies ou navegação. O coletor API continua atuando na própria WebView da Pokébola vinculada. As WebViews locais HTML de interface não recebem o perfil remoto.
- A escolha de Conta 2 em P1 ou P2 exige autenticação confirmada no slot2; após alteração, reinicia somente o serviço afetado porque um perfil WebView ativo não pode ser trocado.
- Logout de uma conta remove apenas cookies/WebStorage e identidade do respectivo perfil; para apenas os serviços atribuídos a essa conta. Não desconecta a outra.
- O modo Shiny lê o código **da Pokébola** e valida contra os treinadores vinculados à **mesma conta**; o login Shiny direciona ao slot correto; cooldown é calculado pelo treinador atual da Pokébola.
- P1 e P2 podem usar a mesma conta e treinador, a mesma conta com treinadores diferentes (somente quando presentes na lista do provedor), ou sessões separadas A/B/B/A. Sem duplicar quotas ou privilégios Premium do PoGoCoordinates.
- Não expor JWT/cookies/credenciais por interface, backup, Analytics, Firebase ou logs.

## Compatibilidade e validação
- Suporte a multi-perfil: AndroidX WebKit `WebViewFeature.MULTI_PROFILE`, variável por pacote WebView/versão do aparelho. Se sem suporte, Conta 2 fica explicitamente indisponível. Google/Discord no WebView dependem do comportamento do próprio provedor.
- Regressões: `app/tests/lt170-dual-pogo-account-slots.test.js`, `lt104-dual-overlays.test.js` atualizado para impedir o antigo vazamento global de cookie; suíte completa Node e Gradle Android.
- Assinatura QA pela mesma keystore v2 permanente da LT169; versão experimental `0.01.70` / versionCode `54375`, protegida R8, SEM alterar a release estável `v0.01.69-54374`.
- Workflow: `.github/workflows/lt170-dual-accounts-signed-qa.yml`, acionado na branch de trabalho, inclui pacote GO offline e auditoria de hash/assinatura. Artefato QA só é válido após workflow SUCCESS.
- **Homologação física necessária:** Samsung S24 Ultra, Moto G15 (Android 15), OAuth Conta1 A/Conta2 B, P1=A/P2=B, inverter, ambas A/B, logout independente, Shiny 1/2, resultados/coords, app reiniciado e login persistente, fallback sem MULTI_PROFILE.
- PRs já abertas #121 (taxa de coords), #122 (P1/fluxo vincular) e #123 (menu Mais) ficam em branches separadas, sem merge acidental nesta mudança.
