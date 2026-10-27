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
- Premium: cada pagamento aprovado e distinto soma exatamente 30 dias ao vencimento vigente
  (se já vencido, soma a partir do momento da aprovação).
- A chave PS-... gerada por pedido fica vinculada a um UID Firebase, permite no máximo uma
  migração mediante posse da chave e respeita o vencimento original. Guarde-a com segurança.
- Alterar data ou limpar dados Android não renova um direito de acesso. O cliente usa lease
  volátil monotônico, sem SharedPreferences de autorização. Na ausência de validação, falha fechado.
- Bloqueio/remessa não são instantâneos sem internet; após expirar o lease (máximo 65 segundos),
  nenhuma Pokébola controlada poderá ser inicializada. Serviços vivos revalidam a cada 45 segundos.
- APKs antigos **sem este código** não recebem bloqueio remoto retroativo.

## Fluxo Pix
1. Comprador informa e-mail e CPF exclusivamente para criar o Pix Mercado Pago; dados não são
   persistidos na RTDB PokeSearch (o Mercado Pago os processa sob seus próprios termos).
2. createPremiumPix autentica usuário anon Firebase e aceita preço somente de premium/config.
   Sem configuração explícita (salesEnabled=true e priceCents válido), NÃO há venda.
3. API POST /v1/payments com X-Idempotency-Key e external_reference de UUID aleatório.
4. premiumPixWebhook valida HMAC x-signature em tempo constante e consulta pagamento diretamente
   por GET /v1/payments/{id}. Confere valor, Pix, referência e status=approved.
5. Uma transação sobre a licença registra paidOrders[id] para não adicionar prazo duas vezes.
6. Cliente consulta getPremiumOrder a cada 12 segundos enquanto checkout está aberto, recuperando
   também eventos de webhook não recebidos. A liberação depende exclusivamente do estado do servidor.
7. Reembolso/chargeback comprovado suspende o acesso até análise administrativa. Um pedido não
   aprovado ou cancelado não gera licença.

## Firebase Cloud Functions e configuração obrigatória antes da produção
O projeto Android já usa Firebase Auth anônimo + RTDB com FirebaseApp nomeado PokeSearchStats.
Novas callables HTTPS (região us-central1):
checkDistributionAccess, createPremiumPix, getPremiumOrder, redeemPremiumKey,
adminDistributionControl, adminPremiumSettings, adminPremiumOverview.
Nova função HTTPS para webhook: premiumPixWebhook.

Segredos no Google Secret Manager / Firebase Functions:
- POKE_MP_ACCESS_TOKEN: token privado de API da conta Mercado Pago **produtora**.
- POKE_MP_WEBHOOK_SECRET: segredo do webhook da aplicação Mercado Pago.
- POKE_MP_WEBHOOK_URL: URL **real** do endpoint premiumPixWebhook após deploy.
- POKE_PREMIUM_KEY_SECRET: segredo longo e aleatório; preservar entre versões e reinicializações.

NUNCA guardar segredos ou CPF em GitHub, aplicativo Android, JSON de regras, logs,
artefatos de QA, README ou Drive compartilhado. O administrador precisa obter a identidade
Firebase UID da conta de controle e atribuir de modo seguro a custom claim
pokesearchAdmin=true via Firebase Admin SDK em ambiente privado. Não hardcodar UID no app.
O botão Admin fica no toque longo na marca PokeSearch na Home, apenas na edição controlada;
cada operação revalida a claim no servidor, mesmo se alguém reproduzir a interface.

Configurar a primeira versão controlada em distribution/versions/<versionCode>=true,
distribution/globalEnabled=true, premium/config/priceCents=<preço em centavos>,
premium/config/salesEnabled=true. Estes caminhos não têm leitura/escrita pública.
Também testar que o projeto e a instância RTDB correspondem ao deploy real, configurar
App Check/Play Integrity para APK sideloaded e avaliar faturamento Cloud Functions v2.
NÃO ligar vendas antes da homologação de pagamento TESTE, estorno e renovação.

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
- O webhook/ativação em produção, cobrança real, Firebase App Check e APK assinado distribuível
  **ainda não foram executados**. CI verde não prova aprovação do Mercado Pago ou Samsung.
- O certificado e o código instalado podem ser adulterados em dispositivos sob controle de
  terceiros. Nenhum mecanismo somente Android é inviolável; esta solução conserva as decisões
  e os segredos no servidor, valida e expira autorizações breves.
- Não usar nem expor o token PoGoCoordinates neste sistema de pagamentos.
