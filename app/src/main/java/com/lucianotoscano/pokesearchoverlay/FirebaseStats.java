package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.widget.TextView;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.*;
import java.lang.ref.WeakReference;

/** PokeSearch-only anonymous, approximate installation and presence statistics.
 * Never transmit Pokémon GO, trainer, location or PoGoCoordinates session data. */
final class FirebaseStats {
    private static final String DB_URL="https://pokesearch-lt-default-rtdb.firebaseio.com/";
    private static FirebaseDatabase db;
    private static FirebaseAuth auth;
    private static DatabaseReference online,connection;
    private static String uid="";
    private static boolean initialized,homeVisible,primaryOverlayVisible,secondaryOverlayVisible,connected,presenceScheduled;
    private static long onlineCount=-1,installCount=-1;
    private static long legacyOnlineCount=-1,legacyInstallCount=-1;
    private static boolean publicOnlineAvailable=false,publicInstallAvailable=false;
    private static WeakReference<TextView> onlineLabel=new WeakReference<>(null);
    private static WeakReference<TextView> installLabel=new WeakReference<>(null);
    private FirebaseStats(){}
    static synchronized void bind(Context context,TextView onlineText,TextView installsText){
        onlineLabel=new WeakReference<>(onlineText);
        installLabel=new WeakReference<>(installsText);
        render(); init(context);
    }
    static synchronized void setHomeVisible(Context context,boolean visible){
        homeVisible=visible;init(context);refreshPresence();
    }
    static synchronized void setOverlayVisible(Context context,boolean visible,boolean secondary){
        if(secondary)secondaryOverlayVisible=visible;
        else primaryOverlayVisible=visible;
        init(context);refreshPresence();
    }
    private static boolean anyWindowVisible(){
        return PresenceWindowState.isActive(
            homeVisible,primaryOverlayVisible,secondaryOverlayVisible);
    }
    /** Shared bootstrap: the Home chat may mount BEFORE statistics binds.
     * FirebaseApp.getInstance(name) by itself throws on that fresh install. */
    static synchronized FirebaseApp ensureApp(Context context){
        try{return FirebaseApp.getInstance("PokeSearchStats");}
        catch(IllegalStateException notInitialized){
            FirebaseOptions options=new FirebaseOptions.Builder()
                .setApplicationId("1:1007816617051:android:bc055b81b3bdfaceaa637e")
                .setApiKey("AIzaSyDxCp0f4c_xrrlJ6EGGg9HKPQPIiutCQkM")
                .setProjectId("pokesearch-lt").setDatabaseUrl(DB_URL).build();
            FirebaseApp app=FirebaseApp.initializeApp(
                context.getApplicationContext(),options,"PokeSearchStats");
            if(app==null)throw new IllegalStateException("Firebase Stats unavailable");
            return app;
        }
    }
    /** Separate Google-authenticated chat admin session.
     * Never alter the anonymous FirebaseStats UID or installation counters. */
    static synchronized FirebaseApp ensureChatAdminApp(Context context){
        try{return FirebaseApp.getInstance("PokeSearchChatAdmin");}
        catch(IllegalStateException notInitialized){
            FirebaseApp stats=ensureApp(context);
            FirebaseApp chat=FirebaseApp.initializeApp(
                context.getApplicationContext(),stats.getOptions(),"PokeSearchChatAdmin");
            if(chat==null)throw new IllegalStateException("Chat admin Firebase unavailable");
            return chat;
        }
    }
    private static synchronized void init(Context context){
        if(initialized)return;
        initialized=true;
        try {
            FirebaseApp app=ensureApp(context);
            auth=FirebaseAuth.getInstance(app);
            db=FirebaseDatabase.getInstance(app,DB_URL);
            if(auth.getCurrentUser()!=null)attach(auth.getCurrentUser().getUid());
            else auth.signInAnonymously().addOnSuccessListener(result->{
                if(result.getUser()!=null)attach(result.getUser().getUid());
                else {synchronized(FirebaseStats.class){initialized=false;}render();}
            }).addOnFailureListener(error->{
                synchronized(FirebaseStats.class){initialized=false;}
                render();
            });
        } catch(RuntimeException ignored){
            // Failed init is retryable when Home is reopened; never fake counts.
            initialized=false;render();
        }
    }
    private static synchronized void attach(String currentUid){
        if(db==null||!uid.isEmpty())return;
        uid=currentUid;
        DatabaseReference root=db.getReference("stats");
        DatabaseReference myInstall=root.child("installations").child(uid);
        myInstall.get().addOnSuccessListener(snapshot->{
            if(!snapshot.exists())myInstall.child("installedAt").setValue(ServerValue.TIMESTAMP);
        });
        // Only public aggregate scalars may be read across installations.
        // Individual UIDs/presence are protected by Firebase rules.
        root.child("public").child("installCount").addValueEventListener(counter(false));
        root.child("public").child("onlineCount").addValueEventListener(counter(true));
        // LT125 migration bridge: before LT117 these totals came from the two
        // live RTDB collections. If server aggregates are not deployed yet,
        // reuse the legacy counts ONLY while existing rules explicitly allow
        // reads. No child IDs are retained, logged, or displayed. Once private
        // RTDB rules are deployed, denied collection reads are quietly ignored.
        root.child("installations").addValueEventListener(legacyCounter(false));
        root.child("online").addValueEventListener(legacyCounter(true));
        online=root.child("online").child(uid);
        connection=db.getReference(".info/connected");
        connection.addValueEventListener(new ValueEventListener(){
            @Override public void onDataChange(DataSnapshot snapshot){
                synchronized(FirebaseStats.class){
                    connected=Boolean.TRUE.equals(snapshot.getValue(Boolean.class));
                    if(!connected)presenceScheduled=false;
                    refreshPresence();
                }
            }
            @Override public void onCancelled(DatabaseError error){}
        });
    }
    private static ValueEventListener counter(boolean isOnline){
        return new ValueEventListener(){
            @Override public void onDataChange(DataSnapshot snapshot){
                synchronized(FirebaseStats.class){
                    Long count=snapshot.getValue(Long.class);
                    long checked=count!=null&&count>=0?count:-1;
                    if(isOnline){
                        publicOnlineAvailable=checked>=0;
                        onlineCount=publicOnlineAvailable?checked:legacyOnlineCount;
                    }else{
                        publicInstallAvailable=checked>=0;
                        installCount=publicInstallAvailable?checked:legacyInstallCount;
                    }
                    render();
                }
            }
            @Override public void onCancelled(DatabaseError error){
                synchronized(FirebaseStats.class){
                    if(isOnline){publicOnlineAvailable=false;onlineCount=legacyOnlineCount;}
                    else{publicInstallAvailable=false;installCount=legacyInstallCount;}
                    render();
                }
            }
        };
    }
    private static ValueEventListener legacyCounter(boolean isOnline){
        return new ValueEventListener(){
            @Override public void onDataChange(DataSnapshot snapshot){
                synchronized(FirebaseStats.class){
                    long total=snapshot.getChildrenCount();
                    // Public server aggregates take priority when available.
                    if(isOnline){legacyOnlineCount=total;if(!publicOnlineAvailable)onlineCount=total;}
                    else{legacyInstallCount=total;if(!publicInstallAvailable)installCount=total;}
                    render();
                }
            }
            @Override public void onCancelled(DatabaseError error){
                // New privacy rules deny the legacy read by design; no fake zero.
            }
        };
    }
    private static synchronized void refreshPresence(){
        if(online==null||!connected)return;
        if(anyWindowVisible()){
            if(presenceScheduled)return;
            presenceScheduled=true;
            // The disconnection operation is registered on the SERVER first.
            online.onDisconnect().removeValue((error,reference)->{
                synchronized(FirebaseStats.class){
                    if(error!=null){presenceScheduled=false;return;}
                    if(anyWindowVisible())
                        online.child("connectedAt").setValue(ServerValue.TIMESTAMP);
                    else {presenceScheduled=false;online.removeValue();}
                }
            });
        }else if(presenceScheduled){
            presenceScheduled=false;
            online.removeValue();
        }
    }
    private static void render(){
        TextView a=onlineLabel.get(),b=installLabel.get();
        if(a!=null)a.post(()->a.setText("●  Ativos agora: "+(onlineCount<0?"—":onlineCount)));
        if(b!=null)b.post(()->b.setText("▣  Instalações: "+(installCount<0?"—":installCount)));
    }
}
