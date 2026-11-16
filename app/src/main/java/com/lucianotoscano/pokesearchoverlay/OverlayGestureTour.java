package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.PixelFormat;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import android.widget.Toast;

/**
 * LT373: real-target, first-use coachmarks for native PokeSearch overlay windows.
 *
 * Nothing in this layer synthesizes clicks. All transitions come from the
 * existing real touch handlers or from the refresh control's JS callback.
 * The spotlight layer is FLAG_NOT_TOUCHABLE; only the tiny Skip chip handles
 * a touch. Window alpha stays below Android 12's untrusted-touch threshold.
 */
final class OverlayGestureTour {
    static final String DONE_KEY="gestureCoachV2Completed";
    // Only one full-screen coachmark may be shown across P1/P2/Candy/Search.
    // Otherwise two untrusted alpha windows would exceed the Android touch limit.
    private static OverlayGestureTour activeTour;
    static final String SHOW_RESULTS="results_show";
    static final String HIDE_RESULTS="results_hide";
    static final String SHOW_MENU="menu_show";
    static final String HIDE_MENU="menu_hide";
    static final String REFRESH_HOLD="refresh_hold";
    static final String SEARCH_TOGGLE="search_toggle";

    enum Kind { POKEBALL, CANDY, SEARCH }
    interface Target { Rect bounds(); }
    private static final class Step {
        final String instruction,event;
        final boolean hold,refresh;
        Step(String message,String required,boolean longPress,boolean refreshTarget){
            instruction=message;event=required;hold=longPress;refresh=refreshTarget;
        }
    }
    private final Context context;
    private final WindowManager manager;
    private final SharedPreferences prefs;
    private final int windowType;
    private final Kind kind;
    private final Target target;
    private final int density;
    private final Step[] steps;
     private TourArt artwork;
    private TextView skip;
    private Rect refreshBounds;
    private int index=0;
    private boolean visible=false;

    OverlayGestureTour(Context ctx,WindowManager wm,SharedPreferences state,int type,
                       Kind kind,boolean resultsVisible,Target realTarget){
        context=ctx;manager=wm;prefs=state;windowType=type;this.kind=kind;target=realTarget;
        density=Math.max(1,(int)(ctx.getResources().getDisplayMetrics().density*1000));
        if(kind==Kind.POKEBALL){
            Step a=new Step(resultsVisible?"Toque na Pokébola para\nrecolher os resultados":
                "Toque na Pokébola para\nmostrar os resultados",
                resultsVisible?HIDE_RESULTS:SHOW_RESULTS,false,false);
            Step b=new Step(resultsVisible?"Toque novamente para\nmostrar os resultados":
                "Toque novamente para\nrecolher os resultados",
                resultsVisible?SHOW_RESULTS:HIDE_RESULTS,false,false);
            steps=new Step[]{a,b,
                new Step("Mantenha a Pokébola\npressionada para abrir o menu",SHOW_MENU,true,false),
                new Step("Agora toque para\nrecolher o menu",HIDE_MENU,false,false),
                new Step("Segure novamente a Pokébola\npara ver a atualização",SHOW_MENU,true,false),
                new Step("Segure o botão ↻ para\nescolher o intervalo automático",REFRESH_HOLD,true,true)};
        }else if(kind==Kind.CANDY){
            Step a=new Step(resultsVisible?"Toque no Doce Raro para\nrecolher os resultados":
                "Toque no Doce Raro para\nmostrar os resultados",
                resultsVisible?HIDE_RESULTS:SHOW_RESULTS,false,false);
            Step b=new Step(resultsVisible?"Toque novamente para\nmostrar os resultados":
                "Toque novamente para\nrecolher os resultados",
                resultsVisible?SHOW_RESULTS:HIDE_RESULTS,false,false);
            steps=new Step[]{a,b,
                new Step("Mantenha o Doce Raro\npressionado para abrir as opções",SHOW_MENU,true,false),
                new Step("Toque no Doce Raro\npara fechar o menu",HIDE_MENU,false,false)};
        }else{
            // A short tap on this bubble can START a user-armed search.
            // Do not require that potentially destructive action to teach the menu.
            steps=new Step[]{
                new Step("Segure a Busca Pokémon\npara abrir as opções",SHOW_MENU,true,false),
                new Step("Toque no ícone para\nrecolher o menu",HIDE_MENU,false,false)};
        }
    }
    private int dp(float n){return Math.round(n*density/1000f);}
    boolean active(){return visible;}
    void start(boolean replay){
        if(!replay&&prefs.getBoolean(DONE_KEY,false))return;
        if(visible)close(false);
        if(activeTour!=null&&activeTour!=this)activeTour.close(false);
        if(manager==null||target==null||target.bounds()==null)return;
        index=0;refreshBounds=null;
        artwork=new TourArt(context);
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(
            -1,-1,windowType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL|
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.TOP|Gravity.LEFT;
        lp.alpha=.72f; // Android 12: must not obscure other apps above 0.8.
        skip=new TextView(context);
        skip.setText("Pular");
        skip.setTextColor(Color.WHITE);
        skip.setTextSize(12);
        skip.setGravity(Gravity.CENTER);
        skip.setContentDescription("Pular tutorial interativo");
        android.graphics.drawable.GradientDrawable bg=new android.graphics.drawable.GradientDrawable();
        bg.setColor(0xEE243142);bg.setCornerRadius(dp(16));
        bg.setStroke(dp(1),0xAAE5F2FF);
        skip.setBackground(bg);
        skip.setOnClickListener(v->close(true));
        WindowManager.LayoutParams skipLp=new WindowManager.LayoutParams(
            dp(78),dp(44),windowType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        skipLp.gravity=Gravity.TOP|Gravity.RIGHT;
        skipLp.y=dp(36);skipLp.x=dp(12);
        try{
            manager.addView(artwork,lp);
            manager.addView(skip,skipLp);
            visible=true;activeTour=this;
            describeStep();
            artwork.invalidate();
        }catch(RuntimeException error){
            if(artwork!=null&&artwork.isAttachedToWindow()){
                try{manager.removeView(artwork);}catch(RuntimeException ignored){}
            }
            if(skip!=null&&skip.isAttachedToWindow()){
                try{manager.removeView(skip);}catch(RuntimeException ignored){}
            }
            artwork=null;skip=null;visible=false;
        }
    }
    void onEvent(String gesture){
        if(!visible||index>=steps.length||!steps[index].event.equals(gesture))return;
        index++;
        if(index>=steps.length){
            close(true);
            if(kind==Kind.POKEBALL)
                Toast.makeText(context,"Escolha o intervalo no menu ↻ ou mantenha o atual.",
                    Toast.LENGTH_LONG).show();
            else if(kind==Kind.SEARCH)
                Toast.makeText(context,"Toque curto liga ou pausa a busca configurada.",
                    Toast.LENGTH_LONG).show();
            return;
        }
        describeStep();
        if(artwork!=null)artwork.invalidate();
    }
    private void describeStep(){
        if(skip==null||index>=steps.length)return;
        String instruction=steps[index].instruction.replace('\n',' ');
        skip.setContentDescription("Tutorial: "+instruction+". Pular tutorial.");
        skip.announceForAccessibility("Tutorial. "+instruction);
    }
    void setRefreshBounds(Rect bounds){
        if(!visible||bounds==null||bounds.isEmpty())return;
        refreshBounds=new Rect(bounds);
        if(artwork!=null)artwork.invalidate();
    }
    void close(boolean completed){
        if(completed)prefs.edit().putBoolean(DONE_KEY,true).apply();
        visible=false;
        if(activeTour==this)activeTour=null;
        if(artwork!=null){
            try{manager.removeView(artwork);}catch(RuntimeException ignored){}
            artwork=null;
        }
        if(skip!=null){
            try{manager.removeView(skip);}catch(RuntimeException ignored){}
            skip=null;
        }
        refreshBounds=null;
    }

    private final class TourArt extends View {
        private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
        TourArt(Context ctx){
            super(ctx);setWillNotDraw(false);
            setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        }
        private void text(Canvas c,String value,float x,float baseline,int size){
            paint.reset();paint.setAntiAlias(true);
            paint.setTypeface(android.graphics.Typeface.create("sans-serif-medium",
                android.graphics.Typeface.NORMAL));
            paint.setTextSize(dp(size));paint.setTextAlign(Paint.Align.CENTER);
            paint.setColor(Color.WHITE);
            c.drawText(value,x,baseline,paint);
        }
        @Override protected void onDraw(Canvas c){
            super.onDraw(c);
            if(!visible||index>=steps.length)return;
            Step stage=steps[index];
            Rect desired=stage.refresh&&refreshBounds!=null?
                new Rect(refreshBounds):target.bounds();
            if(desired==null||desired.isEmpty())return;
            int width=getWidth(),height=getHeight();
            if(width<=0||height<=0)return;
            int gap=dp(6);
            RectF hole=new RectF(
                Math.max(1,desired.left-gap),Math.max(1,desired.top-gap),
                Math.min(width-1,desired.right+gap),
                Math.min(height-1,desired.bottom+gap));
            if(hole.width()<dp(8)||hole.height()<dp(8))return;
            float cx=hole.centerX(),cy=hole.centerY();
            float radius=Math.max(hole.width(),hole.height())*.54f;
            // Real transparent hole, not a duplicate icon or an inert hitbox.
            Path mask=new Path();
            mask.setFillType(Path.FillType.EVEN_ODD);
            mask.addRect(0,0,width,height,Path.Direction.CW);
            mask.addRoundRect(hole,Math.min(radius,dp(18)),Math.min(radius,dp(18)),
                Path.Direction.CW);
            paint.reset();paint.setAntiAlias(true);paint.setColor(0xF509111C);
            paint.setStyle(Paint.Style.FILL);
            c.drawPath(mask,paint);
            boolean animated=android.animation.ValueAnimator.areAnimatorsEnabled();
            long tick=SystemClock.uptimeMillis();
            float phase=animated?(tick%1450L)/1450f:.22f;
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(dp(2));
            paint.setColor(0xFFE5FBFF);
            c.drawRoundRect(hole,dp(18),dp(18),paint);
            paint.setColor(0x99B7FFF1);
            paint.setStrokeWidth(dp(2));
            c.drawCircle(cx,cy,radius+dp(6)+dp(7)*phase,paint);
            if(stage.hold){
                paint.setColor(0xFFF6E09A);paint.setStrokeWidth(dp(3));
                c.drawArc(new RectF(cx-radius-dp(9),cy-radius-dp(9),
                    cx+radius+dp(9),cy+radius+dp(9)),
                    -90,360*phase,false,paint);
            }else{
                paint.setColor(0x77FFFFFF);
                c.drawCircle(cx,cy,dp(8)+dp(10)*phase,paint);
            }
            // Compact bubble label always stays on the safer side of target.
            float boxW=Math.min(dp(286),width-dp(24));
            float boxH=dp(79);
            float boxLeft=Math.max(dp(12),Math.min(width-dp(12)-boxW,cx-boxW/2));
            float boxTop=cy>height/2f?
                Math.max(dp(65),hole.top-dp(155)):
                Math.min(height-boxH-dp(25),hole.bottom+dp(103));
            boxTop=Math.max(dp(56),boxTop);
            RectF card=new RectF(boxLeft,boxTop,boxLeft+boxW,boxTop+boxH);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(0xF1223146);
            c.drawRoundRect(card,dp(12),dp(12),paint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setColor(0xBBE9FCFF);paint.setStrokeWidth(dp(1));
            c.drawRoundRect(card,dp(12),dp(12),paint);
            // White dotted pointer and arrow are rendered natively on transparency.
            float endY=cy>height/2f?card.bottom+dp(6):card.top-dp(6);
            Path guide=new Path();
            guide.moveTo(card.centerX(),endY);
            float fromBelow=cy>height/2f?1f:-1f;
            guide.cubicTo(card.centerX()+dp(45),endY+dp(28)*fromBelow,
                cx+dp(45),cy-dp(28)*fromBelow,cx,cy);
            paint.setColor(Color.WHITE);paint.setStrokeWidth(dp(2.2f));
            paint.setStrokeCap(Paint.Cap.ROUND);
            paint.setPathEffect(new DashPathEffect(new float[]{dp(5),dp(6)},0));
            c.drawPath(guide,paint);paint.setPathEffect(null);
            paint.setStyle(Paint.Style.FILL);paint.setColor(Color.WHITE);
            Path arrow=new Path();
            arrow.moveTo(cx,cy);arrow.lineTo(cx-dp(7),cy-dp(12)*fromBelow);
            arrow.lineTo(cx+dp(7),cy-dp(12)*fromBelow);arrow.close();
            c.drawPath(arrow,paint);
            String[] lines=stage.instruction.split("\n",-1);
            float textY=card.top+dp(29);
            for(int i=0;i<lines.length;i++)text(c,lines[i],card.centerX(),textY+i*dp(20),13);
            text(c,(index+1)+" / "+steps.length,card.centerX(),
                card.bottom-dp(9),10);
            // Small original outlined hand: transparent asset-like vector art.
            float bob=dp(4)*(float)Math.sin(tick/300.0);
            c.save();c.translate(cx+dp(12),cy+dp(7)+bob);
            Path hand=new Path();
            hand.moveTo(-dp(5),-dp(2));
            hand.cubicTo(-dp(16),-dp(8),-dp(19),dp(8),-dp(14),dp(18));
            hand.lineTo(-dp(12),dp(42));
            hand.cubicTo(-dp(23),dp(30),-dp(30),dp(35),-dp(25),dp(49));
            hand.lineTo(-dp(7),dp(77));
            hand.cubicTo(dp(3),dp(91),dp(34),dp(83),dp(41),dp(67));
            hand.lineTo(dp(47),dp(43));
            hand.cubicTo(dp(47),dp(32),dp(32),dp(31),dp(27),dp(40));
            hand.cubicTo(dp(27),dp(25),dp(13),dp(23),dp(8),dp(31));
            hand.lineTo(dp(4),dp(3));
            hand.cubicTo(dp(3),-dp(3),-dp(2),-dp(5),-dp(5),-dp(2));
            hand.close();
            paint.setStyle(Paint.Style.FILL);paint.setColor(0xEB122235);
            c.drawPath(hand,paint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(dp(2.2f));paint.setColor(Color.WHITE);
            c.drawPath(hand,paint);c.restore();
            if(visible&&animated)postInvalidateDelayed(85);
        }
    }
}
