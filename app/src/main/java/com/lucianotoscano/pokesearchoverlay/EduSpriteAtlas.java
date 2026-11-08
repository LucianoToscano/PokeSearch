package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import java.io.IOException;
import java.io.InputStream;

/** LT312 — preserva as 62 sprites LT309 e carrega 5 extras opcionais sem mudar as poses anteriores. */
public final class EduSpriteAtlas {
    public static final int CELL=128, COLS=8, COUNT=62;
    public static final String ASSET="edu_avatar_atlas_62.webp";
    public static final int EXTRA_CELL=128, EXTRA_COLS=5, EXTRA_COUNT=5;
    public static final String EXTRA_ASSET="edu_avatar_extra_5.webp";
    public static final int TOTAL_COUNT=COUNT+EXTRA_COUNT;
    // 112/128 px correspondem à altura do Edu na pose padrão.
    // A Pokébola ou os efeitos NÃO entram nessa medida.
    public static final int IDLE_BODY_HEIGHT=112;
    public static final int[] SIZES_PX={50,75,100};

    private final Bitmap atlas;
    private final Bitmap extras;
    private final BitmapDrawable[] cache=new BitmapDrawable[TOTAL_COUNT];
    private final Context app;

    private EduSpriteAtlas(Context context, Bitmap image, Bitmap extrasImage){
        app=context.getApplicationContext();
        atlas=image;
        extras=extrasImage;
    }
    public static EduSpriteAtlas load(Context context) throws IOException {
        try(InputStream input=context.getAssets().open(ASSET)){
            BitmapFactory.Options options=new BitmapFactory.Options();
            options.inScaled=false;
            Bitmap image=BitmapFactory.decodeStream(input,null,options);
            if(image==null || image.getWidth()!=COLS*CELL ||
                image.getHeight()!=COLS*CELL){
                if(image!=null)image.recycle();
                throw new IOException("Edu: atlas invalido (esperado 1024x1024)");
            }
            Bitmap extra=null;
            try(InputStream supplement=context.getAssets().open(EXTRA_ASSET)){
                BitmapFactory.Options noScale=new BitmapFactory.Options();
                noScale.inScaled=false;
                extra=BitmapFactory.decodeStream(supplement,null,noScale);
                if(extra==null || extra.getWidth()!=EXTRA_COLS*EXTRA_CELL ||
                    extra.getHeight()!=EXTRA_CELL){
                    if(extra!=null)extra.recycle();
                    extra=null; // coleção anterior continua funcionando
                }
            }catch(IOException ignored){
                // Atualização conservadora: falta do atlas adicional não elimina as 62 originais.
            }
            return new EduSpriteAtlas(context,image,extra);
        }
    }
    public Drawable frame(int index){
        int i=index>=0&&index<TOTAL_COUNT?index:indexForState("parado");
        if(i>=COUNT && extras==null)i=indexForState("parado");
        if(cache[i]==null){
            Bitmap source=i<COUNT?atlas:extras;
            int left=i<COUNT?(i%COLS)*CELL:(i-COUNT)*EXTRA_CELL;
            int top=i<COUNT?(i/COLS)*CELL:0;
            Bitmap crop=Bitmap.createBitmap(source,left,top,CELL,CELL);
            crop=normalizeIdleBody(crop,i);
            BitmapDrawable drawable=new BitmapDrawable(app.getResources(),crop);
            drawable.setFilterBitmap(false);
            drawable.setAntiAlias(false);
            cache[i]=drawable;
        }
        return cache[i];
    }
    /** Normaliza a altura VISÍVEL do Edu, e não a caixa do PNG.
     * Mantém os pés na mesma base e as poses em proporção constante.
     * Só aplica nas poses do ciclo ocioso, sem alterar as cenas de tutorial.
     */
    private static int idleSourceHeight(int index){
        switch(index){
            case 0: return 85;  // Pokébola na mão
            case 1: return 86;  // Pokébola subindo
            case 2: case 3: return 84; // Pokébola alta / descendo
            case 5: return 104;
            case 6: return 108;
            case 7: return 106;
            case 8: return 101;
            case 24: case 25: return 107;
            case 26: case 27: return 108;
            case 32: return 107;
            case 33: return 106;
            case 34: return 107;
            case 35: return 108;
            case 42: return IDLE_BODY_HEIGHT;
            case 62: case 63: case 64: case 65: case 66: return 110;
            default: return 0;
        }
    }
    private static int idleFeetY(int index){
        switch(index){
            case 0: case 1: case 2: case 3: return 113;
            case 24: case 25: case 34: return 119;
            case 62: case 63: case 64: case 65: case 66: return 116;
            default: return 120;
        }
    }
    private static Bitmap normalizeIdleBody(Bitmap original,int index){
        int rawHeight=idleSourceHeight(index);
        if(rawHeight<=0)return original;
        float scale=(float)IDLE_BODY_HEIGHT/rawHeight;
        Bitmap aligned=Bitmap.createBitmap(CELL,CELL,Bitmap.Config.ARGB_8888);
        Canvas canvas=new Canvas(aligned);
        Paint pixelPaint=new Paint();
        pixelPaint.setFilterBitmap(false);
        pixelPaint.setAntiAlias(false);
        pixelPaint.setDither(false);

        canvas.save();
        canvas.translate(CELL/2f-(CELL/2f)*scale,
            120f-idleFeetY(index)*scale);
        canvas.scale(scale,scale);
        if(index==2){
            // A Pokébola lançada fica acima do personagem.
            // Não permitir que ela reduza o corpo nem seja duplicada.
            canvas.clipRect(0,30,CELL,CELL);
        }
        canvas.drawBitmap(original,0,0,pixelPaint);
        canvas.restore();

        if(index==2){
            // Desenha o efeito separadamente no espaço livre da célula.
            canvas.drawBitmap(original,new Rect(30,7,61,30),
                new Rect(14,0,41,22),pixelPaint);
        }
        original.recycle();
        return aligned;
    }
    public boolean hasExtras(){return extras!=null;}
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
            // Complemento LT312: índices consecutivos preservam os 62 quadros antigos.
            case "edu_shiny": return 62;
            case "edu_jogando_01": return 63;
            case "edu_jogando_02": return 64;
            case "edu_armadura_mewtwo": return 65;
            case "edu_armadura_mewtwo_shiny": return 66;
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
            case "edu_jogando": return new int[]{63,64};
            case "edu_shiny": return new int[]{62};
            case "edu_armadura_mewtwo": return new int[]{65};
            case "edu_armadura_mewtwo_shiny": return new int[]{66};
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
            case "edu_jogando": return 300;
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
        if(extras!=null&&!extras.isRecycled())extras.recycle();
    }
}