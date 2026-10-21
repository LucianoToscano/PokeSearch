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
    private static final String CHANNEL_ID="pokesearch_watch_sound_v1";
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
        p.edit().putString(PREF_LIST,String.join("\n",list.values())).apply();
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

    // Store only Android-selected ringtone content URIs. No bundled Pokémon cries.
    private static Uri ringtoneUri(String value){
        if(value!=null&&value.length()<2048&&!value.isEmpty()){
            Uri uri=Uri.parse(value);
            if("content".equals(uri.getScheme())||
                "android.resource".equals(uri.getScheme()))return uri;
        }
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    }
    public static Uri selectedTone(Context context,boolean favorite,String species){
        SharedPreferences p=context.getSharedPreferences("prefs",0);
        if(favorite&&species!=null){
            try{
                String own=new JSONObject(p.getString(PREF_SPECIES_TONES,"{}"))
                    .optString(normalized(species),"");
                if(!own.isEmpty())return ringtoneUri(own);
            }catch(Exception ignored){}
        }
        return ringtoneUri(p.getString(favorite?PREF_FAVORITE_TONE:PREF_GENERAL_TONE,""));
    }
    public static boolean hasCustomTone(Context context,boolean favorite){
        SharedPreferences p=context.getSharedPreferences("prefs",0);
        return !p.getString(favorite?PREF_FAVORITE_TONE:PREF_GENERAL_TONE,"").isEmpty();
    }
    public static int speciesToneCount(Context context){
        try{
            return Math.min(50,new JSONObject(context.getSharedPreferences("prefs",0)
                .getString(PREF_SPECIES_TONES,"{}")).length());
        }catch(Exception ignored){return 0;}
    }
    public static String soundChannelId(Context context,boolean favorite,String species){
        SharedPreferences prefs=context.getSharedPreferences("prefs",0);
        String chosen=prefs.getString(favorite?PREF_FAVORITE_TONE:PREF_GENERAL_TONE,"");
        if(favorite&&species!=null){
            try{
                String own=new JSONObject(prefs.getString(PREF_SPECIES_TONES,"{}"))
                    .optString(normalized(species),"");
                if(!own.isEmpty())
                    return "pokesearch_fav_species_v2_"+
                        Integer.toHexString((normalized(species)+"|"+own).hashCode());
            }catch(Exception ignored){}
        }
        if(!chosen.isEmpty())
            return (favorite?"pokesearch_fav_custom_v2_":"pokesearch_new_custom_v2_")+
                Integer.toHexString(chosen.hashCode());
        return favorite?CHANNEL_ID:"pokesearch_alerts";
    }
    public static void ensureChannel(Context context){ensureChannel(context,null);}
    public static void ensureChannel(Context context,String species){
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return;
        String id=soundChannelId(context,true,species);
        NotificationChannel channel=new NotificationChannel(id,
            id.startsWith("pokesearch_fav_species_v2_")?
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
        if(!permissionGranted(context))return false;
        String soundMode=mode(context);
        if("off".equals(soundMode))return false;
        boolean quiet="silent".equals(soundMode);
        if(quiet)ensureSilentChannel(context);else ensureChannel(context,species);
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return false;
        String channelId=quiet?SILENT_CHANNEL_ID:soundChannelId(context,true,species);
        NotificationChannel current=manager.getNotificationChannel(channelId);
        if(current==null||current.getImportance()==NotificationManager.IMPORTANCE_NONE)
            return false;
        Intent open=new Intent(context,MainActivity.class);
        PendingIntent intent=PendingIntent.getActivity(context,11,open,
            PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        Notification note=new Notification.Builder(context,channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title).setContentText(info).setAutoCancel(true)
            .setStyle(new Notification.BigTextStyle().bigText(info)).setContentIntent(intent).build();
        try{manager.notify(id,note);return true;}
        catch(Exception e){
            BugReport.log(context,"NOTIFICATION","Alerta favorito · "+e.getClass().getSimpleName());
            return false;
        }
    }
    public static boolean test(Context context){
        return send(context,"🔔 Teste: Pokémon procurado",
            "Teste do canal Favoritos. Alertas reais exigem favorito cadastrado e resultado confirmado nos filtros.",11999,null);
    }
    public static boolean match(Context context,String pokemon,String info){
        return send(context,"🔔 Encontrado: "+pokemon,info,
            NEXT_ALERT_ID.updateAndGet(previous->previous>=22999?13000:previous+1),pokemon);
    }
}
