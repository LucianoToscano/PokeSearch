package com.lucianotoscano.pokesearchoverlay;

/**
 * Ampliação fiel de pixel art de 128 para 512 pixels (Scale2x em dois passos).
 * Apenas reutiliza cores/alfas da arte original: não inventa detalhes.
 * Os pixels das extremidades e a transparência são preservados.
 * Não redimensiona nem move o Edu dentro da célula.
 */
final class EduPixelArtUpscale {
    private EduPixelArtUpscale(){}

    static int[] scale4x(int[] argb,int width,int height){
        if(argb==null||width!=128||height!=128||argb.length!=width*height)
            throw new IllegalArgumentException("Edu: esperado frame RGBA 128x128");
        int[] twice=scale2x(argb,width,height);
        return scale2x(twice,width*2,height*2);
    }

    private static int[] scale2x(int[] src,int width,int height){
        int outWidth=width*2;
        int[] out=new int[outWidth*height*2];
        for(int y=0;y<height;y++){
            int row=y*width;
            int up=(y>0?y-1:y)*width;
            int down=(y<height-1?y+1:y)*width;
            for(int x=0;x<width;x++){
                int c=src[row+x];
                int n=src[up+x];
                int s=src[down+x];
                int w=src[row+(x>0?x-1:x)];
                int e=src[row+(x<width-1?x+1:x)];
                int a=c,b=c,d=c,f=c;
                if(n!=s && w!=e){
                    if(w==n)a=w;
                    if(n==e)b=e;
                    if(w==s)d=w;
                    if(s==e)f=e;
                }
                int pos=(y*2)*outWidth+(x*2);
                out[pos]=a;
                out[pos+1]=b;
                out[pos+outWidth]=d;
                out[pos+outWidth+1]=f;
            }
        }
        return out;
    }
}
