package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.view.View;

/**
 * Linhas-guia sobrepostas à célula de 512px, sem alterar nenhum pixel da arte.
 * Mesmo sistema de coordenadas para #42 e para qualquer dos 68 quadros.
 * Inicialmente ocultas; ideais para captura de tela e vídeo de QA.
 */
final class EduSpriteGuideView extends View {
    private static final float CELL=512f;
    private final Paint line=new Paint();
    private final Paint text=new Paint();
    private boolean enabled;

    EduSpriteGuideView(Context ctx){
        super(ctx);
        setClickable(false);
        setFocusable(false);
        setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        line.setAntiAlias(false);
        line.setStrokeWidth(3f);
        line.setStyle(Paint.Style.STROKE);
        line.setPathEffect(new DashPathEffect(new float[]{12f,8f},0f));
        text.setAntiAlias(false);
        text.setTextSize(28f);
        text.setColor(Color.argb(215,250,250,250));
    }
    void setEnabledGuides(boolean enabled){
        this.enabled=enabled;
        setVisibility(enabled?VISIBLE:GONE);
        invalidate();
    }
    @Override protected void onDraw(Canvas c){
        super.onDraw(c);
        if(!enabled||getWidth()==0||getHeight()==0)return;
        c.save();
        c.scale(getWidth()/CELL,getHeight()/CELL);
        // Eixo do rosto, topo do cabelo, olhos/óculos, mãos e base dos pés.
        guide(c,Color.argb(190,45,225,211),256,0,256,512);
        guide(c,Color.argb(180,235,191,55),0,41,512,41);
        guide(c,Color.argb(180,45,225,211),0,185,512,185);
        guide(c,Color.argb(140,230,135,82),0,342,512,342);
        guide(c,Color.argb(210,255,219,76),0,476,512,476);
        // Cabeça padrão: largura 213px, altura aproximada até queixo.
        line.setPathEffect(null);line.setStrokeWidth(3f);
        line.setColor(Color.argb(160,85,204,250));
        c.drawRect(149.5f,41,362.5f,252,line);
        line.setPathEffect(new DashPathEffect(new float[]{12f,8f},0f));
        if(getWidth()>=125){
            c.drawText("olhos",8,179,text);
            c.drawText("mãos",8,336,text);
            c.drawText("pés",8,470,text);
        }
        c.restore();
    }
    private void guide(Canvas c,int color,float x1,float y1,float x2,float y2){
        line.setColor(color);c.drawLine(x1,y1,x2,y2,line);
    }
}
