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
    // All visible tiles waiting for the same Pokémon share one verified fetch.
    // The old LOADING gate updated only the first ImageView, leaving the other
    // tiles permanently stuck on a placeholder when the same dex appeared twice.
    private static final java.util.Map<Integer,java.util.List<WeakReference<ImageView>>> WAITING=
        new java.util.HashMap<>();
    private static Bitmap fetchVerifiedSprite(Context context,int id){
        // App-private bounded cache persists across picker sessions. File names
        // are dex numbers only; costumes/forms never use this base-sprite cache.
        java.io.File disk=new java.io.File(context.getCacheDir(),"verified-base-sprites-v1");
        java.io.File cachedFile=new java.io.File(disk,id+".png");
        if(cachedFile.isFile()&&cachedFile.length()>8&&cachedFile.length()<=256*1024){
            Bitmap local=BitmapFactory.decodeFile(cachedFile.getAbsolutePath());
            if(local!=null){cachedFile.setLastModified(System.currentTimeMillis());return local;}
            cachedFile.delete();
        }

        final String path="/PokeAPI/sprites/master/sprites/pokemon/"+id+".png";
        final String[] origins={
            "https://raw.githubusercontent.com"+path,
            "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/"+id+".png"
        };
        for(String url:origins){
            HttpURLConnection connection=null;
            try{
                connection=(HttpURLConnection)new URL(url).openConnection();
                connection.setConnectTimeout(4500);
                connection.setReadTimeout(4500);
                connection.setInstanceFollowRedirects(false);
                if(connection.getResponseCode()!=200)continue;
                String mime=connection.getContentType();
                if(mime!=null&&!mime.toLowerCase(java.util.Locale.ROOT).startsWith("image/png"))continue;
                int size=connection.getContentLength();
                if(size>256*1024)continue;
                try(InputStream in=connection.getInputStream()){
                    // Bound PNG memory and avoid decoding arbitrary server bodies.
                    ByteArrayOutputStream output=new ByteArrayOutputStream();
                    byte[] buffer=new byte[4096];int n;
                    while((n=in.read(buffer))!=-1){
                        if(output.size()+n>256*1024){output.reset();break;}
                        output.write(buffer,0,n);
                    }
                    byte[] png=output.toByteArray();
                    if(png.length>=8&&png[0]==(byte)0x89&&png[1]=='P'&&png[2]=='N'&&png[3]=='G')
                        {
                            Bitmap picture=BitmapFactory.decodeByteArray(png,0,png.length);
                            if(picture!=null&&(disk.isDirectory()||disk.mkdirs())){
                                java.io.File temporary=new java.io.File(disk,id+".tmp");
                                try(java.io.FileOutputStream stream=new java.io.FileOutputStream(temporary)){
                                    stream.write(png);
                                    stream.flush();
                                    if(!temporary.renameTo(cachedFile))temporary.delete();
                                    java.io.File[] files=disk.listFiles();
                                    if(files!=null&&files.length>80){
                                        java.util.Arrays.sort(files,(a,b)->Long.compare(a.lastModified(),b.lastModified()));
                                        for(int i=0;i<files.length-64;i++)files[i].delete();
                                    }
                                }catch(java.io.IOException ignored){temporary.delete();}
                            }
                            return picture;
                        }
                }
            }catch(Exception ignored){
                // CDN or network unavailable: keep the neutral placeholder.
            }finally{if(connection!=null)connection.disconnect();}
        }
        return null;
    }
    private static void setImage(Context activity,ImageView image,int id){
        image.setTag(id);
        Bitmap cached;
        synchronized(CACHE){cached=CACHE.get(id);}
        if(cached!=null){image.setImageBitmap(cached);return;}
        image.setImageResource(android.R.drawable.ic_menu_gallery);
        boolean start;
        synchronized(LOADING){
            java.util.List<WeakReference<ImageView>> waiting=WAITING.get(id);
            if(waiting==null){waiting=new ArrayList<>();WAITING.put(id,waiting);}
            waiting.add(new WeakReference<>(image));
            start=LOADING.add(id);
        }
        if(!start)return;
        IMAGE_POOL.execute(()->{
            Bitmap bitmap=fetchVerifiedSprite(activity.getApplicationContext(),id);
            if(bitmap!=null){synchronized(CACHE){CACHE.put(id,bitmap);}}
            java.util.List<WeakReference<ImageView>> waiting;
            synchronized(LOADING){
                LOADING.remove(id);
                waiting=WAITING.remove(id);
            }
            final Bitmap picture=bitmap;
            new android.os.Handler(android.os.Looper.getMainLooper()).post(()->{
                if(picture==null||waiting==null)return;
                for(WeakReference<ImageView> weak:waiting){
                    ImageView target=weak.get();
                    if(target!=null&&target.getTag() instanceof Integer&&(int)target.getTag()==id)
                        target.setImageBitmap(picture);
                }
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
        show(activity,changed,dismissed,-1,-1);
    }
    /** Native icon anchor is in physical screen pixels; negative means legacy centering. */
    public static Dialog show(Context activity,Runnable changed,Runnable dismissed,
                            int anchorX,int anchorY){
        List<Entry> all=readCatalog(activity);
        if(all.isEmpty()){
            Toast.makeText(activity,"Catálogo de Pokémon indisponível",Toast.LENGTH_LONG).show();
            return null;
        }

        // Match the exact same visual preference used by WebView menus.
        // Saved custom transparency wins; new installs default to 50%.
        int transparency=50,blurRadius=4;
        boolean lightMenu=false;
        try{
            org.json.JSONObject prefs=new org.json.JSONObject(activity
                .getSharedPreferences("prefs",0).getString("visualPrefsJson","{}"));
            transparency=Math.max(0,Math.min(100,prefs.optInt("menuTransparency",50)));
            blurRadius=Math.max(0,Math.min(16,prefs.optInt("menuBlur",4)));
            lightMenu="light".equals(prefs.optString("menuBgMode","dark"));
        }catch(org.json.JSONException ignored){}
        final int panelAlpha=Math.round(255*(1-transparency/100f));
        final int panelColor=lightMenu?Color.argb(panelAlpha,255,255,255):
            Color.argb(panelAlpha,15,19,26);
        final int panelFg=lightMenu?Color.rgb(21,34,49):Color.rgb(242,247,252);

        // LT62: Show every saved favorite together, at most 10 per row and
        // five rows (50). Search below sprites, no horizontal paging/swiping.
        // No ListView, ScrollView or hidden off-screen controls.
        LinearLayout root=new LinearLayout(activity);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(activity,10),dp(activity,6),dp(activity,10),dp(activity,9));

        // LT66: independently center the count in the entire row rather
        // than the remaining width after the variable-length title.
        FrameLayout header=new FrameLayout(activity);
        header.setMinimumHeight(dp(activity,29));
        TextView title=new TextView(activity);
        title.setText("☆ FAVORITOS");
        title.setOnClickListener(v->Toast.makeText(activity,
            "★ Toque: usar • Segure: salvar ou excluir perfil",
            Toast.LENGTH_LONG).show());
        title.setTextColor(panelFg);
        title.setTypeface(null,Typeface.BOLD);
        title.setTextSize(11);
        title.setGravity(Gravity.CENTER_VERTICAL|Gravity.START);
        title.setSingleLine(true);
        title.setMaxWidth(dp(activity,99));
        FrameLayout.LayoutParams titleLp=new FrameLayout.LayoutParams(
            -2,dp(activity,29),Gravity.START|Gravity.CENTER_VERTICAL);
        header.addView(title,titleLp);
        TextView count=new TextView(activity);
        count.setTextColor(panelFg);
        count.setTextSize(10);
        count.setTypeface(null,Typeface.BOLD);
        count.setGravity(Gravity.CENTER);
        count.setSingleLine(true);
        FrameLayout.LayoutParams countLp=new FrameLayout.LayoutParams(
            -2,dp(activity,29),Gravity.CENTER);
        header.addView(count,countLp);
        TextView finish=new TextView(activity);
        finish.setText("×");
        finish.setContentDescription("Fechar Favoritos");
        finish.setGravity(Gravity.CENTER);
        finish.setTextColor(panelFg);
        finish.setTextSize(19);
        finish.setBackgroundColor(Color.TRANSPARENT);
        FrameLayout.LayoutParams finishLp=new FrameLayout.LayoutParams(
            dp(activity,27),dp(activity,29),Gravity.END|Gravity.CENTER_VERTICAL);
        header.addView(finish,finishLp);
        // The tiny icon sits between the title and "Selecionados 0/50".
        // It reveals three opt-in favorite profiles without growing the panel
        // until explicitly tapped.
        LinearLayout favoriteProfiles=new LinearLayout(activity);
        favoriteProfiles.setGravity(Gravity.CENTER_VERTICAL|Gravity.CENTER_HORIZONTAL);
        favoriteProfiles.setOrientation(LinearLayout.HORIZONTAL);
        favoriteProfiles.setVisibility(View.VISIBLE);
        // LT88: 3 unobtrusive saved-profile stars BETWEEN counter and X.
        // Never create a second tall profile row or obstruct the sprites.
        FrameLayout.LayoutParams profilesLp=new FrameLayout.LayoutParams(
            dp(activity,75),dp(activity,29),Gravity.END|Gravity.CENTER_VERTICAL);
        profilesLp.rightMargin=dp(activity,29);
        header.addView(favoriteProfiles,profilesLp);
        root.addView(header);

        EditText search=new EditText(activity);
        search.setSingleLine(true);
        search.setTextColor(panelFg);
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

        // Avoid an extra "Digite" text row: the search field already has its hint.
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
        final TextView[] favoriteTabs=new TextView[3];
        final Runnable refreshProfileStars=()->{
            SharedPreferences prefs=activity.getSharedPreferences("prefs",0);
            int active=prefs.getInt("favoritePresetActiveV1",0);
            for(int slot=1;slot<=3;slot++){
                TextView star=favoriteTabs[slot-1];
                if(star==null)continue;
                boolean stored=prefs.contains("favoritePresetV1_"+slot);
                boolean selected=stored&&active==slot;
                star.setText(selected?"★":"☆");
                star.setTextColor(selected?Color.rgb(255,212,104):Color.rgb(146,154,169));
                star.setContentDescription("Perfil "+slot+
                    (selected?" ativo":stored?" salvo, inativo":" vazio")+
                    ". Toque para usar; segure para salvar ou excluir");
            }
        };
        // Only the active one is lit, even when all three are saved.
        // An empty saved profile is valid; current favorite list is untouched
        // until a conscious slot tap. No notifications or tones are reset.
        for(int slot=1;slot<=3;slot++){
            final int profile=slot;
            final String key="favoritePresetV1_"+profile;
            TextView tab=new TextView(activity);
            boolean stored=activity.getSharedPreferences("prefs",0).contains(key);
            tab.setText(stored&&activity.getSharedPreferences("prefs",0)
                .getInt("favoritePresetActiveV1",0)==profile?"★":"☆");
            tab.setTextSize(17);tab.setTypeface(null,Typeface.BOLD);
            tab.setGravity(Gravity.CENTER);
            tab.setTextColor(stored&&activity.getSharedPreferences("prefs",0)
                .getInt("favoritePresetActiveV1",0)==profile?
                Color.rgb(255,212,104):Color.rgb(146,154,169));
            tab.setContentDescription("Favoritos perfil "+profile+
                (stored?": salvo; toque para usar, segure para sobrescrever":": vazio; segure para salvar"));
            tab.setBackgroundColor(Color.TRANSPARENT);
            LinearLayout.LayoutParams tabLp=new LinearLayout.LayoutParams(
                dp(activity,23),dp(activity,27));
            tabLp.setMargins(dp(activity,1),0,dp(activity,1),0);
            favoriteProfiles.addView(tab,tabLp);
            favoriteTabs[profile-1]=tab;
            tab.setOnLongClickListener(v->{
                // PopupMenu attaches to the already visible overlay Dialog;
                // no new full-screen Android window or empty spacer.
                android.widget.PopupMenu actions=new android.widget.PopupMenu(activity,tab);
                actions.getMenu().add("Salvar favoritos atuais no perfil "+profile);
                if(activity.getSharedPreferences("prefs",0).contains(key))
                    actions.getMenu().add("Excluir perfil "+profile);
                actions.setOnMenuItemClickListener(item->{
                    SharedPreferences p=activity.getSharedPreferences("prefs",0);
                    if(item.getTitle().toString().startsWith("Excluir")){
                        SharedPreferences.Editor editor=p.edit().remove(key);
                        if(p.getInt("favoritePresetActiveV1",0)==profile)
                            editor.putInt("favoritePresetActiveV1",0);
                        editor.apply();
                        Toast.makeText(activity,"Perfil "+profile+" excluído",Toast.LENGTH_SHORT).show();
                    }else{
                        String current=WatchAlerts.canonicalList(p.getString(WatchAlerts.PREF_LIST,""));
                        p.edit().putString(key,current)
                            .putInt("favoritePresetActiveV1",profile).apply();
                        Toast.makeText(activity,"✓ Favoritos salvos no perfil "+profile,
                            Toast.LENGTH_SHORT).show();
                    }
                    refreshProfileStars.run();
                    return true;
                });
                actions.show();
                return true;
            });
            tab.setOnClickListener(v->{
                SharedPreferences p=activity.getSharedPreferences("prefs",0);
                if(!p.contains(key)){
                    Toast.makeText(activity,"Segure "+profile+" para salvar os favoritos",
                        Toast.LENGTH_SHORT).show();return;
                }
                String saved=WatchAlerts.canonicalList(p.getString(key,""));
                p.edit().putString(WatchAlerts.PREF_LIST,saved)
                    .putInt("favoritePresetActiveV1",profile).apply();
                refresh[0].run();
                refreshProfileStars.run();
                Toast.makeText(activity,"✓ Favoritos do perfil "+profile+" carregados",
                    Toast.LENGTH_SHORT).show();
            });
        }
        refreshProfileStars.run();
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
            count.setText("Selecionados "+size+"/50");
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
        background.setColors(new int[]{panelColor,panelColor});
        background.setOrientation(android.graphics.drawable.GradientDrawable.Orientation.TL_BR);
        background.setStroke(dp(activity,1),lightMenu?
            Color.argb(105,49,69,91):Color.argb(109,170,183,202));
        background.setCornerRadius(dp(activity,12));
        root.setBackground(background);
        Context context=(activity instanceof Activity)?activity:
            new android.view.ContextThemeWrapper(activity,android.R.style.Theme_Material_NoActionBar);
        Dialog dialog=new Dialog(context,android.R.style.Theme_Material_NoActionBar);
        dialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
        dialog.setContentView(root);
        dialog.setCanceledOnTouchOutside(false);
        finish.setOnClickListener(v->dialog.dismiss());
        if(!(activity instanceof Activity)&&dialog.getWindow()!=null)
            dialog.getWindow().setType(android.view.WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY);
        dialog.setOnDismissListener(d->{if(dismissed!=null)dismissed.run();});
        dialog.show();
        if(dialog.getWindow()!=null){
            android.view.Window window=dialog.getWindow();
            window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));
            window.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
            // A floating picker must not swallow taps OUTSIDE its own bounds.
            // FLAG_NOT_TOUCH_MODAL passes external taps to the app underneath,
            // unlike the former modal Dialog; internal tiles remain clickable.
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL);
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_DIM_BEHIND |
                android.view.WindowManager.LayoutParams.FLAG_BLUR_BEHIND);
            window.setDimAmount(0.0f);
            // Optional blur is restricted to this nonmodal dialog bounds; on
            // Android versions without cross-window blur support we retain
            // the same translucent background without changing overlay flags.
            if(android.os.Build.VERSION.SDK_INT>=31){
                try{window.setBackgroundBlurRadius(dp(activity,blurRadius));}
                catch(RuntimeException ignored){}
            }
            int screen=activity.getResources().getDisplayMetrics().widthPixels;
            int preferredWidth=Math.min(screen-dp(activity,22),dp(activity,348));
            window.setLayout(preferredWidth,
                android.view.WindowManager.LayoutParams.WRAP_CONTENT);
            if(anchorX>=0&&anchorY>=0){
                // Align the picker to the tapped Favorites icon, not screen center.
                // Keep the native touch rectangle content-sized. Other overlays
                // remain responsive via FLAG_NOT_TOUCH_MODAL.
                window.getDecorView().post(()->{
                    if(!window.getDecorView().isAttachedToWindow())return;
                    int displayH=activity.getResources().getDisplayMetrics().heightPixels;
                    int actualHeight=window.getDecorView().getHeight();
                    if(actualHeight<=0)return;
                    int margin=dp(activity,8),gap=dp(activity,2),iconHalf=dp(activity,12);
                    int left=Math.max(margin,Math.min(screen-margin-preferredWidth,
                        anchorX-preferredWidth/2));
                    // anchorY is the tapped star's CENTER. Start just outside
                    // its bounds; the former 18dp center-gap pushed Favorites down.
                    int below=anchorY+iconHalf+gap;
                    int above=anchorY-iconHalf-actualHeight-gap;
                    int spaceBelow=Math.max(0,displayH-margin-below);
                    int spaceAbove=Math.max(0,anchorY-iconHalf-gap-margin);
                    // Prefer the side with enough space, otherwise choose
                    // whichever side leaves the least amount obstructed.
                    boolean placeBelow=spaceBelow>=actualHeight||
                        (spaceAbove<actualHeight&&spaceBelow>=spaceAbove);
                    int top=placeBelow?below:Math.max(margin,above);
                    top=Math.max(margin,Math.min(displayH-margin-actualHeight,top));
                    android.view.WindowManager.LayoutParams lp=window.getAttributes();
                    lp.gravity=Gravity.TOP|Gravity.LEFT;
                    lp.x=left;lp.y=top;
                    window.setAttributes(lp);
                });
            }
        }
        return dialog;
    }
}
