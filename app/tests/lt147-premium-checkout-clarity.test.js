'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,
    '../src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumPurchaseDialog.java'),'utf8');

const has=text=>assert.ok(source.includes(text),'Missing checkout contract: '+text);
for(const step of ['1  Sua conta Premium','2  Seu plano','3  Pague e ative'])has(step);
has('Não precisa ser o e-mail do Pokémon GO nem entrar no Discord');
has('Pix seguro pelo Mercado Pago usando o Gmail conectado');
has('Gerar Pix de pagamento');
has('PremiumAccess.createPix(activity,mail,"",appliedCoupon[0]');
has('String mail=PremiumGoogleLogin.email(activity).trim()');
assert.ok(!source.includes('E-mail para o Pix'),'Must not ask for a second payment email');
assert.ok(!source.includes('email.getText()'),'Must not read an unrelated email input');

// Advanced offers exist but start collapsed; their operations remain server-authorized.
has('advancedArea.setVisibility(View.GONE)');
has('advancedToggle.setOnClickListener');
for(const feature of ['advancedArea.addView(couponRow','advancedArea.addView(freeOffer',
    'advancedArea.addView(redeemArea','PremiumAccess.offerWithCoupon',
    'PremiumAccess.redeemFullCoupon','PremiumAccess.redeem(activity'])
    has(feature);

// Recover old orders and never generate another Pix for a pending/approved order.
has('latestOrderUid');
has('latestOrderId');
has('if(!activeOrder[0].isEmpty())');
has('checkPrevious.setOnClickListener(v->poll[0].run())');
has('Já existe um Pix pendente. Verifique antes de criar outro.');
has('handler.postDelayed(scheduled[0],12000L)');
has('if("approved".equals(state))');
has('PremiumAccess.verify(activity,(allowed,premium)->');
has('if(premium){');

// Stale callbacks from a different account must not associate payments or licenses.
has('final String checkoutUid=PremiumGoogleLogin.uid(activity)');
has('if(!checkoutUid.equals(PremiumGoogleLogin.uid(activity)))');
has('final String requestedUid=PremiumGoogleLogin.uid(activity)');
has('!requestedUid.equals(PremiumGoogleLogin.uid(activity))');
has('!requestedOrder.equals(activeOrder[0])');
has('.putString("latestOrderUid",checkoutUid)');

// The frontend must not invent a completed payment or charge during app startup.
assert.ok(source.indexOf('PremiumAccess.createPix(activity,mail,') >
    source.indexOf('create.setOnClickListener(v->{'));
assert.ok(!source.includes('setValue("premium/entitlements"'));
console.log('LT147 PokeSearch Premium checkout regression PASS');
