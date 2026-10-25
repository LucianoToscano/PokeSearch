package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.text.InputFilter;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import android.widget.Toast;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ServerValue;
import com.google.firebase.database.ValueEventListener;
import java.util.HashMap;
import java.util.Map;

/** Private QA-only client for a moderated, online community. Public release stays hidden.
 * No unreviewed user text is published directly to the public feed. Firebase rules
 * must be deployed independently; the client NEVER changes production rules.
 */
final class CommunityScrapbookOnline {
    private CommunityScrapbookOnline(){}
    static boolean isQaAllowed(){ return BuildConfig.SCRAPBOOK_ONLINE_QA && CommunityScrapbookStage1.isQaPreviewAllowed(); }
    private static final String[] KEYS={"recados","sugestoes","bugs","dicas"};
    private static final String[] LABELS={"Recados","Sugestões","Bugs","Dicas"};
    private static final String[] TABS={"Todos","Recados","Sugestões","Bugs","Dicas"};
    private static int dp(Context c,int v){return CommunityScrapbookStage1.dp(c,v);}
    private static TextView label(Context c,String s,boolean light,int size){
        return CommunityScrapbookStage1.text(c,s,size,CommunityScrapbookStage1.primary(light),false);
    }
    private static FirebaseAuth existingAuth(Context context){
        // Same named FirebaseApp/auth used by installation counters; never touch site cookies.
        try {return FirebaseAuth.getInstance(FirebaseApp.getInstance("PokeSearchStats"));}
        catch(Exception ignored){return null;}
    }
    private static FirebaseDatabase database(){
        try {return FirebaseDatabase.getInstance(FirebaseApp.getInstance("PokeSearchStats"),
            "https://pokesearch-lt-default-rtdb.firebaseio.com/");}
        catch(Exception ignored){return null;}
    }
    static View homePanel(Activity activity,boolean light){
        LinearLayout panel=new LinearLayout(activity);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(activity,10),dp(activity,10),dp(activity,10),dp(activity,10));
        panel.setBackground(CommunityScrapbookStage1.background(
            light?0xEAF7FBFF:0xD81C2C41,12,light?0xFFAAC3D6:0xFF66839C,activity));
        TextView title=label(activity,"💬 Comunidade PokeSearch",light,14);
        title.setTypeface(null,1);panel.addView(title);
        TextView status=label(activity,"Mural online em QA · verificando acesso…",light,11);
        panel.addView(status);
        TextView open=CommunityScrapbookStage1.chip(activity,"Ver todos / Escrever recado",light);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(activity,40));
        lp.topMargin=dp(activity,6);panel.addView(open,lp);
        open.setOnClickListener(v->CommunityScrapbookStage1.openFull(activity));
        FirebaseAuth auth=existingAuth(activity);
        FirebaseDatabase db=database();
        if(auth==null||db==null){
            status.setText("Firebase indisponível · nenhum dado enviado");
        }else{
            db.getReference("scrapbook/config/acceptSubmissions").get().addOnSuccessListener(s->
                status.setText(Boolean.TRUE.equals(s.getValue(Boolean.class))
                    ?"Mural conectado · novas mensagens passam por moderação"
                    :"Aguardando liberação segura das regras Firebase"))
                .addOnFailureListener(e->status.setText("Servidor ainda não configurado · sem publicações"));
        }
        return panel;
    }

    static final class Controller {
        private final Activity activity;
        private final boolean light;
        private FirebaseDatabase db;
        private FirebaseAuth auth;
        private DatabaseReference postsRef;
        private ValueEventListener postsListener;
        private LinearLayout feed,filters;
        private TextView status;
        private EditText nickname,body;
        private Spinner category;
        private Button send;
        private DataSnapshot lastPosts;
        private int selected=-1;
        private boolean accepting=false;
        private boolean destroyed=false;
        Controller(Activity activity,boolean light){this.activity=activity;this.light=light;}
        private TextView text(String value,int size){return label(activity,value,light,size);}
        private TextView tab(String value){return CommunityScrapbookStage1.chip(activity,value,light);}
        private LinearLayout column(){
            LinearLayout v=new LinearLayout(activity);v.setOrientation(LinearLayout.VERTICAL);return v;
        }
        void show(){
            LinearLayout root=column();
            root.setBackgroundColor(light?0xFFF0F6FA:0xFF0E1725);
            root.setPadding(dp(activity,12),dp(activity,8),dp(activity,12),dp(activity,8));
            activity.setContentView(root);
            TextView title=text("‹ Voltar     💬 Comunidade PokeSearch",17);
            title.setTypeface(null,1);
            title.setOnClickListener(v->activity.finish());
            root.addView(title,new LinearLayout.LayoutParams(-1,dp(activity,43)));
            status=text("Conectando ao mural moderado…",11);
            root.addView(status);
            HorizontalScrollView horizontal=new HorizontalScrollView(activity);
            horizontal.setHorizontalScrollBarEnabled(false);
            filters=new LinearLayout(activity);
            horizontal.addView(filters);
            root.addView(horizontal);
            ScrollView scroll=new ScrollView(activity);
            feed=column();
            scroll.addView(feed);
            LinearLayout.LayoutParams grow=new LinearLayout.LayoutParams(-1,0,1);
            grow.topMargin=dp(activity,7);
            root.addView(scroll,grow);
            LinearLayout composer=column();
            composer.setPadding(dp(activity,5),dp(activity,4),dp(activity,5),dp(activity,4));
            composer.setBackground(CommunityScrapbookStage1.background(
                light?0xFFE5F0F8:0xFF24354A,10,light?0xFFAFC6DA:0xFF617D98,activity));
            root.addView(composer);
            TextView explain=text("Enviar para moderação · publicação após aprovação",11);
            composer.addView(explain);
            nickname=new EditText(activity);
            nickname.setSingleLine(true);nickname.setTextSize(13);
            nickname.setHint("Apelido público (2–24 caracteres)");
            nickname.setFilters(new InputFilter[]{new InputFilter.LengthFilter(24)});
            composer.addView(nickname,new LinearLayout.LayoutParams(-1,dp(activity,42)));
            category=new Spinner(activity);
            ArrayAdapter<String> adapter=new ArrayAdapter<>(activity,
                android.R.layout.simple_spinner_dropdown_item,LABELS);
            category.setAdapter(adapter);
            composer.addView(category,new LinearLayout.LayoutParams(-1,dp(activity,38)));
            body=new EditText(activity);
            body.setTextSize(13);
            body.setMinLines(2);body.setMaxLines(3);
            body.setHint("Seu recado (até 300 caracteres)");
            body.setFilters(new InputFilter[]{new InputFilter.LengthFilter(300)});
            composer.addView(body,new LinearLayout.LayoutParams(-1,-2));
            send=new Button(activity);
            send.setText("Enviar para moderação");
            send.setEnabled(false);
            composer.addView(send,new LinearLayout.LayoutParams(-1,dp(activity,45)));
            send.setOnClickListener(v->submit());
            renderFilters();
            connect();
        }
        private void renderFilters(){
            filters.removeAllViews();
            for(int i=-1;i<4;i++){
                final int which=i;
                TextView item=tab((selected==i?"✓ ":"")+TABS[i+1]);
                LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-2,dp(activity,36));
                lp.rightMargin=dp(activity,4);
                filters.addView(item,lp);
                item.setOnClickListener(v->{selected=which;renderFeed();});
            }
        }
        private void connect(){
            auth=existingAuth(activity);
            db=database();
            if(auth==null||db==null){offline("Firebase indisponível. Nenhum texto foi enviado.");return;}
            FirebaseUser current=auth.getCurrentUser();
            if(current!=null){start(current);return;}
            auth.signInAnonymously().addOnSuccessListener(result->{
                if(!destroyed&&result.getUser()!=null)start(result.getUser());
            }).addOnFailureListener(error->offline("Não foi possível autenticar no mural."));
        }
        private void offline(String message){
            if(destroyed)return;
            status.setText(message);accepting=false;send.setEnabled(false);
            feed.removeAllViews();
            feed.addView(text("O mural permanece fechado até a configuração segura no Firebase.",12));
        }
        private void start(FirebaseUser user){
            if(destroyed)return;
            db.getReference("scrapbook/config/acceptSubmissions").get()
                .addOnSuccessListener(snapshot->{
                    if(destroyed)return;
                    accepting=Boolean.TRUE.equals(snapshot.getValue(Boolean.class));
                    send.setEnabled(accepting);
                    status.setText(accepting
                        ?"Mural online · UID anônimo · postagens passam por aprovação"
                        :"Leitura QA · envio fechado no servidor (regras/configuração pendentes)");
                }).addOnFailureListener(e->offline("Sem acesso às regras/configuração do Mural."));
            postsRef=db.getReference("scrapbook/posts");
            postsListener=postsRef.limitToLast(80).addValueEventListener(new ValueEventListener(){
                @Override public void onDataChange(DataSnapshot snapshot){
                    if(destroyed)return;lastPosts=snapshot;renderFeed();
                }
                @Override public void onCancelled(DatabaseError error){
                    if(!destroyed)offline("Não foi possível ler o feed: acesso negado ou rede indisponível.");
                }
            });
        }
        private void renderFeed(){
            if(destroyed)return;
            feed.removeAllViews();
            if(lastPosts==null){feed.addView(text("Carregando recados publicados…",12));return;}
            int shown=0;
            for(DataSnapshot post:lastPosts.getChildren()){
                String key=post.getKey();
                String state=post.child("status").getValue(String.class);
                String type=post.child("category").getValue(String.class);
                if(key==null||!key.matches("[A-Za-z0-9_-]{1,80}")||!"published".equals(state))continue;
                int idx=java.util.Arrays.asList(KEYS).indexOf(type);
                if(idx<0||(selected>=0&&selected!=idx))continue;
                String who=clean(post.child("nickname").getValue(String.class),24);
                String msg=clean(post.child("text").getValue(String.class),300);
                if(msg.isEmpty())continue;
                LinearLayout card=column();
                card.setPadding(dp(activity,8),dp(activity,8),dp(activity,8),dp(activity,7));
                card.setBackground(CommunityScrapbookStage1.background(
                    light?0xFFFDFEFF:0xFF22344B,9,light?0xFFB6CEDF:0xFF536E89,activity));
                LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);
                lp.bottomMargin=dp(activity,7);
                feed.addView(card,lp);
                TextView byline=text(who+" · "+LABELS[idx],12);byline.setTypeface(null,1);
                card.addView(byline);
                card.addView(text(msg,12));
                LinearLayout actions=new LinearLayout(activity);
                card.addView(actions);
                TextView like=tab("♡ Curtir");actions.addView(like);
                like.setOnClickListener(v->like(key));
                TextView reply=tab("◌ Responder");actions.addView(reply);
                reply.setOnClickListener(v->reply(key));
                TextView report=tab("⚑ Denunciar");actions.addView(report);
                report.setOnClickListener(v->report(key));
                shown++;
            }
            if(shown==0)feed.addView(text("Nenhum recado aprovado nesta categoria.",12));
        }
        private static String clean(String s,int max){
            if(s==null)return "";
            s=s.replaceAll("[\\p{Cntrl}&&[^\\n\\t]]","").trim();
            return s.length()>max?s.substring(0,max):s;
        }
        private void submit(){
            if(!accepting||auth==null||auth.getCurrentUser()==null||db==null)return;
            String name=clean(nickname.getText().toString(),24);
            String message=clean(body.getText().toString(),300);
            if(name.length()<2||message.length()<2){
                toast("Informe apelido (2–24) e recado (2–300 caracteres).");return;
            }
            send.setEnabled(false);
            Map<String,Object> data=new HashMap<>();
            data.put("nickname",name);data.put("text",message);
            data.put("category",KEYS[category.getSelectedItemPosition()]);
            data.put("createdAt",ServerValue.TIMESTAMP);
            db.getReference("scrapbook/submissions").child(auth.getCurrentUser().getUid())
                .setValue(data,(error,ref)->{
                    if(destroyed)return;
                    if(error==null){body.setText("");toast("Enviado para moderação. Aguarde a aprovação.");}
                    else toast("Não enviado. Confira as regras e se já há um recado pendente.");
                    send.setEnabled(accepting);
                });
        }
        private boolean ready(){return db!=null&&auth!=null&&auth.getCurrentUser()!=null;}
        private void like(String id){
            if(!ready())return;
            db.getReference("scrapbook/likes").child(id).child(auth.getCurrentUser().getUid())
                .setValue(true,(error,ref)->toast(error==null?"Curtida registrada.":"Curtida já registrada ou não permitida."));
        }
        private void reply(String id){
            if(!ready()||!accepting)return;
            EditText field=new EditText(activity);
            field.setHint("Resposta para moderação (até 200 caracteres)");
            field.setFilters(new InputFilter[]{new InputFilter.LengthFilter(200)});
            new AlertDialog.Builder(activity).setTitle("Responder")
                .setView(field).setNegativeButton("Cancelar",null)
                .setPositiveButton("Enviar",(dialog,which)->{
                    String answer=clean(field.getText().toString(),200);
                    if(answer.length()<2){toast("Resposta muito curta.");return;}
                    Map<String,Object> data=new HashMap<>();
                    data.put("text",answer);data.put("createdAt",ServerValue.TIMESTAMP);
                    db.getReference("scrapbook/replySubmissions").child(id)
                        .child(auth.getCurrentUser().getUid()).setValue(data,
                        (error,ref)->toast(error==null?"Resposta enviada para moderação.":
                            "Resposta pendente ou bloqueada pelas regras."));
                }).show();
        }
        private void report(String id){
            if(!ready())return;
            new AlertDialog.Builder(activity).setTitle("Denunciar publicação")
                .setMessage("Enviar denúncia confidencial para a moderação?")
                .setNegativeButton("Cancelar",null).setPositiveButton("Denunciar",(dialog,which)->{
                    Map<String,Object> data=new HashMap<>();
                    data.put("reason","inappropriate");data.put("createdAt",ServerValue.TIMESTAMP);
                    db.getReference("scrapbook/reports").child(id)
                        .child(auth.getCurrentUser().getUid()).setValue(data,
                        (error,ref)->toast(error==null?"Denúncia recebida.":"Denúncia já enviada ou indisponível."));
                }).show();
        }
        private void toast(String message){
            if(!destroyed)Toast.makeText(activity,message,Toast.LENGTH_LONG).show();
        }
        void detach(){
            destroyed=true;
            if(postsRef!=null&&postsListener!=null)postsRef.removeEventListener(postsListener);
        }
    }
}
