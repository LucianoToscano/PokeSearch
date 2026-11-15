package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.LinearInterpolator;

/**
 * LT352: efeito de toque visível em mapas claros e escuros, sem bloquear
 * a aplicação e sem afirmar que o Pokémon GO recebeu ou aceitou o gesto.
 * Somente aparece na coordenada de um gesto solicitado/aceito pelo Android,
 * ou na prévia explicitamente acionada em Personalização.
 */
final class PgsAutoTapIndicator {
    private static final String TAG="PgsTapEffect";
    private static final long EFFECT_MS=960L;
    private final Context context;
    private final WindowManager windows;
    private View active;
    PgsAutoTapIndicator(Context c,WindowManager wm){context=c;windows=wm;}
    private int dp(float n){
        return Math.round(n*context.getResources().getDisplayMetrics().density);
    }
    void show(int x,int y){
        if(!context.getSharedPreferences("pgs_auto_settings_v1",Context.MODE_PRIVATE)
            .getBoolean("showTapIndicator",true))return;
        clear();
        final int side=dp(86);
        Point screen=new Point();
        windows.getDefaultDisplay().getRealSize(screen);
        if(x<0||y<0||x>=screen.x||y>=screen.y)return;
        // Uma janela pequena e 100% passante: o marcador nunca captura toques.
        View effect=new View(context){
            private final Paint pen=new Paint(Paint.ANTI_ALIAS_FLAG);
            @Override protected void onDraw(Canvas canvas){
                super.onDraw(canvas);
                float cx=getWidth()/2f,cy=getHeight()/2f;
                // Disco cyan translúcido inspirado na arte de referência.
                pen.setStyle(Paint.Style.FILL);
                pen.setShader(new RadialGradient(cx,cy,dp(40),
                    new int[]{0x92D9FBFF,0x5B77E9FF,0x1800ADFF,0x0000ADFF},
                    new float[]{0f,.20f,.70f,1f},Shader.TileMode.CLAMP));
                canvas.drawCircle(cx,cy,dp(40),pen);
                pen.setShader(null);
                // Três anéis finos continuam identificáveis em mapa claro.
                pen.setStyle(Paint.Style.STROKE);
                pen.setStrokeWidth(dp(1.6f));
                pen.setColor(0xECFFFFFF);
                canvas.drawCircle(cx,cy,dp(13),pen);
                pen.setStrokeWidth(dp(1.2f));
                pen.setColor(0xBB72EDFF);
                canvas.drawCircle(cx,cy,dp(25),pen);
                pen.setStrokeWidth(dp(1.4f));
                pen.setColor(0xA70B9DFF);
                canvas.drawCircle(cx,cy,dp(37),pen);
                // Referência do vídeo LT353: centro branco discreto,
                // um halo azul suave e anéis concêntricos em expansão.
                pen.setStyle(Paint.Style.FILL);
                pen.setColor(0xB6FFFFFF);
                canvas.drawCircle(cx,cy,dp(7f),pen);
                pen.setColor(0xF5FFFFFF);
                canvas.drawCircle(cx,cy,dp(3.5f),pen);
            }
        };
        effect.setWillNotDraw(false);
        effect.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        effect.setClickable(false);
        effect.setFocusable(false);
        effect.setBackgroundColor(0x00000000);
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(side,side,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE|
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.TOP|Gravity.LEFT;
        lp.x=x-side/2;
        lp.y=y-side/2;
        // Permitir que a área fique parcialmente fora da tela perto das bordas,
        // sem deslocar o centro visual do ponto tocado.
        lp.flags|=WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;
        try{
            windows.addView(effect,lp);
            active=effect;
            effect.setAlpha(.97f);
            effect.setScaleX(.69f);
            effect.setScaleY(.69f);
            effect.invalidate();
            effect.animate().alpha(0f).scaleX(1.24f).scaleY(1.24f)
                .setInterpolator(new LinearInterpolator())
                .setDuration(EFFECT_MS).withEndAction(()->{
                    if(active==effect)clear();
                }).start();
        }catch(RuntimeException error){
            Log.w(TAG,"Efeito de toque indisponível no WindowManager",error);
            try{windows.removeView(effect);}catch(RuntimeException ignored){}
            if(active==effect)active=null;
        }
    }
    void clear(){
        View old=active;active=null;
        if(old==null)return;
        old.animate().cancel();
        try{windows.removeView(old);}catch(RuntimeException ignored){}
    }
}
