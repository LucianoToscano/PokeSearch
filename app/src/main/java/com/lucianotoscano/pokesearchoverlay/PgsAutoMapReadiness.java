package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Bitmap;
import android.graphics.Color;

/**
 * Sinais visuais de objetos carregados no MAPA (não da espécie):
 * variação local, bordas, marcadores azul/ciano e ginásios rosa/roxo.
 * As condições são aproximadas, para uso junto de estabilidade temporal.
 */
final class PgsAutoMapReadiness {
    static final class Evidence {
        final boolean scenePopulated;
        final float detail,magenta,blueEdges;
        final int activeTiles;
        Evidence(boolean ready,float edges,float pink,float blue,int tiles){
            scenePopulated=ready;detail=edges;magenta=pink;
            blueEdges=blue;activeTiles=tiles;
        }
    }
    private PgsAutoMapReadiness(){}
    static Evidence analyze(Bitmap bitmap){
        int width=bitmap.getWidth(),height=bitmap.getHeight();
        int dx=Math.max(2,width/245), step=Math.max(3,width/125);
        // Exclui a maior parte do radar e dos botões do jogo.
        int x0=Math.round(width*.20f),x1=Math.round(width*.84f);
        int y0=Math.round(height*.15f),y1=Math.round(height*.80f);
        int[] tileEdge=new int[36],tileCyan=new int[36],tilePink=new int[36];
        int[] tileSamples=new int[36];
        int n=0,edges=0,pinks=0,cyans=0;
        for(int y=y0;y<y1;y+=step){
            for(int x=x0;x+dx<x1;x+=step){
                int c=bitmap.getPixel(x,y),d=bitmap.getPixel(x+dx,y);
                int r=Color.red(c),g=Color.green(c),b=Color.blue(c);
                boolean edge=Math.abs(r-Color.red(d))+
                    Math.abs(g-Color.green(d))+Math.abs(b-Color.blue(d))>63;
                boolean pink=r>94&&b>76&&r>g*1.25f&&b>g*1.15f;
                boolean cyan=g>105&&b>115&&b>r*1.4f&&g>r*1.3f;
                int col=Math.min(5,6*(x-x0)/Math.max(1,x1-x0));
                int row=Math.min(5,6*(y-y0)/Math.max(1,y1-y0));
                int index=row*6+col;
                tileSamples[index]++;
                if(edge){edges++;tileEdge[index]++;}
                if(pink){pinks++;tilePink[index]++;}
                if(cyan&&edge){cyans++;tileCyan[index]++;}
                n++;
            }
        }
        if(n==0)return new Evidence(false,0,0,0,0);
        int active=0;
        for(int i=0;i<tileSamples.length;i++){
            if(tileSamples[i]<5)continue;
            float edgeRate=tileEdge[i]/(float)tileSamples[i];
            float markerRate=(tilePink[i]+tileCyan[i])/(float)tileSamples[i];
            if((edgeRate>.13f&&markerRate>.006f)||edgeRate>.28f)
                active++;
        }
        float texture=edges/(float)n;
        float magenta=pinks/(float)n;
        float blue=cyans/(float)n;
        // Exige indícios de objetos distribuídos em mais de uma área do mapa.
        // Mapas sem PokéStops/ginásios ou com clima diferente podem não passar.
        boolean loaded=active>=2 && (magenta>.005f||blue>.0025f||texture>.21f);
        return new Evidence(loaded,texture,magenta,blue,active);
    }
}
