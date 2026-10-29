package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import org.json.JSONObject;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ServerValue;
import java.util.HashMap;
import java.util.Map;

/** LT129: one explicit and confirmed capture announcement. Coordinates never leave the device. */
final class CaptureSharePublisher {
    interface Completion { void complete(boolean success,String message); }
    private static final String DB_URL="https://pokesearch-lt-default-rtdb.firebaseio.com/";
    private CaptureSharePublisher(){}
    static String cleanName(String source){
        if(source==null)return "";
        String name=source.replaceAll("[\\p{Cntrl}\\n\\r]","").trim();
        if(name.length()>60)name=name.substring(0,60);
        return name;
    }
    static String buildAnnouncement(String pokemon,boolean shiny){
        String name=cleanName(pokemon);
        if(name.isEmpty())return "";
        return "🎉 Capturou um "+name+(shiny?" ✨":"")+"!";
    }
    /** Sends only four allowlisted message fields; encounter JSON is never
     * written to Firebase, logged, or sent beyond this synchronous formatter. */
    static void publish(Context context,JSONObject selected,Completion callback){
        String message=CaptureChatCard.fromResult(selected);
        publishText(context,message,callback);
    }
    static void publish(Context context,String pokemon,boolean shiny,
                        String rawIv,String form,Completion callback){
        String message=CaptureChatFormat.build(pokemon,shiny,rawIv,form);
        publishText(context,message,callback);
    }
    private static void publishText(Context context,String message,Completion callback){
        if(message.isEmpty()){callback.complete(false,"Pokémon inválido");return;}
        try{
            // Use the very same verified account selected by the live chat.
            // Otherwise a Google-admin chat message and an overlay capture
            // appear as two different senders, losing alignment and avatar.
            FirebaseApp app=CommunityScrapbookOnline.capturePublisherApp(context);
            FirebaseAuth auth=FirebaseAuth.getInstance(app);
            FirebaseUser user=auth.getCurrentUser();
            if(user!=null){post(context,app,user,message,callback);return;}
            auth.signInAnonymously().addOnSuccessListener(result->{
                FirebaseUser signed=result.getUser();
                if(signed==null){callback.complete(false,"Não foi possível entrar no chat");return;}
                post(context,app,signed,message,callback);
            }).addOnFailureListener(e->callback.complete(false,"Sem conexão com o chat"));
        }catch(RuntimeException error){callback.complete(false,"Chat indisponível");}
    }
    private static void post(Context context,FirebaseApp app,FirebaseUser user,
                             String message,Completion callback){
        String nickname=context.getSharedPreferences("prefs",Context.MODE_PRIVATE)
                .getString("communityNickname","");
        nickname=nickname==null?"":nickname.replaceAll("[\\p{Cntrl}\\n\\r]","").trim();
        if(nickname.length()>24)nickname=nickname.substring(0,24);
        if(nickname.length()<2){
            String uid=user.getUid();
            nickname="Treinador"+uid.substring(Math.max(0,uid.length()-4));
        }
        Map<String,Object> payload=new HashMap<>();
        payload.put("authorUid",user.getUid());
        payload.put("nickname",nickname);
        payload.put("text",message);
        payload.put("createdAt",ServerValue.TIMESTAMP);
        DatabaseReference ref=FirebaseDatabase.getInstance(app,DB_URL)
            .getReference("chat/messages").push();
        if(ref.getKey()==null){callback.complete(false,"Chat indisponível");return;}
        ref.setValue(payload,(error,unused)->callback.complete(error==null,
            error==null?"Conquista publicada no chat!":"Não foi possível compartilhar agora"));
    }
}
