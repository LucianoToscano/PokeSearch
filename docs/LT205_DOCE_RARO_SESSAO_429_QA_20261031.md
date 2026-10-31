# LT205 QA — Doce Raro, conta da Pokébola 1 e espera HTTP 429 (31/10/2026)

## Evidência enviada pelo usuário
- No mapa do Pokémon GO o overlay Doce Raro informa **"Aguardando liberação"**.
- Na consulta visual do PoGoCoordinates há **10 Rare Candy** e o rótulo **"Tier: Logged in"**.
- Imagens isoladas não provam que o navegador e a WebView oculta do PokeSearch usam o mesmo armazenamento de login.
- O status no overlay só é emitido se a API `POST /rare-candy/search` responder **HTTP 429**, ou se o prazo local recebido dessa resposta ainda estiver ativo. Não é o cooldown entre coletar Doces no jogo.

## Causa potencial indireta da LT204
A LT204 tornou opcional o login e permitiu escolher Conta 1/2 em P1/P2. O serviço de Doce Raro já usava a conta atribuída à Pokébola 1 **no momento em que seu WebView era criado**, mas não escutava alterações posteriores de `pogoOverlayAccount1`. Assim, a Home poderia indicar Conta 2 enquanto o serviço de doces ainda consultava uma sessão do perfil anterior.

## Mudanças propostas (QA, não publicar sem validação)
1. Registrar listener exclusivamente para `pogoOverlayAccount1`; P2 não muda Doce Raro. Se P1 trocar de conta, descartar callbacks do WebView antigo e criar outro com o perfil isolado correto, sem copiar cookies/JWT, alterar treinador, ou reativar Shiny.
2. Manter o prazo HTTP 429 (`blockedUntil`) durante a troca de conta: **nunca contornar Retry-After**. Não retirar cotas do servidor nem criar requisições paralelas.
3. Trocar o rótulo ambíguo por `API 429 · XmYYs` e atualizar a contagem localmente uma vez por segundo **sem fazer nova chamada à API**. Após o prazo, apenas o ciclo normal ou pedido pendente faz nova consulta.
4. Preservar as configurações visuais, posição do overlay, coleta confirmada e as duas Pokébolas. O estado anterior de cards é descartado ao trocar de conta para não exibir resultados de outro perfil.
5. Regressão de código: `app/tests/lt205-candy-account-429.test.js`; CI Node deve executá-la com os demais testes.

## Checklist de aparelho real
- Com P1 visitante, abrir doce e observar resposta ou erro explícito.
- Trocar apenas P1 para Conta 2 **logada**, com perfis WebView independentes; garantir que Doce Raro passe a consultar essa conta sem reiniciar o aplicativo. P2 permanece intacta.
- Trocar P2 sem mudar P1: Doce Raro não deve mudar de sessão.
- Confirmar a diferença entre Chrome externo autenticado e login dentro do PokeSearch; não declarar que a sessão é a mesma sem verificar.
- Durante HTTP 429, observar contagem decrescente e ausência de buscas repetidas; esperar o prazo real do provedor. Testar o gesto atualizar e período OFF/3/5 min.
- Validar que a coleta no jogo, a confirmação automática/✓ e o contador estimado entre doces não bloqueiam a consulta `rare-candy/search`.

**Limite de evidência:** nenhuma autenticação real, resposta da API em produção ou teste físico Samsung foi executado neste QA. Esta proposta não garante que o backend remova o 429; depende do provedor e do estado real da sessão/limite.
