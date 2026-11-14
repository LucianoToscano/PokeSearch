package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.view.MotionEvent;
import android.view.View;

/**
 * Seletor local do ícone 2D, sem salvar no toque: toque para posicionar,
 * arraste para mover e ajuste com o canto inferior direito. Confirmar/Cancelar
 * são responsabilidade do serviço de Acessibilidade.
 */
final class PgsAutoCropSelection extends View {
    private final int originalWidth,originalHeight;
    private final Runnable changed;
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF crop=new RectF();
    private int referencePx=32;
    private boolean selected=false;
    private int dragging=0; // 1=mover, 2=redimensionar
    private float prevX,prevY;

    PgsAutoCropSelection(Context context,int width,int height,Runnable onChanged){
        super(context);
        originalWidth=Math.max(1,width);
        originalHeight=Math.max(1,height);
        changed=onChanged;
        setContentDescription("Seleção de sprite: toque no ícone, mova ou arraste o canto para ajustar");
    }
    private float clamp(float value,float lo,float hi){
        return Math.max(lo,Math.min(hi,value));
    }
    void setReferencePx(int value){
        referencePx=Math.max(16,Math.min(92,value));
        if(selected && getWidth()>0 && getHeight()>0)position(crop.centerX(),crop.centerY());
        invalidate();
        if(changed!=null)changed.run();
    }
    boolean hasSelection(){return selected;}
    private float defaultSide(){
        return Math.max(16f,referencePx*originalWidth/740f)*getWidth()/originalWidth;
    }
    private void position(float cx,float cy){
        float side=Math.max(12f,Math.min(Math.min(getWidth(),getHeight()),defaultSide()));
        float left=clamp(cx-side/2f,0,Math.max(0,getWidth()-side));
        float top=clamp(cy-side/2f,0,Math.max(0,getHeight()-side));
        crop.set(left,top,left+side,top+side);
        selected=true;
    }
    Rect selectedBitmapRect(){
        if(!selected||getWidth()<=0||getHeight()<=0)return null;
        int side=Math.max(16,Math.min(92,referencePx));
        int w=Math.max(16,Math.round(side*originalWidth/740f));
        w=Math.min(w,Math.min(originalWidth,originalHeight));
        int cx=Math.round(crop.centerX()*originalWidth/getWidth());
        int cy=Math.round(crop.centerY()*originalHeight/getHeight());
        int left=Math.max(0,Math.min(originalWidth-w,cx-w/2));
        int top=Math.max(0,Math.min(originalHeight-w,cy-w/2));
        return new Rect(left,top,left+w,top+w);
    }
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);
        if(!selected)return;
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(0x8C02060E);
        canvas.drawRect(0,0,getWidth(),crop.top,paint);
        canvas.drawRect(0,crop.bottom,getWidth(),getHeight(),paint);
        canvas.drawRect(0,crop.top,crop.left,crop.bottom,paint);
        canvas.drawRect(crop.right,crop.top,getWidth(),crop.bottom,paint);
        paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(3f*getResources().getDisplayMetrics().density);
        paint.setColor(Color.WHITE);
        canvas.drawRoundRect(crop,4f,4f,paint);
        paint.setStrokeWidth(5f*getResources().getDisplayMetrics().density);
        float handle=11f*getResources().getDisplayMetrics().density;
        canvas.drawLine(crop.right-handle,crop.bottom,crop.right,crop.bottom,paint);
        canvas.drawLine(crop.right,crop.bottom-handle,crop.right,crop.bottom,paint);
        paint.setStyle(Paint.Style.FILL);
    }
    @Override public boolean onTouchEvent(MotionEvent e){
        float x=clamp(e.getX(),0,getWidth());
        float y=clamp(e.getY(),0,getHeight());
        int action=e.getActionMasked();
        if(action==MotionEvent.ACTION_DOWN){
            float reach=28f*getResources().getDisplayMetrics().density;
            if(selected && Math.abs(x-crop.right)<reach && Math.abs(y-crop.bottom)<reach){
                dragging=2;
            }else if(selected&&crop.contains(x,y)){
                dragging=1;
            }else{
                position(x,y);dragging=1;
            }
            prevX=x;prevY=y;invalidate();return true;
        }
        if(action==MotionEvent.ACTION_MOVE){
            if(dragging==1){
                float dx=x-prevX,dy=y-prevY;
                crop.offset(dx,dy);
                if(crop.left<0)crop.offset(-crop.left,0);
                if(crop.top<0)crop.offset(0,-crop.top);
                if(crop.right>getWidth())crop.offset(getWidth()-crop.right,0);
                if(crop.bottom>getHeight())crop.offset(0,getHeight()-crop.bottom);
            }else if(dragging==2){
                float edge=Math.max(12f*getResources().getDisplayMetrics().density,
                    Math.max(x-crop.left,y-crop.top));
                edge=Math.min(edge,Math.min(getWidth()-crop.left,getHeight()-crop.top));
                crop.right=crop.left+edge;crop.bottom=crop.top+edge;
                referencePx=Math.max(16,Math.min(92,
                    Math.round(edge*740f/Math.max(1,getWidth()))));
            }
            prevX=x;prevY=y;invalidate();return true;
        }
        if(action==MotionEvent.ACTION_UP){
            dragging=0;invalidate();
            if(changed!=null)changed.run();
            return true;
        }
        if(action==MotionEvent.ACTION_CANCEL){dragging=0;return true;}
        return true;
    }
}
