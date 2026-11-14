package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;

/**
 * Remove apenas o fundo escuro EXTERNO do WebP RGB fornecido pelo responsável.
 * Preserva os detalhes pretos internos (anel do ícone) e o arquivo original.
 * Limpeza em memória, uma vez por processo: não reamostra nem reduz resolução.
 */
final class PgsHomeArtwork {
    private static Bitmap cachedOn;

    private PgsHomeArtwork(){}

    static synchronized Bitmap transparentOn(Context context){
        if(cachedOn!=null&&!cachedOn.isRecycled())return cachedOn;
        BitmapFactory.Options options=new BitmapFactory.Options();
        options.inScaled=false;
        Bitmap source=BitmapFactory.decodeResource(
            context.getResources(),R.drawable.busca_pokemon_overlay_on,options);
        if(source==null)return null;
        int width=source.getWidth(),height=source.getHeight();
        int length=width*height;
        int[] pixels=new int[length];
        source.getPixels(pixels,0,width,0,0,width,height);
        if(width<=1||height<=1){cachedOn=source;return cachedOn;}
        boolean[] outside=new boolean[length];
        int[] queue=new int[length];
        int head=0,tail=0;
        for(int x=0;x<width;x++){
            int top=x,bottom=(height-1)*width+x;
            if(isDarkBackdrop(pixels[top])&&!outside[top]){
                outside[top]=true;queue[tail++]=top;
            }
            if(isDarkBackdrop(pixels[bottom])&&!outside[bottom]){
                outside[bottom]=true;queue[tail++]=bottom;
            }
        }
        for(int y=0;y<height;y++){
            int left=y*width,right=left+width-1;
            if(isDarkBackdrop(pixels[left])&&!outside[left]){
                outside[left]=true;queue[tail++]=left;
            }
            if(isDarkBackdrop(pixels[right])&&!outside[right]){
                outside[right]=true;queue[tail++]=right;
            }
        }
        while(head<tail){
            int at=queue[head++],x=at%width,y=at/width;
            if(x>0)tail=addNeighbor(at-1,pixels,outside,queue,tail);
            if(x+1<width)tail=addNeighbor(at+1,pixels,outside,queue,tail);
            if(y>0)tail=addNeighbor(at-width,pixels,outside,queue,tail);
            if(y+1<height)tail=addNeighbor(at+width,pixels,outside,queue,tail);
        }
        for(int i=0;i<length;i++){
            if(outside[i])pixels[i]=Color.TRANSPARENT;
        }
        Bitmap clean=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
        clean.setPixels(pixels,0,width,0,0,width,height);
        if(source!=clean)source.recycle();
        cachedOn=clean;
        return cachedOn;
    }
    private static int addNeighbor(int index,int[] pixels,boolean[] outside,int[] queue,int tail){
        if(!outside[index]&&isDarkBackdrop(pixels[index])){
            outside[index]=true;queue[tail++]=index;
        }
        return tail;
    }
    private static boolean isDarkBackdrop(int pixel){
        // Só pixels escuros que têm caminho até a borda; o anel central não é apagado.
        return Color.red(pixel)<=96&&Color.green(pixel)<=96&&
            Color.blue(pixel)<=96;
    }
}
