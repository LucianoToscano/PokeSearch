package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import java.io.IOException;
import java.io.InputStream;

/** LT309 — atlas offline das 62 sprites do Edu; o atlas LT304 permanece fallback. */
public final class EduSpriteAtlas {
    public static final int CELL=256, COLS=8, COUNT=62;
    public static final String ASSET="edu_avatar_atlas_62.png";
    public static final int[] SIZES_PX={50,75,100};

    private final Bitmap atlas;
    private final BitmapDrawable[] cache=new BitmapDrawable[COUNT];
    private final Context app;

    private EduSpriteAtlas(Context context, Bitmap image){
        app=context.getApplicationContext();
        atlas=image;
    }
    public static EduSpriteAtlas load(Context context) throws IOException {
        try(InputStream input=context.getAssets().open(ASSET)){
            BitmapFactory.Options options=new BitmapFactory.Options();
            options.inScaled=false;
            Bitmap image=BitmapFactory.decodeStream(input,null,options);
            if(image==null || image.getWidth()!=COLS*CELL ||
                image.getHeight()!=COLS*CELL){
                if(image!=null)image.recycle();
                throw new IOException("Edu: atlas invalido (esperado 2048x2048)");
            }
            return new EduSpriteAtlas(context,image);
        }
    }
    public Drawable frame(int index){
        int i=index>=0&&index<COUNT?index:indexForState("parado");
        if(cache[i]==null){
            Bitmap crop=Bitmap.createBitmap(atlas,(i%COLS)*CELL,
                (i/COLS)*CELL,CELL,CELL);
            BitmapDrawable drawable=new BitmapDrawable(app.getResources(),crop);
            drawable.setFilterBitmap(false);
            drawable.setAntiAlias(false);
            cache[i]=drawable;
        }
        return cache[i];
    }
    public Drawable state(String state){return frame(indexForState(state));}
    public static int indexForState(String name){
        if(name==null)return 42;
        switch(name){
            case "parado": case "apresentacao": return 42;
            case "perguntando": return 44;
            case "alerta": return 4;
            case "confirmando": case "vitoria_informada": return 23;
            case "passe_gratuito": return 43;
            case "guardar_passe_vespera": return 50;
            case "conferir_passes": return 22;
            case "sem_passe_disponivel": return 49;
            case "passe_extra_confirmado": return 39;
            case "falha_relato": return 61;
            case "softban_aviso": return 51;
            case "esperando_carregamento_1": return 29;
            case "esperando_carregamento_2": return 30;
            case "esperando_carregamento_3": return 31;
            case "esperando_batalha_reide": return 28;
            case "iniciar_reide": return 20;
            case "reide_perdida": return 46;
            case "reide_abandonada": return 48;
            case "captura_informada": return 21;
            case "pokemon_fugiu": return 45;
            case "fechar_reabrir_jogo": return 19;
            case "repetir_ciclo": return 47;
            case "evento_nao_comecou": return 38;
            case "evento_comecou": return 37;
            case "evento_encerrou": return 36;
            case "ir_local_evento_escolhido": return 40;
            case "resumo_concluido": return 41;
            case "arrastado_final": return 18;
            default: return 42;
        }
    }
    public static int[] sequence(String name){
        if(name==null)return new int[0];
        switch(name){
            case "caminhada_frente": return new int[]{5,6,7,8};
            case "caminhada_direita": return new int[]{24,25,26,27};
            case "caminhada_esquerda": return new int[]{32,33,34,35};
            case "arrastando": return new int[]{9,10,11,12,13,14,15,16,17,18};
            case "teleporte_efeito": return new int[]{52,53,54,55,56,57,58,59,60};
            case "pokebola_gesto": return new int[]{0,1,2,3};
            default: return new int[0];
        }
    }
    public static int durationMs(String name){
        if(name==null)return 180;
        switch(name){
            case "caminhada_frente":
            case "caminhada_direita":
            case "caminhada_esquerda": return 165;
            case "arrastando": return 185;
            case "teleporte_efeito": return 170;
            case "pokebola_gesto": return 220;
            default: return 180;
        }
    }
    public static boolean isLooping(String name){
        return "caminhada_frente".equals(name) ||
            "caminhada_direita".equals(name) ||
            "caminhada_esquerda".equals(name);
    }
    public void release(){
        for(int i=0;i<cache.length;i++){
            if(cache[i]!=null){
                Bitmap b=cache[i].getBitmap();
                if(b!=atlas&&!b.isRecycled())b.recycle();
                cache[i]=null;
            }
        }
        if(atlas!=null&&!atlas.isRecycled())atlas.recycle();
    }
}