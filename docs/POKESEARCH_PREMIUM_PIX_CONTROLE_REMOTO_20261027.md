# PokeSearch — distribuição controlada + Premium Pix automático
Checkpoint: 27/10/2026. **Somente branch QA, não implantado em produção.**

## Identidade e compatibilidade
Base imutável: main LT124 no commit 65c9b4219744bad180e435faa23739e08e7d183f.
Não altera as branches LT125/LT126, o applicationId, o fluxo PoGoCoordinates, cookies, modos GL/UL,
as duas WebViews independentes, alertas, sprites ou os filtros.
A compilação normal mantém CONTROLLED_DISTRIBUTION=false e continua com P1/P2 preexistentes;
somente o APK de distribuição assinado explicitamente com POKE_CONTROLLED_DISTRIBUTION=true
usa a nova checagem. Não lançar este candidato sem implantar as funções.

## Regras de negócio
- APK de distribuição: **sem prazo de expiração**. Controle remoto global e individual por versionCode.
- P1: gratuita enquanto a edição for autorizada online.
- P2: requer licença Premium ativa no servidor, obtida com Pix ou chave de recuperação.
- Premium comprado: R$ 10,00 por 30 dias, com promoção de R$ 5,00 inicialmente ativada por
  tempo indeterminado até o proprietário desligar ou alterar os preços no painel.
- Cada pagamento aprovado e distinto soma exatamente 30 dias ao vencimento vigente
  (se já vencido, soma a partir do momento da aprovação).
- Licenças manuais/presente: o proprietário escolhe individualmente 15 dias, 1 mês,
  3 meses, 6 meses, 12 meses ou vitalícia; NÃO há limite de 10 amigos nem de presentes.
  Chaves não atribuídas começam a contar apenas na ativação pelo destinatário.
  Chaves diretamente vinculadas a um UID começam a contar na concessão pelo administrador.
- O proprietário pode ampliar a licença existente, escolher outro período ou convertê-la
  em vitalícia; os prazos de meses são de calendário, não 30 dias multiplicados.
- Chaves manuais são emitidas pelo servidor e só são exibidas UMA vez ao administrador;
  salvar/compartilhar com cuidado. São vinculadas a um UID na primeira ativação.
- A chave PS-... gerada por pedido fica vinculada a um UID Firebase, permite no máximo uma
  migração mediante posse da chave e respeita o vencimento original. Guarde-a com segurança.
- Alterar data ou limpar dados Android não renova um direito de acesso. O cliente usa lease
  volátil monotônico, sem SharedPreferences de autorização. Na ausência de validação, falha fechado.
- Bloqueio/remessa não são instantâneos sem internet; após expirar o lease (máximo 65 segundos),
  nenhuma Pokébola controlada poderá ser inicializada. Serviços vivos revalidam a cada 45 segundos.
- APKs antigos **sem este código** não recebem bloqueio remoto retroativo.

## Fluxo Pix
1. Comprador informa e-mail para criar a order Pix no Mercado Pago. O CPF não é solicitado
   pelo aplicativo para este checkout e o e-mail não é persistido na RTDB do PokeSearch.
2. createPremiumPix autentica usuário anon Firebase e aceita preço somente de premium/config.
   Sem configuração explícita (salesEnabled=true e priceCents válido), NÃO há venda.
3. API POST /v1/orders com processing_mode=automatic, transação Pix, X-Idempotency-Key
   e external_reference UUID aleatório; lê transactions.payments[0].payment_method.qr_code.
4. premiumPixWebhook valida HMAC x-signature em tempo constante e consulta a order diretamente
   por GET /v1/orders/{id}. Confere identificador, live_mode, valor, transação Pix,
   referência e status=processed/accredited nos níveis da order e do pagamento.
5. Uma transação sobre a licença registra paidOrders[id] para não adicionar prazo duas vezes.
6. Cliente consulta getPremiumOrder a cada 12 segundos enquanto checkout está aberto, recuperando
   também eventos de webhook não recebidos. A liberação depende exclusivamente do estado do servidor.
7. Reembolso/chargeback comprovado suspende o acesso até análise administrativa. Um pedido não
   aprovado ou cancelado não gera licença.

## Firebase Cloud Functions e configuração obrigatória antes da produção
O projeto Android já usa Firebase Auth anônimo + RTDB com FirebaseApp nomeado PokeSearchStats.
Novas callables HTTPS (região us-central1):
checkDistributionAccess, createPremiumPix, getPremiumOrder, redeemPremiumKey,
getPremiumOffer, adminIssuePremiumKey, adminAdjustPremiumExpiry,
adminDistributionControl, adminPremiumSettings, adminPremiumOverview.
Nova função HTTPS para webhook: premiumPixWebhook.

Segredos no Google Secret Manager / Firebase Functions (SEPARAR teste e produção):
- POKE_MP_TEST_ACCESS_TOKEN: token privado de TESTE, para homologação sem cobrança real.
- POKE_MP_ACCESS_TOKEN: token privado de PRODUÇÃO, apenas após rotação da credencial
  exposta e liberação deliberada; não utilizar para testes.
- premium/config/paymentsLiveEnabled precisa ser true para usar o token de produção.
  Ausente ou false usa somente o token de teste.
- POKE_MP_WEBHOOK_SECRET: segredo do webhook da aplicação Mercado Pago.
- URL pública do webhook (premiumPixWebhook) configurada no painel Mercado Pago,
  tópico de Orders. Não é necessário armazenar esta URL como segredo.
- POKE_PREMIUM_KEY_SECRET: segredo longo e aleatório; preservar entre versões e reinicializações.

NUNCA guardar segredos ou CPF em GitHub, aplicativo Android, JSON de regras, logs,
artefatos de QA, README ou Drive compartilhado. O administrador precisa obter a identidade
Firebase UID da conta de controle e atribuir de modo seguro a custom claim
pokesearchAdmin=true via Firebase Admin SDK em ambiente privado. Não hardcodar UID no app.
O botão Admin fica no toque longo na marca PokeSearch na Home, apenas na edição controlada;
cada operação revalida a claim no servidor, mesmo se alguém reproduzir a interface.

Configurar a primeira versão controlada em distribution/versions/<versionCode>=true,
distribution/globalEnabled=true, premium/config/regularPriceCents=1000,
premium/config/promotionalPriceCents=500, premium/config/promotionEnabled=true,
premium/config/salesEnabled=true APENAS após checkout homologado.
Esses caminhos não têm leitura/escrita pública.
Também testar que o projeto e a instância RTDB correspondem ao deploy real, configurar
App Check/Play Integrity para APK sideloaded e avaliar faturamento Cloud Functions v2.
NÃO ligar vendas reais antes da homologação de pagamento TESTE, estorno e renovação.
IMPORTANTE: a Public Key começa com APP_USR e não é suficiente para autenticar
requisições de Orders no backend. O Access Token de produção compartilhado anteriormente
em imagem deverá ser renovado/revogado antes de qualquer uso, nunca adicionado ao repositório.

## Testes e rollout necessários
1. Node --check de functions/index.js e functions/premium.js; 18 contratos estáticos,
   suítes LT104 LT112 LT113, gradle :app:assembleDebug na GitHub Actions de QA.
2. Firebase Emulator (Auth, Database, Functions) com mocks de MP: aprovado, duplicado,
   pending, cancelado, chargeback, preço adulterado, assinatura inválida, transferência de chave.
3. App Check em homologação e Firebase Auth admin; whitelists/versionCodes com fallbacks bloqueados.
4. Assinatura oficial idêntica (cert SHA-256 fixado, Android v2+), R8, artefato protegido sem fontes.
5. Android Samsung SM-S928B com P1/P2, aplicação bloqueada/desbloqueada, modo avião,
   retrocesso do relógio, reinstalação e restauração por chave.
6. Adquirir pagamento teste Mercado Pago (SEM movimentar dinheiro real involuntariamente)
   e checar webhook assinado, renovação 30 dias e fechamento automático de P2.
7. Apenas após validação e preço aprovado pelo proprietário: habilitar vendas e publicar
   edição de distribuição controlada em branch separada, sem merge automático na main.
8. Atualizar o prompt antigo do Drive de "15 dias" para política de controle remoto após
   homologação, preservando uma cópia histórica e sem sobrescrever documentação existente.

## Observações e limites
- A versão normal NÃO passa a cobrar pela Pokébola 2 automaticamente.
- Novas modalidades manuais dependem do administrador, nunca de pagamentos falsos.
- O webhook/ativação em produção, cobrança real, Firebase App Check e APK assinado distribuível
  **ainda não foram executados**. CI verde não prova aprovação do Mercado Pago ou Samsung.
- O certificado e o código instalado podem ser adulterados em dispositivos sob controle de
  terceiros. Nenhum mecanismo somente Android é inviolável; esta solução conserva as decisões
  e os segredos no servidor, valida e expira autorizações breves.
- Não usar nem expor o token PoGoCoordinates neste sistema de pagamentos.

## Revisão de requisitos — 27/10/2026
A solicitação de 10 amigos vitalícios + 20 presentes foi **substituída** por administração
sem quotas: uma licença por emissão, período individual (15d/1m/3m/6m/12m/vitalícia)
e escolha explícita do destinatário. O proprietário pode gerar quantas licenças
vitalícias ou temporárias quiser. As chaves manuais gratuitas não alteram o
checkout Pix padrão de 30 dias; o preço da oferta é determinado pelo servidor.

## Migração Mercado Pago Orders API — 27/10/2026
A aplicação PokeSearch foi criada pelo proprietário com Checkout Transparente / Orders API.
Migração em branch de QA: POST/GET /v1/orders, status processed/accredited,
assinatura HMAC e separação explícita entre token de teste e de produção. Nenhum
segredo real foi enviado ao GitHub. Public Key não é necessária ao checkout Pix
executado integralmente pelo backend; não é seguro substituir Access Token por ela.
Fontes: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/pix
