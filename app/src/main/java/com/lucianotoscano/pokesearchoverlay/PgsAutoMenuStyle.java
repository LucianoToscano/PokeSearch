package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Color;
import org.json.JSONObject;

/** Native mirror of the real P1/P2 dock controls-window visual settings.
 * Reads the canonical prefs.visualPrefsJson; never creates a conflicting PGS
 * menu opacity or rewrites user account/filter settings.
 */
final class PgsAutoMenuStyle {
    static final int CELL_DP=OverlayVisualTheme.TILE_DP, ART_DP=OverlayVisualTheme.ART_DP,
        BASE_GAP_DP=OverlayVisualTheme.GAP_DP, CORNER_DP=OverlayVisualTheme.RADIUS_DP;
    final int menuTransparency,menuBlur,menuItemGap,menuOffsetX,menuOffsetY;
    final int gearMenuGap,popupWidth,popupHeight;
    final boolean vertical,light,guides;
    private PgsAutoMenuStyle(JSONObject p){
        menuTransparency=bounded(p.optInt("menuTransparency",50),0,100);
        menuBlur=bounded(p.optInt("menuBlur",4),0,16);
        menuItemGap=bounded(p.optInt("menuItemGap",0),0,16);
        menuOffsetX=bounded(p.optInt("menuOffsetX",0),-200,200);
        menuOffsetY=bounded(p.optInt("menuOffsetY",0),-350,350);
        gearMenuGap=bounded(p.optInt("gearMenuGap",0),0,80);
        popupWidth=bounded(p.optInt("popupWidth",232),160,330);
        popupHeight=bounded(p.optInt("popupHeight",390),140,420);
        vertical="vertical".equals(p.optString("menuOrientation","horizontal"));
        light="light".equals(p.optString("menuBgMode","dark"));
        guides=p.optBoolean("menuGuides",p.optBoolean("showGuides",false));
    }
    static PgsAutoMenuStyle read(Context c){
        return new PgsAutoMenuStyle(OverlayVisualTheme.read(c));
    }
    private static int bounded(int v,int lo,int hi){return Math.min(hi,Math.max(lo,v));}
    int foreground(){return OverlayVisualTheme.foreground(light);}
    int tileFill(){
        // #28292cce is the verified dock.html controls-window dark tile at 50.
        // The user transparency slider is honored without an extra PGS layer.
        int a=bounded(Math.round(206f*(100-menuTransparency)/50f),0,255);
        return light?Color.argb(a,248,250,252):Color.argb(a,40,41,44);
    }
    int tileStroke(){
        // Guide outlines must remain subtle white/neutral (never blue) and
        // become fully invisible at 100% menu transparency, like the tiles.
        int a=bounded(Math.round(45f*(100-menuTransparency)/50f),0,255);
        if(guides)a=Math.min(a,51);
        return light?Color.argb(a,21,34,49):Color.argb(a,255,255,255);
    }
    int itemGapDp(){return BASE_GAP_DP+menuItemGap;}
    int panelFill(Context c){return OverlayQuickMenus.panelColor(c);}
}
