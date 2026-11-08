package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;

/**
 * LT314: alinhamento óptico de todas as sprites do Edu sem interpolação.
 * O eixo de referência é o rosto do personagem; a base dos pés é y=119.
 * Os efeitos de desintegração do teleporte preservam sua geometria intencional.
 *
 * Não muda a dimensão da célula (128x128) nem o tamanho escolhido P/M/G.
 */
public final class EduSpriteGeometry {
    static final int CELL=128;
    static final int FACE_ANCHOR_X=64;
    static final int FEET_ANCHOR_Y=119;
    static final int BODY_REFERENCE_HEIGHT=112;
    private EduSpriteGeometry(){}

    private static float clamp(float n,float lo,float hi){
        return Math.max(lo,Math.min(hi,n));
    }
    /**
     * Cada quadro é examinado uma única vez e guardado em cache em
     * EduSpriteAtlas. Não executar este processamento a cada tick.
     */
    public static Bitmap stabilize(Bitmap original,int index,boolean consistent){
        if(original==null)return null;
        // As nove poses de teleporte contêm transformação e transparência
        // proposital; esticá-las faria o Edu "crescer" durante o desaparecimento.
        if(index>=52&&index<=60)return original;
        if(original.getWidth()!=CELL||original.getHeight()!=CELL)return original;
        int[] pixels=new int[CELL*CELL];
        original.getPixels(pixels,0,CELL,0,0,CELL,CELL);
        int xMin=CELL,xMax=-1,yMin=CELL,yMax=-1;
        float faceX=0f;
        int faceCount=0;
        for(int y=0;y<CELL;y++){
            for(int x=0;x<CELL;x++){
                int pixel=pixels[y*CELL+x];
                int alpha=(pixel>>>24)&255;
                if(alpha<190)continue;
                if(x<xMin)xMin=x;
                if(x>xMax)xMax=x;
                if(y<yMin)yMin=y;
                if(y>yMax)yMax=y;

                // Tom de pele do rosto, excluindo olhos, óculos, roupa, arma
                // de Mewtwo, aura, brilhos e Pokébola. O rosto é uma âncora
                // mais estável do que o retângulo ocupado pela animação.
                int red=(pixel>>>16)&255;
                int green=(pixel>>>8)&255;
                int blue=pixel&255;
                boolean skin=red>=90&&green>=40&&
                    red*100>green*118&&green*100>blue*108;
                if(skin&&y>=14&&y<=76&&x>=20&&x<=108){
                    faceX+=x;
                    faceCount++;
                }
            }
        }
        if(xMax<0||yMax<0)return original;
        // Sem pixels de rosto suficientes (efeitos/rede de captura), usar
        // o centro geométrico, mas limitar o deslocamento para não cortar FX.
        float personX=faceCount>=24?faceX/faceCount:
            (xMin+xMax)*0.5f;
        float height=yMax-yMin+1f;
        float scale=1f;
        if(!consistent){
            float ideal=BODY_REFERENCE_HEIGHT/height;
            if(index<=3)scale=clamp(ideal,1f,1.36f);
            else if(index>=9&&index<=18)scale=clamp(ideal,0.98f,1.16f);
            else scale=clamp(ideal,0.98f,1.06f);
        }
        float dx=FACE_ANCHOR_X-personX*scale;
        float minDx=1f-xMin*scale;
        float maxDx=126f-xMax*scale;
        if(minDx<=maxDx)dx=clamp(dx,minDx,maxDx);
        else dx=(minDx+maxDx)*0.5f;
        float dy=FEET_ANCHOR_Y-yMax*scale;

        // Evitar jitter de subpixel em sprites pixeladas.
        dx=Math.round(dx);
        dy=Math.round(dy);
        scale=Math.round(scale*128f)/128f;
        if(Math.abs(dx)<0.1f&&Math.abs(dy)<0.1f&&
            Math.abs(scale-1f)<0.001f)return original;

        Bitmap result=Bitmap.createBitmap(CELL,CELL,Bitmap.Config.ARGB_8888);
        Canvas canvas=new Canvas(result);
        Paint pixelPaint=new Paint();
        pixelPaint.setFilterBitmap(false);
        pixelPaint.setAntiAlias(false);
        pixelPaint.setDither(false);
        canvas.translate(dx,dy);
        canvas.scale(scale,scale);
        canvas.drawBitmap(original,0,0,pixelPaint);
        original.recycle();
        return result;
    }
}
