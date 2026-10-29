# PokeSearch LT134 — checkpoint Premium + Mercado Pago (27/10/2026)

## Base e regra de produto
- Branch Android: `feature/lt134-google-premium-preserve-lt133-20261027`; PR #95; base LT133 preservada.
- **P1 é sempre gratuita, sem login Google e sem bloqueio Premium; só P2 é Premium.**
- Commit Android `aa6ce2faf22cddc8af998272edc332226a25ae92` contém ajustes de MainActivity, OverlayService, PremiumAccess e contrato de regressão. Nova compilação assinada ainda depende do resultado do GitHub Actions; não reutilizar o APK anterior como se contivesse a correção.
- Preço atual de P2 por Pix: **30 dias**, R$ 10,00 normal e R$ 5,00 promocional, somente após ativação deliberada de vendas. *Não cobrar durante QA*.
- Emissão manual/admin atual: 15 dias, 1/3/6/12 meses-calendário e vitalícia. O pedido mais recente lista 15 e 30 dias, 6 e 12 meses e vitalícia; alinhar a opção manual de 30 dias exatos antes de publicar, preservando chaves antigas de 1 e 3 meses já emitidas.

## Servidor Netlify confirmado
- Site: `pokesearch-premium-ivern`, deploy `6ae092b7e5901d099feb1c87` em estado ready, ref `563f7005bf0a60d524fac7c8ebeff8cfdbeee224`.
- API de aplicação `https://pokesearch-premium-ivern.netlify.app/api/premium`; rota `/health`; Firebase `pokesearch-lt`.
- Firebase Admin e segredo de assinatura das licenças existem nas variáveis do site (valores não expostos). **Não foram encontradas** as variáveis `POKE_MP_TEST_ACCESS_TOKEN` e `POKE_MP_WEBHOOK_SECRET` nas configurações atuais do Netlify.
- O código Orders API e webhook já estão em `functions/premium.js` da branch `feature/premium-pix-remote-control-qa-20261027`: POST/GET `/v1/orders`, Pix, chave de idempotência, validação HMAC `x-signature`, anti-replay e licença paga de 30 dias.
- Endpoint para configurar no Mercado Pago **em modo Teste**, tópico **Order (Mercado Pago)**:
  `https://pokesearch-premium-ivern.netlify.app/api/premium/webhook?type=order`.
  O Mercado Pago inclui `data.id` e `type=order` na query e gera assinatura secreta após salvar. Confirmar via teste válido de Orders, sem inserir segredos no GitHub/Android.
- O MP `POKE_MP_TEST_ACCESS_TOKEN` deve ser configurado diretamente no Netlify como variável secreta **somente ambiente de teste**, sem ser enviado pelo chat. `POKE_MP_WEBHOOK_SECRET` é a assinatura secreta exibida no console Mercado Pago ao configurar Webhooks, também somente no Netlify. Um deploy pode ser necessário para ativar variáveis.
- Não configurar token real/produção, não ativar `premium/config/paymentsLiveEnabled` e não ativar `premium/config/salesEnabled` antes de validar o Pix de teste de ponta a ponta.

## Licença e liberação
- A conta Google Premium Android usa `PokeSearchPremiumIdentity`, independente do login PoGoCoordinates e de `PokeSearchStats`.
- `checkDistributionAccess` hoje responde `allowed` somente quando `distribution/globalEnabled=true` **e** `distribution/versions/54339=true`; `premium` exige também licença ativa no UID Firebase. Isso é exigência para P2; P1 não pode depender desses flags.
- A licença de 15 dias emitida anteriormente deve ser confirmada pelo mesmo UID Google e respectivo `premium/entitlements/{uid}`, sem mostrar UID/tokens em documentação pública.
- Não anunciar a licença Samsung ou webhook de pagamentos como validado sem execução no aparelho e no backend.

## Pendências operacionais exatas
1. Resultado do GitHub Actions referente ao commit `aa6ce2f...`; conferir novo APK e assinatura.
2. Configurar Access Token de TESTE e segredo de webhook do Mercado Pago diretamente no Netlify (segredos).
3. Configurar webhook do **ambiente Teste** no Mercado Pago e validar assinatura de notificação.
4. Confirmar por autenticação que a licença de 15 dias está associada ao UID da conta Google usada no Android.
5. Habilitar acesso de teste da versão 54339 (admin), mantendo **salesEnabled=false** até teste controlado. P1 deve funcionar mesmo sem essas flags.
6. Validar criação/consulta de order de teste, confirmação real no ambiente teste, replay, cancelamento/reembolso e renovação, sem movimentar dinheiro real; só depois considerar vendas.
7. Samsung: P1 gratuita; P2 requer licença; sair/trocar conta, expiração, reinstalação e preservação integral LT133.

## Fontes oficiais Mercado Pago
- https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/pix
- https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/integration-test/pix
- https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/notifications
