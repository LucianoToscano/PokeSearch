package com.lucianotoscano.pokesearchoverlay;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Conservative, offline evidence classifier. Requires the item-found banner,
 * the Rare Candy name, and a rainbow-like sprite in its top-left region.
 * No screenshots, detected text, or coordinates are persisted or transmitted.
 */
final class CandyPickupEvidence {
    private CandyPickupEvidence(){}

    static String normalize(String text){
        if(text==null)return "";
        String ascii=Normalizer.normalize(text,Normalizer.Form.NFD)
            .replaceAll("\\p{M}+","").toUpperCase(Locale.ROOT);
        return ascii.replaceAll("[^A-Z0-9]+"," ").trim().replaceAll(" +"," ");
    }

    static boolean titleMatches(String text){
        String normalized=normalize(text);
        // Do not treat the item picker, an inventory card, or a Pokémon
        // encounter with a candy sprite as a successful collection.
        return normalized.contains("ITEM ENCONTRADO")&&
            normalized.contains("DOCE RARO");
    }

    /** Sampled RGB colors. Input is ONLY the cropped upper screen strip. */
    static boolean hasCandyRainbow(int[] argb,int width,int height){
        if(argb==null||width<100||height<40||argb.length<width*height)return false;
        int fromX=Math.max(0,width*4/100),toX=Math.min(width,width*46/100);
        // Item banner is at the very top. Ignore the rest of the 27% screen
        // crop: map objects below the banner could skew stripe order.
        int fromY=Math.max(0,height*4/100),toY=Math.min(height,height*40/100);
        int bins=6;
        for(int bin=0;bin<bins;bin++){
            int left=fromX+(toX-fromX)*bin/bins;
            int right=fromX+(toX-fromX)*(bin+1)/bins;
            int red=0,yellow=0,green=0;
            long redY=0,yellowY=0,greenY=0;
            for(int y=fromY;y<toY;y+=3){
                for(int x=left;x<right;x+=3){
                    int color=argb[y*width+x];
                    int r=(color>>16)&255,g=(color>>8)&255,b=color&255;
                    int mx=Math.max(r,Math.max(g,b));
                    int mn=Math.min(r,Math.min(g,b));
                    if(mx<110||mx-mn<55)continue;
                    if(r>145&&r>g*1.38&&r>b*1.12){red++;redY+=y;}
                    else if(r>145&&g>95&&r>b*1.55&&g>b*1.40){
                        yellow++;yellowY+=y;
                    }else if(g>105&&g>r*1.26&&g>b*1.07){
                        green++;greenY+=y;
                    }
                }
            }
            if(red>=4&&yellow>=4&&green>=3&&
                redY/red<yellowY/yellow&&yellowY/yellow<greenY/green)
                return true;
        }
        return false;
    }

    /** Two independent sightings required, with 350ms separation and <=3s. */
    static final class TwoFrameGate {
        private long firstMs=-1, lastHitMs=-1;
        private boolean emitted=false;
        boolean observe(boolean match,long nowMs){
            if(!match){
                if(lastHitMs>=0&&nowMs-lastHitMs>1600)reset();
                return false;
            }
            if(emitted)return false;
            if(firstMs<0||nowMs<firstMs||nowMs-firstMs>3000){
                firstMs=nowMs;lastHitMs=nowMs;return false;
            }
            lastHitMs=nowMs;
            if(nowMs-firstMs<350)return false;
            emitted=true;return true;
        }
        void reset(){firstMs=-1;lastHitMs=-1;emitted=false;}
    }
}
