package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Bitmap;
import android.graphics.Color;

/**
 * Remoção ASSISTIDA/EXPERIMENTAL de fundo uniforme: só remove regiões
 * conectadas às bordas, similares às quatro quinas. Nunca altera a imagem
 * original nem é utilizada sem escolha explícita e prévia do usuário.
 */
final class PgsAutoSilhouette {
    private PgsAutoSilhouette(){}
    private static int distance(int a,int b){
        return Math.abs(Color.red(a)-Color.red(b))+
            Math.abs(Color.green(a)-Color.green(b))+
            Math.abs(Color.blue(a)-Color.blue(b));
    }
    static Bitmap clean(Bitmap source){
        if(source==null||source.isRecycled())return source;
        int w=source.getWidth(),h=source.getHeight(),len=w*h;
        if(w<16||h<16||len>300000)return source;
        int[] pixels=new int[len];
        source.getPixels(pixels,0,w,0,0,w,h);
        int[] corners={pixels[0],pixels[w-1],pixels[len-w],pixels[len-1]};
        for(int i=0;i<4;i++)for(int j=i+1;j<4;j++)
            if(distance(corners[i],corners[j])>95)return source;
        int rr=0,gg=0,bb=0;
        for(int c:corners){rr+=Color.red(c);gg+=Color.green(c);bb+=Color.blue(c);}
        int bg=Color.rgb(rr/4,gg/4,bb/4);
        byte[] visited=new byte[len];
        int[] queue=new int[len];int tail=0,head=0;
        for(int x=0;x<w;x++){
            int top=x,bottom=(h-1)*w+x;
            if(distance(pixels[top],bg)<82){visited[top]=1;queue[tail++]=top;}
            if(visited[bottom]==0&&distance(pixels[bottom],bg)<82){
                visited[bottom]=1;queue[tail++]=bottom;
            }
        }
        for(int y=1;y<h-1;y++)for(int idx:new int[]{y*w,y*w+w-1})
            if(visited[idx]==0&&distance(pixels[idx],bg)<82){
                visited[idx]=1;queue[tail++]=idx;
            }
        while(head<tail){
            int at=queue[head++],x=at%w,y=at/w;
            if(x>0){int q=at-1;if(visited[q]==0&&distance(pixels[q],bg)<82){
                visited[q]=1;queue[tail++]=q;}}
            if(x<w-1){int q=at+1;if(visited[q]==0&&distance(pixels[q],bg)<82){
                visited[q]=1;queue[tail++]=q;}}
            if(y>0){int q=at-w;if(visited[q]==0&&distance(pixels[q],bg)<82){
                visited[q]=1;queue[tail++]=q;}}
            if(y<h-1){int q=at+w;if(visited[q]==0&&distance(pixels[q],bg)<82){
                visited[q]=1;queue[tail++]=q;}}
        }
        // Não apagar uma imagem inteira, nem chamar de silhueta caso não haja
        // fundo relativamente uniforme. Deixar o usuário visualizar e decidir.
        if(tail<len*.08f||tail>len*.88f)return source;
        for(int i=0;i<len;i++)if(visited[i]==1)pixels[i]=Color.TRANSPARENT;
        Bitmap output=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);
        output.setPixels(pixels,0,w,0,0,w,h);
        return output;
    }
}
