package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Bitmap;
import android.graphics.Color;

/**
 * Remoção assistida do FUNDO plano conectado às bordas da miniatura 2D.
 * Opt-in com prévia; não promete recorte ML do Pokémon 3D nem altera originais.
 * Se as bordas tiverem texturas/cores diferentes, retorna null para que o
 * usuário continue com o PNG normal sem perder detalhes da sprite.
 */
final class PgsAutoSilhouette {
    private PgsAutoSilhouette(){}
    private static int median(int[] values){
        java.util.Arrays.sort(values);
        return values[values.length/2];
    }
    private static boolean near(int color,int red,int green,int blue,int tolerance){
        return Color.alpha(color)<20||
            (Math.abs(Color.red(color)-red)<=tolerance &&
             Math.abs(Color.green(color)-green)<=tolerance &&
             Math.abs(Color.blue(color)-blue)<=tolerance);
    }
    static Bitmap tryRemoveFlatBackground(Bitmap source){
        if(source==null||source.isRecycled())return null;
        int w=source.getWidth(),h=source.getHeight(),n=w*h;
        if(w<16||h<16||n>250_000)return null;
        int[] pixels=new int[n];source.getPixels(pixels,0,w,0,0,w,h);
        int[] reds=new int[12],greens=new int[12],blues=new int[12];
        int sample=0;
        for(int i=0;i<4;i++){
            int x=i==0?0:i==1?w-1:i==2?0:w-1;
            int y=i<2?0:h-1;
            int rgb=pixels[y*w+x];
            reds[sample]=Color.red(rgb);greens[sample]=Color.green(rgb);
            blues[sample++]=Color.blue(rgb);
        }
        for(int i=1;i<=2;i++){
            int x=w*i/3,y=h*i/3;
            for(int position:new int[]{pixels[x],pixels[(h-1)*w+x],
                    pixels[y*w],pixels[y*w+w-1]}){
                reds[sample]=Color.red(position);greens[sample]=Color.green(position);
                blues[sample++]=Color.blue(position);
            }
        }
        // Só segmentar bordas praticamente lisas: cenário de mapa variável
        // não é considerado um fundo uniforme.
        int r=median(reds),g=median(greens),b=median(blues);
        int consistent=0;
        for(int pos:new int[]{0,w-1,(h-1)*w,(h-1)*w+w-1}){
            if(near(pixels[pos],r,g,b,34))consistent++;
        }
        if(consistent<4)return null;
        boolean[] visited=new boolean[n];
        int[] queue=new int[n];int head=0,tail=0;
        for(int x=0;x<w;x++){
            for(int pos:new int[]{x,(h-1)*w+x}){
                if(!visited[pos]&&near(pixels[pos],r,g,b,34)){
                    visited[pos]=true;queue[tail++]=pos;
                }
            }
        }
        for(int y=0;y<h;y++){
            for(int pos:new int[]{y*w,y*w+w-1}){
                if(!visited[pos]&&near(pixels[pos],r,g,b,34)){
                    visited[pos]=true;queue[tail++]=pos;
                }
            }
        }
        while(head<tail){
            int pos=queue[head++],x=pos%w,y=pos/w;
            int[] neighbors={x>0?pos-1:-1,x+1<w?pos+1:-1,
                y>0?pos-w:-1,y+1<h?pos+w:-1};
            for(int next:neighbors){
                if(next>=0&&!visited[next]&&near(pixels[next],r,g,b,34)){
                    visited[next]=true;queue[tail++]=next;
                }
            }
        }
        int visible=n-tail;
        // Preservar detalhes se o algoritmo for incerto; nunca gravar vazio.
        if(visible<n/10||visible>n*8/10)return null;
        for(int i=0;i<n;i++)if(visited[i])pixels[i]=Color.TRANSPARENT;
        Bitmap result=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);
        result.setPixels(pixels,0,w,0,0,w,h);
        return result;
    }
}
