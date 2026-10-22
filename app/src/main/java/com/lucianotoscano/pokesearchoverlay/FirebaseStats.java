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
    private static boolean initialized,homeVisible,overlayVisible,connected,presenceScheduled;
    private static long onlineCount=-1,installCount=-1;
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
    static synchronized void setOverlayVisible(Context context,boolean visible){
        overlayVisible=visible;init(context);refreshPresence();
    }
    private static synchronized void init(Context context){
        if(initialized)return;
        initialized=true;
        try {
            FirebaseOptions options=new FirebaseOptions.Builder()
                .setApplicationId("1:1007816617051:android:bc055b81b3bdfaceaa637e")
                .setApiKey("AIzaSyDxCp0f4c_xrrlJ6EGGg9HKPQPIiutCQkM")
                .setProjectId("pokesearch-lt").setDatabaseUrl(DB_URL).build();
            FirebaseApp app=FirebaseApp.initializeApp(context.getApplicationContext(),options,"PokeSearchStats");
            if(app==null)app=FirebaseApp.getInstance("PokeSearchStats");
            auth=FirebaseAuth.getInstance(app);
            db=FirebaseDatabase.getInstance(app,DB_URL);
            if(auth.getCurrentUser()!=null)attach(auth.getCurrentUser().getUid());
            else auth.signInAnonymously().addOnSuccessListener(result->{
                if(result.getUser()!=null)attach(result.getUser().getUid());
            }).addOnFailureListener(error->render());
        } catch(RuntimeException ignored){render();}
    }
    private static synchronized void attach(String currentUid){
        if(db==null||!uid.isEmpty())return;
        uid=currentUid;
        DatabaseReference root=db.getReference("stats");
        DatabaseReference myInstall=root.child("installations").child(uid);
        myInstall.get().addOnSuccessListener(snapshot->{
            if(!snapshot.exists())myInstall.child("installedAt").setValue(ServerValue.TIMESTAMP);
        });
        root.child("installations").addValueEventListener(counter(false));
        root.child("online").addValueEventListener(counter(true));
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
                    if(isOnline)onlineCount=snapshot.getChildrenCount();
                    else installCount=snapshot.getChildrenCount();
                    render();
                }
            }
            @Override public void onCancelled(DatabaseError error){
                synchronized(FirebaseStats.class){
                    if(isOnline)onlineCount=-1;else installCount=-1;
                    render();
                }
            }
        };
    }
    private static synchronized void refreshPresence(){
        if(online==null||!connected)return;
        if(homeVisible||overlayVisible){
            if(presenceScheduled)return;
            presenceScheduled=true;
            // The disconnection operation is registered on the SERVER first.
            online.onDisconnect().removeValue((error,reference)->{
                synchronized(FirebaseStats.class){
                    if(error!=null){presenceScheduled=false;return;}
                    if(homeVisible||overlayVisible)
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
