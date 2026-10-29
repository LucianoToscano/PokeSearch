'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

const pub=read('src/main/java/com/lucianotoscano/pokesearchoverlay/CaptureSharePublisher.java');
const chat=read('src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java');

// The chat prefers its verified Google admin FirebaseApp over the anonymous stats app.
// Sharing a capture must use precisely that same identity before the normal fallback.
assert.match(chat,/FirebaseStats\\.ensureChatAdminApp\\(activity\\)/);
assert.match(chat,/if\\(verified!=null && verifiedAdmin\\(verified\\)\\)/);
assert.match(chat,/static boolean verifiedAdmin\\(FirebaseUser user\\)/);
assert.match(pub,/FirebaseStats\\.ensureChatAdminApp\\(context\\)/);
assert.match(pub,/CommunityScrapbookOnline\\.Controller\\.verifiedAdmin\\(adminUser\\)/);
assert.match(pub,/post\\(context,adminApp,adminUser,message,callback\\)/);
assert.ok(pub.indexOf('Controller.verifiedAdmin(adminUser)') <
          pub.indexOf('FirebaseUser user=auth.getCurrentUser()'),
          'Capture admin identity must be chosen before anonymous fallback');
assert.match(pub,/auth\\.signInAnonymously\\(\\)/);
assert.match(pub,/payload\\.put\\("authorUid",user\\.getUid\\(\\)\\)/);
assert.match(chat,/boolean mine=uid\\.equals\\(currentUid\\)/);

// Do not change the Firebase schema or attach private capture coordinates.
for(const field of ['authorUid','nickname','text','createdAt'])
    assert.ok(pub.includes('payload.put("'+field+'"'));
assert.doesNotMatch(pub,/payload\\.put\\("(coords|lat|lng|location|reveal|jwt)"/i);

console.log('LT147 capture share matches active chat identity: source regression PASS');
