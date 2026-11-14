package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.RectF;

/**
 * LT335 — duas ações, um único corpo: #42 canônica para cabeça, óculos,
 * tronco, pernas e sapatos. Desenha apenas os braços/objetos da ação.
 *
 * A LT334 recortava o braço com os limites rígidos gestureRight/armEraseRight
 * e deixava uma ruptura. Os novos gestos usam polígonos fechados, ombros
 * contínuos e uma camada do objeto independente do rosto. Sem upscale,
 * filtro bilinear, antialias ou mudança de escala por quadro.
 *
 * #00–03 = Pokébola (quatro quadros); #63–64 = celular (dois quadros).
 * Outros 62 índices não passam por esta composição.
 */
final class EduSpritePoseComposer {
    private static final int CELL=512;
    private static final int OUTLINE=Color.rgb(24,15,21);
    private static final int RED=Color.rgb(226,44,53);
    private static final int RED_SHADOW=Color.rgb(185,21,31);
    private static final int RED_LIGHT=Color.rgb(252,80,69);
    private static final int SKIN=Color.rgb(255,176,88);
    private static final int SKIN_SHADOW=Color.rgb(223,128,70);
    private static final int YELLOW=Color.rgb(245,206,46);
    private static final int WHITE=Color.rgb(245,247,253);
    private static final int NAVY=Color.rgb(27,37,62);
    private static final int BLUE=Color.rgb(102,161,244);
    private static final int BALL_RED=Color.rgb(221,39,53);

    private EduSpritePoseComposer(){}

    static boolean supports(int index){
        return (index>=0&&index<=3)||index==63||index==64;
    }

    static Bitmap compose(Bitmap canonical, int index){
        if(canonical==null||!supports(index)||
           canonical.getWidth()!=CELL||canonical.getHeight()!=CELL)return null;
        // A #42 jamais é alterada: trabalhar somente numa cópia.
        Bitmap result=canonical.copy(Bitmap.Config.ARGB_8888,true);
        if(result==null)return null;
        Canvas canvas=new Canvas(result);
        Paint p=new Paint();
        p.setAntiAlias(false);
        p.setDither(false);
        p.setFilterBitmap(false);
        p.setStrokeCap(Paint.Cap.SQUARE);
        p.setStrokeJoin(Paint.Join.MITER);
        if(index<=3)drawPokeball(canvas,p,index);
        else drawPhone(canvas,p,index);
        return result;
    }

    private static void drawPokeball(Canvas c,Paint p,int frame){
        // Retirar somente o braço neutro abaixo do ombro; o tronco fica.
        clear(c,p,new int[][]{{124,272},{193,268},{184,402},{124,402}});
        if(frame==0||frame==3){
            shape(c,p,new int[][]{{184,276},{166,279},{144,301},
                {125,316},{123,339},{148,348},{176,339},{200,314}},RED,8);
            line(c,p,RED_LIGHT,7,158,296,146,314,136,328);
            oval(c,p,105,318,142,347,SKIN,OUTLINE,6);
            line(c,p,SKIN_SHADOW,4,115,329,126,335);
        }else{
            shape(c,p,new int[][]{{184,277},{160,284},{137,301},
                {118,292},{110,265},{127,251},{149,269},
                {177,301},{201,308}},RED,8);
            line(c,p,RED_LIGHT,7,163,291,143,288,125,266);
            oval(c,p,104,242,137,271,SKIN,OUTLINE,6);
            line(c,p,SKIN_SHADOW,4,114,253,125,259);
        }
        int y=frame==0?311:frame==1?206:frame==2?119:304;
        // A Pokébola é independente: pode subir sem encolher o Edu.
        oval(c,p,105,y,136,y+31,WHITE,OUTLINE,5);
        p.setStyle(Paint.Style.FILL);p.setColor(BALL_RED);
        c.drawArc(new RectF(107,y+2,134,y+28),180,180,true,p);
        line(c,p,OUTLINE,4,108,y+16,133,y+16);
        oval(c,p,117,y+12,124,y+19,WHITE,OUTLINE,2);
    }

    private static void drawPhone(Canvas c,Paint p,int frame){
        // Em vez de copiar braços/rosto menores de #63–64, conserva a #42
        // e reconstrói apenas duas mangas, mãos e aparelho conectados.
        clear(c,p,new int[][]{{125,273},{190,268},{184,402},{119,402}});
        clear(c,p,new int[][]{{322,270},{385,270},{385,402},{331,402}});
        int dx=frame==63?0:8; // deslocamento pequeno, não escala do personagem
        shape(c,p,new int[][]{{182,278},{159,282},{145,310},{152,345},
            {193,371},{224+dx,363},{225+dx,333},{193,315}},RED,8);
        shape(c,p,new int[][]{{328,278},{350,284},{367,314},{351,345},
            {313+dx,366},{290+dx,361},{285+dx,330},{318,310}},RED,8);
        line(c,p,RED_LIGHT,7,153,308,167,329,207+dx,348);
        line(c,p,RED_SHADOW,9,354,300,344,325,304+dx,350);
        shape(c,p,new int[][]{{206+dx,338},{230+dx,335},{243+dx,347},
            {242+dx,370},{224+dx,380},{208+dx,369}},SKIN,6);
        shape(c,p,new int[][]{{286+dx,339},{300+dx,338},{312+dx,353},
            {308+dx,374},{289+dx,376},{277+dx,361}},SKIN,6);
        line(c,p,SKIN_SHADOW,5,214+dx,365,234+dx,369);
        // Contorno e tela do celular com detalhes legíveis na escala P/M/G.
        shape(c,p,new int[][]{{229+dx,306},{290+dx,306},
            {292+dx,373},{227+dx,373}},OUTLINE,5);
        rectangle(c,p,236+dx,312,283+dx,366,NAVY);
        rectangle(c,p,241+dx,314,248+dx,319,Color.rgb(75,82,103));
        oval(c,p,250+dx,326,268+dx,344,WHITE,OUTLINE,3);
        p.setStyle(Paint.Style.FILL);p.setColor(BALL_RED);
        c.drawArc(new RectF(251+dx,326,267+dx,343),180,180,true,p);
        line(c,p,OUTLINE,3,254+dx,335,267+dx,335);
        oval(c,p,258+dx,332,263+dx,337,WHITE,OUTLINE,1);
        line(c,p,BLUE,4,252+dx,344,268+dx,360);
        line(c,p,WHITE,4,269+dx,344,251+dx,359);
        // Marcas pequenas de atenção fora da cabeça.
        shapeNoOutline(c,p,new int[][]{{363,99},{371,102},{366,117}},YELLOW);
        shapeNoOutline(c,p,new int[][]{{375,115},{383,118},{378,133}},YELLOW);
    }

    private static void clear(Canvas c,Paint p,int[][] points){
        p.setStyle(Paint.Style.FILL);p.setColor(Color.TRANSPARENT);
        p.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.CLEAR));
        c.drawPath(path(points),p);
        p.setXfermode(null);
    }
    private static void shapeNoOutline(Canvas c,Paint p,int[][] points,int color){
        p.setStyle(Paint.Style.FILL);p.setColor(color);
        c.drawPath(path(points),p);
    }
    private static void shape(Canvas c,Paint p,int[][] points,int color,int width){
        Path path=path(points);
        p.setStyle(Paint.Style.FILL);p.setColor(color);c.drawPath(path,p);
        p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(width);
        p.setColor(OUTLINE);c.drawPath(path,p);
        p.setStyle(Paint.Style.FILL);
    }
    private static Path path(int[][] pts){
        Path path=new Path();
        path.moveTo(pts[0][0],pts[0][1]);
        for(int i=1;i<pts.length;i++)path.lineTo(pts[i][0],pts[i][1]);
        path.close();return path;
    }
    private static void oval(Canvas c,Paint p,int left,int top,int right,
                             int bottom,int fill,int border,int width){
        RectF r=new RectF(left,top,right,bottom);
        p.setStyle(Paint.Style.FILL);p.setColor(fill);c.drawOval(r,p);
        p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(width);
        p.setColor(border);c.drawOval(r,p);
        p.setStyle(Paint.Style.FILL);
    }
    private static void rectangle(Canvas c,Paint p,int l,int t,int r,int b,int color){
        p.setStyle(Paint.Style.FILL);p.setColor(color);c.drawRect(l,t,r,b,p);
    }
    private static void line(Canvas c,Paint p,int color,int width,int... xy){
        p.setColor(color);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(width);
        for(int j=2;j<xy.length;j+=2)c.drawLine(xy[j-2],xy[j-1],xy[j],xy[j+1],p);
        p.setStyle(Paint.Style.FILL);
    }
}
