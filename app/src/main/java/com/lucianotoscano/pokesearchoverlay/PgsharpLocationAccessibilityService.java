package com.lucianotoscano.pokesearchoverlay;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import java.util.ArrayDeque;

/**
 * Opt-in QA adapter. It cannot read PGSharp's native game memory. It reacts ONLY if PGSharp
 * publishes a correctly labeled CURRENT PLAYER coordinate in Android accessibility nodes.
 * No raw text/screenshots are stored, logged or transmitted; no Android GPS is consulted.
 */
public final class PgsharpLocationAccessibilityService extends AccessibilityService {
    private static final String GAME_PACKAGE="com.nianticlabs.pokemongo";
    private static final String ACTION="com.lucianotoscano.pokesearchoverlay.PGSHARP_POSITION";
    private static final long MIN_EVENT_GAP_MS=750L;
    private static final String DIAGNOSTICS_PREFS="pgsharp_qa_diagnostics";
    private long lastScanAt=0L;
    private String lastFix="";
    private long lastFixAt=0L;

    @Override protected void onServiceConnected(){
        super.onServiceConnected();
        getSharedPreferences(DIAGNOSTICS_PREFS,MODE_PRIVATE).edit()
            .putBoolean("connected",true).putLong("connectedAt",System.currentTimeMillis())
            .apply();
    }

    @Override public void onAccessibilityEvent(AccessibilityEvent event){
        if(event==null || event.getPackageName()==null ||
           !GAME_PACKAGE.contentEquals(event.getPackageName()))return;
        if(!getSharedPreferences("prefs",MODE_PRIVATE)
                .getBoolean("pgsharpAutoQaEnabled",false))return;
        long uptime=SystemClock.uptimeMillis();
        if(uptime-lastScanAt<MIN_EVENT_GAP_MS)return;
        lastScanAt=uptime;
        long now=System.currentTimeMillis();
        SharedPreferences p=getSharedPreferences(DIAGNOSTICS_PREFS,MODE_PRIVATE);
        int events=Math.min(1000000,p.getInt("events",0)+1);
        // The active window may be PokeSearch's OWN overlay, not the game's window.
        // Prefer the source of the event explicitly attributed to Pokémon GO.
        AccessibilityNodeInfo root=event.getSource();
        String origin="evento";
        if(root!=null){
            for(int i=0;i<16&&root.getParent()!=null;i++){
                AccessibilityNodeInfo parent=root.getParent();
                if(parent.getPackageName()==null ||
                    !GAME_PACKAGE.contentEquals(parent.getPackageName()))break;
                root=parent;
            }
        }
        if(root==null){
            AccessibilityNodeInfo candidate=getRootInActiveWindow();
            if(candidate!=null&&candidate.getPackageName()!=null &&
               GAME_PACKAGE.contentEquals(candidate.getPackageName())){
                root=candidate;origin="janela";
            }
        }
        SharedPreferences.Editor diag=p.edit()
            .putInt("events",events).putLong("lastEventAt",now)
            .putString("source",root==null?"nenhuma":origin);
        if(root==null){
            diag.putInt("nodes",0).putInt("texts",0)
                .putString("status","Sem árvore de interface acessível").apply();
            return;
        }
        ArrayDeque<AccessibilityNodeInfo> queue=new ArrayDeque<>();
        queue.offer(root);
        int visited=0,visible=0,textNodes=0;
        String matched="";
        while(!queue.isEmpty() && visited<180){
            AccessibilityNodeInfo node=queue.poll();
            if(node==null)continue;
            visited++;
            if(!node.isVisibleToUser())continue;
            visible++;
            CharSequence label=node.getText(),description=node.getContentDescription();
            if((label!=null&&label.length()>0)||(description!=null&&description.length()>0))
                textNodes++;
            String coords=PgsharpCoordinateParser.parse(label==null?null:label.toString());
            if(coords.isEmpty())coords=PgsharpCoordinateParser.parse(
                description==null?null:description.toString());
            if(!coords.isEmpty()){
                matched=coords;
                break;
            }
            for(int i=0;i<node.getChildCount()&&queue.size()<180;i++){
                AccessibilityNodeInfo child=node.getChild(i);
                if(child!=null)queue.offer(child);
            }
        }
        diag.putInt("nodes",visible).putInt("texts",textNodes)
            .putString("status",matched.isEmpty()?
                "Eventos recebidos, sem coordenada atual identificada":"Posição atual reconhecida");
        if(!matched.isEmpty()){
            diag.putLong("lastValidAt",now)
                .putInt("matches",Math.min(1000000,p.getInt("matches",0)+1));
        }
        diag.apply();
        if(!matched.isEmpty()&&(!matched.equals(lastFix)||now-lastFixAt>10000L)){
            lastFix=matched;lastFixAt=now;
            sendToRunningOverlays(matched,now);
        }
    }

    private void sendToRunningOverlays(String coords,long when){
        if(OverlayService.isRunning()){
            Intent i=new Intent(this,OverlayService.class).setAction(ACTION)
                .putExtra("coords",coords).putExtra("timestamp",when);
            startService(i);
        }
        if(OverlayService.isSecondaryRunning()){
            Intent i=new Intent(this,SecondaryOverlayService.class).setAction(ACTION)
                .putExtra("coords",coords).putExtra("timestamp",when);
            startService(i);
        }
        // Candy overlay will be connected only after real-device source validation.
    }
    @Override public void onInterrupt(){}
    @Override public void onDestroy(){
        getSharedPreferences(DIAGNOSTICS_PREFS,MODE_PRIVATE).edit()
            .putBoolean("connected",false).apply();
        super.onDestroy();
    }
}
