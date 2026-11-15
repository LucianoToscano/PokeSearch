package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PointF;
import android.graphics.Rect;
import android.graphics.RectF;
import android.view.MotionEvent;
import android.view.View;

/**
 * Recorte guiado local com mini-lupa deslocada do dedo.
 * "Livre" é área RETANGULAR de proporção livre: nunca afirmar que
 * representa segmentação automática de silhueta não homologada.
 * Não grava nada até o botão Confirmar do serviço Android.
 */
final class PgsAutoCropSelection extends View {
    enum Mode {SQUARE,HORIZONTAL,VERTICAL,FREE}
    private static final float VERTICAL_WIDTH_HEIGHT_RATIO=0.75f; // 3:4 portrait, not a tall sliver
    private final int originalWidth,originalHeight;
    private final Runnable changed;
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
    private final RectF crop=new RectF();
    private Bitmap screenshot;
    private int referencePx=32;
    int referencePx(){return referencePx;}
    private Mode mode=Mode.SQUARE;
    private boolean selected=false,tracking=false;
    private int dragging=0; // 1 mover área, 2 redimensionar, 3 arrastar pela alça externa
    private float prevX,prevY,fingerX,fingerY;

    PgsAutoCropSelection(Context context,int width,int height,Runnable onChanged){
        super(context);
        originalWidth=Math.max(1,width);originalHeight=Math.max(1,height);
        changed=onChanged;
        setContentDescription("Seleção assistida com lupa fora do dedo. Quadrado, Vertical, Horizontal e Livre.");
    }
    void setPreviewBitmap(Bitmap bitmap){screenshot=bitmap;invalidate();}
    void setMode(Mode value){
        mode=value==null?Mode.SQUARE:value;
        if(selected&&getWidth()>0&&getHeight()>0)position(crop.centerX(),crop.centerY());
        invalidate();notifyChanged();
    }
    Mode mode(){return mode;}
    private float clamp(float v,float a,float b){return Math.max(a,Math.min(b,v));}
    private float density(){return getResources().getDisplayMetrics().density;}
    void setReferencePx(int value){
        referencePx=Math.max(16,Math.min(92,value));
        if(selected&&getWidth()>0&&getHeight()>0)position(crop.centerX(),crop.centerY());
        invalidate();notifyChanged();
    }
    private void notifyChanged(){if(changed!=null)changed.run();}
    boolean hasSelection(){return selected;}
    private float minimumSide(){
        // O mínimo é em pixels da tela de referência (740), não 12dp.
        // Um mínimo em dp achatava várias posições do novo slider em 36px+.
        return Math.max(1f,16f*getWidth()/740f);
    }
    private float defaultSide(){
        // A escala da referência acompanha a largura real da screenshot.
        return Math.max(minimumSide(),referencePx*getWidth()/740f);
    }
    private void position(float cx,float cy){
        float side=clamp(defaultSide(),minimumSide(),
            Math.min(getWidth(),getHeight()));
        float w=mode==Mode.HORIZONTAL?Math.min(getWidth(),side*1.8f):
            mode==Mode.VERTICAL?side:
            mode==Mode.FREE?Math.min(getWidth(),side*1.3f):side;
        float h=mode==Mode.VERTICAL?
            Math.min(getHeight(),w/VERTICAL_WIDTH_HEIGHT_RATIO):side;
        if(mode==Mode.VERTICAL)w=h*VERTICAL_WIDTH_HEIGHT_RATIO;
        float left=clamp(cx-w/2f,0,Math.max(0,getWidth()-w));
        float top=clamp(cy-h/2f,0,Math.max(0,getHeight()-h));
        crop.set(left,top,left+w,top+h);selected=true;
    }
    Rect selectedBitmapRect(){
        if(!selected||getWidth()<=0||getHeight()<=0)return null;
        // IMPORTANTE: usar medidas REAIS do recorte arrastado, não referencePx
        // independente do gesto. Assim prévia e arquivo final coincidem.
        int l=(int)Math.floor(crop.left*originalWidth/getWidth());
        int t=(int)Math.floor(crop.top*originalHeight/getHeight());
        int r=(int)Math.ceil(crop.right*originalWidth/getWidth());
        int b=(int)Math.ceil(crop.bottom*originalHeight/getHeight());
        l=Math.max(0,Math.min(originalWidth-1,l));
        t=Math.max(0,Math.min(originalHeight-1,t));
        r=Math.max(l+1,Math.min(originalWidth,r));
        b=Math.max(t+1,Math.min(originalHeight,b));
        return new Rect(l,t,r,b);
    }
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);
        if(!selected)return;
        paint.setStyle(Paint.Style.FILL);paint.setColor(0x3802060E);
        canvas.drawRect(0,0,getWidth(),crop.top,paint);
        canvas.drawRect(0,crop.bottom,getWidth(),getHeight(),paint);
        canvas.drawRect(0,crop.top,crop.left,crop.bottom,paint);
        canvas.drawRect(crop.right,crop.top,getWidth(),crop.bottom,paint);
        paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(2f*density());
        paint.setColor(Color.WHITE);
        canvas.drawRoundRect(crop,4f*density(),4f*density(),paint);
        paint.setStrokeWidth(4f*density());
        float handle=13f*density();
        canvas.drawLine(crop.right-handle,crop.bottom,crop.right,crop.bottom,paint);
        canvas.drawLine(crop.right,crop.bottom-handle,crop.right,crop.bottom,paint);
        paint.setStyle(Paint.Style.FILL);
        drawMoveHandle(canvas);
        drawMagnifier(canvas);
    }

    // A pequena alça se desloca COM o recorte, mas fica do lado de fora para
    // o dedo não cobrir o Pokémon (tanto em modo claro quanto em fundo escuro).
    private PointF moveHandleCenter(){
        float margin=24f*density();
        float x=clamp(crop.right+margin,margin,getWidth()-margin);
        float y=clamp(crop.top-margin,margin,getHeight()-margin);
        return new PointF(x,y);
    }
    private void drawMoveHandle(Canvas canvas){
        PointF center=moveHandleCenter();
        float cx=center.x,cy=center.y,d=density(),arm=9f*d,tip=3f*d;
        // LT349b: ONLY the thin white four-direction glyph. No circle,
        // outline, grey backing or dark fill around this drag handle.
        // The invisible 22dp touch radius in onTouchEvent remains unchanged.
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1.65f*d);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeJoin(Paint.Join.ROUND);
        paint.setColor(0xFFFFFFFF);
        canvas.drawLine(cx-arm,cy,cx+arm,cy,paint);
        canvas.drawLine(cx,cy-arm,cx,cy+arm,paint);
        canvas.drawLine(cx-arm,cy,cx-arm+tip,cy-tip,paint);
        canvas.drawLine(cx-arm,cy,cx-arm+tip,cy+tip,paint);
        canvas.drawLine(cx+arm,cy,cx+arm-tip,cy-tip,paint);
        canvas.drawLine(cx+arm,cy,cx+arm-tip,cy+tip,paint);
        canvas.drawLine(cx,cy-arm,cx-tip,cy-arm+tip,paint);
        canvas.drawLine(cx,cy-arm,cx+tip,cy-arm+tip,paint);
        canvas.drawLine(cx,cy+arm,cx-tip,cy+arm-tip,paint);
        canvas.drawLine(cx,cy+arm,cx+tip,cy+arm-tip,paint);
        paint.setStyle(Paint.Style.FILL);
    }

    private void drawMagnifier(Canvas canvas){
        if(!tracking||screenshot==null||screenshot.isRecycled()||
            getWidth()<1||getHeight()<1)return;
        // Janela ampliada no lado OPOSTO do dedo, fora da área pressionada.
        float radius=47f*density();
        float mx=fingerX>getWidth()/2f?radius+10*density():
            getWidth()-radius-10*density();
        float my=clamp(fingerY, radius+160*density(),
            Math.max(radius+160*density(),getHeight()-radius-120*density()));
        if(Math.abs(my-fingerY)<radius*2f){
            my=fingerY<getHeight()/2f?getHeight()-radius-130*density():
                radius+160*density();
        }
        int bx=Math.max(0,Math.min(originalWidth-1,
            Math.round(fingerX*originalWidth/getWidth())));
        int by=Math.max(0,Math.min(originalHeight-1,
            Math.round(fingerY*originalHeight/getHeight())));
        int half=Math.max(6,Math.round(12*density()));
        Rect src=new Rect(Math.max(0,bx-half),Math.max(0,by-half),
            Math.min(originalWidth,bx+half),Math.min(originalHeight,by+half));
        RectF dest=new RectF(mx-radius,my-radius,mx+radius,my+radius);
        Path circle=new Path();circle.addCircle(mx,my,radius,Path.Direction.CW);
        canvas.save();canvas.clipPath(circle);
        paint.setColor(Color.WHITE);
        canvas.drawBitmap(screenshot,src,dest,paint);
        canvas.restore();
        paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(2f*density());
        paint.setColor(Color.WHITE);canvas.drawCircle(mx,my,radius,paint);
        canvas.drawLine(mx-8*density(),my,mx+8*density(),my,paint);
        canvas.drawLine(mx,my-8*density(),mx,my+8*density(),paint);
        paint.setStyle(Paint.Style.FILL);
    }
    @Override public boolean onTouchEvent(MotionEvent event){
        float x=clamp(event.getX(),0,getWidth());
        float y=clamp(event.getY(),0,getHeight());
        int action=event.getActionMasked();
        if(action==MotionEvent.ACTION_DOWN){
            tracking=true;fingerX=x;fingerY=y;
            float reach=30f*density();
            PointF move=selected?moveHandleCenter():null;
            if(move!=null&&Math.hypot(x-move.x,y-move.y)<22f*density()){
                dragging=3;
                fingerX=crop.centerX();fingerY=crop.centerY();
                performHapticFeedback(android.view.HapticFeedbackConstants.CLOCK_TICK);
            }else if(selected&&Math.abs(x-crop.right)<reach&&Math.abs(y-crop.bottom)<reach)
                dragging=2;
            else if(selected&&crop.contains(x,y))dragging=1;
            else{position(x,y);dragging=1;}
            prevX=x;prevY=y;invalidate();return true;
        }
        if(action==MotionEvent.ACTION_MOVE){
            fingerX=x;fingerY=y;
            if(dragging==1||dragging==3){
                crop.offset(x-prevX,y-prevY);
                if(crop.left<0)crop.offset(-crop.left,0);
                if(crop.top<0)crop.offset(0,-crop.top);
                if(crop.right>getWidth())crop.offset(getWidth()-crop.right,0);
                if(crop.bottom>getHeight())crop.offset(0,getHeight()-crop.bottom);
                if(dragging==3){
                    fingerX=crop.centerX();
                    fingerY=crop.centerY();
                }
            }else if(dragging==2){
                float min=minimumSide();
                float w=clamp(x-crop.left,min,getWidth()-crop.left);
                float h=clamp(y-crop.top,min,getHeight()-crop.top);
                if(mode==Mode.SQUARE)w=h=Math.min(w,h);
                else if(mode==Mode.HORIZONTAL){
                    h=Math.min(h,w/1.8f);w=Math.min(getWidth()-crop.left,h*1.8f);
                }else if(mode==Mode.VERTICAL){
                    w=Math.min(w,h*VERTICAL_WIDTH_HEIGHT_RATIO);
                    h=Math.min(getHeight()-crop.top,
                        w/VERTICAL_WIDTH_HEIGHT_RATIO);
                    w=h*VERTICAL_WIDTH_HEIGHT_RATIO;
                }
                crop.right=crop.left+w;crop.bottom=crop.top+h;
            }
            prevX=x;prevY=y;invalidate();return true;
        }
        if(action==MotionEvent.ACTION_UP){
            tracking=false;dragging=0;invalidate();notifyChanged();return true;
        }
        if(action==MotionEvent.ACTION_CANCEL){
            tracking=false;dragging=0;invalidate();return true;
        }
        return true;
    }
}
