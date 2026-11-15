package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
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
    // Controles sem placa, sem cápsula e sem texto sobre o mapa:
    // área invisível de 60dp e arte branca com sombra discreta, 30dp.
    private View actionIcon(boolean confirm,String description){
        View icon=new View(context){
            private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
            @Override protected void onDraw(Canvas canvas){
                super.onDraw(canvas);
                float cx=getWidth()/2f,cy=getHeight()/2f;
                p.setStyle(Paint.Style.STROKE);
                p.setColor(Color.WHITE);
                p.setStrokeWidth(dp(3.2f));
                p.setStrokeCap(Paint.Cap.ROUND);
                p.setStrokeJoin(Paint.Join.ROUND);
                p.setShadowLayer(dp(2),0,dp(1),0xCC000000);
                Path path=new Path();
                if(confirm){
                    path.moveTo(cx-dp(13),cy);
                    path.lineTo(cx-dp(3),cy+dp(10));
                    path.lineTo(cx+dp(14),cy-dp(11));
                }else{
                    path.moveTo(cx-dp(12),cy-dp(12));
                    path.lineTo(cx+dp(12),cy+dp(12));
                    path.moveTo(cx+dp(12),cy-dp(12));
                    path.lineTo(cx-dp(12),cy+dp(12));
                }
                canvas.drawPath(path,p);
                p.clearShadowLayer();
            }
        };
        icon.setWillNotDraw(false);
        icon.setLayerType(View.LAYER_TYPE_SOFTWARE,null);
        icon.setContentDescription(description);
        icon.setClickable(true);
        icon.setFocusable(true);
        return icon;
    }
    static PgsAutoTargetPicker open(Context context,WindowManager manager,String mode,Callback callback){
        PgsAutoTargetPicker picker=new PgsAutoTargetPicker(context,manager,callback);
        picker.show(mode);return picker;
    }
    void close(){dismiss();}
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
        root.setBackgroundColor(Color.TRANSPARENT); // Tela do jogo sem escurecimento.
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
        info.setBackground(null);
        info.setShadowLayer(dp(2),0,dp(1),0xD0000000);
        FrameLayout.LayoutParams label=new FrameLayout.LayoutParams(
            -1,dp(28),Gravity.TOP);
        label.leftMargin=dp(8);label.rightMargin=dp(8);label.topMargin=dp(39);
        root.addView(info,label);
        TextView hint=new TextView(context);
        hint.setText("Arraste a mira · ✓ confirma · × cancela");
        hint.setGravity(Gravity.CENTER);hint.setTextSize(10);hint.setTextColor(0xDDFFFFFF);
        hint.setBackground(null);
        hint.setShadowLayer(dp(2),0,dp(1),0xD0000000);
        FrameLayout.LayoutParams hintLp=new FrameLayout.LayoutParams(
            -1,dp(24),Gravity.TOP);hintLp.topMargin=dp(72);
        hintLp.leftMargin=dp(12);hintLp.rightMargin=dp(12);
        root.addView(hint,hintLp);
        // Apenas ✓ à esquerda e × à direita, sem barras ou fundos.
        // A área de toque permanece confortável e acessível, porém invisível.
        View save=actionIcon(true,"Confirmar mira e salvar posição");
        View cancel=actionIcon(false,"Cancelar mira sem salvar");
        FrameLayout.LayoutParams saveLp=new FrameLayout.LayoutParams(
            dp(60),dp(60),Gravity.BOTTOM|Gravity.LEFT);
        saveLp.leftMargin=dp(28);saveLp.bottomMargin=dp(24);
        FrameLayout.LayoutParams cancelLp=new FrameLayout.LayoutParams(
            dp(60),dp(60),Gravity.BOTTOM|Gravity.RIGHT);
        cancelLp.rightMargin=dp(28);cancelLp.bottomMargin=dp(24);
        root.addView(save,saveLp);
        root.addView(cancel,cancelLp);
        save.setOnClickListener(v->{
            float selectedX=x,selectedY=y;
            dismiss();callback.confirmed(selectedX,selectedY,width,height);
        });
        cancel.setOnClickListener(v->{dismiss();callback.cancelled();});
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
