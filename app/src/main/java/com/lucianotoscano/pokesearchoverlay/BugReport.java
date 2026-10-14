package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;

/** Privacy-conscious, bounded app diagnostics. Never records page HTML, cookies or credentials. */
public final class BugReport {
    private static final String PREF = "diagnostics";
    private static final String EVENTS = "events_v1";
    private static final int MAX = 80;
    private BugReport(){}

    public static synchronized void log(Context context,String code,String message){
        if(context==null)return;
        SharedPreferences prefs=context.getSharedPreferences(PREF,Context.MODE_PRIVATE);
        JSONArray old;
        try{old=new JSONArray(prefs.getString(EVENTS,"[]"));}
        catch(Exception ignored){old=new JSONArray();}
        JSONArray next=new JSONArray();
        for(int i=Math.max(0,old.length()-(MAX-1));i<old.length();i++)next.put(old.optString(i));
        String safeCode=clean(code);
        String safeMessage=clean(message);
        next.put(time()+" | "+safeCode+" | "+safeMessage);
        prefs.edit().putString(EVENTS,next.toString()).apply();
    }
    private static String time(){
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss",Locale.ROOT).format(new Date());
    }
    private static String clean(String value){
        if(value==null)return "";
        String cleaned=value.replaceAll("[\\r\\n]+"," ");
        cleaned=cleaned.replaceAll("(?i)https?://\\S+","[link omitido]")
             .replaceAll("[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}","[email omitido]")
             .replaceAll("(?<!\\d)(?:\\d[ -]?){12}(?!\\d)","[código omitido]")
             .replaceAll("(?<!\\d)-?\\d{1,2}\\.\\d+\\s*[,;]\\s*-?\\d{1,3}\\.\\d+","[coordenadas omitidas]");
        return cleaned.substring(0,Math.min(cleaned.length(),220));
    }
    public static String export(Context context,String suggestion){
        String version="?";
        try{
            android.content.pm.PackageInfo pkg=context.getPackageManager().getPackageInfo(context.getPackageName(),0);
            version=pkg.versionName;
        }catch(Exception ignored){}
        StringBuilder s=new StringBuilder("POKESEARCH - RELATÓRIO DE BUGS E SUGESTÕES\\n");
        s.append("Criado: ").append(time()).append("\\n");
        s.append("Versão: ").append(version).append("\\n");
        s.append("Android: ").append(Build.VERSION.RELEASE).append(" (API ").append(Build.VERSION.SDK_INT).append(")\\n");
        s.append("Aparelho: ").append(clean(Build.MANUFACTURER+" "+Build.MODEL)).append("\\n");
        s.append("Nota: não inclui senhas, cookies, token, código de amizade nem coordenadas.\\n");
        if(suggestion!=null&&!suggestion.trim().isEmpty())s.append("Descrição do usuário: ").append(clean(suggestion)).append("\\n");
        SharedPreferences prefs=context.getSharedPreferences("prefs",Context.MODE_PRIVATE);
        s.append("Modo: ").append(clean(prefs.getString("mode","iv"))).append("\\n");
        s.append("Shiny solicitado: ").append(prefs.getBoolean("shiny",false)).append("\\n");
        s.append("Busca automática: ").append(prefs.getInt("intervalMinutes",5)).append(" min\\n");
        s.append("Último status: ").append(clean(prefs.getString("lastStatus",""))).append("\\n");
        s.append("Último erro: ").append(clean(prefs.getString("lastError",""))).append("\\n");
        s.append("Eventos recentes:\\n");
        JSONArray a;
        try{a=new JSONArray(context.getSharedPreferences(PREF,Context.MODE_PRIVATE).getString(EVENTS,"[]"));}
        catch(Exception ignored){a=new JSONArray();}
        for(int i=0;i<a.length();i++)s.append("- ").append(clean(a.optString(i))).append("\\n");
        return s.toString().replace("\\n","\n");
    }
}
