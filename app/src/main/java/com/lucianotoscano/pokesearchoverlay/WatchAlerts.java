package com.lucianotoscano.pokesearchoverlay;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.net.Uri;
import org.json.JSONObject;
import android.media.RingtoneManager;
import android.os.Build;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

public final class WatchAlerts {
    private static final String CHANNEL_ID="pokesearch_watch_sound_v1"; // legacy; never reuse its old silent configuration
    private static final java.util.concurrent.atomic.AtomicInteger NEXT_ALERT_ID=
        new java.util.concurrent.atomic.AtomicInteger(13000);
    private static final String SILENT_CHANNEL_ID="pokesearch_watch_silent_v1";
    public static final String PREF_LIST="watchList";
    public static final String PREF_ENABLED="watchAlertsEnabled";
    public static final String PREF_MODE="favoriteAlertMode";
    public static final String PREF_GENERAL_TONE="newPokemonSoundUri";
    public static final String PREF_FAVORITE_TONE="favoriteSoundUri";
    public static final String PREF_SPECIES_TONES="favoritePokemonSoundUris";
    private WatchAlerts(){}
    // One explicit owner for the app-global list, modes and sounds. Overlay
    // search preferences must continue to use each instance's own storage.
    static SharedPreferences sharedPreferences(Context context){
        return context.getSharedPreferences("prefs",0);
    }
    public static String normalized(String text){
        if(text==null)return "";
        String s=Normalizer.normalize(text,Normalizer.Form.NFD).replaceAll("\\p{M}+","").toLowerCase(Locale.ROOT);
        return s.replaceAll("[^a-z0-9]+"," ").trim().replaceAll(" +"," ");
    }
    public static LinkedHashMap<String,String> names(String raw){
        LinkedHashMap<String,String> result=new LinkedHashMap<>();
        if(raw==null)return result;
        for(String part:raw.split("[,;\\n\\r]+")){
            String display=part.trim().replaceAll("\\s+"," ");
            if(display.isEmpty())continue;
            if(display.length()>70)display=display.substring(0,70).trim();
            String key=normalized(display);
            if(!key.isEmpty()&&!result.containsKey(key)&&result.size()<50)result.put(key,display);
        }
        return result;
    }
    public static String canonicalList(String raw){return String.join("\n",names(raw).values());}
    public static Set<String> watched(Context context){
        SharedPreferences p=context.getSharedPreferences("prefs",0);
        return new LinkedHashSet<>(names(p.getString(PREF_LIST,"")).keySet());
    }
    public static boolean matches(String name,Set<String> wanted){
        String n=normalized(name);
        if(n.isEmpty())return false;
        for(String key:wanted)if(n.equals(key)||n.startsWith(key+" "))return true;
        return false;
    }
    public static boolean isWatched(Context context,String name){
        return matches(name,watched(context));
    }
    public static synchronized boolean toggle(Context context,String name){
        SharedPreferences p=context.getSharedPreferences("prefs",0);
        LinkedHashMap<String,String> list=names(p.getString(PREF_LIST,""));
        String key=normalized(name);
        if(key.isEmpty())return false;
        boolean added;
        if(list.containsKey(key)){list.remove(key);added=false;}
        else if(list.size()<50){list.put(key,name.trim());added=true;}
        else return false;
        String updated=String.join("\n",list.values());
        SharedPreferences.Editor editor=p.edit().putString(PREF_LIST,updated);
        // The highlighted Favorites slot is a live profile. Save every
        // change atomically, including changes outside the native picker.
        // Do not overwrite the other two stored profiles.
        int active=p.getInt("favoritePresetActiveV1",0);
        if(active>=1&&active<=3)
            editor.putString("favoritePresetV1_"+active,updated);
        editor.apply();
        return added;
    }
    public static String mode(Context context){
        SharedPreferences prefs=context.getSharedPreferences("prefs",0);
        String fallback=prefs.getBoolean(PREF_ENABLED,true)?"on":"off";
        String value=prefs.getString(PREF_MODE,fallback);
        return "on".equals(value)||"silent".equals(value)||"off".equals(value)?value:fallback;
    }
    public static boolean enabled(Context context){return !"off".equals(mode(context));}
    public static void setMode(Context context,String mode){
        if(!"on".equals(mode)&&!"silent".equals(mode)&&!"off".equals(mode))return;
        context.getSharedPreferences("prefs",0).edit()
            .putString(PREF_MODE,mode).putBoolean(PREF_ENABLED,!"off".equals(mode)).apply();
    }
    public static boolean permissionGranted(Context context){
        if(Build.VERSION.SDK_INT>=33 &&
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)
            return false;
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        return manager!=null&&manager.areNotificationsEnabled();
    }

    // Accept persisted content URIs or installed Android raw resources; never remote streams.
    private static Uri ringtoneUri(Context context,String value){
        if(value!=null&&value.length()<2048&&!value.isEmpty()){
            Uri uri=Uri.parse(value);
            if("content".equals(uri.getScheme()))return uri;
            if("android.resource".equals(uri.getScheme())){
                // Old preferences may target an MP3 deleted from a later APK.
                // Fall back safely without resetting sounds of other species.
                if(context.getPackageName().equals(uri.getAuthority())){
                    java.util.List<String> segments=uri.getPathSegments();
                    if(segments.size()==2&&"raw".equals(segments.get(0))&&
                        context.getResources().getIdentifier(
                            segments.get(1),"raw",context.getPackageName())==0)
                        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                return uri;
            }
        }
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    }
    public static Uri selectedTone(Context context,boolean favorite,String species){
        SharedPreferences p=context.getSharedPreferences("prefs",0);
        if(favorite&&species!=null){
            try{
                String own=new JSONObject(p.getString(PREF_SPECIES_TONES,"{}"))
                    .optString(normalized(species),"");
                if(!own.isEmpty())return ringtoneUri(context,own);
            }catch(Exception ignored){}
        }
        // No preference yet: start favorites on the bundled Portuguese reveal.
        // An explicitly saved empty string still means Android "Padrão".
        if(favorite&&!p.contains(PREF_FAVORITE_TONE))
            return PokeSoundLibrary.favoriteDefaultUri(context);
        return ringtoneUri(context,p.getString(favorite?PREF_FAVORITE_TONE:PREF_GENERAL_TONE,""));
    }
    public static boolean hasCustomTone(Context context,boolean favorite){
        SharedPreferences p=context.getSharedPreferences("prefs",0);
        return favorite&&!p.contains(PREF_FAVORITE_TONE)||
            !p.getString(favorite?PREF_FAVORITE_TONE:PREF_GENERAL_TONE,"").isEmpty();
    }
    public static int speciesToneCount(Context context){
        try{
            return Math.min(50,new JSONObject(context.getSharedPreferences("prefs",0)
                .getString(PREF_SPECIES_TONES,"{}")).length());
        }catch(Exception ignored){return 0;}
    }
    /** Android notification channel sounds are IMMUTABLE after creation.
     * LT106 migrates favorites away from stale v1/v2 channels. Future
     * selections get an independent channel without mutating user-owned
     * Android settings or overriding DND/silent mode. */
    public static String soundChannelId(Context context,boolean favorite,String species){
        if(favorite){
            Uri sound=selectedTone(context,true,species);
            String key=sound.toString();
            // Share a single channel unless this species has its own selected
            // cry. Do not create fifty duplicate system channels for a list.
            if(species!=null&&!species.isEmpty()){
                try{
                    String own=new JSONObject(context.getSharedPreferences("prefs",0)
                        .getString(PREF_SPECIES_TONES,"{}")).optString(normalized(species),"");
                    if(!own.isEmpty())key=normalized(species)+"|"+key;
                }catch(Exception ignored){}
            }
            return "pokesearch_fav_sound_v3_"+Integer.toHexString(key.hashCode());
        }
        // Legacy general channel could also be muted permanently by Android.
        // A chosen new-Pokémon tone must use a fresh channel just like Favorites.
        Uri sound=selectedTone(context,false,null);
        return "pokesearch_new_sound_v3_"+Integer.toHexString(sound.toString().hashCode());
    }
    public static void ensureChannel(Context context){ensureChannel(context,null);}
    public static void ensureChannel(Context context,String species){
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return;
        String id=soundChannelId(context,true,species);
        NotificationChannel channel=new NotificationChannel(id,
            species!=null&&!species.isEmpty()?
                "PokeSearch · Favorito "+species:"PokeSearch · Favoritos",
            NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Som de favorito independente do aviso geral");
        channel.setSound(selectedTone(context,true,species),
            new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT).build());
        manager.createNotificationChannel(channel);
    }
    private static void ensureSilentChannel(Context context){
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return;
        NotificationChannel channel=new NotificationChannel(SILENT_CHANNEL_ID,
            "PokeSearch · Favoritos silenciosos",NotificationManager.IMPORTANCE_LOW);
        channel.setSound(null,null);
        manager.createNotificationChannel(channel);
    }
    private static boolean send(Context context,String title,String info,int id,String species){
        return send(context,title,info,id,species,null);
    }
    private static boolean send(Context context,String title,String info,int id,
                                String species,android.graphics.Bitmap artwork){
        if(!permissionGranted(context)){
            recordAlertProblem(context,"Permissão de notificações desativada no Android");
            return false;
        }
        String soundMode=mode(context);
        if("off".equals(soundMode)){
            recordAlertProblem(context,"Alertas de Favoritos estão em OFF");
            return false;
        }
        boolean quiet="silent".equals(soundMode);
        try{
            if(quiet)ensureSilentChannel(context);else ensureChannel(context,species);
        }catch(Exception error){
            recordAlertProblem(context,"Não foi possível preparar o canal de som");
            BugReport.log(context,"NOTIFICATION","Falha ao criar canal favorito");
            return false;
        }
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return false;
        String channelId=quiet?SILENT_CHANNEL_ID:soundChannelId(context,true,species);
        NotificationChannel current=manager.getNotificationChannel(channelId);
        if(current==null||current.getImportance()==NotificationManager.IMPORTANCE_NONE){
            recordAlertProblem(context,"Canal de Favoritos bloqueado no Android");
            return false;
        }
        if(!quiet&&current.getSound()==null)
            recordAlertProblem(context,"Canal de Favoritos está sem som nas configurações do Android");
        else if(!quiet)recordAlertProblem(context,"");
        Intent open=new Intent(context,MainActivity.class);
        PendingIntent intent=PendingIntent.getActivity(context,11,open,
            PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder builder=new Notification.Builder(context,channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title).setContentText(info).setAutoCancel(true)
            .setSubText("PokeSearch · Favorito")
            .setStyle(new Notification.BigTextStyle().bigText(info)).setContentIntent(intent);
        if(artwork!=null)builder.setLargeIcon(artwork);
        Notification note=builder.build();
        try{manager.notify(id,note);return true;}
        catch(Exception e){
            recordAlertProblem(context,"Falha ao enviar notificação de favorito");
            BugReport.log(context,"NOTIFICATION","Alerta favorito · "+e.getClass().getSimpleName());
            return false;
        }
    }
    private static void recordAlertProblem(Context context,String reason){
        context.getSharedPreferences("prefs",0).edit()
            .putString("lastWatchAlertError",reason).apply();
    }
    /** Diagnostics for a user-initiated real notification test (no fake spawn).
     * This never plays outside Android permission, DND or mute controls. */
    public static String soundDiagnostic(Context context){
        if(!permissionGranted(context))
            return "Permita as notificações do PokeSearch nas configurações do Android.";
        String chosen=mode(context);
        if("off".equals(chosen))return "Ative Som em Pokémon Favoritos.";
        if("silent".equals(chosen))return "Favoritos está em Sem som. Selecione Som.";
        NotificationManager manager=(NotificationManager)
            context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return "Gerenciador de notificações indisponível.";
        String channelId=soundChannelId(context,true,null);
        NotificationChannel channel=manager.getNotificationChannel(channelId);
        if(channel==null)return "Canal de som ainda não foi criado.";
        if(channel.getImportance()==NotificationManager.IMPORTANCE_NONE)
            return "Canal de Favoritos bloqueado pelo Android.";
        if(channel.getSound()==null)
            return "O canal Favoritos está silenciado no Android. Reative o som nas configurações.";
        android.media.AudioManager audio=(android.media.AudioManager)
            context.getSystemService(Context.AUDIO_SERVICE);
        if(audio!=null&&audio.getStreamVolume(android.media.AudioManager.STREAM_NOTIFICATION)==0)
            return "Volume de notificações está zerado ou celular está silencioso.";
        return "Notificação enviada; verifique volume, Não Perturbe e configurações do canal.";
    }
    public static boolean test(Context context){
        return send(context,"🔔 Teste: Pokémon procurado",
            "Teste do canal Favoritos. Alertas reais exigem favorito cadastrado e resultado confirmado nos filtros.",11999,null);
    }
    // Diagnostics use distinct Android notification IDs and explicit P1/P2
    // titles; an Android-only test must not be mistaken for a verified spawn.
    public static boolean test(Context context,boolean secondary){
        String ball=secondary?"P2":"P1";
        return send(context,"🔔 Teste "+ball+": Pokémon favorito",
            ball+" · Teste do canal Favoritos. Avisos reais exigem resultado confirmado e Pokémon selecionado.",
            secondary?11998:11997,null);
    }
    /** Exact encounter title supplied by native verified-result formatting.
     * Never merge Hundo, Shundo, league ranks or different CP encounters.
     */
    public static boolean match(Context context,String pokemon,String title,
                                String info,android.graphics.Bitmap artwork){
        return send(context,title,info,
            NEXT_ALERT_ID.updateAndGet(previous->previous>=22999?13000:previous+1),
            pokemon,artwork);
    }
    public static boolean match(Context context,String pokemon,String info){
        return send(context,"🔔 Encontrado: "+pokemon,info,
            NEXT_ALERT_ID.updateAndGet(previous->previous>=22999?13000:previous+1),pokemon);
    }
}
