package com.lucianotoscano.pokesearchoverlay;

/** LT355: conversão conservadora da captura para coordenadas de display físico. */
final class PgsAutoScreenGeometry {
    private PgsAutoScreenGeometry(){}
    /**
     * Retorna null quando rotação, crop ou barras deixam a geometria ambígua.
     * Não tenta inferir crop/inset sem calibração física.
     */
    static int[] map(int x,int y,int shotW,int shotH,int displayW,int displayH){
        if(shotW<=0||shotH<=0||displayW<=0||displayH<=0||
            x<0||y<0||x>=shotW||y>=shotH)return null;
        double scaleX=displayW/(double)shotW,scaleY=displayH/(double)shotH;
        if(Math.abs(scaleX-scaleY)/Math.max(scaleX,scaleY)>0.06)return null;
        int realX=Math.round(x*displayW/(float)shotW);
        int realY=Math.round(y*displayH/(float)shotH);
        if(realX<0||realY<0||realX>=displayW||realY>=displayH)return null;
        return new int[]{realX,realY};
    }
}
