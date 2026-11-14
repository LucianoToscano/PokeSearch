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
        void closeAssistant();
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
    private boolean groupMode=false,playing=false;
    private int selectedGroup=0,animationPosition=0;
    private final boolean[] enabledGroups={true,true,true,true,true,true,true};
    private static final String[] GROUP_NAMES={
        "Frente","Direita","Esquerda","Arrastar","Teleporte","Pokébola","Celular"};
    private static final String[] GROUP_KEYS={
        "caminhada_frente","caminhada_direita","caminhada_esquerda",
        "arrastando","teleporte_efeito","pokebola_gesto","edu_jogando"};
    private final android.os.Handler playbackHandler=new android.os.Handler(
        android.os.Looper.getMainLooper());
    private final Runnable playbackTick=new Runnable(){
        @Override public void run(){
            if(!playing||!controlsVisible||!reviewing)return;
            if(groupMode){
                int[] frames=EduSpriteAtlas.sequence(GROUP_KEYS[selectedGroup]);
                if(frames.length==0){pausePlayback();return;}
                animationPosition=(animationPosition+1)%frames.length;
                selectedIndex=frames[animationPosition];
                listener.selected(selectedIndex);
                updateComparisonImages();updateLabel();
                playbackHandler.postDelayed(this,
                    Math.max(90,EduSpriteAtlas.durationMs(GROUP_KEYS[selectedGroup])));
            }else{
                change(1);
                playbackHandler.postDelayed(this,260L);
            }
        }
    };
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
        controlsVisible=prefs.getBoolean(PREF_CONTROLS,true);
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
        pausePlayback();
        boolean hadReview=reviewing||showComparison;
        showComparison=false;reviewing=false;
        removeComparison();
        if(hadReview)listener.resumed();
    }
    void setOverlayVisible(boolean visible){
        if(toolbar!=null)toolbar.setVisibility(visible?View.VISIBLE:View.GONE);
        if(comparison!=null)comparison.setVisibility(visible?View.VISIBLE:View.GONE);
    }
    void destroy(){
        pausePlayback();
        removeComparison();
        removeToolbar();
    }

    private void pausePlayback(){
        playing=false;
        playbackHandler.removeCallbacks(playbackTick);
    }
    private void togglePlayback(){
        if(playing){pausePlayback();updateLabel();return;}
        if(!reviewing){
            reviewing=true;
            selectedIndex=clampFrame(listener.currentFrame());
        }
        playing=true;
        if(groupMode){
            int[] frames=EduSpriteAtlas.sequence(GROUP_KEYS[selectedGroup]);
            if(frames.length>0){
                animationPosition=0;selectedIndex=frames[0];
                listener.selected(selectedIndex);
            }
        }
        updateLabel();
        playbackHandler.postDelayed(playbackTick,200L);
    }
    private void change(int increment){
        if(groupMode){
            if(!reviewing)reviewing=true;
            int index=selectedGroup;
            for(int tries=0;tries<GROUP_KEYS.length;tries++){
                index=(index+increment+GROUP_KEYS.length)%GROUP_KEYS.length;
                if(enabledGroups[index])break;
            }
            if(!enabledGroups[index])return;
            selectedGroup=index;animationPosition=0;
            int[] frames=EduSpriteAtlas.sequence(GROUP_KEYS[index]);
            if(frames.length>0){
                selectedIndex=frames[0];
                listener.selected(selectedIndex);
            }
            if(playing){
                playbackHandler.removeCallbacks(playbackTick);
                playbackHandler.postDelayed(playbackTick,
                    EduSpriteAtlas.durationMs(GROUP_KEYS[selectedGroup]));
            }
        }else{
            if(!reviewing)selectedIndex=clampFrame(listener.currentFrame());
            selectedIndex=(selectedIndex+increment+EduSpriteAtlas.COLLECTION_COUNT)
                %EduSpriteAtlas.COLLECTION_COUNT;
            reviewing=true;
            listener.selected(selectedIndex);
        }
        updateComparisonImages();updateLabel();
    }
    private void showGroupChoices(){
        final boolean[] snapshot=enabledGroups.clone();
        android.content.Context themed=new android.view.ContextThemeWrapper(
            context,android.R.style.Theme_Material_Dialog_Alert);
        android.app.AlertDialog dialog=new android.app.AlertDialog.Builder(themed)
            .setTitle("Movimentos para reproduzir")
            .setMultiChoiceItems(GROUP_NAMES,snapshot,(dlg,index,checked)->
                snapshot[index]=checked)
            .setNegativeButton("Cancelar",null)
            .setNeutralButton("Quadros individuais",(dlg,which)->{
                pausePlayback();groupMode=false;updateLabel();
            })
            .setPositiveButton("Usar grupos",(dlg,which)->{
                int first=-1;
                for(int i=0;i<snapshot.length;i++)if(snapshot[i]&&first<0)first=i;
                if(first<0){
                    pausePlayback();groupMode=false;updateLabel();return;
                }
                System.arraycopy(snapshot,0,enabledGroups,0,snapshot.length);
                groupMode=true;selectedGroup=first;animationPosition=0;
                reviewing=true;
                int[] frames=EduSpriteAtlas.sequence(GROUP_KEYS[selectedGroup]);
                if(frames.length>0){
                    selectedIndex=frames[0];listener.selected(selectedIndex);
                }
                updateComparisonImages();updateLabel();
                if(!playing)togglePlayback();
            }).create();
        if(dialog.getWindow()!=null)dialog.getWindow().setType(
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY);
        dialog.show();
    }
    private void toggleGuides(){
        if(!showComparison)toggleCompare();
        setGuidesVisible(!guidesVisible);
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
        String[] icons={"◀️","⏯️","🎦","▶️","👬","📐","❌"};
        String[] names={"Anterior","Reproduzir ou pausar",
            "Escolher movimentos agrupados","Próximo","Comparar com padrão",
            "Linhas de medidas","Fechar assistente Edu"};
        for(int i=0;i<icons.length;i++){
            final int index=i;
            TextView button=control(icons[i],names[i]);
            toolbar.addView(button,new LinearLayout.LayoutParams(dp(32),dp(34)));
            button.setOnClickListener(v->{
                switch(index){
                    case 0:change(-1);break;
                    case 1:togglePlayback();break;
                    case 2:showGroupChoices();break;
                    case 3:change(1);break;
                    case 4:toggleCompare();break;
                    case 5:toggleGuides();break;
                    case 6:listener.closeAssistant();break;
                }
            });
        }
        indexLabel=new TextView(context);
        indexLabel.setTextColor(Color.WHITE);
        indexLabel.setTextSize(9f);
        indexLabel.setGravity(Gravity.CENTER);
        indexLabel.setContentDescription("Auto ou número da sprite. Toque para retornar ao automático.");
        toolbar.addView(indexLabel,new LinearLayout.LayoutParams(dp(43),dp(34)));
        indexLabel.setOnClickListener(v->{stopReview();updateLabel();});
        updateLabel();
        toolbarParams=windowParams(dp(273),dp(42),false);
        wm.addView(toolbar,toolbarParams);
    }
    private void updateLabel(){
        if(indexLabel!=null){
            indexLabel.setText(reviewing?
                String.format(java.util.Locale.ROOT,"#%02d",selectedIndex):"Auto");
            indexLabel.setContentDescription(reviewing?
                (groupMode?"Grupo "+GROUP_NAMES[selectedGroup]+"; ":"")+
                    "Quadro "+selectedIndex+"; toque para voltar ao Auto":
                "Animação automática. Toque para manter o modo Auto.");
        }
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
        comparison.setOrientation(LinearLayout.VERTICAL);
        comparison.setBackground(bg(0x8C16202D,0xAA618A9B,10));
        LinearLayout pair=new LinearLayout(context);
        pair.setGravity(Gravity.CENTER);
        pair.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout left=createColumn(true);
        LinearLayout right=createColumn(false);
        pair.addView(left,new LinearLayout.LayoutParams(pairCellSize,
            pairCellSize+dp(19)));
        LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(pairCellSize,
            pairCellSize+dp(19));
        rp.leftMargin=dp(3);
        pair.addView(right,rp);
        comparison.addView(pair,new LinearLayout.LayoutParams(-1,
            pairCellSize+dp(19)));
        // A comparação é visual: percentuais baseados em cores variam com
        // expressão, orientação, roupas e objetos e geram falsos alarmes.
        // O painel deve permanecer compacto e nunca esconder os botões.
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
        android.graphics.drawable.Drawable reference=atlas.frame(42);
        android.graphics.drawable.Drawable chosen=atlas.frame(selectedIndex);
        leftImage.setImageDrawable(reference);
        rightImage.setImageDrawable(chosen);
        rightLabel.setText(String.format(java.util.Locale.ROOT,"Quadro #%02d",selectedIndex));

    }
    private void updateComparisonPosition(){
        if(comparison==null)return;
        int sw=context.getResources().getDisplayMetrics().widthPixels;
        int sh=context.getResources().getDisplayMetrics().heightPixels;
        int x=lastBubbleX+lastBubbleW/2-comparisonParams.width/2;
        // O painel nunca deve cobrir a sprite, a barra de navegação ou seus toques.
        // Prefira a área acima do Edu; se não couber, use a área abaixo.
        int gap=dp(8);
        int above=lastBubbleY-comparisonParams.height-gap;
        int below=lastBubbleY+lastBubbleH+gap;
        int y;
        if(above>=0){
            y=above;
        }else if(toolbarParams!=null && below+toolbarParams.height+gap+
                 comparisonParams.height<=sh){
            y=below+toolbarParams.height+gap;
        }else if(below+comparisonParams.height<=sh){
            y=below;
        }else{
            // Em telas pequenas, mantenha o painel no extremo mais livre.
            int topSpace=Math.max(0,lastBubbleY);
            int bottomSpace=Math.max(0,sh-below);
            y=topSpace>=bottomSpace?0:Math.max(0,sh-comparisonParams.height);
        }
        // Se a barra estiver acima da sprite, mantenha o comparador abaixo dela.
        if(toolbarParams!=null && toolbarParams.y<lastBubbleY &&
           y<toolbarParams.y+toolbarParams.height &&
           y+comparisonParams.height>toolbarParams.y){
            y=Math.min(sh-comparisonParams.height,
                toolbarParams.y+toolbarParams.height+gap);
        }
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
