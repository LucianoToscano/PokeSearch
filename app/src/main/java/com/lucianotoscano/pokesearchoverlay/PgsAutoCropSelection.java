package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.View;

/** Recorte PGS: quadrado, horizontal (2:1) ou livre; prévia fora do dedo. */
final class PgsAutoCropSelection extends View {
    enum Shape {SQUARE,HORIZONTAL,FREE}
    private final int originalWidth,originalHeight;
    private final Runnable changed;
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF crop=new RectF();
    private int referencePx=32,dragging=0;
    private boolean selected=false;
    private Shape shape=Shape.SQUARE;
    private float prevX,prevY;
    private long lastPreviewAt=0L;
    PgsAutoCropSelection(Context c,int width,int height,Runnable notify){
        super(c);originalWidth=Math.max(1,width);originalHeight=Math.max(1,height);
        changed=notify;
        setContentDescription("Recorte de sprite: toque para selecionar, arraste a área, ajuste pela alça branca ou use a lupa");
    }
    private float clamp(float value,float min,float max){
        return Math.max(min,Math.min(max,value));
    }
    Shape shape(){return shape;}
    void setShape(Shape next){
        if(next==null)return;
        shape=next;
        if(selected)position(crop.centerX(),crop.centerY());
        notifyChanged(true);
    }
    void setReferencePx(int n){
        referencePx=Math.max(16,Math.min(92,n));
        if(selected)position(crop.centerX(),crop.centerY());
        notifyChanged(true);
    }
    boolean hasSelection(){return selected;}
    float centerRatioX(){return selected&&getWidth()>0?crop.centerX()/getWidth():.5f;}
    private float defaultSide(){
        return Math.max(12f,referencePx*getWidth()/740f);
    }
    private void position(float cx,float cy){
        float w=Math.max(12f,Math.min(getWidth(),defaultSide()));
        float h=shape==Shape.HORIZONTAL?w/2f:w;
        w=Math.min(w,getWidth());h=Math.min(h,getHeight());
        float left=clamp(cx-w/2,0,Math.max(0,getWidth()-w));
        float top=clamp(cy-h/2,0,Math.max(0,getHeight()-h));
        crop.set(left,top,left+w,top+h);selected=true;
    }
    Rect selectedBitmapRect(){
        if(!selected||getWidth()<=0||getHeight()<=0)return null;
        int l=Math.max(0,Math.min(originalWidth-1,
            Math.round(crop.left*originalWidth/getWidth())));
        int t=Math.max(0,Math.min(originalHeight-1,
            Math.round(crop.top*originalHeight/getHeight())));
        int r=Math.max(l+1,Math.min(originalWidth,
            Math.round(crop.right*originalWidth/getWidth())));
        int b=Math.max(t+1,Math.min(originalHeight,
            Math.round(crop.bottom*originalHeight/getHeight())));
        return new Rect(l,t,r,b);
    }
    private void notifyChanged(boolean force){
        invalidate();long now=SystemClock.uptimeMillis();
        if(changed!=null&&(force||now-lastPreviewAt>65L)){
            lastPreviewAt=now;changed.run();
        }
    }
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);
        if(!selected)return;
        paint.setStyle(Paint.Style.FILL);paint.setColor(0x9002060E);
        canvas.drawRect(0,0,getWidth(),crop.top,paint);
        canvas.drawRect(0,crop.bottom,getWidth(),getHeight(),paint);
        canvas.drawRect(0,crop.top,crop.left,crop.bottom,paint);
        canvas.drawRect(crop.right,crop.top,getWidth(),crop.bottom,paint);
        float density=getResources().getDisplayMetrics().density;
        paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(2*density);
        paint.setColor(Color.WHITE);canvas.drawRoundRect(crop,5*density,5*density,paint);
        paint.setStyle(Paint.Style.FILL);paint.setColor(0xFFFFFFFF);
        canvas.drawCircle(crop.right,crop.bottom,6*density,paint);
        paint.setColor(0xCC213547);canvas.drawCircle(crop.right,crop.bottom,3*density,paint);
    }
    @Override public boolean onTouchEvent(MotionEvent event){
        float x=clamp(event.getX(),0,getWidth());
        float y=clamp(event.getY(),0,getHeight());
        int action=event.getActionMasked();
        if(action==MotionEvent.ACTION_DOWN){
            float reach=28f*getResources().getDisplayMetrics().density;
            if(selected&&Math.abs(x-crop.right)<reach&&Math.abs(y-crop.bottom)<reach)
                dragging=2;
            else if(selected&&crop.contains(x,y))dragging=1;
            else{position(x,y);dragging=1;}
            prevX=x;prevY=y;notifyChanged(true);return true;
        }
        if(action==MotionEvent.ACTION_MOVE){
            if(dragging==1){
                crop.offset(x-prevX,y-prevY);
                if(crop.left<0)crop.offset(-crop.left,0);
                if(crop.top<0)crop.offset(0,-crop.top);
                if(crop.right>getWidth())crop.offset(getWidth()-crop.right,0);
                if(crop.bottom>getHeight())crop.offset(0,getHeight()-crop.bottom);
            }else if(dragging==2){
                float min=12f*getResources().getDisplayMetrics().density;
                float w=clamp(x-crop.left,min,getWidth()-crop.left);
                float h=clamp(y-crop.top,min,getHeight()-crop.top);
                if(shape==Shape.SQUARE){
                    float side=Math.min(w,Math.min(getWidth()-crop.left,getHeight()-crop.top));
                    w=side;h=side;
                }else if(shape==Shape.HORIZONTAL){
                    w=Math.min(w,2*(getHeight()-crop.top));h=w/2f;
                }
                crop.right=crop.left+w;crop.bottom=crop.top+h;
            }
            prevX=x;prevY=y;notifyChanged(false);return true;
        }
        if(action==MotionEvent.ACTION_UP){dragging=0;notifyChanged(true);return true;}
        if(action==MotionEvent.ACTION_CANCEL){dragging=0;return true;}
        return true;
    }
}
