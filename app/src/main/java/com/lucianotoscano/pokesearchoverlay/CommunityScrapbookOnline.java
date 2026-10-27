package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.text.InputFilter;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ServerValue;
import com.google.firebase.database.ValueEventListener;
import java.util.HashMap;
import java.util.Map;

/** LT122: public live chat inside Home. No categories or prior moderation.
 * Firebase Auth + append-only database rules remain mandatory to protect existing messages.
 */
final class CommunityScrapbookOnline {
    private CommunityScrapbookOnline(){}
    static boolean isQaAllowed(){
        return BuildConfig.SCRAPBOOK_ONLINE_QA && CommunityScrapbookStage1.isQaPreviewAllowed();
    }
    static View homePanel(Activity activity,boolean light){
        return new Controller(activity,light).buildHomePanel();
    }
    static void expandFromMenu(View panel){
        if(panel!=null&&panel.getTag() instanceof Controller)
            ((Controller)panel.getTag()).expand();
    }
    static int dp(Context c,int value){return CommunityScrapbookStage1.dp(c,value);}

    static final class Controller {
        private final Activity activity;
        private final boolean light;
        private final int ink,secondary;
        private FirebaseDatabase database;
        private FirebaseAuth auth;
        private Query messagesQuery;
        private ValueEventListener messagesListener;
        private LinearLayout bubbles,card;
        private ScrollView timeline;
        private TextView status,nicknameButton;
        private EditText input;
        private Button send;
        private boolean destroyed=false,sending=false,authenticated=false,chatReadable=false;
        private String currentUid="";
        private long lastLocalSend=0L;
        Controller(Activity activity,boolean light){
            this.activity=activity;this.light=light;
            ink=CommunityScrapbookStage1.primary(light);
            secondary=CommunityScrapbookStage1.secondary(light);
        }
        private LinearLayout column(){
            LinearLayout l=new LinearLayout(activity);
            l.setOrientation(LinearLayout.VERTICAL);
            return l;
        }
        private TextView text(String value,int size,boolean bold){
            return CommunityScrapbookStage1.text(activity,value,size,ink,bold);
        }
        private android.graphics.drawable.GradientDrawable bg(int color,int radius,int stroke){
            return CommunityScrapbookStage1.background(color,radius,stroke,activity);
        }
        View buildHomePanel(){
            card=column();card.setTag(this);
            card.setPadding(dp(activity,9),dp(activity,9),dp(activity,9),dp(activity,9));
            card.setBackground(bg(light?0xF8F7FAFC:0xED182737,15,
                                  light?0xFFB6CBDC:0xFF466683));
            card.addOnAttachStateChangeListener(new View.OnAttachStateChangeListener(){
                @Override public void onViewAttachedToWindow(View v){}
                @Override public void onViewDetachedFromWindow(View v){detach();}
            });
            LinearLayout header=new LinearLayout(activity);
            header.setGravity(Gravity.CENTER_VERTICAL);
            card.addView(header,new LinearLayout.LayoutParams(-1,dp(activity,47)));
            TextView badge=text("💬",20,false);
            badge.setGravity(Gravity.CENTER);
            badge.setBackground(bg(light?0xFFE7F3F3:0xFF23504D,24,
                                   light?0xFFBCD7D6:0xFF3B867B));
            LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(dp(activity,39),dp(activity,39));
            bp.rightMargin=dp(activity,9);header.addView(badge,bp);
            LinearLayout headings=column();
            header.addView(headings,new LinearLayout.LayoutParams(0,-2,1));
            headings.addView(text("Chat PokeSearch",15,true));
            status=text("Conectando…",10,false);
            status.setTextColor(secondary);headings.addView(status);
            status.setContentDescription("Status do chat. Toque para reconectar.");
            status.setOnClickListener(v->retryConnect());
            nicknameButton=text("✎  Apelido",11,true);
            nicknameButton.setGravity(Gravity.CENTER);
            nicknameButton.setPadding(dp(activity,8),0,dp(activity,8),0);
            nicknameButton.setBackground(bg(light?0xFFEAF1F7:0xFF31465B,12,
                                            light?0xFFCADCEB:0xFF56758F));
            nicknameButton.setOnClickListener(v->editNickname());
            header.addView(nicknameButton,new LinearLayout.LayoutParams(-2,dp(activity,34)));
            timeline=new ScrollView(activity);
            timeline.setFillViewport(true);
            timeline.setVerticalScrollBarEnabled(false);
            timeline.setBackground(bg(light?0xFFE9F0ED:0xFF122C2E,12,
                                      light?0xFFD2E1DB:0xFF29504A));
            LinearLayout.LayoutParams tlp=new LinearLayout.LayoutParams(-1,dp(activity,265));
            tlp.topMargin=dp(activity,7);card.addView(timeline,tlp);
            bubbles=column();
            bubbles.setPadding(dp(activity,8),dp(activity,7),dp(activity,8),dp(activity,8));
            timeline.addView(bubbles,new ScrollView.LayoutParams(-1,-2));
            showEmpty("As mensagens reais aparecem aqui.\nNenhum recado fictício.");

            LinearLayout composer=new LinearLayout(activity);
            composer.setGravity(Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,dp(activity,52));
            cp.topMargin=dp(activity,7);card.addView(composer,cp);
            input=new EditText(activity);
            input.setSingleLine(false);input.setMaxLines(3);input.setMinLines(1);
            input.setTextSize(13);input.setTextColor(ink);
            input.setHintTextColor(secondary);
            input.setHint("Escreva uma mensagem…");
            input.setFilters(new InputFilter[]{new InputFilter.LengthFilter(240)});
            input.setPadding(dp(activity,12),dp(activity,7),dp(activity,9),dp(activity,7));
            input.setBackground(bg(light?0xFFFFFFFF:0xFF31465A,23,
                                   light?0xFFD3E1EB:0xFF526E88));
            LinearLayout.LayoutParams ilp=new LinearLayout.LayoutParams(0,-1,1);
            ilp.rightMargin=dp(activity,6);composer.addView(input,ilp);
            send=new Button(activity);
            send.setAllCaps(false);send.setText("➤");send.setTextSize(19);
            send.setContentDescription("Enviar mensagem ao chat da comunidade");
            send.setTextColor(0xFFFFFFFF);
            send.setBackground(bg(0xFF168876,23,0xFF168876));
            send.setEnabled(false);
            composer.addView(send,new LinearLayout.LayoutParams(dp(activity,52),-1));
            send.setOnClickListener(v->submit());
            TextView hint=text("Conversa pública ao vivo • Até 240 caracteres",9,false);
            hint.setTextColor(secondary);
            hint.setPadding(dp(activity,3),dp(activity,4),0,0);
            card.addView(hint);
            refreshNickname();
            connect();
            return card;
        }
        void expand(){
            if(timeline!=null){
                android.view.ViewGroup.LayoutParams layout=timeline.getLayoutParams();
                layout.height=dp(activity,340);timeline.setLayoutParams(layout);
                timeline.post(()->timeline.fullScroll(View.FOCUS_DOWN));
            }
        }
        private String preferenceNickname(){
            String saved=activity.getSharedPreferences("prefs",0)
                .getString("communityNickname","");
            return clean(saved,24);
        }
        private String currentNickname(){
            String saved=preferenceNickname();
            if(saved.length()>=2)return saved;
            String suffix=currentUid.length()>4?currentUid.substring(currentUid.length()-4):"GO";
            return "Treinador "+suffix;
        }
        private void refreshNickname(){
            if(nicknameButton!=null)nicknameButton.setText("✎ "+currentNickname());
        }
        private static String clean(String source,int limit){
            if(source==null)return "";
            String normalized=source.replaceAll("[\\p{Cntrl}&&[^\\n\\t]]"," ")
                .replace('\n',' ').replace('\t',' ').trim();
            return normalized.length()>limit?normalized.substring(0,limit):normalized;
        }
        private void editNickname(){
            EditText field=new EditText(activity);
            field.setSingleLine(true);field.setText(preferenceNickname());
            field.setHint("Seu apelido no chat");
            field.setFilters(new InputFilter[]{new InputFilter.LengthFilter(24)});
            new AlertDialog.Builder(activity).setTitle("Meu apelido")
                .setView(field).setNegativeButton("Cancelar",null)
                .setPositiveButton("Salvar",(dialog,which)->{
                    String name=clean(field.getText().toString(),24);
                    if(name.length()<2){toast("Use pelo menos dois caracteres.");return;}
                    activity.getSharedPreferences("prefs",0).edit()
                        .putString("communityNickname",name).apply();
                    refreshNickname();
                }).show();
        }
        private void setStatus(String label){
            if(!destroyed&&status!=null)status.setText(label);
        }
        private void refreshSend(){
            if(send!=null)send.setEnabled(!destroyed&&authenticated&&chatReadable&&!sending);
        }
        private void connect(){
            try{
                FirebaseApp app=FirebaseStats.ensureApp(activity);
                auth=FirebaseAuth.getInstance(app);
                database=FirebaseDatabase.getInstance(app,
                    "https://pokesearch-lt-default-rtdb.firebaseio.com/");
            }catch(RuntimeException error){
                chatReadable=false;refreshSend();
                setStatus("Chat indisponível • Toque para tentar conectar");return;
            }
            FirebaseUser user=auth.getCurrentUser();
            if(user!=null){start(user);return;}
            auth.signInAnonymously().addOnSuccessListener(result->{
                if(!destroyed&&result.getUser()!=null)start(result.getUser());
            }).addOnFailureListener(error->{
                setStatus("Chat indisponível • Não foi possível entrar");
                refreshSend();
            });
        }
        private void start(FirebaseUser user){
            if(destroyed)return;
            currentUid=user.getUid();
            authenticated=true;refreshNickname();
            chatReadable=false;
            setStatus("Verificando acesso ao chat…");
            refreshSend();
            messagesQuery=database.getReference("chat/messages").orderByChild("createdAt")
                .limitToLast(60);
            messagesListener=messagesQuery.addValueEventListener(new ValueEventListener(){
                @Override public void onDataChange(DataSnapshot snapshot){
                    if(destroyed)return;
                    chatReadable=true;refreshSend();setStatus("● Conversa ao vivo");
                    renderMessages(snapshot);
                }
                @Override public void onCancelled(DatabaseError error){
                    if(destroyed)return;
                    chatReadable=false;refreshSend();
                    if(error.getCode()==DatabaseError.PERMISSION_DENIED){
                        setStatus("Acesso negado • Toque para tentar novamente");
                        showEmpty("O Firebase recusou a leitura. Verifique as regras do chat.");
                    }else{
                        setStatus("Falha de conexão • Toque para reconectar");
                        showEmpty("Não foi possível carregar o chat. Verifique a conexão.");
                    }
                }
            });
        }
        // Reattach only on explicit user interaction; no rapid automatic
        // retries on permanent rules/auth errors. The draft is retained.
        private void retryConnect(){
            if(destroyed||sending)return;
            if(messagesQuery!=null&&messagesListener!=null)
                messagesQuery.removeEventListener(messagesListener);
            messagesQuery=null;messagesListener=null;
            authenticated=false;chatReadable=false;refreshSend();
            setStatus("Reconectando…");
            connect();
        }
        private void showEmpty(String message){
            if(bubbles==null||destroyed)return;
            bubbles.removeAllViews();
            TextView empty=text(message,11,false);
            empty.setTextColor(secondary);
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(0,dp(activity,52),0,dp(activity,35));
            bubbles.addView(empty,new LinearLayout.LayoutParams(-1,-2));
        }
        private void renderMessages(DataSnapshot snapshot){
            if(bubbles==null||destroyed)return;
            bubbles.removeAllViews();
            int shown=0;
            for(DataSnapshot entry:snapshot.getChildren()){
                String id=entry.getKey();
                String author=clean(entry.child("nickname").getValue(String.class),24);
                String message=clean(entry.child("text").getValue(String.class),240);
                String uid=entry.child("authorUid").getValue(String.class);
                Long created=entry.child("createdAt").getValue(Long.class);
                if(id==null||!id.matches("[A-Za-z0-9_-]{12,180}")||
                    author.length()<2||message.isEmpty()||uid==null||created==null)
                    continue;
                boolean mine=uid.equals(currentUid);
                addBubble(id,mine,author,message,created);
                shown++;
            }
            if(shown==0)showEmpty("Ainda não há mensagens.\nSeja o primeiro a conversar!");
            else timeline.post(()->{
                if(!destroyed)timeline.fullScroll(View.FOCUS_DOWN);
            });
        }
        private void addBubble(String id,boolean mine,String nickname,
                               String message,long timestamp){
            LinearLayout outer=new LinearLayout(activity);
            outer.setGravity(mine?Gravity.END:Gravity.START);
            LinearLayout.LayoutParams op=new LinearLayout.LayoutParams(-1,-2);
            op.bottomMargin=dp(activity,6);
            bubbles.addView(outer,op);
            LinearLayout bubble=column();
            bubble.setPadding(dp(activity,10),dp(activity,7),
                              dp(activity,10),dp(activity,6));
            bubble.setBackground(bg(mine?(light?0xFFD1F3E5:0xFF20594D):
                                   (light?0xFFFFFFFF:0xFF344A54),
                                   13,mine?(light?0xFFB1DCCF:0xFF397A6D):
                                   (light?0xFFD8E2E7:0xFF536A76)));
            LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-2,-2);
            bp.width=Math.max(dp(activity,125),
                Math.min(dp(activity,260),activity.getResources().getDisplayMetrics().widthPixels-dp(activity,85)));
            outer.addView(bubble,bp);
            if(!mine){
                TextView by=text(nickname,11,true);
                by.setTextColor(light?0xFF166C65:0xFF83DED1);
                bubble.addView(by);
            }
            TextView body=text(message,13,false);
            body.setTextColor(ink);body.setMaxLines(8);
            bubble.addView(body);
            String time=android.text.format.DateFormat.format("HH:mm",timestamp).toString();
            TextView meta=text(mine?time+"  ✓":time,9,false);
            meta.setGravity(Gravity.END);meta.setTextColor(secondary);
            bubble.addView(meta);
            if(!mine)bubble.setContentDescription("Mensagem de "+nickname);
        }
        private void submit(){
            if(destroyed||!authenticated||!chatReadable||sending||database==null){
                toast("Chat ainda não está disponível para envio.");return;
            }
            long now=System.currentTimeMillis();
            if(now-lastLocalSend<2000L){toast("Aguarde um instante antes de enviar.");return;}
            String content=clean(input.getText().toString(),240);
            if(content.isEmpty())return;
            final String original=input.getText().toString();
            sending=true;refreshSend();setStatus("Enviando…");
            Map<String,Object> payload=new HashMap<>();
            payload.put("authorUid",currentUid);
            payload.put("nickname",currentNickname());
            payload.put("text",content);
            payload.put("createdAt",ServerValue.TIMESTAMP);
            DatabaseReference message=database.getReference("chat/messages").push();
            if(message.getKey()==null){
                sending=false;refreshSend();setStatus("Erro ao criar mensagem");return;
            }
            message.setValue(payload,(error,reference)->{
                if(destroyed)return;
                sending=false;refreshSend();
                if(error==null){
                    lastLocalSend=System.currentTimeMillis();
                    if(original.equals(input.getText().toString()))input.setText("");
                    setStatus("● Conversa ao vivo");
                }else{
                    setStatus(error.getCode()==DatabaseError.PERMISSION_DENIED?
                        "Envio negado pelo Firebase • Verifique as regras":
                        "Falha no envio • Toque no status para reconectar");
                    toast("Falha no envio da mensagem.");
                }
            });
        }
        private void toast(String message){
            if(!destroyed)Toast.makeText(activity,message,Toast.LENGTH_SHORT).show();
        }
        void detach(){
            destroyed=true;
            if(messagesQuery!=null&&messagesListener!=null)
                messagesQuery.removeEventListener(messagesListener);
        }
    }
}
