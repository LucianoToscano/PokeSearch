# Registro canônico LT172 — coordenadas, menu e treinador (29/10/2026)

## Origem e escopo
- Base estável preservada: LT171 `0.01.71/54376`, release `v0.01.71-54376`.
- Integração autorizada: [PR #130](https://github.com/LucianoToscano/PokeSearch/pull/130), merge squash `40e94bafe86dfb778be719e0cf1310a7f3085457` na main.
- Componentes reaproveitados: [PR #121](https://github.com/LucianoToscano/PokeSearch/pull/121) (Taxa Limitada PoGoCoordinates ⓘ, tempo oficial, contador circular), [PR #122](https://github.com/LucianoToscano/PokeSearch/pull/122) (não minimizar P1 e vínculo manual) e [PR #123](https://github.com/LucianoToscano/PokeSearch/pull/123) (menu ⋯ sem fundo preto). As alterações foram reaplicadas na main LT171, preservando contas e treinadores VIP.
- **Permanecem os dois cards completos** Conta 1/Conta 2, com login Google/Discord, equipe, foto, nome, treinador, código e opções de privacidade. Cada Pokébola pode escolher Conta 1 ou Conta 2 e Treinador 1/Treinador 2 caso a conta VIP efetivamente possua 2 treinadores, verificados pela lista oficial por sessão. Nenhum treinador inexistente é inventado.
- A mensagem **Taxa Limitada PoGoCoordinates ⓘ** só aparece diante de uma recusa oficial (API HTTP 429, VIP ou indicação visível do site); outros erros mantêm seus motivos. O ícone abre explicação, tempo somente se informado pelo site. Contador de usos em círculo 22px; contagem local não é saldo total oficial.
- A barra ⋯ usa caixas individuais e o mesmo tamanho do botão original, sem fundo comum. A Pokébola 1 abre o overlay sem minimizar a Home. A ação Gerenciar sem treinador localiza o formulário oficial; Look up/Yes, link it continuam manuais e retorno às buscas só ocorre com vínculo confirmado pelo perfil oficial, no login atribuído.

## Evidências de QA
- [PR #130](https://github.com/LucianoToscano/PokeSearch/pull/130) mesclada. Node QA, regressões completas e compilação Java Android concluídos com sucesso na branch antes de mesclar.
- Workflow assinado de distribuição: [GitHub Actions #40909102893](https://github.com/LucianoToscano/PokeSearch/actions/runs/40909102893). Configuração `.github/workflows/lt172-coords-menu-trainer-official-release.yml` exige assinatura Android v2 permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, pacote `com.lucianotoscano.pokesearch`, R8, versionCode 54377 e versionName 0.01.72, ZIP íntegro, SHA-256 e `releases/latest`. Bloqueia lançamento se a latest não for a LT171.
- **Status de distribuição, arquivo, SHA-256 e tamanho:** preencher apenas após GitHub Release latest confirmar a publicação. Não alegar que todos os Androids instalaram: o atualizador oferece download e instalação voluntária.
- QA visual físico Samsung de 2 contas simultâneas, diferentes treinadores VIP, limites reais de Get coords, badge de números, popup ⋯ e vínculo do site ainda pendente. CI não valida navegação viva Google/Discord.

## Regra para próximas etapas
A base canônica deve ser a latest validada no GitHub, não apenas o conteúdo da main; manter Histórico, P1/P2, Premium, Shiny, filtros, chat, coordenadas, certificação e limites oficiais do PoGoCoordinates. Não modificar o backup integral do Guia Mestre. Não sobrescrever tags históricas.
