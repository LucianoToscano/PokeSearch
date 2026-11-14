package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Controles de inspeção independentes da sprite e da conversa:
 * ◀️ volta índice, 👬 compara com #42, ▶️ avança índice.
 * Pressionar 👬 demoradamente retoma animação automática.
 *
 * Renderização de duas células iguais 512px em dimensões P/M/G.
 * O overlay comparativo é NOT_TOUCHABLE; o usuário ainda arrasta o Edu
 * normalmente. Linhas-guia são desenhadas em Views separadas da arte.
 */
final class EduSpriteInspector {
    static final String PREF_CONTROLS="edu_sprite_inspector_controls";
    static final String PREF_GUIDES="edu_sprite_inspector_guides";
    static final int DEFAULT_FRAME=42;
    interface Listener {
        int currentFrame();
        void selected(int index);
        void comparing(boolean show);
        void resumed();
    }

    private final Context context;
    private final WindowManager wm;
    private final EduSpriteAtlas atlas;
    private final SharedPreferences prefs;
    private final Listener listener;
    private LinearLayout toolbar,comparison;
    private WindowManager.LayoutParams toolbarParams,comparisonParams;
    private ImageView leftImage,rightImage;
    private EduSpriteGuideView leftGuides,rightGuides;
    private TextView indexLabel,rightLabel;
    private boolean controlsVisible,guidesVisible,reviewing,showComparison;
    private int selectedIndex=DEFAULT_FRAME;
    private int lastArtSize=-1;
    private int pairCellSize;
    private int lastBubbleX,lastBubbleY,lastBubbleW,lastBubbleH;

    EduSpriteInspector(Context ctx,WindowManager window,EduSpriteAtlas sprites,
                       SharedPreferences settings,Listener callbacks){
        context=ctx;
        wm=window;
        atlas=sprites;
        prefs=settings;
        listener=callbacks;
        controlsVisible=prefs.getBoolean(PREF_CONTROLS,false);
        guidesVisible=prefs.getBoolean(PREF_GUIDES,false);
    }
    boolean controlsVisible(){return controlsVisible;}
    boolean guidesVisible(){return guidesVisible;}
    boolean isReviewing(){return reviewing;}
    boolean isComparing(){return showComparison;}
    int selectedIndex(){return selectedIndex;}

    void sync(WindowManager.LayoutParams anchor,int art){
        if(anchor==null)return;
        lastBubbleX=anchor.x;lastBubbleY=anchor.y;
        lastBubbleW=anchor.width;lastBubbleH=anchor.height;
        if(!controlsVisible)return;
        ensureToolbar();
        updateToolbarPosition();
        if(showComparison){
            if(lastArtSize!=art){
                removeComparison();
                lastArtSize=art;
            }
            ensureComparison(art);
            updateComparisonPosition();
        }
    }

    void setControlsVisible(boolean enabled,WindowManager.LayoutParams anchor,int art){
        controlsVisible=enabled;
        prefs.edit().putBoolean(PREF_CONTROLS,enabled).apply();
        if(!enabled){
            stopReview();
            removeToolbar();
            return;
        }
        sync(anchor,art);
    }
    void setGuidesVisible(boolean enabled){
        guidesVisible=enabled;
        prefs.edit().putBoolean(PREF_GUIDES,enabled).apply();
        if(leftGuides!=null)leftGuides.setEnabledGuides(enabled);
        if(rightGuides!=null)rightGuides.setEnabledGuides(enabled);
    }
    void stopReview(){
        boolean hadReview=reviewing||showComparison;
        showComparison=false;reviewing=false;
        removeComparison();
        if(hadReview)listener.resumed();
    }
    void destroy(){
        removeComparison();
        removeToolbar();
    }

    private void change(int increment){
        if(!reviewing)selectedIndex=clampFrame(listener.currentFrame());
        selectedIndex=(selectedIndex+increment+EduSpriteAtlas.COLLECTION_COUNT)
            %EduSpriteAtlas.COLLECTION_COUNT;
        reviewing=true;
        listener.selected(selectedIndex);
        updateComparisonImages();
        updateLabel();
    }
    private void toggleCompare(){
        if(!reviewing){
            selectedIndex=clampFrame(listener.currentFrame());
            reviewing=true;
            listener.selected(selectedIndex);
        }
        showComparison=!showComparison;
        listener.comparing(showComparison);
        if(showComparison){
            lastArtSize=-1;
            ensureComparison(Math.max(64,lastBubbleW-6));
            updateComparisonPosition();
        }else removeComparison();
        updateLabel();
    }
    private static int clampFrame(int index){
        return index>=0&&index<EduSpriteAtlas.COLLECTION_COUNT?index:42;
    }

    private void ensureToolbar(){
        if(toolbar!=null)return;
        toolbar=new LinearLayout(context);
        toolbar.setGravity(Gravity.CENTER);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setPadding(dp(3),dp(3),dp(3),dp(3));
        toolbar.setBackground(bg(0xCB17202C,0xB2718591,14));
        TextView back=control("◀️","Sprite anterior");
        TextView duo=control("👬","Comparar com Edu padrão #42; segure para voltar ao automático");
        TextView next=control("▶️","Próxima sprite");
        toolbar.addView(back,new LinearLayout.LayoutParams(dp(38),dp(34)));
        toolbar.addView(duo,new LinearLayout.LayoutParams(dp(38),dp(34)));
        toolbar.addView(next,new LinearLayout.LayoutParams(dp(38),dp(34)));
        indexLabel=new TextView(context);
        indexLabel.setTextColor(Color.WHITE);
        indexLabel.setTextSize(10f);
        indexLabel.setGravity(Gravity.CENTER);
        toolbar.addView(indexLabel,new LinearLayout.LayoutParams(dp(40),dp(34)));
        back.setOnClickListener(v->change(-1));
        duo.setOnClickListener(v->toggleCompare());
        duo.setOnLongClickListener(v->{stopReview();updateLabel();return true;});
        next.setOnClickListener(v->change(1));
        updateLabel();
        toolbarParams=windowParams(dp(164),dp(42),false);
        wm.addView(toolbar,toolbarParams);
    }
    private void updateLabel(){
        if(indexLabel!=null)
            indexLabel.setText(reviewing?
                String.format(java.util.Locale.ROOT,"#%02d",selectedIndex):
                "auto");
    }
    private TextView control(String symbol,String description){
        TextView b=new TextView(context);
        b.setText(symbol);
        b.setTextSize(17f);
        b.setGravity(Gravity.CENTER);
        b.setContentDescription(description);
        b.setClickable(true);
        b.setBackground(bg(0xAA344451,0x774B6C7D,9));
        return b;
    }
    private GradientDrawable bg(int color,int border,int radius){
        GradientDrawable d=new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radius));
        d.setStroke(dp(1),border);
        return d;
    }
    private WindowManager.LayoutParams windowParams(int w,int h,boolean notTouchable){
        int flags=WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
        if(notTouchable)flags|=WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
        WindowManager.LayoutParams p=new WindowManager.LayoutParams(
            w,h,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            flags,PixelFormat.TRANSLUCENT);
        p.gravity=Gravity.TOP|Gravity.LEFT;
        return p;
    }
    private void updateToolbarPosition(){
        if(toolbar==null)return;
        int sw=context.getResources().getDisplayMetrics().widthPixels;
        int sh=context.getResources().getDisplayMetrics().heightPixels;
        int x=lastBubbleX+(lastBubbleW-toolbarParams.width)/2;
        int y=lastBubbleY+lastBubbleH+dp(4);
        if(y+toolbarParams.height>sh) y=lastBubbleY-toolbarParams.height-dp(4);
        toolbarParams.x=clip(x,0,Math.max(0,sw-toolbarParams.width));
        toolbarParams.y=clip(y,0,Math.max(0,sh-toolbarParams.height));
        try{wm.updateViewLayout(toolbar,toolbarParams);}
        catch(IllegalArgumentException ignored){}
    }
    private void ensureComparison(int art){
        if(comparison!=null)return;
        int sw=context.getResources().getDisplayMetrics().widthPixels;
        pairCellSize=Math.max(48,Math.min(art,(sw-dp(20)-dp(8))/2));
        comparison=new LinearLayout(context);
        comparison.setGravity(Gravity.CENTER);
        comparison.setPadding(dp(4),dp(3),dp(4),dp(3));
        comparison.setOrientation(LinearLayout.HORIZONTAL);
        comparison.setBackground(bg(0x8C16202D,0xAA618A9B,10));
        LinearLayout left=createColumn(true);
        LinearLayout right=createColumn(false);
        comparison.addView(left,new LinearLayout.LayoutParams(pairCellSize,
            pairCellSize+dp(19)));
        LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(pairCellSize,
            pairCellSize+dp(19));
        rp.leftMargin=dp(3);
        comparison.addView(right,rp);
        comparisonParams=windowParams(pairCellSize*2+dp(11),
            pairCellSize+dp(25),true);
        wm.addView(comparison,comparisonParams);
        updateComparisonImages();
    }
    private LinearLayout createColumn(boolean canonical){
        LinearLayout col=new LinearLayout(context);
        col.setOrientation(LinearLayout.VERTICAL);
        TextView label=new TextView(context);
        label.setGravity(Gravity.CENTER);
        label.setTextColor(Color.WHITE);
        label.setTextSize(10f);
        label.setText(canonical?"Padrão #42":"");
        col.addView(label,new LinearLayout.LayoutParams(-1,dp(18)));
        if(!canonical)rightLabel=label;
        FrameLayout frame=new FrameLayout(context);
        ImageView sprite=new ImageView(context);
        sprite.setScaleType(ImageView.ScaleType.FIT_CENTER);
        sprite.setContentDescription(canonical?"Edu padrão #42":
            "Sprite selecionada para comparação");
        frame.addView(sprite,new FrameLayout.LayoutParams(
            pairCellSize,pairCellSize,Gravity.CENTER));
        EduSpriteGuideView guides=new EduSpriteGuideView(context);
        guides.setEnabledGuides(guidesVisible);
        frame.addView(guides,new FrameLayout.LayoutParams(
            pairCellSize,pairCellSize,Gravity.CENTER));
        col.addView(frame,new LinearLayout.LayoutParams(
            pairCellSize,pairCellSize));
        if(canonical){leftImage=sprite;leftGuides=guides;}
        else{rightImage=sprite;rightGuides=guides;}
        return col;
    }
    private void updateComparisonImages(){
        if(comparison==null)return;
        leftImage.setImageDrawable(atlas.frame(42));
        rightImage.setImageDrawable(atlas.frame(selectedIndex));
        rightLabel.setText(String.format(java.util.Locale.ROOT,"Quadro #%02d",selectedIndex));
    }
    private void updateComparisonPosition(){
        if(comparison==null)return;
        int sw=context.getResources().getDisplayMetrics().widthPixels;
        int sh=context.getResources().getDisplayMetrics().heightPixels;
        int x=lastBubbleX+lastBubbleW/2-comparisonParams.width/2;
        int y=lastBubbleY+lastBubbleH/2-comparisonParams.height/2;
        comparisonParams.x=clip(x,0,Math.max(0,sw-comparisonParams.width));
        comparisonParams.y=clip(y,0,Math.max(0,sh-comparisonParams.height));
        try{wm.updateViewLayout(comparison,comparisonParams);}
        catch(IllegalArgumentException ignored){}
    }
    private void removeComparison(){
        if(comparison!=null){
            try{wm.removeView(comparison);}
            catch(IllegalArgumentException ignored){}
            comparison=null;leftImage=null;rightImage=null;
            leftGuides=null;rightGuides=null;rightLabel=null;
        }
    }
    private void removeToolbar(){
        if(toolbar!=null){
            try{wm.removeView(toolbar);}
            catch(IllegalArgumentException ignored){}
            toolbar=null;toolbarParams=null;indexLabel=null;
        }
    }
    private int dp(int value){
        return Math.round(value*context.getResources().getDisplayMetrics().density);
    }
    private static int clip(int n,int min,int max){return Math.max(min,Math.min(max,n));}
}
