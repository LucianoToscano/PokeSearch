package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;

/** Short-lived touch-through marker at an Android-accepted gesture position.
 * It is feedback for the request, NOT proof that the game processed the tap.
 */
final class PgsAutoTapIndicator {
    private final Context context;
    private final WindowManager windows;
    private View active;
    PgsAutoTapIndicator(Context c,WindowManager wm){context=c;windows=wm;}
    private int dp(float n){return Math.round(n*context.getResources().getDisplayMetrics().density);}
    void show(int x,int y){
        if(!context.getSharedPreferences("pgs_auto_settings_v1",Context.MODE_PRIVATE)
            .getBoolean("showTapIndicator",true))return;
        clear();
        final int side=dp(46);
        Point screen=new Point();windows.getDefaultDisplay().getRealSize(screen);
        if(x<0||y<0||x>=screen.x||y>=screen.y)return;
        View dot=new View(context){
            private final Paint pen=new Paint(Paint.ANTI_ALIAS_FLAG);
            @Override protected void onDraw(Canvas canvas){
                super.onDraw(canvas);
                float cx=getWidth()/2f,cy=getHeight()/2f;
                pen.setStyle(Paint.Style.STROKE);
                pen.setStrokeWidth(dp(1.5f));pen.setColor(0xAAAEF2FF);
                canvas.drawCircle(cx,cy,dp(12),pen);
                pen.setStrokeWidth(dp(1));pen.setColor(0x55FFFFFF);
                canvas.drawCircle(cx,cy,dp(17),pen);
                pen.setStyle(Paint.Style.FILL);pen.setColor(0x88FFFFFF);
                canvas.drawCircle(cx,cy,dp(2.5f),pen);
            }
        };
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(side,side,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE|
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.TOP|Gravity.LEFT;
        lp.x=Math.max(0,Math.min(screen.x-side,x-side/2));
        lp.y=Math.max(0,Math.min(screen.y-side,y-side/2));
        try{
            windows.addView(dot,lp);active=dot;
            dot.animate().alpha(0f).scaleX(1.22f).scaleY(1.22f)
                .setDuration(380L).withEndAction(()->{
                    if(active==dot)clear();
                }).start();
        }catch(RuntimeException ignored){
            try{windows.removeView(dot);}catch(RuntimeException ignoredRemoval){}
            if(active==dot)active=null;
        }
    }
    void clear(){
        View old=active;active=null;
        if(old==null)return;
        old.animate().cancel();
        try{windows.removeView(old);}catch(RuntimeException ignored){}
    }
}
