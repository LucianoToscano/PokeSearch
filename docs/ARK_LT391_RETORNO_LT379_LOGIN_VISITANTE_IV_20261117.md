# ARK LT391 — retomar fonte LT379 / PokeSearch v0.03.73 LT

**Pedido:** retorno ao código oficial da versão `v0.03.73-54580` (commit exato `7db1d3e65ed0cf5592f51b61945e0ec1ab570c97`). Branch isolada `fix/lt391-v00373-login-guest-iv-sprites-20261117` nasceu dessa tag. A release v0.03.75/54582 continua pública para usuários existentes enquanto a nova implementação é validada.

## Evidência das capturas de 17/11/2026
1. Uma Pokébola exibe `IV não comprovado` ao ler **cinco cartões** e não aceitar nenhum como IV 100%. Isso demonstra perda de comprovação, não ausência de Pokémon no site. Testes Node anteriores não foram prova de funcionamento físico.
2. A Home no aparelho estava na **v0.03.74 LT**, com caixas cinza de contas grandes, login manual por provedor, diálogo de visitante, chat ao vivo e ações de perfil manuais. O usuário quer um hub pequeno com foto/nome e logout/login por conta no mesmo lugar; automaticamente visitante se não autenticado.
3. O provedor exibiu HTTP 429, que é restrição upstream real. O botão de refresh manual não deve ter espera artificial local; respeitar apenas requests concorrentes e `Retry-After`/429 reais.
4. Outros relatos: resultados públicos 1 vs 5, sprites #129 Magikarp/#580 Ducklett, `+5` cinza, erros `!` sem explicação, nome/foto não sincronizados.

## Correções preparadas (não são ainda homologação Samsung)
- Backports selecionados das correções LT386–LT390 para base LT379 (Home/contas, leitura DOM visitante, coordenadas por cartão, sprites e cards).
- Padrão AUTO 3 minutos e sem seletor 3 segundos; toque manual fora do temporizador.
- Retiradas mensagens técnicas repetitivas do corpo do card; mantém validação real de filtro e limites do provedor.
- Leitor de IV agora procura porcentagem etiquetada `IV` em texto e atributos acessíveis de **cada cartão visível**. Badge por cartão 100% determina matematicamente 15/15/15 e 0% determina 0/0/0; nunca usa o valor do filtro da busca para certificar um encontro.
- Erro de cinco IVs ausentes passa a explicar que os cinco cartões foram vistos mas o IV individual não foi comprovado, sem declarar zero encontros.
- Hub compacto na Home com duas contas, nomes e avatar em cache vinculado à identidade da conta, login via página oficial e logout por conta; visitante automático; Chat oculto por padrão/uma migração única e reativação manual.
- Testes de regressão `probe-smoke.test.js` e `lt391-guest-profile-iv.test.js`.
- A liberação de novas coordenadas após cota do provedor **não é obtida limpando cookies/cache**. Não apagar autenticação, não burlar limites do servidor. Limpeza de histórico local para privacidade permanece recurso separado quando disponível.

## Regras para ARK
- CI: Node QA, LT169, LT211, LT62 Java, LT173 OTA, PGS QA APK, FastDev, beta R8; investigar falhas sem falsear SUCCESS.
- **Base de código** é 0.03.73; o **próximo código Android** precisa ser >54582, porque já existe APK oficial v0.03.75/54582 instalado em usuários. Sugerida versão v0.03.76/54583/label 51391, apenas se os gates passarem.
- O workflow protegido é a única rota de publicação. Assinatura permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, sem substituição.
- Os quatro segredos de FastDev devem existir no ambiente protegido e **nunca ser colocados no Git**. Não inventar nem pedir valores secretos em resposta. Workflows anteriores assinados tiveram êxito; não há razão para recriar o keystore em código.
- Homologação física **pendente**: Conta 1/2, Google/Discord e MFA, avatar/nome, retrato/paisagem, 5 encontros efetivos do site, IV100/GL/UL, #129/#580, 429, coordenadas públicas, áudio e menus P1/P2. Uma busca que mostra 5 cartões sem IV real não pode ser classificada como 5 IV100.

## Próximo passo
Abrir PR desta branch, executar CI, corrigir falhas. Com QA verde, fazer squash merge, preparar pedido oficial monotônico, publicar release assinada e atualizar Guia Mestre/AGENTS. Sem CI ou assinatura aprovados, registrar o bloqueador e manter versão oficial anterior.
