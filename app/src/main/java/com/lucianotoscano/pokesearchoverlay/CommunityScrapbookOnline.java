package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.widget.ImageView;
import android.net.Uri;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.auth.UserInfo;
import android.text.InputFilter;
import android.view.Gravity;
import android.view.MotionEvent;
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
import com.google.firebase.database.DatabaseException;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ServerValue;
import com.google.firebase.database.ValueEventListener;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
    static final int REQUEST_PHOTO=407;
    static final int REQUEST_GOOGLE_ADMIN=408;
    static boolean onActivityResult(View panel,int request,int result,Intent data){
        if(panel==null || !(panel.getTag() instanceof Controller))return false;
        Controller c=(Controller)panel.getTag();
        if(request==REQUEST_PHOTO || request==REQUEST_GOOGLE_ADMIN){
            c.onResult(request,result,data);
            return true;
        }
        return false;
    }
    static int dp(Context c,int value){return CommunityScrapbookStage1.dp(c,value);}

    static final class Controller {
        private final Activity activity;
        private final boolean light;
        private final int ink,secondary;
        private FirebaseDatabase database;
        private FirebaseAuth auth;
        private Query messagesQuery;
        private DatabaseReference avatarsRef;
        private DatabaseReference reactionsRef;
        private ValueEventListener reactionsListener;
        private DataSnapshot lastReactions;
        private ValueEventListener avatarsListener;
        private DataSnapshot lastMessages;
        private final Map<String,Bitmap> avatars=new LinkedHashMap<>();
        private final Map<String,Bitmap> captureIcons=new LinkedHashMap<>();
        private final java.util.Set<String> expandedCaptureDetails=new java.util.HashSet<>();
        private ImageView avatarButton;
        private boolean isAdmin=false;
        private ValueEventListener messagesListener;
        private LinearLayout bubbles,card;
        private ScrollView timeline;
        private TextView status,nicknameButton;
        private EditText input;
        private Button send;
        private boolean destroyed=false,sending=false,authenticated=false,chatReadable=false;
        private boolean hasRenderedMessages=false;
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
            avatarButton=new ImageView(activity);
            avatarButton.setImageResource(android.R.drawable.ic_menu_gallery);
            avatarButton.setScaleType(ImageView.ScaleType.CENTER_CROP);
            avatarButton.setContentDescription("Escolher minha foto no chat");
            avatarButton.setBackground(bg(light?0xFFE7F3F3:0xFF23504D,24,
                                           light?0xFFBCD7D6:0xFF3B867B));
            avatarButton.setClipToOutline(true);
            avatarButton.setOnClickListener(v->choosePhoto());
            LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(dp(activity,39),dp(activity,39));
            bp.rightMargin=dp(activity,9);header.addView(avatarButton,bp);
            LinearLayout headings=column();
            header.addView(headings,new LinearLayout.LayoutParams(0,-2,1));
            nicknameButton=text("✎ Apelido",15,true);
            nicknameButton.setContentDescription("Editar apelido do chat");
            nicknameButton.setOnClickListener(v->editNickname());
            headings.addView(nicknameButton);
            status=text("Conectando…",10,false);
            status.setTextColor(secondary);headings.addView(status);
            status.setOnClickListener(v->retryChat());
            TextView chatMenu=text("⋮",25,true);
            chatMenu.setGravity(Gravity.CENTER);
            chatMenu.setContentDescription("Opções do chat e administração");
            chatMenu.setOnClickListener(v->openChatMenu());
            header.addView(chatMenu,new LinearLayout.LayoutParams(dp(activity,38),dp(activity,40)));
            timeline=new ScrollView(activity);
            timeline.setFillViewport(true);
            timeline.setNestedScrollingEnabled(true);
            timeline.setVerticalScrollBarEnabled(true);
            timeline.setSmoothScrollingEnabled(true);
            // LT132: the Home is itself a ScrollView. Allow the timeline to
            // consume a drag only while it can scroll in that direction;
            // at either edge, return the gesture to the outer Home.
            timeline.setOnTouchListener(new View.OnTouchListener(){
                private float priorY;
                @Override public boolean onTouch(View v,MotionEvent event){
                    switch(event.getActionMasked()){
                        case MotionEvent.ACTION_DOWN:
                            priorY=event.getY();
                            // With only one or two messages the timeline may
                            // not scroll at all. The parent Home MUST receive
                            // the very first swipe on the blank chat area.
                            boolean scrollable=timeline.canScrollVertically(-1)||
                                timeline.canScrollVertically(1);
                            v.getParent().requestDisallowInterceptTouchEvent(scrollable);
                            break;
                        case MotionEvent.ACTION_MOVE:
                            float diff=event.getY()-priorY;
                            priorY=event.getY();
                            boolean canScroll=diff>0?timeline.canScrollVertically(-1):
                                diff<0?timeline.canScrollVertically(1):true;
                            v.getParent().requestDisallowInterceptTouchEvent(canScroll);
                            break;
                        case MotionEvent.ACTION_UP:
                        case MotionEvent.ACTION_CANCEL:
                            v.getParent().requestDisallowInterceptTouchEvent(false);
                            break;
                    }
                    return false; // Keep native fling, long-press and reactions.
                }
            });
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
            if(nicknameButton!=null)nicknameButton.setText(currentNickname()+" ✎");
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
            }catch(RuntimeException error){setStatus("Chat indisponível • Firebase não conectado");return;}
            // A separately named FirebaseApp keeps Google admin UID independent
            // from anonymous stats/presence and their installation identity.
            try{
                FirebaseApp adminApp=FirebaseStats.ensureChatAdminApp(activity);
                FirebaseUser verified=FirebaseAuth.getInstance(adminApp).getCurrentUser();
                if(verified!=null && verifiedAdmin(verified)){
                    auth=FirebaseAuth.getInstance(adminApp);
                    database=FirebaseDatabase.getInstance(adminApp,
                        "https://pokesearch-lt-default-rtdb.firebaseio.com/");
                    isAdmin=true;start(verified);return;
                }
            }catch(RuntimeException ignored){}
            isAdmin=false;
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
            setStatus("Conectando ao chat…");
            refreshSend();
            if(messagesQuery!=null && messagesListener!=null)
                messagesQuery.removeEventListener(messagesListener);
            if(avatarsRef!=null && avatarsListener!=null)
                avatarsRef.removeEventListener(avatarsListener);
            if(reactionsRef!=null && reactionsListener!=null)
                reactionsRef.removeEventListener(reactionsListener);
            reactionsRef=database.getReference("chat/reactions");
            reactionsListener=reactionsRef.addValueEventListener(new ValueEventListener(){
                @Override public void onDataChange(DataSnapshot snapshot){
                    if(destroyed)return;
                    lastReactions=snapshot;
                    if(lastMessages!=null)renderMessages(lastMessages,false);
                }
                @Override public void onCancelled(DatabaseError error){
                    if(destroyed)return;
                    lastReactions=null; // missing rules must not break normal messages
                }
            });
            // The shared per-user public avatar index only stores optional
            // photos that were explicitly chosen via the Android gallery.
            avatarsRef=database.getReference("chat/avatars");
            avatarsListener=avatarsRef.addValueEventListener(new ValueEventListener(){
                @Override public void onDataChange(DataSnapshot snapshot){
                    if(destroyed)return;
                    for(Bitmap bmp:avatars.values())if(bmp!=null&&!bmp.isRecycled())bmp.recycle();
                    avatars.clear();
                    int count=0;
                    for(DataSnapshot entry:snapshot.getChildren()){
                        if(++count>100)break;
                        String image=entry.getValue(String.class);
                        Bitmap decoded=ChatAvatarCodec.decode(image);
                        if(decoded!=null)avatars.put(entry.getKey(),decoded);
                    }
                    refreshOwnAvatar();
                    if(lastMessages!=null)renderMessages(lastMessages,false);
                }
                @Override public void onCancelled(DatabaseError error){
                    if(!destroyed)toast("Fotos indisponíveis no Firebase.");
                }
            });
            messagesQuery=database.getReference("chat/messages").orderByChild("createdAt")
                .limitToLast(60);
            messagesListener=messagesQuery.addValueEventListener(new ValueEventListener(){
                @Override public void onDataChange(DataSnapshot snapshot){
                    if(destroyed)return;
                    boolean scrollToLatest=!hasRenderedMessages||timelineIsNearBottom();
                    lastMessages=snapshot;
                    chatReadable=true;
                    setStatus("● Conversa ao vivo");
                    refreshSend();
                    renderMessages(snapshot,scrollToLatest);
                    hasRenderedMessages=true;
                }
                @Override public void onCancelled(DatabaseError error){
                    if(destroyed)return;
                    chatReadable=false;
                    refreshSend();
                    if(error.getCode()==DatabaseError.PERMISSION_DENIED){
                        setStatus("Acesso negado pelo Firebase · toque para tentar de novo");
                        showEmpty("Acesso negado ao chat. As regras do Firebase precisam ser conferidas.");
                    }else{
                        setStatus("Chat indisponível · toque para reconectar");
                        showEmpty("Não foi possível carregar o chat. Confira a conexão.");
                    }
                }
            });
        }
        private void retryChat(){
            if(destroyed||sending)return;
            if(messagesQuery!=null&&messagesListener!=null){
                messagesQuery.removeEventListener(messagesListener);
                messagesQuery=null;messagesListener=null;
            }
            authenticated=false;chatReadable=false;hasRenderedMessages=false;refreshSend();
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
        private boolean timelineIsNearBottom(){
            if(timeline==null||bubbles==null)return true;
            return timeline.getScrollY()+timeline.getHeight()>=
                bubbles.getHeight()-dp(activity,42);
        }
        private void renderMessages(DataSnapshot snapshot,boolean scrollToBottom){
            if(bubbles==null||destroyed)return;
            final int previousScrollY=timeline==null?0:timeline.getScrollY();
            bubbles.removeAllViews();
            int shown=0;
            for(DataSnapshot entry:snapshot.getChildren()){
                String id=entry.getKey();
                String author=clean(entry.child("nickname").getValue(String.class),24);
                String rawMessage=entry.child("text").getValue(String.class);
                // Preserve the compact structured lines only after strict parser
                // validation; ordinary chat still receives legacy sanitization.
                String message=rawMessage!=null&&CaptureChatCard.parse(rawMessage)!=null?
                    rawMessage:clean(rawMessage,240);
                String uid=entry.child("authorUid").getValue(String.class);
                Long created=entry.child("createdAt").getValue(Long.class);
                if(id==null||!id.matches("[A-Za-z0-9_-]{12,180}")||
                    author.length()<2||message.isEmpty()||uid==null||created==null)
                    continue;
                boolean mine=uid.equals(currentUid);
                addBubble(id,mine,uid,author,message,created);
                shown++;
            }
            if(shown==0)showEmpty("Ainda não há mensagens.\nSeja o primeiro a conversar!");
            else timeline.post(()->{
                if(destroyed)return;
                if(scrollToBottom)timeline.fullScroll(View.FOCUS_DOWN);
                else timeline.scrollTo(0,Math.min(previousScrollY,
                    Math.max(0,bubbles.getHeight()-timeline.getHeight())));
            });
        }
        private void addBubble(String id,boolean mine,String authorUid,String nickname,
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
            ImageView authorPhoto=new ImageView(activity);
            Bitmap authorBitmap=avatars.get(authorUid);
            if(authorBitmap!=null){
                authorPhoto.setImageBitmap(authorBitmap);
                authorPhoto.setScaleType(ImageView.ScaleType.CENTER_CROP);
            }else{
                authorPhoto.setImageResource(android.R.drawable.ic_menu_myplaces);
            }
            authorPhoto.setBackground(bg(light?0xFFE7F3F3:0xFF23504D,24,
                light?0xFFBCD7D6:0xFF3B867B));
            authorPhoto.setClipToOutline(true);
            LinearLayout.LayoutParams imgLp=new LinearLayout.LayoutParams(
                dp(activity,28),dp(activity,28));
            if(!mine){imgLp.rightMargin=dp(activity,5);outer.addView(authorPhoto,imgLp);}
            outer.addView(bubble,bp);
            if(mine){imgLp.leftMargin=dp(activity,5);outer.addView(authorPhoto,imgLp);}
            if(isAdmin){
                bubble.setContentDescription("Segure para excluir a mensagem de "+nickname);
                bubble.setOnLongClickListener(v->{confirmDeleteMessage(id);return true;});
            }
            CaptureChatCard.Card structured=CaptureChatCard.parse(message);
            CaptureChatFormat.Capture legacy=structured==null?
                CaptureChatFormat.parse(message):null;
            if(!mine && structured==null && legacy==null){
                TextView by=text(nickname,11,true);
                by.setTextColor(light?0xFF166C65:0xFF83DED1);
                bubble.addView(by);
            }
            String clock=android.text.format.DateFormat.format("HH:mm",timestamp).toString();
            // Even old LT131 announcements are rendered with the same two-line
            // layout. A capture is voluntary, never proof that it was caught.
            CaptureChatCard.Card captureCard=structured;
            if(captureCard==null&&legacy!=null)
                captureCard=new CaptureChatCard.Card(legacy.name,legacy.shiny,legacy.iv,
                    "","","","","","","",false);
            if(captureCard!=null){
                String species=captureCard.name;
                boolean shiny=captureCard.shiny;
                LinearLayout announcement=new LinearLayout(activity);
                announcement.setOrientation(LinearLayout.HORIZONTAL);
                announcement.setGravity(Gravity.CENTER_VERTICAL);
                // Prefer exact pinned costume pixels. NEVER substitute base for
                // an unrecognized costume or special form.
                String costumeAsset=CaptureChatFormat.exactCostumeAsset(
                    species,shiny,captureCard.gender);
                int dex=costumeAsset.isEmpty()?
                    CaptureChatFormat.speciesDex(activity,species):0;
                try(java.io.InputStream in=!costumeAsset.isEmpty()?
                    activity.getAssets().open(costumeAsset):
                    VerifiedSpriteCache.bundledSprite(activity,dex,shiny)){
                    if(in!=null){
                        Bitmap bitmap=android.graphics.BitmapFactory.decodeStream(in);
                        if(bitmap!=null){
                            ImageView sprite=new ImageView(activity);
                            sprite.setImageBitmap(bitmap);
                            sprite.setScaleType(ImageView.ScaleType.FIT_CENTER);
                            sprite.setContentDescription("Sprite "+
                                (shiny?"Shiny ":"")+"de "+species);
                            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(
                                dp(activity,36),dp(activity,36));
                            lp.rightMargin=dp(activity,3);
                            announcement.addView(sprite,lp);
                        }
                    }
                }catch(java.io.IOException ignored){}
                String headline=captureCard.headline(nickname);
                TextView body=text(headline,11,false);
                body.setTextColor(ink);
                body.setSingleLine(true);
                body.setEllipsize(android.text.TextUtils.TruncateAt.END);
                announcement.addView(body,new LinearLayout.LayoutParams(0,-2,1));
                bubble.addView(announcement);
                addCaptureBadges(bubble,captureCard,mine?clock+" ✓":clock);
            }else{
                TextView body=text(message,13,false);
                body.setTextColor(ink);body.setMaxLines(8);
                bubble.addView(body);
                TextView meta=text(mine?clock+"  ✓":clock,9,false);
                meta.setGravity(Gravity.END);meta.setTextColor(secondary);
                bubble.addView(meta);
            }
            if(!mine)bubble.setContentDescription("Mensagem de "+nickname);
            // Discreet single-choice emoji reactions; one value per Firebase UID.
            LinearLayout reactionsBar=new LinearLayout(activity);
            reactionsBar.setGravity(Gravity.END|Gravity.CENTER_VERTICAL);
            reactionsBar.setPadding(0,dp(activity,2),0,0);
            DataSnapshot reactions=lastReactions==null?null:lastReactions.child(id);
            for(String emoji:new String[]{"❤️","👍","🎉","✨️"}){
                int total=0;boolean chosen=false;
                if(reactions!=null)for(DataSnapshot vote:reactions.getChildren()){
                    String selected=vote.getValue(String.class);
                    if(emoji.equals(selected)){
                        total++;
                        if(currentUid.equals(vote.getKey()))chosen=true;
                    }
                }
                final String chosenReaction=emoji;
                TextView choice=text(emoji+(total>0?" "+total:""),10,chosen);
                choice.setTextColor(chosen?(light?0xFF0C7662:0xFF8DECD5):secondary);
                choice.setGravity(Gravity.CENTER);
                choice.setPadding(dp(activity,3),dp(activity,3),dp(activity,3),dp(activity,3));
                choice.setContentDescription("Reagir com "+emoji+", "+total+" reações");
                choice.setOnClickListener(v->react(id,chosenReaction));
                reactionsBar.addView(choice,new LinearLayout.LayoutParams(0,-2,1));
            }
            bubble.addView(reactionsBar);
        }
        private Bitmap modeIcon(String path){
            if(captureIcons.containsKey(path))return captureIcons.get(path);
            Bitmap bmp=null;
            try(java.io.InputStream in=activity.getAssets().open(path)){
                bmp=android.graphics.BitmapFactory.decodeStream(in);
            }catch(java.io.IOException ignored){}
            captureIcons.put(path,bmp);
            return bmp;
        }
        private void addBadge(LinearLayout bar,String path,String label,int tone){
            LinearLayout chip=new LinearLayout(activity);
            chip.setGravity(Gravity.CENTER_VERTICAL);
            chip.setPadding(dp(activity,3),dp(activity,2),dp(activity,3),dp(activity,2));
            chip.setBackground(bg(light?0xFFF0F3F4:0xFF304047,12,
                                  light?0xFFD5DDE1:0xFF47565E));
            if(path!=null){
                Bitmap icon=modeIcon(path);
                if(icon!=null){
                    ImageView view=new ImageView(activity);
                    view.setImageBitmap(icon);
                    view.setScaleType(ImageView.ScaleType.FIT_CENTER);
                    LinearLayout.LayoutParams ilp=new LinearLayout.LayoutParams(
                        dp(activity,16),dp(activity,16));
                    ilp.rightMargin=dp(activity,2);
                    chip.addView(view,ilp);
                }
            }
            TextView txt=text(label,9,false);
            txt.setSingleLine(true);
            txt.setTextColor(tone);
            chip.addView(txt);
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-2,-2);
            cp.leftMargin=dp(activity,2);
            bar.addView(chip,cp);
        }
        private void addCaptureBadges(LinearLayout bubble,CaptureChatCard.Card c,
                                      String time){
            // EXACTLY ONE attribute row after the headline. Never add an
            // expandable Details block, extra size/sex row or duplicate IV.
            LinearLayout line=new LinearLayout(activity);
            line.setOrientation(LinearLayout.HORIZONTAL);
            line.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);
            line.setPadding(0,dp(activity,1),0,0);
            android.widget.HorizontalScrollView horizontal=
                new android.widget.HorizontalScrollView(activity);
            horizontal.setFillViewport(true);
            horizontal.setHorizontalScrollBarEnabled(false);
            LinearLayout badges=new LinearLayout(activity);
            badges.setOrientation(LinearLayout.HORIZONTAL);
            badges.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);
            horizontal.addView(badges,new android.widget.HorizontalScrollView.LayoutParams(-2,-2));
            String rarity=c.rarity();
            if(!rarity.isEmpty()){
                String icon="result-icons/modes/"+
                    (rarity.toLowerCase(java.util.Locale.ROOT).contains("nundo")?
                    "0Star.png":"3Star.png");
                addBadge(badges,icon,rarity,ink);
            }else if(!c.iv.isEmpty()){
                addBadge(badges,"result-icons/modes/StarIVRaw.png",c.iv,ink);
            }
            if(!c.rank.isEmpty()){
                String icon="GL".equals(c.league)?
                    "result-icons/modes/StarGL.png":"result-icons/modes/StarUL.png";
                addBadge(badges,icon,c.league+" #"+c.rank,ink);
            }
            if(!c.size.isEmpty())addBadge(badges,null,c.size,secondary);
            // Sex remains the LAST attribute, immediately before the clock.
            if(!c.gender.isEmpty()){
                int tint="♂".equals(c.gender)?0xFF65B8FF:
                         "♀".equals(c.gender)?0xFFFF8CB6:secondary;
                addBadge(badges,null,c.gender,tint);
            }
            line.addView(horizontal,new LinearLayout.LayoutParams(0,-2,1));
            TextView meta=text(time,9,false);
            meta.setSingleLine(true);
            meta.setTextColor(secondary);
            meta.setGravity(Gravity.END|Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams mp=new LinearLayout.LayoutParams(-2,-2);
            mp.leftMargin=dp(activity,3);
            line.addView(meta,mp);
            bubble.addView(line,new LinearLayout.LayoutParams(-1,-2));
        }
        private void react(String messageId,String emoji){
            if(destroyed||database==null||!authenticated||
               currentUid.isEmpty()||!messageId.matches("[A-Za-z0-9_-]{12,180}"))return;
            if(!("❤️".equals(emoji)||"👍".equals(emoji)||"🎉".equals(emoji)||"✨️".equals(emoji)))return;
            String prior=null;
            if(lastReactions!=null){
                prior=lastReactions.child(messageId).child(currentUid).getValue(String.class);
            }
            DatabaseReference own=database.getReference("chat/reactions")
                .child(messageId).child(currentUid);
            Object desired=emoji.equals(prior)?null:emoji;
            own.setValue(desired,(error,reference)->{
                if(!destroyed&&error!=null)toast("Não foi possível registrar a reação. Confira as regras do chat.");
            });
        }
        private static boolean verifiedAdmin(FirebaseUser user){
            if(user==null || !user.isEmailVerified() ||
               user.getEmail()==null ||
               !"lucianotoscano@gmail.com".equalsIgnoreCase(user.getEmail()))return false;
            for(UserInfo info:user.getProviderData())
                if("google.com".equals(info.getProviderId()))return true;
            return false;
        }
        private void openChatMenu(){
            String[] choices=isAdmin?
                new String[]{"Excluir todas as mensagens","Trocar conta de administrador","Remover minha foto","Cancelar"}:
                new String[]{"Verificar administrador com Google","Remover minha foto","Cancelar"};
            new AlertDialog.Builder(activity).setTitle("Chat PokeSearch")
                .setItems(choices,(dialog,position)->{
                    String selected=choices[position];
                    if(selected.startsWith("Excluir"))confirmClearChat();
                    else if(selected.startsWith("Verificar")||selected.startsWith("Trocar"))
                        googleAdminLogin();
                    else if(selected.startsWith("Remover"))removeOwnAvatar();
                }).show();
        }
        private void choosePhoto(){
            new AlertDialog.Builder(activity)
                .setTitle("Foto do chat")
                .setMessage("Sua foto escolhida ficará visível para os participantes do chat. Não usaremos sua foto do Google automaticamente.")
                .setPositiveButton("Escolher da galeria",(d,w)->{
                    Intent intent=new Intent(Intent.ACTION_GET_CONTENT);
                    intent.setType("image/*");
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    try{activity.startActivityForResult(
                        Intent.createChooser(intent,"Selecionar foto do chat"),REQUEST_PHOTO);
                    }catch(RuntimeException ex){toast("Galeria indisponível");}
                })
                .setNegativeButton("Cancelar",null).show();
        }
        private void refreshOwnAvatar(){
            if(avatarButton==null)return;
            Bitmap image=avatars.get(currentUid);
            if(image!=null){
                avatarButton.setImageBitmap(image);
                avatarButton.setScaleType(ImageView.ScaleType.CENTER_CROP);
            }else avatarButton.setImageResource(android.R.drawable.ic_menu_gallery);
        }
        private void savePhoto(Uri uri){
            if(database==null || currentUid.isEmpty()){toast("Conecte ao chat primeiro");return;}
            try{
                String encoded=ChatAvatarCodec.fromGallery(activity.getContentResolver(),uri);
                database.getReference("chat/avatars").child(currentUid)
                    .setValue(encoded,(error,ref)->toast(error==null?
                        "Foto atualizada":"Firebase não permitiu salvar a foto"));
            }catch(Exception err){toast("Não foi possível processar a imagem escolhida");}
        }
        private void removeOwnAvatar(){
            if(database==null||currentUid.isEmpty())return;
            new AlertDialog.Builder(activity).setTitle("Remover minha foto?")
                .setPositiveButton("Remover",(d,w)->
                    database.getReference("chat/avatars").child(currentUid)
                        .removeValue((error,ref)->{
                            if(error!=null)toast("Falha ao remover foto");
                        }))
                .setNegativeButton("Cancelar",null).show();
        }
        private void googleAdminLogin(){
            if(BuildConfig.CHAT_GOOGLE_WEB_CLIENT_ID.isEmpty()){
                new AlertDialog.Builder(activity).setTitle("Autenticação do administrador")
                    .setMessage("A autenticação Google do chat ainda precisa ser configurada no Firebase (OAuth Web Client ID e provedor Google). O login do site não libera exclusão.")
                    .setPositiveButton("Entendi",null).show();
                return;
            }
            GoogleSignInOptions options=new GoogleSignInOptions.Builder(
                GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(BuildConfig.CHAT_GOOGLE_WEB_CLIENT_ID)
                .requestEmail().build();
            try{activity.startActivityForResult(
                GoogleSignIn.getClient(activity,options).getSignInIntent(),
                REQUEST_GOOGLE_ADMIN);
            }catch(RuntimeException ex){toast("Não foi possível iniciar autenticação Google");}
        }
        void onResult(int request,int result,Intent data){
            if(destroyed)return;
            if(request==REQUEST_PHOTO){
                if(result==Activity.RESULT_OK&&data!=null&&data.getData()!=null)
                    savePhoto(data.getData());
                return;
            }
            if(request!=REQUEST_GOOGLE_ADMIN||result!=Activity.RESULT_OK)return;
            try{
                GoogleSignInAccount account=GoogleSignIn.getSignedInAccountFromIntent(data)
                    .getResult(ApiException.class);
                if(account==null||account.getIdToken()==null){
                    toast("Google não forneceu credencial de identidade");return;
                }
                FirebaseApp app=FirebaseStats.ensureChatAdminApp(activity);
                FirebaseAuth adminAuth=FirebaseAuth.getInstance(app);
                adminAuth.signInWithCredential(GoogleAuthProvider.getCredential(
                    account.getIdToken(),null)).addOnCompleteListener(activity,task->{
                    if(destroyed)return;
                    FirebaseUser user=task.isSuccessful()?adminAuth.getCurrentUser():null;
                    if(!verifiedAdmin(user)){
                        toast("Conta não autorizada como administradora");
                        adminAuth.signOut();return;
                    }
                    auth=adminAuth;isAdmin=true;
                    database=FirebaseDatabase.getInstance(app,
                        "https://pokesearch-lt-default-rtdb.firebaseio.com/");
                    retryChat();
                    toast("Administrador autenticado");
                });
            }catch(ApiException|RuntimeException ex){
                toast("Falha ao verificar conta Google no Firebase");
            }
        }
        private void confirmDeleteMessage(String id){
            if(!isAdmin || database==null)return;
            new AlertDialog.Builder(activity).setTitle("Excluir mensagem?")
                .setMessage("Essa exclusão é permanente para todos os participantes.")
                .setPositiveButton("Excluir",(d,w)->
                    database.getReference("chat/messages").child(id)
                        .removeValue((error,ref)->toast(error==null?
                            "Mensagem excluída":"Permissão de exclusão negada pelo Firebase")))
                .setNegativeButton("Cancelar",null).show();
        }
        private void confirmClearChat(){
            if(!isAdmin || database==null)return;
            new AlertDialog.Builder(activity).setTitle("Limpar todo o chat?")
                .setMessage("Todas as mensagens serão excluídas permanentemente para todos.")
                .setPositiveButton("Excluir todas",(d,w)->
                    database.getReference("chat/messages")
                        .removeValue((error,ref)->toast(error==null?
                            "Chat limpo":"Permissão de limpeza negada pelo Firebase")))
                .setNegativeButton("Cancelar",null).show();
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
                    if(error.getCode()==DatabaseError.PERMISSION_DENIED){
                        chatReadable=false;
                        refreshSend();
                        setStatus("Acesso negado pelo Firebase · toque para tentar de novo");
                        toast("Firebase recusou a mensagem. Confira as regras do chat.");
                    }else{
                        setStatus("Falha de envio · toque no título para reconectar");
                        toast("Falha no envio da mensagem.");
                    }
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
            if(avatarsRef!=null&&avatarsListener!=null)
                avatarsRef.removeEventListener(avatarsListener);
            if(reactionsRef!=null&&reactionsListener!=null)
                reactionsRef.removeEventListener(reactionsListener);
            for(Bitmap bmp:avatars.values())if(bmp!=null&&!bmp.isRecycled())bmp.recycle();
            avatars.clear();
            for(Bitmap icon:captureIcons.values())
                if(icon!=null&&!icon.isRecycled())icon.recycle();
            captureIcons.clear();
            expandedCaptureDetails.clear();
        }
    }
}
