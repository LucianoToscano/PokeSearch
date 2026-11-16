package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.drawable.GradientDrawable;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Menu overlay in the compact visual language of the owner's PokeSearch.
 * Uses TYPE_ACCESSIBILITY_OVERLAY; does not modify PokeSearch or PGSharp.
 */
final class PgsAutoMenus {
    interface Actions {
        void teach(String species);
        void closeOverlay();
        void testNotification(String type);
        void setWatchEnabled(boolean enabled);
        void modelsChanged();
        void appearanceChanged();
        void previewTapIndicator();
        void previewSprites();
        void choosePoint(String mode);
        void selectSprites();
        void sequencePick(String type,int index,boolean destination);
        void sequencePreview();
        void autoDetectHost();
        void startNightSupervisor();
        void stopNightSupervisor();
        boolean nightSupervisorActive();
        void startSmartSearch(String goal);
        void startSearch();
        void sequenceRun();
        void sequenceStop();
        void sequenceChanged();
        boolean sequenceRunning();
    }
    private final Context context;
    private final WindowManager wm;
    private final Actions actions;
    private View toolbar,panel;
    private ImageView bellShiny;
    private android.media.Ringtone tonePreview;
    private void stopTonePreview(){
        if(tonePreview!=null){
            try{tonePreview.stop();}catch(Exception ignored){}
            tonePreview=null;
        }
    }
    private void markChosen(Button b,boolean chosen){
        b.setSelected(chosen);
        b.setTextColor(chosen?0xFF70E6A6:fg());
        b.setBackground(bg(chosen?0xAA295E49:0x55394A5C,
            chosen?0xFF70E6A6:0x2CFFFFFF,6));
    }
    private int anchorX,anchorY;
    private int panelEstimatedHeightDp=315;
    private static final int BG=0xEC10151F, TILE=0xD9222A38, BORDER=0x33FFFFFF;
    private static final int WHITE=0xFFF4F7FF, SECONDARY=0xFFD0D6E0,GOLD=0xFFFFD47B;
    PgsAutoMenus(Context c,WindowManager w,Actions a){context=c;wm=w;actions=a;}
    private int dp(float value){return Math.round(value*context.getResources().getDisplayMetrics().density);}
    private Point size(){Point p=new Point();wm.getDefaultDisplay().getRealSize(p);return p;}
    // Exact readable surface shared with the Pokébola/Doce Raro menus;
    // NO PGS-local 90% alpha override of the user's menuTransparency.
    private int panelFill(){return PgsAutoMenuStyle.read(context).panelFill(context);}
    private GradientDrawable bg(int fill,int stroke,int radius){
        GradientDrawable d=new GradientDrawable();d.setColor(fill);d.setCornerRadius(dp(radius));
        if(stroke!=0)d.setStroke(dp(1),stroke);return d;
    }
    private int fg(){return PgsAutoMenuStyle.read(context).foreground();}
    private TextView label(String value,int sp,boolean strong){
        TextView t=new TextView(context);t.setText(value);t.setTextSize(sp);
        t.setTextColor(fg());t.setGravity(Gravity.CENTER_VERTICAL);
        t.setIncludeFontPadding(false);
        if(strong)t.setTypeface(null,android.graphics.Typeface.BOLD);
        return t;
    }
    private Button button(String value,int sp){
        Button b=new Button(context);b.setAllCaps(false);b.setText(value);b.setTextSize(sp);
        b.setTextColor(fg());b.setMinHeight(0);b.setMinimumHeight(0);
        b.setMinWidth(0);b.setMinimumWidth(0);b.setPadding(dp(5),0,dp(5),0);
        PgsAutoMenuStyle v=PgsAutoMenuStyle.read(context);
        b.setBackground(bg(v.tileFill(),v.tileStroke(),PgsAutoMenuStyle.CORNER_DP));return b;
    }
    /** LT369: arraste direto na linha após pressão longa, sem setas/≡.
     * Nenhum gesto é enviado ao jogo. A alteração só é persistida no soltar.
     * Os comandos acessíveis substituem setas visíveis no TalkBack. */
    private interface RowMove {boolean to(int index);}
    private ScrollView parentScroll(View view){
        android.view.ViewParent parent=view.getParent();
        while(parent!=null){
            if(parent instanceof ScrollView)return (ScrollView)parent;
            parent=parent.getParent();
        }
        return null;
    }
    private int nearestRow(List<View> rows,float fingerY,int previous){
        int target=previous;
        float best=Float.MAX_VALUE;
        for(int i=0;i<rows.size();i++){
            View row=rows.get(i);
            if(!row.isShown()||row.getHeight()<=0)continue;
            int[] screen=new int[2];
            row.getLocationOnScreen(screen);
            float center=screen[1]+row.getHeight()/2f;
            float distance=Math.abs(fingerY-center);
            if(distance<best){best=distance;target=i;}
        }
        return target;
    }
    private void holdToReorder(View touch,View row,List<View> ordered,
        int from,RowMove move,Runnable refresh){
        final float[] downY={0f};
        final boolean[] dragging={false};
        touch.setClickable(true);
        touch.setLongClickable(true);
        touch.setOnLongClickListener(v->{
            dragging[0]=true;
            row.setAlpha(.83f);
            row.setElevation(dp(8));
            row.performHapticFeedback(
                android.view.HapticFeedbackConstants.LONG_PRESS);
            android.view.ViewParent p=touch.getParent();
            if(p!=null)p.requestDisallowInterceptTouchEvent(true);
            return true;
        });
        touch.setOnTouchListener((v,event)->{
            switch(event.getActionMasked()){
                case MotionEvent.ACTION_DOWN:
                    downY[0]=event.getRawY();
                    return false; // Android mantém toque curto e long press nativos.
                case MotionEvent.ACTION_MOVE:
                    if(!dragging[0])return false;
                    row.setTranslationY(event.getRawY()-downY[0]);
                    ScrollView scroll=parentScroll(touch);
                    if(scroll!=null){
                        int[] loc=new int[2];scroll.getLocationOnScreen(loc);
                        if(event.getRawY()<loc[1]+dp(24))
                            scroll.scrollBy(0,-dp(12));
                        else if(event.getRawY()>loc[1]+scroll.getHeight()-dp(24))
                            scroll.scrollBy(0,dp(12));
                    }
                    return true;
                case MotionEvent.ACTION_UP:
                    if(!dragging[0])return false; // toque curto continua editando.
                    // Restaurar a posição ANTES de medir os centros.
                    // Enquanto a linha segue o dedo, ela pareceria sempre
                    // o alvo mais próximo, impedindo qualquer reordenação.
                    dragging[0]=false;
                    row.setTranslationY(0f);
                    row.setAlpha(1f);row.setElevation(0f);
                    int target=nearestRow(ordered,event.getRawY(),from);
                    if(target!=from){
                        if(move.to(target))refresh.run();
                        else Toast.makeText(context,"Não foi possível mover esta etapa.",
                            Toast.LENGTH_SHORT).show();
                    }
                    return true;
                case MotionEvent.ACTION_CANCEL:
                    if(!dragging[0])return false;
                    dragging[0]=false;
                    row.setTranslationY(0f);
                    row.setAlpha(1f);row.setElevation(0f);
                    return true;
                default:return false;
            }
        });
        touch.setAccessibilityDelegate(new View.AccessibilityDelegate(){
            @Override public void onInitializeAccessibilityNodeInfo(View host,
                android.view.accessibility.AccessibilityNodeInfo info){
                super.onInitializeAccessibilityNodeInfo(host,info);
                info.addAction(android.view.accessibility.AccessibilityNodeInfo
                    .AccessibilityAction.ACTION_SCROLL_FORWARD);
                info.addAction(android.view.accessibility.AccessibilityNodeInfo
                    .AccessibilityAction.ACTION_SCROLL_BACKWARD);
            }
            @Override public boolean performAccessibilityAction(View host,
                int action,android.os.Bundle args){
                int target=action==
                    android.view.accessibility.AccessibilityNodeInfo.ACTION_SCROLL_FORWARD?
                        from+1:action==
                    android.view.accessibility.AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD?
                        from-1:-1;
                if(target>=0&&target<ordered.size()){
                    if(move.to(target)){refresh.run();return true;}
                    return false;
                }
                return super.performAccessibilityAction(host,action,args);
            }
        });
    }

    private void markAlertIcon(ImageButton icon,boolean active){
        PgsAutoMenuStyle v=PgsAutoMenuStyle.read(context);
        icon.setBackground(bg(active?0x773A504B:v.tileFill(),
            active?0xFF7DC8B4:v.tileStroke(),PgsAutoMenuStyle.CORNER_DP));
        icon.setColorFilter(fg());
        icon.setSelected(active);
    }
    private ImageButton imageButton(int image,String description,int artSize){
        ImageButton b=new ImageButton(context);
        b.setImageResource(image);
        b.setColorFilter(fg());
        b.setScaleType(ImageView.ScaleType.FIT_CENTER);
        b.setContentDescription(description);
        b.setPadding(dp(artSize),dp(artSize),dp(artSize),dp(artSize));
        b.setMinimumWidth(0);b.setMinimumHeight(0);
        PgsAutoMenuStyle v=PgsAutoMenuStyle.read(context);
        b.setBackground(bg(v.tileFill(),v.tileStroke(),PgsAutoMenuStyle.CORNER_DP));
        return b;
    }
    private ImageButton trashButton(String desc){
        ImageButton icon=new ImageButton(context);
        icon.setImageResource(PgsAutoMenuStyle.read(context).light?
            R.drawable.lixeira_preta:R.drawable.lixeira_branca);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        icon.setPadding(dp(8),dp(8),dp(8),dp(8));
        PgsAutoMenuStyle v=PgsAutoMenuStyle.read(context);
        icon.setBackground(bg(v.tileFill(),v.tileStroke(),PgsAutoMenuStyle.CORNER_DP));
        icon.setContentDescription(desc);
        return icon;
    }
    private LinearLayout vertical(){LinearLayout l=new LinearLayout(context);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private LinearLayout horizontal(){LinearLayout l=new LinearLayout(context);l.setGravity(Gravity.CENTER_VERTICAL);return l;}
    private LinearLayout.LayoutParams margined(int w,int h,int top){
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(w,h);p.topMargin=dp(top);return p;
    }
    /** LT369: a bolha abre DIRETAMENTE o único painel, sem a fileira antiga
     * Buscar/Tempo/Sino/Personalização/Fechar. Tocar outra vez apenas retrai. */
    void toggle(int x,int y){
        anchorX=x;anchorY=y;
        if(isOpen()){dismissAll();return;}
        showCentral(0);
    }
    void dismissAll(){hidePanel();hideToolbar();}
    private void hidePanel(){
        stopTonePreview();
        if(panel!=null){try{wm.removeView(panel);}catch(Exception ignored){}panel=null;}
        if(toolbar!=null)toolbar.setVisibility(View.VISIBLE);
        refreshBellShiny();
    }
    private void hideToolbar(){if(toolbar!=null){try{wm.removeView(toolbar);}catch(Exception ignored){}toolbar=null;}bellShiny=null;}
    boolean isOpen(){return panel!=null||toolbar!=null;}
    // A barra compacta pode permanecer visível enquanto a busca funciona;
    // apenas um submenu com miniaturas pode contaminar a captura.
    boolean hasPanel(){return panel!=null;}
    // Toque na bolha com submenu aberto volta à barra, sem desligar buscas.
    // Com somente a barra aberta, um segundo toque a retrai (padrão P1/P2).
    void collapseOneLevel(){
        if(panel!=null)hidePanel();
        else if(toolbar!=null)hideToolbar();
    }

    /** Reposiciona janelas EXISTENTES quando a bolha se move/roda a tela.
     * NUNCA chama dismissAll nem recria menu durante o arraste.
     */
    void reanchor(int x,int y){
        anchorX=x;anchorY=y;
        // LT369: a janela principal fica ancorada à bolha diretamente.
        // Reposicionar nunca abre um segundo menu nem perde campos editados.
        if(toolbar!=null&&toolbar.getLayoutParams() instanceof WindowManager.LayoutParams){
            WindowManager.LayoutParams lp=(WindowManager.LayoutParams)toolbar.getLayoutParams();
            positionToolbar(lp,x,y,PgsAutoMenuStyle.read(context));
            try{wm.updateViewLayout(toolbar,lp);}catch(Exception ignored){}
        }
        if(panel!=null&&panel.getLayoutParams() instanceof WindowManager.LayoutParams){
            WindowManager.LayoutParams pp=(WindowManager.LayoutParams)panel.getLayoutParams();
            int width=pp.width>0?pp.width:Math.max(dp(80),panel.getWidth());
            int height=panel.getHeight()>0?panel.getHeight():dp(panelEstimatedHeightDp);
            int[] place=positionPanel(width,height);
            pp.x=place[0];pp.y=place[1];
            try{wm.updateViewLayout(panel,pp);}catch(Exception ignored){}
        }
    }


    /** Shiny sits in the empty bell bowl, not over the bell's lower rim. */
    private void refreshBellShiny(){
        if(bellShiny==null)return;
        String state=PgsAutoNotificationPolicy.mode(
            PgsAutoNotificationPolicy.SHINY,
            context.getSharedPreferences("pgs_auto_settings_v1",Context.MODE_PRIVATE)
                .getString(PgsAutoNotificationPolicy.SHINY,"strong"));
        bellShiny.setVisibility("off".equals(state)?View.GONE:View.VISIBLE);
        bellShiny.setColorFilter(0xFFFFD47B);
    }

    // LT347: exactly the dock.html controls-window 30dp individual tiles,
    // 16dp artwork, 2dp base gap, 5dp rounded corners; NO enclosing capsule.
    // Every layout/color value is read from the SAME prefs.visualPrefsJson as P1.
    private static final int TOOL_CELL_DP=PgsAutoMenuStyle.CELL_DP;
    void showToolbar(int x,int y){
        dismissAll();anchorX=x;anchorY=y;
        PgsAutoMenuStyle visual=PgsAutoMenuStyle.read(context);
        LinearLayout bar=horizontal();
        bar.setOrientation(visual.vertical?LinearLayout.VERTICAL:LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER);
        bar.setPadding(0,0,0,0);
        bar.setBackgroundColor(Color.TRANSPARENT);
        int[] icons={R.drawable.pgs_menu_search,R.drawable.pgs_menu_timer,
            R.drawable.ic_bell_outline,R.drawable.pgs_menu_customize,
            R.drawable.pgs_menu_close};
        String[] descriptions={"Buscar Pokémon","Tempos","Notificações",
            "Personalização da Busca Pokémon","Fechar Buscar Pokémon"};
        Runnable[] handlers={this::showSearch,this::showTime,
            this::showNotifications,this::showAppearance,
            ()->{dismissAll();actions.closeOverlay();}};
        int gap=visual.itemGapDp();
        for(int i=0;i<icons.length;i++){
            final int n=i;
            ImageButton icon=imageButton(icons[i],descriptions[i],7);
            // Exact P1/P2 SVG meaning: gear+pencil. Red is reserved for X.
            if(i==4)icon.setColorFilter(0xFFFF596C);
            int padding=(PgsAutoMenuStyle.CELL_DP-PgsAutoMenuStyle.ART_DP)/2;
            icon.setPadding(dp(padding),dp(padding),dp(padding),dp(padding));
            LinearLayout.LayoutParams tileParams=new LinearLayout.LayoutParams(
                dp(TOOL_CELL_DP),dp(TOOL_CELL_DP));
            if(i>0){
                if(visual.vertical)tileParams.topMargin=dp(gap);
                else tileParams.leftMargin=dp(gap);
            }
            if(i==2){
                // Shiny is physically INSIDE the bell, never a detached star.
                FrameLayout tile=new FrameLayout(context);
                tile.addView(icon,new FrameLayout.LayoutParams(-1,-1));
                ImageView shiny=new ImageView(context);
                shiny.setImageResource(R.drawable.pgs_shiny_spark);
                shiny.setScaleType(ImageView.ScaleType.FIT_CENTER);
                // Bell outline drawable 24-unit viewport is painted inside
                // the central 16dp inset of the 30dp tile. These 6dp sparkles
                // occupy the bowl at y≈13.5dp, above its bottom y≈18.3dp.
                FrameLayout.LayoutParams inner=new FrameLayout.LayoutParams(
                    dp(8),dp(8),Gravity.CENTER);
                inner.topMargin=dp(-2);
                shiny.setClickable(false);shiny.setFocusable(false);
                bellShiny=shiny;
                refreshBellShiny();
                tile.addView(shiny,inner);
                tile.setContentDescription("Notificações e Shiny dentro do sino");
                tile.setOnClickListener(v->handlers[n].run());
                icon.setOnClickListener(v->handlers[n].run());
                bar.addView(tile,tileParams);
            }else{
                bar.addView(icon,tileParams);
                icon.setOnClickListener(v->handlers[n].run());
            }
        }
        toolbar=bar;
        Point screen=size();
        int width=dp(visual.vertical?TOOL_CELL_DP:5*TOOL_CELL_DP+4*gap);
        int height=dp(visual.vertical?5*TOOL_CELL_DP+4*gap:TOOL_CELL_DP);
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(width,height,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.TOP|Gravity.LEFT;
        positionToolbar(lp,x,y,visual);
        applyNativeBlur(lp,visual.menuBlur);
        try{wm.addView(toolbar,lp);}catch(Exception ignored){toolbar=null;}
    }
    // LT349b: same adjacent-side policy as Pokébolas. The input x is the
    // center of the right-gravity bubble, y is its top (absolute screen px).
    private void positionToolbar(WindowManager.LayoutParams lp,int x,int y,
            PgsAutoMenuStyle visual){
        Point screen=size();
        int width=lp.width,height=lp.height,margin=dp(6);
        int bubbleSize=dp(PgsAutoVisualState.TOUCH_DP);
        int bubbleLeft=x-bubbleSize/2,bubbleRight=x+bubbleSize/2;
        int gap=dp(Math.max(3,4+visual.gearMenuGap));
        int right=bubbleRight+gap,left=bubbleLeft-gap-width;
        boolean rightFits=right+width<=screen.x-margin;
        boolean leftFits=left>=margin;
        boolean preferRight=x<=screen.x/2;
        int menuX,menuY;
        if((preferRight&&rightFits)||(!leftFits&&rightFits)){
            menuX=right;
            menuY=y+(bubbleSize-height)/2;
        }else if(leftFits){
            menuX=left;
            menuY=y+(bubbleSize-height)/2;
        }else{
            // Narrow display: use above/below without covering the bubble.
            menuX=x-width/2;
            int above=y-height-dp(4),below=y+bubbleSize+dp(4);
            menuY=below+height<=screen.y-margin?below:
                above>=margin?above:Math.max(margin,(screen.y-height)/2);
        }
        lp.x=Math.max(margin,Math.min(Math.max(margin,screen.x-width-margin),
            menuX+dp(visual.menuOffsetX)));
        lp.y=Math.max(margin,Math.min(Math.max(margin,screen.y-height-margin),
            menuY+dp(visual.menuOffsetY)));
    }

    // Popups stay tied to the VISIBLE toolbar and never appear disconnected
    // from the Auto Click control, even after left/right side flipping.
    // LT369: popup no lado do próprio ícone de mão; nenhum toolbar intermediário.
    private int[] positionPanel(int width,int height){
        Point screen=size();
        int margin=dp(8),gap=dp(6);
        int diameter=dp(PgsAutoVisualState.TOUCH_DP);
        int leftEdge=anchorX-diameter/2;
        int rightEdge=anchorX+diameter/2;
        int right=rightEdge+gap,left=leftEdge-gap-width;
        boolean rightFits=right+width<=screen.x-margin;
        boolean leftFits=left>=margin;
        boolean preferRight=anchorX<=screen.x/2;
        int px;
        if((preferRight&&rightFits)||(!leftFits&&rightFits))px=right;
        else if(leftFits)px=left;
        else px=anchorX-width/2;
        int py=anchorY;
        // Nunca perder controles acima/abaixo da borda visível.
        return new int[]{
            Math.max(margin,Math.min(Math.max(margin,screen.x-width-margin),px)),
            Math.max(margin,Math.min(Math.max(margin,screen.y-height-margin),py))
        };
    }

    private void applyNativeBlur(WindowManager.LayoutParams lp,int radiusDp){
        // Android can decline cross-app blur; the translucent tile remains
        // legible without needing a separate black background.
        if(Build.VERSION.SDK_INT>=31&&radiusDp>0){
            lp.flags|=WindowManager.LayoutParams.FLAG_BLUR_BEHIND;
            lp.setBlurBehindRadius(dp(radiusDp));
        }
    }
    private LinearLayout panelRoot(String heading,String right){
        LinearLayout root=vertical();root.setPadding(dp(7),dp(6),dp(7),dp(7));
        root.setBackground(bg(panelFill(),
            PgsAutoMenuStyle.read(context).tileStroke(),10));
        LinearLayout head=horizontal();
        TextView title=label(heading,12,true);
        head.addView(title,new LinearLayout.LayoutParams(0,dp(28),1));
        if(right!=null){TextView meta=label(right,11,true);meta.setTextColor(GOLD);head.addView(meta);}
        Button exit=button("×",17);exit.setTextColor(0xFFFF596C);
        LinearLayout.LayoutParams x=new LinearLayout.LayoutParams(dp(26),dp(27));x.leftMargin=dp(4);
        head.addView(exit,x);exit.setOnClickListener(v->hidePanel());
        root.addView(head);
        return root;
    }
    // Geometria de referência: dock.html standardPanel, não painel gigante.
    private void mount(LinearLayout root){mount(root,240,315);}
    private void mount(LinearLayout root,int preferredWidthDp,int estimatedHeightDp){
        hidePanel();panel=root;
        PgsAutoMenuStyle visual=PgsAutoMenuStyle.read(context);
        Point screen=size();int width=Math.max(dp(80),Math.min(screen.x-dp(20),
            dp(Math.min(preferredWidthDp,visual.popupWidth))));
        // A altura calculada por estimativa cortava EditTexts (Samsung font scale)
        // e colocava o painel sobre a barra. Medir o conteúdo real antes do
        // primeiro posicionamento e reajustar depois do layout/teclado.
        int maxHeight=Math.max(dp(140),Math.min(screen.y-dp(24),
            dp(visual.popupHeight)));
        root.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(maxHeight,View.MeasureSpec.AT_MOST));
        int measured=Math.max(dp(28),Math.min(maxHeight,root.getMeasuredHeight()));
        panelEstimatedHeightDp=Math.round(measured/
            context.getResources().getDisplayMetrics().density);
        int[] placement=positionPanel(width,measured);
        // A nonmodal overlay must NEVER prevent tapping the game elsewhere.
        // Only menus that actually contain text input take keyboard focus.
        // WATCH_OUTSIDE_TOUCH retracts the popup while delivering the outside
        // tap to the underlying app without creating an invisible blocker.
        int flags=WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL|
            WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH;
        if(!hasTextInput(root))
            flags|=WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(width,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            flags,
            PixelFormat.TRANSLUCENT);
        root.setOnTouchListener((v,event)->{
            if(event.getActionMasked()==MotionEvent.ACTION_OUTSIDE){
                hidePanel();
                return false; // Outside tap still belongs to the game/app.
            }
            return false;
        });
        lp.gravity=Gravity.LEFT|Gravity.TOP;
        lp.x=placement[0];lp.y=placement[1];
        lp.softInputMode=WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        applyNativeBlur(lp,visual.menuBlur);
        try{
            wm.addView(panel,lp);
            final View opened=panel;
            opened.post(()->{
                if(panel==opened)reanchor(anchorX,anchorY);
            });
        }catch(Exception e){
            panel=null;
            if(toolbar!=null)toolbar.setVisibility(View.VISIBLE);
            Toast.makeText(context,"Não foi possível abrir menu: "+e.getMessage(),Toast.LENGTH_LONG).show();
        }
    }
    private boolean hasTextInput(View root){
        if(root instanceof EditText)return true;
        if(root instanceof android.view.ViewGroup){
            android.view.ViewGroup group=(android.view.ViewGroup)root;
            for(int i=0;i<group.getChildCount();i++)
                if(hasTextInput(group.getChildAt(i)))return true;
        }
        return false;
    }
    private List<PgsAutoTemplateStore.Model> imagesFor(PgsAutoCatalog.Pokemon p){
        List<PgsAutoTemplateStore.Model> result=new ArrayList<>();
        String profile=PgsAutoHostSettings.current(context);
        for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.list(context))
            if(PgsAutoHostPolicy.templateBelongsTo(model.hostProfile,profile)&&
                PgsAutoCatalog.findNumber(context,model.name)==p.number)
                result.add(model);
        return result;
    }

    /** Nenhum modelo desaparece ao desmarcar uma espécie. Só o botão Excluir remove PNG. */
    private void showModelActions(PgsAutoCatalog.Pokemon pokemon,PgsAutoTemplateStore.Model model){
        LinearLayout root=panelRoot(pokemon.name,null);
        try{
            ImageView preview=new ImageView(context);
            preview.setImageBitmap(PgsAutoTemplateStore.decode(context,model));
            preview.setScaleType(ImageView.ScaleType.FIT_CENTER);
            LinearLayout.LayoutParams pp=margined(-1,dp(74),5);
            root.addView(preview,pp);
        }catch(Exception ignored){}
        TextView modelOrigin=label(model.builtIn?
            "Nativa · "+model.nativeForm+" / "+model.nativeVariant:
            "Minha amostra · "+PgsAutoHostPolicy.displayLabel(model.hostProfile),10,false);
        modelOrigin.setSingleLine(true);
        modelOrigin.setEllipsize(android.text.TextUtils.TruncateAt.END);
        modelOrigin.setContentDescription(model.builtIn?
            "Modelo nativo validado, forma "+model.nativeForm+", variante "+model.nativeVariant:
            "Modelo pessoal cadastrado no perfil "+
                PgsAutoHostPolicy.displayLabel(model.hostProfile));
        root.addView(modelOrigin,margined(-1,dp(18),3));
        if(!model.builtIn){
            ImageButton delete=trashButton("Excluir esta imagem cadastrada");
            LinearLayout.LayoutParams trashParams=margined(dp(39),dp(37),5);
            trashParams.gravity=Gravity.CENTER_HORIZONTAL;
            root.addView(delete,trashParams);
            delete.setOnClickListener(v->{
                PgsAutoTemplateStore.delete(context,model.id);
                actions.modelsChanged();
                showSearch();
            });
        }
        Button another=button("＋ Selecionar outra imagem",12);
        root.addView(another,margined(-1,dp(37),4));
        another.setOnClickListener(v->{
            dismissAll();actions.teach(pokemon.name);
        });
        Button back=button("Voltar",12);
        root.addView(back,margined(-1,dp(34),4));
        back.setOnClickListener(v->showSearch());
        mount(root);
    }

    private void showAllModels(PgsAutoCatalog.Pokemon pokemon){
        LinearLayout root=panelRoot(pokemon.name,null);
        ScrollView scroll=new ScrollView(context);
        LinearLayout rows=vertical();
        for(PgsAutoTemplateStore.Model model:imagesFor(pokemon)){
            LinearLayout line=horizontal();
            ImageView preview=new ImageView(context);
            try{preview.setImageBitmap(PgsAutoTemplateStore.decode(context,model));}
            catch(Exception ignored){}
            preview.setScaleType(ImageView.ScaleType.FIT_CENTER);
            line.addView(preview,new LinearLayout.LayoutParams(dp(35),dp(35)));
            TextView name=label(model.builtIn?
                "Nativa: "+model.nativeForm+" · "+model.nativeVariant:
                "Minha sprite · "+PgsAutoHostPolicy.shortLabel(model.hostProfile),11,false);
            name.setSingleLine(true);
            name.setEllipsize(android.text.TextUtils.TruncateAt.END);
            line.addView(name,new LinearLayout.LayoutParams(0,dp(35),1));
            View details=model.builtIn?button("◎",13):trashButton("Excluir esta imagem");
            details.setContentDescription(model.builtIn?"Ver modelo nativo":"Gerenciar minha sprite");
            line.addView(details,new LinearLayout.LayoutParams(dp(30),dp(35)));
            details.setOnClickListener(v->showModelActions(pokemon,model));
            rows.addView(line,margined(-1,dp(41),2));
            line.setOnClickListener(v->showModelActions(pokemon,model));
        }
        scroll.addView(rows);
        root.addView(scroll,margined(-1,dp(175),5));
        Button another=button("＋ Outra imagem",11);
        root.addView(another,margined(-1,dp(34),3));
        another.setOnClickListener(v->{dismissAll();actions.teach(pokemon.name);});
        mount(root,265,265);
    }

    // LT368 — Uma janela com três ABAS internas. O overlay mantém a toolbar
    // original P1/P2: nenhum sexto ícone, painel duplicado ou gesto implícito.
    private boolean centralAdvanced=false;
    private int centralStep=-1;
    private boolean centralManualHost=false;
    void showSearch(){showCentral(0);}

    private void showCentral(int selectedTab){
        LinearLayout root=panelRoot("BUSCA INTELIGENTE",
            PgsAutoHostPolicy.shortLabel(PgsAutoHostSettings.current(context)));
        LinearLayout tabs=horizontal();
        String[] names={"Pokémon","Ação","Ajustes"};
        for(int i=0;i<names.length;i++){
            final int tab=i;
            Button b=button(names[i],10);
            markChosen(b,i==selectedTab);
            b.setContentDescription("Aba "+names[i]);
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(30),1);
            if(i>0)lp.leftMargin=dp(2);
            tabs.addView(b,lp);
            b.setOnClickListener(v->showCentral(tab));
        }
        root.addView(tabs,margined(-1,dp(30),3));
        // LT370: one vertical scrolling area for ALL tabs, no nested scroll.
        // Status and Start remain fixed below it on compact screens.
        LinearLayout body=vertical();
        if(selectedTab==0)appendCentralPokemon(body);
        else if(selectedTab==1)appendCentralActions(body);
        else appendCentralSettings(body);
        ScrollView content=new ScrollView(context);
        content.setFillViewport(false);
        content.setVerticalScrollBarEnabled(false);
        content.addView(body);
        int available=PgsAutoMenuStyle.read(context).popupHeight;
        root.addView(content,margined(-1,
            dp(Math.max(55,available-145)),3));

        TextView status=label("Estado: "+PgsAutoClickService.searchStatus(),9,false);
        status.setSingleLine(true);
        status.setEllipsize(android.text.TextUtils.TruncateAt.END);
        root.addView(status,margined(-1,dp(18),3));
        LinearLayout footer=horizontal();
        Button previous=button(selectedTab==0?"◎ Prévia":
            selectedTab==1?"◎ Prévia":"← Ação",10);
        previous.setOnClickListener(v->{
            if(selectedTab==2)showCentral(1);
            else if(PgsSmartSearchSettings.SEQUENCE.equals(
                    PgsSmartSearchSettings.mode(context))){
                dismissAll();actions.sequencePreview();
            }else{dismissAll();actions.previewSprites();}
        });
        footer.addView(previous,new LinearLayout.LayoutParams(0,dp(31),1));
        Button main=button(selectedTab==0?"→ Ação":
            actions.sequenceRunning()?"■ Parar":"▷ Iniciar",11);
        LinearLayout.LayoutParams mainLp=new LinearLayout.LayoutParams(0,dp(31),1);
        mainLp.leftMargin=dp(3);footer.addView(main,mainLp);
        main.setOnClickListener(v->{
            if(selectedTab==0){showCentral(1);return;}
            if(actions.sequenceRunning()){actions.sequenceStop();showCentral(1);return;}
            startCentral();
        });
        root.addView(footer,margined(-1,dp(31),3));
        mount(root,240,385);
    }

    private void appendCentralPokemon(LinearLayout root){
        // LT370: automatic recognition is an optional two-frame visual probe.
        // Manual host profiles stay behind a compact fall-back expander.
        LinearLayout autoRow=horizontal();
        TextView hostLabel=label("Interface: "+
            PgsAutoHostPolicy.displayLabel(PgsAutoHostSettings.current(context)),9,false);
        hostLabel.setSingleLine(true);
        hostLabel.setEllipsize(android.text.TextUtils.TruncateAt.END);
        autoRow.addView(hostLabel,new LinearLayout.LayoutParams(0,dp(28),1));
        Button auto=button("◎ Detectar",9);
        auto.setContentDescription("Tentar detectar visualmente a interface do jogo");
        auto.setOnClickListener(v->{dismissAll();actions.autoDetectHost();});
        autoRow.addView(auto,new LinearLayout.LayoutParams(dp(72),dp(28)));
        root.addView(autoRow,margined(-1,dp(28),2));
        Button manual=button(centralManualHost?"⌃ Esconder seleção manual":
            "⌄ Interface incorreta? Selecionar manualmente",9);
        manual.setOnClickListener(v->{centralManualHost=!centralManualHost;showCentral(0);});
        root.addView(manual,margined(-1,dp(27),2));
        if(centralManualHost){
        LinearLayout profiles=horizontal();
        String active=PgsAutoHostSettings.current(context);
        String[] ids={PgsAutoHostPolicy.PGSHARP,
            PgsAutoHostPolicy.POKEMOD,PgsAutoHostPolicy.OTHER};
        String[] names={"PGSharp","Pokemod","Outro"};
        for(int i=0;i<ids.length;i++){
            final String profile=ids[i];
            Button option=button(names[i],10);
            markChosen(option,profile.equals(active));
            option.setContentDescription("Cliente "+names[i]+
                (profile.equals(active)?", selecionado":""));
            option.setOnClickListener(v->{
                if(profile.equals(PgsAutoHostSettings.current(context)))return;
                PgsAutoHostSettings.select(context,profile);
                actions.modelsChanged(); // invalida modelos da sessão anterior.
                showCentral(0);
            });
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(28),1);
            if(i>0)lp.leftMargin=dp(2);
            profiles.addView(option,lp);
        }
        root.addView(profiles,margined(-1,dp(28),2));
        }
        LinearLayout scopeRow=horizontal();
        String scope=PgsSmartSearchSettings.scope(context);
        String[] scopes={PgsSmartSearchSettings.SCOPE_ALL,
            PgsSmartSearchSettings.SCOPE_FAVORITES};
        String[] descriptions={"Disponíveis (até 10)","Meus favoritos"};
        for(int i=0;i<2;i++){
            final String value=scopes[i];
            Button select=button(descriptions[i],9);
            markChosen(select,scope.equals(value));
            select.setContentDescription("Buscar: "+descriptions[i]);
            select.setOnClickListener(v->{
                PgsSmartSearchSettings.selectScope(context,value);
                actions.modelsChanged();showCentral(0);
            });
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(28),1);
            if(i>0)lp.leftMargin=dp(3);
            scopeRow.addView(select,lp);
        }
        root.addView(scopeRow,margined(-1,dp(28),2));
        int ready=PgsAutoTemplateStore.readyForSearch(context);
        TextView diagnostic=label(ready>0?
            "Modelos disponíveis nesta busca: "+ready+" (máximo 10 por leitura)":
            "Sem miniaturas de feed válidas. Cadastre uma no Scanner.",9,false);
        diagnostic.setMaxLines(2);
        root.addView(diagnostic,margined(-1,dp(37),1));
        TextView title=label("Selecionados: 0/10",10,true);
        EditText input=new EditText(context);
        input.setTextSize(13);input.setSingleLine(true);
        input.setTextColor(fg());input.setHintTextColor(0xFF9CA8B8);
        input.setHint("Nome ou #");
        input.setPadding(dp(8),0,dp(8),0);
        input.setBackground(bg(TILE,0x33FFFFFF,7));
        LinearLayout rows=vertical();
        root.addView(title,margined(-1,dp(20),2));
        // Search stays above the species list; the single parent scroll
        // keeps the bottom Start button visible on any configured size.
        root.addView(input,margined(-1,dp(33),3));
        root.addView(rows,margined(-1,-2,3));
        final Runnable[] render={null};
        render[0]=()->{
            rows.removeAllViews();
            title.setText("Selecionados: "+PgsAutoCatalog.selected(context).size()+"/10 · segure e arraste");
            // LT369: lado da lista Pokemod permanece mesmo após pesquisa/redesenho.
            if(PgsAutoHostPolicy.POKEMOD.equals(PgsAutoHostSettings.current(context))){
                boolean left=PgsAutoScanRegionPolicy.LEFT.equals(
                    PgsAutoHostSettings.sidebarSide(context));
                Button side=button(left?"Lista Pokemod: esquerda ▾":
                    "Lista Pokemod: direita ▾",9);
                side.setOnClickListener(v->{
                    PgsAutoHostSettings.setSidebarSide(context,left?
                        PgsAutoScanRegionPolicy.RIGHT:PgsAutoScanRegionPolicy.LEFT);
                    actions.modelsChanged();
                    showCentral(0);
                });
                rows.addView(side,margined(-1,dp(29),2));
            }
            List<View> speciesRows=new ArrayList<>();
            List<PgsAutoCatalog.Pokemon> found=
                PgsAutoCatalog.search(context,input.getText().toString().trim(),20);
            if(found.isEmpty()){
                rows.addView(label("Nenhum Pokémon",12,false));
                return;
            }
            for(PgsAutoCatalog.Pokemon pokemon:found){
                boolean selected=PgsAutoCatalog.isSelected(context,pokemon.number);
                LinearLayout line=horizontal();
                line.setPadding(dp(3),dp(2),dp(3),dp(2));
                line.setBackground(bg(TILE,0x2CFFFFFF,7));
                rows.addView(line,margined(-1,dp(47),3));
                ImageView dex=new ImageView(context);
                try(java.io.InputStream in=VerifiedSpriteCache.bundledSprite(context,pokemon.number,false)){
                    if(in!=null)dex.setImageBitmap(android.graphics.BitmapFactory.decodeStream(in));
                }catch(Exception ignored){}
                dex.setContentDescription(pokemon.name);
                line.addView(dex,new LinearLayout.LayoutParams(dp(26),dp(35)));
                int priority=PgsAutoCatalog.selected(context).indexOf(pokemon.number);
                List<PgsAutoTemplateStore.Model> speciesModels=
                    selected?imagesFor(pokemon):new ArrayList<>();
                boolean hasPersonal=false,hasNative=false;
                for(PgsAutoTemplateStore.Model item:speciesModels){
                    if(item.builtIn)hasNative=true;else hasPersonal=true;
                }
                String state=hasPersonal?" • minha":hasNative?" • nativa":" • capturar";
                TextView label=label((priority>=0?(priority+1)+". ":"")+
                    pokemon.name+(selected?state:""),11,true);
                label.setContentDescription(pokemon.name+
                    (selected?(hasPersonal?", modelo pessoal":hasNative?", modelo nativo validado":
                        ", captura necessária"):", não selecionado"));
                label.setSingleLine(true);label.setEllipsize(android.text.TextUtils.TruncateAt.END);
                line.addView(label,new LinearLayout.LayoutParams(0,dp(38),1f));
                if(selected){
                    List<PgsAutoTemplateStore.Model> models=speciesModels;
                    for(int i=0;i<Math.min(2,models.size());i++){
                        final PgsAutoTemplateStore.Model model=models.get(i);
                        ImageView thumb=new ImageView(context);
                        try{
                            thumb.setImageBitmap(PgsAutoTemplateStore.decode(context,model));
                        }catch(Exception ignored){}
                        thumb.setScaleType(ImageView.ScaleType.FIT_CENTER);
                        thumb.setBackground(bg(0x66313C4B,0x33FFFFFF,4));
                        thumb.setContentDescription((model.builtIn?"Modelo nativo":"Minha amostra")+
                            " de "+pokemon.name+". Toque para gerenciar.");
                        line.addView(thumb,new LinearLayout.LayoutParams(dp(27),dp(31)));
                        thumb.setOnClickListener(v->showModelActions(pokemon,model));
                    }
                    if(models.size()>2){
                        Button extra=button("…",14);
                        extra.setContentDescription("Mostrar todas as "+
                            models.size()+" imagens de "+pokemon.name);
                        line.addView(extra,new LinearLayout.LayoutParams(dp(24),dp(33)));
                        extra.setOnClickListener(v->showAllModels(pokemon));
                    }
                    Button teach=button(models.isEmpty()?"◎":"＋",14);
                    teach.setContentDescription("Gravar imagem para clicar em "+pokemon.name);
                    line.addView(teach,new LinearLayout.LayoutParams(dp(27),dp(33)));
                    teach.setOnClickListener(v->{
                        dismissAll();actions.teach(pokemon.name);
                    });
                    // LT369: nada de alça de três barras. Segurar na própria
                    // linha/nome permite arrastar entre prioridades selecionadas.
                    if(input.getText().length()==0){
                        int from=PgsAutoCatalog.selected(context)
                            .indexOf(pokemon.number);
                        speciesRows.add(line);
                        RowMove reorderTo=target->
                            PgsAutoCatalog.moveTo(context,pokemon.number,target);
                        Runnable update=()->{
                            actions.modelsChanged();
                            render[0].run();
                        };
                        holdToReorder(label,line,speciesRows,from,reorderTo,update);
                        holdToReorder(dex,line,speciesRows,from,reorderTo,update);
                        holdToReorder(line,line,speciesRows,from,reorderTo,update);
                    }
                }
                Button choose=button(selected?"×":"＋",14);
                if(selected){
                    choose.setTextColor(0xFFFF596C);
                    choose.setContentDescription("Remover da lista: "+pokemon.name);
                }
                choose.setContentDescription(selected?"Desmarcar "+pokemon.name:"Adicionar "+pokemon.name);
                line.addView(choose,new LinearLayout.LayoutParams(dp(27),dp(33)));
                choose.setOnClickListener(v->{
                    if(!selected&&PgsAutoCatalog.selected(context).size()>=PgsAutoCatalog.MAX_SELECTED){
                        Toast.makeText(context,"Até 10 Pokémon por lista; imagens já gravadas preservadas.",Toast.LENGTH_SHORT).show();
                        return;
                    }
                    PgsAutoCatalog.toggle(context,pokemon.number);
                    actions.modelsChanged();
                    render[0].run();
                });
            }
        };
        input.addTextChangedListener(new TextWatcher(){
            public void beforeTextChanged(CharSequence s,int st,int count,int after){}
            public void onTextChanged(CharSequence s,int st,int before,int count){render[0].run();}
            public void afterTextChanged(Editable s){}
        });
        render[0].run();
    }

    // LT370: simple PaS/PaC-inspired goals reuse ONE validated engine.
    // They do not imply automatic ball throwing or guaranteed Shiny evidence.
    private boolean showAdvancedActions=false;
    private boolean nightExpanded=false;
    // One-time acknowledgments only, never persist assumptions about VGP link.
    private boolean nightWalkAcknowledged=false,nightCatchAcknowledged=false;
    private void appendCentralActions(LinearLayout root){
        if(showAdvancedActions){appendLegacyActions(root);return;}
        root.addView(label("OBJETIVO DA BUSCA",10,true),margined(-1,dp(22),2));
        String current=PgsSmartSearchSettings.goal(context);
        String[] goals={PgsSmartSearchSettings.GOAL_SHINY,
            PgsSmartSearchSettings.GOAL_CATCH,PgsSmartSearchSettings.GOAL_BOTH};
        String[] labels={"✨ Procurar Shiny","◎ Auxiliar encontros",
            "✨ Procurar + auxiliar"};
        for(int i=0;i<goals.length;i++){
            final String goal=goals[i];
            Button choice=button(labels[i],10);
            choice.setContentDescription("Objetivo: "+labels[i]);
            markChosen(choice,goal.equals(current));
            choice.setOnClickListener(v->{
                PgsSmartSearchSettings.selectGoal(context,goal);
                showCentral(1);
            });
            root.addView(choice,margined(-1,dp(30),3));
        }
        String warning=PgsSmartSearchSettings.GOAL_SHINY.equals(current)?
            "Consulta o feed e pausa somente diante de aviso Shiny explícito "+
            "da espécie; exige acesso às notificações do jogo.":
            PgsSmartSearchSettings.GOAL_CATCH.equals(current)?
            "Abre alvos confirmados; avisa ao reconhecer o encontro. "+
            "Captura, bolas e frutas continuam manuais.":
            "Combina aviso Shiny com encontro assistido. "+
            "Sem arremesso automático e sem capturas presumidas.";
        TextView explanation=label(warning,9,false);
        explanation.setMaxLines(4);
        root.addView(explanation,margined(-1,dp(59),3));
        CheckBox repeat=new CheckBox(context);
        repeat.setText("Continuar procurando após cada ciclo");
        repeat.setTextSize(10);repeat.setTextColor(fg());
        repeat.setChecked(PgsSmartSearchSettings.repeat(context));
        repeat.setOnCheckedChangeListener((b,on)->
            PgsSmartSearchSettings.setRepeat(context,on));
        root.addView(repeat,margined(-1,dp(31),2));
        huntNumeric(root,PgsAutoHuntSettings.forCurrent(context),
            PgsAutoHuntSettings.MAX_CLICKS,"Máximo de interações",
            new int[]{1,3,5,10},10);
        CheckBox consent=new CheckBox(context);
        consent.setText("Autorizo tocar nas sprites confirmadas");
        consent.setTextSize(10);consent.setTextColor(fg());
        consent.setChecked(PgsSmartSearchSettings.gestureConsent(context));
        consent.setOnCheckedChangeListener((b,on)->
            PgsSmartSearchSettings.setGestureConsent(context,on));
        root.addView(consent,margined(-1,dp(34),2));
        TextView status=label("Assistência de captura: não comprovada no jogo. "+
            "Teste a prévia antes de iniciar.",9,false);
        status.setMaxLines(2);
        root.addView(status,margined(-1,dp(37),2));
        Button editor=button("⌄ Avançado: monitor, Auto Hunt e sequências",9);
        editor.setOnClickListener(v->{
            showAdvancedActions=true;showCentral(1);
        });
        root.addView(editor,margined(-1,dp(29),3));
        // LT371: a compact standalone PGSharp supervisor, not a fake bot.
        Button night=button(nightExpanded?
            "☾ Recolher modo noturno":"☾ Modo noturno · PGSharp",10);
        night.setOnClickListener(v->{nightExpanded=!nightExpanded;showCentral(1);});
        root.addView(night,margined(-1,dp(30),4));
        if(nightExpanded)appendNightMode(root);
    }

    private void appendNightMode(LinearLayout root){
        TextView description=label("Autowalk e Virtual Go Plus fazem "+
            "movimento/captura NO PGSharp. O PokeSearch apenas supervisiona "+
            "o jogo; não ativa, não verifica a conexão nem desliga os recursos.",9,false);
        description.setMaxLines(5);
        root.addView(description,margined(-1,dp(76),2));
        if(!PgsAutoHostPolicy.PGSHARP.equals(
                PgsAutoHostSettings.current(context))){
            TextView unavailable=label("Este modo externo só foi documentado "+
                "para PGSharp. Pokemod exige integração própria validada.",9,false);
            unavailable.setMaxLines(3);
            root.addView(unavailable,margined(-1,dp(52),2));
            return;
        }
        CheckBox walk=new CheckBox(context);
        walk.setText("Já ativei Autowalk no PGSharp");
        walk.setTextSize(10);walk.setTextColor(fg());
        walk.setChecked(nightWalkAcknowledged);
        walk.setOnCheckedChangeListener((b,on)->{
            nightWalkAcknowledged=on;showCentral(1);
        });
        root.addView(walk,margined(-1,dp(31),1));
        CheckBox plus=new CheckBox(context);
        plus.setText("Já conectei Virtual Go Plus no jogo");
        plus.setTextSize(10);plus.setTextColor(fg());
        plus.setChecked(nightCatchAcknowledged);
        plus.setOnCheckedChangeListener((b,on)->{
            nightCatchAcknowledged=on;showCentral(1);
        });
        root.addView(plus,margined(-1,dp(31),1));
        TextView tips=label("Confira Pokébolas, mochila livre, jogo visível, "+
            "alertas habilitados e ventilação. Tela bloqueada pode interromper "+
            "a sessão. A supervisão não controla o cliente externo.",9,false);
        tips.setMaxLines(4);
        root.addView(tips,margined(-1,dp(62),2));
        boolean active=actions.nightSupervisorActive();
        Button start=button(active?"■ Parar supervisão":
            "▷ Iniciar supervisão noturna",10);
        start.setContentDescription(active?
            "Parar supervisão do PokeSearch; Autowalk e Virtual Go Plus "+
                "continuam ligados no PGSharp":
            "Iniciar supervisão visual, sem controlar caminhada ou captura");
        start.setEnabled(active||(nightWalkAcknowledged&&nightCatchAcknowledged));
        start.setOnClickListener(v->{
            if(active)actions.stopNightSupervisor();
            else actions.startNightSupervisor();
            showCentral(1);
        });
        root.addView(start,margined(-1,dp(32),3));
    }

    private void appendLegacyActions(LinearLayout root){
        Button back=button("⌃ Voltar à Busca Inteligente",9);
        back.setOnClickListener(v->{showAdvancedActions=false;showCentral(1);});
        root.addView(back,margined(-1,dp(29),2));
        String current=PgsSmartSearchSettings.mode(context);
        String[] ids={PgsSmartSearchSettings.MONITOR,PgsSmartSearchSettings.CLICK,
            PgsSmartSearchSettings.HUNT,PgsSmartSearchSettings.SEQUENCE};
        String[] names={"◎ Monitorar","⌖ Clicar","✦ Auto Hunt","Sequência"};
        for(int line=0;line<2;line++){
            LinearLayout row=horizontal();
            for(int col=0;col<2;col++){
                int i=line*2+col;final String chosen=ids[i];
                Button option=button(names[i],10);
                markChosen(option,chosen.equals(current));
                option.setContentDescription("Ao encontrar: "+names[i]+
                    (chosen.equals(current)?", selecionado":""));
                option.setOnClickListener(v->{
                    PgsSmartSearchSettings.selectMode(context,chosen);
                    centralStep=-1;showCentral(1);
                });
                LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(30),1);
                if(col>0)lp.leftMargin=dp(3);
                row.addView(option,lp);
            }
            root.addView(row,margined(-1,dp(30),3));
        }
        if(PgsSmartSearchSettings.SEQUENCE.equals(current)){
            appendCentralSequence(root);
        }else if(PgsSmartSearchSettings.MONITOR.equals(current)){
            TextView note=label("Observa a miniatura do feed sem enviar toques. "+
                "O mapa e a sprite precisam de confirmação visual.",10,false);
            note.setMaxLines(3);
            root.addView(note,margined(-1,dp(66),5));
        }else {
            SharedPreferences hunt=PgsAutoHuntSettings.forCurrent(context);
            TextView desc=label(PgsSmartSearchSettings.HUNT.equals(current)?
                "Auto Hunt inicia no modo observação; toque opcional e autorizado.":
                "Clique somente após confirmar a sprite do feed em duas leituras.",
                10,false);
            desc.setMaxLines(2);root.addView(desc,margined(-1,dp(42),4));
            if(PgsSmartSearchSettings.HUNT.equals(current)){
                huntCheckbox(root,hunt,PgsAutoHuntSettings.CLICK_ENABLED,
                    "Tocar na sprite confirmada",false);
                // Tempo de espera centralizado apenas na aba Ajustes (LT369).
            }
            CheckBox consent=new CheckBox(context);
            consent.setText("Autorizo toques neste perfil");
            consent.setTextSize(10);consent.setTextColor(fg());
            consent.setChecked(PgsSmartSearchSettings.gestureConsent(context));
            consent.setOnCheckedChangeListener((button,on)->
                PgsSmartSearchSettings.setGestureConsent(context,on));
            root.addView(consent,margined(-1,dp(32),3));
        }
    }

    // LT369: todas as configurações da Busca cabem numa só aba rolável;
    // nenhuma opção de Tempos/Avisos/Visual/Auto Hunt abre outro menu principal.
    private void appendCentralSettings(LinearLayout root){
        SharedPreferences prefs=context.getSharedPreferences(
            "pgs_auto_settings_v1",Context.MODE_PRIVATE);
        SharedPreferences hunt=PgsAutoHuntSettings.forCurrent(context);
        SharedPreferences cycles=PgsAutoClickService.cyclePrefs(context);

        TextView times=label("TEMPOS",10,true);
        root.addView(times,margined(-1,dp(20),2));
        CheckBox automatic=new CheckBox(context);
        automatic.setText("Tempos padrão automáticos");
        automatic.setTextSize(10);automatic.setTextColor(fg());
        automatic.setChecked(PgsSmartSearchSettings.automaticDefaults(context));
        automatic.setOnCheckedChangeListener((b,on)->
            PgsSmartSearchSettings.setAutomaticDefaults(context,on));
        root.addView(automatic,margined(-1,dp(30),1));
        huntNumeric(root,hunt,PgsAutoHuntSettings.WAIT,
            "Espera entre alvos",new int[]{15,35,60,120},35);
        int[] mapChoices={15,25,35,60,120};
        int currentMap=cycles.getInt("load_timeout",
            PgsAutoCyclePolicy.DEFAULT_MAP_TIMEOUT_SECONDS);
        Button map=button("Aguardar mapa: "+currentMap+"s ▾",10);
        map.setOnClickListener(v->{
            int choice=0;
            int stored=cycles.getInt("load_timeout",
                PgsAutoCyclePolicy.DEFAULT_MAP_TIMEOUT_SECONDS);
            for(int i=0;i<mapChoices.length;i++)
                if(mapChoices[i]==stored){choice=i+1;break;}
            int next=mapChoices[choice%mapChoices.length];
            cycles.edit().putInt("load_timeout",next)
                .putBoolean("lt344_timeout_user_set",true).apply();
            map.setText("Aguardar mapa: "+next+"s ▾");
        });
        root.addView(map,margined(-1,dp(30),2));
        int[] postValues={0,3,5,10,20,35,60,120};
        int postStored=cycles.getInt("post_load",
            PgsAutoCyclePolicy.DEFAULT_SHINY_CHECK_SECONDS);
        Button post=button("Após mapa/sem Shiny: "+postStored+"s ▾",10);
        post.setOnClickListener(v->{
            int choice=0;
            int saved=cycles.getInt("post_load",
                PgsAutoCyclePolicy.DEFAULT_SHINY_CHECK_SECONDS);
            for(int i=0;i<postValues.length;i++)
                if(postValues[i]==saved){choice=i+1;break;}
            int next=postValues[choice%postValues.length];
            cycles.edit().putInt("post_load",next).apply();
            post.setText("Após mapa/sem Shiny: "+next+"s ▾");
        });
        root.addView(post,margined(-1,dp(30),2));

        TextView alerts=label("NOTIFICAÇÕES",10,true);
        root.addView(alerts,margined(-1,dp(20),6));
        appendCentralAlert(root,prefs,"Novos Pokémon",PgsAutoNotificationPolicy.NEW);
        appendCentralAlert(root,prefs,"Shiny monitorado",PgsAutoNotificationPolicy.SHINY);

        TextView visuals=label("VISUAL",10,true);
        root.addView(visuals,margined(-1,dp(20),6));
        CheckBox countdown=new CheckBox(context);
        countdown.setText("Contador na bolha");
        countdown.setTextSize(10);countdown.setTextColor(fg());
        countdown.setChecked(prefs.getBoolean("showCountdown",false));
        countdown.setOnCheckedChangeListener((b,on)->{
            prefs.edit().putBoolean("showCountdown",on).apply();
            actions.appearanceChanged();
        });
        root.addView(countdown,margined(-1,dp(28),1));
        LinearLayout tapRow=horizontal();
        CheckBox tap=new CheckBox(context);
        tap.setText("Mostrar efeito do toque");
        tap.setTextSize(10);tap.setTextColor(fg());
        tap.setChecked(prefs.getBoolean("showTapIndicator",true));
        tap.setOnCheckedChangeListener((b,on)->
            prefs.edit().putBoolean("showTapIndicator",on).apply());
        tapRow.addView(tap,new LinearLayout.LayoutParams(0,dp(30),1));
        Button preview=button("◎",14);
        preview.setContentDescription("Prévia do toque, sem tocar no jogo");
        preview.setOnClickListener(v->actions.previewTapIndicator());
        tapRow.addView(preview,new LinearLayout.LayoutParams(dp(30),dp(30)));
        root.addView(tapRow,margined(-1,dp(30),1));
        LinearLayout sizes=horizontal();
        TextView iconSize=label("Ícones:",10,false);
        sizes.addView(iconSize,new LinearLayout.LayoutParams(dp(50),dp(29)));
        String current=prefs.getString("iconScale","M");
        for(String size:new String[]{"P","M","G"}){
            Button choice=button(size,10);markChosen(choice,size.equals(current));
            choice.setOnClickListener(v->{
                prefs.edit().putString("iconScale",size).apply();
                actions.appearanceChanged();
                for(int i=1;i<sizes.getChildCount();i++){
                    Button b=(Button)sizes.getChildAt(i);
                    markChosen(b,size.equals(b.getText().toString()));
                }
            });
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(29),1);
            lp.leftMargin=dp(2);sizes.addView(choice,lp);
        }
        root.addView(sizes,margined(-1,dp(29),2));
        TextView sharedStyle=label("Cores, transparência e posição seguem "+
            "o Editor Visual das Pokébolas 1 e 2.",9,false);
        sharedStyle.setMaxLines(2);
        root.addView(sharedStyle,margined(-1,dp(35),3));

        Button advanced=button(centralAdvanced?"⌃ Recolher avançado":
            "⌄ Ajustes avançados",10);
        advanced.setOnClickListener(v->{
            centralAdvanced=!centralAdvanced;showCentral(2);
        });
        root.addView(advanced,margined(-1,dp(30),5));
        if(centralAdvanced)appendCentralAdvanced(root,hunt,cycles);
    }

    private void appendCentralAlert(LinearLayout root,SharedPreferences prefs,
        String title,String kind){
        LinearLayout line=horizontal();
        TextView name=label(title,10,false);
        line.addView(name,new LinearLayout.LayoutParams(0,dp(30),1));
        String saved=PgsAutoNotificationPolicy.mode(kind,prefs.getString(
            kind,PgsAutoNotificationPolicy.defaultMode(kind)));
        int[] glyphs={R.drawable.pgs_speaker_on,
            R.drawable.pgs_speaker_silent,R.drawable.pgs_speaker_off};
        String[] modes={"default","mute","off"};
        String[] hints={"Com som","Sem som","Desligado"};
        ImageButton[] buttons=new ImageButton[3];
        for(int i=0;i<3;i++){
            final int index=i;
            ImageButton icon=imageButton(glyphs[i],title+" · "+hints[i],7);
            icon.setPadding(dp(7),dp(7),dp(7),dp(7));
            buttons[i]=icon;
            markAlertIcon(icon,i==0?
                ("default".equals(saved)||"strong".equals(saved)||
                    "custom".equals(saved)):modes[i].equals(saved));
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(dp(30),dp(30));
            if(i>0)lp.leftMargin=dp(2);
            line.addView(icon,lp);
            icon.setOnClickListener(v->{
                prefs.edit().putString(kind,modes[index]).apply();
                for(int j=0;j<3;j++)markAlertIcon(buttons[j],j==index);
            });
        }
        root.addView(line,margined(-1,dp(30),1));
    }

    private void appendCentralAdvanced(LinearLayout root,
        SharedPreferences hunt,SharedPreferences cycles){
        // Custom seconds remain supported instead of rounding saved values to presets.
        TextView exact=label("TEMPOS EXATOS (SEGUNDOS)",10,true);
        root.addView(exact,margined(-1,dp(23),3));
        LinearLayout exactRow=horizontal();
        EditText map=new EditText(context),after=new EditText(context);
        EditText[] values={map,after};
        String[] names={"Mapa","Após mapa"};
        String[] keys={"load_timeout","post_load"};
        int[] defaults={PgsAutoCyclePolicy.DEFAULT_MAP_TIMEOUT_SECONDS,
            PgsAutoCyclePolicy.DEFAULT_SHINY_CHECK_SECONDS};
        for(int i=0;i<2;i++){
            LinearLayout item=vertical();
            item.addView(label(names[i],9,false),margined(-1,dp(18),0));
            EditText editor=values[i];
            editor.setSingleLine(true);editor.setTextSize(11);
            editor.setTextColor(fg());editor.setGravity(Gravity.CENTER);
            editor.setSelectAllOnFocus(true);
            editor.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
            editor.setText(String.valueOf(cycles.getInt(keys[i],defaults[i])));
            PgsAutoMenuStyle style=PgsAutoMenuStyle.read(context);
            editor.setBackground(bg(style.tileFill(),style.tileStroke(),5));
            item.addView(editor,margined(-1,dp(31),1));
            LinearLayout.LayoutParams itemLp=new LinearLayout.LayoutParams(0,dp(53),1);
            if(i>0)itemLp.leftMargin=dp(3);
            exactRow.addView(item,itemLp);
        }
        root.addView(exactRow,margined(-1,dp(53),2));
        Button save=button("✓ Salvar tempos",10);
        save.setOnClickListener(v->{
            try{
                int m=Integer.parseInt(map.getText().toString().trim());
                int a=Integer.parseInt(after.getText().toString().trim());
                if(m<1||a<0)throw new NumberFormatException();
                cycles.edit().putInt("load_timeout",m).putInt("post_load",a)
                    .putBoolean("lt344_timeout_user_set",true).apply();
                Toast.makeText(context,"Tempos salvos.",Toast.LENGTH_SHORT).show();
                showCentral(2);
            }catch(NumberFormatException e){
                Toast.makeText(context,"Mapa >= 1s e após mapa >= 0s.",
                    Toast.LENGTH_LONG).show();
            }
        });
        root.addView(save,margined(-1,dp(30),2));

        if(PgsSmartSearchSettings.HUNT.equals(PgsSmartSearchSettings.mode(context))){
            root.addView(label("AUTO HUNT",10,true),margined(-1,dp(22),5));
            huntNumeric(root,hunt,PgsAutoHuntSettings.MAX_CLICKS,
                "Limite de toques",new int[]{1,3,5,10},10);
            huntCheckbox(root,hunt,PgsAutoHuntSettings.STOP_IV100,
                "Parar no aviso explícito IV100",true);
            huntCheckbox(root,hunt,PgsAutoHuntSettings.STOP_DITTO,
                "Parar no aviso explícito Ditto",true);
            huntCheckbox(root,hunt,PgsAutoHuntSettings.RINGTONE,
                "Som Auto Hunt",true);
            huntCheckbox(root,hunt,PgsAutoHuntSettings.VIBRATE,
                "Vibração Auto Hunt",true);
            huntCheckbox(root,hunt,PgsAutoHuntSettings.SHOW_COOLDOWN,
                "Contagem na bolha",false);
            huntCheckbox(root,hunt,PgsAutoHuntSettings.SHOW_INFO,
                "Exibir nome do alvo",true);
            huntCheckbox(root,hunt,PgsAutoHuntSettings.FIX_MAP,
                "Tentar reler o mapa (sem clique)",false);
            huntNumeric(root,hunt,PgsAutoHuntSettings.MAP_RETRY,
                "Falhas de imagem",new int[]{0,1,2,3},3);
            android.hardware.SensorManager sensors=(android.hardware.SensorManager)
                context.getSystemService(Context.SENSOR_SERVICE);
            if(sensors!=null&&sensors.getDefaultSensor(
                    android.hardware.Sensor.TYPE_PROXIMITY)!=null)
                huntCheckbox(root,hunt,PgsAutoHuntSettings.PROXIMITY,
                    "Pausar quando sensor coberto",false);
            else huntUnavailable(root,"Sensor de proximidade",
                "Dispositivo sem esse sensor");
        }
        Button permission=button("Acesso manual às notificações Android",9);
        permission.setOnClickListener(v->{
            hidePanel();
            try{
                android.content.Intent intent=new android.content.Intent(
                    android.provider.Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }catch(Exception e){
                Toast.makeText(context,"Abra Configurações → Notificações "+
                    "do Android.",Toast.LENGTH_LONG).show();
            }
        });
        root.addView(permission,margined(-1,dp(30),5));
        TextView limits=label("Avisos de segurança exigem confirmação humana. "+
            "Teleporte e captura não são inferidos de toques.",9,false);
        limits.setMaxLines(3);
        root.addView(limits,margined(-1,dp(50),2));
    }

    private boolean hasCentralSprite(){
        for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.activeForSearch(context))
            return true;
        return false;
    }
    private void startCentral(){
        String host=PgsAutoHostSettings.current(context);
        String mode=PgsSmartSearchSettings.mode(context);
        if(PgsAutoHostPolicy.OTHER.equals(host)){
            Toast.makeText(context,"Outro cliente: somente prévia. "+
                "Selecione PGSharp ou Pokemod.",Toast.LENGTH_LONG).show();return;
        }
        if(!showAdvancedActions){
            int models=PgsAutoTemplateStore.readyForSearch(context);
            if(models<=0){
                Toast.makeText(context,"Nenhuma miniatura válida neste cliente. "+
                    "Cadastre uma sprite ou selecione um modelo disponível.",
                    Toast.LENGTH_LONG).show();return;
            }
            if(!PgsSmartSearchSettings.gestureConsent(context)){
                Toast.makeText(context,"Autorize os gestos na aba Ação. "+
                    "Selecionar objetivo não inicia toques.",
                    Toast.LENGTH_LONG).show();return;
            }
            String goal=PgsSmartSearchSettings.goal(context);
            if(!PgsSmartSearchSettings.GOAL_CATCH.equals(goal) &&
                !PgsAutoShinyListener.hasAccess(context)){
                Toast.makeText(context,"Para avisos Shiny, habilite o acesso "+
                    "às notificações do jogo nas configurações do Android.",
                    Toast.LENGTH_LONG).show();return;
            }
            PgsAutoHuntSettings.forCurrent(context).edit()
                .putBoolean(PgsAutoHuntSettings.ENABLED,true)
                .putBoolean(PgsAutoHuntSettings.CLICK_ENABLED,true).apply();
            dismissAll();actions.startSmartSearch(goal);
            return;
        }
        if(PgsSmartSearchSettings.SEQUENCE.equals(mode)){
            if(!PgsSequenceStore.canRun(context)){
                Toast.makeText(context,"Autorize a execução da sequência neste perfil.",
                    Toast.LENGTH_LONG).show();return;
            }
            dismissAll();actions.sequenceRun();return;
        }
        if(!hasCentralSprite()){
            Toast.makeText(context,"Selecione um Pokémon com sprite válida "+
                "para este perfil antes de iniciar.",Toast.LENGTH_LONG).show();return;
        }
        if(PgsSmartSearchSettings.MONITOR.equals(mode)){
            dismissAll();actions.setWatchEnabled(true);return;
        }
        boolean click=PgsSmartSearchSettings.CLICK.equals(mode)||
            PgsAutoHuntSettings.forCurrent(context).getBoolean(
                PgsAutoHuntSettings.CLICK_ENABLED,false);
        if(click&&!PgsSmartSearchSettings.gestureConsent(context)){
            Toast.makeText(context,"Autorize os toques na aba Ação primeiro.",
                Toast.LENGTH_LONG).show();return;
        }
        PgsAutoHuntSettings.forCurrent(context).edit()
            .putBoolean(PgsAutoHuntSettings.ENABLED,true)
            .putBoolean(PgsAutoHuntSettings.CLICK_ENABLED,click).apply();
        dismissAll();
        actions.startSearch();
    }
    /** Seletor pequeno: não inventa integração nativa com o injetor Pokemod. */
    private void showHostProfiles(){
        LinearLayout root=panelRoot("INTERFACE DO FEED",null);
        String current=PgsAutoHostSettings.current(context);
        String[] ids={PgsAutoHostPolicy.PGSHARP,
            PgsAutoHostPolicy.POKEMOD,PgsAutoHostPolicy.OTHER};
        String[] names={"PGSharp","Pokemod","Outro · somente prévia"};
        for(int i=0;i<ids.length;i++){
            final String value=ids[i];
            Button select=button(names[i],11);
            markChosen(select,value.equals(current));
            select.setOnClickListener(v->{
                PgsAutoHostSettings.select(context,value);
                actions.modelsChanged(); // interrompe ciclo e reconstrói modelos.
                // LT363: seleção do perfil não depende de manager ou Aegis/Atlas.
                // O diagnóstico separado mostra quais pacotes existem no aparelho.
                showSearch();
            });
            root.addView(select,margined(-1,dp(34),3));
        }
        if(PgsAutoHostPolicy.POKEMOD.equals(current)){
            // Configuração no submenu, sem aumentar a fileira principal PGS/PM.
            String side=PgsAutoHostSettings.sidebarSide(context);
            boolean left=PgsAutoScanRegionPolicy.LEFT.equals(side);
            Button sideButton=button(left?"↤ Lista à esquerda · alterar":
                "Lista à direita ↦ · alterar",10);
            sideButton.setContentDescription("Lado da lista circular do Pokemod. "+
                (left?"Esquerda":"Direita")+". Toque para alternar.");
            sideButton.setOnClickListener(v->{
                PgsAutoHostSettings.setSidebarSide(context,left?
                    PgsAutoScanRegionPolicy.RIGHT:PgsAutoScanRegionPolicy.LEFT);
                actions.modelsChanged();
                showHostProfiles();
            });
            root.addView(sideButton,margined(-1,dp(32),3));
        }
        TextView note=label(
            PgsAutoHostPolicy.POKEMOD.equals(current)?
                "Reconhece ícones da lista circular, não Pokémon 3D. "+
                "Confira a prévia ◎ antes do toque; mod ativo não comprovado.":
                "Cada interface exige suas próprias capturas. "+
                "Instalado não comprova mod ativo; avisos são manuais.",9,false);
        root.addView(note,margined(-1,dp(48),4));
        // Diagnóstico somente sob demanda, sem nova bolha na Home.
        Button diagnostic=button("ⓘ Compatibilidade · diagnóstico",10);
        diagnostic.setContentDescription(
            "Abrir diagnóstico local dos clientes e do monitor sem clique.");
        diagnostic.setOnClickListener(v->showCompanionDiagnostics());
        root.addView(diagnostic,margined(-1,dp(30),3));
        mount(root,230,PgsAutoHostPolicy.POKEMOD.equals(current)?293:254);
    }

    /**
     * LT363: inventário local de PACOTES EXATOS (não indica injeção ativa).
     * Nenhuma comunicação com serviços, endpoints, root ou outros processos.
     */
    private void showCompanionDiagnostics(){
        LinearLayout root=panelRoot("COMPATIBILIDADE",null);
        String selected=PgsAutoHostSettings.current(context);
        TextView intro=label("Perfil: "+PgsAutoHostPolicy.displayLabel(selected)+
            " · consulta local de instalação",9,false);
        root.addView(intro,margined(-1,dp(25),2));
        ScrollView scroll=new ScrollView(context);
        scroll.setVerticalScrollBarEnabled(false);
        LinearLayout items=vertical();
        for(PgsCompanionPolicy.Spec spec:PgsCompanionPolicy.entries()){
            LinearLayout row=horizontal();
            TextView name=label(spec.label,9,true);
            name.setSingleLine(true);
            name.setEllipsize(android.text.TextUtils.TruncateAt.END);
            row.addView(name,new LinearLayout.LayoutParams(0,dp(25),1));
            TextView state=label(PgsCompanionDiagnostics.status(context,spec),8,false);
            state.setGravity(Gravity.CENTER_VERTICAL|Gravity.RIGHT);
            state.setSingleLine(true);
            state.setEllipsize(android.text.TextUtils.TruncateAt.END);
            row.addView(state,new LinearLayout.LayoutParams(dp(105),dp(25)));
            items.addView(row);
        }
        scroll.addView(items);
        root.addView(scroll,margined(-1,dp(150),2));
        TextView templates=label("Favoritos selecionados: "+
            PgsAutoCatalog.selected(context).size()+"/10 · amostras ativas: "+
            PgsAutoTemplateStore.active(context).size(),9,false);
        root.addView(templates,margined(-1,dp(30),3));
        TextView metrics=label(PgsAutoClickService.monitorDiagnostics(),9,false);
        metrics.setMaxLines(4);
        metrics.setContentDescription("Métricas temporárias do monitor sem clique. "+
            PgsAutoClickService.monitorDiagnostics());
        root.addView(metrics,margined(-1,dp(66),2));
        TextView warning=label(
            "Instalado ≠ ativo. Nenhum APK externo autoriza toque, "+
            "API privada ou leitura de dados de conta.",9,false);
        warning.setMaxLines(3);
        root.addView(warning,margined(-1,dp(34),2));
        Button back=button("← Interfaces",10);
        back.setOnClickListener(v->showHostProfiles());
        root.addView(back,margined(-1,dp(30),3));
        mount(root,235,382);
    }

    /** Alvos explícitos, separados da busca por sprites do feed. */
    void showTargets(){
        SharedPreferences prefs=context.getSharedPreferences("pgs_auto_target_v1",Context.MODE_PRIVATE);
        String chosen=prefs.getString("mode","SPRITE");
        LinearLayout root=panelRoot("◎ ALVO DO TOQUE",null);
        TextView explanation=label("Escolha o que tocar. Coordenadas não são GPS.",10,false);
        root.addView(explanation,margined(-1,dp(31),4));
        String[] keys={"SPRITE","POKESTOP","POINT","ENCOUNTER"};
        String[] names={"Sprites Pokémon (feed)","PokéStop — tocar perto",
            "Ponto específico — mira","Pokémon — entrar e deslizar"};
        for(int i=0;i<keys.length;i++){
            final String id=keys[i];
            Button item=button(names[i],11);
            markChosen(item,id.equals(chosen));
            item.setOnClickListener(v->{
                if("SPRITE".equals(id)){
                    prefs.edit().putString("mode","SPRITE").apply();
                    actions.selectSprites();showSearch();
                }else{
                    dismissAll();actions.choosePoint(id);
                }
            });
            root.addView(item,margined(-1,dp(34),3));
        }
        TextView title=label("Repetir após:",11,true);
        root.addView(title,margined(-1,dp(24),5));
        String[] triggers={"MAP","NO_SHINY","TIMER"};
        String[] labels={"Mapa","Sem Shiny confirmado","Tempo"};
        LinearLayout modes=horizontal();
        String chosenTrigger=prefs.getString("trigger","MAP");
        for(int i=0;i<triggers.length;i++){
            final String selected=triggers[i];
            Button b=button(labels[i],9);
            markChosen(b,selected.equals(chosenTrigger));
            b.setOnClickListener(v->{
                prefs.edit().putString("trigger",selected).apply();showTargets();
            });
            modes.addView(b,new LinearLayout.LayoutParams(0,dp(40),1));
        }
        root.addView(modes,margined(-1,dp(41),3));
        LinearLayout offsetRow=horizontal();
        TextView offsetText=label("Deslocar PokéStop: "+prefs.getInt("stopOffsetPx",24)+"px",10,false);
        offsetRow.addView(offsetText,new LinearLayout.LayoutParams(0,dp(31),1));
        SeekBar seek=new SeekBar(context);
        seek.setMax(72);seek.setProgress(Math.min(72,Math.max(0,prefs.getInt("stopOffsetPx",24))));
        seek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){
            @Override public void onProgressChanged(SeekBar bar,int progress,boolean user){
                if(user){
                    prefs.edit().putInt("stopOffsetPx",progress).apply();
                    offsetText.setText("Deslocar PokéStop: "+progress+"px");
                }
            }
            @Override public void onStartTrackingTouch(SeekBar bar){}
            @Override public void onStopTrackingTouch(SeekBar bar){}
        });
        offsetRow.addView(seek,new LinearLayout.LayoutParams(dp(95),dp(31)));
        root.addView(offsetRow,margined(-1,dp(33),4));
        TextView note=label(
            "A mira exige confirmação. A ausência de Shiny precisa de evidência; "+ 
            "avisos de segurança exigem toque manual. Tocar perto não move GPS.",9,false);
        root.addView(note,margined(-1,dp(49),4));
        mount(root,248,440);
    }

    /** LT366: mesmas cores, opacidade, células e regras de tamanho das Pokébolas. */
    private void huntCheckbox(LinearLayout root,SharedPreferences prefs,
            String key,String title,boolean fallback){
        CheckBox box=new CheckBox(context);
        box.setText(title);
        box.setTextSize(10);
        box.setTextColor(fg());
        box.setButtonTintList(android.content.res.ColorStateList.valueOf(fg()));
        box.setPadding(dp(2),0,dp(2),0);
        box.setChecked(prefs.getBoolean(key,fallback));
        box.setOnCheckedChangeListener((view,checked)->{
            prefs.edit().putBoolean(key,checked).apply();
            if(PgsAutoHuntSettings.ENABLED.equals(key)||
               PgsAutoHuntSettings.CLICK_ENABLED.equals(key)||
               PgsAutoHuntSettings.PROXIMITY.equals(key))
                PgsAutoClickService.huntSettingsChanged();
        });
        root.addView(box,margined(-1,dp(30),1));
    }
    private void huntNumeric(LinearLayout root,SharedPreferences prefs,
            String key,String title,int[] options,int fallback){
        int saved=prefs.getInt(key,fallback),pos=0;
        for(int i=0;i<options.length;i++)if(options[i]==saved){pos=i;break;}
        final int[] idx={pos};
        Button button=button(title+": "+options[idx[0]]+
            ("wait_seconds".equals(key)?"s":"")+" ▾",10);
        button.setContentDescription("Alterar "+title+"; valor atual "+
            options[idx[0]]);
        button.setOnClickListener(v->{
            idx[0]=(idx[0]+1)%options.length;
            prefs.edit().putInt(key,options[idx[0]]).apply();
            button.setText(title+": "+options[idx[0]]+
                ("wait_seconds".equals(key)?"s":"")+" ▾");
            button.setContentDescription("Alterar "+title+
                "; valor atual "+options[idx[0]]);
        });
        root.addView(button,margined(-1,dp(30),2));
    }
    private void huntUnavailable(LinearLayout root,String label,String reason){
        TextView row=label(label+" · indisponível",10,false);
        row.setTextColor(0xFF9EAAB6);
        row.setContentDescription(label+". Indisponível. "+reason);
        root.addView(row,margined(-1,dp(23),2));
    }
    /**
     * Autohunt compatível por PERFIL visual; o app nunca controla interfaces
     * privadas do PGSharp/Pokemod. Nada desta tela inicia gestos sozinho.
     */
    /** LT367 — editor original no mesmo popup P1/P2, sem sexta bolha. */
    private boolean sequenceLandscape(){
        Point sz=size();return sz.x>=sz.y;
    }
    private void sequenceEdited(boolean ok){
        if(!ok){
            Toast.makeText(context,"Não foi possível alterar o passo. "+
                "Confira orientação, limites e perfil.",Toast.LENGTH_LONG).show();
            return;
        }
        actions.sequenceChanged();showSequence();
    }
    // LT368: o editor é conteúdo da ABA AÇÃO, não uma segunda janela.
    // A mira e o seletor de sprite usam somente suas superfícies transitórias.
    void showSequence(){
        PgsSmartSearchSettings.selectMode(context,PgsSmartSearchSettings.SEQUENCE);
        showCentral(1);
    }
    private void appendCentralSequence(LinearLayout root){
        String host=PgsAutoHostSettings.current(context);
        List<PgsSequencePolicy.Step> steps=PgsSequenceStore.load(context);
        boolean rotated=!steps.isEmpty()&&
            PgsSequenceStore.landscape(context)!=sequenceLandscape();
        if(centralStep>=steps.size())centralStep=-1;
        TextView summary=label("Sequência · "+steps.size()+"/"+
            PgsSequencePolicy.MAX_STEPS+" etapas · "+
            (PgsSequencePolicy.estimatedMs(steps)/1000f)+"s estimados",9,true);
        summary.setSingleLine(true);
        summary.setEllipsize(android.text.TextUtils.TruncateAt.END);
        root.addView(summary,margined(-1,dp(19),4));
        if(rotated){
            TextView warning=label("Orientação diferente. Volte à orientação "+
                "usada para salvar os pontos.",9,false);
            warning.setMaxLines(2);
            root.addView(warning,margined(-1,dp(38),1));
        }
        LinearLayout adds=horizontal();
        String[] labels={"+ Toque","↗ Arrastar","+ Sprite","+ Espera"};
        for(int i=0;i<labels.length;i++){
            final int action=i;
            Button add=button(labels[i],9);
            add.setContentDescription("Adicionar etapa: "+labels[i]);
            add.setEnabled(!rotated&&!PgsAutoHostPolicy.OTHER.equals(host)&&
                steps.size()<PgsSequencePolicy.MAX_STEPS);
            add.setOnClickListener(v->{
                if(action==0){dismissAll();actions.sequencePick("TAP",-1,false);}
                else if(action==1){dismissAll();actions.sequencePick("SWIPE",-1,false);}
                else if(action==2)showSequenceSprites(-1);
                else {
                    boolean ok=PgsSequenceStore.add(context,
                        PgsSequencePolicy.waitStep(1000),sequenceLandscape());
                    if(ok&&!PgsSmartSearchSettings.automaticDefaults(context))
                        centralStep=PgsSequenceStore.load(context).size()-1;
                    sequenceEdited(ok);
                }
            });
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(29),1);
            if(i>0)lp.leftMargin=dp(2);
            adds.addView(add,lp);
        }
        root.addView(adds,margined(-1,dp(29),2));
        TextView dragHelp=label("Segure uma etapa e arraste para ordenar",9,false);
        dragHelp.setSingleLine(true);
        dragHelp.setEllipsize(android.text.TextUtils.TruncateAt.END);
        root.addView(dragHelp,margined(-1,dp(18),1));

        LinearLayout items=vertical();
        List<View> stepRows=new ArrayList<>();
        if(steps.isEmpty()){
            TextView empty=label("Toque em + para adicionar a primeira ação. "+
                "Pontos são escolhidos na tela do jogo.",10,false);
            empty.setMaxLines(3);
            items.addView(empty,margined(-1,dp(64),3));
        }
        for(int i=0;i<steps.size();i++){
            final int index=i;
            PgsSequencePolicy.Step step=steps.get(i);
            Button entry=button((i+1)+". "+step.title()+
                (step.type==PgsSequencePolicy.Type.WAIT?
                    " · "+(step.waitMs/1000f)+"s":"")+"  ▾",10);
            markChosen(entry,centralStep==i);
            entry.setContentDescription("Etapa "+(i+1)+
                ". Toque para editar; segure a linha e arraste para reordenar.");
            entry.setOnClickListener(v->{
                centralStep=centralStep==index?-1:index;
                showCentral(1);
            });
            items.addView(entry,margined(-1,dp(28),2));
            stepRows.add(entry);
            holdToReorder(entry,entry,stepRows,index,
                target->!actions.sequenceRunning()&&
                    PgsSequenceStore.moveTo(context,index,target),
                ()->{centralStep=-1;sequenceEdited(true);});
            if(centralStep!=i)continue;
            LinearLayout controls=horizontal();
            String[] icons={"▣ Copiar","× Excluir"};
            for(int j=0;j<icons.length;j++){
                final int op=j;
                Button btn=button(icons[j],10);
                btn.setContentDescription((op==0?"Copiar":"Excluir")+
                    " etapa "+(index+1));
                if(op==1)btn.setTextColor(0xFFFF596C);
                btn.setOnClickListener(v->{
                    boolean ok=op==0?PgsSequenceStore.copy(context,index):
                        PgsSequenceStore.delete(context,index);
                    if(op==1&&ok)centralStep=-1;
                    sequenceEdited(ok);
                });
                LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,dp(27),1);
                if(j>0)p.leftMargin=dp(2);
                controls.addView(btn,p);
            }
            items.addView(controls,margined(-1,dp(27),2));
            if(step.type==PgsSequencePolicy.Type.TAP||
               step.type==PgsSequencePolicy.Type.SWIPE){
                Button source=button("◎ Mover origem",9);
                source.setOnClickListener(v->{dismissAll();
                    actions.sequencePick("EDIT",index,false);});
                items.addView(source,margined(-1,dp(28),2));
                if(step.type==PgsSequencePolicy.Type.SWIPE){
                    Button target=button("↗ Mover destino",9);
                    target.setOnClickListener(v->{dismissAll();
                        actions.sequencePick("EDIT",index,true);});
                    items.addView(target,margined(-1,dp(28),2));
                }
                int[] durations=step.type==PgsSequencePolicy.Type.TAP?
                    new int[]{90,150,220}:
                    new int[]{200,350,500,800,1200,1800};
                Button duration=button("Duração: "+step.gestureMs+" ms ▾",9);
                duration.setOnClickListener(v->{
                    int pos=0;
                    for(int j=0;j<durations.length;j++)
                        if(durations[j]==step.gestureMs){pos=j+1;break;}
                    sequenceEdited(PgsSequenceStore.changeGesture(context,index,
                        durations[pos%durations.length]));
                });
                items.addView(duration,margined(-1,dp(28),2));
            }else if(step.type==PgsSequencePolicy.Type.SPRITE){
                Button sprite=button("◎ Trocar modelo salvo",9);
                sprite.setOnClickListener(v->showSequenceSprites(index));
                items.addView(sprite,margined(-1,dp(28),2));
            }
            int[] waits=step.type==PgsSequencePolicy.Type.WAIT?
                new int[]{500,1000,2000,5000,10000,30000}:
                new int[]{0,300,600,1000,2000,5000,10000};
            Button wait=button((step.type==PgsSequencePolicy.Type.WAIT?
                "Esperar: ":"Após etapa: ")+step.waitMs+" ms ▾",9);
            wait.setOnClickListener(v->{
                int pos=0;
                for(int j=0;j<waits.length;j++)
                    if(waits[j]==step.waitMs){pos=j+1;break;}
                sequenceEdited(PgsSequenceStore.changeWait(context,index,
                    waits[pos%waits.length]));
            });
            items.addView(wait,margined(-1,dp(28),2));
        }
        root.addView(items,margined(-1,-2,3));
        CheckBox consent=new CheckBox(context);
        consent.setText("Autorizar execução da sequência");
        consent.setTextSize(10);consent.setTextColor(fg());
        consent.setChecked(PgsSequenceStore.canRun(context));
        consent.setEnabled(!PgsAutoHostPolicy.OTHER.equals(host));
        consent.setOnCheckedChangeListener((b,on)->{
            PgsSequenceStore.setRunConsent(context,on);
            if(!on)actions.sequenceStop();
        });
        root.addView(consent,margined(-1,dp(30),1));
        LinearLayout extras=horizontal();
        Button paste=button("▣ Colar passo",9);
        paste.setOnClickListener(v->sequenceEdited(
            PgsSequenceStore.paste(context,sequenceLandscape())));
        extras.addView(paste,new LinearLayout.LayoutParams(0,dp(28),1));
        Button clear=button("Limpar etapas",9);
        clear.setContentDescription("Segure para limpar a sequência deste perfil");
        clear.setOnClickListener(v->Toast.makeText(context,
            "Segure para apagar todas as etapas.",Toast.LENGTH_SHORT).show());
        clear.setOnLongClickListener(v->{
            centralStep=-1;
            sequenceEdited(PgsSequenceStore.clear(context));return true;
        });
        LinearLayout.LayoutParams clp=new LinearLayout.LayoutParams(0,dp(28),1);
        clp.leftMargin=dp(3);extras.addView(clear,clp);
        root.addView(extras,margined(-1,dp(28),2));
    }
    private void showSequenceSprites(int editIndex){
        LinearLayout root=panelRoot("◎ SPRITE", "modelo selecionado");
        TextView hint=label("Escolha uma miniatura do feed já carregada "+
            "para o perfil atual. Não reconhecerá Pokémon 3D.",10,false);
        hint.setMaxLines(3);root.addView(hint,margined(-1,dp(55),2));
        ScrollView scroll=new ScrollView(context);
        scroll.setVerticalScrollBarEnabled(false);
        LinearLayout items=vertical();
        int count=0;
        for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.active(context)){
            if(!PgsAutoCatalog.isSelectedName(context,model.name))continue;
            count++;final String id=model.id,name=model.name;
            Button item=button("◎ "+name,10);
            item.setOnClickListener(v->{
                PgsSequencePolicy.Step step=PgsSequencePolicy.sprite(id,name);
                boolean ok=editIndex>=0?
                    PgsSequenceStore.replace(context,editIndex,step):
                    PgsSequenceStore.add(context,step,sequenceLandscape());
                sequenceEdited(ok);
            });
            items.addView(item,margined(-1,dp(29),2));
        }
        if(count==0)items.addView(label("Nenhum modelo ativo. "+
            "Abra Buscar e selecione uma espécie com sprite salva.",10,false));
        scroll.addView(items);
        root.addView(scroll,margined(-1,dp(140),3));
        Button back=button("← Sequência",10);
        back.setOnClickListener(v->showSequence());
        root.addView(back,margined(-1,dp(29),4));
        mount(root,238,265);
    }
    // Passo expandido dentro da mesma aba, sem abrir popup independente.
    void showSequenceStep(int index){
        centralStep=index;
        showSequence();
    }

    void showAutoHunt(){
        String host=PgsAutoHostSettings.current(context);
        SharedPreferences prefs=PgsAutoHuntSettings.forCurrent(context);
        LinearLayout root=panelRoot("✦ AUTO HUNT",
            PgsAutoHostPolicy.shortLabel(host));
        TextView intro=label("Configurações exclusivas de "+
            PgsAutoHostPolicy.displayLabel(host)+" · busca iniciada manualmente",9,false);
        intro.setMaxLines(2);
        root.addView(intro,margined(-1,dp(35),2));
        ScrollView scroll=new ScrollView(context);
        scroll.setVerticalScrollBarEnabled(false);
        LinearLayout content=vertical();

        if(PgsAutoHostPolicy.OTHER.equals(host)){
            TextView preview=label("Outro cliente: somente prévia. "+
                "Selecione PGSharp ou Pokemod em Buscar → Interface.",10,false);
            preview.setMaxLines(3);
            content.addView(preview,margined(-1,dp(65),4));
        }else{
            huntCheckbox(content,prefs,PgsAutoHuntSettings.ENABLED,
                "Auto Hunt · opt-in",false);
            huntCheckbox(content,prefs,PgsAutoHuntSettings.CLICK_ENABLED,
                "Tocar sprite confirmada (exige 2 leituras)",false);
            huntNumeric(content,prefs,PgsAutoHuntSettings.WAIT,
                "Espera entre alvos",new int[]{15,35,60,120},35);
            huntNumeric(content,prefs,PgsAutoHuntSettings.MAX_CLICKS,
                "Limite de toques por sessão",new int[]{1,3,5,10},10);

            TextView stop=label("PARAR AO RECEBER AVISO EXPLÍCITO",10,true);
            root.setContentDescription("Auto Hunt · opções compactas do "+
                PgsAutoHostPolicy.displayLabel(host));
            content.addView(stop,margined(-1,dp(26),5));
            CheckBox shiny=new CheckBox(context);
            shiny.setText("Shiny · pausa de segurança obrigatória");
            shiny.setTextSize(10);shiny.setTextColor(fg());
            shiny.setChecked(true);shiny.setEnabled(false);
            content.addView(shiny,margined(-1,dp(28),1));
            huntCheckbox(content,prefs,PgsAutoHuntSettings.STOP_IV100,
                "IV100 · alvo nomeado na notificação",true);
            huntCheckbox(content,prefs,PgsAutoHuntSettings.STOP_DITTO,
                "Ditto · aviso de encontro explícito",true);
            TextView warning=label("Só pausa se a notificação nomear "+
                "o alvo atual. IV/espécie não são inferidos de ícones.",9,false);
            warning.setMaxLines(2);
            content.addView(warning,margined(-1,dp(36),1));

            TextView alerts=label("ALERTAS E INFORMAÇÕES",10,true);
            content.addView(alerts,margined(-1,dp(22),5));
            huntCheckbox(content,prefs,PgsAutoHuntSettings.RINGTONE,
                "Som nos avisos de Auto Hunt",true);
            huntCheckbox(content,prefs,PgsAutoHuntSettings.VIBRATE,
                "Vibrar nos avisos de Auto Hunt",true);
            huntCheckbox(content,prefs,PgsAutoHuntSettings.SHOW_COOLDOWN,
                "Contagem de espera na bolha",false);
            huntCheckbox(content,prefs,PgsAutoHuntSettings.SHOW_INFO,
                "Nome do alvo no feedback",true);

            TextView recovery=label("MAPA · RECUPERAÇÃO DE LEITURA",10,true);
            content.addView(recovery,margined(-1,dp(23),5));
            // Sensor de proximidade Android: apenas pausa; não toca no jogo.
            android.hardware.SensorManager sensors=(android.hardware.SensorManager)
                context.getSystemService(Context.SENSOR_SERVICE);
            if(sensors!=null&&sensors.getDefaultSensor(
                    android.hardware.Sensor.TYPE_PROXIMITY)!=null)
                huntCheckbox(content,prefs,PgsAutoHuntSettings.PROXIMITY,
                    "Sensor proximidade · pausar se coberto",false);
            else huntUnavailable(content,"Sensor proximidade",
                "Este aparelho não informa sensor de proximidade");
            huntCheckbox(content,prefs,PgsAutoHuntSettings.FIX_MAP,
                "Repetir captura se falhar (sem clicar)",false);
            huntNumeric(content,prefs,PgsAutoHuntSettings.MAP_RETRY,
                "Falhas de leitura aceitas",new int[]{0,1,2,3},3);
            TextView mapHelp=label("Avisos da conta e falta de reação "+
                "visual sempre pausam. Nenhum restart automático.",9,false);
            mapHelp.setMaxLines(2);
            content.addView(mapHelp,margined(-1,dp(34),1));
            Button notification=button("⚙ Acesso a notificações do Android",10);
            notification.setOnClickListener(v->{
                hidePanel();
                try{
                    android.content.Intent intent=new android.content.Intent(
                        android.provider.Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                }catch(Exception e){
                    Toast.makeText(context,
                        "Abra Configurações → Acesso a notificações e habilite "+
                        "o PokeSearch manualmente.",Toast.LENGTH_LONG).show();
                }
            });
            content.addView(notification,margined(-1,dp(35),5));
        }
        TextView future=label("INTEGRAÇÕES QUE EXIGEM CONFIRMAÇÃO DO JOGO",10,true);
        content.addView(future,margined(-1,dp(24),6));
        huntUnavailable(content,"Tele por IV100/Shiny",
            "Não há API de teleporte validada para os dois clientes");
        huntUnavailable(content,"Reiniciar PoGo por falha",
            "Pode perder sessão e avisos; requer mecanismo Android validado");
        huntUnavailable(content,"Auto Catch / lançar bolas",
            "Encontro, arremesso e captura não foram homologados");
        huntUnavailable(content,"Zoom máximo",
            "Ação ainda não ligada ao ciclo visual");
        scroll.addView(content);
        // Reservar espaço para cabeçalho e botão Voltar mesmo com a opção
        // de altura reduzida no Editor Visual das Pokébolas.
        int popupHeight=PgsAutoMenuStyle.read(context).popupHeight;
        if(popupHeight<200)intro.setVisibility(View.GONE);
        int scrollHeight=Math.max(29,Math.min(230,
            popupHeight-(intro.getVisibility()==View.GONE?88:133)));
        root.addView(scroll,margined(-1,dp(scrollHeight),4));
        Button back=button("← Buscar Pokémon",10);
        back.setOnClickListener(v->showSearch());
        root.addView(back,margined(-1,dp(31),4));
        mount(root,238,340);
    }

    void showTime(){
        LinearLayout root=panelRoot("⏱ TEMPOS",null);
        SharedPreferences prefs=PgsAutoClickService.cyclePrefs(context);
        String[] keys={"load_timeout","post_load"};
        String[] names={"Cooldown Mapa","Sem Shiny"};
        int[] defaults={PgsAutoCyclePolicy.DEFAULT_MAP_TIMEOUT_SECONDS,
            PgsAutoCyclePolicy.DEFAULT_SHINY_CHECK_SECONDS};
        EditText[] inputs=new EditText[2];
        for(int i=0;i<2;i++){
            LinearLayout row=horizontal();
            TextView name=label(names[i],11,false);
            row.addView(name,new LinearLayout.LayoutParams(0,dp(40),1));
            EditText edit=new EditText(context);
            edit.setSingleLine(true);edit.setTextSize(13);
            edit.setTextColor(fg());edit.setGravity(Gravity.CENTER);
            edit.setIncludeFontPadding(false);
            edit.setMinHeight(0);edit.setMinimumHeight(0);
            edit.setPadding(dp(3),0,dp(3),0);
            edit.setSelectAllOnFocus(true);
            edit.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_DONE);
            edit.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
            int value=prefs.getInt(keys[i],defaults[i]);
            value=i==0?PgsAutoCyclePolicy.mapTimeoutSeconds(value):
                PgsAutoCyclePolicy.shinyCheckSeconds(value);
            edit.setText(String.valueOf(value));
            PgsAutoMenuStyle style=PgsAutoMenuStyle.read(context);
            edit.setBackground(bg(style.tileFill(),style.tileStroke(),6));
            row.addView(edit,new LinearLayout.LayoutParams(dp(49),dp(38)));
            root.addView(row,margined(-1,dp(42),3));
            inputs[i]=edit;
        }
        Button apply=button("✓ Salvar",11);
        root.addView(apply,margined(-1,dp(36),4));
        apply.setOnClickListener(v->{
            try{
                int[] nums=new int[2];
                for(int i=0;i<2;i++){
                    nums[i]=Integer.parseInt(inputs[i].getText().toString().trim());
                    if(nums[i]<0 || (i==0&&nums[i]==0)){
                        Toast.makeText(context,i==0?
                            "Cooldown Mapa exige pelo menos 1 segundo; sem teto máximo.":
                            "Sem Shiny aceita 0 ou mais segundos.",Toast.LENGTH_LONG).show();
                        return;
                    }
                }
                prefs.edit().putInt(keys[0],nums[0]).putInt(keys[1],nums[1])
                    .putBoolean("lt344_timeout_user_set",true).apply();
                hidePanel();
            }catch(NumberFormatException error){
                Toast.makeText(context,"Digite valores em segundos.",Toast.LENGTH_LONG).show();
            }
        });
        mount(root,190,182);
    }

    void showAppearance(){
        SharedPreferences prefs=context.getSharedPreferences("pgs_auto_settings_v1",Context.MODE_PRIVATE);
        LinearLayout root=panelRoot("⚙ PERSONALIZAÇÃO",null);
        CheckBox timers=new CheckBox(context);
        timers.setText("Contadores regressivos");
        timers.setTextSize(11);timers.setTextColor(fg());
        timers.setButtonTintList(android.content.res.ColorStateList.valueOf(fg()));
        timers.setChecked(prefs.getBoolean("showCountdown",false));
        timers.setOnCheckedChangeListener((control,on)->{
            prefs.edit().putBoolean("showCountdown",on).apply();
            actions.appearanceChanged();
        });
        root.addView(timers,margined(-1,dp(30),2));

        TextView artTitle=label("Tamanho dos ícones",11,true);
        root.addView(artTitle,margined(-1,dp(20),3));
        LinearLayout scale=horizontal();scale.setGravity(Gravity.CENTER);
        final String saved=prefs.getString("iconScale","M");
        for(String value:new String[]{"P","M","G"}){
            Button option=button(value,12);
            markChosen(option,value.equals(saved));
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,dp(29),1f);
            p.leftMargin=dp(3);
            scale.addView(option,p);
            option.setOnClickListener(v->{
                prefs.edit().putString("iconScale",value).apply();
                actions.appearanceChanged();
                for(int n=0;n<scale.getChildCount();n++){
                    Button b=(Button)scale.getChildAt(n);
                    markChosen(b,value.equals(b.getText().toString()));
                }
            });
        }
        root.addView(scale,margined(-1,dp(32),2));
        // The Pokébola Editor Visual is the single source of menu appearance.
        // Keep PGS-only choices (icons, countdown and tap indicator) separate.
        TextView inherited=label("Cores e transparência: Editor Visual das Pokébolas",10,false);
        inherited.setMaxLines(2);
        inherited.setGravity(Gravity.TOP|Gravity.LEFT);
        inherited.setLineSpacing(0,1f);
        root.addView(inherited,margined(-1,-2,4));
        CheckBox tapFeedback=new CheckBox(context);
        tapFeedback.setText("Mostrar local do toque");
        tapFeedback.setTextSize(11);tapFeedback.setTextColor(fg());
        tapFeedback.setButtonTintList(android.content.res.ColorStateList.valueOf(fg()));
        tapFeedback.setChecked(prefs.getBoolean("showTapIndicator",true));
        tapFeedback.setOnCheckedChangeListener((control,on)->
            prefs.edit().putBoolean("showTapIndicator",on).apply());
        // Pequena prévia do efeito: não envia nenhum toque ao jogo.
        LinearLayout tapRow=horizontal();
        tapRow.setGravity(Gravity.CENTER_VERTICAL);
        tapRow.addView(tapFeedback,new LinearLayout.LayoutParams(0,dp(30),1));
        Button preview=button("◎",14);
        preview.setBackground(null);
        preview.setTextColor(fg());
        preview.setContentDescription("Prévia do efeito de toque (sem clicar no jogo)");
        preview.setOnClickListener(v->actions.previewTapIndicator());
        tapRow.addView(preview,new LinearLayout.LayoutParams(dp(30),dp(30)));
        root.addView(tapRow,margined(-1,dp(40),5));
        mount(root,220,218);
    }

    void showNotifications(){
        // Mesmo padrão compacto do dock.html: 138dp, ícones 30dp,
        // traços brancos das caixas Som / Sem som / OFF, SEM estrela.
        LinearLayout root=vertical();
        root.setPadding(dp(4),dp(4),dp(4),dp(4));
        root.setBackground(bg(panelFill(),0x33FFFFFF,8));
        TextView head=label("NOTIFICAÇÕES",10,true);
        head.setGravity(Gravity.CENTER);
        root.addView(head,new LinearLayout.LayoutParams(-1,dp(22)));
        SharedPreferences prefs=context.getSharedPreferences("pgs_auto_settings_v1",Context.MODE_PRIVATE);
        // Apenas duas categorias: lista atualizada e Shiny do alvo monitorado.
        // SEARCH antigo fica aceito na migração, mas não gera mais novo alerta.
        String[] names={"Novos Pokémon","Shiny monitorado"};
        String[] keys={PgsAutoNotificationPolicy.NEW,PgsAutoNotificationPolicy.SHINY};
        int[] glyphs={R.drawable.pgs_speaker_on,
            R.drawable.pgs_speaker_silent,R.drawable.pgs_speaker_off};
        String[] modes={"default","mute","off"};
        String[] hints={"Com som","Sem som","Desligado"};
        for(int i=0;i<keys.length;i++){
            final String kind=keys[i];
            LinearLayout section=vertical();
            TextView name=label(names[i],10,true);
            name.setGravity(Gravity.CENTER);
            section.addView(name,new LinearLayout.LayoutParams(-1,dp(17)));
            LinearLayout controls=horizontal();
            controls.setGravity(Gravity.CENTER);
            String selected=PgsAutoNotificationPolicy.mode(kind,
                prefs.getString(kind,PgsAutoNotificationPolicy.defaultMode(kind)));
            ImageButton[] buttons=new ImageButton[3];
            for(int j=0;j<3;j++){
                final int index=j;
                ImageButton icon=imageButton(glyphs[j],
                    names[i]+" · "+hints[j],7);
                buttons[j]=icon;
                markAlertIcon(icon,j==0?
                    ("default".equals(selected)||"strong".equals(selected)||"custom".equals(selected)):
                    modes[j].equals(selected));
                LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(dp(30),dp(30));
                if(j>0)cp.leftMargin=dp(4);
                controls.addView(icon,cp);
                icon.setOnClickListener(v->{
                    prefs.edit().putString(kind,modes[index]).apply();
                    for(int k=0;k<3;k++)markAlertIcon(buttons[k],k==index);
                });
            }
            section.addView(controls,new LinearLayout.LayoutParams(-1,dp(30)));
            Button tone=button("custom".equals(selected)?"Personalizado":"Padrão",10);
            LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(dp(98),dp(23));
            tp.gravity=Gravity.CENTER_HORIZONTAL;tp.topMargin=dp(3);
            section.addView(tone,tp);
            tone.setContentDescription("Selecionar som · "+names[i]+
                ". Segure para testar a notificação.");
            tone.setOnClickListener(v->showSoundPicker(kind));
            tone.setOnLongClickListener(v->{
                actions.testNotification(kind);return true;
            });
            LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(-1,dp(77));
            root.addView(section,sp);
        }
        // Monitor passivo é opt-in: reutiliza espécies marcadas na Busca e
        // o canal Novos Pokémon, mas NUNCA executa gestos.
        boolean watchEnabled=PgsAutoWatchSettings.enabled(context);
        Button monitor=button(watchEnabled?
            "◎ Monitor sem clique · ON":"◎ Monitor sem clique · OFF",10);
        monitor.setContentDescription(
            "Monitorar as espécies selecionadas na lista do "+
            PgsAutoHostPolicy.displayLabel(PgsAutoHostSettings.current(context))+
            " sem realizar toques. "+
            (watchEnabled?"Ativo, toque para desativar.":"Desligado, toque para ativar."));
        markChosen(monitor,watchEnabled);
        monitor.setOnClickListener(v->{
            actions.setWatchEnabled(!watchEnabled);
            showNotifications(); // Lê o estado realmente aceito pelo serviço.
        });
        root.addView(monitor,margined(-1,dp(32),4));
        TextView help=label("Favoritos da Busca · 2 leituras · a cada 25s",9,false);
        help.setGravity(Gravity.CENTER);
        root.addView(help,margined(-1,dp(17),1));
        CheckBox vibrate=new CheckBox(context);
        vibrate.setText("Vibrar Shiny");
        vibrate.setTextSize(10);vibrate.setTextColor(fg());
        vibrate.setButtonTintList(android.content.res.ColorStateList.valueOf(fg()));
        vibrate.setChecked(prefs.getBoolean("shinyVibrate",true));
        vibrate.setOnCheckedChangeListener((view,on)->
            prefs.edit().putBoolean("shinyVibrate",on).apply());
        root.addView(vibrate,new LinearLayout.LayoutParams(-1,dp(31)));
        mount(root,180,275);
    }
    private void showSoundPicker(String key){
        if(!PgsAutoNotificationPolicy.validKind(key))return;
        SharedPreferences prefs=context.getSharedPreferences("pgs_auto_settings_v1",Context.MODE_PRIVATE);
        LinearLayout root=panelRoot("♫ SOM · BUSCA POKÉMON",null);

        ScrollView scroll=new ScrollView(context);
        LinearLayout list=vertical();
        Button[] buttons=new Button[PokeSoundLibrary.size()];
        int saved=prefs.getInt(key+"SoundIndex",PgsAutoNotificationPolicy.SHINY.equals(key)?21:0);
        if(saved<0||saved>=buttons.length)saved=0;
        final int[] selected={saved};
        for(int i=0;i<buttons.length;i++){
            final int index=i;
            Button option=button(PokeSoundLibrary.LABELS[i],11);
            option.setGravity(Gravity.LEFT|Gravity.CENTER_VERTICAL);
            buttons[i]=option;
            markChosen(option,i==selected[0]);
            list.addView(option,margined(-1,dp(35),2));
            option.setOnClickListener(v->{
                stopTonePreview();
                selected[0]=index;
                for(int j=0;j<buttons.length;j++)
                    markChosen(buttons[j],j==index);
                try{
                    android.net.Uri uri=PokeSoundLibrary.soundUri(context,index);
                    if(uri!=null){
                        tonePreview=android.media.RingtoneManager.getRingtone(context,uri);
                        if(tonePreview!=null)tonePreview.play();
                    }
                }catch(Exception ignored){}
            });
        }
        scroll.addView(list);
        root.addView(scroll,new LinearLayout.LayoutParams(-1,dp(235)));
        Button apply=button("✓ Usar áudio",12);
        root.addView(apply,margined(-1,dp(42),6));
        apply.setOnClickListener(v->{
            stopTonePreview();
            prefs.edit().putString(key,"custom")
                .putInt(key+"SoundIndex",selected[0]).apply();
            Toast.makeText(context,"Som exclusivo do PGS salvo.",Toast.LENGTH_SHORT).show();
            showNotifications();
        });
        mount(root,220,365);
        scroll.post(()->scroll.scrollTo(0,
            Math.max(0,buttons[selected[0]].getTop()-dp(28))));
    }

}
