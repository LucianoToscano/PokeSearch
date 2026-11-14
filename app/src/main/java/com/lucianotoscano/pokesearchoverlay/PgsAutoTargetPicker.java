package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Mira de coordenadas locais (não GPS). Só salva após confirmação explícita.
 * Overlay é removido antes de permitir novos gestos automáticos.
 */
final class PgsAutoTargetPicker {
    interface Callback {
        void confirmed(float x,float y,int width,int height);
        void cancelled();
    }
    private final Context context;
    private final WindowManager wm;
    private final Callback callback;
    private FrameLayout root;
    private View reticle;
    private TextView info;
    private int width,height;
    private float x=.5f,y=.5f;
    private boolean closed=false;
    private PgsAutoTargetPicker(Context c,WindowManager manager,Callback cb){
        context=c;wm=manager;callback=cb;
    }
    private int dp(float v){
        return Math.round(v*context.getResources().getDisplayMetrics().density);
    }
    private static GradientDrawable bg(int fill,int stroke,int radiusPx){
        GradientDrawable d=new GradientDrawable();
        d.setColor(fill);d.setStroke(1,stroke);d.setCornerRadius(radiusPx);
        return d;
    }
    private Button button(String text){
        Button b=new Button(context);b.setText(text);b.setTextColor(Color.WHITE);
        b.setAllCaps(false);b.setTextSize(12);b.setMinHeight(0);
        b.setMinimumHeight(0);b.setMinWidth(0);b.setMinimumWidth(0);
        b.setBackground(bg(0xF0192736,0xFF6D90A7,dp(9)));
        return b;
    }
    static void open(Context context,WindowManager manager,String mode,Callback callback){
        new PgsAutoTargetPicker(context,manager,callback).show(mode);
    }
    private void setAim(float screenX,float screenY){
        x=Math.max(.035f,Math.min(.965f,screenX/Math.max(1,width)));
        y=Math.max(.12f,Math.min(.88f,screenY/Math.max(1,height)));
        if(reticle!=null&&root!=null){
            final int[] where=new int[2];
            root.getLocationOnScreen(where);
            float px=x*width-where[0]-dp(36),py=y*height-where[1]-dp(36);
            reticle.setX(px);reticle.setY(py);
        }
        if(info!=null)info.setText(
            String.format(java.util.Locale.ROOT,"X %.1f%% · Y %.1f%% · arraste a mira",
                x*100f,y*100f));
    }
    private boolean receive(MotionEvent event){
        int kind=event.getActionMasked();
        if(kind==MotionEvent.ACTION_DOWN||kind==MotionEvent.ACTION_MOVE){
            setAim(event.getRawX(),event.getRawY());return true;
        }
        return kind==MotionEvent.ACTION_UP||kind==MotionEvent.ACTION_CANCEL;
    }
    private void show(String mode){
        Point dims=new Point();wm.getDefaultDisplay().getRealSize(dims);
        width=dims.x;height=dims.y;
        root=new FrameLayout(context);
        root.setBackgroundColor(0x28101825);
        root.setOnTouchListener((v,e)->receive(e));
        reticle=new View(context){
            private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
            @Override protected void onDraw(Canvas canvas){
                super.onDraw(canvas);
                float cx=getWidth()/2f,cy=getHeight()/2f,r=dp(25);
                paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(2));
                paint.setColor(0xFF5EF8FF);
                paint.setShadowLayer(dp(5),0,0,0xFF00C7FF);
                canvas.drawArc(cx-r,cy-r,cx+r,cy+r,12,66,false,paint);
                canvas.drawArc(cx-r,cy-r,cx+r,cy+r,102,66,false,paint);
                canvas.drawArc(cx-r,cy-r,cx+r,cy+r,192,66,false,paint);
                canvas.drawArc(cx-r,cy-r,cx+r,cy+r,282,66,false,paint);
                canvas.drawLine(cx-dp(7),cy,cx+dp(7),cy,paint);
                canvas.drawLine(cx,cy-dp(7),cx,cy+dp(7),paint);
                paint.setStyle(Paint.Style.FILL);
                for(int i=0;i<4;i++){
                    canvas.save();canvas.rotate(i*90,cx,cy);
                    Path tri=new Path();tri.moveTo(cx,cy-dp(27));
                    tri.lineTo(cx-dp(9),cy-dp(43));
                    tri.lineTo(cx+dp(9),cy-dp(43));tri.close();
                    canvas.drawPath(tri,paint);canvas.restore();
                }
                paint.clearShadowLayer();
            }
        };
        reticle.setLayerType(View.LAYER_TYPE_SOFTWARE,null);
        reticle.setOnTouchListener((v,e)->receive(e));
        root.addView(reticle,new FrameLayout.LayoutParams(dp(72),dp(72)));
        info=new TextView(context);info.setTextColor(Color.WHITE);
        info.setGravity(Gravity.CENTER);info.setTextSize(12);
        info.setBackground(bg(0xE9213140,0xFF587D93,dp(8)));
        FrameLayout.LayoutParams label=new FrameLayout.LayoutParams(
            -1,dp(38),Gravity.TOP);
        label.leftMargin=dp(18);label.rightMargin=dp(18);label.topMargin=dp(30);
        root.addView(info,label);
        TextView hint=new TextView(context);
        hint.setText("Selecione o centro visual do "+(
            "POKESTOP".equals(mode)?"PokéStop":"ENCOUNTER".equals(mode)?
            "Pokémon":"ponto de toque")+".\nA posição será salva apenas ao confirmar.");
        hint.setGravity(Gravity.CENTER);hint.setTextSize(11);hint.setTextColor(Color.WHITE);
        hint.setBackground(bg(0xD91A2836,0xFF577E91,dp(8)));
        FrameLayout.LayoutParams hintLp=new FrameLayout.LayoutParams(
            -1,dp(58),Gravity.TOP);hintLp.topMargin=dp(74);
        hintLp.leftMargin=dp(24);hintLp.rightMargin=dp(24);
        root.addView(hint,hintLp);
        LinearLayout actions=new LinearLayout(context);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        actions.setPadding(dp(18),dp(6),dp(18),dp(6));
        Button cancel=button("Cancelar"),save=button("✓ Confirmar mira");
        LinearLayout.LayoutParams left=new LinearLayout.LayoutParams(0,dp(48),1);
        left.rightMargin=dp(8);
        actions.addView(cancel,left);
        actions.addView(save,new LinearLayout.LayoutParams(0,dp(48),1));
        FrameLayout.LayoutParams panel=new FrameLayout.LayoutParams(
            -1,dp(65),Gravity.BOTTOM);panel.bottomMargin=dp(16);
        root.addView(actions,panel);
        cancel.setOnClickListener(v->{dismiss();callback.cancelled();});
        save.setOnClickListener(v->{
            float selectedX=x,selectedY=y;
            dismiss();callback.confirmed(selectedX,selectedY,width,height);
        });
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(
            -1,-1,WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.LEFT|Gravity.TOP;
        try{wm.addView(root,lp);root.post(()->setAim(width*.5f,height*.5f));}
        catch(RuntimeException err){dismiss();callback.cancelled();}
    }
    private void dismiss(){
        if(closed)return;
        closed=true;
        if(root!=null)try{wm.removeViewImmediate(root);}catch(RuntimeException ignored){}
        root=null;reticle=null;info=null;
    }
}
