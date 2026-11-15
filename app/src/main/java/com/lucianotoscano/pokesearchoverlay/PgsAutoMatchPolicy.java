package com.lucianotoscano.pokesearchoverlay;

/** LT356: deduplicação por sobreposição real, não por distância fixa.
 * Ícones vizinhos de espécies diferentes nunca devem ser apagados pelo NMS.
 */
final class PgsAutoMatchPolicy {
    private PgsAutoMatchPolicy(){}
    static boolean sameSlot(int ax,int ay,int aw,int ah,int bx,int by,int bw,int bh){
        if(aw<=0||ah<=0||bw<=0||bh<=0)return false;
        int overlapW=Math.max(0,Math.min(ax+aw,bx+bw)-Math.max(ax,bx));
        int overlapH=Math.max(0,Math.min(ay+ah,by+bh)-Math.max(ay,by));
        long small=Math.min((long)aw*ah,(long)bw*bh);
        return small>0 && ((long)overlapW*overlapH)>=small*.60;
    }
    /** Formas/variantes nativas distintas da mesma espécie nunca são desempates automáticos. */
    static boolean ambiguousNativeVariants(
        boolean nativeA,String formA,String variantA,
        boolean nativeB,String formB,String variantB,float scoreA,float scoreB){
        if(!nativeA||!nativeB||formA==null||variantA==null||
            formB==null||variantB==null||!Float.isFinite(scoreA)||!Float.isFinite(scoreB))
            return false;
        return (!formA.equals(formB)||!variantA.equals(variantB))&&
            Math.abs(scoreA-scoreB)<=.035f;
    }
    static boolean ambiguousDifferentSpecies(
        String speciesA,String speciesB,float scoreA,float scoreB){
        return speciesA!=null&&speciesB!=null&&!speciesA.equals(speciesB)&&
            Float.isFinite(scoreA)&&Float.isFinite(scoreB)&&
            Math.abs(scoreA-scoreB)<=.035f;
    }
}
