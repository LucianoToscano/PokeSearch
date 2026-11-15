package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import java.util.ArrayList;
import java.util.List;

/**
 * LT367 — prévia transparente e não interativa: não bloqueia toques do jogo
 * e não envia nenhum GestureDescription. Posições são apenas pixels locais.
 */
final class PgsSequenceMarkers {
    private final Context context;
    private final WindowManager wm;
    private View surface;
    private List<PgsSequencePolicy.Step> steps=new ArrayList<>();

    PgsSequenceMarkers(Context c,WindowManager manager){context=c;wm=manager;}
    private float dp(float v){return v*context.getResources().getDisplayMetrics().density;}
    boolean visible(){return surface!=null;}
    void close(){
        if(surface!=null){
            try{wm.removeViewImmediate(surface);}catch(Exception ignored){}
            surface=null;
        }
    }
    void show(List<PgsSequencePolicy.Step> items){
        close();
        if(items==null||items.isEmpty())return;
        steps=new ArrayList<>(items);
        surface=new View(context){
            final Paint pen=new Paint(Paint.ANTI_ALIAS_FLAG);
            private void node(Canvas canvas,float x,float y,int number,int color,
                String suffix){
                float r=dp(19f);
                pen.setStyle(Paint.Style.FILL);
                pen.setColor(0x24000000);canvas.drawCircle(x,y,r+dp(2),pen);
                pen.setColor(0xAA11171C);canvas.drawCircle(x,y,r-dp(2),pen);
                pen.setStyle(Paint.Style.STROKE);
                pen.setStrokeWidth(dp(2.6f));pen.setColor(color);
                canvas.drawCircle(x,y,r,pen);
                pen.setStyle(Paint.Style.FILL);
                pen.setColor(color);pen.setTypeface(Typeface.DEFAULT_BOLD);
                pen.setTextAlign(Paint.Align.CENTER);pen.setTextSize(dp(18));
                canvas.drawText(number+suffix,x,y+dp(6),pen);
            }
            @Override protected void onDraw(Canvas canvas){
                super.onDraw(canvas);
                float w=getWidth(),h=getHeight();
                if(w<=0||h<=0)return;
                float prevX=0,prevY=0;boolean previous=false;
                int informational=0;
                for(int i=0;i<steps.size();i++){
                    PgsSequencePolicy.Step s=steps.get(i);
                    if(s.type==PgsSequencePolicy.Type.SPRITE||
                        s.type==PgsSequencePolicy.Type.WAIT){informational++;continue;}
                    float x=s.x*w,y=s.y*h;
                    if(previous){
                        pen.setStyle(Paint.Style.STROKE);
                        pen.setColor(0x88FFFFFF);
                        pen.setStrokeWidth(dp(1.2f));
                        pen.setPathEffect(new android.graphics.DashPathEffect(
                            new float[]{dp(6),dp(5)},0));
                        canvas.drawLine(prevX,prevY,x,y,pen);
                        pen.setPathEffect(null);
                    }
                    int color=s.type==PgsSequencePolicy.Type.SWIPE?
                        0xFF5DF49B:0xFF06D6F7;
                    if(s.type==PgsSequencePolicy.Type.SWIPE){
                        float ex=s.endX*w,ey=s.endY*h;
                        pen.setColor(0xAA5DF49B);
                        pen.setStyle(Paint.Style.STROKE);
                        pen.setStrokeWidth(dp(2));
                        canvas.drawLine(x,y,ex,ey,pen);
                        // Destino discreto, nunca confundir com novo ponto.
                        pen.setStyle(Paint.Style.FILL);
                        pen.setColor(0xFF5DF49B);
                        canvas.drawCircle(ex,ey,dp(5),pen);
                        prevX=ex;prevY=ey;
                    }else{prevX=x;prevY=y;}
                    previous=true;
                    node(canvas,x,y,i+1,color,"");
                }
                if(informational>0){
                    pen.setTextSize(dp(10));pen.setTypeface(Typeface.DEFAULT);
                    pen.setStyle(Paint.Style.FILL);pen.setColor(0xCCFFFFFF);
                    pen.setTextAlign(Paint.Align.LEFT);
                    canvas.drawText(informational+
                        " etapa(s) sem posição: espera / reconhecimento de sprite",
                        dp(10),dp(26),pen);
                }
            }
        };
        surface.setContentDescription("Prévia dos pontos numerados da sequência; "+
            "não executa ações.");
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(
            -1,-1,WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE|
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.LEFT|Gravity.TOP;
        try{wm.addView(surface,lp);}
        catch(RuntimeException e){surface=null;}
    }
}
