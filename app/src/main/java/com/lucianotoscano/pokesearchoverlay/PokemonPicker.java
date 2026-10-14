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
import android.widget.ListView;
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
        }catch(Exception ignored){}
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
            }catch(Exception ignored){}finally{
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
            visible.clear();
            Set<String> selected=WatchAlerts.watched(activity);
            if(selectedOnly){
                for(Entry e:full)if(selected.contains(e.normalized))visible.add(e);
            }else{
                // Results are distinct from favorites, so you can always
                // see WHAT IS ALREADY SELECTED above the search suggestions.
                for(Entry e:full){
                    if(selected.contains(e.normalized))continue;
                    if(key.isEmpty()||e.normalized.startsWith(key)||
                       String.valueOf(e.id).startsWith(key)){
                        visible.add(e);
                        if(visible.size()>=80)break;
                    }
                }
                if(!key.isEmpty()&&visible.size()<80){
                    for(Entry e:full){
                        if(selected.contains(e.normalized)||visible.contains(e))continue;
                        if(e.normalized.contains(key))visible.add(e);
                        if(visible.size()>=80)break;
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
                row.setPadding(dp(activity,10),dp(activity,5),dp(activity,10),dp(activity,5));
                holder.picture=new ImageView(activity);
                holder.picture.setScaleType(ImageView.ScaleType.FIT_CENTER);
                row.addView(holder.picture,new LinearLayout.LayoutParams(dp(activity,43),dp(activity,43)));
                holder.dex=new TextView(activity);
                holder.dex.setTextColor(Color.rgb(153,161,177));holder.dex.setTextSize(12);
                holder.dex.setPadding(dp(activity,9),0,dp(activity,9),0);
                row.addView(holder.dex);
                holder.name=new TextView(activity);
                holder.name.setTextColor(Color.WHITE);holder.name.setTextSize(15);
                row.addView(holder.name,new LinearLayout.LayoutParams(0,-2,1));
                holder.checked=new TextView(activity);
                holder.checked.setTextColor(Color.rgb(255,214,116));
                holder.checked.setTextSize(18);holder.checked.setTypeface(null,Typeface.BOLD);
                holder.checked.setGravity(Gravity.CENTER);
                row.addView(holder.checked,new LinearLayout.LayoutParams(dp(activity,26),dp(activity,43)));
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
        LinearLayout root=new LinearLayout(activity);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(activity,13),dp(activity,10),dp(activity,13),dp(activity,12));

        LinearLayout header=new LinearLayout(activity);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView title=new TextView(activity);
        title.setText("★  Favoritos");
        title.setTextColor(Color.rgb(244,247,250));
        title.setTypeface(null,Typeface.BOLD);
        title.setTextSize(17);
        header.addView(title,new LinearLayout.LayoutParams(0,dp(activity,43),1));
        TextView finish=new TextView(activity);
        finish.setText("Concluir");
        finish.setGravity(Gravity.CENTER);
        finish.setTextColor(Color.rgb(169,239,219));
        finish.setTextSize(14);
        finish.setTypeface(null,Typeface.BOLD);
        android.graphics.drawable.GradientDrawable finishBg=new android.graphics.drawable.GradientDrawable();
        finishBg.setColor(Color.argb(200,28,69,62));
        finishBg.setCornerRadius(dp(activity,9));
        finish.setBackground(finishBg);
        header.addView(finish,new LinearLayout.LayoutParams(dp(activity,87),dp(activity,34)));
        root.addView(header);

        TextView selectedTitle=new TextView(activity);
        selectedTitle.setTextColor(Color.rgb(255,211,118));
        selectedTitle.setTypeface(null,Typeface.BOLD);
        selectedTitle.setTextSize(14);
        selectedTitle.setPadding(dp(activity,3),dp(activity,3),0,dp(activity,6));
        root.addView(selectedTitle);

        TextView selectedEmpty=new TextView(activity);
        selectedEmpty.setText("Nenhum favorito escolhido. Pesquise e toque numa estrela ☆ abaixo.");
        selectedEmpty.setTextColor(Color.rgb(156,167,183));
        selectedEmpty.setTextSize(12);
        selectedEmpty.setPadding(dp(activity,6),dp(activity,4),0,dp(activity,12));
        root.addView(selectedEmpty);

        // Separate, clearly labeled list: selected Pokémon stay here
        // even when the user types a different species into the search.
        ListView selectedList=new ListView(activity);
        selectedList.setDividerHeight(0);
        selectedList.setCacheColorHint(Color.TRANSPARENT);
        root.addView(selectedList,new LinearLayout.LayoutParams(-1,0));
        Adapter selectedAdapter=new Adapter(activity,all,true);
        selectedList.setAdapter(selectedAdapter);

        View divider=new View(activity);
        divider.setBackgroundColor(Color.rgb(55,61,73));
        LinearLayout.LayoutParams dividerParams=new LinearLayout.LayoutParams(-1,dp(activity,1));
        dividerParams.setMargins(0,dp(activity,4),0,dp(activity,12));
        root.addView(divider,dividerParams);

        TextView searchTitle=new TextView(activity);
        searchTitle.setText("Adicionar Pokémon");
        searchTitle.setTextColor(Color.WHITE);
        searchTitle.setTextSize(14);
        searchTitle.setTypeface(null,Typeface.BOLD);
        searchTitle.setPadding(dp(activity,3),0,0,dp(activity,3));
        root.addView(searchTitle);

        EditText search=new EditText(activity);
        search.setSingleLine(true);
        search.setTextColor(Color.WHITE);
        search.setHintTextColor(Color.rgb(146,154,168));
        search.setHint("Nome ou número da Pokédex");
        search.setTextSize(14);
        root.addView(search,new LinearLayout.LayoutParams(-1,dp(activity,49)));

        ListView results=new ListView(activity);
        results.setDividerHeight(0);
        results.setCacheColorHint(Color.TRANSPARENT);
        root.addView(results,new LinearLayout.LayoutParams(-1,dp(activity,243)));
        Adapter suggestions=new Adapter(activity,all,false);
        results.setAdapter(suggestions);

        android.widget.CheckBox sound=new android.widget.CheckBox(activity);
        sound.setText("Alertar com som ao encontrar um favorito válido");
        sound.setTextColor(Color.WHITE);
        sound.setTextSize(12);
        sound.setChecked(WatchAlerts.enabled(activity));
        sound.setOnCheckedChangeListener((button,enabled)->
            activity.getSharedPreferences("prefs",0).edit()
                .putBoolean(WatchAlerts.PREF_ENABLED,enabled).apply());
        root.addView(sound);

        TextView note=new TextView(activity);
        note.setText("Somente IV100, Grande Liga #1 ou Ultra Liga #1, no filtro ativo.");
        note.setTextColor(Color.rgb(161,171,184));
        note.setTextSize(11);
        note.setPadding(dp(activity,4),0,0,dp(activity,4));
        root.addView(note);

        Runnable refresh=()->{
            int total=WatchAlerts.watched(activity).size();
            selectedTitle.setText("Selecionados ("+total+"/50)");
            selectedAdapter.filter("");
            int listHeight=dp(activity,Math.min(total,3)*52);
            LinearLayout.LayoutParams lp=(LinearLayout.LayoutParams)selectedList.getLayoutParams();
            lp.height=listHeight;
            selectedList.setLayoutParams(lp);
            selectedEmpty.setVisibility(total==0?View.VISIBLE:View.GONE);
            selectedList.setVisibility(total>0?View.VISIBLE:View.GONE);
            suggestions.filter(search.getText().toString());
            if(changed!=null)changed.run();
        };
        search.addTextChangedListener(new TextWatcher(){
            @Override public void beforeTextChanged(CharSequence txt,int start,int count,int after){}
            @Override public void onTextChanged(CharSequence txt,int start,int before,int count){
                suggestions.filter(txt.toString());
            }
            @Override public void afterTextChanged(Editable txt){}
        });
        selectedList.setOnItemClickListener((parent,view,index,id)->{
            Entry e=(Entry)selectedAdapter.getItem(index);
            WatchAlerts.toggle(activity,e.name);
            refresh.run();
        });
        results.setOnItemClickListener((parent,view,index,id)->{
            Entry e=(Entry)suggestions.getItem(index);
            boolean added=WatchAlerts.toggle(activity,e.name);
            if(!added)Toast.makeText(activity,"Limite de 50 favoritos atingido",Toast.LENGTH_SHORT).show();
            refresh.run();
        });
        refresh.run();
        // Single translucent charcoal panel: no duplicate platform title,
        // no separate grey footer, and Concluir belongs inside the panel.
        android.graphics.drawable.GradientDrawable background=new android.graphics.drawable.GradientDrawable();
        background.setColor(Color.argb(232,47,54,64));
        background.setCornerRadius(dp(activity,17));
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
            window.setDimAmount(0.08f);
            if(android.os.Build.VERSION.SDK_INT>=31){
                window.addFlags(android.view.WindowManager.LayoutParams.FLAG_BLUR_BEHIND);
                android.view.WindowManager.LayoutParams params=window.getAttributes();
                params.setBlurBehindRadius(dp(activity,20));
                window.setAttributes(params);
            }
            int screen=activity.getResources().getDisplayMetrics().widthPixels;
            window.setLayout(Math.min(screen-dp(activity,16),dp(activity,430)),
                android.view.WindowManager.LayoutParams.WRAP_CONTENT);
        }
    }
}
