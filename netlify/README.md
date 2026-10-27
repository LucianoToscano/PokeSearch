# PokeSearch Premium — Netlify Free e Firebase Spark

Status em 27/10/2026: QA; sem deploy da API; sem cobranças reais.

## Destinos confirmados
- Netlify: https://app.netlify.com/projects/pokesearch-premium-api
- Firebase existente: pokesearch-lt (Authentication e Realtime Database).
- GitHub: LucianoToscano/PokeSearch, branch feature/premium-pix-remote-control-qa-20261027, PR #85 DRAFT.
- NÃO usar o Firebase pokesearch-qa nem substituir google-services.json do aplicativo.

## Próxima etapa: conectar o GitHub ao Netlify
Abra o projeto Netlify e conecte o repositório LucianoToscano/PokeSearch.
Selecione a branch feature/premium-pix-remote-control-qa-20261027 enquanto o sistema estiver em homologação.
O repositório contém netlify.toml, package.json e netlify/functions/premium.mjs.
Não há ainda deploy ativo e o endereço da API não responde até concluir o primeiro deploy.

## Variáveis Netlify (Environment variables, escopo Functions)
- POKE_FIREBASE_PROJECT_ID = pokesearch-lt — já configurado, valor público.
- POKE_FIREBASE_CLIENT_EMAIL = client_email da service account Firebase Admin.
- POKE_FIREBASE_PRIVATE_KEY = private_key da mesma conta Firebase Admin.
- POKE_MP_TEST_ACCESS_TOKEN = token Mercado Pago de TESTE Orders.
- POKE_MP_ACCESS_TOKEN = token de PRODUÇÃO NOVO após revogar o exposto (somente produção).
- POKE_MP_WEBHOOK_SECRET = segredo da assinatura HMAC de Webhooks Orders.
- POKE_PREMIUM_KEY_SECRET = segredo aleatório estável, nunca trocar sem migração das chaves.

Todos os campos exceto POKE_FIREBASE_PROJECT_ID são segredos. NUNCA enviar em chat, arquivo do GitHub, print, Google Drive compartilhado ou APK.
Netlify Functions possui limite aproximado de 4 KB na soma das variáveis de ambiente. Não usar JSON de service account completo quando o e-mail e private_key bastam.
Não habilitar cobrança nem criar service account de produção sem compreender as permissões e a guarda da chave.

## Configuração protegida no Realtime Database
- distribution/globalEnabled = false até aprovação.
- distribution/versions/<versionCode> = false até aprovação da versão assinada.
- premium/config/salesEnabled = false até homologar.
- premium/config/paymentsLiveEnabled = false para usar exclusivamente tokens de TESTE.
- premium/config/regularPriceCents = 1000; promotionalPriceCents = 500; promotionEnabled = true.

## Segurança e regras
- App Android obtém Firebase ID token da conta autenticada e chama HTTPS Netlify.
- Netlify valida o token e eventual revogação via Firebase Admin.
- A lógica compartilhada consulta Order real pelo Mercado Pago Orders API /v1/orders.
- Webhook exige assinatura e não libera licença sem consulta à API Mercado Pago.
- Clientes jamais têm leitura/escrita direta de premium/ ou distribution/ no RTDB.
- Licenças individuais: 15 dias, 1, 3, 6, 12 meses ou vitalícia, definidas pelo proprietário.
- Primeira Pokébola gratuita, segunda exige licença em APKs de distribuição controlada.
- APKs normais e antigos não podem ser controlados retroativamente sem essa checagem.

## Pendente antes de qualquer lançamento
Verificar Netlify build; secret storage; chaves Firebase Admin e Mercado Pago de teste;
webhook; autenticação recuperável (contas anônimas não sobrevivem necessariamente à reinstalação);
identidade administrativa; versão assinada; teste no Samsung; regras de Firebase realmente publicadas;
rotacionar a credencial de Mercado Pago produzida e exposta anteriormente.
Não mesclar PR #85 nem executar pagamentos reais sem homologação e aprovação explícita.
