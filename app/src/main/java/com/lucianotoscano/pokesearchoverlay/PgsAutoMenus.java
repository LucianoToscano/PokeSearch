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
    void toggle(int x,int y){if(toolbar!=null){dismissAll();return;}showToolbar(x,y);}
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
        if(toolbar==null)return;
        if(!(toolbar.getLayoutParams() instanceof WindowManager.LayoutParams))return;
        WindowManager.LayoutParams lp=(WindowManager.LayoutParams)toolbar.getLayoutParams();
        // Recompute absolute side selection, not delta: crossing screen center
        // must flip the toolbar to the other side of the Auto Click bubble.
        positionToolbar(lp,x,y,PgsAutoMenuStyle.read(context));
        try{wm.updateViewLayout(toolbar,lp);}catch(Exception ignored){}
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
    private int[] positionPanel(int width,int height){
        Point screen=size();
        int margin=dp(8),gap=dp(4);
        int barX=anchorX,barY=anchorY;
        int barW=dp(TOOL_CELL_DP),barH=dp(TOOL_CELL_DP);
        if(toolbar!=null&&toolbar.getLayoutParams() instanceof WindowManager.LayoutParams){
            WindowManager.LayoutParams bar=(WindowManager.LayoutParams)toolbar.getLayoutParams();
            barX=bar.x;barY=bar.y;barW=bar.width;barH=bar.height;
        }
        int right=barX+barW+gap,left=barX-width-gap;
        boolean preferRight=anchorX<=screen.x/2;
        boolean rightFits=right+width<=screen.x-margin;
        boolean leftFits=left>=margin;
        int px,py;
        if((preferRight&&rightFits)||(!leftFits&&rightFits)){
            px=right;py=barY;
        }else if(leftFits){
            px=left;py=barY;
        }else{
            // When a 232dp popup cannot fit next to a five-tile toolbar,
            // use directly below/above it rather than drawing over its icons.
            px=barX+(barW-width)/2;
            int below=barY+barH+gap,above=barY-height-gap;
            py=below+height<=screen.y-margin?below:
                above>=margin?above:Math.max(margin,screen.y-height-margin);
        }
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
                if(panel==opened&&toolbar!=null)reanchor(anchorX,anchorY);
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
        if(selectedTab==0)appendCentralPokemon(root);
        else if(selectedTab==1)appendCentralActions(root);
        else appendCentralSettings(root);

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
        LinearLayout info=horizontal();
        TextView infoText=label("Modelos salvos usados automaticamente",9,false);
        info.addView(infoText,new LinearLayout.LayoutParams(0,dp(22),1));
        Button host=button(PgsAutoHostPolicy.shortLabel(
            PgsAutoHostSettings.current(context))+" ▾",9);
        host.setContentDescription("Selecionar interface do jogo");
        host.setOnClickListener(v->showHostProfiles());
        info.addView(host,new LinearLayout.LayoutParams(dp(55),dp(26)));
        root.addView(info,margined(-1,dp(26),2));
        TextView title=label("Selecionados: 0/10",10,true);
        EditText input=new EditText(context);
        input.setTextSize(13);input.setSingleLine(true);
        input.setTextColor(fg());input.setHintTextColor(0xFF9CA8B8);
        input.setHint("Nome ou #");
        input.setPadding(dp(8),0,dp(8),0);
        input.setBackground(bg(TILE,0x33FFFFFF,7));
        LinearLayout rows=vertical();
        ScrollView scroll=new ScrollView(context);
        scroll.setVerticalScrollBarEnabled(false);
        scroll.addView(rows);
        root.addView(title,margined(-1,dp(20),2));
        // LT368: pesquisa acima da lista, não escondida no rodapé.
        root.addView(input,margined(-1,dp(33),3));
        root.addView(scroll,margined(-1,dp(155),3));
        final Runnable[] render={null};
        render[0]=()->{
            rows.removeAllViews();
            title.setText("Selecionados: "+PgsAutoCatalog.selected(context).size()+"/10");
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
                    // Único ícone de segurar/arrastar — no lugar das setas.
                    // O deslocamento é calculado por linhas, preservando a
                    // ordenação persistida PgsAutoCatalog e os modelos salvos.
                    ImageButton reorder=imageButton(R.drawable.pgs_drag_handle,
                        "Segure e arraste para reorganizar "+pokemon.name,6);
                    reorder.setColorFilter(fg());
                    line.addView(reorder,new LinearLayout.LayoutParams(dp(28),dp(33)));
                    reorder.setOnClickListener(v->
                        Toast.makeText(context,"Segure e arraste o ícone para mudar a ordem",
                            Toast.LENGTH_SHORT).show());
                    // TalkBack pode reordenar sem gestos de arraste.
                    reorder.setAccessibilityDelegate(new View.AccessibilityDelegate(){
                        @Override public void onInitializeAccessibilityNodeInfo(
                                View host,android.view.accessibility.AccessibilityNodeInfo info){
                            super.onInitializeAccessibilityNodeInfo(host,info);
                            info.addAction(android.view.accessibility.AccessibilityNodeInfo
                                .AccessibilityAction.ACTION_SCROLL_FORWARD);
                            info.addAction(android.view.accessibility.AccessibilityNodeInfo
                                .AccessibilityAction.ACTION_SCROLL_BACKWARD);
                        }
                        @Override public boolean performAccessibilityAction(
                                View host,int action,android.os.Bundle args){
                            if(action==android.view.accessibility.AccessibilityNodeInfo
                                .ACTION_SCROLL_FORWARD){
                                PgsAutoCatalog.move(context,pokemon.number,1);
                                render[0].run();return true;
                            }
                            if(action==android.view.accessibility.AccessibilityNodeInfo
                                .ACTION_SCROLL_BACKWARD){
                                PgsAutoCatalog.move(context,pokemon.number,-1);
                                render[0].run();return true;
                            }
                            return super.performAccessibilityAction(host,action,args);
                        }
                    });
                    reorder.setOnTouchListener(new View.OnTouchListener(){
                        private float downY;
                        private long downAt;
                        private boolean moved;
                        @Override public boolean onTouch(View view,MotionEvent e){
                            switch(e.getActionMasked()){
                                case MotionEvent.ACTION_DOWN:
                                    downY=e.getRawY();
                                    downAt=android.os.SystemClock.uptimeMillis();
                                    moved=false;
                                    view.getParent().requestDisallowInterceptTouchEvent(true);
                                    return true;
                                case MotionEvent.ACTION_MOVE:{
                                    float distance=e.getRawY()-downY;
                                    if(Math.abs(distance)>dp(6)&&
                                        android.os.SystemClock.uptimeMillis()-downAt>=110){
                                        if(!moved)view.performHapticFeedback(
                                            android.view.HapticFeedbackConstants.LONG_PRESS);
                                        moved=true;
                                        view.setTranslationY(Math.max(-dp(100),
                                            Math.min(dp(100),distance)));
                                        line.setAlpha(.79f);
                                    }
                                    return true;
                                }
                                case MotionEvent.ACTION_UP:{
                                    float distance=e.getRawY()-downY;
                                    view.setTranslationY(0f);line.setAlpha(1f);
                                    if(moved){
                                        int steps=Math.max(-9,Math.min(9,
                                            Math.round(distance/dp(50f))));
                                        if(steps!=0){
                                            for(int step=0;step<Math.abs(steps);step++){
                                                if(steps<0)PgsAutoCatalog.move(context,pokemon.number,-1);
                                                else PgsAutoCatalog.move(context,pokemon.number,1);
                                            }
                                            render[0].run();
                                        }
                                    }else view.performClick();
                                    return true;
                                }
                                case MotionEvent.ACTION_CANCEL:
                                    view.setTranslationY(0f);line.setAlpha(1f);
                                    return true;
                                default:return false;
                            }
                        }
                    });
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

    private void appendCentralActions(LinearLayout root){
        String current=PgsSmartSearchSettings.mode(context);
        String[] ids={PgsSmartSearchSettings.MONITOR,PgsSmartSearchSettings.CLICK,
            PgsSmartSearchSettings.HUNT,PgsSmartSearchSettings.SEQUENCE};
        String[] names={"◎ Monitorar","⌖ Clicar","✦ Auto Hunt","≡ Sequência"};
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
                huntNumeric(root,hunt,PgsAutoHuntSettings.WAIT,
                    "Espera entre alvos",new int[]{15,35,60,120},35);
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

    private void appendCentralSettings(LinearLayout root){
        CheckBox automatic=new CheckBox(context);
        automatic.setText("Preencher tempos padrão automaticamente");
        automatic.setTextSize(10);automatic.setTextColor(fg());
        automatic.setChecked(PgsSmartSearchSettings.automaticDefaults(context));
        automatic.setOnCheckedChangeListener((b,on)->
            PgsSmartSearchSettings.setAutomaticDefaults(context,on));
        root.addView(automatic,margined(-1,dp(36),2));

        SharedPreferences hunt=PgsAutoHuntSettings.forCurrent(context);
        huntNumeric(root,hunt,PgsAutoHuntSettings.WAIT,
            "Espera entre alvos",new int[]{15,35,60,120},35);
        SharedPreferences cycles=PgsAutoClickService.cyclePrefs(context);
        int[] mapValues={15,25,35,60,120};
        int mapCurrent=cycles.getInt("load_timeout",
            PgsAutoCyclePolicy.DEFAULT_MAP_TIMEOUT_SECONDS);
        Button map=button("Tempo do mapa: "+mapCurrent+"s ▾",10);
        map.setOnClickListener(v->{
            int index=0;
            for(int i=0;i<mapValues.length;i++)
                if(mapValues[i]==cycles.getInt("load_timeout",25)){
                    index=i+1;break;
                }
            int value=mapValues[index%mapValues.length];
            cycles.edit().putInt("load_timeout",value)
                .putBoolean("lt344_timeout_user_set",true).apply();
            map.setText("Tempo do mapa: "+value+"s ▾");
        });
        root.addView(map,margined(-1,dp(31),3));

        SharedPreferences alerts=context.getSharedPreferences(
            "pgs_auto_settings_v1",Context.MODE_PRIVATE);
        String[] keys={PgsAutoNotificationPolicy.NEW,PgsAutoNotificationPolicy.SHINY};
        String[] labels={"Notificar novos Pokémon","Notificar Shiny monitorado"};
        for(int i=0;i<keys.length;i++){
            final String kind=keys[i];
            CheckBox notification=new CheckBox(context);
            notification.setText(labels[i]);notification.setTextSize(10);
            notification.setTextColor(fg());
            notification.setChecked(!"off".equals(PgsAutoNotificationPolicy.mode(
                kind,alerts.getString(kind,
                    PgsAutoNotificationPolicy.defaultMode(kind)))));
            notification.setOnCheckedChangeListener((b,on)->
                alerts.edit().putString(kind,on?"default":"off").apply());
            root.addView(notification,margined(-1,dp(30),1));
        }
        CheckBox pulse=new CheckBox(context);
        pulse.setText("Mostrar local do toque");pulse.setTextSize(10);
        pulse.setTextColor(fg());
        pulse.setChecked(alerts.getBoolean("showTapIndicator",true));
        pulse.setOnCheckedChangeListener((b,on)->
            alerts.edit().putBoolean("showTapIndicator",on).apply());
        root.addView(pulse,margined(-1,dp(30),1));

        Button advanced=button(centralAdvanced?"⌃ Recolher avançado":
            "⌄ Mais opções",10);
        advanced.setOnClickListener(v->{centralAdvanced=!centralAdvanced;showCentral(2);});
        root.addView(advanced,margined(-1,dp(30),3));
        if(centralAdvanced){
            LinearLayout row=horizontal();
            String[] labelsAdvanced={"Alvo","Tempos","Avisos","Visual"};
            Runnable[] handlers={this::showTargets,this::showTime,
                this::showNotifications,this::showAppearance};
            for(int i=0;i<labelsAdvanced.length;i++){
                final int j=i;
                Button button=button(labelsAdvanced[i],9);
                button.setOnClickListener(v->handlers[j].run());
                LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(28),1);
                if(i>0)lp.leftMargin=dp(2);
                row.addView(button,lp);
            }
            root.addView(row,margined(-1,dp(28),2));
            Button huntMore=button("Configurações avançadas do Auto Hunt",9);
            huntMore.setOnClickListener(v->showAutoHunt());
            root.addView(huntMore,margined(-1,dp(29),2));
        }
    }

    private boolean hasCentralSprite(){
        for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.active(context))
            if(PgsAutoCatalog.isSelectedName(context,model.name))return true;
        return false;
    }
    private void startCentral(){
        String host=PgsAutoHostSettings.current(context);
        String mode=PgsSmartSearchSettings.mode(context);
        if(PgsAutoHostPolicy.OTHER.equals(host)){
            Toast.makeText(context,"Outro cliente: somente prévia. "+
                "Selecione PGSharp ou Pokemod.",Toast.LENGTH_LONG).show();return;
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
    void showSequence(){
        String host=PgsAutoHostSettings.current(context);
        List<PgsSequencePolicy.Step> steps=PgsSequenceStore.load(context);
        boolean rotated=!steps.isEmpty()&&
            PgsSequenceStore.landscape(context)!=sequenceLandscape();
        LinearLayout root=panelRoot("◎ SEQUÊNCIAS",
            PgsAutoHostPolicy.shortLabel(host)+" · "+steps.size()+"/"+
            PgsSequencePolicy.MAX_STEPS);
        TextView caption=label(
            rotated?"Gire a tela para a orientação em que os pontos foram criados":
            "Pontos normalizados · toques somente após ativação explícita",9,false);
        caption.setMaxLines(2);
        root.addView(caption,margined(-1,dp(24),1));

        LinearLayout adds=horizontal();
        String[] titles={"+ Toque","↗ Arrastar","+ Sprite","+ Espera"};
        for(int i=0;i<4;i++){
            final int action=i;
            Button b=button(titles[i],9);
            b.setContentDescription("Adicionar etapa: "+titles[i]);
            b.setEnabled(!rotated&&!PgsAutoHostPolicy.OTHER.equals(host)&&
                steps.size()<PgsSequencePolicy.MAX_STEPS);
            b.setOnClickListener(v->{
                if(action==0){dismissAll();actions.sequencePick("TAP",-1,false);}
                else if(action==1){dismissAll();actions.sequencePick("SWIPE",-1,false);}
                else if(action==2)showSequenceSprites(-1);
                else sequenceEdited(PgsSequenceStore.add(context,
                    PgsSequencePolicy.waitStep(1000),sequenceLandscape()));
            });
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,dp(31),1);
            if(i>0)p.leftMargin=dp(2);
            adds.addView(b,p);
        }
        root.addView(adds,margined(-1,dp(31),3));

        ScrollView scroll=new ScrollView(context);
        scroll.setVerticalScrollBarEnabled(false);
        LinearLayout items=vertical();
        if(steps.isEmpty()){
            TextView empty=label("Use + para criar passos. Toque no número "+
                "depois para editar posição, duração e espera.",10,false);
            empty.setMaxLines(3);
            items.addView(empty,margined(-1,dp(65),2));
        }
        for(int i=0;i<steps.size();i++){
            final int index=i;
            PgsSequencePolicy.Step st=steps.get(i);
            LinearLayout line=horizontal();
            Button edit=button((i+1)+"  "+st.title()+
                (st.type==PgsSequencePolicy.Type.WAIT?
                " · "+st.waitMs/1000f+"s":""),10);
            edit.setContentDescription("Editar etapa "+(i+1)+" "+st.title());
            edit.setOnClickListener(v->showSequenceStep(index));
            line.addView(edit,new LinearLayout.LayoutParams(0,dp(29),1));
            String[] icons={"↑","↓","×"};
            for(int j=0;j<3;j++){
                final int op=j;
                Button button=button(icons[j],12);
                button.setContentDescription((op==0?"Subir":op==1?"Descer":"Excluir")+
                    " etapa "+(i+1));
                if(op==0&&i==0||op==1&&i==steps.size()-1)
                    button.setEnabled(false);
                button.setOnClickListener(v->{
                    boolean ok=op==0?PgsSequenceStore.move(context,index,-1):
                        op==1?PgsSequenceStore.move(context,index,1):
                            PgsSequenceStore.delete(context,index);
                    sequenceEdited(ok);
                });
                LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(
                    dp(27),dp(29));p.leftMargin=dp(2);line.addView(button,p);
            }
            items.addView(line,margined(-1,dp(29),2));
        }
        scroll.addView(items);
        int available=PgsAutoMenuStyle.read(context).popupHeight;
        if(available<280)caption.setVisibility(View.GONE);
        int scrollHeight=Math.max(30,Math.min(165,
            available-(caption.getVisibility()==View.GONE?187:213)));
        root.addView(scroll,margined(-1,dp(scrollHeight),3));

        CheckBox consent=new CheckBox(context);
        consent.setText("Autorizar execução de gestos neste perfil");
        consent.setTextSize(9);consent.setTextColor(fg());
        consent.setChecked(PgsSequenceStore.canRun(context));
        consent.setEnabled(!PgsAutoHostPolicy.OTHER.equals(host));
        consent.setOnCheckedChangeListener((b,enabled)->{
            PgsSequenceStore.setRunConsent(context,enabled);
            if(!enabled)actions.sequenceStop();
        });
        root.addView(consent,margined(-1,dp(28),1));
        LinearLayout controls=horizontal();
        String[] labels={"◉ Prévia","▷ Executar","▣ Colar"};
        for(int i=0;i<labels.length;i++){
            final int key=i;Button btn=button(labels[i],10);
            btn.setEnabled(!rotated&&!steps.isEmpty()&&
                !PgsAutoHostPolicy.OTHER.equals(host));
            if(i==2)btn.setEnabled(!rotated&&!PgsAutoHostPolicy.OTHER.equals(host));
            btn.setOnClickListener(v->{
                if(key==0){dismissAll();actions.sequencePreview();}
                else if(key==1){
                    if(!PgsSequenceStore.canRun(context)){
                        Toast.makeText(context,"Ative autorização de execução "+
                            "para este cliente.",Toast.LENGTH_LONG).show();return;
                    }
                    dismissAll();actions.sequenceRun();
                }else sequenceEdited(PgsSequenceStore.paste(
                    context,sequenceLandscape()));
            });
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,dp(31),1);
            if(i>0)p.leftMargin=dp(3);controls.addView(btn,p);
        }
        root.addView(controls,margined(-1,dp(31),3));

        LinearLayout bottom=horizontal();
        Button stop=button("■ Parar",10);
        stop.setOnClickListener(v->{actions.sequenceStop();showSequence();});
        bottom.addView(stop,new LinearLayout.LayoutParams(0,dp(29),1));
        Button erase=button("Limpar",10);
        erase.setContentDescription("Apagar as etapas deste perfil; "+
            "não modifica modelos de sprites nem contas");
        erase.setOnClickListener(v->sequenceEdited(PgsSequenceStore.clear(context)));
        LinearLayout.LayoutParams ep=new LinearLayout.LayoutParams(0,dp(29),1);
        ep.leftMargin=dp(3);bottom.addView(erase,ep);
        Button back=button("← Buscar",10);
        back.setOnClickListener(v->showSearch());
        LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(0,dp(29),1);
        bp.leftMargin=dp(3);bottom.addView(back,bp);
        root.addView(bottom,margined(-1,dp(29),3));
        mount(root,240,338);
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
    void showSequenceStep(int index){
        List<PgsSequencePolicy.Step> steps=PgsSequenceStore.load(context);
        if(index<0||index>=steps.size()){showSequence();return;}
        PgsSequencePolicy.Step step=steps.get(index);
        LinearLayout root=panelRoot("PASSO "+(index+1),step.title());
        TextView detail=label("Ajuste a etapa sem alterar os outros pontos. "+
            "Cada alteração interrompe uma execução ativa.",10,false);
        detail.setMaxLines(2);root.addView(detail,margined(-1,dp(40),2));
        if(step.type==PgsSequencePolicy.Type.TAP||
           step.type==PgsSequencePolicy.Type.SWIPE){
            Button point=button("◎ Posicionar origem",10);
            point.setOnClickListener(v->{dismissAll();
                actions.sequencePick("EDIT",index,false);});
            root.addView(point,margined(-1,dp(31),3));
            if(step.type==PgsSequencePolicy.Type.SWIPE){
                Button dest=button("➚ Posicionar destino",10);
                dest.setOnClickListener(v->{dismissAll();
                    actions.sequencePick("EDIT",index,true);});
                root.addView(dest,margined(-1,dp(31),3));
            }
        }else if(step.type==PgsSequencePolicy.Type.SPRITE){
            Button select=button("◎ Alterar sprite salva",10);
            select.setOnClickListener(v->showSequenceSprites(index));
            root.addView(select,margined(-1,dp(30),3));
        }
        if(step.type==PgsSequencePolicy.Type.TAP||
           step.type==PgsSequencePolicy.Type.SWIPE){
            Button length=button("Duração do gesto: "+step.gestureMs+" ms ▾",10);
            int[] options=step.type==PgsSequencePolicy.Type.TAP?
                new int[]{90,150,220}:new int[]{200,350,500,800,1200,1800};
            length.setOnClickListener(v->{
                int next=0;
                for(int i=0;i<options.length;i++)
                    if(options[i]==step.gestureMs){next=(i+1)%options.length;break;}
                sequenceEdited(PgsSequenceStore.changeGesture(
                    context,index,options[next]));
            });
            root.addView(length,margined(-1,dp(31),3));
        }
        Button wait=button((step.type==PgsSequencePolicy.Type.WAIT?
            "Aguardar: ":"Depois da etapa: ")+step.waitMs+" ms ▾",10);
        wait.setOnClickListener(v->{
            int[] options=step.type==PgsSequencePolicy.Type.WAIT?
                new int[]{500,1000,2000,5000,10000,30000}:
                new int[]{0,300,600,1000,2000,5000,10000};
            int next=0;
            for(int i=0;i<options.length;i++)
                if(options[i]==step.waitMs){next=(i+1)%options.length;break;}
            sequenceEdited(PgsSequenceStore.changeWait(
                context,index,options[next]));
        });
        root.addView(wait,margined(-1,dp(31),3));
        LinearLayout controls=horizontal();
        Button copy=button("▣ Copiar passo",10);
        copy.setOnClickListener(v->{
            if(PgsSequenceStore.copy(context,index)){
                Toast.makeText(context,"Etapa copiada neste perfil. "+
                    "Use Colar para duplicar.",Toast.LENGTH_SHORT).show();
                showSequence();
            }
        });
        controls.addView(copy,new LinearLayout.LayoutParams(0,dp(31),1));
        Button back=button("← Sequência",10);
        back.setOnClickListener(v->showSequence());
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,dp(31),1);
        p.leftMargin=dp(3);controls.addView(back,p);
        root.addView(controls,margined(-1,dp(31),5));
        mount(root,238,285);
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
