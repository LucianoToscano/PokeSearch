package com.lucianotoscano.pokesearchoverlay;

/**
 * Estado visual do botão PGS. Mesma geometria da Pokébola em
 * dock.html: slot 35x30 dp, arte 21 dp e pulso de 850 ms.
 * Não concede permissões nem controla gestos.
 */
final class PgsAutoVisualState {
    static final int TOUCH_DP=44;
    static final int RESULT_SLOT_WIDTH_DP=35;
    static final int RESULT_SLOT_HEIGHT_DP=30;
    static final int RESULT_ART_DP=21;
    static final int CORE_DP=7;
    static final long PULSE_MS=850L;
    enum Core { WHITE, GREEN, RED }

    private PgsAutoVisualState(){}

    static boolean active(boolean running,boolean pausedByShiny,boolean pausedByError){
        return running&&!pausedByShiny&&!pausedByError;
    }

    static Core core(boolean running,boolean awaitingMap,boolean pausedByError,String status){
        String label=status==null?"":status.toUpperCase(java.util.Locale.ROOT);
        if(pausedByError
            ||label.startsWith("SEM CAPTURA")
            ||label.startsWith("SEM MODELO")
            ||label.startsWith("ERRO")
            ||label.startsWith("FALHA")){
            return Core.RED;
        }
        if(!running)return Core.WHITE;
        // Verde somente enquanto o mapa/objetos estão carregando.
        if(awaitingMap){
            return Core.GREEN;
        }
        return Core.WHITE;
    }
}
