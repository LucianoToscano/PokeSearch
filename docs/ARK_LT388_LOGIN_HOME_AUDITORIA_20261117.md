# ARK LT388 — Auditoria de login e Home compacta

## Pedido e evidência
Captura enviada em 17/11/2026: a Home exibe simultaneamente um cartão visitante com Google/Discord e um cartão de Conta 2 autenticada, ocupando área acima da Comunidade. O proprietário relata que o login não funciona corretamente. A imagem comprova o excesso de espaço e a coexistência de estados distintos, mas **não comprova a causa exata da falha OAuth**.

## Mudança implementada
- Ocultar **ambos** os cartões grandes com `View.GONE`, preservando os componentes e as preferências existentes. Não usar `INVISIBLE`, pois deixaria o espaço vazio.
- O ícone PoGoCoordinates no cabeçalho agora abre o **menu de contas**, não força login/gerenciamento da Conta 1. Esse menu já oferece Conta 1, Conta 2 (se suportada), atribuições das Pokébolas e opções de gerenciamento.
- Não misturar estado de login da Conta 1 e Conta 2, não desconectar Conta 2 para tentar recuperar Conta 1, não criar perfil fictício e não declarar autenticação com base apenas em redirecionamento OAuth.
- Contrato automatizado: `app/tests/lt388-compact-home-account-entry.test.cjs`.

## Auditoria de login — riscos concretos para QA
1. `openLoginDialogForSlot` inicia uma WebView por slot; a segunda sessão depende de `PogoAccountSlots.supportsSecond()`. Verificar comportamento em Android sem segunda partição WebView.
2. `checkLoginSession` faz verificações assíncronas e pode entrar em estado de espera após OAuth; `captureOfficialProfile` exige URL `/profile`, nome validado e React hidratado. Atrasos podem deixar a interface aparentemente presa mesmo quando o navegador externo logou.
3. O fluxo de login e o de atualização de perfil são distintos: um nome/foto ausente não deve transformar sessão autenticada em visitante, e um redirecionamento sem prova não deve marcá-la como autenticada.
4. `preferredLoginProvider`, `observedLoginProvider`, `loginPageGeneration` e `activeLoginSlot` são estados mutáveis; testar troca rápida de conta e callbacks atrasados, sem atribuir um resultado da Conta 1 à Conta 2.
5. Verificar cookies e persistência após fechar/reabrir, Google e Discord, retorno de app externo, sessão expirada, avatar, perfil oficial e comportamento com overlay P1/P2 em execução.
6. O bug de autenticação relatado **ainda não foi reproduzido em dispositivo**. Não afirmar correção completa do login até capturar logs e teste físico.

## Critérios de release
CI Node + Android compilação + testes de conta 1/2 + teste físico OAuth + confirmação de APK assinado + merge + release + registro de ARK. **Não publicar APK como corrigido antes da validação física do login.**
