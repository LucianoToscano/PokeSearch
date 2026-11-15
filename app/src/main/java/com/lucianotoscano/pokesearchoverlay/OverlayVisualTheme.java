package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Color;
import org.json.JSONObject;

/**
 * LT350: native mirror of the P1/P2 menu CSS geometry and visual JSON.
 * Cross-language contract checked by lt350-overlay-design-contract.test.js.
 * Native dimensions are dp, screenshot reference values are physical px.
 */
final class OverlayVisualTheme {
    static final int TILE_DP=30;
    static final int ART_DP=16;
    static final int GAP_DP=2;
    static final int RADIUS_DP=5;
    private OverlayVisualTheme(){}

    static int bound(int value,int min,int max){
        return Math.max(min,Math.min(max,value));
    }

    static JSONObject read(Context context){
        String raw=context.getSharedPreferences("prefs",Context.MODE_PRIVATE)
            .getString("visualPrefsJson","{}");
        try{return new JSONObject(raw);}
        catch(Exception ignored){return new JSONObject();}
    }

    static boolean light(JSONObject prefs){
        return "light".equals(prefs.optString("menuBgMode","dark"));
    }

    static int transparency(JSONObject prefs){
        return bound(prefs.optInt("menuTransparency",50),0,100);
    }

    static int blur(JSONObject prefs){
        return bound(prefs.optInt("menuBlur",4),0,16);
    }

    static int foreground(boolean light){
        return light?Color.rgb(21,34,49):Color.rgb(242,247,252);
    }

    static int panelFill(JSONObject prefs){
        // Exactly the linear alpha from visual_editor.js rgba().
        int alpha=Math.round(255f*(100-transparency(prefs))/100f);
        return light(prefs)?Color.argb(alpha,255,255,255):
            Color.argb(alpha,15,19,26);
    }

    static int panelBorder(JSONObject prefs){
        // Same 0.45 * tile opacity from visual_editor.js.
        int alpha=Math.round(255f*(100-transparency(prefs))/100f*.45f);
        return light(prefs)?Color.argb(alpha,49,69,91):
            Color.argb(alpha,227,233,241);
    }
}
