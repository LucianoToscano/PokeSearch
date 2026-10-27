package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

/** Independent administrator maintenance and APK version gate for both Pokeballs.
 * Never asks for payment or a Google login. The last verified remote block
 * is cached offline, but a fresh install without internet cannot be remotely
 * stopped until it connects.
 */
final class AppAvailability {
    static final class State {
        final boolean allowed, maintenance;
        final String message;
        State(boolean allowed,boolean maintenance,String message){
            this.allowed=allowed;this.maintenance=maintenance;this.message=message;
        }
        String reason(){
            return maintenance?(message.isEmpty()?
                "PokeSearch temporariamente em manutenção.":message):
                "Esta versão do PokeSearch está temporariamente desativada pelo administrador.";
        }
    }
    private static final String PREFS="pokesearch_app_availability";
    private static final long CHECK_INTERVAL_MS=90000L;
    private static final ExecutorService WORKER=Executors.newSingleThreadExecutor();
    private static final Handler MAIN=new Handler(Looper.getMainLooper());
    private static final List<Consumer<State>> CALLBACKS=new ArrayList<>();
    private static boolean requestRunning=false;
    private static long lastAttempt=0L;
    private AppAvailability(){}

    static State cached(Context ctx){
        SharedPreferences p=ctx.getApplicationContext().getSharedPreferences(PREFS,0);
        return new State(p.getBoolean("allowed",true),p.getBoolean("maintenance",false),
            p.getString("message",""));
    }
    static boolean isAllowed(Context ctx){return cached(ctx).allowed;}

    static void refresh(Context context,Consumer<State> callback){
        final Context app=context.getApplicationContext();
        synchronized(AppAvailability.class){
            if(callback!=null)CALLBACKS.add(callback);
            long now=SystemClock.elapsedRealtime();
            if(requestRunning)return;
            if(lastAttempt>0&&now-lastAttempt<CHECK_INTERVAL_MS){
                State cached=cached(app);
                List<Consumer<State>> listeners=new ArrayList<>(CALLBACKS);
                CALLBACKS.clear();
                for(Consumer<State> consumer:listeners)MAIN.post(()->consumer.accept(cached));
                return;
            }
            lastAttempt=now;
            requestRunning=true;
        }
        WORKER.execute(()->{
            State next=cached(app);
            HttpURLConnection connection=null;
            try{
                URL url=new URL(BuildConfig.PREMIUM_BACKEND_URL+"/appStatus?versionCode="+
                    BuildConfig.VERSION_CODE);
                if(!"https".equalsIgnoreCase(url.getProtocol()))
                    throw new IllegalArgumentException("HTTPS required");
                connection=(HttpURLConnection)url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);
                connection.setUseCaches(false);
                if(connection.getResponseCode()!=200)throw new java.io.IOException("status");
                try(InputStream input=connection.getInputStream();
                    ByteArrayOutputStream output=new ByteArrayOutputStream()){
                    byte[] bytes=new byte[1024];int read;
                    while((read=input.read(bytes))!=-1){
                        output.write(bytes,0,read);
                        if(output.size()>4096)throw new java.io.IOException("Payload too large");
                    }
                    JSONObject result=new JSONObject(
                        new String(output.toByteArray(),StandardCharsets.UTF_8));
                    if(!result.has("allowed")||!result.has("maintenance"))
                        throw new java.io.IOException("Invalid status");
                    boolean maintenance=result.getBoolean("maintenance");
                    boolean allowed=result.getBoolean("allowed");
                    String message=maintenance?result.optString("message",""):"";
                    if(message.length()>180)message=message.substring(0,180);
                    next=new State(allowed,maintenance,message);
                    app.getSharedPreferences(PREFS,0).edit()
                       .putBoolean("allowed",allowed).putBoolean("maintenance",maintenance)
                       .putString("message",message).apply();
                }
            }catch(Exception ignored){
                // Keep previous verified state when offline. Never unblock on a network failure.
            }finally{
                if(connection!=null)connection.disconnect();
            }
            final State outcome=next;
            final List<Consumer<State>> listeners;
            synchronized(AppAvailability.class){
                requestRunning=false;
                listeners=new ArrayList<>(CALLBACKS);
                CALLBACKS.clear();
            }
            MAIN.post(()->{
                for(Consumer<State> consumer:listeners){
                    try{consumer.accept(outcome);}catch(RuntimeException ignored){}
                }
            });
        });
    }
}
