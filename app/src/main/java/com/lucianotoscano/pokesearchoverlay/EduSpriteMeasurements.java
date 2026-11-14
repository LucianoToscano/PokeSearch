package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import java.util.Locale;

/**
 * Indicadores VISUAIS de QA (não um veredito anatômico):
 * largura de cabelo/cabeça, óculos, mãos, calçados e altura aparente.
 * As amostras são limitadas a regiões do corpo da #42 para evitar que
 * Pokébola, calendários e efeitos fora do corpo dominem a medição.
 */
final class EduSpriteMeasurements {
    private static final int CELL=512;
    private EduSpriteMeasurements(){}
    static String compare(Drawable standard,Drawable candidate){
        if(!(standard instanceof BitmapDrawable)||
           !(candidate instanceof BitmapDrawable))return "Sem medição";
        Bitmap a=((BitmapDrawable)standard).getBitmap();
        Bitmap b=((BitmapDrawable)candidate).getBitmap();
        if(a==null||b==null||a.getWidth()!=CELL||a.getHeight()!=CELL||
           b.getWidth()!=CELL||b.getHeight()!=CELL)return "Sem medição";
        Snapshot ref=measure(a),test=measure(b);
        return "Cabeça "+delta(test.head,ref.head)+
               " · Óculos "+delta(test.glasses,ref.glasses)+
               " · Mãos "+delta(test.hands,ref.hands)+
               "\nPés "+delta(test.feet,ref.feet)+
               " · Altura "+delta(test.height,ref.height);
    }
    private static String delta(int value,int reference){
        if(reference<8||value<8)return "—";
        float percent=(value*100f/reference)-100f;
        return String.format(Locale.ROOT,"%+.0f%%",percent);
    }
    private static final class Snapshot{
        int head,glasses,hands,feet,height;
    }
    private static Snapshot measure(Bitmap img){
        int[] pixels=new int[CELL*CELL];
        img.getPixels(pixels,0,CELL,0,0,CELL,CELL);
        Span hair=scan(pixels,130,380,20,220,0);
        Span glasses=scan(pixels,135,378,145,244,1);
        Span hands=scan(pixels,125,382,265,415,2);
        Span feet=scan(pixels,125,385,417,500,3);
        Snapshot v=new Snapshot();
        v.head=hair.width();
        v.glasses=glasses.width();
        v.hands=hands.width();
        v.feet=feet.width();
        v.height=hair.valid()&&feet.valid()?
            feet.maxY-hair.minY+1:0;
        return v;
    }
    private static final class Span{
        int minX=999,minY=999,maxX=-1,maxY=-1,count=0;
        void add(int x,int y){
            if(x<minX)minX=x;if(y<minY)minY=y;
            if(x>maxX)maxX=x;if(y>maxY)maxY=y;
            count++;
        }
        boolean valid(){return count>25&&maxX>=minX&&maxY>=minY;}
        int width(){return valid()?maxX-minX+1:0;}
    }
    // modo 0: cabelo castanho; 1: lentes claras; 2: pele da mão;
    // modo 3: tecido vermelho/branco dos tênis.
    private static Span scan(int[] px,int x0,int x1,int y0,int y1,int mode){
        Span span=new Span();
        for(int y=y0;y<y1;y++){
            int row=y*CELL;
            for(int x=x0;x<x1;x++){
                int pixel=px[row+x],alpha=(pixel>>>24)&255;
                if(alpha<160)continue;
                int red=(pixel>>>16)&255,green=(pixel>>>8)&255,blue=pixel&255;
                boolean yes;
                switch(mode){
                    case 0:yes=red>=30&&red<=165&&green>=12&&green<=120&&
                        blue<=120&&red*100>green*108&&
                        green*100>blue*65;break;
                    case 1:yes=red>175&&green>175&&blue>175;break;
                    case 2:yes=red>165&&green>75&&green<210&&blue<165&&
                        red*100>green*110&&green*100>blue*120;break;
                    default:yes=(red>190&&green<130&&blue<130)||
                        (red>190&&green>185&&blue>175);
                }
                if(yes)span.add(x,y);
            }
        }
        return span;
    }
}
