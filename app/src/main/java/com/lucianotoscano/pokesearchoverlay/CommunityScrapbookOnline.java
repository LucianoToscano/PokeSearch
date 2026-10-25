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
import com.google.firebase.database.Query;
import java.util.HashMap;
import java.util.Map;

/** QA-gated realtime scrapbook: immediate public posts and replies.
 * Firebase deny-by-default rules and the server-side kill switch are independent.
 * Existing overlay/game data and the public release gate remain untouched.
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
    /** Single-window HOME integration. Menu and 'Ver todos' expand this card,
     * never launch a second Activity or navigate away from Home. */
    static View homePanel(Activity activity,boolean light){
        return new Controller(activity,light).buildHomePanel();
    }
    static void expandFromMenu(View panel){
        if(panel!=null && panel.getTag() instanceof Controller)
            ((Controller)panel.getTag()).expand();
    }
    static final class Controller {
        private final Activity activity;
        private final boolean light;
        private FirebaseDatabase db;
        private FirebaseAuth auth;
        private Query postsQuery;
        private ValueEventListener postsListener;
        private LinearLayout feed,filters;
        private LinearLayout preview,expanded;
        private TextView expandButton;
        private View panelView;
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
        View buildHomePanel(){
            LinearLayout panel=column();
            panel.setPadding(dp(activity,9),dp(activity,9),dp(activity,9),dp(activity,9));
            panel.setBackground(CommunityScrapbookStage1.background(
                light?0xF6F6FAFF:0xE522344B,13,light?0xFFACC9E0:0xFF52789B,activity));
            panelView=panel;
            panel.setTag(this);
            panel.addOnAttachStateChangeListener(new View.OnAttachStateChangeListener(){
                @Override public void onViewAttachedToWindow(View v){}
                @Override public void onViewDetachedFromWindow(View v){detach();}
            });
            LinearLayout header=new LinearLayout(activity);
            header.setGravity(Gravity.CENTER_VERTICAL);
            panel.addView(header,new LinearLayout.LayoutParams(-1,dp(activity,38)));
            TextView icon=text("💬",20);
            header.addView(icon,new LinearLayout.LayoutParams(dp(activity,34),-1));
            LinearLayout headlines=column();
            header.addView(headlines,new LinearLayout.LayoutParams(0,-2,1));
            TextView title=text("Comunidade PokeSearch",14);title.setTypeface(null,1);
            headlines.addView(title);
            headlines.addView(text("Scraps da comunidade · 4 categorias",10));
            expandButton=tab("Ver todos ⌄");
            header.addView(expandButton,new LinearLayout.LayoutParams(dp(activity,97),dp(activity,30)));
            header.setOnClickListener(v->toggleExpand());
            expandButton.setOnClickListener(v->toggleExpand());

            preview=column();
            panel.addView(preview,new LinearLayout.LayoutParams(-1,-2));
            TextView note=text("EXEMPLOS FICTÍCIOS · Inspire seu primeiro recado",10);
            note.setTextColor(light?0xFF466B88:0xFF9CC6E5);
            note.setPadding(dp(activity,4),dp(activity,3),dp(activity,4),dp(activity,5));
            preview.addView(note);
            for(int i=0;i<3;i++){
                CommunityScrapbookStage1.Post p=CommunityScrapbookStage1.EXAMPLES.get(i);
                LinearLayout example=column();
                example.setPadding(dp(activity,8),dp(activity,6),dp(activity,8),dp(activity,6));
                example.setBackground(CommunityScrapbookStage1.background(
                    light?0xFFEDF5FC:0xFF2C445D,9,light?0xFFD2E2EF:0xFF52718F,activity));
                LinearLayout.LayoutParams cardLp=new LinearLayout.LayoutParams(-1,-2);
                cardLp.bottomMargin=dp(activity,5);preview.addView(example,cardLp);
                TextView byline=text(p.avatar+"  "+p.nickname+" · "+p.category+"  ·  exemplo",11);
                byline.setTypeface(null,1);example.addView(byline);
                TextView bodyText=text(p.message,11);
                bodyText.setMaxLines(2);example.addView(bodyText);
                example.setOnClickListener(v->expand());
            }
            TextView write=tab("✎ Escrever recado     •     Ver toda a conversa");
            LinearLayout.LayoutParams wlp=new LinearLayout.LayoutParams(-1,dp(activity,36));
            wlp.topMargin=dp(activity,2);preview.addView(write,wlp);
            write.setOnClickListener(v->expand());

            expanded=column();
            expanded.setVisibility(View.GONE);
            panel.addView(expanded,new LinearLayout.LayoutParams(-1,-2));
            buildExpandedContent(expanded);
            return panel;
        }
        void expand(){
            if(expanded==null)return;
            preview.setVisibility(View.GONE);expanded.setVisibility(View.VISIBLE);
            expandButton.setText("Recolher ⌃");
            if(lastPosts==null)renderFeed();
        }
        private void toggleExpand(){
            if(expanded==null)return;
            if(expanded.getVisibility()==View.VISIBLE){
                expanded.setVisibility(View.GONE);preview.setVisibility(View.VISIBLE);
                expandButton.setText("Ver todos ⌄");
            }else expand();
        }
        private void buildExpandedContent(LinearLayout root){
            status=text("Conectando ao mural da comunidade…",11);
            status.setPadding(dp(activity,4),dp(activity,5),dp(activity,3),dp(activity,4));
            root.addView(status);
            HorizontalScrollView horizontal=new HorizontalScrollView(activity);
            horizontal.setHorizontalScrollBarEnabled(false);
            filters=new LinearLayout(activity);
            horizontal.addView(filters);
            root.addView(horizontal);
            ScrollView scroll=new ScrollView(activity);
            feed=column();
            scroll.setFillViewport(false);
            scroll.addView(feed);
            LinearLayout.LayoutParams grow=new LinearLayout.LayoutParams(-1,dp(activity,260));
            grow.topMargin=dp(activity,7);
            root.addView(scroll,grow);
            LinearLayout composer=column();
            composer.setPadding(dp(activity,5),dp(activity,5),dp(activity,5),dp(activity,5));
            composer.setBackground(CommunityScrapbookStage1.background(
                light?0xFFE5F0F8:0xFF24354A,10,light?0xFFAFC6DA:0xFF617D98,activity));
            LinearLayout.LayoutParams clp=new LinearLayout.LayoutParams(-1,-2);
            clp.topMargin=dp(activity,8);root.addView(composer,clp);
            TextView explain=text("✎ Escreva para todos • até 300 caracteres",11);
            composer.addView(explain);
            nickname=new EditText(activity);
            nickname.setSingleLine(true);nickname.setTextSize(13);
            nickname.setHint("Seu apelido público (2–24)");
            nickname.setFilters(new InputFilter[]{new InputFilter.LengthFilter(24)});
            nickname.setText(activity.getSharedPreferences("prefs",0).getString("communityNickname",""));
            nickname.setTextColor(CommunityScrapbookStage1.primary(light));
            nickname.setHintTextColor(CommunityScrapbookStage1.secondary(light));
            composer.addView(nickname,new LinearLayout.LayoutParams(-1,dp(activity,42)));
            category=new Spinner(activity);
            ArrayAdapter<String> adapter=new ArrayAdapter<>(activity,
                android.R.layout.simple_spinner_dropdown_item,LABELS);
            category.setAdapter(adapter);
            composer.addView(category,new LinearLayout.LayoutParams(-1,dp(activity,38)));
            body=new EditText(activity);
            body.setTextSize(13);
            body.setMinLines(2);body.setMaxLines(3);
            body.setTextColor(CommunityScrapbookStage1.primary(light));
            body.setHintTextColor(CommunityScrapbookStage1.secondary(light));
            body.setHint("Compartilhe uma dica, sugestão ou recado...");
            body.setFilters(new InputFilter[]{new InputFilter.LengthFilter(300)});
            composer.addView(body,new LinearLayout.LayoutParams(-1,-2));
            send=new Button(activity);
            send.setAllCaps(false);
            send.setText("Publicar recado  ➤");
            send.setEnabled(false);
            composer.addView(send,new LinearLayout.LayoutParams(-1,dp(activity,42)));
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
            db.getReference("scrapbook/config/allowDirectPosts").get()
                .addOnSuccessListener(snapshot->{
                    if(destroyed)return;
                    accepting=Boolean.TRUE.equals(snapshot.getValue(Boolean.class));
                    send.setEnabled(accepting);
                    status.setText(accepting
                        ?"Mural online · mensagens publicadas sem aprovação"
                        :"Mural em leitura · publicação desativada na configuração do Firebase");
                }).addOnFailureListener(e->offline("Sem acesso às regras/configuração do Mural."));
            postsQuery=db.getReference("scrapbook/posts").limitToLast(80);
            postsListener=postsQuery.addValueEventListener(new ValueEventListener(){
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
                TextView readReplies=tab("Ver respostas");
                card.addView(readReplies);
                readReplies.setOnClickListener(v->viewReplies(key));
                shown++;
            }
            if(shown==0)feed.addView(text("Nenhuma publicação nesta categoria.",12));
        }
        private static String clean(String s,int max){
            if(s==null)return "";
            s=s.replaceAll("[\\p{Cntrl}&&[^\\n\\t]]","").trim();
            return s.length()>max?s.substring(0,max):s;
        }
        private void submit(){
            if(!accepting||!ready())return;
            String name=clean(nickname.getText().toString(),24);
            String message=clean(body.getText().toString(),300);
            if(name.length()<2||message.length()<2){
                toast("Informe apelido (2–24) e recado (2–300 caracteres).");return;
            }
            if(System.currentTimeMillis()-activity.getSharedPreferences("prefs",0)
                .getLong("communityLastPostAt",0)<120000L){
                toast("Aguarde dois minutos entre os recados.");return;
            }
            DatabaseReference newPost=db.getReference("scrapbook/posts").push();
            if(newPost.getKey()==null){toast("Não foi possível criar a publicação.");return;}
            send.setEnabled(false);
            Map<String,Object> data=new HashMap<>();
            data.put("authorUid",auth.getCurrentUser().getUid());
            data.put("nickname",name);data.put("text",message);
            data.put("category",KEYS[category.getSelectedItemPosition()]);
            data.put("createdAt",ServerValue.TIMESTAMP);
            data.put("status","published");data.put("pinned",false);
            newPost.setValue(data,(error,reference)->{
                if(destroyed)return;
                if(error==null){
                    activity.getSharedPreferences("prefs",0).edit()
                        .putString("communityNickname",name)
                        .putLong("communityLastPostAt",System.currentTimeMillis()).apply();
                    body.setText("");toast("Recado publicado na comunidade!");
                }else toast("Publicação bloqueada pelas regras do Firebase ou conexão indisponível.");
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
            field.setHint("Responder publicamente (até 200 caracteres)");
            field.setFilters(new InputFilter[]{new InputFilter.LengthFilter(200)});
            new AlertDialog.Builder(activity).setTitle("Responder ao recado")
                .setView(field).setNegativeButton("Cancelar",null)
                .setPositiveButton("Publicar",(dialog,which)->{
                    String answer=clean(field.getText().toString(),200);
                    String name=clean(nickname.getText().toString(),24);
                    if(answer.length()<2||name.length()<2){toast("Informe apelido e resposta válidos.");return;}
                    Map<String,Object> data=new HashMap<>();
                    data.put("authorUid",auth.getCurrentUser().getUid());
                    data.put("nickname",name);
                    data.put("text",answer);data.put("createdAt",ServerValue.TIMESTAMP);
                    db.getReference("scrapbook/replies").child(id).push().setValue(data,
                        (error,reference)->toast(error==null?"Resposta publicada!":
                            "Resposta bloqueada pelas regras do Firebase."));
                }).show();
        }
        private void viewReplies(String id){
            if(!ready())return;
            db.getReference("scrapbook/replies").child(id).limitToLast(10).get()
                .addOnSuccessListener(snapshot->{
                    if(destroyed)return;
                    StringBuilder preview=new StringBuilder();
                    for(DataSnapshot item:snapshot.getChildren()){
                        String who=clean(item.child("nickname").getValue(String.class),24);
                        String msg=clean(item.child("text").getValue(String.class),200);
                        if(msg.isEmpty())continue;
                        if(preview.length()>0)preview.append("\\n\\n");
                        preview.append(who.isEmpty()?"Treinador":who).append(": ").append(msg);
                    }
                    new AlertDialog.Builder(activity).setTitle("Respostas públicas")
                        .setMessage(preview.length()==0?"Sem respostas ainda.":preview.toString())
                        .setPositiveButton("Fechar",null).show();
                }).addOnFailureListener(error->toast("Não foi possível carregar as respostas."));
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
            if(postsQuery!=null&&postsListener!=null)postsQuery.removeEventListener(postsListener);
        }
    }
}
