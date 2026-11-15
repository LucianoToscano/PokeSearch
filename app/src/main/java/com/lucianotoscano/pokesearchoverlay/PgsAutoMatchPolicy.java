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
    static boolean ambiguousDifferentSpecies(
        String speciesA,String speciesB,float scoreA,float scoreB){
        return speciesA!=null&&speciesB!=null&&!speciesA.equals(speciesB)&&
            Float.isFinite(scoreA)&&Float.isFinite(scoreB)&&
            Math.abs(scoreA-scoreB)<=.035f;
    }
}
