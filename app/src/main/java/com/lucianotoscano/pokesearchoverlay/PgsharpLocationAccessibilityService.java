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
    private long lastScanAt=0L;
    private String lastFix="";
    private long lastFixAt=0L;

    @Override public void onAccessibilityEvent(AccessibilityEvent event){
        if(event==null || event.getPackageName()==null ||
           !GAME_PACKAGE.contentEquals(event.getPackageName()))return;
        SharedPreferences settings=getSharedPreferences("prefs",MODE_PRIVATE);
        if(!settings.getBoolean("pgsharpAutoQaEnabled",false))return;
        long uptime=SystemClock.uptimeMillis();
        if(uptime-lastScanAt<MIN_EVENT_GAP_MS)return;
        lastScanAt=uptime;
        AccessibilityNodeInfo root=getRootInActiveWindow();
        if(root==null)return;
        ArrayDeque<AccessibilityNodeInfo> queue=new ArrayDeque<>();
        queue.offer(root);
        int visited=0;
        while(!queue.isEmpty() && visited++<180){
            AccessibilityNodeInfo node=queue.poll();
            if(node==null)continue;
            if(node.isVisibleToUser()){
                String coords=PgsharpCoordinateParser.parse(
                    node.getText()==null?null:node.getText().toString());
                if(coords.isEmpty())coords=PgsharpCoordinateParser.parse(
                    node.getContentDescription()==null?null:node.getContentDescription().toString());
                if(!coords.isEmpty()){
                    long now=System.currentTimeMillis();
                    // Dedupe noisy content-change events without blocking actual movement.
                    if(!coords.equals(lastFix)||now-lastFixAt>10000L){
                        lastFix=coords;lastFixAt=now;
                        sendToRunningOverlays(coords,now);
                    }
                    return;
                }
                for(int i=0;i<node.getChildCount() && queue.size()<180;i++){
                    AccessibilityNodeInfo child=node.getChild(i);
                    if(child!=null)queue.offer(child);
                }
            }
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
}
