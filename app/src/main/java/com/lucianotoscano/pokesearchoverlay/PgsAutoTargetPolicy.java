package com.lucianotoscano.pokesearchoverlay;

/**
 * Ações de alvo escolhidas pelo usuário. Nenhuma coordenada é interpretada
 * como GPS e nenhum botão de segurança é automatizado.
 * Isolado do Android para testes determinísticos.
 */
final class PgsAutoTargetPolicy {
    enum Mode { SPRITE, POKESTOP, POINT, ENCOUNTER }
    enum Trigger { MAP, NO_SHINY, TIMER }
    private PgsAutoTargetPolicy(){}

    static Mode mode(String value){
        if(value!=null)try{return Mode.valueOf(value);}catch(IllegalArgumentException ignored){}
        return Mode.SPRITE;
    }
    static Trigger trigger(String value){
        if(value!=null)try{return Trigger.valueOf(value);}catch(IllegalArgumentException ignored){}
        return Trigger.MAP;
    }
    static boolean valid(float x,float y,int capturedW,int capturedH,
                         int currentW,int currentH){
        return Float.isFinite(x)&&Float.isFinite(y)
            &&x>=.035f&&x<=.965f&&y>=.12f&&y<=.88f
            &&capturedW>0&&capturedH>0
            &&capturedW==currentW&&capturedH==currentH;
    }
    static int pointX(float x,int width){
        return Math.max(0,Math.min(width-1,Math.round(x*width)));
    }
    static int pointY(float y,int height,Mode mode,int stopOffsetPx){
        // Para PokéStop toca *abaixo* do marcador, longe do ícone central.
        int offset=mode==Mode.POKESTOP?Math.max(0,Math.min(120,stopOffsetPx)):0;
        return Math.max(0,Math.min(height-1,Math.round(y*height)+offset));
    }
    static boolean safeToTap(boolean gameVisible,boolean passengerPrompt,
                             boolean mapPopulated,boolean coordinateValid){
        return gameVisible&&!passengerPrompt&&mapPopulated&&coordinateValid;
    }
    static boolean shouldRepeat(Trigger trigger,boolean mapPopulated,
                                boolean shinyPositive,boolean shinyCheckFinished,
                                boolean timeoutElapsed){
        // Ausência de aviso não é automaticamente evidência "Sem Shiny".
        if(!mapPopulated||shinyPositive)return false;
        switch(trigger){
            case TIMER:return timeoutElapsed;
            case NO_SHINY:return shinyCheckFinished;
            default:return true;
        }
    }
}
