package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;

/**
 * LT316: retoque individual das cinco poses de ação cujo efeito/objeto
 * impede ampliar a célula inteira. A transformação desloca apenas o Edu,
 * mantendo ícones, calendário, celular e indicadores no tamanho original.
 *
 * As outras 63 poses permanecem como fornecidas pelo atlas QA. As nove
 * posições de teleporte são intencionalmente variáveis.
 */
final class EduSpriteManualRetouch {
    private static final int CELL=128;
    private EduSpriteManualRetouch(){}

    private static int[][] polygon(int index){
        switch(index){
            case 20: return new int[][]{
                {22,15},{70,15},{78,23},{79,44},{90,63},
                {91,84},{85,117},{26,124},{16,100},{15,55}
            };
            case 28: return new int[][]{
                {26,23},{76,19},{85,36},{89,55},{87,83},
                {85,122},{27,124},{22,84},{21,49}
            };
            case 30: return new int[][]{
                {25,20},{78,19},{89,35},{91,58},{90,86},
                {87,124},{28,124},{22,86},{21,48}
            };
            case 36: return new int[][]{
                {23,19},{69,18},{79,35},{81,58},{83,89},
                {79,124},{25,124},{19,86},{18,45}
            };
            case 49: return new int[][]{
                {25,18},{78,16},{88,34},{93,57},{92,81},
                {89,108},{82,124},{25,124},{18,86},{17,48}
            };
            default: return null;
        }
    }

    // Áreas de acessórios não podem ser transformadas com o corpo.
    private static int[][] propRects(int index){
        switch(index){
            case 20: return new int[][]{{83,73,107,108}};
            case 28: return new int[][]{{91,59,122,84}};
            case 30: return new int[][]{{96,68,119,99}};
            case 36: return new int[][]{{81,9,112,46},{84,54,122,112}};
            case 49: return new int[][]{{93,10,128,54},{93,54,128,119}};
            default: return new int[0][];
        }
    }
    private static float scale(int index){
        switch(index){
            case 20: return 1.115f;
            case 28: return 1.155f;
            case 30: return 1.135f;
            case 36: return 1.165f;
            case 49: return 1.090f;
            default: return 1f;
        }
    }
    private static float headCenter(int index){
        switch(index){
            case 20: return 56.97f;
            case 28: return 58.60f;
            case 30: return 61.66f;
            case 36: return 55.66f;
            case 49: return 55.68f;
            default: return 64f;
        }
    }
    private static int feetY(int index){
        switch(index){
            case 20: return 117;
            case 28: case 30: return 118;
            case 36: return 119;
            case 49: return 116;
            default: return 119;
        }
    }
    static boolean needsRetouch(int i){
        return i==20||i==28||i==30||i==36||i==49;
    }

    static Bitmap apply(Bitmap original,int index){
        if(original==null||!needsRetouch(index)||original.getWidth()!=CELL||
            original.getHeight()!=CELL)return original;

        Paint paint=new Paint();
        paint.setFilterBitmap(false);
        paint.setAntiAlias(false);
        paint.setDither(false);

        int[][] vertices=polygon(index);
        Path path=new Path();
        path.moveTo(vertices[0][0],vertices[0][1]);
        for(int j=1;j<vertices.length;j++)
            path.lineTo(vertices[j][0],vertices[j][1]);
        path.close();

        // Personagem isolado do objeto: máscara integral em pixels 128x128.
        Bitmap actor=Bitmap.createBitmap(CELL,CELL,Bitmap.Config.ARGB_8888);
        Canvas characterCanvas=new Canvas(actor);
        characterCanvas.save();
        characterCanvas.clipPath(path);
        characterCanvas.drawBitmap(original,0f,0f,paint);
        characterCanvas.restore();

        Bitmap output=Bitmap.createBitmap(CELL,CELL,Bitmap.Config.ARGB_8888);
        Canvas canvas=new Canvas(output);
        canvas.save();
        canvas.clipOutPath(path); // API 26+, minSdk 26
        canvas.drawBitmap(original,0f,0f,paint);
        canvas.restore();

        float s=scale(index);
        float dx=Math.round(64f-headCenter(index)*s);
        float dy=Math.round(119f-feetY(index)*s);
        canvas.save();
        canvas.translate(dx,dy);
        canvas.scale(s,s);
        canvas.drawBitmap(actor,0f,0f,paint);
        canvas.restore();

        // Restaurar os acessórios da arte original sem mudar seus detalhes.
        for(int[] r:propRects(index)){
            Rect area=new Rect(r[0],r[1],r[2],r[3]);
            canvas.drawBitmap(original,area,area,paint);
        }
        actor.recycle();
        original.recycle();
        return output;
    }
}
