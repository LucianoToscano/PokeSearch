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
        /** A small Orkut-inspired scrapbook, in the same Home window. */
        View buildHomePanel(){
            LinearLayout panel=column();
            panel.setPadding(dp(activity,10),dp(activity,10),dp(activity,10),dp(activity,10));
            panel.setBackground(CommunityScrapbookStage1.background(
                light?0xF5F8FBFF:0xE827354D,15,light?0xFFADC8DC:0xFF597C9B,activity));
            panelView=panel;panel.setTag(this);
            panel.addOnAttachStateChangeListener(new View.OnAttachStateChangeListener(){
                @Override public void onViewAttachedToWindow(View v){}
                @Override public void onViewDetachedFromWindow(View v){detach();}
            });

            LinearLayout header=new LinearLayout(activity);
            header.setGravity(Gravity.CENTER_VERTICAL);
            panel.addView(header,new LinearLayout.LayoutParams(-1,dp(activity,44)));
            TextView icon=text("💌",19);
            icon.setGravity(Gravity.CENTER);
            icon.setBackground(CommunityScrapbookStage1.background(
                light?0xFFE5F1FF:0xFF395E7B,24,light?0xFFBDD8E9:0xFF7B9BB9,activity));
            LinearLayout.LayoutParams ilp=new LinearLayout.LayoutParams(dp(activity,37),dp(activity,37));
            ilp.rightMargin=dp(activity,8);header.addView(icon,ilp);
            LinearLayout headlines=column();
            header.addView(headlines,new LinearLayout.LayoutParams(0,-2,1));
            TextView title=text("Mural da Comunidade",15);title.setTypeface(null,1);
            headlines.addView(title);
            TextView subtitle=text("Recados entre treinadores",10);
            subtitle.setTextColor(CommunityScrapbookStage1.secondary(light));headlines.addView(subtitle);
            expandButton=tab("Ver todos  ⌄");
            header.addView(expandButton,new LinearLayout.LayoutParams(dp(activity,101),dp(activity,33)));
            header.setOnClickListener(v->toggleExpand());
            expandButton.setOnClickListener(v->toggleExpand());

            preview=column();panel.addView(preview,new LinearLayout.LayoutParams(-1,-2));
            TextView demo=text("EXEMPLOS FICTÍCIOS  ·  Ainda não são mensagens reais",9);
            demo.setTextColor(light?0xFF55778A:0xFFA5C9E4);
            demo.setPadding(dp(activity,4),dp(activity,7),dp(activity,4),dp(activity,7));
            preview.addView(demo);
            for(int i=0;i<3;i++){
                CommunityScrapbookStage1.Post example=CommunityScrapbookStage1.EXAMPLES.get(i);
                View item=scrapBubble(example.nickname,example.avatar,example.category,
                    example.message,"exemplo",i);
                LinearLayout.LayoutParams itemLp=new LinearLayout.LayoutParams(-1,-2);
                itemLp.bottomMargin=dp(activity,6);preview.addView(item,itemLp);
                item.setOnClickListener(v->expand());
            }
            TextView write=tab("✎  Deixar um recado no mural");
            LinearLayout.LayoutParams wlp=new LinearLayout.LayoutParams(-1,dp(activity,39));
            wlp.topMargin=dp(activity,3);preview.addView(write,wlp);
            write.setOnClickListener(v->expand());

            expanded=column();expanded.setVisibility(View.GONE);
            panel.addView(expanded,new LinearLayout.LayoutParams(-1,-2));
            buildExpandedContent(expanded);
            return panel;
        }
        private View scrapBubble(String who,String initials,String topic,
                                 String message,String when,int variant){
            LinearLayout row=new LinearLayout(activity);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.TOP);
            row.setPadding(dp(activity,3),dp(activity,4),dp(activity,3),dp(activity,4));
            TextView avatar=text(initials.isEmpty()?"☺":initials.substring(0,1),13);
            avatar.setTypeface(null,1);avatar.setGravity(Gravity.CENTER);
            avatar.setBackground(CommunityScrapbookStage1.background(
                light?0xFFD6E9F7:0xFF406885,30,light?0xFF98BCD9:0xFF7799B4,activity));
            LinearLayout.LayoutParams avLp=new LinearLayout.LayoutParams(dp(activity,32),dp(activity,32));
            avLp.rightMargin=dp(activity,8);row.addView(avatar,avLp);
            LinearLayout paper=column();
            int[] pastel={0xFFF1F7FE,0xFFFFF7EA,0xFFF4F0FD,0xFFEEFAF2};
            int[] night={0xFF30485E,0xFF484358,0xFF3B415D,0xFF34504C};
            int[] strokes={0xFFD0DFEE,0xFFEDDDC3,0xFFD9D2F0,0xFFCDE8DB};
            paper.setBackground(CommunityScrapbookStage1.background(
                light?pastel[Math.abs(variant)%4]:night[Math.abs(variant)%4],
                12,light?strokes[Math.abs(variant)%4]:0xFF63829C,activity));
            paper.setPadding(dp(activity,9),dp(activity,8),dp(activity,9),dp(activity,7));
            row.addView(paper,new LinearLayout.LayoutParams(0,-2,1));
            LinearLayout byline=new LinearLayout(activity);byline.setGravity(Gravity.CENTER_VERTICAL);
            paper.addView(byline,new LinearLayout.LayoutParams(-1,-2));
            TextView username=text(who,12);username.setTypeface(null,1);
            username.setMaxLines(1);username.setEllipsize(android.text.TextUtils.TruncateAt.END);
            byline.addView(username,new LinearLayout.LayoutParams(0,-2,1));
            TextView categoryBadge=text(topic,9);
            categoryBadge.setTextColor(light?0xFF466887:0xFFCEDFF0);
            categoryBadge.setPadding(dp(activity,4),0,0,0);
            categoryBadge.setMaxLines(1);byline.addView(categoryBadge,new LinearLayout.LayoutParams(-2,-2));
            TextView msg=text(message,12);
            msg.setPadding(0,dp(activity,5),0,dp(activity,5));
            paper.addView(msg,new LinearLayout.LayoutParams(-1,-2));
            TextView meta=text("♡  •  💬     "+when,10);
            meta.setTextColor(CommunityScrapbookStage1.secondary(light));
            paper.addView(meta,new LinearLayout.LayoutParams(-1,-2));
            return row;
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
            status=text("Conectando ao mural…",10);
            status.setTextColor(CommunityScrapbookStage1.secondary(light));
            status.setPadding(dp(activity,4),dp(activity,6),dp(activity,3),dp(activity,5));
            root.addView(status);
            HorizontalScrollView horizontal=new HorizontalScrollView(activity);
            horizontal.setHorizontalScrollBarEnabled(false);
            filters=new LinearLayout(activity);
            horizontal.addView(filters);
            root.addView(horizontal,new LinearLayout.LayoutParams(-1,dp(activity,37)));

            TextView recent=text("Recados recentes",12);
            recent.setTypeface(null,1);
            recent.setPadding(dp(activity,4),dp(activity,10),0,dp(activity,5));
            root.addView(recent);
            // A single Home scroll, not a second full screen or nested scroll view.
            feed=column();root.addView(feed,new LinearLayout.LayoutParams(-1,-2));

            LinearLayout composer=column();
            composer.setPadding(dp(activity,9),dp(activity,7),dp(activity,9),dp(activity,9));
            composer.setBackground(CommunityScrapbookStage1.background(
                light?0xFFF3F8FE:0xFF30435A,12,light?0xFFC4D8E9:0xFF6387A8,activity));
            LinearLayout.LayoutParams clp=new LinearLayout.LayoutParams(-1,-2);
            clp.topMargin=dp(activity,8);root.addView(composer,clp);
            TextView explain=text("✎  Deixe seu recado",12);
            explain.setTypeface(null,1);composer.addView(explain);
            LinearLayout userRow=new LinearLayout(activity);
            userRow.setGravity(Gravity.CENTER_VERTICAL);
            composer.addView(userRow,new LinearLayout.LayoutParams(-1,dp(activity,43)));
            nickname=new EditText(activity);
            nickname.setSingleLine(true);nickname.setTextSize(12);
            nickname.setHint("Seu apelido");
            nickname.setFilters(new InputFilter[]{new InputFilter.LengthFilter(24)});
            nickname.setText(activity.getSharedPreferences("prefs",0).getString("communityNickname",""));
            nickname.setTextColor(CommunityScrapbookStage1.primary(light));
            nickname.setHintTextColor(CommunityScrapbookStage1.secondary(light));
            userRow.addView(nickname,new LinearLayout.LayoutParams(0,dp(activity,43),1));
            category=new Spinner(activity);
            ArrayAdapter<String> adapter=new ArrayAdapter<>(activity,
                android.R.layout.simple_spinner_dropdown_item,LABELS);
            category.setAdapter(adapter);
            userRow.addView(category,new LinearLayout.LayoutParams(dp(activity,115),dp(activity,43)));
            body=new EditText(activity);
            body.setTextSize(12);body.setMinLines(2);body.setMaxLines(4);
            body.setTextColor(CommunityScrapbookStage1.primary(light));
            body.setHintTextColor(CommunityScrapbookStage1.secondary(light));
            body.setHint("Escreva algo para a comunidade... (300 caracteres)");
            body.setFilters(new InputFilter[]{new InputFilter.LengthFilter(300)});
            composer.addView(body,new LinearLayout.LayoutParams(-1,-2));
            send=new Button(activity);send.setAllCaps(false);
            send.setText("Publicar no mural  ✉");send.setEnabled(false);
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
            // LT117 fail closed: user-generated content remains read-only
            // until moderation and server-side rate limiting are deployed.
            // Never trust an externally toggled allowDirectPosts flag.
            accepting=false;
            send.setEnabled(false);
            status.setText("Mural em leitura · aguardando moderação segura");
            postsQuery=db.getReference("scrapbook/posts").limitToLast(20);
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
            if(destroyed||feed==null)return;
            feed.removeAllViews();
            if(lastPosts==null){
                TextView loading=text("Carregando as publicações…",11);
                loading.setPadding(dp(activity,7),dp(activity,9),0,dp(activity,9));
                feed.addView(loading);return;
            }
            java.util.ArrayList<DataSnapshot> posts=new java.util.ArrayList<>();
            for(DataSnapshot post:lastPosts.getChildren())posts.add(post);
            java.util.Collections.reverse(posts); // Latest scrapbook entries first.
            int shown=0;
            for(DataSnapshot post:posts){
                String key=post.getKey();
                String state=post.child("status").getValue(String.class);
                String type=post.child("category").getValue(String.class);
                if(key==null||!key.matches("[A-Za-z0-9_-]{1,80}")||!"published".equals(state))continue;
                int idx=java.util.Arrays.asList(KEYS).indexOf(type);
                if(idx<0||(selected>=0&&selected!=idx))continue;
                String who=clean(post.child("nickname").getValue(String.class),24);
                String msg=clean(post.child("text").getValue(String.class),300);
                if(msg.isEmpty())continue;
                LinearLayout card=(LinearLayout)scrapBubble(who,who.isEmpty()?"?":who,
                    LABELS[idx],msg,"publicado",idx);
                LinearLayout paper=(LinearLayout)card.getChildAt(1);
                LinearLayout actions=new LinearLayout(activity);
                actions.setGravity(Gravity.CENTER_VERTICAL);
                LinearLayout.LayoutParams al=new LinearLayout.LayoutParams(-1,dp(activity,33));
                al.topMargin=dp(activity,3);
                paper.addView(actions,al);
                TextView like=tab("♡ Curtir");
                LinearLayout.LayoutParams likeLp=new LinearLayout.LayoutParams(0,dp(activity,30),1);
                likeLp.rightMargin=dp(activity,4);
                actions.addView(like,likeLp);like.setOnClickListener(v->like(key));
                TextView reply=tab("💬 Responder");
                LinearLayout.LayoutParams replyLp=new LinearLayout.LayoutParams(0,dp(activity,30),1);
                replyLp.rightMargin=dp(activity,4);
                actions.addView(reply,replyLp);reply.setOnClickListener(v->reply(key));
                TextView report=tab("⚑");
                report.setContentDescription("Denunciar recado de "+who);
                actions.addView(report,new LinearLayout.LayoutParams(dp(activity,39),dp(activity,30)));
                report.setOnClickListener(v->report(key));
                TextView see=tab("Ver respostas");
                LinearLayout.LayoutParams seeLp=new LinearLayout.LayoutParams(-1,dp(activity,30));
                seeLp.topMargin=dp(activity,3);paper.addView(see,seeLp);
                see.setOnClickListener(v->viewReplies(key));
                LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);
                lp.bottomMargin=dp(activity,6);feed.addView(card,lp);
                if(++shown>=20)break;
            }
            if(shown==0){
                TextView empty=text("Ainda não há recados nesta categoria. ✨",11);
                empty.setPadding(dp(activity,8),dp(activity,12),dp(activity,8),dp(activity,12));
                empty.setBackground(CommunityScrapbookStage1.background(
                    light?0xFFEAF3FB:0xFF30465F,10,light?0xFFBCD7E6:0xFF507490,activity));
                feed.addView(empty);
            }
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
