package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.LruCache;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.GridLayout;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONArray;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Offline species catalog + asynchronous official community sprite thumbnails. */
public final class PokemonPicker {
    private static final ExecutorService IMAGE_POOL=Executors.newFixedThreadPool(2);
    private static final LruCache<Integer,Bitmap> CACHE=new LruCache<>(48);
    private static final Set<Integer> LOADING=new HashSet<>();
    private static List<Entry> catalog;
    private PokemonPicker(){}
    private static int dp(Context c,int value){
        return (int)(c.getResources().getDisplayMetrics().density*value+0.5f);
    }
    private static final class Entry {
        final int id;final String name;final String normalized;
        Entry(int id,String name){this.id=id;this.name=name;this.normalized=WatchAlerts.normalized(name);}
    }
    private static List<Entry> readCatalog(Context activity){
        if(catalog!=null)return catalog;
        ArrayList<Entry> list=new ArrayList<>();
        try(InputStream in=activity.getAssets().open("pokemon_catalog.json")){
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            byte[] bytes=new byte[4096];int n;
            while((n=in.read(bytes))!=-1)out.write(bytes,0,n);
            JSONArray all=new JSONArray(out.toString("UTF-8"));
            for(int i=0;i<all.length();i++){
                JSONArray item=all.getJSONArray(i);
                int id=item.getInt(0);String name=item.getString(1);
                if(id>0&&!name.trim().isEmpty())list.add(new Entry(id,name));
            }
        }catch(Exception e){
            BugReport.log(activity,"ASSET","ler catálogo Pokémon · "+e.getClass().getSimpleName());
        }
        catalog=list;return catalog;
    }
    private static final class Holder {
        ImageView picture;
        TextView dex,name,checked;
    }
    private static void setImage(Context activity,ImageView image,int id){
        image.setTag(id);
        Bitmap cached;
        synchronized(CACHE){cached=CACHE.get(id);}
        if(cached!=null){image.setImageBitmap(cached);return;}
        image.setImageResource(android.R.drawable.ic_menu_gallery);
        synchronized(LOADING){if(!LOADING.add(id))return;}
        WeakReference<ImageView> reference=new WeakReference<>(image);
        IMAGE_POOL.execute(()->{
            Bitmap bitmap=null;HttpURLConnection connection=null;
            try{
                URL url=new URL("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+id+".png");
                connection=(HttpURLConnection)url.openConnection();
                connection.setConnectTimeout(4500);connection.setReadTimeout(4500);
                try(InputStream in=connection.getInputStream()){bitmap=BitmapFactory.decodeStream(in);}
            }catch(java.io.IOException ignored){
                // Expected CDN/network failures are routine; avoid log flooding.
            }catch(Exception e){
                BugReport.log(activity,"SPRITE","falha inesperada · "+e.getClass().getSimpleName());
            }finally{
                if(connection!=null)connection.disconnect();
            }
            synchronized(LOADING){LOADING.remove(id);}
            if(bitmap!=null){synchronized(CACHE){CACHE.put(id,bitmap);}}
            final Bitmap finalBitmap=bitmap;
            image.post(()->{
                ImageView view=reference.get();
                if(view!=null && finalBitmap!=null && view.getTag() instanceof Integer && (int)view.getTag()==id)
                    view.setImageBitmap(finalBitmap);
            });
        });
    }
    private static final class Adapter extends BaseAdapter{
        private final Context activity;
        private final List<Entry> full;
        private final List<Entry> visible=new ArrayList<>();
        private final boolean selectedOnly;
        Adapter(Context activity,List<Entry> full,boolean selectedOnly){
            this.activity=activity;this.full=full;this.selectedOnly=selectedOnly;
            filter("");
        }
        void filter(String term){
            String key=WatchAlerts.normalized(term);
            // Dex text accepts #004, 004 or 4 without guessing other species.
            String dexInput=term==null?"":term.trim().replaceFirst("^#","").trim();
            boolean dexSearch=dexInput.matches("[0-9]{1,4}");
            visible.clear();
            Set<String> selected=WatchAlerts.watched(activity);
            if(selectedOnly){
                for(Entry e:full)if(selected.contains(e.normalized))visible.add(e);
            }else{
                // Empty query never populates a large list. Max three visible
                // suggestions; type more characters to narrow results, no scroll.
                if(!key.isEmpty()){
                    for(Entry e:full){
                        if(selected.contains(e.normalized))continue;
                        if(e.normalized.startsWith(key)||
                           (dexSearch&&(String.valueOf(e.id).startsWith(dexInput)||
                            String.format(Locale.US,"%03d",e.id).startsWith(dexInput)))){
                            visible.add(e);if(visible.size()==3)break;
                        }
                    }
                    if(visible.size()<3){
                        for(Entry e:full){
                            if(selected.contains(e.normalized)||visible.contains(e))continue;
                            if(e.normalized.contains(key)){
                                visible.add(e);if(visible.size()==3)break;
                            }
                        }
                    }
                }
            }
            notifyDataSetChanged();
        }
        @Override public int getCount(){return visible.size();}
        @Override public Object getItem(int position){return visible.get(position);}
        @Override public long getItemId(int position){return visible.get(position).id;}
        @Override public View getView(int position,View recycled,ViewGroup parent){
            Holder holder;
            if(recycled==null){
                holder=new Holder();
                LinearLayout row=new LinearLayout(activity);
                row.setGravity(Gravity.CENTER_VERTICAL);
                row.setOrientation(LinearLayout.HORIZONTAL);
                row.setPadding(dp(activity,6),dp(activity,2),dp(activity,6),dp(activity,2));
                android.graphics.drawable.GradientDrawable rowBg=new android.graphics.drawable.GradientDrawable();
                rowBg.setColor(Color.argb(225,43,48,57));
                rowBg.setCornerRadius(dp(activity,7));
                rowBg.setStroke(dp(activity,1),Color.argb(78,190,201,215));
                row.setBackground(rowBg);
                holder.picture=new ImageView(activity);
                holder.picture.setScaleType(ImageView.ScaleType.FIT_CENTER);
                row.addView(holder.picture,new LinearLayout.LayoutParams(dp(activity,36),dp(activity,36)));
                holder.dex=new TextView(activity);
                holder.dex.setTextColor(Color.rgb(153,161,177));holder.dex.setTextSize(10);
                holder.dex.setPadding(dp(activity,9),0,dp(activity,9),0);
                row.addView(holder.dex);
                holder.name=new TextView(activity);
                holder.name.setTextColor(Color.WHITE);holder.name.setTextSize(12);
                row.addView(holder.name,new LinearLayout.LayoutParams(0,-2,1));
                holder.checked=new TextView(activity);
                holder.checked.setTextColor(Color.rgb(255,214,116));
                holder.checked.setTextSize(16);holder.checked.setTypeface(null,Typeface.BOLD);
                holder.checked.setGravity(Gravity.CENTER);
                row.addView(holder.checked,new LinearLayout.LayoutParams(dp(activity,26),dp(activity,36)));
                row.setTag(holder);recycled=row;
            }else holder=(Holder)recycled.getTag();
            Entry e=visible.get(position);
            holder.dex.setText(String.format(Locale.US,"#%03d",e.id));
            holder.name.setText(e.name);
            holder.checked.setText(WatchAlerts.isWatched(activity,e.name)?"★":"☆");
            setImage(activity,holder.picture,e.id);
            return recycled;
        }
    }
    public static void show(Context activity,Runnable changed){
        show(activity,changed,null);
    }
    /** Works from MainActivity and directly from OverlayService without changing apps. */
    public static void show(Context activity,Runnable changed,Runnable dismissed){
        List<Entry> all=readCatalog(activity);
        if(all.isEmpty()){
            Toast.makeText(activity,"Catálogo de Pokémon indisponível",Toast.LENGTH_LONG).show();
            return;
        }

        // LT62: Show every saved favorite together, at most 10 per row and
        // five rows (50). Search below sprites, no horizontal paging/swiping.
        // No ListView, ScrollView or hidden off-screen controls.
        LinearLayout root=new LinearLayout(activity);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(activity,10),dp(activity,8),dp(activity,10),dp(activity,9));

        LinearLayout header=new LinearLayout(activity);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView title=new TextView(activity);
        title.setText("☆  FAVORITOS");
        title.setTextColor(Color.rgb(244,247,250));
        title.setTypeface(null,Typeface.BOLD);
        title.setTextSize(13);
        header.addView(title,new LinearLayout.LayoutParams(0,dp(activity,30),1));
        TextView finish=new TextView(activity);
        finish.setText("×");
        finish.setContentDescription("Fechar Favoritos");
        finish.setGravity(Gravity.CENTER);
        finish.setTextColor(Color.rgb(231,237,246));
        finish.setTextSize(21);
        android.graphics.drawable.GradientDrawable closeBg=new android.graphics.drawable.GradientDrawable();
        closeBg.setColor(Color.argb(110,53,60,72));
        closeBg.setStroke(dp(activity,1),Color.argb(95,170,185,205));
        closeBg.setCornerRadius(dp(activity,7));
        finish.setBackground(closeBg);
        header.addView(finish,new LinearLayout.LayoutParams(dp(activity,29),dp(activity,29)));
        root.addView(header);

        EditText search=new EditText(activity);
        search.setSingleLine(true);
        search.setTextColor(Color.WHITE);
        search.setHintTextColor(Color.rgb(157,170,187));
        search.setHint("Nome, forma ou nº da Pokédex");
        search.setTextSize(12);
        search.setPadding(dp(activity,8),0,dp(activity,8),0);
        search.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH);
        android.graphics.drawable.GradientDrawable inputBg=new android.graphics.drawable.GradientDrawable();
        inputBg.setColor(Color.argb(92,16,23,33));
        inputBg.setStroke(dp(activity,1),Color.argb(100,161,176,194));
        inputBg.setCornerRadius(dp(activity,7));
        search.setBackground(inputBg);
        LinearLayout.LayoutParams searchParams=new LinearLayout.LayoutParams(-1,dp(activity,37));
        searchParams.setMargins(0,dp(activity,5),0,dp(activity,6));
        LinearLayout counter=new LinearLayout(activity);
        counter.setGravity(Gravity.CENTER_VERTICAL);
        TextView count=new TextView(activity);
        count.setTextColor(Color.rgb(197,213,230));
        count.setTextSize(10);
        count.setTypeface(null,Typeface.BOLD);
        counter.addView(count,new LinearLayout.LayoutParams(0,dp(activity,22),1));
        root.addView(counter);

        LinearLayout selectedRow=new LinearLayout(activity);
        selectedRow.setGravity(Gravity.CENTER);
        GridLayout sprites=new GridLayout(activity);
        sprites.setColumnCount(10);
        sprites.setRowCount(5);
        // Fit 10 sprites even in a narrow 320dp Android window; outer tile
        // width includes 1dp margins on both sides.
        int screenDp=(int)(activity.getResources().getDisplayMetrics().widthPixels/
            activity.getResources().getDisplayMetrics().density);
        final int tileOuterDp=Math.max(23,Math.min(32,(Math.min(screenDp-22,348)-22)/10));
        LinearLayout centeredSprites=new LinearLayout(activity);
        centeredSprites.setGravity(Gravity.CENTER);
        centeredSprites.addView(sprites,new LinearLayout.LayoutParams(-2,-2));
        selectedRow.addView(centeredSprites,new LinearLayout.LayoutParams(-1,-2));
        root.addView(selectedRow);

        TextView empty=new TextView(activity);
        empty.setText("Digite para adicionar ☆");
        empty.setTextColor(Color.rgb(156,173,190));
        empty.setTextSize(10);
        empty.setPadding(dp(activity,4),dp(activity,3),0,dp(activity,4));
        root.addView(empty);
        // Search and three native suggestions are BELOW the five sprite rows.
        root.addView(search,searchParams);

        // Suggestions are capped, unscrollable views. Search is empty by default.
        LinearLayout results=new LinearLayout(activity);
        results.setOrientation(LinearLayout.VERTICAL);
        root.addView(results);
        Adapter suggestions=new Adapter(activity,all,false);
        TextView noResults=new TextView(activity);
        noResults.setText("Nenhum Pokémon encontrado");
        noResults.setTextColor(Color.rgb(156,173,190));
        noResults.setTextSize(11);
        noResults.setPadding(dp(activity,4),dp(activity,7),0,dp(activity,3));
        root.addView(noResults);

        final Runnable[] refresh={null};
        Runnable updateSuggestions=()->{
            String term=search.getText().toString().trim();
            results.removeAllViews();
            noResults.setVisibility(View.GONE);
            if(term.isEmpty())return;
            suggestions.filter(term);
            for(int i=0;i<suggestions.getCount();i++){
                Entry entry=(Entry)suggestions.getItem(i);
                View row=suggestions.getView(i,null,results);
                LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,dp(activity,45));
                params.setMargins(0,0,0,dp(activity,2));
                results.addView(row,params);
                row.setContentDescription("Adicionar "+entry.name+" aos favoritos");
                row.setOnClickListener(v->{
                    if(WatchAlerts.watched(activity).size()>=50){
                        Toast.makeText(activity,"Limite de 50 favoritos atingido",Toast.LENGTH_SHORT).show();
                        return;
                    }
                    WatchAlerts.toggle(activity,entry.name);
                    refresh[0].run();
                });
            }
            if(suggestions.getCount()==0)noResults.setVisibility(View.VISIBLE);
        };

        refresh[0]=()->{
            // All 50 favorites remain reachable, including legacy catalog entries.
            java.util.LinkedHashMap<String,String> chosen=WatchAlerts.names(
                activity.getSharedPreferences("prefs",0).getString(WatchAlerts.PREF_LIST,""));
            List<Entry> selected=new ArrayList<>();
            for(java.util.Map.Entry<String,String> favorite:chosen.entrySet()){
                Entry found=null;
                for(Entry item:all)if(item.normalized.equals(favorite.getKey())){found=item;break;}
                selected.add(found!=null?found:new Entry(0,favorite.getValue()));
            }
            int size=selected.size();
            count.setText("Selecionados  "+size+"/50");
            sprites.removeAllViews();
            for(int i=0;i<Math.min(size,50);i++){
                Entry entry=selected.get(i);
                FrameLayout tile=new FrameLayout(activity);
                android.graphics.drawable.GradientDrawable border=new android.graphics.drawable.GradientDrawable();
                border.setColor(Color.argb(72,52,64,77));
                border.setStroke(dp(activity,1),Color.argb(125,238,191,108));
                border.setCornerRadius(dp(activity,6));
                tile.setBackground(border);
                tile.setContentDescription("Remover "+entry.name);
                tile.setOnClickListener(v->{WatchAlerts.toggle(activity,entry.name);refresh[0].run();});
                if(entry.id>0){
                    ImageView picture=new ImageView(activity);
                    picture.setScaleType(ImageView.ScaleType.FIT_CENTER);
                    FrameLayout.LayoutParams pp=new FrameLayout.LayoutParams(-1,-1);
                    pp.setMargins(dp(activity,2),dp(activity,2),dp(activity,2),dp(activity,2));
                    tile.addView(picture,pp);
                    setImage(activity,picture,entry.id);
                }else{
                    TextView fallback=new TextView(activity);
                    fallback.setText("☆");fallback.setTextColor(Color.rgb(236,200,116));
                    fallback.setTextSize(20);fallback.setGravity(Gravity.CENTER);
                    tile.addView(fallback,new FrameLayout.LayoutParams(-1,-1));
                }
                GridLayout.LayoutParams tileParams=new GridLayout.LayoutParams(
                    GridLayout.spec(i/10),GridLayout.spec(i%10));
                tileParams.width=dp(activity,tileOuterDp-2);
                tileParams.height=dp(activity,tileOuterDp-2);
                tileParams.setMargins(dp(activity,1),dp(activity,1),dp(activity,1),dp(activity,1));
                sprites.addView(tile,tileParams);
            }
            selectedRow.setVisibility(size>0?View.VISIBLE:View.GONE);
            empty.setVisibility(size==0?View.VISIBLE:View.GONE);
            updateSuggestions.run();
            if(changed!=null)changed.run();
        };
        search.addTextChangedListener(new TextWatcher(){
            @Override public void beforeTextChanged(CharSequence text,int start,int count,int after){}
            @Override public void onTextChanged(CharSequence text,int start,int before,int count){
                updateSuggestions.run();
            }
            @Override public void afterTextChanged(Editable text){}
        });
        refresh[0].run();
        // Single translucent charcoal panel: no duplicate platform title,
        // no separate grey footer, and Concluir belongs inside the panel.
        android.graphics.drawable.GradientDrawable background=new android.graphics.drawable.GradientDrawable();
        background.setColors(new int[]{Color.argb(239,34,38,47),Color.argb(238,29,32,39)});
        background.setOrientation(android.graphics.drawable.GradientDrawable.Orientation.TL_BR);
        background.setStroke(dp(activity,1),Color.argb(109,170,183,202));
        background.setCornerRadius(dp(activity,12));
        root.setBackground(background);
        Context context=(activity instanceof Activity)?activity:
            new android.view.ContextThemeWrapper(activity,android.R.style.Theme_Material_NoActionBar);
        Dialog dialog=new Dialog(context,android.R.style.Theme_Material_NoActionBar);
        dialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
        dialog.setContentView(root);
        finish.setOnClickListener(v->dialog.dismiss());
        if(!(activity instanceof Activity)&&dialog.getWindow()!=null)
            dialog.getWindow().setType(android.view.WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY);
        dialog.setOnDismissListener(d->{if(dismissed!=null)dismissed.run();});
        dialog.show();
        if(dialog.getWindow()!=null){
            android.view.Window window=dialog.getWindow();
            window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));
            window.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            window.setDimAmount(0.0f);
            if(android.os.Build.VERSION.SDK_INT>=31){
                window.addFlags(android.view.WindowManager.LayoutParams.FLAG_BLUR_BEHIND);
                android.view.WindowManager.LayoutParams params=window.getAttributes();
                params.setBlurBehindRadius(dp(activity,12));
                window.setAttributes(params);
            }
            int screen=activity.getResources().getDisplayMetrics().widthPixels;
            window.setLayout(Math.min(screen-dp(activity,22),dp(activity,348)),
                android.view.WindowManager.LayoutParams.WRAP_CONTENT);
        }
    }
}
