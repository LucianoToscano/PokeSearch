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
import java.io.ByteArrayOutputStream;
import android.util.Base64;
import java.io.InputStream;
import android.util.LruCache;

/** LT315 — um atlas visual uniforme de 68 quadros, mantendo todos os índices e os três assets antigos como fallback. */
public final class EduSpriteAtlas {
    public static final int CELL=128, COLS=8, COUNT=62;
    public static final String ASSET="edu_avatar_atlas_62.webp";
    public static final int EXTRA_CELL=128, EXTRA_COLS=5, EXTRA_COUNT=5;
    public static final String EXTRA_ASSET="edu_avatar_extra_5.webp";
    public static final int TOTAL_COUNT=COUNT+EXTRA_COUNT;
    public static final int SHADOW_INDEX=67, COLLECTION_COUNT=TOTAL_COUNT+1;
    public static final String SHADOW_ASSET="edu_sombria_68.b64";
    public static final String UNIFORM_ASSET="edu_avatar_uniform_68.webp";
    // LT316 QA: atlas revisado opcional, sem descartar o publicado na LT315.
    public static final String CORRECTED_UNIFORM_ASSET="edu_avatar_uniform_68_lt316.b64";
    public static final int UNIFORM_COLS=8, UNIFORM_ROWS=9;
    // Atlas visual LT313: 22 poses com o MESMO personagem em células 128×128.
    // É opcional e nunca altera o índice público das 67 sprites.
    public static final String CONSISTENT_IDLE_ASSET="edu_avatar_idle_consistent_22.webp";
    public static final int IDLE_COLS=8, IDLE_ROWS=3, IDLE_COUNT=22;
    // 112/128 px correspondem à altura do Edu na pose padrão.
    // A Pokébola ou os efeitos NÃO entram nessa medida.
    public static final int IDLE_BODY_HEIGHT=112;
    // LT319: dimensões reais em pixels; M=150 é o tamanho padrão.
    // Cada célula original continua 128×128, sem deformação do pixel art.
    public static final int[] SIZES_PX={100,150,200};

    private final Bitmap atlas;
    private final Bitmap uniform;
    private final boolean correctedAtlas;
    private final Bitmap extras;
    private final Bitmap consistentIdle;
    private final Bitmap shadowSprite;
    private final BitmapDrawable[] cache=new BitmapDrawable[COLLECTION_COUNT];
    // A fonte publicada é 128px: NÃO há arte original de 512px no repo.
    // Uma versão de EXIBIÇÃO 512px é preparada por quadro sob demanda,
    // com cache limitado a 8 frames (~8 MiB), sem duplicar o atlas no APK.
    // O filtro atua no downsample 512->100/150/200, não altera a arte.
    private static final int DISPLAY_SOURCE_PX=512;
    private final LruCache<Integer,BitmapDrawable> displayCache=
        new LruCache<>(8);
    private final Context app;

    private EduSpriteAtlas(Context context, Bitmap image, Bitmap uniformImage,
                           Bitmap extrasImage, Bitmap idleImage, Bitmap shadowImage,
                           boolean corrected){
        app=context.getApplicationContext();
        atlas=image;
        uniform=uniformImage;
        correctedAtlas=corrected;
        extras=extrasImage;
        consistentIdle=idleImage;
        shadowSprite=shadowImage;
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
            // Prioridade LT315: todos os 68 quadros possuem o MESMO tamanho
            // corporal, centro da cabeça e base dos pés. Não escalar de novo.
            Bitmap unified=null;
            try(InputStream common=context.getAssets().open(UNIFORM_ASSET)){
                BitmapFactory.Options noScale=new BitmapFactory.Options();
                noScale.inScaled=false;
                unified=BitmapFactory.decodeStream(common,null,noScale);
                if(unified==null||unified.getWidth()!=UNIFORM_COLS*CELL||
                    unified.getHeight()!=UNIFORM_ROWS*CELL){
                    if(unified!=null)unified.recycle();
                    unified=null;
                }
            }catch(IOException|RuntimeException ignored){
                // Só faz fallback à coleção anterior, nunca exibe vazio.
            }
            boolean correctedUsed=false;
            // Preferir a revisão LT316; se faltar, estiver corrompida ou não
            // decodificar em 1024x1152, manter integralmente o atlas LT315.
            try(InputStream corrected=context.getAssets().open(CORRECTED_UNIFORM_ASSET)){
                ByteArrayOutputStream buffer=new ByteArrayOutputStream(320000);
                byte[] chunk=new byte[4096];
                for(int n;(n=corrected.read(chunk))!=-1;)buffer.write(chunk,0,n);
                byte[] bytes=Base64.decode(buffer.toByteArray(),Base64.DEFAULT);
                BitmapFactory.Options noScale=new BitmapFactory.Options();
                noScale.inScaled=false;
                Bitmap candidate=BitmapFactory.decodeByteArray(
                    bytes,0,bytes.length,noScale);
                if(candidate!=null&&candidate.getWidth()==UNIFORM_COLS*CELL&&
                    candidate.getHeight()==UNIFORM_ROWS*CELL){
                    if(unified!=null)unified.recycle();
                    unified=candidate;
                    correctedUsed=true;
                }else if(candidate!=null)candidate.recycle();
            }catch(IOException|RuntimeException ignored){
                // Preservar o original LT315 e os outros três fallback.
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
            Bitmap idle=null;
            try(InputStream idleInput=context.getAssets().open(CONSISTENT_IDLE_ASSET)){
                BitmapFactory.Options noScale=new BitmapFactory.Options();
                noScale.inScaled=false;
                idle=BitmapFactory.decodeStream(idleInput,null,noScale);
                if(idle==null||idle.getWidth()!=IDLE_COLS*CELL||
                    idle.getHeight()!=IDLE_ROWS*CELL){
                    if(idle!=null)idle.recycle();
                    idle=null;
                }
            }catch(IOException ignored){
                // Sem a arte nova, mantém o comportamento da LT312 sem travar.
            }
            // O asset da sprite Sombria é PNG paletizado comprimido em Base64,
            // mantendo o pacote OTA pequeno e a transparência intacta.
            Bitmap shadow=null;
            try(InputStream shadowInput=context.getAssets().open(SHADOW_ASSET)){
                ByteArrayOutputStream buffer=new ByteArrayOutputStream(6000);
                byte[] temp=new byte[1024];
                for(int n;(n=shadowInput.read(temp))!=-1;)
                    buffer.write(temp,0,n);
                byte[] raw=Base64.decode(buffer.toByteArray(),Base64.DEFAULT);
                BitmapFactory.Options noScale=new BitmapFactory.Options();
                noScale.inScaled=false;
                shadow=BitmapFactory.decodeByteArray(raw,0,raw.length,noScale);
                if(shadow==null||shadow.getWidth()!=CELL||shadow.getHeight()!=CELL){
                    if(shadow!=null)shadow.recycle();
                    shadow=null;
                }
            }catch(RuntimeException|IOException ignored){
                // Asset opcional: não bloquear o Edu nem as 67 poses anteriores.
            }
            return new EduSpriteAtlas(context,image,unified,extra,idle,shadow,
                correctedUsed);
        }
    }
    public Drawable frame(int index){
        int i=index>=0&&index<COLLECTION_COUNT?index:indexForState("parado");
        if(uniform==null&&i==SHADOW_INDEX&&shadowSprite==null)
            i=indexForState("parado");
        int consistentFrame=consistentIdleFrameIndex(i);
        if(uniform==null&&i>=COUNT&&i<TOTAL_COUNT&&extras==null&&
            (consistentIdle==null||consistentFrame<0)){
            i=indexForState("parado");
            consistentFrame=consistentIdleFrameIndex(i);
        }
        if(cache[i]==null){
            boolean uniformFrame=uniform!=null;
            boolean replacement=!uniformFrame&&consistentIdle!=null&&consistentFrame>=0;
            Bitmap source=uniformFrame?uniform:
                i==SHADOW_INDEX?shadowSprite:replacement?consistentIdle:
                i<COUNT?atlas:extras;
            int left=uniformFrame?(i%UNIFORM_COLS)*CELL:
                i==SHADOW_INDEX?0:replacement?
                (consistentFrame%IDLE_COLS)*CELL:
                i<COUNT?(i%COLS)*CELL:(i-COUNT)*EXTRA_CELL;
            int top=uniformFrame?(i/UNIFORM_COLS)*CELL:
                i==SHADOW_INDEX?0:replacement?
                (consistentFrame/IDLE_COLS)*CELL:i<COUNT?(i/COLS)*CELL:0;
            Bitmap crop=Bitmap.createBitmap(source,left,top,CELL,CELL);
            if(!uniformFrame){
                if(!replacement)crop=normalizeIdleBody(crop,i);
                crop=EduSpriteGeometry.stabilize(crop,i,replacement);
            }
            // LT316: só os cinco quadros de acessórios recebem retoque
            // adicional. Todos os demais 63 permanecem no atlas QA.
            if(uniformFrame&&correctedAtlas)
                crop=EduSpriteManualRetouch.apply(crop,i);
            // Nunca reescalar o atlas LT315, pré-alinhado em 128x128.
            BitmapDrawable drawable=new BitmapDrawable(app.getResources(),crop);
            // Pixel art: manter os contornos/olhos sem blur por interpolação.
            // A ImageView amplia o bitmap, mas o Paint não faz filtro linear.
            drawable.setFilterBitmap(false);
            drawable.setAntiAlias(false);
            drawable.setDither(false);
            cache[i]=drawable;
        }
        // Um 512px preparado a partir do quadro 128px melhora a amostragem
        // na tela de alta densidade e mantém a forma dos olhos/óculos.
        // É uma ampliação de EXIBIÇÃO, não recuperação de detalhes ausentes.
        BitmapDrawable enlarged=displayCache.get(i);
        if(enlarged!=null)return enlarged;
        try{
            Bitmap high=Bitmap.createScaledBitmap(cache[i].getBitmap(),
                DISPLAY_SOURCE_PX,DISPLAY_SOURCE_PX,false);
            high.setDensity(app.getResources().getDisplayMetrics().densityDpi);
            BitmapDrawable drawable=new BitmapDrawable(app.getResources(),high);
            // Suaviza só o redimensionamento final para P/M/G, evitando
            // serrilhado de blocos 4x sem borrar o atlas original.
            drawable.setFilterBitmap(true);
            drawable.setAntiAlias(false);
            drawable.setDither(false);
            displayCache.put(i,drawable);
            return drawable;
        }catch(OutOfMemoryError memory){
            // Em aparelhos limitados, preserva o atlas original sem crash.
            return cache[i];
        }
    }
    /** A ordem neste mapa preserva os índices LT309/LT312 e os seis movimentos.
     * Todos os quadros do atlas consistente têm corpo de 112px e pés em Y=120.
     */
    public static int consistentIdleFrameIndex(int original){
        switch(original){
            case 42: return 0; // parado
            case 0: return 1; case 1: return 2;
            case 2: return 3; case 3: return 4; // Pokébola
            case 5: return 5; case 6: return 6;
            case 7: return 7; case 8: return 8; // frente
            case 24: return 9; case 25: return 10;
            case 26: return 11; case 27: return 12; // direita
            case 32: return 13; case 33: return 14;
            case 34: return 15; case 35: return 16; // esquerda
            case 62: return 17; // shiny
            case 63: return 18; case 64: return 19; // jogando
            case 65: return 20; case 66: return 21; // armaduras
            default: return -1; // outras poses contextuais NÃO são alteradas
        }
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
    public boolean hasExtras(){return uniform!=null||extras!=null;}
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
            case "edu_sombria": case "ansioso": return SHADOW_INDEX;
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
        for(BitmapDrawable drawable:displayCache.snapshot().values()){
            Bitmap b=drawable.getBitmap();
            if(b!=null&&!b.isRecycled())b.recycle();
        }
        displayCache.evictAll();
        for(int i=0;i<cache.length;i++){
            if(cache[i]!=null){
                Bitmap b=cache[i].getBitmap();
                if(b!=atlas&&!b.isRecycled())b.recycle();
                cache[i]=null;
            }
        }
        if(atlas!=null&&!atlas.isRecycled())atlas.recycle();
        if(uniform!=null&&!uniform.isRecycled())uniform.recycle();
        if(extras!=null&&!extras.isRecycled())extras.recycle();
        if(consistentIdle!=null&&!consistentIdle.isRecycled())
            consistentIdle.recycle();
        if(shadowSprite!=null&&!shadowSprite.isRecycled())
            shadowSprite.recycle();
    }
}