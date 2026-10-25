package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.PointF;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

/** Exactly the owner-approved WebPs, embedded offline. Never generates, crops
 * or substitutes artwork. Viewer is a Home overlay, not a new Activity. */
final class CommunityTribute {
    private CommunityTribute(){}
    private static int dp(Activity a,int x){return (int)(a.getResources().getDisplayMetrics().density*x+.5f);}
    private static GradientDrawable bg(int fill,int border,int radius,Activity a){
        GradientDrawable d=new GradientDrawable();
        d.setColor(fill);d.setStroke(dp(a,1),border);d.setCornerRadius(dp(a,radius));return d;
    }
    private static TextView txt(Activity a,String text,int size,int color,boolean bold){
        TextView t=new TextView(a);t.setText(text);t.setTextColor(color);t.setTextSize(size);
        if(bold)t.setTypeface(null,android.graphics.Typeface.BOLD);
        t.setGravity(Gravity.CENTER_VERTICAL);return t;
    }
    /** Small right-aligned Home shortcut. The image is not squeezed into a full
     * card; tap to open the unchanged, offline full-size approved artwork. */
    static View homeCard(Activity a,boolean light,Runnable open){
        final int fg=light?0xFF254766:0xFFF4F9FF;
        LinearLayout chip=new LinearLayout(a);
        chip.setOrientation(LinearLayout.HORIZONTAL);
        chip.setGravity(Gravity.CENTER_VERTICAL);
        chip.setPadding(dp(a,6),dp(a,4),dp(a,9),dp(a,4));
        chip.setMinimumHeight(dp(a,48));
        chip.setBackground(bg(light?0xEDF0F8FF:0xD8213348,
            light?0xFF99C4D7:0xFF6395B8,23,a));

        ImageView thumbnail=new ImageView(a);
        thumbnail.setImageResource(R.drawable.pokesearch_agradecimento_miniatura);
        thumbnail.setScaleType(ImageView.ScaleType.FIT_CENTER);
        thumbnail.setContentDescription("Miniatura da homenagem aprovada");
        LinearLayout.LayoutParams tlp=new LinearLayout.LayoutParams(dp(a,31),dp(a,39));
        tlp.rightMargin=dp(a,7);
        chip.addView(thumbnail,tlp);

        TextView label=txt(a,"💙 Agradecimentos",12,fg,true);
        label.setSingleLine(true);
        chip.addView(label,new LinearLayout.LayoutParams(-2,-2));
        TextView arrow=txt(a,"  ›",19,fg,true);
        chip.addView(arrow,new LinearLayout.LayoutParams(-2,-2));
        chip.setContentDescription("Abrir homenagem aos dez integrantes do PokeSearch");
        chip.setOnClickListener(v->open.run());
        return chip;
    }
    static View show(Activity a,FrameLayout home,boolean light,Runnable onClose){
        final FrameLayout overlay=new FrameLayout(a);
        overlay.setBackgroundColor(0xEA091323);
        overlay.setClickable(true);
        home.addView(overlay,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout content=new LinearLayout(a);content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(a,10),dp(a,8),dp(a,10),dp(a,10));
        overlay.addView(content,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout toolbar=new LinearLayout(a);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);toolbar.setOrientation(LinearLayout.HORIZONTAL);
        content.addView(toolbar,new LinearLayout.LayoutParams(-1,dp(a,42)));
        TextView back=txt(a,"‹ Voltar",13,Color.WHITE,true);
        back.setGravity(Gravity.CENTER);
        toolbar.addView(back,new LinearLayout.LayoutParams(dp(a,83),-1));
        TextView header=txt(a,"💙 Agradecimentos",15,Color.WHITE,true);
        header.setGravity(Gravity.CENTER);toolbar.addView(header,new LinearLayout.LayoutParams(0,-1,1));
        TextView close=txt(a,"✕",20,Color.WHITE,true);close.setGravity(Gravity.CENTER);
        close.setContentDescription("Fechar homenagem");
        toolbar.addView(close,new LinearLayout.LayoutParams(dp(a,38),-1));
        Runnable dismiss=()->{
            if(overlay.getParent()==home){home.removeView(overlay);onClose.run();}
        };
        close.setOnClickListener(v->dismiss.run());back.setOnClickListener(v->dismiss.run());

        ZoomView photo=new ZoomView(a);
        photo.setImageResource(R.drawable.pokesearch_agradecimento_comunidade);
        photo.setContentDescription("Arte completa aprovada de agradecimento aos dez integrantes, sem cortes. Use pinça para ampliar.");
        photo.setBackgroundColor(Color.TRANSPARENT);
        LinearLayout.LayoutParams imageLp=new LinearLayout.LayoutParams(-1,0,1);
        imageLp.topMargin=dp(a,5);imageLp.bottomMargin=dp(a,5);
        content.addView(photo,imageLp);

        LinearLayout bottom=new LinearLayout(a);bottom.setGravity(Gravity.CENTER);
        content.addView(bottom,new LinearLayout.LayoutParams(-1,dp(a,43)));
        TextView reset=txt(a,"Ajustar imagem",12,0xFFCCE6F9,true);
        reset.setGravity(Gravity.CENTER);
        bottom.addView(reset,new LinearLayout.LayoutParams(0,-1,1));
        reset.setOnClickListener(v->photo.reset());
        TextView share=txt(a,"↗ Compartilhar",12,Color.WHITE,true);
        share.setGravity(Gravity.CENTER);
        share.setBackground(bg(0xFF245E83,0xFF679EC2,10,a));
        bottom.addView(share,new LinearLayout.LayoutParams(0,-1,1));
        share.setOnClickListener(v->shareOriginal(a));
        return overlay;
    }
    private static void shareOriginal(Activity a){
        try {
            File dir=new File(a.getCacheDir(),"tribute");
            if(!dir.exists()&&!dir.mkdirs())throw new java.io.IOException("cache indisponível");
            File file=new File(dir,"pokesearch_agradecimento.webp");
            try(InputStream in=a.getResources().openRawResource(R.drawable.pokesearch_agradecimento_comunidade);
                FileOutputStream out=new FileOutputStream(file,false)){
                byte[] bytes=new byte[16384];int n;
                while((n=in.read(bytes))!=-1)out.write(bytes,0,n);
            }
            Uri uri=FileProvider.getUriForFile(a,"com.lucianotoscano.pokesearch.updates",file);
            Intent send=new Intent(Intent.ACTION_SEND);
            send.setType("image/webp");send.putExtra(Intent.EXTRA_STREAM,uri);
            send.putExtra(Intent.EXTRA_SUBJECT,"💙 Agradecimentos • PokeSearch");
            send.setClipData(ClipData.newUri(a.getContentResolver(),"Homenagem PokeSearch",uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            a.startActivity(Intent.createChooser(send,"Compartilhar homenagem"));
        }catch(Exception error){
            android.widget.Toast.makeText(a,"Não foi possível compartilhar a imagem",android.widget.Toast.LENGTH_LONG).show();
        }
    }
    /** Android matrix zoom: FIT_CENTER initially, pinch to 4×, drag within
     * drawable edges, reset with the accessible bottom control. */
    private static final class ZoomView extends ImageView {
        private final Matrix matrix=new Matrix();
        private final float[] v=new float[9];
        private float base=1f,zoom=1f;
        private final PointF last=new PointF();
        private int pointer=-1;
        private final ScaleGestureDetector detector;
        ZoomView(Activity a){
            super(a);setScaleType(ScaleType.MATRIX);
            detector=new ScaleGestureDetector(a,new ScaleGestureDetector.SimpleOnScaleGestureListener(){
                @Override public boolean onScale(ScaleGestureDetector d){
                    if(getDrawable()==null)return false;
                    float next=Math.max(1f,Math.min(4f,zoom*d.getScaleFactor()));
                    float factor=next/zoom;
                    zoom=next;matrix.postScale(factor,factor,d.getFocusX(),d.getFocusY());
                    constrain();setImageMatrix(matrix);return true;
                }
            });
        }
        @Override protected void onSizeChanged(int w,int h,int oldW,int oldH){
            super.onSizeChanged(w,h,oldW,oldH);reset();
        }
        void reset(){
            if(getDrawable()==null||getWidth()==0||getHeight()==0)return;
            float dw=getDrawable().getIntrinsicWidth(),dh=getDrawable().getIntrinsicHeight();
            if(dw<=0||dh<=0)return;
            base=Math.min(getWidth()/dw,getHeight()/dh);zoom=1f;
            matrix.reset();matrix.setScale(base,base);
            matrix.postTranslate((getWidth()-dw*base)/2f,(getHeight()-dh*base)/2f);
            setImageMatrix(matrix);
        }
        private void constrain(){
            if(getDrawable()==null)return;
            matrix.getValues(v);
            float scale=v[Matrix.MSCALE_X],dx=v[Matrix.MTRANS_X],dy=v[Matrix.MTRANS_Y];
            float iw=getDrawable().getIntrinsicWidth()*scale;
            float ih=getDrawable().getIntrinsicHeight()*scale;
            float minX=iw<=getWidth()?(getWidth()-iw)/2f:getWidth()-iw;
            float maxX=iw<=getWidth()?minX:0;
            float minY=ih<=getHeight()?(getHeight()-ih)/2f:getHeight()-ih;
            float maxY=ih<=getHeight()?minY:0;
            matrix.postTranslate(Math.max(minX,Math.min(maxX,dx))-dx,
                                 Math.max(minY,Math.min(maxY,dy))-dy);
        }
        @Override public boolean onTouchEvent(MotionEvent e){
            detector.onTouchEvent(e);
            switch(e.getActionMasked()){
                case MotionEvent.ACTION_DOWN:
                    pointer=e.getPointerId(0);last.set(e.getX(),e.getY());return true;
                case MotionEvent.ACTION_MOVE:
                    if(!detector.isInProgress()&&zoom>1f&&pointer>=0){
                        int index=e.findPointerIndex(pointer);
                        if(index>=0){
                            float x=e.getX(index),y=e.getY(index);
                            matrix.postTranslate(x-last.x,y-last.y);constrain();setImageMatrix(matrix);
                            last.set(x,y);
                        }
                    }return true;
                case MotionEvent.ACTION_POINTER_UP:
                    if(e.getPointerId(e.getActionIndex())==pointer)pointer=-1;
                    return true;
                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL:pointer=-1;return true;
                default:return true;
            }
        }
    }
}
