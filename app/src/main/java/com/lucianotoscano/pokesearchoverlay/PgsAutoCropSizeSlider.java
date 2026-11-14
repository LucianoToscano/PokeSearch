package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.view.accessibility.AccessibilityNodeInfo;

/** Barra lateral limpa para ajustar continuamente o recorte. */
final class PgsAutoCropSizeSlider extends View {
    interface Listener { void onSizeChanged(int px); }
    private static final int MIN=16,MAX=92;
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Listener listener;
    private int value;
    private boolean dragging;
    PgsAutoCropSizeSlider(Context ctx,int initial,Listener change){
        super(ctx);listener=change;
        value=Math.max(MIN,Math.min(MAX,initial));
        setContentDescription("Tamanho do recorte");
        setFocusable(true);
        setLayerType(View.LAYER_TYPE_SOFTWARE,null);
    }
    private float dp(float v){return v*getResources().getDisplayMetrics().density;}
    private float top(){return dp(22);}
    private float bottom(){return Math.max(top()+1,getHeight()-dp(22));}
    private float knobY(){return bottom()-(value-MIN)*(bottom()-top())/(MAX-MIN);}
    private void change(int next){
        next=Math.max(MIN,Math.min(MAX,next));
        if(next==value)return;
        value=next;
        setContentDescription("Tamanho do recorte: "+value+" pixels de referência");
        if(listener!=null)listener.onSizeChanged(value);
        invalidate();
    }
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);
        float x=getWidth()*.5f;
        paint.clearShadowLayer();
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeWidth(dp(3));paint.setColor(0xE6FFFFFF);
        canvas.drawLine(x,top(),x,bottom(),paint);
        paint.setStyle(Paint.Style.FILL);paint.setColor(Color.WHITE);
        paint.setShadowLayer(dp(dragging?7:3),0,dp(1),0x88000000);
        canvas.drawCircle(x,knobY(),dp(dragging?14:12),paint);
        paint.clearShadowLayer();
    }
    private void fromY(float y){
        float t=1f-(Math.max(top(),Math.min(bottom(),y))-top())/
            Math.max(1f,bottom()-top());
        change(Math.round(MIN+t*(MAX-MIN)));
    }
    @Override public boolean onTouchEvent(MotionEvent e){
        switch(e.getActionMasked()){
            case MotionEvent.ACTION_DOWN:
                dragging=true;getParent().requestDisallowInterceptTouchEvent(true);
                fromY(e.getY());invalidate();return true;
            case MotionEvent.ACTION_MOVE:
                if(dragging){fromY(e.getY());return true;}break;
            case MotionEvent.ACTION_UP:
                if(dragging){fromY(e.getY());dragging=false;invalidate();
                    performClick();return true;}break;
            case MotionEvent.ACTION_CANCEL:
                dragging=false;invalidate();return true;
            default:break;
        }
        return super.onTouchEvent(e);
    }
    @Override public boolean performClick(){super.performClick();return true;}
    @Override public boolean performAccessibilityAction(int action,Bundle args){
        if(action==AccessibilityNodeInfo.ACTION_SCROLL_FORWARD){
            change(value+4);return true;
        }
        if(action==AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD){
            change(value-4);return true;
        }
        return super.performAccessibilityAction(action,args);
    }
}
