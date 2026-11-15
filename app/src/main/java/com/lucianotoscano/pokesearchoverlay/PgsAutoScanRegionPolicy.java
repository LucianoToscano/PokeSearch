package com.lucianotoscano.pokesearchoverlay;

import java.util.Locale;

/**
 * LT360: scanner de ícones da UI, nunca de Pokémon 3D no mapa.
 * PGSharp mantém as duas bordas da LT358; Pokemod utiliza a barra lateral
 * escolhida pelo usuário. OUT continua em modo prévia, sem gesto.
 * Todas as posições são frações da captura: não usar px fixos de um Samsung.
 */
final class PgsAutoScanRegionPolicy {
    static final String LEFT="left",RIGHT="right";
    private PgsAutoScanRegionPolicy(){}

    static String side(String stored){
        return stored!=null&&RIGHT.equals(stored.trim().toLowerCase(Locale.ROOT))
            ?RIGHT:LEFT;
    }
    private static float edgeFraction(int width,int height){
        return width>=height?.34f:.28f; // geometria legada PGSharp
    }
    static boolean inside(String host,String preferredSide,
            int centerX,int centerY,int width,int height){
        if(width<=0||height<=0||centerX<0||centerX>=width||
                centerY<0||centerY>=height)return false;
        // Mantém as barras de sistema e a Pokébola inferior fora da captura.
        if(centerY<height*.07f||centerY>height*.91f)return false;
        float fraction=edgeFraction(width,height);
        boolean onLeft=centerX<=width*fraction;
        boolean onRight=centerX>=width*(1f-fraction);
        if(PgsAutoHostPolicy.POKEMOD.equals(PgsAutoHostPolicy.profile(host)))
            return RIGHT.equals(side(preferredSide))?onRight:onLeft;
        // PGSharp antigo intacto; OUT só oferece prévia nas duas bordas.
        return onLeft||onRight;
    }
    static int firstX(String host,String preferredSide,
            int screenWidth,int screenHeight,int templateWidth){
        if(screenWidth<=0||screenHeight<=0||templateWidth<=0)return 0;
        if(!PgsAutoHostPolicy.POKEMOD.equals(PgsAutoHostPolicy.profile(host))||
                !RIGHT.equals(side(preferredSide)))return 0;
        float edge=edgeFraction(screenWidth,screenHeight);
        return Math.max(0,(int)Math.floor(
            screenWidth*(1f-edge)-templateWidth/2f));
    }
    static int lastX(String host,String preferredSide,
            int screenWidth,int screenHeight,int templateWidth){
        int max=Math.max(-1,screenWidth-templateWidth);
        if(max<0)return -1;
        if(!PgsAutoHostPolicy.POKEMOD.equals(PgsAutoHostPolicy.profile(host))||
                RIGHT.equals(side(preferredSide)))return max;
        float edge=edgeFraction(screenWidth,screenHeight);
        return Math.min(max,Math.max(0,(int)Math.ceil(
            screenWidth*edge-templateWidth/2f)));
    }
}
