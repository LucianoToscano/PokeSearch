package com.lucianotoscano.pokesearchoverlay;

import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.widget.TextView;
import android.widget.ScrollView;
import java.util.List;
import java.util.Map;

/** Shows only short-lived in-memory, owner/holder-authorized license key responses. */
final class PremiumKeyListDialog {
    private PremiumKeyListDialog(){}
    static void show(Context context,String title,Map<String,Object> response){
        Object raw=response.get("keys");
        if(!(raw instanceof List)){
            android.widget.Toast.makeText(context,"Lista de licenças indisponível.",
                android.widget.Toast.LENGTH_SHORT).show();return;
        }
        StringBuilder lines=new StringBuilder();
        for(Object entry:(List<?>)raw){
            if(!(entry instanceof Map))continue;
            Map<?,?> row=(Map<?,?>)entry;
            String key=String.valueOf(row.get("licenseKey"));
            if(!key.matches("PS-([A-F0-9]{6}-){3}[A-F0-9]{6}"))continue;
            String slot=String.valueOf(row.get("slot"));
            String status=Boolean.TRUE.equals(row.get("revoked"))?"REVOGADA":
                Boolean.TRUE.equals(row.get("claimed"))?"ATIVADA":"DISPONÍVEL";
            lines.append(slot).append(". ").append(key).append(" · ").append(status).append("\n\n");
        }
        TextView text=new TextView(context);
        int padding=(int)(16*context.getResources().getDisplayMetrics().density);
        text.setPadding(padding,padding,padding,padding);
        text.setText(lines.toString().trim());
        text.setTextIsSelectable(true);
        ScrollView scroller=new ScrollView(context);
        scroller.addView(text);
        new AlertDialog.Builder(context).setTitle(title).setView(scroller)
            .setNegativeButton("Fechar",null)
            .setPositiveButton("Copiar códigos",(dialog,which)->{
                ClipboardManager clip=(ClipboardManager)context.getSystemService(Context.CLIPBOARD_SERVICE);
                if(clip!=null)clip.setPrimaryClip(
                    ClipData.newPlainText("Chaves Premium",lines.toString().trim()));
            }).show();
    }
}
