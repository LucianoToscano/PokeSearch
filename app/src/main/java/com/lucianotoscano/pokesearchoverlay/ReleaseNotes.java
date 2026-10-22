package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.Dialog;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * Offline release notes. The asset is packaged (and checksum-verified) with the APK.
 * No site session, filters, GPS or overlay state is read or changed here.
 *
 * Add a new entry with a unique id whenever publishing actual changes. Rebuilding
 * the same release does not show stale notes a second time.
 */
public final class ReleaseNotes {
    private static final String ASSET = "release_notes.json";
    private static final String PREFS = "prefs";
    private static final String LAST_OPENED_VERSION = "releaseNotesLastOpenedVersion";
    private static final String PENDING_VERSION = "releaseNotesPendingVersion";
    private static final String LAST_SHOWN_ID = "releaseNotesLastShownId";

    private ReleaseNotes() {}

    private static int dp(Activity a,int value) {
        return Math.round(value*a.getResources().getDisplayMetrics().density);
    }

    private static int versionCode(Activity a) {
        try {
            PackageInfo info=a.getPackageManager().getPackageInfo(a.getPackageName(),0);
            if (Build.VERSION.SDK_INT>=28) return (int)info.getLongVersionCode();
            return info.versionCode;
        } catch (Exception ignored) {
            return 0; // Never announce a version that cannot be verified.
        }
    }

    private static JSONArray entries(Activity a) {
        try (InputStream in=a.getAssets().open(ASSET);
             ByteArrayOutputStream out=new ByteArrayOutputStream()) {
            byte[] buffer=new byte[4096];
            int size;
            while ((size=in.read(buffer))!=-1) {
                if (out.size()+size>96000) return new JSONArray();
                out.write(buffer,0,size);
            }
            JSONObject root=new JSONObject(out.toString("UTF-8"));
            if (!"pokesearch-release-notes-v1".equals(root.optString("schema")))
                return new JSONArray();
            JSONArray result=root.optJSONArray("releases");
            return result==null?new JSONArray():result;
        } catch (Exception ignored) {
            return new JSONArray(); // Release notes must never prevent the Home from opening.
        }
    }

    private static JSONObject latestEligible(JSONArray releases,int code) {
        JSONObject latest=null;
        int minimum=-1;
        for (int i=0;i<releases.length();i++) {
            JSONObject item=releases.optJSONObject(i);
            if (item==null||item.optString("id").trim().isEmpty()) continue;
            int from=item.optInt("minVersionCode",Integer.MAX_VALUE);
            if (from<=code&&from>minimum) {latest=item;minimum=from;}
        }
        return latest;
    }

    /** Call only on a normal launcher opening, never during OAuth or overlay callbacks. */
    public static void maybeShowAfterUpgrade(Activity activity) {
        if (activity.isFinishing()||activity.isDestroyed()) return;
        int code=versionCode(activity);
        if (code<=0) return;
        SharedPreferences prefs=activity.getSharedPreferences(PREFS,0);
        long previous=prefs.getLong(LAST_OPENED_VERSION,-1);
        boolean upgraded=previous>0&&code>previous;
        if (previous<0) {
            // Old APKs did not store LAST_OPENED_VERSION. Detect an in-place
            // update using Android's install metadata; skip a clean installation.
            try {
                PackageInfo info=activity.getPackageManager()
                    .getPackageInfo(activity.getPackageName(),0);
                upgraded=info.lastUpdateTime>info.firstInstallTime+2000;
            } catch (Exception ignored) {upgraded=false;}
        }
        SharedPreferences.Editor edit=prefs.edit().putLong(LAST_OPENED_VERSION,code);
        if (upgraded) edit.putLong(PENDING_VERSION,code);
        edit.apply();

        if (prefs.getLong(PENDING_VERSION,-1)!=code) return;
        JSONObject current=latestEligible(entries(activity),code);
        if (current==null) return;
        String id=current.optString("id","");
        if (id.equals(prefs.getString(LAST_SHOWN_ID,""))) {
            prefs.edit().remove(PENDING_VERSION).apply();
            return;
        }
        showDialog(activity,new JSONArray().put(current),false,()->{
            prefs.edit().putString(LAST_SHOWN_ID,id).remove(PENDING_VERSION).apply();
        });
    }

    /** Manual history access from the Home menu; reading it does not change upgrade flags. */
    public static void showHistory(Activity activity) {
        if (activity.isFinishing()||activity.isDestroyed()) return;
        JSONArray list=entries(activity);
        JSONArray available=new JSONArray();
        int code=versionCode(activity);
        // Source file is append-only, oldest to newest.
        for (int i=list.length()-1;i>=0;i--) {
            JSONObject item=list.optJSONObject(i);
            if (item!=null&&!item.optString("id").isEmpty()&&
                item.optInt("minVersionCode",Integer.MAX_VALUE)<=code)
                available.put(item);
        }
        showDialog(activity,available,true,null);
    }

    private static TextView text(Activity a,String value,int size,int color,boolean bold) {
        TextView t=new TextView(a);
        t.setText(value);
        t.setTextColor(color);
        t.setTextSize(size);
        if (bold) t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        return t;
    }

    private static void renderEntry(Activity a,LinearLayout body,JSONObject entry,
                                    boolean light,boolean history) {
        int main=light?Color.rgb(28,47,69):Color.WHITE;
        int subtle=light?Color.rgb(77,96,115):Color.rgb(180,201,220);
        if (history) {
            TextView heading=text(a,entry.optString("title","Atualização"),15,main,true);
            heading.setPadding(0,dp(a,13),0,dp(a,2));
            body.addView(heading);
            String date=entry.optString("date","");
            if (!date.isEmpty()) body.addView(text(a,date,11,subtle,false));
        }
        String[] keys={"novidades","melhorias","correcoes","emDesenvolvimento"};
        String[] titles={"✨ Novidades","↗ Melhorias","🛠 Correções","◷ Em desenvolvimento"};
        JSONObject sections=entry.optJSONObject("sections");
        if (sections==null) return;
        for (int i=0;i<keys.length;i++) {
            JSONArray items=sections.optJSONArray(keys[i]);
            if (items==null||items.length()==0) continue;
            TextView header=text(a,titles[i],14,main,true);
            header.setPadding(0,dp(a,12),0,dp(a,4));
            body.addView(header);
            for (int j=0;j<items.length();j++) {
                String line=items.optString(j,"").trim();
                if (line.isEmpty()) continue;
                TextView bullet=text(a,"•  "+line,13,subtle,false);
                bullet.setPadding(dp(a,6),0,0,dp(a,5));
                body.addView(bullet);
            }
        }
    }

    private static void showDialog(Activity activity,JSONArray releases,
                                   boolean history,Runnable onDismiss) {
        boolean light=activity.getSharedPreferences(PREFS,0)
            .getBoolean("homeLightMode",false);
        int background=light?Color.rgb(248,251,255):Color.rgb(23,34,51);
        int main=light?Color.rgb(28,47,69):Color.WHITE;
        int subtle=light?Color.rgb(82,104,122):Color.rgb(176,199,223);

        LinearLayout shell=new LinearLayout(activity);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setPadding(dp(activity,19),dp(activity,17),dp(activity,19),dp(activity,14));
        GradientDrawable bg=new GradientDrawable();
        bg.setColor(background);
        bg.setCornerRadius(dp(activity,18));
        bg.setStroke(dp(activity,1),light?Color.rgb(200,214,230):Color.rgb(69,94,127));
        shell.setBackground(bg);

        TextView heading=text(activity,history?"Histórico de atualizações":
            "✨ PokeSearch atualizado!",18,main,true);
        shell.addView(heading);
        TextView subtitle=text(activity,"Versão "+BuildConfig.VERSION_NAME,12,subtle,false);
        subtitle.setPadding(0,dp(activity,3),0,dp(activity,7));
        shell.addView(subtitle);

        ScrollView scroll=new ScrollView(activity);
        scroll.setFillViewport(false);
        LinearLayout body=new LinearLayout(activity);
        body.setOrientation(LinearLayout.VERTICAL);
        if (releases.length()==0) {
            TextView empty=text(activity,"Ainda não há notas publicadas para esta versão.",
                13,subtle,false);
            empty.setPadding(0,dp(activity,15),0,dp(activity,15));
            body.addView(empty);
        } else {
            for (int i=0;i<releases.length();i++) {
                JSONObject entry=releases.optJSONObject(i);
                if (entry!=null) renderEntry(activity,body,entry,light,history);
            }
        }
        scroll.addView(body);
        shell.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));

        TextView done=text(activity,"✓  Entendi",15,
            light?Color.rgb(12,74,71):Color.rgb(182,247,219),true);
        done.setGravity(Gravity.CENTER);
        done.setContentDescription("Fechar notas de atualização");
        GradientDrawable buttonBg=new GradientDrawable();
        buttonBg.setColor(light?Color.rgb(213,239,232):Color.rgb(25,76,66));
        buttonBg.setCornerRadius(dp(activity,10));
        done.setBackground(buttonBg);
        LinearLayout.LayoutParams btn=new LinearLayout.LayoutParams(-1,dp(activity,44));
        btn.topMargin=dp(activity,12);
        shell.addView(done,btn);

        Dialog dialog=new Dialog(activity);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(shell);
        done.setOnClickListener(v->dialog.dismiss());
        if (onDismiss!=null) dialog.setOnDismissListener(ignored->onDismiss.run());
        dialog.show();
        Window window=dialog.getWindow();
        if (window!=null) {
            window.setBackgroundDrawableResource(android.R.color.transparent);
            int width=Math.min(activity.getResources().getDisplayMetrics().widthPixels-
                dp(activity,24),dp(activity,440));
            int height=Math.min(activity.getResources().getDisplayMetrics().heightPixels-
                dp(activity,95),dp(activity,history?600:470));
            window.setLayout(width,height);
        }
    }
}
