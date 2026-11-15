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
        void modelsChanged();
        void appearanceChanged();
        void previewTapIndicator();
        void choosePoint(String mode);
        void selectSprites();
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
        for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.list(context))
            if(PgsAutoCatalog.findNumber(context,model.name)==p.number)result.add(model);
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
        ImageButton delete=trashButton("Excluir esta imagem cadastrada");
        LinearLayout.LayoutParams trashParams=margined(dp(39),dp(37),5);
        trashParams.gravity=Gravity.CENTER_HORIZONTAL;
        root.addView(delete,trashParams);
        delete.setOnClickListener(v->{
            // O usuário tocou explicitamente na imagem e solicitou exclusão.
            PgsAutoTemplateStore.delete(context,model.id);
            actions.modelsChanged();
            showSearch();
        });
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
            TextView name=label("Imagem cadastrada",11,false);
            line.addView(name,new LinearLayout.LayoutParams(0,dp(35),1));
            ImageButton remove=trashButton("Excluir esta imagem");
            line.addView(remove,new LinearLayout.LayoutParams(dp(30),dp(35)));
            remove.setOnClickListener(v->showModelActions(pokemon,model));
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

    void showSearch(){
        LinearLayout root=panelRoot("⌕ BUSCAS",PgsAutoCatalog.selected(context).size()+"/10");
        String currentMode=context.getSharedPreferences("pgs_auto_target_v1",Context.MODE_PRIVATE)
            .getString("mode","SPRITE");
        Button target=button("◎ Alvo: "+currentMode.replace("SPRITE","Sprites")
            .replace("POKESTOP","PokéStop").replace("POINT","Ponto específico")
            .replace("ENCOUNTER","Encontro")+"  ▾",11);
        target.setOnClickListener(v->showTargets());
        root.addView(target,margined(-1,dp(32),4));
        TextView title=(TextView)((LinearLayout)root.getChildAt(0)).getChildAt(1);
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
        root.addView(scroll,margined(-1,dp(168),4));
        // A busca fica no rodapé, abaixo dos modelos, sem botão Limpar Seleção.
        root.addView(input,margined(-1,dp(33),4));
        final Runnable[] render={null};
        render[0]=()->{
            rows.removeAllViews();
            title.setText(PgsAutoCatalog.selected(context).size()+"/10");
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
                TextView label=label((priority>=0?(priority+1)+". ":"")+pokemon.name,11,true);
                label.setSingleLine(true);label.setEllipsize(android.text.TextUtils.TruncateAt.END);
                line.addView(label,new LinearLayout.LayoutParams(0,dp(38),1f));
                if(selected){
                    List<PgsAutoTemplateStore.Model> models=imagesFor(pokemon);
                    for(int i=0;i<Math.min(2,models.size());i++){
                        final PgsAutoTemplateStore.Model model=models.get(i);
                        ImageView thumb=new ImageView(context);
                        try{
                            thumb.setImageBitmap(PgsAutoTemplateStore.decode(context,model));
                        }catch(Exception ignored){}
                        thumb.setScaleType(ImageView.ScaleType.FIT_CENTER);
                        thumb.setBackground(bg(0x66313C4B,0x33FFFFFF,4));
                        thumb.setContentDescription("Imagem monitorada de "+pokemon.name+
                            ". Toque para excluir ou selecionar outra.");
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
        mount(root,240,290);
    }
    /** Alvos explícitos, separados da busca por sprites do feed PGSharp. */
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
        CheckBox vibrate=new CheckBox(context);
        vibrate.setText("Vibrar Shiny");
        vibrate.setTextSize(10);vibrate.setTextColor(fg());
        vibrate.setButtonTintList(android.content.res.ColorStateList.valueOf(fg()));
        vibrate.setChecked(prefs.getBoolean("shinyVibrate",true));
        vibrate.setOnCheckedChangeListener((view,on)->
            prefs.edit().putBoolean("shinyVibrate",on).apply());
        root.addView(vibrate,new LinearLayout.LayoutParams(-1,dp(31)));
        mount(root,138,218);
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
