package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import java.util.Arrays;

/**
 * LT332 — padronização na RENDERIZAÇÃO (não confundir com remaster do PNG).
 *
 * A imagem #42 continua intacta. O detector examina somente a área de cabelo
 * castanho e ignora Pokébola/ícones para estimar largura de cabeça. O corpo é
 * transformado UMA única vez, ao entrar no cache LRU do atlas 512.
 * - Movimentos sem cenografia: normalizar corpo por cabeça e pés.
 * - Poses com objetos: retocar somente a região da cabeça, sem redimensionar
 *   calendários, celulares, ícones ou objetos separados.
 * - Teleporte 52–60: opacidade/tamanho são efeitos intencionais e não mudam.
 * - #65–67: fantasias/Sombria não têm cabelo detectável comum; sem autoescala.
 * Nenhuma transformação pode produzir borda borrada (nearest-neighbor).
 */
final class EduSpriteGeometry512 {
    private static final int CELL=512, FACE_X=256, HAIR_TOP=41, FEET_Y=476;
    private static final int MIN_HAIR_PIXELS=900;
    private EduSpriteGeometry512(){}

    private static final class Hair {
        final float x;
        final int top,width;
        Hair(float center, int topPx, int span){x=center;top=topPx;width=span;}
    }

    private static boolean hairColor(int p){
        int a=(p>>>24)&255;
        if(a<180)return false;
        int r=(p>>>16)&255,g=(p>>>8)&255,b=p&255;
        return r>=27&&r<=150&&g>=12&&g<=112&&b<=110
            &&r*10>=g*11&&g*100>=b*78;
    }

    /** Connected components, not a bounding box of the entire PNG. */
    private static Hair detectHair(int[] pixel){
        byte[] valid=new byte[CELL*CELL],seen=new byte[CELL*CELL];
        for(int y=14;y<308;y++){
            int row=y*CELL;
            for(int x=100;x<412;x++){
                int q=row+x;
                if(hairColor(pixel[q]))valid[q]=1;
            }
        }
        int[] queue=new int[CELL*CELL];
        int winner=0,left=0,top=0,right=0;
        for(int y=14;y<308;y++){
            int row=y*CELL;
            for(int x=100;x<412;x++){
                int start=row+x;
                if(valid[start]==0||seen[start]!=0)continue;
                int head=0,tail=1,lo=x,hi=x,yo=y,count=0;
                queue[0]=start;seen[start]=1;
                while(head<tail){
                    int q=queue[head++],px=q%CELL,py=q/CELL;
                    count++;
                    if(px<lo)lo=px;
                    if(px>hi)hi=px;
                    if(py<yo)yo=py;
                    int near;
                    if(px>100&&(near=q-1)>=0&&valid[near]!=0&&seen[near]==0){
                        seen[near]=1;queue[tail++]=near;
                    }
                    if(px<411&&(near=q+1)<valid.length&&valid[near]!=0&&seen[near]==0){
                        seen[near]=1;queue[tail++]=near;
                    }
                    if(py>14&&(near=q-CELL)>=0&&valid[near]!=0&&seen[near]==0){
                        seen[near]=1;queue[tail++]=near;
                    }
                    if(py<307&&(near=q+CELL)<valid.length&&valid[near]!=0&&seen[near]==0){
                        seen[near]=1;queue[tail++]=near;
                    }
                }
                if(count>winner){winner=count;left=lo;top=yo;right=hi;}
            }
        }
        return winner<MIN_HAIR_PIXELS?null:new Hair((left+right)/2f,top,right-left+1);
    }

    private static int feetY(int[] pixels){
        for(int y=499;y>=320;y--){
            for(int x=130;x<380;x++){
                if((pixels[y*CELL+x]>>>24)>=190)return y;
            }
        }
        return FEET_Y;
    }

    private static boolean fullBody(int i){
        return (i>=0&&i<=3)||(i>=5&&i<=18)
            ||(i>=24&&i<=27)||(i>=32&&i<=35)
            ||i==63||i==64;
    }

    private static float bound(float n,float low,float high){
        return Math.max(low,Math.min(high,n));
    }

    static Bitmap normalize(Bitmap source,int index){
        if(source==null||source.getWidth()!=CELL||source.getHeight()!=CELL
            ||index==42||(index>=52&&index<=60)||index>=65)return source;

        final int[] pixels=new int[CELL*CELL];
        source.getPixels(pixels,0,CELL,0,0,CELL,CELL);
        final Hair head=detectHair(pixels);
        if(head==null)return source; // Shiny ou rosto estilizado: nunca deformar
        Paint paint=new Paint();
        paint.setFilterBitmap(false);
        paint.setAntiAlias(false);
        paint.setDither(false);

        // Cabeça lateral possui naturalmente projeção diferente da frontal.
        int side=(index>=24&&index<=27)||(index>=32&&index<=35)?200:213;
        if(index>=9&&index<=18)side=193; // movimento arrastado
        float sx=bound((float)side/head.width,0.86f,1.68f);
        Bitmap result=Bitmap.createBitmap(CELL,CELL,Bitmap.Config.ARGB_8888);
        Canvas canvas=new Canvas(result);
        if(fullBody(index)){
            int feet=feetY(pixels);
            boolean drag=index>=9&&index<=18;
            float sy=drag?bound(1.0f,0.95f,1.08f):
                bound((float)(FEET_Y-HAIR_TOP)/Math.max(100,feet-head.top),0.88f,1.35f);
            float anchorX=drag?head.x:FACE_X;
            float anchorY=drag?feet:FEET_Y;
            canvas.save();
            canvas.translate(anchorX-head.x*sx,anchorY-feet*sy);
            canvas.scale(sx,sy);
            if(index==1||index==2){
                // A Pokébola aérea mantém posição e pixels de sua faixa.
                canvas.clipRect(0,105,CELL,CELL);
            }
            canvas.drawBitmap(source,0,0,paint);
            canvas.restore();
            if(index==1||index==2){
                canvas.save();
                canvas.clipRect(0,0,CELL,105);
                canvas.drawBitmap(source,0,0,paint);
                canvas.restore();
            }
        }else{
            // Nas poses contextuais, preservar os acessórios no local original.
            // A máscara do rosto evita que calendário/celular seja esticado.
            sx=bound(sx,0.91f,1.22f);
            if(Math.abs(sx-1f)<0.025f){result.recycle();return source;}
            float cx=head.x,w=head.width,top=head.top;
            Path shape=new Path();
            shape.moveTo(cx-w*.60f,Math.max(0f,top-10f));
            shape.lineTo(cx+w*.60f,Math.max(0f,top-10f));
            shape.lineTo(cx+w*.71f,top+70f);
            shape.lineTo(cx+w*.71f,top+130f);
            shape.lineTo(cx+w*.46f,Math.min(510f,top+195f));
            shape.lineTo(cx-w*.49f,Math.min(510f,top+195f));
            shape.lineTo(cx-w*.71f,top+135f);
            shape.lineTo(cx-w*.71f,top+70f);
            shape.close();
            Bitmap actor=Bitmap.createBitmap(CELL,CELL,Bitmap.Config.ARGB_8888);
            Canvas actorCanvas=new Canvas(actor);
            actorCanvas.clipPath(shape);
            actorCanvas.drawBitmap(source,0,0,paint);

            canvas.save();
            canvas.clipOutPath(shape); // API 26+ (minSdk=26)
            canvas.drawBitmap(source,0,0,paint);
            canvas.restore();
            canvas.save();
            canvas.translate(cx*(1f-sx),0f);
            canvas.scale(sx,1f);
            canvas.drawBitmap(actor,0,0,paint);
            canvas.restore();
            actor.recycle();
        }
        return result;
    }
}
