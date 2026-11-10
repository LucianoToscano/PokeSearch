'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const pub=read('src/main/java/com/lucianotoscano/pokesearchoverlay/CaptureSharePublisher.java');
const chat=read('src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java');

// Both paths must prefer the SAME verified Google administrator app/UID.
for(const source of [
    'FirebaseStats.ensureChatAdminApp(activity)',
    'verifiedAdmin(verified)',
    'static boolean verifiedAdmin(FirebaseUser user)',
    'boolean mine=uid.equals(currentUid)'
])assert.ok(chat.includes(source),'Chat identity guard missing: '+source);
for(const source of [
    'FirebaseStats.ensureChatAdminApp(context)',
    'CommunityScrapbookOnline.Controller.verifiedAdmin(adminUser)',
    'post(context,adminApp,adminUser,message,callback)',
    'auth.signInAnonymously()',
    'payload.put("authorUid",user.getUid())'
])assert.ok(pub.includes(source),'Capture identity guard missing: '+source);
assert.ok(pub.indexOf('Controller.verifiedAdmin(adminUser)') <
          pub.indexOf('FirebaseUser user=auth.getCurrentUser()'),
          'Admin identity must be checked before the anonymous fallback');

// Preserve Firebase schema and do not transmit encounter coordinates.
for(const field of ['authorUid','nickname','text','createdAt'])
    assert.ok(pub.includes('payload.put("'+field+'"'));
for(const field of ['coords','lat','lng','location','reveal','jwt'])
    assert.ok(!pub.includes('payload.put("'+field+'"'),
      'Capture must not transmit private field: '+field);

console.log('LT147 capture shares as active chat author: source regression PASS');
